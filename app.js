// =============================================
//  CHRONOS – app.js (KOMPLETT & STRUKTURIERT)
// =============================================

// ── 1. CONFIG ─────────────────────────────────
const SUPABASE_URL      = 'https://mujciribnacdvoomcrjk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im11amNpcmlibmFjZHZvb21jcmprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzMDUzMjgsImV4cCI6MjA5NTg4MTMyOH0.6Ck0OCyzWh78P77iYj4LqGpVGOfVeC649Qf7KtZ5BDs';

const TILE_LAYERS = {
    light: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png',
    dark:  'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
};

// ── 2. STATE ──────────────────────────────────
let map         = null;
let tileLayer   = null;
let theme       = 'light';
let sites       = [];
let activeSite  = null;
let currentView = 'explore';
let userXP      = parseInt(localStorage.getItem('chronos_xp'))    || 0;
let favorites   = JSON.parse(localStorage.getItem('chronos_favs')) || [];
let mapMarkers  = []; // Globale Variable für die Marker auf der Karte
let lastRank    = "Archivar";

let activeFilters = {
    type: 'all',
    era: 'all',
    region: 'all'
};
let searchQuery = '';

// ── 3.  WONDERS CONFIG (Muss VOR den Funktionen stehen!) ──
const WORLD_WONDERS = [
{
    id: "wonder_great_wall",
    site: "Great Wall of China",
    latitude: 40.4319,
    longitude: 116.5704,
    states_name_en: "China",
    category: "Seven Wonders",
    date_inscribed: "2007",
    type: "wonder"
},
{
    id: "wonder_petra",
    site: "Petra",
    latitude: 30.3285,
    longitude: 35.4444,
    states_name_en: "Jordan",
    category: "Seven Wonders",
    date_inscribed: "2007",
    type: "wonder"
},
{
    id: "wonder_christ",
    site: "Christ the Redeemer",
    latitude: -22.9519,
    longitude: -43.2105,
    states_name_en: "Brazil",
    category: "Seven Wonders",
    date_inscribed: "2007",
    type: "wonder"
},
{
    id: "wonder_machu",
    site: "Machu Picchu",
    latitude: -13.1631,
    longitude: -72.5450,
    states_name_en: "Peru",
    category: "Seven Wonders",
    date_inscribed: "2007",
    type: "wonder"
},
{
    id: "wonder_chichen",
    site: "Chichen Itza",
    latitude: 20.6843,
    longitude: -88.5678,
    states_name_en: "Mexico",
    category: "Seven Wonders",
    date_inscribed: "2007",
    type: "wonder"
},
{
    id: "wonder_colosseum",
    site: "Colosseum",
    latitude: 41.8902,
    longitude: 12.4922,
    states_name_en: "Italy",
    category: "Seven Wonders",
    date_inscribed: "2007",
    type: "wonder"
},
{
    id: "wonder_taj",
    site: "Taj Mahal",
    latitude: 27.1751,
    longitude: 78.0421,
    states_name_en: "India",
    category: "Seven Wonders",
    date_inscribed: "2007",
    type: "wonder"
}
];

// ── 4. SUPABASE ───────────────────────────────
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function loadSites() {
    try {
        const { data, error } = await supabaseClient.from('heritage_sites').select('*');
        if (error) throw error;
        sites = [
            ...data,
            ...WORLD_WONDERS
        ];
        initApp();
    } catch (err) {
        console.error('Supabase Fehler:', err.message);
    }
}

