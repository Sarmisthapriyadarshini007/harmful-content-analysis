require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { google } = require('googleapis');
const { GoogleGenAI } = require('@google/genai');
const db = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

let youtube = null;
if (YOUTUBE_API_KEY && YOUTUBE_API_KEY !== 'YOUR_YOUTUBE_API_KEY') {
    youtube = google.youtube({
        version: 'v3',
        auth: YOUTUBE_API_KEY
    });
}

let ai = null;
if (GEMINI_API_KEY && GEMINI_API_KEY !== 'YOUR_GEMINI_API_KEY') {
    ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
}

function extractVideoId(url) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}

function parseDuration(duration) {
    if (!duration) return '00:00';
    const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    if (!match) return duration;
    
    const hours = (match[1] ? match[1].replace('H', '') : '0');
    const minutes = (match[2] ? match[2].replace('M', '') : '0');
    const seconds = (match[3] ? match[3].replace('S', '') : '0');
    
    if (hours !== '0') {
        return `${hours}:${minutes.padStart(2, '0')}:${seconds.padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.padStart(2, '0')}`;
}

async function fetchImageAsBase64(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) return null;
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        return {
            inlineData: {
                mimeType: response.headers.get('content-type') || 'image/jpeg',
                data: buffer.toString('base64')
            }
        };
    } catch (err) {
        console.error("Failed to download image:", err);
        return null;
    }
}

