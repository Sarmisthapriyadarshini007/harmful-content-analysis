document.addEventListener('DOMContentLoaded', () => {
    initCharts();
});

function initCharts() {
    // Safety Trend Line Chart
    const ctxTrend = document.getElementById('chart-trend');
    if (ctxTrend) {
        new Chart(ctxTrend, {
            type: 'line',
            data: {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                datasets: [{
                    label: 'Safety Score',
                    data: [88, 89, 85, 91, 94, 96, 94],
                    borderColor: '#3B82F6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderWidth: 2,
                    tension: 0.4,
                    fill: true,
                    pointBackgroundColor: '#3B82F6',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { min: 70, max: 100, grid: { color: 'rgba(255,255,255,0.05)' }, border: { display: false } },
                    x: { grid: { display: false }, border: { display: false } }
                }
            }
        });
    }

    // Flagged Breakdown Doughnut
    const ctxSentiment = document.getElementById('chart-sentiment');
    if (ctxSentiment) {
        new Chart(ctxSentiment, {
            type: 'doughnut',
            data: {
                labels: ['Toxic', 'Spam', 'Hate Speech', 'Fake News'],
                datasets: [{
                    data: [15, 35, 10, 5],
                    backgroundColor: ['#EF4444', '#F59E0B', '#8B5CF6', '#10B981'],
                    borderWidth: 0,
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom', labels: { color: '#A1A1AA', padding: 20, usePointStyle: true } }
                },
                cutout: '70%'
            }
        });
    }
}