// ── 5. INIT ───────────────────────────────────
function initApp() {
    initMap();
    updateMarkers(); 
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

// ── 6. Hilfsfunktionen ───────────────────────────
function isWorldWonder(site) {
    return site.type === "wonder";
}

function getSiteEra(site) {
    if (!site) return 'modern';
    const text = ((site.short_description_en || '') + ' ' + (site.site || '') + ' ' + (site.justification_en || '')).toLowerCase();
    if (text.includes(' bc') || text.includes('ancient') || text.includes('roman empire') || text.includes('greek') || text.includes('prehistoric') || text.includes('neolithic') || text.includes('bronze age') || text.includes('iron age') || text.includes('pharaoh') || text.includes('mesopotamia') || text.includes('classical antiquity')) return 'ancient';
    if (text.includes('medieval') || text.includes('middle ages') || text.includes('monastery') || text.includes('gothic') || text.includes('byzantine') || text.includes('ottoman') || text.includes('dynasty') || text.includes('feudal') || text.includes('crusader') || text.includes('romanesque') || text.includes('renaissance') || text.includes('baroque')) return 'medieval';
    return 'modern';
}

function getFilteredSites() {
    return sites.filter(site => {
        // Typfilter
        if (activeFilters.type !== 'all') {
            const wonder = isWorldWonder(site);
            if (activeFilters.type === 'wonder' && !wonder) return false;
            if (activeFilters.type === 'heritage' && wonder) return false;
        }

        // Epochenfilter
        if (activeFilters.era !== 'all') {
            if (getSiteEra(site) !== activeFilters.era) return false;
        }

        // Regionsfilter
        if (activeFilters.region !== 'all') {
            const siteRegion = String(site.region_en || site.region || '').toLowerCase();
            const filterRegion = String(activeFilters.region).toLowerCase();
            if (!siteRegion.includes(filterRegion)) return false;
        }

        // Suchfilter
        if (searchQuery.trim() !== '') {
            const q = searchQuery.toLowerCase();
            const name = String(site.site || site.name_en || '').toLowerCase();
            const country = String(site.states_name_en || '').toLowerCase();
            if (!name.includes(q) && !country.includes(q)) return false;
        }

        return true;
    });
}

// ── 7. MARKERS & FILTER LOGIC ─────────────────
function updateMarkers() {
    if (!map) return;

    mapMarkers.forEach(m => map.removeLayer(m));
    mapMarkers = [];

    const filteredSites = getFilteredSites();

    filteredSites.forEach(site => {
        const lat = parseCoord(site.latitude);
        const lng = parseCoord(site.longitude);
        if (lat === null || lng === null) return;

        let icon;
        if (isWorldWonder(site)) {
            icon = L.divIcon({
                className: 'wonder-marker',
                html: `<div class="wonder-wrap"><div class="wonder-star-glyph">★</div></div>`,
                iconSize: [24, 24], iconAnchor: [12, 12]
            });
        } else {
            const era = getSiteEra(site);
            let markerColor = '#FF8C42'; 
            
            if (era === 'ancient')  markerColor = '#6a241c'; 
            if (era === 'medieval') markerColor = '#cf6229'; 
            if (era === 'modern')   markerColor = '#fbbf69'; 

            icon = L.divIcon({
                className: 'custom-marker',
                html: `<div class="marker-wrap"><div class="marker-core" style="background:${markerColor}"></div></div>`,
                iconSize: [14, 14], iconAnchor: [7, 7]
            });
        }

        const marker = L.marker([lat, lng], { icon })
            .addTo(map)
            .on('click', () => showDetails(site, [lat, lng]));
            
        mapMarkers.push(marker);
    });
}

function applyFiltering() {
    updateMarkers();
    renderExploreList();
}

// ── 8. WIKIPEDIA SLIDESHOW & TEXT ─────────────
async function fetchSlideshow(siteName) {
    const isPhoto = t => /\.(jpg|jpeg|png|JPG|JPEG|PNG)$/.test(t) &&
                         !/(flag|logo|map|coat|arms|icon|locator|location|seal|blank|relief)/i.test(t);

    async function getImages(title) {
        const url = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=images&format=json&imlimit=10&origin=*`;
        const res  = await fetch(url);
        const data = await res.json();
        const page = Object.values(data.query.pages)[0];
        return (page?.images || []).map(i => i.title).filter(isPhoto);
    }

    async function getImageUrl(fileTitle) {
        const url = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(fileTitle)}&prop=imageinfo&iiprop=url&iiurlwidth=700&format=json&origin=*`;
        const res  = await fetch(url);
        const data = await res.json();
        const page = Object.values(data.query.pages)[0];
        return page?.imageinfo?.[0]?.thumburl || null;
    }

    async function searchTitle(name) {
        const url = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(name)}&srlimit=1&format=json&origin=*`;
        const res  = await fetch(url);
        const data = await res.json();
        return data.query?.search?.[0]?.title || null;
    }

    try {
        let files = await getImages(siteName);
        if (files.length === 0) {
            const short = siteName.split(' ').slice(0, 3).join(' ');
            files = await getImages(short);
        }
        if (files.length === 0) {
            const found = await searchTitle(siteName);
            if (found) files = await getImages(found);
        }
        if (files.length === 0) return [];
        const urls = await Promise.all(files.slice(0, 5).map(f => getImageUrl(f)));
        return urls.filter(Boolean);
    } catch {
        return [];
    }
}

function renderSlideshow(urls) {
    const el = document.getElementById('slideshow');
    if (!el) return;

    if (urls.length === 0) {
        el.innerHTML = `<div class="slide-loading">Kein Bild verfügbar</div>`;
        return;
    }

    let current = 0;
    function render() {
        el.innerHTML = `
            <img class="slide-img" src="${urls[current]}" alt="Bild ${current + 1}">
            ${urls.length > 1 ? `
                <button class="slide-btn slide-prev" id="slide-prev">&#8249;</button>
                <button class="slide-btn slide-next" id="slide-next">&#8250;</button>
                <div class="slide-dots">
                    ${urls.map((_, i) => `<span class="slide-dot${i === current ? ' active' : ''}"></span>`).join('')}
                </div>
            ` : ''}
        `;
        if (urls.length > 1) {
            document.getElementById('slide-prev').onclick = () => { current = (current - 1 + urls.length) % urls.length; render(); };
            document.getElementById('slide-next').onclick = () => { current = (current + 1) % urls.length; render(); };
        }
    }
    render();
}

async function fetchWikipediaSummary(siteName) {
    try {
        const url = `https://en.wikipedia.org/w/api.php?action=query&prop=extracts&exintro=1&explaintext=1&titles=${encodeURIComponent(siteName)}&format=json&origin=*`;
        let res = await fetch(url);
        let data = await res.json();
        let page = Object.values(data.query.pages)[0];
        
        if (!page || page.missing !== undefined) {
            const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(siteName)}&srlimit=1&format=json&origin=*`;
            const searchRes = await fetch(searchUrl);
            const searchData = await searchRes.json();
            const title = searchData.query?.search?.[0]?.title;
            
            if (title) {
                const retryUrl = `https://en.wikipedia.org/w/api.php?action=query&prop=extracts&exintro=1&explaintext=1&titles=${encodeURIComponent(title)}&format=json&origin=*`;
                res = await fetch(retryUrl);
                data = await res.json();
                page = Object.values(data.query.pages)[0];
            }
        }
        return page?.extract || null;
    } catch {
        return null;
    }
}

