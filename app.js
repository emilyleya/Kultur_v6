// =============================================
//  CHRONOS – app.js
//  Supabase + Leaflet + Wikipedia + Quiz
// =============================================

// ── 1. CONFIG ─────────────────────────────────
const SUPABASE_URL      = 'https://mujciribnacdvoomcrjk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im11amNpcmlibmFjZHZvb21jcmprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzMDUzMjgsImV4cCI6MjA5NTg4MTMyOH0.6Ck0OCyzWh78P77iYj4LqGpVGOfVeC649Qf7KtZ5BDs'; // eyJ... aus Supabase Settings → API Keys → anon public

const TILE_LAYERS = {
    light: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png',
    dark:  'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
};

const FALLBACK_IMG = 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/Camponotus_flavomarginatus_ant.jpg/320px-Camponotus_flavomarginatus_ant.jpg';

// ── 2. STATE ──────────────────────────────────
let map         = null;
let tileLayer   = null;
let theme       = 'light';
let sites       = [];
let activeSite  = null;
let currentView = 'explore';
let userXP      = parseInt(localStorage.getItem('chronos_xp'))   || 0;
let favorites   = JSON.parse(localStorage.getItem('chronos_favs')) || [];

// ── 3. SUPABASE ───────────────────────────────
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function loadSites() {
    try {
        const { data, error } = await supabaseClient.from('heritage_sites').select('*');
        if (error) throw error;
        sites = data;
        initApp();
    } catch (err) {
        console.error('Supabase Fehler:', err.message);
    }
}

// ── 4. INIT ───────────────────────────────────
function initApp() {
    initMap();
    addMarkers();
    renderExploreList();
    renderFavList();
    updateXP();
    bindEvents();
}

function initMap() {
    const bounds = L.latLngBounds(L.latLng(-85, -180), L.latLng(85, 180));
    map = L.map('map', {
        zoomControl: false,
        attributionControl: false,
        minZoom: 2.3,
        maxBounds: bounds,
        maxBoundsViscosity: 1.0
    }).setView([20, 10], 3);

    tileLayer = L.tileLayer(TILE_LAYERS[theme], { maxZoom: 19, noWrap: true }).addTo(map);
}

// ── 5. MARKERS ────────────────────────────────
function addMarkers() {
    sites.forEach(site => {
        const lat = parseCoord(site.latitude);
        const lng = parseCoord(site.longitude);
        if (lat === null || lng === null) return;

        const icon = L.divIcon({
            className: 'custom-marker',
            html: `<div class="marker-wrap"><div class="marker-core" style="background:#FF8C42"></div></div>`,
            iconSize: [14, 14],
            iconAnchor: [7, 7]
        });

        L.marker([lat, lng], { icon })
            .addTo(map)
            .on('click', () => showDetails(site, [lat, lng]));
    });
}

// ── 6. WIKIPEDIA BILD ─────────────────────────

// Hilfsfunktion: fragt Wikipedia direkt nach Titel
async function queryWikipedia(title) {
    const url = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=pageimages&format=json&pithumbsize=600&origin=*`;
    const res  = await fetch(url);
    const data = await res.json();
    const page = Object.values(data.query.pages)[0];
    return page?.thumbnail?.source || null;
}

// Hilfsfunktion: Volltextsuche → gibt besten Treffer zurück
async function searchWikipedia(title) {
    const url = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(title)}&srlimit=1&format=json&origin=*`;
    const res  = await fetch(url);
    const data = await res.json();
    const hit  = data.query?.search?.[0];
    if (!hit) return null;
    return queryWikipedia(hit.title);
}

async function fetchWikipediaImage(title) {
    try {
        // Stufe 1: exakter UNESCO-Titel
        let img = await queryWikipedia(title);
        if (img) return img;

        // Stufe 2: erste 3 Wörter des Titels
        const shortTitle = title.split(' ').slice(0, 3).join(' ');
        if (shortTitle !== title) {
            img = await queryWikipedia(shortTitle);
            if (img) return img;
        }

        // Stufe 3: Wikipedia-Volltextsuche
        img = await searchWikipedia(title);
        return img;

    } catch {
        return null;
    }
}

