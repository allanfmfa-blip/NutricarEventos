// --- DADOS DE DEMONSTRAÇÃO NUTRICAR ---
const defaultEvents = [
    { date: "01/11", month: "NOV", title: "Loja 101 - Centro SP", desc: "Inauguração da nova matriz", type: "inauguracao", segment: "Corporativo" },
];

// --- RELÓGIO DIGITAL DO TOPO ---
function updateClock() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    document.getElementById('clock-time').textContent = `${hours}:${minutes}:${seconds}`;

    const options = { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' };
    document.getElementById('clock-date').textContent = now.toLocaleDateString('pt-BR', options);
}
setInterval(updateClock, 1000);
updateClock();

// --- CONTADOR REGRESSIVO PARA O PRÓXIMO EVENTO ---
let targetEventDate = null;

function updateCountdown() {
    if (!targetEventDate) return;

    const now = new Date().getTime();
    const distance = targetEventDate - now;

    if (distance < 0) {
        document.getElementById('cd-days').textContent = "00";
        document.getElementById('cd-hours').textContent = "00";
        document.getElementById('cd-minutes').textContent = "00";
        document.getElementById('cd-seconds').textContent = "00";
        return;
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    document.getElementById('cd-days').textContent = String(days).padStart(2, '0');
    document.getElementById('cd-hours').textContent = String(hours).padStart(2, '0');
    document.getElementById('cd-minutes').textContent = String(minutes).padStart(2, '0');
    document.getElementById('cd-seconds').textContent = String(seconds).padStart(2, '0');
}
setInterval(updateCountdown, 1000);

// --- CONVERTER DATA DO CSV PARA TIMESTAMP ---
function parseEventDate(dateStr, monthStr) {
    const parts = dateStr.split('/');
    const day = parseInt(parts[0], 10);
    
    const monthsMap = {
        'JAN': 0, 'FEV': 1, 'MAR': 2, 'ABR': 3, 'MAI': 4, 'JUN': 5,
        'JUL': 6, 'AGO': 7, 'SET': 8, 'OUT': 9, 'NOV': 10, 'DEZ': 11
    };

    const currentYear = new Date().getFullYear();
    let month = 0;

    if (monthStr) {
        const cleanMonth = monthStr.trim().toUpperCase();
        month = monthsMap[cleanMonth] !== undefined ? monthsMap[cleanMonth] : 0;
    } else if (parts[1]) {
        month = parseInt(parts[1], 10) - 1;
    }

    // Retorna a data do evento considerando as 08:00 AM do dia
    return new Date(currentYear, month, day, 8, 0, 0).getTime();
}

// --- RENDERIZAR EVENTOS NA TELA E ENCONTRAR O VERDADEIRO PRÓXIMO EVENTO ---
function renderEvents(events) {
    const container = document.getElementById('events-container');
    container.innerHTML = '';

    if (events.length > 0) {
        const now = new Date().getTime();
        let closestEvent = null;
        let smallestDiff = Infinity;
        let finalEventTime = null;

        // 1. Vasculha a lista para encontrar qual é o verdadeiro PRÓXIMO evento
        events.forEach(evt => {
            const eventTime = parseEventDate(evt.date, evt.month);
            const diff = eventTime - now; // Diferença entre o evento e agora

            // Se diff > 0, o evento ainda vai acontecer. Pega o mais próximo.
            if (diff > 0 && diff < smallestDiff) {
                smallestDiff = diff;
                closestEvent = evt;
                finalEventTime = eventTime;
            }
        });

        // 2. Se encontrou um evento no futuro, atualiza o painel esquerdo
        if (closestEvent) {
            document.getElementById('next-title').textContent = closestEvent.title;
            document.getElementById('next-desc').textContent = closestEvent.desc || 'Sem descrição informada.';
            targetEventDate = finalEventTime;
        } else {
            // Se todos os eventos da planilha já passaram
            document.getElementById('next-title').textContent = "Sem próximos eventos";
            document.getElementById('next-desc').textContent = "Todos os eventos já ocorreram.";
            targetEventDate = null;
        }
        
        updateCountdown();
    }

    // 3. Renderiza a lista rolando na direita
    events.forEach(evt => {
        const typeStr = (evt.type || '').toLowerCase();
        const typeClass = typeStr.includes('inaugur') ? 'inauguracao' :
            typeStr.includes('retro') ? 'retrofit' : 'outro';

        const typeLabel = typeClass === 'inauguracao' ? 'Inauguração' :
            typeClass === 'retrofit' ? 'Retrofit' : 'Evento';

        const segmentText = evt.segment ? evt.segment.trim() : '';
        const segmentClass = segmentText.toLowerCase() === 'corporativo' ? 'segmento-corporativo' : 'segmento-residencial';

        const card = document.createElement('div');
        card.className = `event-card ${typeClass}`;
        card.innerHTML = `
          <div class="event-date">
            <span class="day">${evt.date}</span>
            <span class="month">${evt.month || ''}</span>
          </div>
          <div class="event-info">
            <h2>${evt.title}</h2>
            <p>${evt.desc}</p>
          </div>
          <div class="event-badges-container">
            <div class="event-badge badge-${typeClass}">
              ${typeLabel}
            </div>
            ${segmentText ? `<div class="event-badge ${segmentClass}">${segmentText}</div>` : ''}
          </div>
        `;
        container.appendChild(card);
    });
}

// --- AUTO-SCROLL CONTÍNUO PARA A LISTA DA DIREITA ---
let scrolling = true;
let currentScrollPos = 0;
const speed = 0.8;
let isWaitingAtBoundary = false;

function autoScrollStep() {
    if (scrolling && !isWaitingAtBoundary) {
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;

        if (maxScroll > 0) {
            currentScrollPos += speed;
            window.scrollTo(0, Math.floor(currentScrollPos));

            if (currentScrollPos >= maxScroll) {
                isWaitingAtBoundary = true;

                setTimeout(() => {
                    window.scrollTo({ top: 0, behavior: 'smooth' });

                    setTimeout(() => {
                        currentScrollPos = 0;
                        window.scrollTo(0, 0);
                        isWaitingAtBoundary = false;
                        requestAnimationFrame(autoScrollStep);
                    }, 1500);

                }, 3000);
                return;
            }
        }
    }

    if (!isWaitingAtBoundary) {
        requestAnimationFrame(autoScrollStep);
    }
}

function toggleScroll() {
    scrolling = !scrolling;
    const btn = document.getElementById('btn-scroll');
    if (scrolling) {
        btn.textContent = 'PAUSAR ROLAGEM';
        btn.classList.remove('paused');
        currentScrollPos = window.scrollY;
        isWaitingAtBoundary = false;
        requestAnimationFrame(autoScrollStep);
    } else {
        btn.textContent = 'INICIAR ROLAGEM';
        btn.classList.add('paused');
    }
}

function togglePanel(show) {
    const panel = document.getElementById('control-panel');
    if (show) {
        panel.classList.remove('hidden');
    } else {
        panel.classList.add('hidden');
    }
}

// --- PARSER DE CSV (Suporte a 6 colunas: Data, Mês, Título, Desc, Tipo, Segmento) ---
function parseCSV(text) {
    const lines = text.split('\n').filter(line => line.trim() !== '');
    if (lines.length < 2) return [];

    const result = [];
    for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(c => c.replace(/^"|"$/g, '').trim());
        if (cols.length >= 3 && cols[0] !== '') {
            result.push({
                date: cols[0],
                month: cols[1] || '',
                title: cols[2] || '',
                desc: cols[3] || '',
                type: cols[4] || 'outro',
                segment: cols[5] || ''
            });
        }
    }
    return result;
}