// ── 9. QUIZ ───────────────────────────────────
function injectAdvancedQuiz(site, wikiText) {
    const quizContainer = document.getElementById('quiz-placeholder');
    if (!quizContainer) return;

    const quizPool = [];
    const textToSearch = (wikiText + " " + (site.short_description_en || "")).toLowerCase();

    if (textToSearch.includes("century")) {
        let correctCentury = "Unknown";
        const centuries = ["12th century", "13th century", "14th century", "15th century", "16th century", "17th century", "18th century", "19th century"];
        for (let c of centuries) {
            if (textToSearch.includes(c)) { correctCentury = c; break; }
        }
        if (correctCentury !== "Unknown") {
            quizPool.push({
                question: `According to historical records, in which century did this site play a significant role?`,
                correct: correctCentury,
                wrong: centuries.filter(c => c !== correctCentury).slice(0, 3)
            });
        }
    }

    if (textToSearch.includes("stone") || textToSearch.includes("brick") || textToSearch.includes("marble")) {
        let material = textToSearch.includes("marble") ? "Marble" : textToSearch.includes("brick") ? "Brick" : "Stone / Rock";
        quizPool.push({
            question: `Which primary building material or geological feature is highlighted in the information text?`,
            correct: material,
            wrong: ["Wooden structures", "Concrete foundations", "Cast iron ornaments"].filter(m => m !== material)
        });
    }

    if (site.region_en) {
        quizPool.push({
            question: `In which official UNESCO region is "${site.site || site.name_en}" geographically classified?`,
            correct: site.region_en,
            wrong: ['Europe and North America', 'Asia and the Pacific', 'Latin America and the Caribbean', 'Africa', 'Arab States'].filter(r => r !== site.region_en)
        });
    }

    const correctYear = parseInt(site.date_inscribed);
    if (correctYear) {
        const yearWrongs = new Set();
        while (yearWrongs.size < 3) {
            const offset = (Math.floor(Math.random() * 5) + 1) * (Math.random() < 0.5 ? -1 : 1);
            const y = correctYear + offset;
            if (y !== correctYear && y >= 1978 && y <= 2025) yearWrongs.add(String(y));
        }
        quizPool.push({
            question: `In which year was this site officially inscribed onto the UNESCO World Heritage list?`,
            correct: String(correctYear),
            wrong: [...yearWrongs]
        });
    }

    if (quizPool.length === 0) return;
    const selectedQuiz = quizPool[Math.floor(Math.random() * quizPool.length)];
    const options = [selectedQuiz.correct, ...selectedQuiz.wrong].sort(() => Math.random() - 0.5);

    quizContainer.innerHTML = `
        <div class="quiz-card" id="quiz-card">
            <div class="quiz-label">🎯 Knowledge Check – Earn XP</div>
            <div class="quiz-question">${selectedQuiz.question}</div>
            <div class="quiz-options">
                ${options.map(opt => `<button class="quiz-opt" data-chosen="${opt}" data-correct="${selectedQuiz.correct}">${opt}</button>`).join('')}
            </div>
            <div class="quiz-result" id="quiz-result" style="display:none"></div>
        </div>
    `;
    bindQuizEvents();
}

