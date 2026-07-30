document.addEventListener('DOMContentLoaded', () => {
    // Badges
    const topBadge = document.getElementById('topBadge');
    const inboxBadge = document.getElementById('inboxBadge');

    function updateBadgeCount() {
        const unreadCount = document.querySelectorAll('.notification-card.unread').length;
        if (unreadCount > 0) {
            if(topBadge) {
                topBadge.style.display = 'block';
                topBadge.innerText = unreadCount;
            }
            if(inboxBadge) {
                inboxBadge.innerText = `${unreadCount} New`;
            }
        } else {
            if(topBadge) topBadge.style.display = 'none';
            if(inboxBadge) inboxBadge.style.display = 'none';
        }
    }

    // Individual Mark as Read
    const markReadBtns = document.querySelectorAll('.btn-mark-read');
    markReadBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const card = e.target.closest('.notification-card');
            if (card && card.classList.contains('unread')) {
                card.classList.remove('unread');
                // Remove the action button for mark as read since it's already read
                btn.remove();
                updateBadgeCount();
            }
        });
    });

    // Individual Delete
    const deleteBtns = document.querySelectorAll('.btn-delete');
    deleteBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const card = e.target.closest('.notification-card');
            if (card) {
                // Smooth remove animation
                card.style.transition = "opacity 0.3s ease, transform 0.3s ease";
                card.style.opacity = "0";
                card.style.transform = "translateX(50px)";
                setTimeout(() => {
                    card.remove();
                    updateBadgeCount();
                }, 300);
            }
        });
    });

    // Mark All as Read
    const markAllReadBtn = document.getElementById('markAllReadBtn');
    if (markAllReadBtn) {
        markAllReadBtn.addEventListener('click', () => {
            const unreadCards = document.querySelectorAll('.notification-card.unread');
            unreadCards.forEach(card => {
                card.classList.remove('unread');
                const readBtn = card.querySelector('.btn-mark-read');
                if(readBtn) readBtn.remove();
            });
            updateBadgeCount();
            markAllReadBtn.innerHTML = 'All Read';
            markAllReadBtn.style.color = 'var(--text-muted)';
            markAllReadBtn.style.borderColor = 'var(--border-color)';
        });
    }

    // Initial count
    updateBadgeCount();
});
