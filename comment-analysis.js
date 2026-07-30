document.addEventListener('DOMContentLoaded', () => {
    // Action Buttons Interactions
    const actionBtns = document.querySelectorAll('.action-btn');
    
    actionBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const card = this.closest('.comment-card');
            
            // Simple visual feedback for the demo
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

    // Mock Search Filter
    const searchInput = document.querySelector('.search-input');
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
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

    // Pagination Click
    const pageBtns = document.querySelectorAll('.page-btn');
    pageBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            // Ignore arrows and ellipsis for this simple demo
            if (this.innerText !== '...' && !this.querySelector('svg')) {
                pageBtns.forEach(b => b.classList.remove('active'));
                this.classList.add('active');
            }
        });
    });
});