function bindQuizEvents() {
    document.querySelectorAll('.quiz-opt').forEach(btn => {
        btn.addEventListener('click', e => {
            const chosen  = e.currentTarget.dataset.chosen;
            const correct = e.currentTarget.dataset.correct;
            const isRight = chosen === correct;
            
            document.querySelectorAll('.quiz-opt').forEach(b => {
                b.disabled = true;
                if (b.dataset.chosen === correct) b.classList.add('quiz-correct');
                else if (b === e.currentTarget && !isRight) b.classList.add('quiz-wrong');
            });
            
            const result = document.getElementById('quiz-result');
            result.style.display = 'block';
            if (isRight) {
                earnXP(25);
                result.innerHTML = '✅ Correct analysis! +25 XP credited.';
                result.style.color = '#2e7d32';
            } else {
                result.innerHTML = `❌ Not quite. The correct answer is: <strong>${correct}</strong>.`;
                result.style.color = '#c62828';
            }
        });
    });
}

function getRank(xp) {
    if (xp < 100) return "Novize";
    if (xp < 300) return "Chronist";
    if (xp < 600) return "Forscher";
    if (xp < 1000) return "Kartograf";
    if (xp < 2000) return "Archäologe";
    return "Archivar";
}

// Fallback, falls showLevelUp global aufgerufen wird, aber im HTML/CSS fehlt
function showLevelUp(rank) {
    console.log("🎉 Level Up! Neuer Rang:", rank);
    // Hier kannst du optional eine kleine Alert-Box oder Animation triggern
}

// ── 10. DETAILS ────────────────────────────────
async function showDetails(site, coords) {
    if (!site) return;
    activeSite = site;
    
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) sidebar.classList.remove('collapsed');
    
    if (map) map.flyTo(coords, 11, { duration: 1.6 });

    const id       = getSiteId(site);
    const siteName = site.site || site.name_en || '';

    const countryEl  = document.getElementById('detail-country');
    const categoryEl = document.getElementById('detail-category');
    const titleEl    = document.getElementById('detail-title');
    const metaEl     = document.getElementById('detail-meta');
    const favBtnEl   = document.getElementById('btn-fav');

    if (countryEl)  countryEl.textContent  = site.states_name_en || 'Weltweit';
    if (categoryEl) categoryEl.textContent = site.category || 'UNESCO';
    if (titleEl)    titleEl.textContent    = siteName;
    if (metaEl)     metaEl.textContent     = `registered: ${site.date_inscribed || '–'}`;
    if (favBtnEl)   favBtnEl.textContent   = favorites.includes(id) ? '★' : '☆';

    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    const descTabBtn = document.querySelector('[data-tab="tab-desc"]');
    if (descTabBtn) descTabBtn.classList.add('active');

    const geoEl = document.getElementById('detail-geodata');
    if (geoEl) geoEl.innerHTML = '';

    const dbDescription = site.short_description_en || 'Keine Beschreibung vorhanden.';
    
    const descEl = document.getElementById('detail-description');
    if (descEl) {
        descEl.innerHTML = `
            <div class="content-block">
                <div class="content-label">UNESCO description</div>
                <p class="content-text">${dbDescription}</p>
            </div>
            <div class="content-block" id="wiki-extended-block" style="display:none">
                <div class="content-label">Extended Information</div>
                <p class="content-text" id="wiki-extended-text">Lade zusätzliche Details...</p>
            </div>
            <div id="quiz-placeholder"></div>
        `;
    }

    const panelWelcome = document.getElementById('panel-welcome');
    const panelDetails = document.getElementById('panel-details');
    if (panelWelcome) panelWelcome.classList.remove('active');
    if (panelDetails) panelDetails.classList.add('active');

    const slideshowEl = document.getElementById('slideshow');
    if (slideshowEl) {
        slideshowEl.innerHTML = `<div class="slide-loading">Bilder werden geladen…</div>`;
        fetchSlideshow(siteName).then(urls => renderSlideshow(urls));
    }

    fetchWikipediaSummary(siteName).then(wikiText => {
        const wikiBlock = document.getElementById('wiki-extended-block');
        const wikiPara = document.getElementById('wiki-extended-text');
        if (wikiText && wikiText.trim().length > 10) {
            if (wikiPara) wikiPara.textContent = wikiText;
            if (wikiBlock) wikiBlock.style.display = 'block';
            injectAdvancedQuiz(site, wikiText);
        } else {
            injectAdvancedQuiz(site, "");
        }
    });

    earnXP(10);
}

