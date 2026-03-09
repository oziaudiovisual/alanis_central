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
        compra_aprovada: '#04ffc2',
        compra_recusada: '#ff4d6a',
        pix_gerado: '#22d3ee',
        reembolso: '#fb923c',
        chargeback: '#ffbe0b',
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
                        color: '#a3a3a3',
                        font: { size: 12, family: 'Inter' },
                        padding: 16,
                        usePointStyle: true,
                        pointStyle: 'circle',
                    },
                },
                tooltip: {
                    backgroundColor: '#262626',
                    borderColor: '#333333',
                    borderWidth: 1,
                    titleColor: '#ffffff',
                    bodyColor: '#a3a3a3',
                    titleFont: { weight: '600' },
                    padding: 12,
                    cornerRadius: 8,
                },
            },
            scales: {
                x: {
                    grid: { color: '#333333' },
                    ticks: { color: '#737373', font: { size: 11 } },
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

// ---------- Custom Confirm Modal ----------
const alanis = {
    confirm({ title, message, confirmText, cancelText }) {
        return new Promise((resolve) => {
            // Remove any existing modal
            const existing = document.getElementById('alanis-confirm-modal');
            if (existing) existing.remove();

            const modal = document.createElement('div');
            modal.id = 'alanis-confirm-modal';
            modal.className = 'alanis-modal';
            modal.innerHTML = `
                <div class="alanis-modal-overlay"></div>
                <div class="alanis-modal-box">
                    <div class="alanis-modal-icon">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"/>
                            <line x1="12" y1="8" x2="12" y2="12"/>
                            <line x1="12" y1="16" x2="12.01" y2="16"/>
                        </svg>
                    </div>
                    <h3 class="alanis-modal-title">${title || 'Confirmar ação'}</h3>
                    <p class="alanis-modal-message">${message || 'Tem certeza?'}</p>
                    <div class="alanis-modal-actions">
                        <button class="btn btn-sm alanis-modal-cancel">${cancelText || 'Cancelar'}</button>
                        <button class="btn btn-sm btn-primary alanis-modal-confirm">${confirmText || 'Confirmar'}</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
            requestAnimationFrame(() => modal.classList.add('visible'));

            const close = (result) => {
                modal.classList.remove('visible');
                setTimeout(() => modal.remove(), 200);
                resolve(result);
            };

            modal.querySelector('.alanis-modal-overlay').addEventListener('click', () => close(false));
            modal.querySelector('.alanis-modal-cancel').addEventListener('click', () => close(false));
            modal.querySelector('.alanis-modal-confirm').addEventListener('click', () => close(true));

            document.addEventListener('keydown', function handler(e) {
                if (e.key === 'Escape') {
                    close(false);
                    document.removeEventListener('keydown', handler);
                }
            });
        });
    },

    toast(message, type = 'success') {
        let container = document.getElementById('alanis-toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'alanis-toast-container';
            document.body.appendChild(container);
        }

        const icons = {
            success: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
            error: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
        };

        const toast = document.createElement('div');
        toast.className = `alanis-toast alanis-toast-${type}`;
        toast.innerHTML = `
            <span class="alanis-toast-icon">${icons[type] || icons.success}</span>
            <span class="alanis-toast-text">${message}</span>
        `;
        container.appendChild(toast);
        requestAnimationFrame(() => toast.classList.add('visible'));

        setTimeout(() => {
            toast.classList.remove('visible');
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    },
};

// ---------- URL Param Toasts ----------
(function () {
    var params = new URLSearchParams(window.location.search);
    var s = params.get('success');
    var e = params.get('error');
    if (s || e) {
        document.addEventListener('DOMContentLoaded', function () {
            if (s) alanis.toast(s, 'success');
            if (e) alanis.toast(e, 'error');
        });
        // Clean URL
        var clean = window.location.pathname;
        window.history.replaceState({}, '', clean);
    }
})();