// ── 7. QUIZ ───────────────────────────────────
function buildQuiz(site) {
    const correctYear = parseInt(site.date_inscribed);
    if (!correctYear) return '';

    // 3 falsche Jahreszahlen generieren
    const wrongs = new Set();
    while (wrongs.size < 3) {
        const offset = (Math.floor(Math.random() * 10) + 1) * (Math.random() < 0.5 ? -1 : 1);
        const y = correctYear + offset;
        if (y !== correctYear && y >= 1978 && y <= 2024) wrongs.add(y);
    }

    const options = [...wrongs, correctYear].sort(() => Math.random() - 0.5);

    return `
        <div class="quiz-card" id="quiz-card">
            <div class="quiz-label">🎯 Quiz – XP verdienen</div>
            <div class="quiz-question">In welchem Jahr wurde diese Stätte als UNESCO-Welterbe eingeschrieben?</div>
            <div class="quiz-options">
                ${options.map(y => `
                    <button class="quiz-opt" data-year="${y}" data-correct="${correctYear}">
                        ${y}
                    </button>
                `).join('')}
            </div>
            <div class="quiz-result" id="quiz-result" style="display:none"></div>
        </div>
    `;
}

function bindQuizEvents() {
    document.querySelectorAll('.quiz-opt').forEach(btn => {
        btn.addEventListener('click', e => {
            const chosen  = parseInt(e.currentTarget.dataset.year);
            const correct = parseInt(e.currentTarget.dataset.correct);
            const isRight = chosen === correct;

            // Alle Buttons deaktivieren
            document.querySelectorAll('.quiz-opt').forEach(b => {
                b.disabled = true;
                if (parseInt(b.dataset.year) === correct) b.classList.add('quiz-correct');
                else if (b === e.currentTarget && !isRight) b.classList.add('quiz-wrong');
            });

            const result = document.getElementById('quiz-result');
            result.style.display = 'block';

            if (isRight) {
                earnXP(25);
                result.innerHTML = '✅ Richtig! +25 XP';
                result.style.color = '#2e7d32';
            } else {
                result.innerHTML = `❌ Falsch. Die Antwort war ${correct}.`;
                result.style.color = '#c62828';
            }
        });
    });
}

// ── 8. DETAILS ────────────────────────────────
async function showDetails(site, coords) {
    activeSite = site;
    map.flyTo(coords, 11, { duration: 1.6 });

    const id = getSiteId(site);
    document.getElementById('detail-country').textContent  = site.states_name_en || 'Weltweit';
    document.getElementById('detail-category').textContent = site.category || 'UNESCO';
    document.getElementById('detail-title').textContent    = site.site || site.name_en || 'Unbekannt';
    document.getElementById('detail-meta').textContent     = `Eingeschrieben: ${site.date_inscribed || '–'}`;
    document.getElementById('btn-fav').textContent         = favorites.includes(id) ? '★' : '☆';

    // Bild: Platzhalter zeigen, dann Wikipedia laden
    const img = document.getElementById('detail-img');
    img.style.opacity = '0.4';
    img.src = FALLBACK_IMG;

    const siteName = site.site || site.name_en || '';
    fetchWikipediaImage(siteName).then(url => {
        img.src = url || FALLBACK_IMG;
        img.style.opacity = '1';
    });

    // Beschreibung + Quiz
    document.getElementById('detail-description').innerHTML = `
        <div class="content-block">
            <div class="content-label">UNESCO Beschreibung</div>
            <p class="content-text">${site.short_description_en || 'Keine Beschreibung vorhanden.'}</p>
        </div>
        ${buildQuiz(site)}
    `;
    bindQuizEvents();

    // Geodaten
    document.getElementById('detail-geodata').innerHTML = `
        <div class="content-block">
            <div class="content-label">Geografische Daten</div>
            <p class="content-text">Fläche: ${site.area_hectares || '–'} Hektar</p>
            <p class="content-text">Region: ${site.region_en || '–'}</p>
            <p class="content-text">Kriterien: ${site.criteria_txt || '–'}</p>
        </div>
    `;

    // Tabs zurücksetzen
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    document.querySelector('[data-tab="tab-desc"]').classList.add('active');
    document.getElementById('tab-desc').classList.add('active');

    // Panel wechseln
    document.getElementById('panel-welcome').classList.remove('active');
    document.getElementById('panel-details').classList.add('active');

    // XP für Besuch
    earnXP(10);
}