// ── 11. LISTS ──────────────────────────────────
function renderExploreList() {
    const container = document.getElementById('view-explore');
    if (!container) return;
    container.innerHTML = '';
    
    const displayList = getFilteredSites();
    displayList.slice(0, 150).forEach(site => {
        const id    = getSiteId(site);
        const isFav = favorites.includes(id);
        
        const era = getSiteEra(site);
        let dotColor = '#FF8C42'; 
        
        if (era === 'ancient')  dotColor = '#6a241c'; 
        if (era === 'medieval') dotColor = '#cf6229'; 
        if (era === 'modern')   dotColor = '#fbbf69'; 

        const btn   = document.createElement('button');
        btn.className = 'site-item';
        
        btn.innerHTML = `
            <span class="site-dot" style="color: ${dotColor}">●</span>
            <div class="site-body">
                <div class="site-name">${site.site || site.name_en || 'Unbekannte Stätte'}</div>
                <div class="site-meta">${site.states_name_en || 'Weltweit'} · ${site.date_inscribed || '–'}</div>
            </div>
            <button class="site-fav" data-id="${id}" style="color: ${dotColor}">${isFav ? '★' : '☆'}</button>
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
    if (!container) return;
    
    const countEl = document.getElementById('fav-count');
    if (countEl) countEl.textContent = favorites.length;

    container.innerHTML = '';
    if (favorites.length === 0) {
        container.innerHTML = '<div class="empty-state">Noch keine Favoriten hinzugefügt.</div>';
        return;
    }
    favorites.forEach(id => {
        const site = sites.find(s => getSiteId(s) === id);
        if (!site) return;

        const era = getSiteEra(site);
        let dotColor = '#FF8C42';
        if (era === 'ancient')  dotColor = '#6a241c';
        if (era === 'medieval') dotColor = '#cf6229';
        if (era === 'modern')   dotColor = '#fbbf69';

        const item = document.createElement('button');
        item.className = 'site-item';
        item.innerHTML = `
            <span class="site-dot" style="color: ${dotColor}">●</span>
            <div class="site-body">
                <div class="site-name">${site.site || site.name_en}</div>
                <div class="site-meta">${site.states_name_en || 'Weltweit'}</div>
            </div>
            <button class="site-fav" data-id="${id}">✕</button>
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

// ── 12. FAVORITES ─────────────────────────────
function toggleFav(id) {
    const idx = favorites.indexOf(id);
    if (idx === -1) favorites.push(id);
    else favorites.splice(idx, 1);
    localStorage.setItem('chronos_favs', JSON.stringify(favorites));
    renderExploreList();
    renderFavList();
    
    const favBtnEl = document.getElementById('btn-fav');
    if (favBtnEl && activeSite && getSiteId(activeSite) === id) {
        favBtnEl.textContent = favorites.includes(id) ? '★' : '☆';
    }
}

// ── 13. XP ────────────────────────────────────
function earnXP(amount) {
    userXP += amount;
    localStorage.setItem('chronos_xp', userXP);
    updateXP();
}

// ── 14. EVENTS ────────────────────────────────
function updateXP() {
    const xpPointsEl = document.getElementById('xp-points');
    const xpFillEl = document.getElementById('xp-fill');
    const rankEl = document.getElementById('xp-rank');

    if (xpPointsEl) xpPointsEl.textContent = userXP;

    const newRank = getRank(userXP);
    if (rankEl) rankEl.textContent = newRank;

    if (xpFillEl) {
        const pct = Math.min((userXP % 500) / 500 * 100, 100);
        xpFillEl.style.width = pct + '%';
    }

    if (newRank !== lastRank) {
        lastRank = newRank;
        showLevelUp(newRank);
    }
}

function bindEvents() {
    const searchInput = document.getElementById('site-search');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value;
            applyFiltering();
        });

        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                searchQuery = e.target.value.trim();
                applyFiltering();
            }
        });
        searchInput.addEventListener('input', () => {
            map.closePopup?.();
        });
    }

    // Submit-Absicherung
    document.addEventListener('submit', (e) => { e.preventDefault(); });

    // Buttons absichern & registrieren
    const btnTheme = document.getElementById('btn-theme');
    if (btnTheme) {
        btnTheme.addEventListener('click', () => {
            theme = theme === 'light' ? 'dark' : 'light';
            document.body.className = theme === 'dark' ? 'dark' : '';
            tileLayer.setUrl(TILE_LAYERS[theme]);
        });
    }

    const btnZoomIn = document.getElementById('btn-zoom-in');
    if (btnZoomIn) btnZoomIn.addEventListener('click', () => map.zoomIn());

    const btnZoomOut = document.getElementById('btn-zoom-out');
    if (btnZoomOut) btnZoomOut.addEventListener('click', () => map.zoomOut());

    const btnBack = document.getElementById('btn-back');
    if (btnBack) {
        btnBack.addEventListener('click', () => {
            document.getElementById('panel-details').classList.remove('active');
            document.getElementById('panel-welcome').classList.add('add', 'active');
            map.flyTo([20, 10], 3, { duration: 1.5 });
            activeSite = null;
        });
    }
  
    const btnFav = document.getElementById('btn-fav');
    if (btnFav) {
        btnFav.addEventListener('click', () => {
            if (!activeSite) return;
            toggleFav(getSiteId(activeSite));
        });
    }

    const btnResetXp = document.getElementById('btn-reset-xp');
    if (btnResetXp) {
        btnResetXp.addEventListener('click', () => {
            userXP = 0;
            localStorage.setItem('chronos_xp', userXP);
            updateXP();
        });
    }
   
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.addEventListener('click', e => {
            document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
            e.currentTarget.classList.add('active');
            currentView = e.currentTarget.dataset.view;
            
            const exploreView = document.getElementById('view-explore');
            const favView = document.getElementById('view-favorites');
            if (exploreView) exploreView.style.display = currentView === 'explore' ? 'flex' : 'none';
            if (favView) favView.style.display = currentView === 'favorites' ? 'block' : 'none';
        });
    });

    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', e => {
            const type = e.currentTarget.dataset.filterType;
            const val  = e.currentTarget.dataset.filterVal;
            
            if (type === 'all') {
                activeFilters.type = 'all';
                activeFilters.era = 'all';
                activeFilters.region = 'all';
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                const allBtn = document.querySelector('[data-filter-val="all"]');
                if (allBtn) allBtn.classList.add('active');
            } else {
                const allBtn = document.querySelector('[data-filter-val="all"]');
                if (allBtn) allBtn.classList.remove('active');
                
                if (e.currentTarget.classList.contains('active')) {
                    e.currentTarget.classList.remove('active');
                    activeFilters[type] = 'all';
                    
                    const anyActive = Object.values(activeFilters).some(v => v !== 'all');
                    if (!anyActive && allBtn) allBtn.classList.add('active');
                } else {
                    document.querySelectorAll(`.filter-btn[data-filter-type="${type}"]`).forEach(b => b.classList.remove('active'));
                    e.currentTarget.classList.add('active');
                    activeFilters[type] = val;
                }
            }
            applyFiltering();
        });
    });

    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', e => {
            if (!activeSite) return;
            
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            e.currentTarget.classList.add('active');
            
            const targetTab = e.currentTarget.dataset.tab;
            const descEl = document.getElementById('detail-description');
            const geoEl = document.getElementById('detail-geodata');
            
            if (targetTab === 'tab-desc') {
                if (geoEl) geoEl.innerHTML = '';
                
                const dbDescription = activeSite.short_description_en || 'Keine Beschreibung vorhanden.';
                if (descEl) {
                    descEl.innerHTML = `
                        <div class="content-block">
                            <div class="content-label">UNESCO Beschreibung</div>
                            <p class="content-text">${dbDescription}</p>
                        </div>
                        <div class="content-block" id="wiki-extended-block" style="display:none">
                            <div class="content-label">Erweiterte Informationen (Wikipedia)</div>
                            <p class="content-text" id="wiki-extended-text">Lade zusätzliche Details...</p>
                        </div>
                        <div id="quiz-placeholder"></div>
                    `;
                }
                
                const siteName = activeSite.site || activeSite.name_en || '';
                fetchWikipediaSummary(siteName).then(wikiText => {
                    const wikiBlock = document.getElementById('wiki-extended-block');
                    const wikiPara = document.getElementById('wiki-extended-text');
                    if (wikiText && wikiText.trim().length > 10) {
                        if (wikiPara) wikiPara.textContent = wikiText;
                        if (wikiBlock) wikiBlock.style.display = 'block';
                        injectAdvancedQuiz(activeSite, wikiText);
                    } else {
                        injectAdvancedQuiz(activeSite, "");
                    }
                });
                
            } else if (targetTab === 'tab-geo') {
                if (descEl) descEl.innerHTML = '';
                if (geoEl) {
                    geoEl.innerHTML = `
                        <div class="content-block">
                            <div class="content-label">Geografische Daten</div>
                            <p class="content-text"><strong>Fläche:</strong> ${activeSite.area_hectares || '–'} Hektar</p>
                            <p class="content-text"><strong>Region:</strong> ${activeSite.region_en || '–'}</p>
                        </div>
                    `;
                }
            }
        });
    });

    const sidebar = document.querySelector('.sidebar');
    const toggleBtn = document.getElementById('btn-toggle-sidebar');
    if (toggleBtn && sidebar) {
        toggleBtn.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
            setTimeout(() => { map.invalidateSize(); }, 400);
        });
    }

    // Virtuelle Tour Buttons
    const btnStartTour = document.getElementById('btn-start-tour');
    if (btnStartTour) btnStartTour.addEventListener('click', openTourOverlay);

    const btnCloseTour = document.getElementById('btn-close-tour');
    if (btnCloseTour) btnCloseTour.addEventListener('click', closeTourOverlay);
}

