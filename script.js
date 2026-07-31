document.addEventListener('DOMContentLoaded', () => {
    // 1. Intersection Observer for Scroll Animations
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.15
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                // Unobserve after animating once
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    const animatedElements = document.querySelectorAll('.animate-on-scroll');
    animatedElements.forEach(el => observer.observe(el));


    // 2. Number Counter Animation for Statistics
    const statsObserverOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.5
    };

    let animatedStats = false;

    const animateValue = (obj, start, end, duration) => {
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            // Ease out cubic
            const easeProgress = 1 - Math.pow(1 - progress, 3);
            obj.innerHTML = Math.floor(easeProgress * (end - start) + start);
            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };
        window.requestAnimationFrame(step);
    };

    const statsObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !animatedStats) {
                animatedStats = true;
                const statValues = document.querySelectorAll('.stat-value');
                statValues.forEach(stat => {
                    const target = parseInt(stat.getAttribute('data-target'));
                    animateValue(stat, 0, target, 2000); // 2000ms duration
                });
            }
        });
    }, statsObserverOptions);

    const statsSection = document.querySelector('.statistics');
    if (statsSection) {
        statsObserver.observe(statsSection);
    }


    // 3. Navbar scroll effect
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.style.background = 'rgba(15, 23, 42, 0.6)'; // higher transparency for glass effect
            navbar.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.4)';
        } else {
            navbar.style.background = 'rgba(255, 255, 255, 0.05)'; // dark mode glass
            navbar.style.boxShadow = 'none';
        }
    });

    // 4. Welcome Popup Modal (Show instantly on page load)
    const popupOverlay = document.getElementById('safetubePopup');
    if (popupOverlay) {
        const popupCloseBtn = document.getElementById('safetubePopupClose');
        
        const closePopup = () => {
            popupOverlay.classList.remove('active');
        };

        // Show instantly (100ms delay to allow CSS transitions to trigger smoothly)
        setTimeout(() => {
            popupOverlay.classList.add('active');
        }, 100);

        popupCloseBtn.addEventListener('click', closePopup);
        
        popupOverlay.addEventListener('click', (e) => {
            if (e.target === popupOverlay) {
                closePopup();
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && popupOverlay.classList.contains('active')) {
                closePopup();
            }
        });
    }
});
