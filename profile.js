document.addEventListener('DOMContentLoaded', () => {
    const savedName = localStorage.getItem('safetube_user_name');
    if(savedName) {
        const nameSpans = document.querySelectorAll('.profile-dropdown span');
        const avatars = document.querySelectorAll('.profile-dropdown .avatar');
        
        nameSpans.forEach(span => {
            span.innerText = savedName;
        });

        // Get Initials
        let initials = "U";
        const parts = savedName.trim().split(' ').filter(p => p.length > 0);
        if(parts.length >= 2) {
            initials = parts[0][0].toUpperCase() + parts[parts.length - 1][0].toUpperCase();
        } else if (parts.length === 1 && parts[0].length > 0) {
            initials = parts[0].substring(0, 2).toUpperCase();
        }
        
        avatars.forEach(avatar => {
            avatar.innerText = initials;
        });

        // Make Header Icons Clickable
        const notifBtn = document.querySelector('.top-actions .btn-icon');
        if (notifBtn) {
            notifBtn.style.cursor = 'pointer';
            notifBtn.addEventListener('click', () => {
                window.location.href = 'notifications.html';
            });
        }

        const profileDropdown = document.querySelector('.top-actions .profile-dropdown');
        if (profileDropdown) {
            profileDropdown.style.cursor = 'pointer';
            profileDropdown.addEventListener('click', () => {
                window.location.href = 'settings.html';
            });
        }

        // Update settings.html Public Profile fields if they exist
        const profileInput = document.getElementById('profileFullNameInput');
        if(profileInput) {
            profileInput.value = savedName;
        }

        const profileAvatarLarge = document.getElementById('profileAvatarLarge');
        if(profileAvatarLarge) {
            const textNode = Array.from(profileAvatarLarge.childNodes).find(n => n.nodeType === Node.TEXT_NODE && n.textContent.trim().length > 0);
            if (textNode) {
                textNode.textContent = initials;
            } else {
                profileAvatarLarge.innerText = initials;
            }
        }
        // Ensure no duplicates here

        const savedImage = localStorage.getItem('safetube_profile_image');
        if (savedImage) {
            avatars.forEach(avatar => {
                avatar.style.backgroundImage = `url(${savedImage})`;
                avatar.style.backgroundSize = 'cover';
                avatar.style.backgroundPosition = 'center';
                avatar.style.color = 'transparent';
            });
            if (profileAvatarLarge) {
                profileAvatarLarge.style.backgroundImage = `url(${savedImage})`;
                profileAvatarLarge.style.backgroundSize = 'cover';
                profileAvatarLarge.style.backgroundPosition = 'center';
                profileAvatarLarge.style.color = 'transparent';
            }
        } else {
            avatars.forEach(avatar => {
                avatar.style.backgroundImage = 'none';
                avatar.style.color = 'white';
            });
            if (profileAvatarLarge) {
                profileAvatarLarge.style.backgroundImage = 'linear-gradient(135deg, var(--primary), var(--accent))';
                profileAvatarLarge.style.color = 'white';
            }
        }
    }

    const savedEmail = localStorage.getItem('safetube_user_email');
    if(savedEmail) {
        const profileEmailInput = document.getElementById('profileEmailInput');
        if(profileEmailInput) {
            profileEmailInput.value = savedEmail;
        }
    }

    const savedChannel = localStorage.getItem('safetube_channel_name');
    if(savedChannel) {
        const profileChannelInput = document.getElementById('profileChannelInput');
        if(profileChannelInput) {
            profileChannelInput.value = savedChannel;
        }
        loadCreatorDashboard(savedChannel);
    }

    const saveProfileBtn = document.getElementById('saveProfileBtn');
    if (saveProfileBtn) {
        saveProfileBtn.addEventListener('click', () => {
            const nameInput = document.getElementById('profileFullNameInput');
            const emailInput = document.getElementById('profileEmailInput');
            const channelInput = document.getElementById('profileChannelInput');

            if (nameInput) localStorage.setItem('safetube_user_name', nameInput.value.trim());
            if (emailInput) localStorage.setItem('safetube_user_email', emailInput.value.trim());
            if (channelInput) {
                const newChannel = channelInput.value.trim();
                localStorage.setItem('safetube_channel_name', newChannel);
                if (newChannel) {
                    loadCreatorDashboard(newChannel);
                } else {
                    const dashboard = document.getElementById('creatorDashboardSection');
                    if (dashboard) dashboard.style.display = 'none';
                }
            }
            
            saveProfileBtn.innerText = 'Saved!';
            saveProfileBtn.style.backgroundColor = 'var(--success)';
            saveProfileBtn.style.color = 'white';
            
            setTimeout(() => {
                location.reload();
            }, 800);
        });
    }

    async function loadCreatorDashboard(channelName) {
        const dashboard = document.getElementById('creatorDashboardSection');
        if (!dashboard) return; // not on settings page

        dashboard.style.display = 'block';
        document.getElementById('cd-channel-name').innerText = 'Loading...';

        try {
            // 1. Fetch real channel stats from YouTube API
            const ytResponse = await fetch(`http://localhost:3000/api/channel-details?channelName=${encodeURIComponent(channelName)}`);
            if (ytResponse.ok) {
                const ytData = await ytResponse.json();
                document.getElementById('cd-channel-name').innerText = ytData.title || channelName;
                document.getElementById('cd-channel-id').innerText = `ID: ${ytData.id || 'N/A'}`;
                document.getElementById('cd-country').innerText = `🌍 ${ytData.country || 'N/A'}`;
                
                if (ytData.subscriberCount) {
                    document.getElementById('cd-subs').innerText = parseInt(ytData.subscriberCount).toLocaleString();
                }
                if (ytData.viewCount) {
                    document.getElementById('cd-views').innerText = parseInt(ytData.viewCount).toLocaleString();
                }
                if (ytData.videoCount) {
                    document.getElementById('cd-videos').innerText = parseInt(ytData.videoCount).toLocaleString();
                }
                if (ytData.publishedAt) {
                    const date = new Date(ytData.publishedAt);
                    document.getElementById('cd-created').innerText = date.toLocaleDateString(undefined, { year: 'numeric', month: 'short' });
                }
                if (ytData.thumbnailUrl) {
                    document.getElementById('cd-avatar').style.backgroundImage = `url('${ytData.thumbnailUrl}')`;
                }
                if (ytData.id) {
                    document.getElementById('cd-youtube-link').href = `https://youtube.com/channel/${ytData.id}`;
                }
            } else {
                document.getElementById('cd-channel-name').innerText = channelName;
            }

            // 2. Fetch AI Insights from our local DB
            const aiResponse = await fetch(`http://localhost:3000/api/channel-insights?channelName=${encodeURIComponent(channelName)}`);
            if (aiResponse.ok) {
                const aiData = await aiResponse.json();
                document.getElementById('ai-total-scanned').innerText = aiData.total_scanned_videos || 0;
                document.getElementById('ai-avg-safety').innerText = `${aiData.avg_safety_score || 0}%`;
                document.getElementById('ai-avg-toxicity').innerText = `${aiData.avg_toxicity || 0}%`;
                document.getElementById('ai-avg-hate').innerText = `${aiData.avg_hate_speech || 0}%`;
            }
        } catch (error) {
            console.error("Error loading creator dashboard:", error);
        }
    }

    // Theme and Layout Preferences
    const darkModeToggle = document.getElementById('darkModeToggle');
    const compactLayoutToggle = document.getElementById('compactLayoutToggle');

    // Load preferences
    // Default is dark mode. If explicitly false, apply light mode.
    if (localStorage.getItem('safetube_dark_mode') === 'false') {
        document.body.classList.add('light-mode');
        if (darkModeToggle) darkModeToggle.checked = false;
    } else {
        document.body.classList.remove('light-mode');
        if (darkModeToggle) darkModeToggle.checked = true;
    }
    
    if (localStorage.getItem('safetube_compact_layout') === 'true') {
        document.body.classList.add('compact-layout');
        if (compactLayoutToggle) compactLayoutToggle.checked = true;
    }

    // Attach event listeners for toggles in settings
    if (darkModeToggle) {
        darkModeToggle.addEventListener('change', (e) => {
            if (e.target.checked) {
                document.body.classList.remove('light-mode');
                localStorage.setItem('safetube_dark_mode', 'true');
            } else {
                document.body.classList.add('light-mode');
                localStorage.setItem('safetube_dark_mode', 'false');
            }
        });
    }

    if (compactLayoutToggle) {
        compactLayoutToggle.addEventListener('change', (e) => {
            if (e.target.checked) {
                document.body.classList.add('compact-layout');
                localStorage.setItem('safetube_compact_layout', 'true');
            } else {
                document.body.classList.remove('compact-layout');
                localStorage.setItem('safetube_compact_layout', 'false');
            }
        });
    }

    // Language Translation Logic
    const dictionary = {
        'hi': {
            'Dashboard': 'डैशबोर्ड',
            'Video Analysis': 'वीडियो विश्लेषण',
            'Comment Analysis': 'टिप्पणी विश्लेषण',
            'Analytics': 'एनालिटिक्स',
            'Reports': 'रिपोर्ट्स',
            'AI Workflow': 'एआई वर्कफ़्लो',
            'Settings': 'सेटिंग्स',
            'Logout': 'लॉग आउट'
        },
        'es': {
            'Dashboard': 'Panel',
            'Video Analysis': 'Análisis de Video',
            'Comment Analysis': 'Análisis de Comentarios',
            'Analytics': 'Analítica',
            'Reports': 'Informes',
            'AI Workflow': 'Flujo de IA',
            'Settings': 'Configuración',
            'Logout': 'Cerrar Sesión'
        },
        'fr': {
            'Dashboard': 'Tableau de bord',
            'Video Analysis': 'Analyse Vidéo',
            'Comment Analysis': 'Analyse des Commentaires',
            'Analytics': 'Analytique',
            'Reports': 'Rapports',
            'AI Workflow': 'Flux IA',
            'Settings': 'Paramètres',
            'Logout': 'Déconnexion'
        }
    };

    const savedLang = localStorage.getItem('safetube_lang') || 'en';
    const langSelect = document.getElementById('languageSelect');
    const langOkBtn = document.getElementById('langOkBtn');

    if (langSelect) langSelect.value = savedLang;

    // Apply translations on load
    if (savedLang !== 'en' && dictionary[savedLang]) {
        document.querySelectorAll('.nav-item').forEach(item => {
            const textNode = Array.from(item.childNodes).find(n => n.nodeType === Node.TEXT_NODE && n.textContent.trim().length > 0);
            if (textNode) {
                const originalText = textNode.textContent.trim();
                if (dictionary[savedLang][originalText]) {
                    textNode.textContent = ' ' + dictionary[savedLang][originalText] + ' ';
                }
            }
        });
    }

    // Handle OK Button
    if (langOkBtn && langSelect) {
        langOkBtn.addEventListener('click', () => {
            localStorage.setItem('safetube_lang', langSelect.value);
            location.reload(); 
        });
    }

    // Avatar Editor Menu Logic
    const avatarEditBtn = document.getElementById('avatarEditBtn');
    const avatarMenu = document.getElementById('avatarMenu');
    const btnGallery = document.getElementById('btnGallery');
    const btnCamera = document.getElementById('btnCamera');
    const btnRemovePhoto = document.getElementById('btnRemovePhoto');
    const profileGalleryInput = document.getElementById('profileGalleryInput');
    const profileCameraInput = document.getElementById('profileCameraInput');

    // Camera Modal Variables
    const cameraModal = document.getElementById('cameraModal');
    const cameraVideo = document.getElementById('cameraVideo');
    const cameraCanvas = document.getElementById('cameraCanvas');
    const cameraPreview = document.getElementById('cameraPreview');
    const btnSnap = document.getElementById('btnSnap');
    const btnCancelCamera = document.getElementById('btnCancelCamera');
    const btnKeepPhoto = document.getElementById('btnKeepPhoto');
    const btnDiscardPhoto = document.getElementById('btnDiscardPhoto');
    const cameraCaptureActions = document.getElementById('cameraCaptureActions');
    const cameraConfirmActions = document.getElementById('cameraConfirmActions');
    let videoStream = null;
    let capturedDataUrl = null;

    function stopCamera() {
        if (videoStream) {
            videoStream.getTracks().forEach(track => track.stop());
            videoStream = null;
        }
        if (cameraModal) cameraModal.classList.remove('active');
    }

    if (avatarEditBtn && avatarMenu) {
        avatarEditBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            avatarMenu.classList.toggle('active');
        });

        document.addEventListener('click', () => {
            avatarMenu.classList.remove('active');
        });

        avatarMenu.addEventListener('click', (e) => {
            e.stopPropagation(); 
        });

        if (btnGallery) {
            btnGallery.addEventListener('click', () => {
                if(profileGalleryInput) profileGalleryInput.click();
                avatarMenu.classList.remove('active');
            });
        }

        if (btnCamera) {
            btnCamera.addEventListener('click', async () => {
                avatarMenu.classList.remove('active');
                if (cameraModal) {
                    cameraModal.classList.add('active');
                    cameraPreview.style.display = 'none';
                    cameraVideo.style.display = 'block';
                    cameraCaptureActions.style.display = 'flex';
                    cameraConfirmActions.style.display = 'none';
                    try {
                        videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
                        cameraVideo.srcObject = videoStream;
                    } catch (err) {
                        alert('Camera access denied or not available.');
                        stopCamera();
                    }
                }
            });
        }

        if (btnSnap) {
            btnSnap.addEventListener('click', () => {
                if(cameraVideo && cameraCanvas) {
                    cameraCanvas.width = cameraVideo.videoWidth;
                    cameraCanvas.height = cameraVideo.videoHeight;
                    const ctx = cameraCanvas.getContext('2d');
                    ctx.drawImage(cameraVideo, 0, 0, cameraCanvas.width, cameraCanvas.height);
                    capturedDataUrl = cameraCanvas.toDataURL('image/png');
                    
                    cameraVideo.style.display = 'none';
                    cameraPreview.src = capturedDataUrl;
                    cameraPreview.style.display = 'block';
                    
                    cameraCaptureActions.style.display = 'none';
                    cameraConfirmActions.style.display = 'flex';
                }
            });
        }

        if (btnDiscardPhoto) {
            btnDiscardPhoto.addEventListener('click', () => {
                cameraPreview.style.display = 'none';
                cameraVideo.style.display = 'block';
                cameraCaptureActions.style.display = 'flex';
                cameraConfirmActions.style.display = 'none';
                capturedDataUrl = null;
            });
        }

        if (btnKeepPhoto) {
            btnKeepPhoto.addEventListener('click', () => {
                if(capturedDataUrl) {
                    localStorage.setItem('safetube_profile_image', capturedDataUrl);
                    stopCamera();
                    location.reload();
                }
            });
        }

        if (btnCancelCamera) {
            btnCancelCamera.addEventListener('click', stopCamera);
        }

        if (btnRemovePhoto) {
            btnRemovePhoto.addEventListener('click', () => {
                localStorage.removeItem('safetube_profile_image');
                location.reload();
            });
        }

        const handleFileSelect = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(event) {
                    localStorage.setItem('safetube_profile_image', event.target.result);
                    location.reload(); 
                };
                reader.readAsDataURL(file);
            }
        };

        if (profileGalleryInput) profileGalleryInput.addEventListener('change', handleFileSelect);
        if (profileCameraInput) profileCameraInput.addEventListener('change', handleFileSelect);
    }
    
    // Global Back Button
    const pageHeader = document.querySelector('.page-header');
    const isHomePage = window.location.pathname.endsWith('dashboard.html') || window.location.pathname.endsWith('index.html') || window.location.pathname === '/';
    if (pageHeader && !document.getElementById('globalBackBtn') && !isHomePage) {
        const h1 = pageHeader.querySelector('h1');
        if (h1) {
            const backBtn = document.createElement('button');
            backBtn.id = 'globalBackBtn';
            backBtn.className = 'btn-icon';
            backBtn.style.cssText = 'background: var(--bg-main); width: 36px; height: 36px; margin-right: 12px; display: inline-flex; align-items: center; justify-content: center; border: 1px solid var(--border-color); cursor: pointer; border-radius: 50%; color: var(--text-main); transition: var(--transition); flex-shrink: 0;';
            backBtn.innerHTML = '<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>';
            backBtn.title = 'Go Back';
            backBtn.onclick = () => {
                if (document.referrer && document.referrer !== window.location.href) {
                    window.history.back();
                } else {
                    window.location.href = 'dashboard.html';
                }
            };

            const wrapper = document.createElement('div');
            wrapper.style.display = 'flex';
            wrapper.style.alignItems = 'center';
            wrapper.style.marginBottom = '0.5rem';
            
            h1.style.marginBottom = '0';
            pageHeader.insertBefore(wrapper, h1);
            wrapper.appendChild(backBtn);
            wrapper.appendChild(h1);
            
            backBtn.addEventListener('mouseenter', () => { 
                backBtn.style.background = 'var(--primary-light)'; 
                backBtn.style.color = 'var(--primary)'; 
                backBtn.style.borderColor = 'var(--primary)'; 
            });
            backBtn.addEventListener('mouseleave', () => { 
                backBtn.style.background = 'var(--bg-main)'; 
                backBtn.style.color = 'var(--text-main)'; 
                backBtn.style.borderColor = 'var(--border-color)'; 
            });
        }
    }
});

// Global Search Bar Logic
document.addEventListener('DOMContentLoaded', () => {
    const topNavSearchInput = document.querySelector('.top-navbar .search-bar input');
    if (topNavSearchInput) {
        topNavSearchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const query = topNavSearchInput.value.trim();
                if (query) {
                    if (query.includes('youtube.com') || query.includes('youtu.be') || query.startsWith('http')) {
                        window.location.href = `video-analysis.html?url=${encodeURIComponent(query)}`;
                    } else {
                        window.location.href = `reports.html?q=${encodeURIComponent(query)}`;
                    }
                }
            }
        });
    }
    
    // Clear user session data on logout so new login acts as a new user
    const logoutLinks = document.querySelectorAll('a[href="login.html"]');
    logoutLinks.forEach(link => {
        link.addEventListener('click', () => {
            localStorage.removeItem('safetube_channel_name');
            localStorage.removeItem('safetube_user_name');
            // We intentionally don't clear safetube_remembered_email
        });
    });
});