// --- CARREGAR GOOGLE SHEETS ---
function loadSheetsCSV(customUrl = null) {
    const url = customUrl || document.getElementById('csv-url-input').value.trim();
    if (!url) return;

    localStorage.setItem('sheets_csv_url', url);
    document.getElementById('csv-url-input').value = url;

    fetch(url)
        .then(response => {
            if (!response.ok) throw new Error("Erro de rede ao acessar o CSV");
            return response.text();
        })
        .then(csvText => {
            const parsedEvents = parseCSV(csvText);
            if (parsedEvents.length > 0) {
                renderEvents(parsedEvents);
                currentScrollPos = 0;
                window.scrollTo(0, 0);
            }
        })
        .catch(err => {
            console.error(err);
        });
}

// --- INICIALIZAÇÃO ---
window.onload = () => {
    const DEFAULT_SHEETS_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSVxaJpkxkcNiRirY3LM8hagLIyj4em4T76Q_qcp44xh-ZB9x_SO8RyqHTLwwus9YqGrpiZkWirD5kR/pub?output=csv";

    const urlParams = new URLSearchParams(window.location.search);
    const sheetUrlParam = urlParams.get('sheet');

    const targetUrl = sheetUrlParam || DEFAULT_SHEETS_URL || localStorage.getItem('sheets_csv_url');

    if (targetUrl) {
        loadSheetsCSV(targetUrl);
    } else {
        renderEvents(defaultEvents);
    }

    requestAnimationFrame(autoScrollStep);

    setInterval(() => {
        const activeUrl = urlParams.get('sheet') || DEFAULT_SHEETS_URL || localStorage.getItem('sheets_csv_url');
        if (activeUrl) loadSheetsCSV(activeUrl);
    }, 60 * 5000);
};