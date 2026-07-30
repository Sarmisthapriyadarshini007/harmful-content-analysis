document.addEventListener('DOMContentLoaded', () => {
    const analyzeBtn = document.getElementById('analyzeBtn');
    const ytUrlInput = document.getElementById('yt-url');
    const loadingState = document.getElementById('loadingState');
    const resultsState = document.getElementById('resultsState');

    if (analyzeBtn) {
        analyzeBtn.addEventListener('click', () => {
            const url = ytUrlInput.value.trim();
            
            if (!url) {
                alert('Please enter a YouTube video URL to analyze.');
                return;
            }

            analyzeBtn.disabled = true;
            analyzeBtn.style.opacity = '0.7';
            analyzeBtn.innerHTML = '<svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg> Analyzing...';
            
            loadingState.style.display = 'block';
            resultsState.style.display = 'none';

            fetch('http://localhost:3000/api/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url })
            })
            .then(res => {
                if (!res.ok) {
                    return res.json().then(err => { throw new Error(err.error || 'Failed to analyze') });
                }
                return res.json();
            })
            .then(data => {
                loadingState.style.display = 'none';
                resultsState.style.display = 'block';
                window.lastAnalysisData = data;

                function extractVideoID(u) {
                    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
                    const match = u.match(regExp);
                    return (match && match[7].length === 11) ? match[7] : false;
                }
                const videoId = extractVideoID(url);

                if (videoId) {
                    const thumbnailContainer = document.querySelector('.video-thumbnail');
                    if (thumbnailContainer) {
                        thumbnailContainer.innerHTML = `<iframe width="100%" height="100%" src="https://www.youtube.com/embed/${videoId}?autoplay=1" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"></iframe>`;
                    }
                }

                // Update UI with real data
                if (data.video) {
                    const titleEl = document.querySelector('.video-title');
                    if (titleEl) titleEl.textContent = data.video.title;

                    const channelDiv = document.querySelector('.video-channel');
                    if (channelDiv) {
                        channelDiv.innerHTML = `<svg width="20" height="20" fill="#EF4444" viewBox="0 0 24 24"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"></path></svg> ${data.video.channel}`;
                    }

                    const viewsEl = document.getElementById('stat-views');
                    if (viewsEl) viewsEl.textContent = Number(data.video.viewCount).toLocaleString();

                    const dateEl = document.getElementById('stat-date');
                    if (dateEl) {
                        const dateObj = new Date(data.video.uploadDate);
                        dateEl.textContent = dateObj.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
                    }

                    const commentsEl = document.getElementById('stat-comments');
                    if (commentsEl) commentsEl.textContent = Number(data.video.commentCount).toLocaleString();

                    const descEl = document.getElementById('video-desc');
                    if (descEl) descEl.textContent = data.video.description;
                }

                if (data.commentAnalysis && data.thumbnailAnalysis) {
                    const aiSummaryText = document.getElementById('ai-summary-text');
                    if (aiSummaryText) {
                        aiSummaryText.innerHTML = `<strong>Overall Risk Level: ${data.risk_level.toUpperCase()} (Score: ${data.overall_safety_score})</strong><br><br>
                        <strong>Thumbnail AI Reasoning:</strong> ${data.thumbnailAnalysis.thumbnail_explanation}<br><br>
                        <strong>Comment AI Summary:</strong> ${data.commentAnalysis.comment_summary}`;
                    }

                    const toxicity = data.commentAnalysis.toxic_percentage || 0;
                    const spam = data.commentAnalysis.spam || 0;
                    const hate = data.commentAnalysis.hate_speech || 0;
                    const fake = data.commentAnalysis.misinformation || data.commentAnalysis.scam || 0;

                    const updateMetric = (id, val, color) => {
                        const txt = document.getElementById(`txt-${id}`);
                        const bar = document.getElementById(`bar-${id}`);
                        if (txt) { txt.textContent = val + '%'; txt.style.color = `var(--${color})`; }
                        if (bar) { bar.style.width = val + '%'; bar.style.background = `var(--${color})`; }
                    };

                    updateMetric('toxicity', toxicity, toxicity > 20 ? 'danger' : (toxicity > 10 ? 'warning' : 'success'));
                    updateMetric('spam', spam, spam > 20 ? 'danger' : (spam > 10 ? 'warning' : 'success'));
                    updateMetric('hate', hate, hate > 10 ? 'danger' : (hate > 5 ? 'warning' : 'success'));
                    updateMetric('fake', fake, fake > 20 ? 'danger' : (fake > 10 ? 'warning' : 'success'));
                }

                // Update Overall Score Circle
                if (data.overall_safety_score !== undefined) {
                    const scoreValue = document.querySelector('.score-value');
                    const scoreLabel = document.querySelector('.score-label');
                    const scoreCircle = document.querySelector('.score-circle');
                    
                    if (scoreValue) scoreValue.innerHTML = `${data.overall_safety_score}<span style="font-size: 1.5rem;">%</span>`;
                    
                    let colorVar = '--success';
                    let label = 'Safe';
                    if (data.overall_safety_score < 30) { colorVar = '--danger'; label = 'Critical'; }
                    else if (data.overall_safety_score < 60) { colorVar = '--danger'; label = 'High Risk'; }
                    else if (data.overall_safety_score < 80) { colorVar = '--warning'; label = 'Medium Risk'; }
                    else if (data.overall_safety_score < 90) { colorVar = '--success'; label = 'Low Risk'; }
                    
                    if (scoreLabel) scoreLabel.textContent = label;
                    if (scoreValue) scoreValue.style.color = `var(${colorVar})`;
                    
                    // Update conic gradient based on score
                    if (scoreCircle) {
                        scoreCircle.style.background = `conic-gradient(var(${colorVar}) ${data.overall_safety_score}%, var(--border-color) 0)`;
                    }

                    // Update Risk Meter text mapping
                    const riskMeterLabel = document.querySelector('.metric-header span:nth-child(2)');
                    if (riskMeterLabel) {
                        riskMeterLabel.textContent = data.risk_level;
                        riskMeterLabel.style.color = `var(${colorVar})`;
                    }
                }

                analyzeBtn.disabled = false;
                analyzeBtn.style.opacity = '1';
                analyzeBtn.innerHTML = '<svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"></path></svg> Scan Another Video';
                ytUrlInput.value = '';
            })
            .catch(err => {
                console.error("Backend fetch failed:", err);
                
                loadingState.style.display = 'none';
                
                // Show actual error message instead of fallback mock data
                alert("Analysis Error: " + err.message);
                
                analyzeBtn.disabled = false;
                analyzeBtn.style.opacity = '1';
                analyzeBtn.innerHTML = '<svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"></path></svg> Start Scan';
            });
        });
    }

    const btnScanAnother = document.getElementById('btnScanAnother');
    if (btnScanAnother) {
        btnScanAnother.addEventListener('click', () => {
            // Hide results, show input area by effectively resetting the view
            if(resultsState) resultsState.style.display = 'none';
            if(ytUrlInput) {
                ytUrlInput.value = '';
                ytUrlInput.focus();
            }
            if(analyzeBtn) {
                analyzeBtn.innerHTML = '<svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"></path></svg> Start Scan';
            }
        });
    }

    const btnDownloadReport = document.getElementById('btnDownloadReport');
    if (btnDownloadReport) {
        btnDownloadReport.addEventListener('click', () => {
            if (!window.lastAnalysisData) {
                alert("No report data available to download.");
                return;
            }
            const data = window.lastAnalysisData;
            
            // Format report content
            const reportText = `
========================================
    YOUTUBE VIDEO ANALYSIS REPORT
========================================

Video Title: ${data.video?.title || 'N/A'}
Channel: ${data.video?.channel || 'N/A'}
Views: ${data.video?.viewCount || '0'}
Comments: ${data.video?.commentCount || '0'}
Upload Date: ${data.video?.uploadDate ? new Date(data.video.uploadDate).toLocaleString() : 'N/A'}

Overall Safety Score: ${data.overall_safety_score}%
Risk Level: ${(data.risk_level || 'UNKNOWN').toUpperCase()}

--- THUMBNAIL ANALYSIS ---
${data.thumbnailAnalysis?.thumbnail_explanation || 'N/A'}
Clickbait: ${data.thumbnailAnalysis?.thumbnail_clickbait || 0}%
Misleading: ${data.thumbnailAnalysis?.thumbnail_misleading || 0}%
Violence: ${data.thumbnailAnalysis?.thumbnail_violent || 0}%

--- COMMENT ANALYSIS ---
${data.commentAnalysis?.comment_summary || 'N/A'}
Toxicity: ${data.commentAnalysis?.toxic_percentage || 0}%
Spam: ${data.commentAnalysis?.spam || 0}%
Hate Speech: ${data.commentAnalysis?.hate_speech || 0}%
Fake News: ${data.commentAnalysis?.misinformation || 0}%

Report generated by VestAuth AI Platform.
========================================
`.trim();

            // Create a Blob containing the text data
            const blob = new Blob([reportText], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            
            // Create a temporary anchor element and trigger download
            const a = document.createElement('a');
            a.href = url;
            const safeTitle = (data.video?.title || 'Video_Report').substring(0, 30).replace(/[^a-zA-Z0-9]/g, '_');
            a.download = `Analysis_${safeTitle}.txt`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            // Show Toast Notification
            let toast = document.getElementById('toast-notification');
            if (!toast) {
                toast = document.createElement('div');
                toast.id = 'toast-notification';
                toast.style.position = 'fixed';
                toast.style.bottom = '20px';
                toast.style.right = '20px';
                toast.style.background = '#166534';
                toast.style.color = '#fff';
                toast.style.padding = '12px 20px';
                toast.style.borderRadius = '8px';
                toast.style.boxShadow = '0 4px 6px rgba(0,0,0,0.2)';
                toast.style.zIndex = '9999';
                toast.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                toast.style.fontFamily = 'Inter, sans-serif';
                toast.style.fontWeight = '500';
                toast.style.fontSize = '14px';
                document.body.appendChild(toast);
            }
            
            // Reset state to animate in
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(20px)';
            toast.textContent = 'Report downloaded successfully to your device!';
            
            // Trigger reflow to ensure animation works
            void toast.offsetWidth;
            
            // Animate in
            toast.style.opacity = '1';
            toast.style.transform = 'translateY(0)';
            
            // Hide after 3 seconds
            setTimeout(() => {
                toast.style.opacity = '0';
                toast.style.transform = 'translateY(20px)';
            }, 3000);
        });
    }

    // Allow pressing "Enter" in the input field to trigger the analysis
    if (ytUrlInput) {
        ytUrlInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                analyzeBtn.click();
            }
        });
    }

    // Handle URL parameters for global search
    const urlParams = new URLSearchParams(window.location.search);
    const searchUrl = urlParams.get('url');
    if (searchUrl && ytUrlInput && analyzeBtn) {
        ytUrlInput.value = searchUrl;
        // Small delay to ensure UI is ready
        setTimeout(() => {
            analyzeBtn.click();
        }, 300);
    }
});
