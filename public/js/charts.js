// ============================================================================
// BLOOD BANK MANAGEMENT SYSTEM - CHARTS & VISUALIZATIONS
// Uses local Chart.js with automatic canvas destruction and fallback
// ============================================================================

const chartInstances = {};

function destroyChart(canvasId) {
    if (chartInstances[canvasId]) {
        chartInstances[canvasId].destroy();
        delete chartInstances[canvasId];
    }
}

const charts = {
    // 1. Dashboard: Blood Inventory Bar Chart
    renderInventoryChart(canvasId, inventoryData) {
        destroyChart(canvasId);
        const ctx = document.getElementById(canvasId);
        if (!ctx) return;

        const labels = inventoryData.map(item => item.blood_group);
        const data = inventoryData.map(item => item.available_units);

        const backgroundColors = inventoryData.map(item => {
            if (item.available_units >= 10) return 'rgba(16, 185, 129, 0.85)';
            if (item.available_units > 0) return 'rgba(245, 158, 11, 0.85)';
            return 'rgba(239, 68, 68, 0.85)';
        });

        const borderColors = inventoryData.map(item => {
            if (item.available_units >= 10) return '#059669';
            if (item.available_units > 0) return '#d97706';
            return '#dc2626';
        });

        chartInstances[canvasId] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Available Units (Bags)',
                    data: data,
                    backgroundColor: backgroundColors,
                    borderColor: borderColors,
                    borderWidth: 1.5,
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return ` Stock: ${context.parsed.y} Units`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: '#f1f5f9' },
                        ticks: { font: { size: 11, weight: '500' } }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { font: { size: 12, weight: '700' } }
                    }
                }
            }
        });
    },

    // 2. Dashboard: Monthly Trend (Donations vs Demand)
    renderTrendsChart(canvasId) {
        destroyChart(canvasId);
        const ctx = document.getElementById(canvasId);
        if (!ctx) return;

        const months = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'];
        const donations = [12, 18, 15, 22, 28, 25];
        const requests = [9, 14, 16, 19, 21, 23];

        chartInstances[canvasId] = new Chart(ctx, {
            type: 'line',
            data: {
                labels: months,
                datasets: [
                    {
                        label: 'Donations Collected',
                        data: donations,
                        borderColor: '#dc2626',
                        backgroundColor: 'rgba(220, 38, 38, 0.1)',
                        fill: true,
                        tension: 0.35,
                        pointBackgroundColor: '#b91c1c',
                        pointRadius: 4
                    },
                    {
                        label: 'Patient Requests',
                        data: requests,
                        borderColor: '#2563eb',
                        backgroundColor: 'rgba(37, 99, 235, 0.05)',
                        fill: true,
                        tension: 0.35,
                        pointBackgroundColor: '#1d4ed8',
                        pointRadius: 4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: { boxWidth: 12, font: { weight: '600' } }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: '#f1f5f9' }
                    },
                    x: {
                        grid: { display: false }
                    }
                }
            }
        });
    },

    // 3. Reports: Blood Distribution Doughnut Chart
    renderDistributionDoughnut(canvasId, inventoryData) {
        destroyChart(canvasId);
        const ctx = document.getElementById(canvasId);
        if (!ctx) return;

        const labels = inventoryData.map(i => i.blood_group);
        const data = inventoryData.map(i => i.available_units);
        const colors = [
            '#ef4444', '#f87171', '#3b82f6', '#60a5fa',
            '#10b981', '#34d399', '#f59e0b', '#fbbf24'
        ];

        chartInstances[canvasId] = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: colors,
                    borderWidth: 2,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: { boxWidth: 14, font: { size: 12, weight: '600' } }
                    }
                },
                cutout: '65%'
            }
        });
    },

    // 4. Reports: Hospital Demand Breakdown
    renderHospitalDemandChart(canvasId, hospitalDemands) {
        destroyChart(canvasId);
        const ctx = document.getElementById(canvasId);
        if (!ctx) return;

        const labels = hospitalDemands.map(h => h.hospital.replace('Hospital', 'Hosp.').replace('Medical Center', 'Med.'));
        const data = hospitalDemands.map(h => h.total_units_needed);

        chartInstances[canvasId] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Units Requested',
                    data: data,
                    backgroundColor: 'rgba(185, 28, 28, 0.85)',
                    borderColor: '#991b1b',
                    borderWidth: 1,
                    borderRadius: 6
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        grid: { color: '#f1f5f9' }
                    },
                    y: {
                        grid: { display: false },
                        ticks: { font: { weight: '600', size: 11 } }
                    }
                }
            }
        });
    }
};

window.charts = charts;
