document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('commentScanForm');
    const urlInput = document.getElementById('youtubeUrl');
    const scanBtn = document.getElementById('scanBtn');
    const scanStatus = document.getElementById('scanStatus');
    const commentsGrid = document.getElementById('commentsGrid');
    const noDataMessage = document.getElementById('noDataMessage');
    const paginationControls = document.getElementById('paginationControls');
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    const API_URL = 'http://localhost:3000/api/comments/analyze';

    let currentNextPageToken = null;
    let currentUrl = null;
    
    // Listen for form submission
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const url = urlInput.value.trim();
            if (!url) return;
            
            // Reset state
            currentUrl = url;
            currentNextPageToken = null;
            commentsGrid.innerHTML = '';
            noDataMessage.style.display = 'none';
            paginationControls.style.display = 'none';
            
            await fetchComments(url, null);
        });
    }

    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', async () => {
            if (currentUrl && currentNextPageToken) {
                await fetchComments(currentUrl, currentNextPageToken);
            }
        });
    }

    async function fetchComments(url, pageToken) {
        scanBtn.disabled = true;
        scanStatus.style.display = 'flex';
        loadMoreBtn.disabled = true;
        
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url, pageToken })
            });

            const data = await response.json();

            if (!response.ok) {
                alert(data.error || 'Failed to analyze comments.');
                scanBtn.disabled = false;
                scanStatus.style.display = 'none';
                loadMoreBtn.disabled = false;
                if(commentsGrid.innerHTML === '') noDataMessage.style.display = 'block';
                return;
            }

            const comments = data.comments || [];
            currentNextPageToken = data.nextPageToken || null;
            
            if (comments.length === 0 && commentsGrid.innerHTML === '') {
                noDataMessage.style.display = 'block';
                noDataMessage.innerText = 'No comments found for this video.';
            } else {
                noDataMessage.style.display = 'none';
                renderComments(comments);
            }

            if (currentNextPageToken) {
                paginationControls.style.display = 'flex';
            } else {
                paginationControls.style.display = 'none';
            }

        } catch (err) {
            console.error(err);
            alert('A network error occurred.');
        } finally {
            scanBtn.disabled = false;
            scanStatus.style.display = 'none';
            loadMoreBtn.disabled = false;
        }
    }

    function renderComments(comments) {
        comments.forEach((c, index) => {
            // formatting stats
            const toxClass = getRiskClass(c.toxic_percentage);
            const spamClass = getRiskClass(c.spam);
            const hateClass = getRiskClass(c.hate);
            
            // Get Sentiment tag formatting
            let sentClass = 'tag-sent-neu';
            if (c.sentiment === 'Positive') sentClass = 'tag-sent-pos';
            if (c.sentiment === 'Negative') sentClass = 'tag-sent-neg';

            // Get Action Icon and Class
            let actionHtml = '';
            let recClass = '';
            const action = c.recommended_action || 'Approve';
            if (action.includes('Hide') || action.includes('Delete')) {
                if (action === 'Delete') {
                    recClass = 'rec-delete';
                    actionHtml = `<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg> Action: ${action}`;
                } else {
                    recClass = 'rec-hide';
                    actionHtml = `<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"></path></svg> Action: ${action}`;
                }
            } else {
                recClass = 'rec-approve';
                actionHtml = `<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg> Action: Approve`;
            }

            let timeAgo = c.published_at ? new Date(c.published_at).toLocaleString() : 'Unknown date';

            const card = document.createElement('div');
            card.className = `comment-card animate-fade-up`;
            card.innerHTML = `
                <div class="comment-header">
                    <img class="user-avatar" src="${c.author_profile_url || 'https://via.placeholder.com/40'}" alt="Avatar" style="background: none; object-fit: cover;">
                    <div class="user-info">
                        <h4>${c.author_name || 'Unknown'}</h4>
                        <span>${timeAgo}</span>
                    </div>
                </div>
                
                <div class="comment-text">
                    ${c.text || ''}
                </div>
                
                <div class="comment-tags">
                    <span class="tag tag-lang">${c.language || 'EN'}</span>
                    <span class="tag ${sentClass}">${c.sentiment || 'Neutral'}</span>
                </div>

                <div class="ai-stats">
                    <div class="stat-box ${toxClass}">
                        <div class="stat-label">Toxicity</div>
                        <div class="stat-num">${c.toxic_percentage || 0}%</div>
                    </div>
                    <div class="stat-box ${spamClass}">
                        <div class="stat-label">Spam</div>
                        <div class="stat-num">${c.spam || 0}%</div>
                    </div>
                    <div class="stat-box ${hateClass}">
                        <div class="stat-label">Hate</div>
                        <div class="stat-num">${c.hate || 0}%</div>
                    </div>
                    <div class="stat-box low-risk">
                        <div class="stat-label">Conf</div>
                        <div class="stat-num">${c.confidence || 95}%</div>
                    </div>
                </div>

                <div class="recommended-box ${recClass}">
                    ${actionHtml}
                </div>

                <div class="card-actions">
                    <button class="action-btn btn-approve">
                        <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg> Approve
                    </button>
                    <button class="action-btn btn-hide">
                        <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"></path></svg> Hide
                    </button>
                    <button class="action-btn btn-delete">
                        <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg> Delete
                    </button>
                    <button class="action-btn btn-report">
                        <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"></path></svg> Report
                    </button>
                </div>
            `;
            commentsGrid.appendChild(card);
            
            // Add interaction to buttons
            attachButtonListeners(card);
        });
    }

    function getRiskClass(value) {
        if (!value) return 'low-risk';
        if (value > 60) return 'high-risk';
        if (value > 30) return 'med-risk';
        return 'low-risk';
    }

    function attachButtonListeners(card) {
        const actionBtns = card.querySelectorAll('.action-btn');
        actionBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                if (this.classList.contains('btn-delete') || this.classList.contains('btn-hide')) {
                    card.style.opacity = '0.5';
                    card.style.transform = 'scale(0.98)';
                    setTimeout(() => {
                        card.style.display = 'none';
                    }, 300);
                } else if (this.classList.contains('btn-approve')) {
                    this.innerHTML = '<svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg> Approved';
                    this.style.background = '#DCFCE7';
                    this.style.color = '#166534';
                    this.style.borderColor = '#BBF7D0';
                } else if (this.classList.contains('btn-report')) {
                    this.innerHTML = 'Reported';
                    this.style.background = '#F3F4F6';
                }
            });
        });
    }

    // Search filter for rendered comments
    const localSearchInput = document.querySelector('.search-input:not(#youtubeUrl)');
    if (localSearchInput) {
        localSearchInput.addEventListener('input', function(e) {
            const query = e.target.value.toLowerCase();
            const cards = document.querySelectorAll('.comment-card');
            
            cards.forEach(card => {
                const text = card.querySelector('.comment-text').innerText.toLowerCase();
                const user = card.querySelector('.user-info h4').innerText.toLowerCase();
                
                if (text.includes(query) || user.includes(query)) {
                    card.style.display = 'flex';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    }
});
