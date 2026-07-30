const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'safetube.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database', err);
    } else {
        console.log('Connected to SQLite database.');
        
        // Create reports table
        db.run(`
            CREATE TABLE IF NOT EXISTS reports (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                video_url TEXT NOT NULL,
                video_title TEXT,
                channel_name TEXT,
                upload_date TEXT,
                view_count INTEGER,
                like_count INTEGER,
                comment_count INTEGER,
                video_duration TEXT,
                category_name TEXT,
                description TEXT,
                tags TEXT,
                thumbnail_url TEXT,
                
                thumbnail_clickbait INTEGER,
                thumbnail_misleading INTEGER,
                thumbnail_violent INTEGER,
                thumbnail_text_heavy INTEGER,
                thumbnail_adult INTEGER,
                thumbnail_graphic INTEGER,
                thumbnail_hate_symbols INTEGER,
                thumbnail_disturbing INTEGER,
                thumbnail_safety_score INTEGER,
                thumbnail_explanation TEXT,
                
                comments_analyzed INTEGER,
                toxic_percentage INTEGER,
                hate_speech INTEGER,
                harassment INTEGER,
                bullying INTEGER,
                threats INTEGER,
                profanity INTEGER,
                spam INTEGER,
                scam INTEGER,
                sexual_content INTEGER,
                violence INTEGER,
                self_harm INTEGER,
                misinformation INTEGER,
                offensive INTEGER,
                sentiment_positive INTEGER,
                sentiment_neutral INTEGER,
                sentiment_negative INTEGER,
                comment_summary TEXT,
                
                overall_safety_score INTEGER,
                risk_level TEXT,
                scan_duration_ms INTEGER,
                
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `, (err) => {
            if (err) {
                console.error('Error creating reports table', err);
            } else {
                // Ensure the scan_duration_ms column exists in case the table was already created
                db.run(`ALTER TABLE reports ADD COLUMN scan_duration_ms INTEGER`, (alterErr) => {
                    // Ignore errors (like "duplicate column name")
                    if (alterErr && !alterErr.message.includes("duplicate column name")) {
                        console.error('Error altering reports table:', alterErr);
                    }
                });
            }
        });
    }
});

module.exports = db;