// ── 9. LISTS ──────────────────────────────────
function renderExploreList() {
    const container = document.getElementById('view-explore');
    container.innerHTML = '';

    sites.slice(0, 150).forEach(site => {
        const id    = getSiteId(site);
        const isFav = favorites.includes(id);
        const btn   = document.createElement('button');
        btn.className = 'site-item';
        btn.innerHTML = `
            <span class="site-dot">●</span>
            <div class="site-body">
                <div class="site-name">${site.site || site.name_en || 'Unbekannte Stätte'}</div>
                <div class="site-meta">${site.states_name_en || 'Weltweit'} · ${site.date_inscribed || '–'}</div>
            </div>
            <button class="site-fav" data-id="${id}" title="Favorit">${isFav ? '★' : '☆'}</button>
        `;
        btn.addEventListener('click', e => {
            if (e.target.closest('.site-fav')) { toggleFav(id); return; }
            const lat = parseCoord(site.latitude);
            const lng = parseCoord(site.longitude);
            if (lat !== null && lng !== null) showDetails(site, [lat, lng]);
        });
        container.appendChild(btn);
    });
}

function renderFavList() {
    const container = document.getElementById('fav-list');
    document.getElementById('fav-count').textContent = favorites.length;
    container.innerHTML = '';

    if (favorites.length === 0) {
        container.innerHTML = '<div class="empty-state">Noch keine Favoriten hinzugefügt.</div>';
        return;
    }

    favorites.forEach(id => {
        const site = sites.find(s => getSiteId(s) === id);
        if (!site) return;
        const item = document.createElement('button');
        item.className = 'site-item';
        item.innerHTML = `
            <span class="site-dot">●</span>
            <div class="site-body">
                <div class="site-name">${site.site || site.name_en}</div>
                <div class="site-meta">${site.states_name_en || 'Weltweit'}</div>
            </div>
            <button class="site-fav" data-id="${id}" title="Entfernen">✕</button>
        `;
        item.addEventListener('click', e => {
            if (e.target.closest('.site-fav')) { toggleFav(id); return; }
            const lat = parseCoord(site.latitude);
            const lng = parseCoord(site.longitude);
            if (lat !== null && lng !== null) showDetails(site, [lat, lng]);
        });
        container.appendChild(item);
    });
}

// ── 10. FAVORITES ─────────────────────────────
function toggleFav(id) {
    const idx = favorites.indexOf(id);
    if (idx === -1) favorites.push(id);
    else favorites.splice(idx, 1);
    localStorage.setItem('chronos_favs', JSON.stringify(favorites));
    renderExploreList();
    renderFavList();
    if (activeSite && getSiteId(activeSite) === id) {
        document.getElementById('btn-fav').textContent = favorites.includes(id) ? '★' : '☆';
    }
}

// ── 11. XP ────────────────────────────────────
function earnXP(amount) {
    userXP += amount;
    localStorage.setItem('chronos_xp', userXP);
    updateXP();
}

function updateXP() {
    document.getElementById('xp-points').textContent = userXP;
    const pct = Math.min((userXP % 500) / 500 * 100, 100);
    document.getElementById('xp-fill').style.width = pct + '%';
}

// ── 12. EVENTS ────────────────────────────────
function bindEvents() {
    document.getElementById('btn-theme').addEventListener('click', () => {
        theme = theme === 'light' ? 'dark' : 'light';
        document.body.className = theme === 'dark' ? 'dark' : '';
        tileLayer.setUrl(TILE_LAYERS[theme]);
    });

    document.getElementById('btn-zoom-in').addEventListener('click',  () => map.zoomIn());
    document.getElementById('btn-zoom-out').addEventListener('click', () => map.zoomOut());

    document.getElementById('btn-back').addEventListener('click', () => {
        document.getElementById('panel-details').classList.remove('active');
        document.getElementById('panel-welcome').classList.add('active');
        map.flyTo([20, 10], 3, { duration: 1.5 });
        activeSite = null;
    });

    document.getElementById('btn-fav').addEventListener('click', () => {
        if (!activeSite) return;
        toggleFav(getSiteId(activeSite));
    });

    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.addEventListener('click', e => {
            document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
            e.currentTarget.classList.add('active');
            currentView = e.currentTarget.dataset.view;
            document.getElementById('view-explore').style.display   = currentView === 'explore'   ? 'flex' : 'none';
            document.getElementById('view-favorites').style.display = currentView === 'favorites' ? 'block' : 'none';
        });
    });

    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', e => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
            e.currentTarget.classList.add('active');
            document.getElementById(e.currentTarget.dataset.tab).classList.add('active');
        });
    });
}

// ── 13. HELPERS ───────────────────────────────
function parseCoord(val) {
    if (val === undefined || val === null) return null;
    const num = parseFloat(String(val).replace(',', '.'));
    return isNaN(num) ? null : num;
}

function getSiteId(site) {
    return site.id_no ?? site.unique_number ?? null;
}

// ── START ─────────────────────────────────────
loadSites();