app.post('/api/analyze', async (req, res) => {
    const startTime = Date.now();
    try {
        const { url } = req.body;
        if (!url) return res.status(400).json({ error: 'YouTube URL is required' });

        const videoId = extractVideoId(url);
        if (!videoId) return res.status(400).json({ error: 'Invalid YouTube URL' });

        if (!youtube) return res.status(500).json({ error: 'YouTube API key is missing.' });
        if (!ai) return res.status(500).json({ error: 'Gemini API key is missing.' });

        // 1. Fetch Video Metadata
        console.log(`[YouTube API] Fetching metadata for video ID: ${videoId}`);
        const videoRes = await youtube.videos.list({
            part: 'snippet,statistics,contentDetails',
            id: videoId
        });
        console.log(`[YouTube API] Metadata fetched successfully.`);

        if (!videoRes.data.items || videoRes.data.items.length === 0) {
            return res.status(404).json({ error: 'Video not found' });
        }

        const video = videoRes.data.items[0];
        const snippet = video.snippet;
        const stats = video.statistics;
        const contentDetails = video.contentDetails;

        const thumbnail = snippet.thumbnails.maxres?.url || snippet.thumbnails.high?.url || snippet.thumbnails.default?.url;

        // Fetch top 30 comments (limited to 30 to prevent context token overflow for individual analysis)
        let commentsData = [];
        try {
            console.log(`[YouTube API] Fetching comments for video ID: ${videoId}`);
            const commentRes = await youtube.commentThreads.list({
                part: 'snippet',
                videoId: videoId,
                maxResults: 30,
                order: 'relevance'
            });
            console.log(`[YouTube API] Comments fetched successfully.`);
            if (commentRes.data.items) {
                commentsData = commentRes.data.items.map(item => {
                    const c = item.snippet.topLevelComment.snippet;
                    return {
                        id: item.id,
                        authorName: c.authorDisplayName,
                        authorImage: c.authorProfileImageUrl,
                        text: c.textDisplay,
                        publishedAt: c.publishedAt,
                        likeCount: c.likeCount
                    };
                });
            }
        } catch (err) {
            console.log('Comments disabled or failed to fetch:', err.message);
        }

        // Determine Gemini model dynamically
        let geminiModelName = 'gemini-3.6-flash'; // Default to newest working version
        try {
            const modelsResponse = await ai.models.list();
            const availableModels = [];
            for await (const m of modelsResponse) {
                availableModels.push(m.name.replace('models/', ''));
            }
            if (availableModels.includes('gemini-3.5-flash-lite')) {
                geminiModelName = 'gemini-3.5-flash-lite';
            } else if (availableModels.includes('gemini-2.5-flash')) {
                geminiModelName = 'gemini-2.5-flash';
            } else if (availableModels.includes('gemini-2.0-flash')) {
                geminiModelName = 'gemini-2.0-flash';
            } else {
                const fallback = availableModels.find(m => m.includes('flash') && !m.includes('tts') && !m.includes('preview') && !m.includes('3.6'));
                if (fallback) geminiModelName = fallback;
            }
        } catch (e) {
            console.error("[Gemini API] Failed to list models, using fallback", e.message);
        }
        console.log(`[Gemini API] Using model: ${geminiModelName}`);

        // 2. AI Analysis setup
        let commentAnalysisPromise = Promise.resolve({
            comments_analyzed: 0,
            toxic_percentage: 0, hate_speech: 0, harassment: 0, bullying: 0,
            threats: 0, profanity: 0, spam: 0, scam: 0, sexual_content: 0, violence: 0, self_harm: 0,
            misinformation: 0, offensive: 0, sentiment_positive: 0, sentiment_neutral: 0, sentiment_negative: 0,
            comment_summary: "No comments available for this video."
        });

        if (commentsData.length > 0) {
            // Limit to top 50 comments for speed and token limits
            const limitedComments = commentsData.slice(0, 50);
            const commentsText = limitedComments.map(c => c.text).join('\n');
            const prompt = `
            Analyze these YouTube comments for safety, toxicity, and sentiment. 
            Return ONLY a valid JSON object without markdown formatting.
            
            Comments:
            ${commentsText}
            
            Return format:
            {
                "toxic_percentage": <0-100>,
                "hate_speech": <0-100>,
                "harassment": <0-100>,
                "bullying": <0-100>,
                "threats": <0-100>,
                "profanity": <0-100>,
                "spam": <0-100>,
                "scam": <0-100>,
                "sexual_content": <0-100>,
                "violence": <0-100>,
                "self_harm": <0-100>,
                "misinformation": <0-100>,
                "offensive": <0-100>,
                "sentiment_positive": <0-100>,
                "sentiment_neutral": <0-100>,
                "sentiment_negative": <0-100>,
                "comment_summary": "<A 2-3 sentence summary of the general sentiment and behavior of the comments>"
            }
            `;
            
            commentAnalysisPromise = ai.models.generateContent({
                model: geminiModelName,
                contents: prompt,
            }).then(aiResponse => {
                let aiText = aiResponse.text.trim().replace(/```json/g, '').replace(/```/g, '').trim();
                const parsed = JSON.parse(aiText);
                return { comments_analyzed: limitedComments.length, ...parsed };
            }).catch(err => {
                console.error("[Gemini API] Comment Analysis Failed:", err.message);
                throw new Error(`Gemini Comment Analysis Failed: ${err.message}`);
            });
        }

        // 3. AI Analysis on Thumbnail
        const imagePart = await fetchImageAsBase64(thumbnail);
        if (!imagePart) {
            return res.status(500).json({ error: 'Failed to fetch YouTube video thumbnail image for analysis.' });
        }

        const thumbPromptText = `
        Analyze this YouTube video's thumbnail and metadata for safety and moderation risk.
        Title: "${snippet.title}"
        Description: "${snippet.description.substring(0, 500)}..."
        Tags: ${JSON.stringify(snippet.tags || [])}
        
        Return ONLY a valid JSON object without markdown formatting.
        Return format:
        {
            "thumbnail_clickbait": <0-100>,
            "thumbnail_misleading": <0-100>,
            "thumbnail_violent": <0-100>,
            "thumbnail_text_heavy": <0-100>,
            "thumbnail_adult": <0-100>,
            "thumbnail_graphic": <0-100>,
            "thumbnail_hate_symbols": <0-100>,
            "thumbnail_disturbing": <0-100>,
            "thumbnail_safety_score": <0-100 (where 100 is completely safe, 0 is extremely unsafe)>,
            "thumbnail_explanation": "<A short 2-3 sentence explanation of why this safety score was given based on visual and text elements>"
        }
        `;

        const thumbnailAnalysisPromise = ai.models.generateContent({
            model: geminiModelName,
            contents: [imagePart, thumbPromptText],
        }).then(aiThumbResponse => {
            let aiText = aiThumbResponse.text.trim().replace(/```json/g, '').replace(/```/g, '').trim();
            return JSON.parse(aiText);
        }).catch(err => {
            console.error("[Gemini API] Thumbnail Analysis Failed:", err.message);
            throw new Error(`Gemini Thumbnail Analysis Failed: ${err.message}`);
        });

        // Run both analyses concurrently to save time
        let commentAnalysis, thumbnailAnalysis;
        try {
            console.log(`[Gemini API] Starting concurrent analysis...`);
            [commentAnalysis, thumbnailAnalysis] = await Promise.all([
                commentAnalysisPromise,
                thumbnailAnalysisPromise
            ]);
            console.log(`[Gemini API] Analysis completed successfully.`);
        } catch (err) {
            return res.status(500).json({ error: err.message });
        }

        // 4. Calculate Overall Safety Score
        const overallScore = Math.floor(
            (thumbnailAnalysis.thumbnail_safety_score * 0.4) + 
            ((100 - commentAnalysis.toxic_percentage) * 0.6)
        );
        
        let riskLevel = "Safe";
        if (overallScore < 30) riskLevel = "Critical";
        else if (overallScore < 60) riskLevel = "High Risk";
        else if (overallScore < 80) riskLevel = "Medium Risk";
        else if (overallScore < 90) riskLevel = "Low Risk";

        // 5. Save to Database
        const scanDurationMs = Date.now() - startTime;
        const stmt = db.prepare(`
            INSERT INTO reports (
                video_url, video_title, channel_name, upload_date, view_count, like_count, comment_count,
                video_duration, category_name, description, tags, thumbnail_url,
                thumbnail_clickbait, thumbnail_misleading, thumbnail_violent, thumbnail_text_heavy,
                thumbnail_adult, thumbnail_graphic, thumbnail_hate_symbols, thumbnail_disturbing,
                thumbnail_safety_score, thumbnail_explanation,
                comments_analyzed, toxic_percentage, hate_speech, harassment, bullying, threats,
                profanity, spam, scam, sexual_content, violence, self_harm, misinformation, offensive,
                sentiment_positive, sentiment_neutral, sentiment_negative, comment_summary,
                overall_safety_score, risk_level, scan_duration_ms
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        stmt.run([
            url, snippet.title, snippet.channelTitle, snippet.publishedAt, 
            parseInt(stats.viewCount) || 0, parseInt(stats.likeCount) || 0, parseInt(stats.commentCount) || 0,
            parseDuration(contentDetails.duration), snippet.categoryId, snippet.description, 
            JSON.stringify(snippet.tags || []), thumbnail,
            
            thumbnailAnalysis.thumbnail_clickbait, thumbnailAnalysis.thumbnail_misleading,
            thumbnailAnalysis.thumbnail_violent, thumbnailAnalysis.thumbnail_text_heavy,
            thumbnailAnalysis.thumbnail_adult, thumbnailAnalysis.thumbnail_graphic,
            thumbnailAnalysis.thumbnail_hate_symbols, thumbnailAnalysis.thumbnail_disturbing,
            thumbnailAnalysis.thumbnail_safety_score, thumbnailAnalysis.thumbnail_explanation,
            
            commentAnalysis.comments_analyzed, commentAnalysis.toxic_percentage,
            commentAnalysis.hate_speech, commentAnalysis.harassment, commentAnalysis.bullying,
            commentAnalysis.threats, commentAnalysis.profanity, commentAnalysis.spam,
            commentAnalysis.scam, commentAnalysis.sexual_content, commentAnalysis.violence,
            commentAnalysis.self_harm, commentAnalysis.misinformation, commentAnalysis.offensive,
            commentAnalysis.sentiment_positive, commentAnalysis.sentiment_neutral,
            commentAnalysis.sentiment_negative, commentAnalysis.comment_summary,
            
            overallScore, riskLevel, scanDurationMs
        ], function(err) {
            if (err) {
                console.error("Error saving to DB:", err);
                return res.status(500).json({ error: 'Failed to save report' });
            }
            
            // Return complete data to frontend
            const finalPayload = {
                id: this.lastID,
                video: {
                    url,
                    title: snippet.title,
                    channel: snippet.channelTitle,
                    uploadDate: snippet.publishedAt,
                    viewCount: stats.viewCount || 0,
                    likeCount: stats.likeCount || 0,
                    commentCount: stats.commentCount || 0,
                    duration: parseDuration(contentDetails.duration),
                    category: snippet.categoryId,
                    description: snippet.description,
                    tags: snippet.tags || [],
                    thumbnail: thumbnail
                },
                thumbnailAnalysis,
                commentAnalysis,
                original_comments_data: commentsData,
                overall_safety_score: overallScore,
                risk_level: riskLevel
            };
            
            console.log(`[Final Output] Sending payload to frontend:`, JSON.stringify(finalPayload, null, 2));
            res.json(finalPayload);
        });
        stmt.finalize();

    } catch (error) {
        console.error("Analysis Error:", error);
        res.status(500).json({ error: 'An unexpected error occurred during analysis.' });
    }
});

app.get('/api/dashboard-stats', (req, res) => {
    // 1. Get overview stats
    db.get(`
        SELECT 
            COUNT(id) as total_scans,
            SUM(comments_analyzed) as total_comments,
            AVG(overall_safety_score) as avg_safety_score,
            AVG(scan_duration_ms) as avg_scan_duration,
            SUM(ROUND(comments_analyzed * toxic_percentage / 100.0)) as harmful_comments,
            SUM(ROUND(comments_analyzed * spam / 100.0)) as spam_comments,
            SUM(ROUND(comments_analyzed * hate_speech / 100.0)) as hate_speech_comments
        FROM reports
    `, (err, stats) => {
        if (err) return res.status(500).json({ error: 'Failed to fetch dashboard stats' });

        // 2. Get last scan details
        db.get(`SELECT video_title, created_at FROM reports ORDER BY created_at DESC LIMIT 1`, (err, lastScan) => {
            if (err) return res.status(500).json({ error: 'Failed to fetch last scan' });

            // 3. Get top risk videos
            db.all(`
                SELECT video_url, thumbnail_url, video_title, toxic_percentage, spam, hate_speech, overall_safety_score, risk_level 
                FROM reports 
                ORDER BY toxic_percentage DESC 
                LIMIT 5
            `, (err, topRiskVideos) => {
                if (err) return res.status(500).json({ error: 'Failed to fetch top risk videos' });

                // 4. Get recent 10 scans
                db.all(`
                    SELECT video_url, thumbnail_url, video_title, channel_name, created_at, overall_safety_score, scan_duration_ms, risk_level 
                    FROM reports 
                    ORDER BY created_at DESC 
                    LIMIT 10
                `, (err, recentScans) => {
                    if (err) return res.status(500).json({ error: 'Failed to fetch recent scans' });
                    
                    // 5. Get chart data (group by date)
                    db.all(`
                        SELECT 
                            date(created_at) as scan_date,
                            COUNT(id) as scan_count,
                            AVG(overall_safety_score) as avg_safety
                        FROM reports 
                        GROUP BY date(created_at)
                        ORDER BY scan_date ASC
                        LIMIT 14
                    `, (err, trendData) => {
                        if (err) return res.status(500).json({ error: 'Failed to fetch trend data' });
                        
                        // Calculate total sentiment
                        db.get(`
                            SELECT 
                                SUM(sentiment_positive) as total_pos,
                                SUM(sentiment_neutral) as total_neu,
                                SUM(sentiment_negative) as total_neg
                            FROM reports
                        `, (err, sentimentData) => {
                            if (err) return res.status(500).json({ error: 'Failed to fetch sentiment' });

                            res.json({
                                stats,
                                lastScan,
                                topRiskVideos,
                                recentScans,
                                trendData,
                                sentimentData
                            });
                        });
                    });
                });
            });
        });
    });
});

app.get('/api/reports', (req, res) => {
    db.all('SELECT * FROM reports ORDER BY created_at DESC', (err, rows) => {
        if (err) return res.status(500).json({ error: 'Failed to fetch reports' });
        res.json(rows);
    });
});

app.get('/api/reports/:id', (req, res) => {
    db.get('SELECT * FROM reports WHERE id = ?', [req.params.id], (err, row) => {
        if (err) return res.status(500).json({ error: 'Failed to fetch report' });
        if (!row) return res.status(404).json({ error: 'Report not found' });
        res.json(row);
    });
});

app.delete('/api/reports/:id', (req, res) => {
    db.run('DELETE FROM reports WHERE id = ?', [req.params.id], (err) => {
        if (err) return res.status(500).json({ error: 'Failed to delete report' });
        res.json({ success: true });
    });
});

app.get('/api/channel-details', async (req, res) => {
    try {
        const { channelName } = req.query;
        if (!channelName) return res.status(400).json({ error: 'Channel name is required' });
        if (!youtube) return res.status(500).json({ error: 'YouTube API key is missing' });

        // Step 1: Search for the channel by name
        const searchResponse = await youtube.search.list({
            part: 'snippet',
            q: channelName,
            type: 'channel',
            maxResults: 1
        });

        if (!searchResponse.data.items || searchResponse.data.items.length === 0) {
            return res.status(404).json({ error: 'Channel not found' });
        }

        const channelId = searchResponse.data.items[0].id.channelId;

        // Step 2: Fetch detailed channel stats
        const channelResponse = await youtube.channels.list({
            part: 'snippet,statistics',
            id: channelId
        });

        if (!channelResponse.data.items || channelResponse.data.items.length === 0) {
            return res.status(404).json({ error: 'Channel details not found' });
        }

        const channelInfo = channelResponse.data.items[0];
        res.json({
            id: channelInfo.id,
            title: channelInfo.snippet.title,
            description: channelInfo.snippet.description,
            customUrl: channelInfo.snippet.customUrl,
            publishedAt: channelInfo.snippet.publishedAt,
            thumbnailUrl: channelInfo.snippet.thumbnails.high ? channelInfo.snippet.thumbnails.high.url : (channelInfo.snippet.thumbnails.default ? channelInfo.snippet.thumbnails.default.url : ''),
            country: channelInfo.snippet.country,
            viewCount: channelInfo.statistics.viewCount,
            subscriberCount: channelInfo.statistics.subscriberCount,
            videoCount: channelInfo.statistics.videoCount
        });
    } catch (err) {
        console.error("YouTube Channel API Error:", err.message);
        res.status(500).json({ error: 'Failed to fetch channel details' });
    }
});

app.get('/api/channel-insights', (req, res) => {
    const { channelName } = req.query;
    if (!channelName) return res.status(400).json({ error: 'Channel name is required' });

    // Use LIKE to find matching reports for this channel
    db.all(`
        SELECT 
            COUNT(id) as total_scanned_videos,
            AVG(overall_safety_score) as avg_safety_score,
            AVG(toxic_percentage) as avg_toxicity,
            AVG(thumbnail_clickbait) as avg_clickbait,
            AVG(hate_speech) as avg_hate_speech
        FROM reports 
        WHERE channel_name LIKE ? COLLATE NOCASE
    `, [`%${channelName}%`], (err, row) => {
        if (err) return res.status(500).json({ error: 'Failed to fetch channel insights from DB' });
        if (!row || row.length === 0) {
            return res.json({
                total_scanned_videos: 0,
                avg_safety_score: 0,
                avg_toxicity: 0,
                avg_clickbait: 0,
                avg_hate_speech: 0
            });
        }
        res.json({
            total_scanned_videos: row[0].total_scanned_videos || 0,
            avg_safety_score: Math.round(row[0].avg_safety_score || 0),
            avg_toxicity: Math.round(row[0].avg_toxicity || 0),
            avg_clickbait: Math.round(row[0].avg_clickbait || 0),
            avg_hate_speech: Math.round(row[0].avg_hate_speech || 0)
        });
    });
});

app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
});
