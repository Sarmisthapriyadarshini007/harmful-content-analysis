document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('reportSearch');
    const riskFilter = document.getElementById('riskFilter');
    const reportsGrid = document.getElementById('reportsGrid');
    let allReports = [];

    // Fetch reports from backend
    function loadReports() {
        if (!reportsGrid) return;
        reportsGrid.innerHTML = '<div style="color: var(--text-secondary); text-align: center; width: 100%; grid-column: 1 / -1; padding: 2rem;">Loading reports...</div>';
        
        fetch('http://localhost:3000/api/reports')
            .then(res => {
                if (!res.ok) throw new Error('Failed to load');
                return res.json();
            })
            .then(data => {
                allReports = data;
                renderReports(allReports);
                
                // Handle URL parameter 'q'
                const urlParams = new URLSearchParams(window.location.search);
                const query = urlParams.get('q');
                if (query && searchInput) {
                    searchInput.value = query;
                    filterReports();
                }
            })
            .catch(err => {
                reportsGrid.innerHTML = `<div style="color: var(--danger); text-align: center; width: 100%; grid-column: 1 / -1; padding: 2rem;">Error loading reports: ${err.message}</div>`;
            });
    }

    function renderReports(reports) {
        if (!reportsGrid) return;
        reportsGrid.innerHTML = '';
        
        if (reports.length === 0) {
            reportsGrid.innerHTML = '<div style="color: var(--text-secondary); text-align: center; width: 100%; grid-column: 1 / -1; padding: 2rem;">No reports found.</div>';
            return;
        }

        reports.forEach((report, index) => {
            const date = new Date(report.created_at);
            const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
            
            const riskValue = report.risk_level.toLowerCase().replace(' risk', '');
            const riskClass = riskValue === 'critical' ? 'high' : riskValue === 'high' ? 'high' : riskValue === 'medium' ? 'medium' : 'low';
            const riskIcon = riskClass === 'high' ? '<svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>'
                : riskClass === 'medium' ? '<svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>'
                : '<svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>';

            const delay = (index % 5) + 1;

            const card = document.createElement('div');
            card.className = `report-card animate-fade-up delay-${delay}`;
            card.setAttribute('data-risk', riskClass);
            card.innerHTML = `
                <div class="report-header">
                    <div class="report-title-area">
                        <div class="report-title">${report.video_title}</div>
                        <div class="report-date">
                            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                            ${dateStr}
                        </div>
                    </div>
                    <span class="badge-status status-completed">Completed</span>
                </div>

                <div class="report-metrics">
                    <div class="metric-box">
                        <div class="metric-label">Risk Level</div>
                        <div class="metric-value risk-${riskClass}">
                            ${riskIcon}
                            ${report.risk_level.charAt(0).toUpperCase() + report.risk_level.slice(1)}
                        </div>
                    </div>
                    <div class="metric-box">
                        <div class="metric-label">Safety Score</div>
                        <div class="metric-value risk-${riskClass}">${report.overall_safety_score}%</div>
                    </div>
                </div>

                <div class="report-actions">
                    <button class="btn-action btn-view" onclick="window.location.href='video-analysis.html'">
                        <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                        View
                    </button>
                    <button class="btn-action btn-pdf">
                        <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 13l2 2 4-4"></path></svg>
                        PDF
                    </button>
                    <button class="btn-action btn-csv">
                        <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                        CSV
                    </button>
                    <button class="btn-action btn-delete" data-id="${report.id}">
                        <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        Delete
                    </button>
                </div>
            `;
            reportsGrid.appendChild(card);
        });

        attachButtonListeners();
    }

    // Search and Filter Functionality
    function filterReports() {
        if (!searchInput || !riskFilter) return;
        const searchTerm = searchInput.value.toLowerCase().trim();
        const riskValue = riskFilter.value;

        const filtered = allReports.filter(report => {
            const title = report.video_title.toLowerCase();
            const rVal = report.risk_level.toLowerCase().replace(' risk', '');
            const cardRisk = rVal === 'critical' ? 'high' : rVal === 'high' ? 'high' : rVal === 'medium' ? 'medium' : 'low';
            
            const matchesSearch = title.includes(searchTerm);
            const matchesRisk = riskValue === 'all' || cardRisk === riskValue;
            
            return matchesSearch && matchesRisk;
        });

        renderReports(filtered);
    }

    if (searchInput) {
        searchInput.addEventListener('input', filterReports);
    }
    if (riskFilter) {
        riskFilter.addEventListener('change', filterReports);
    }

    // Generate new button
    const generateNewBtn = document.getElementById('generateNewBtn');
    if (generateNewBtn) {
        generateNewBtn.addEventListener('click', () => {
            window.location.href = 'video-analysis.html';
        });
    }

    // Button Interactions
    function attachButtonListeners() {
        const reportCards = document.querySelectorAll('.report-card');
        reportCards.forEach(card => {
            // Delete button
            const deleteBtn = card.querySelector('.btn-delete');
            if (deleteBtn) {
                deleteBtn.addEventListener('click', () => {
                    if (confirm('Are you sure you want to delete this report?')) {
                        const id = deleteBtn.getAttribute('data-id');
                        card.style.transition = "opacity 0.3s ease, transform 0.3s ease";
                        card.style.opacity = "0";
                        card.style.transform = "scale(0.9)";
                        
                        fetch(`http://localhost:3000/api/reports/${id}`, { method: 'DELETE' })
                            .then(() => {
                                setTimeout(() => {
                                    card.remove();
                                    allReports = allReports.filter(r => r.id != id);
                                }, 300);
                            })
                            .catch(err => {
                                alert('Error deleting report: ' + err.message);
                                card.style.opacity = "1";
                                card.style.transform = "none";
                            });
                    }
                });
            }

            // Fake download interaction
            const pdfBtn = card.querySelector('.btn-pdf');
            if (pdfBtn) {
                pdfBtn.addEventListener('click', () => {
                    pdfBtn.innerHTML = '<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg> Done';
                    setTimeout(() => {
                        pdfBtn.innerHTML = '<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 13l2 2 4-4"></path></svg> PDF';
                    }, 2000);
                });
            }

            const csvBtn = card.querySelector('.btn-csv');
            if (csvBtn) {
                csvBtn.addEventListener('click', () => {
                    csvBtn.innerHTML = '<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg> Done';
                    setTimeout(() => {
                        csvBtn.innerHTML = '<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg> CSV';
                    }, 2000);
                });
            }
        });
    }

    loadReports();
});