// ── 15. HELPERS ───────────────────────────────
function parseCoord(val) {
    if (val === undefined || val === null) return null;
    const num = parseFloat(String(val).replace(',', '.'));
    return isNaN(num) ? null : num;
}

function getSiteId(site) {
    if (!site) return null;
    return site.id || site.id_no || site.unique_number || null;
}

// ── VIRTUAL TOUR SYSTEM ─────────────────────────
const TOUR_DATA = {
    "colosseum": {
        mapCenter: [12.4922, 41.8902],
        defaultZoom: 16,
        stations: [
            {
                tag: "Introduction",
                title: "Das Flavische Amphitheater",
                coords: [12.4922, 41.8902],
                zoom: 16, pitch: 50, bearing: 30,
                text: "Das Kolosseum – offiziell Amphitheatrum Flavium – ist das größte je erbaute Amphitheater der Antike...",
                facts: [
                    { icon: "📐", label: "Maße", text: "188 m lang, 156 m breit, 48 m hoch" },
                    { icon: "👥", label: "Kapazität", text: "50.000–80.000 Zuschauer" }
                ]
            }
        ]
    },
    "default": {
        mapCenter: [0, 20],
        defaultZoom: 4,
        stations: [
            {
                tag: "Station 1",
                title: "Überblick",
                coords: [0, 20],
                zoom: 4, pitch: 30, bearing: 0,
                text: "Willkommen zur virtuellen Tour. Scrolle durch die Stationen, um die Karte rechts zu steuern.",
                facts: [{ icon: "🗺️", label: "Navigation", text: "Scrolle im linken Bereich" }]
            }
        ]
    }
};

