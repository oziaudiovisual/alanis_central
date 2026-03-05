// Alanis Central de Vendas — Client-side JS

// ---------- Dashboard Chart ----------
function initDashboardChart(data) {
    const canvas = document.getElementById('eventsChart');
    if (!canvas) return;

    // Group data by date
    const dates = [...new Set(data.map(d => d.date))].sort();
    const eventTypes = ['compra_aprovada', 'compra_recusada', 'pix_gerado', 'reembolso', 'chargeback'];
    const eventLabels = {
        compra_aprovada: 'Aprovadas',
        compra_recusada: 'Recusadas',
        pix_gerado: 'PIX Gerado',
        reembolso: 'Reembolsos',
        chargeback: 'Chargebacks',
    };
    const eventColors = {
        compra_aprovada: '#22c55e',
        compra_recusada: '#ef4444',
        pix_gerado: '#06b6d4',
        reembolso: '#f97316',
        chargeback: '#f59e0b',
    };

    const datasets = eventTypes.map(type => ({
        label: eventLabels[type],
        data: dates.map(date => {
            const match = data.find(d => d.date === date && d.event_type === type);
            return match ? parseInt(match.count) : 0;
        }),
        borderColor: eventColors[type],
        backgroundColor: eventColors[type] + '20',
        borderWidth: 2,
        tension: 0.3,
        fill: false,
        pointRadius: 3,
        pointHoverRadius: 5,
    }));

    new Chart(canvas, {
        type: 'line',
        data: {
            labels: dates.map(d => {
                const dt = new Date(d + 'T00:00:00');
                return dt.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
            }),
            datasets,
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            interaction: {
                intersect: false,
                mode: 'index',
            },
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#9898a8',
                        font: { size: 12, family: 'Inter' },
                        padding: 16,
                        usePointStyle: true,
                        pointStyle: 'circle',
                    },
                },
                tooltip: {
                    backgroundColor: '#1c1c26',
                    borderColor: '#2a2a3a',
                    borderWidth: 1,
                    titleColor: '#f0f0f4',
                    bodyColor: '#9898a8',
                    titleFont: { weight: '600' },
                    padding: 12,
                    cornerRadius: 8,
                },
            },
            scales: {
                x: {
                    grid: { color: '#2a2a3a' },
                    ticks: { color: '#6b6b7b', font: { size: 11 } },
                },
                y: {
                    beginAtZero: true,
                    grid: { color: '#2a2a3a' },
                    ticks: {
                        color: '#6b6b7b',
                        font: { size: 11 },
                        stepSize: 1,
                    },
                },
            },
        },
    });
}

// ---------- Payload Modal ----------
async function viewPayload(transactionId) {
    const modal = document.getElementById('payloadModal');
    const content = document.getElementById('payloadContent');
    if (!modal || !content) return;

    content.textContent = 'Carregando...';
    modal.style.display = 'flex';

    try {
        const res = await fetch(`/transactions/${transactionId}`);
        const tx = await res.json();
        content.textContent = JSON.stringify(tx.raw_payload || tx, null, 2);
    } catch (err) {
        content.textContent = 'Erro ao carregar payload';
    }
}

function closePayloadModal() {
    const modal = document.getElementById('payloadModal');
    if (modal) modal.style.display = 'none';
}

// Close modal on Escape
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closePayloadModal();
});
