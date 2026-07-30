document.addEventListener('DOMContentLoaded', () => {
    // 1. Tab Switching Logic
    const navItems = document.querySelectorAll('.settings-nav-item[data-target]');
    const sections = document.querySelectorAll('.settings-section');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            // Remove active from all nav items
            navItems.forEach(nav => nav.classList.remove('active'));
            // Add active to clicked nav item
            item.classList.add('active');

            // Hide all sections
            sections.forEach(sec => sec.classList.remove('active'));
            
            // Show targeted section
            const targetId = item.getAttribute('data-target');
            const targetSection = document.getElementById(targetId);
            if(targetSection) {
                targetSection.classList.add('active');
            }
        });
    });

    // 2. API Key Reveal
    const btnRevealApi = document.getElementById('btnRevealApi');
    const apiKeyInput = document.getElementById('apiKeyInput');
    
    if(btnRevealApi && apiKeyInput) {
        btnRevealApi.addEventListener('click', () => {
            if(apiKeyInput.type === 'password') {
                apiKeyInput.type = 'text';
                btnRevealApi.innerHTML = '<svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.29 3.29m0 0a10.05 10.05 0 015.71-1.58c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"></path></svg>'; // Eye off icon
            } else {
                apiKeyInput.type = 'password';
                btnRevealApi.innerHTML = '<svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>'; // Eye on icon
            }
        });
    }

    // 3. API Key Copy
    const btnCopyApi = document.getElementById('btnCopyApi');
    
    if(btnCopyApi && apiKeyInput) {
        btnCopyApi.addEventListener('click', () => {
            apiKeyInput.select();
            apiKeyInput.setSelectionRange(0, 99999); // For mobile devices
            
            // Try copying text
            navigator.clipboard.writeText(apiKeyInput.value).then(() => {
                const originalHtml = btnCopyApi.innerHTML;
                btnCopyApi.innerHTML = '<svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>';
                btnCopyApi.style.color = '#10B981'; // Green
                
                setTimeout(() => {
                    btnCopyApi.innerHTML = originalHtml;
                    btnCopyApi.style.color = 'var(--text-main)';
                }, 2000);
            });
        });
    }

    // 4. Basic Save Button Animation
    const saveBtns = document.querySelectorAll('.btn-save');
    saveBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const originalText = btn.innerText;
            btn.innerText = 'Saving...';
            setTimeout(() => {
                btn.innerText = 'Saved!';
                btn.style.background = '#10B981';
                setTimeout(() => {
                    btn.innerText = originalText;
                    btn.style.background = 'var(--primary)';
                }, 2000);
            }, 800);
        });
    });
});