let tourMap3D       = null;
let tourActive      = false;
let tourObserver    = null;
let currentStation  = 0;

function getTourDataForSite(site) {
    if (!site) return TOUR_DATA.default;
    const name = (site.site || site.name_en || '').toLowerCase();
    for (const key of Object.keys(TOUR_DATA)) {
        if (key !== 'default' && name.includes(key)) return TOUR_DATA[key];
    }
    const lat = parseCoord(site.latitude);
    const lng = parseCoord(site.longitude);
    if (lat !== null && lng !== null) {
        return buildGenericTour(site, lat, lng);
    }
    return TOUR_DATA.default;
}

function buildGenericTour(site, lat, lng) {
    const siteName = site.site || site.name_en || 'This Site';
    const desc = site.short_description_en || 'An important UNESCO World Heritage Site.';
    const country = site.states_name_en || '–';
    const region = site.region_en || '–';
    const year = site.date_inscribed || '–';
    const area = site.area_hectares || '–';

    return {
        mapCenter: [lng, lat],
        defaultZoom: 12,
        stations: [
            {
                tag: "Introduction",
                title: siteName,
                coords: [lng, lat],
                zoom: 10, pitch: 40, bearing: 0,
                text: desc,
                facts: [{ icon: "🌍", label: "Country", text: country }]
            },
            {
                tag: "Landscape",
                title: "Landscape & Setting",
                coords: [lng + 0.05, lat + 0.03],
                zoom: 8, pitch: 60, bearing: 60,
                text: `${siteName} is closely connected to its surrounding landscape and cultural environment, which shaped its development over centuries.`,
                facts: [{ icon: "🗺️", label: "Region", text: region }]
            },
            {
                tag: "Perspective",
                title: "A Different View",
                coords: [lng - 0.03, lat + 0.02],
                zoom: 12, pitch: 75, bearing: 140,
                text: `Viewed from different perspectives, ${siteName} reveals why it is considered part of humanity's shared heritage.`,
                facts: [{ icon: "📏", label: "Area", text: area + " ha" }]
            },
            {
                tag: "History",
                title: "Historical Significance",
                coords: [lng + 0.02, lat - 0.03],
                zoom: 13, pitch: 65, bearing: 220,
                text: `${siteName} reflects important chapters of human history and preserves traditions, architecture, or natural values that continue to inspire today.`,
                facts: [{ icon: "🏛️", label: "UNESCO since", text: year }]
            },
            {
                tag: "Legacy",
                title: "A Legacy for Future Generations",
                coords: [lng, lat],
                zoom: 11, pitch: 85, bearing: 320,
                text: `Today, ${siteName} stands as a symbol of global heritage and remains protected for future generations to discover and appreciate.`,
                facts: [{ icon: "✨", label: "Status", text: "World Heritage Site" }]
            }
        ]
    };
}

function openTourOverlay() {
    if (!activeSite) return;
    const tourData = getTourDataForSite(activeSite);
    const overlay = document.getElementById('tour-overlay');
    if (!overlay) return;
    
    document.getElementById('tour-site-name').textContent = activeSite.site || activeSite.name_en || 'Tour';

    renderTourStations(tourData.stations);
    overlay.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    tourActive = true;
    currentStation = 0;

    requestAnimationFrame(() => { initTourMap(tourData); });
}

function renderTourStations(stations) {
    const container = document.getElementById('tour-stations');
    if (!container) return;
    container.innerHTML = '';

    stations.forEach((s, i) => {
        const div = document.createElement('div');
        div.className = 'tour-station' + (i === 0 ? ' active' : '');
        div.dataset.index = i;
        div.style.cursor = 'pointer';

        div.innerHTML = `
            <div class="tour-station-header">
                <div class="tour-station-number">${i + 1}</div>
                <div class="tour-station-meta">
                    <div class="tour-station-tag">${s.tag}</div>
                    <div class="tour-station-title">${s.title}</div>
                </div>
            </div>
            <div class="tour-station-body">
                <p class="tour-station-text">${s.text}</p>
            </div>
        `;

        div.addEventListener('click', () => {
            document.querySelectorAll('.tour-station').forEach(card => card.classList.remove('active'));
            div.classList.add('active');
            flyToStation(s, i, stations.length);
            updateTourProgress(i, stations.length);
            div.scrollIntoView({ behavior: "smooth", block: "center" });
        });

        container.appendChild(div);
    });
}
    
function updateTourProgress(index, total) {
    const fill = document.getElementById('tour-progress-fill');
    const label = document.getElementById('tour-progress-label');
    const pct = ((index + 1) / total) * 100;

    if (fill) fill.style.width = pct + '%';
    if (label) label.textContent = `Station ${index + 1} / ${total}`;
}

function initTourMap(tourData) {
    if (tourMap3D) { tourMap3D.remove(); tourMap3D = null; }
    tourMap3D = new maplibregl.Map({
        container: 'tour-map-3d',
        style: 'https://api.maptiler.com/maps/outdoor-v4/style.json?key=3b0cyHPw2Nrpd03F4W9d',
        center: tourData.mapCenter,
        zoom: tourData.defaultZoom,
        pitch: 50, bearing: 30, antialias: true
    });
    tourMap3D.on('load', () => {
        if (tourData.stations.length > 0) {
            flyToStation(tourData.stations[0], 0, tourData.stations.length);
            setupScrollObserver(tourData.stations);
        }
    });
}

function flyToStation(station, index, total) {
    if (!tourMap3D) return;

    tourMap3D.flyTo({
        center: station.coords,
        zoom: station.zoom,
        pitch: station.pitch,
        bearing: station.bearing,
        duration: 2800
    });

    const badge = document.getElementById('tour-map-badge-text');
    if (badge) badge.textContent = station.title;

    currentStation = index;
    updateTourProgress(index, total);

    document.querySelectorAll('.tour-station').forEach(card => card.classList.remove('active'));
    const activeCard = document.querySelector(`.tour-station[data-index="${index}"]`);

    if (activeCard) {
        activeCard.classList.add('active');
        activeCard.scrollIntoView({ behavior: "smooth", block: "center" });
    }
}

function setupScrollObserver(stations) {
    if (tourObserver) tourObserver.disconnect();
    const pane = document.getElementById('tour-story-pane');
    const cards = document.querySelectorAll('.tour-station');
    if (!pane || cards.length === 0) return;

    tourObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const i = parseInt(entry.target.dataset.index);
                if (i !== currentStation) flyToStation(stations[i], i, stations.length);
            }
        });
    }, { root: pane, rootMargin: '-30% 0px -50% 0px' });
    cards.forEach(card => tourObserver.observe(card));
}

function closeTourOverlay() {
    const overlay = document.getElementById('tour-overlay');
    if (!overlay) return;
    overlay.classList.add('fade-out');
    setTimeout(() => {
        overlay.classList.remove('fade-out'); 
        overlay.classList.add('hidden');
        document.body.style.overflow = ''; 
        tourActive = false;
        if (tourObserver) { tourObserver.disconnect(); tourObserver = null; }
    }, 300);
}

// ── DOM READY START TRIGGER ─────────────────────
document.addEventListener('DOMContentLoaded', () => {
    // Esc-Key Absicherung
    document.addEventListener('keydown', e => { 
        if (e.key === 'Escape' && tourActive) closeTourOverlay(); 
    });
    
    // Startet das Laden erst, wenn das Dokument bereit ist
    loadSites();
});
