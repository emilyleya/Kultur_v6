// =============================================
//  CHRONOS – app.js (KOMPLETT & REPARIERT)
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
let mapMarkers  = [];

// Kombinierte Filter Speicher
let activeFilters = {
    type: 'all',
    era: 'all',
    region: 'all'
};

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

// ── 5. MARKERS & FILTER LOGIC ─────────────────
const WORLD_WONDERS = [
    {
        name: "Great Wall of China",
        lat: 40.4319,
        lng: 116.5704
    },
    {
        name: "Petra",
        lat: 30.3285,
        lng: 35.4444
    },
    {
        name: "Christ the Redeemer",
        lat: -22.9519,
        lng: -43.2105
    },
    {
        name: "Machu Picchu",
        lat: -13.1631,
        lng: -72.5450
    },
    {
        name: "Chichen Itza",
        lat: 20.6843,
        lng: -88.5678
    },
    {
        name: "Colosseum",
        lat: 41.8902,
        lng: 12.4922
    },
    {
        name: "Taj Mahal",
        lat: 27.1751,
        lng: 78.0421
    }
];

// ── Hilfsfunktionen ───────────────────────────
function isWorldWonder(site) {
    const name = (site.site || site.name_en || '').toLowerCase();
    return WORLD_WONDERS.some(w => w.name.toLowerCase() === name);
}

function getSiteEra(site) {
    const year = parseInt(site.date_inscribed);
    if (!year) return 'all';
    if (year < 500)  return 'ancient';
    if (year < 1500) return 'medieval';
    return 'modern';
}

// ── 5. MARKERS ────────────────────────────────
function addMarkers() {
    mapMarkers.forEach(m => map.removeLayer(m));
    mapMarkers = [];

    // Weltwunder-Marker
    WORLD_WONDERS.forEach(wonder => {
        const wonderSite = {
            site: wonder.name,
            states_name_en: 'World Wonder',
            category: 'New Seven Wonders',
            date_inscribed: null,
            latitude: wonder.lat,
            longitude: wonder.lng,
            short_description_en: '',
            region_en: '',
            area_hectares: '',
            criteria_txt: '',
            id_no: 'wonder_' + wonder.name.replace(/\s+/g, '_')
        };

        const icon = L.divIcon({
            className: 'wonder-marker',
            html: `<div class="wonder-wrap"><div class="wonder-star-glyph">★</div></div>`,
            iconSize: [24, 24], iconAnchor: [12, 12]
        });

        const marker = L.marker([wonder.lat, wonder.lng], { icon })
            .addTo(map)
            .on('click', () => showDetails(wonderSite, [wonder.lat, wonder.lng]));

        mapMarkers.push(marker);
    });

    // UNESCO-Stätten-Marker
    getFilteredSites().forEach(site => {
        const lat = parseCoord(site.latitude);
        const lng = parseCoord(site.longitude);
        if (lat === null || lng === null) return;

        const era = getSiteEra(site);
        let markerColor = '#FF8C42';
        if (era === 'ancient')  markerColor = '#6a241c';
        if (era === 'medieval') markerColor = '#cf6229';
        if (era === 'modern')   markerColor = '#fbbf69';

        const icon = L.divIcon({
            className: 'custom-marker',
            html: `<div class="marker-wrap"><div class="marker-core" style="background:${markerColor}"></div></div>`,
            iconSize: [14, 14], iconAnchor: [7, 7]
        });

        const marker = L.marker([lat, lng], { icon })
            .addTo(map)
            .on('click', () => showDetails(site, [lat, lng]));

        mapMarkers.push(marker);
    });
}

function getFilteredSites() {
    return sites.filter(site => {
        if (activeFilters.type !== 'all') {
            const isWonder = isWorldWonder(site);
            if (activeFilters.type === 'wonder' && !isWonder) return false;
            if (activeFilters.type === 'heritage' && isWonder) return false;
        }
        if (activeFilters.era !== 'all') {
            if (getSiteEra(site) !== activeFilters.era) return false;
        }
        if (activeFilters.region !== 'all') {
            const siteRegion = String(site.region_en || site.region || '').toLowerCase();
            const filterRegion = String(activeFilters.region).toLowerCase();
            if (!siteRegion.includes(filterRegion)) return false;
        }
        return true;
    });
}

function applyFiltering() {
    addMarkers();
    renderExploreList();
}

// ── 6. WIKIPEDIA SLIDESHOW & TEXT ─────────────
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

// ── 7. QUIZ ───────────────────────────────────
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
                wrongs: centuries.filter(c => c !== correctCentury).slice(0, 3)
            });
        }
    }

    if (textToSearch.includes("stone") || textToSearch.includes("brick") || textToSearch.includes("marble")) {
        let material = textToSearch.includes("marble") ? "Marble" : textToSearch.includes("brick") ? "Brick" : "Stone / Rock";
        quizPool.push({
            question: `Which primary building material or geological feature is highlighted in the information text?`,
            correct: material,
            wrongs: ["Wooden structures", "Concrete foundations", "Cast iron ornaments"].filter(m => m !== material)
        });
    }

    if (site.region_en) {
        quizPool.push({
            question: `In which official UNESCO region is "${site.site || site.name_en}" geographically classified?`,
            correct: site.region_en,
            wrongs: ['Europe and North America', 'Asia and the Pacific', 'Latin America and the Caribbean', 'Africa', 'Arab States'].filter(r => r !== site.region_en)
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
            wrongs: [...yearWrongs]
        });
    }

    if (quizPool.length === 0) return;
    const selectedQuiz = quizPool[Math.floor(Math.random() * quizPool.length)];
    const options = [selectedQuiz.correct, ...selectedQuiz.wrongs].sort(() => Math.random() - 0.5);

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

// ── 8. DETAILS ────────────────────────────────
async function showDetails(site, coords) {
    if (!site) return;
    activeSite = site;
    
    // Sidebar wieder reinschieben, falls sie geschlossen war
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
    if (metaEl)     metaEl.textContent     = `Eingeschrieben: ${site.date_inscribed || '–'}`;
    if (favBtnEl)   favBtnEl.textContent   = favorites.includes(id) ? '★' : '☆';

    // Standardmäßig aktivieren wir beim Öffnen immer den "Beschreibung"-Tab visuell
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    const descTabBtn = document.querySelector('[data-tab="tab-desc"]');
    if (descTabBtn) descTabBtn.classList.add('active');

    // Wir leeren den Geodaten-Container zuerst komplett aus dem Sichtfeld!
    const geoEl = document.getElementById('detail-geodata');
    if (geoEl) geoEl.innerHTML = '';

    const dbDescription = site.short_description_en || 'Keine Beschreibung vorhanden.';
    
    // Erstbefüllung von TAB 1 (Beschreibung)
    const descEl = document.getElementById('detail-description');
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

// ── 9. LISTS ──────────────────────────────────
function renderExploreList() {
    const container = document.getElementById('view-explore');
    if (!container) return;
    container.innerHTML = '';
    
    const displayList = getFilteredSites();
    displayList.slice(0, 150).forEach(site => {
        const id    = getSiteId(site);
        const isFav = favorites.includes(id);
        
        // Ermittle die Epoche für die dynamische Farbe des Listen-Dots
        const era = getSiteEra(site);
        let dotColor = '#FF8C42'; // Fallback
        if (era === 'ancient')  dotColor = '#6a241c';
        if (era === 'medieval') dotColor = '#cf6229';
        if (era === 'modern')   dotColor = '#fbbf69';

        const btn   = document.createElement('button');
        btn.className = 'site-item';
        btn.style.color = dotColor; // WECHSEL: Der gesamte Eintrag teilt dem Stern seine Farbe mit
        btn.className = 'site-item';
        btn.innerHTML = `
            <span class="site-dot" style="color: ${dotColor}">●</span>
            <div class="site-body">
                <div class="site-name">${site.site || site.name_en || 'Unbekannte Stätte'}</div>
                <div class="site-meta">${site.states_name_en || 'Weltweit'} · ${site.date_inscribed || '–'}</div>
            </div>
            <button class="site-fav" data-id="${id}">${isFav ? '★' : '☆'}</button>
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
    document.getElementById('fav-count').textContent = favorites.length;
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
        item.style.color = dotColor; // WECHSEL: Auch in den Favoriten erbt der Stern die Farbe
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

// ── 12. EVENTS ────────────────────────────────
function updateXP() {
    const xpPointsEl = document.getElementById('xp-points');
    const xpFillEl = document.getElementById('xp-fill');
    if (xpPointsEl) xpPointsEl.textContent = userXP;
    if (xpFillEl) {
        const pct = Math.min((userXP % 500) / 500 * 100, 100);
        xpFillEl.style.width = pct + '%';
    }
}

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

    // Kombinierter Filter Event-Listener
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', e => {
            const type = e.currentTarget.dataset.filterType;
            const val  = e.currentTarget.dataset.filterVal;
            
            if (type === 'all') {
                activeFilters.type = 'all';
                activeFilters.era = 'all';
                activeFilters.region = 'all';
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                document.querySelector('[data-filter-val="all"]').classList.add('active');
            } else {
                document.querySelector('[data-filter-val="all"]').classList.remove('active');
                
                if (e.currentTarget.classList.contains('active')) {
                    e.currentTarget.classList.remove('active');
                    activeFilters[type] = 'all';
                    
                    const anyActive = Object.values(activeFilters).some(v => v !== 'all');
                    if (!anyActive) document.querySelector('[data-filter-val="all"]').classList.add('active');
                } else {
                    document.querySelectorAll(`.filter-btn[data-filter-type="${type}"]`).forEach(b => b.classList.remove('active'));
                    e.currentTarget.classList.add('active');
                    activeFilters[type] = val;
                }
            }
            applyFiltering();
        });
    });

  // Steuerung für das saubere Umschalten und Leeren der Tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', e => {
            if (!activeSite) return;
            
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            e.currentTarget.classList.add('active');
            
            const targetTab = e.currentTarget.dataset.tab;
            const descEl = document.getElementById('detail-description');
            const geoEl = document.getElementById('detail-geodata');
            
            if (targetTab === 'tab-desc') {
                // Wenn wir auf Beschreibung klicken -> Geodaten löschen!
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
                
                // Wikipedia & Quiz im Beschreibungstab re-initialisieren
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
                // Wenn wir auf Geodaten klicken -> Beschreibung und Quiz radikal löschen!
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

    // Event-Listener zum Ein- und Ausklappen der Seitenleiste
    const sidebar = document.querySelector('.sidebar');
    const toggleBtn = document.getElementById('btn-toggle-sidebar');
    
    if (toggleBtn && sidebar) {
        toggleBtn.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
            // Leaflet mitteilen, dass sich der Container geändert hat
            setTimeout(() => { map.invalidateSize(); }, 400);
        });
    }
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

function getSiteEra(site) {
    const text = ((site.short_description_en || "") + " " + (site.site || "")).toLowerCase();
    if (text.includes("ancient") || text.includes("bc") || text.includes("roman empire") || text.includes("greek")) {
        return "ancient";
    }
    if (text.includes("medieval") || text.includes("monastery") || text.includes("century castle") || text.includes("dynasty")) {
        return "medieval";
    }
    return "modern";
}

// ── START ─────────────────────────────────────
loadSites();

// ══════════════════════════════════════════════════════════════
//  VIRTUAL TOUR SYSTEM
// ══════════════════════════════════════════════════════════════

// ── TOUR DATA ─────────────────────────────────
// Struktur: Pro Stätte eine Array von Stationen.
// 'id' entspricht der site.id_no oder einem Schlüsselwort im Namen.
// Passe Texte und Koordinaten hier jederzeit an.

const TOUR_DATA = {
    // ── BEISPIEL 1: Kolosseum ──────────────────
    "colosseum": {
        mapCenter: [12.4922, 41.8902],
        defaultZoom: 16,
        stations: [
            {
                tag: "Einführung",
                title: "Das Flavische Amphitheater",
                coords: [12.4922, 41.8902],
                zoom: 16,
                pitch: 50,
                bearing: 30,
                text: "Das Kolosseum – offiziell Amphitheatrum Flavium – ist das größte je erbaute Amphitheater der Antike. Kaiser Vespasian begann den Bau um 72 n. Chr. auf dem Gelände des künstlichen Sees, der zuvor zum Goldenen Haus Neros gehörte. Die Wahl dieses symbolisch aufgeladenen Ortes war eine bewusste politische Botschaft: Das Volk zurückerobert, was der Tyrann einst für sich beansprucht hatte.",
                facts: [
                    { icon: "📐", label: "Maße", text: "188 m lang, 156 m breit, 48 m hoch" },
                    { icon: "👥", label: "Kapazität", text: "50.000–80.000 Zuschauer" }
                ]
            },
            {
                tag: "Ingenieurskunst",
                title: "Das Hypogäum",
                coords: [12.4933, 41.8905],
                zoom: 17,
                pitch: 60,
                bearing: -20,
                text: "Unter dem Boden der Arena erstreckte sich das Hypogäum – ein zweistöckiges Labyrinth aus Gängen, Käfigen und Aufzugsschächten. 80 senkrechte Schächte ermöglichten es, Tiere und Gladiatoren wie durch Zauberhand direkt in der Mitte der Arena erscheinen zu lassen. Die Mechanismen wurden von Hunderten Sklaven bedient, die unsichtbar unter den Füßen des jubelnden Publikums arbeiteten.",
                facts: [
                    { icon: "⚙️", label: "Technik", text: "80 Aufzugsschächte mit Gegengewichten" },
                    { icon: "🦁", label: "Tiere", text: "Löwen, Tiger, Elefanten und Nashörner" }
                ]
            },
            {
                tag: "Verfall & Erbe",
                title: "Vom Steinbruch zum Welterbe",
                coords: [12.4915, 41.8898],
                zoom: 16,
                pitch: 45,
                bearing: 90,
                text: "Nach dem Ende der Spiele im 6. Jahrhundert verfiel das Kolosseum langsam. Im Mittelalter diente es als Steinbruch: Schätzungsweise zwei Drittel des originalen Materials wurden entfernt, um Roms Kirchen und Paläste zu erbauen. Der berühmte Petersdom soll Steine aus dem Kolosseum enthalten. Erst 1749 erklärte Papst Benedikt XIV. die Stätte zum heiligen Boden und stoppte den Abbau.",
                facts: [
                    { icon: "⛪", label: "Zweck im MA", text: "Steinbruch, Festung, Wohnquartier" },
                    { icon: "🏛️", label: "UNESCO", text: "Welterbe seit 1980" }
                ]
            }
        ]
    },

    // ── BEISPIEL 2: Angkor Wat ─────────────────
    "angkor": {
        mapCenter: [103.8469, 13.3667],
        defaultZoom: 15,
        stations: [
            {
                tag: "Der Tempel",
                title: "Angkor Wat – Weltbild in Stein",
                coords: [103.8469, 13.3667],
                zoom: 15,
                pitch: 50,
                bearing: 10,
                text: "Angkor Wat wurde im frühen 12. Jahrhundert unter König Suryavarman II. als staatlicher Tempel errichtet. Der Komplex ist nach Westen ausgerichtet – ungewöhnlich für hinduistische Tempel – was von manchen Historikern als Hinweis auf eine funeräre Funktion gedeutet wird. Der Westteil gilt in der indischen Kosmologie als Reich der Toten und der untergehenden Sonne.",
                facts: [
                    { icon: "📅", label: "Erbaut", text: "ca. 1113–1150 n. Chr." },
                    { icon: "🌐", label: "Fläche", text: "1.626 km² (gesamtes Angkor-Areal)" }
                ]
            },
            {
                tag: "Das Wassersystem",
                title: "Hydraulische Meisterleistung",
                coords: [103.8550, 13.3580],
                zoom: 14,
                pitch: 55,
                bearing: 45,
                text: "Das Geheimnis von Angkors Macht lag nicht nur in seinen Tempeln, sondern unter ihnen: Ein ausgeklügeltes Netz aus Kanälen, Dämmen und riesigen Speicherseen (Barays) versorgte eine Metropole von fast einer Million Menschen mit Wasser. Neueste LiDAR-Untersuchungen aus Hubschraubern enthüllten 2015 die wahre Ausdehnung der versteckten Stadt – sie war größer als jede europäische Metropole des Mittelalters.",
                facts: [
                    { icon: "💧", label: "West Baray", text: "8 km × 2,2 km – größtes Reservoir" },
                    { icon: "🛰️", label: "LiDAR 2015", text: "Nachweis von Vorstadt-Strukturen auf 3.000 km²" }
                ]
            },
            {
                tag: "Bas-Reliefs",
                title: "Die Galerie der Geschichte",
                coords: [103.8469, 13.3615],
                zoom: 16,
                pitch: 40,
                bearing: -30,
                text: "Die unteren Galerien von Angkor Wat sind mit über 800 Metern flachreliefierter Erzählung ausgestattet – das längste zusammenhängende Bas-Relief-Panorama der Welt. Szenen aus dem Mahabharata und Ramayana wechseln sich ab mit historischen Darstellungen, die Suryavarmans Heer beim Marsch zeigen. Eine Szene zeigt die 37 Höllen des hinduistischen Kosmosmodells in erschreckend plastischer Detailtreue.",
                facts: [
                    { icon: "🎨", label: "Länge", text: "ca. 800 m Bas-Relief ohne Unterbrechung" },
                    { icon: "🪨", label: "Material", text: "Sandstein aus dem Kulen-Gebirge, 40 km entfernt" }
                ]
            }
        ]
    },

    // ── FALLBACK / GENERIC ─────────────────────
    "default": {
        mapCenter: [0, 20],
        defaultZoom: 4,
        stations: [
            {
                tag: "Station 1",
                title: "Überblick",
                coords: [0, 20],
                zoom: 4,
                pitch: 30,
                bearing: 0,
                text: "Willkommen zur virtuellen Tour. Scrolle durch die Stationen, um die Karte rechts zu steuern und historische Hintergrundinformationen zu entdecken.",
                facts: [
                    { icon: "🗺️", label: "Navigation", text: "Scrolle im linken Bereich, um zur nächsten Station zu springen" }
                ]
            },
            {
                tag: "Station 2",
                title: "Historischer Kontext",
                coords: [10, 25],
                zoom: 5,
                pitch: 45,
                bearing: 20,
                text: "Jede Station kann individuell mit Text, Fakten-Karten und genauen GPS-Koordinaten bestückt werden. Passe die TOUR_DATA-Objekte in app.js an, um echte Inhalte einzubinden.",
                facts: [
                    { icon: "📝", label: "Anpassung", text: "Bearbeite TOUR_DATA in app.js" }
                ]
            },
            {
                tag: "Station 3",
                title: "Abschluss",
                coords: [20, 30],
                zoom: 6,
                pitch: 50,
                bearing: -10,
                text: "Die 3D-Karte fliegt automatisch zu den Koordinaten jeder Station, wenn diese in den sichtbaren Bereich scrollt. Der Pitch- und Bearing-Wert kann pro Station individuell gesetzt werden.",
                facts: [
                    { icon: "🌍", label: "MapTiler", text: "3D Outdoor-Karte mit Geländedarstellung" }
                ]
            }
        ]
    }
};

// ── TOUR STATE ────────────────────────────────
let tourMap3D       = null;
let tourActive      = false;
let tourObserver    = null;
let currentStation  = 0;

// ── FIND TOUR DATA FOR A SITE ─────────────────
function getTourDataForSite(site) {
    if (!site) return TOUR_DATA.default;
    const name = (site.site || site.name_en || '').toLowerCase();
    for (const key of Object.keys(TOUR_DATA)) {
        if (key !== 'default' && name.includes(key)) return TOUR_DATA[key];
    }
    // Try lat/lng fallback to build a 3-stop tour centered on the site
    const lat = parseCoord(site.latitude);
    const lng = parseCoord(site.longitude);
    if (lat !== null && lng !== null) {
        return buildGenericTour(site, lat, lng);
    }
    return TOUR_DATA.default;
}

function buildGenericTour(site, lat, lng) {
    const siteName = site.site || site.name_en || 'Diese Stätte';
    const desc     = site.short_description_en || 'Eine bedeutende UNESCO-Welterbestätte.';
    return {
        mapCenter: [lng, lat],
        defaultZoom: 13,
        stations: [
            {
                tag: "Einführung",
                title: siteName,
                coords: [lng, lat],
                zoom: 13,
                pitch: 50,
                bearing: 20,
                text: desc,
                facts: [
                    { icon: "📅", label: "Eingeschrieben", text: String(site.date_inscribed || '–') },
                    { icon: "🌐", label: "Land", text: site.states_name_en || '–' }
                ]
            },
            {
                tag: "Lage & Umgebung",
                title: "Geografischer Kontext",
                coords: [lng + 0.01, lat + 0.005],
                zoom: 14,
                pitch: 55,
                bearing: -20,
                text: `${siteName} befindet sich in ${site.states_name_en || 'einer außergewöhnlichen Kulturlandschaft'} und wurde ${site.date_inscribed || ''} als UNESCO-Welterbestätte anerkannt. Die Stätte ist einzigartig in ihrer Art und repräsentiert ein unersetzliches Zeugnis menschlicher Geschichte und Kreativität.`,
                facts: [
                    { icon: "📍", label: "Region", text: site.region_en || '–' },
                    { icon: "🏷️", label: "Kategorie", text: site.category || '–' }
                ]
            },
            {
                tag: "Bedeutung",
                title: "Universeller Wert",
                coords: [lng - 0.008, lat - 0.004],
                zoom: 15,
                pitch: 45,
                bearing: 60,
                text: `Der außergewöhnliche universelle Wert dieser Stätte liegt in ihrer einzigartigen Kombination aus historischer Bedeutung, architektonischer Leistung und kultureller Kontinuität. Sie gehört zu den ${site.region_en || 'weltweiten'} Zeugnissen, die für zukünftige Generationen bewahrt werden müssen.`,
                facts: [
                    { icon: "🏛️", label: "UNESCO-Kriterium", text: site.criteria_txt || 'Außergewöhnlicher Universeller Wert' },
                    { icon: "🌍", label: "Welterbe seit", text: String(site.date_inscribed || '–') }
                ]
            }
        ]
    };
}

// ── OPEN TOUR OVERLAY ─────────────────────────
function openTourOverlay() {
    if (!activeSite) return;
    const tourData = getTourDataForSite(activeSite);

    const overlay = document.getElementById('tour-overlay');
    const siteName = activeSite.site || activeSite.name_en || 'Tour';
    document.getElementById('tour-site-name').textContent = siteName;

    // Render station cards
    renderTourStations(tourData.stations);

    // Show overlay
    overlay.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    tourActive = true;
    currentStation = 0;

    // Init or re-use MapLibre map
    // Small delay so the overlay is rendered before init
    requestAnimationFrame(() => {
        initTourMap(tourData);
    });
}

// ── RENDER STATION CARDS ─────────────────────
function renderTourStations(stations) {
    const container = document.getElementById('tour-stations');
    container.innerHTML = '';
    stations.forEach((s, i) => {
        const div = document.createElement('div');
        div.className = 'tour-station' + (i === 0 ? ' active' : '');
        div.dataset.index = i;
        div.innerHTML = `
            <div class="tour-station-header">
                <div class="tour-station-number">${i + 1}</div>
                <div class="tour-station-meta">
                    <div class="tour-station-tag">${s.tag}</div>
                    <div class="tour-station-title">${s.title}</div>
                    <div class="tour-station-coords">${s.coords[1].toFixed(4)}° N, ${s.coords[0].toFixed(4)}° E</div>
                </div>
            </div>
            <div class="tour-station-body">
                <p class="tour-station-text">${s.text}</p>
                <div class="tour-station-facts">
                    ${s.facts.map(f => `
                        <div class="tour-fact">
                            <span class="tour-fact-icon">${f.icon}</span>
                            <div><strong>${f.label}</strong>${f.text}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        container.appendChild(div);
    });
}

// ── INIT MAPLIBRE MAP ─────────────────────────
function initTourMap(tourData) {
    const mapEl = document.getElementById('tour-map-3d');

    // Destroy previous instance if exists
    if (tourMap3D) {
        tourMap3D.remove();
        tourMap3D = null;
    }

    tourMap3D = new maplibregl.Map({
        container: 'tour-map-3d',
        style: 'https://api.maptiler.com/maps/outdoor-v4/style.json?key=3b0cyHPw2Nrpd03F4W9d',
        center: tourData.mapCenter,
        zoom: tourData.defaultZoom,
        pitch: 50,
        bearing: 30,
        antialias: true
    });

    tourMap3D.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'bottom-right');

    tourMap3D.on('load', () => {
        // Fly to first station once loaded
        const first = tourData.stations[0];
        flyToStation(first, 0, tourData.stations.length);
        setupScrollObserver(tourData.stations);
    });
}

// ── FLY TO STATION ────────────────────────────
function flyToStation(station, index, total) {
    if (!tourMap3D) return;

    tourMap3D.flyTo({
        center: station.coords,
        zoom: station.zoom,
        pitch: station.pitch,
        bearing: station.bearing,
        duration: 2800,
        essential: true
    });

    // Update badge
    const badge = document.getElementById('tour-map-badge-text');
    if (badge) badge.textContent = station.title;

    // Update progress bar
    const fill = document.getElementById('tour-progress-fill');
    const label = document.getElementById('tour-progress-label');
    if (fill) fill.style.width = `${((index + 1) / total) * 100}%`;
    if (label) label.textContent = `Station ${index + 1} / ${total}`;

    // Highlight active station card
    document.querySelectorAll('.tour-station').forEach((el, i) => {
        el.classList.toggle('active', i === index);
    });

    currentStation = index;
}

// ── INTERSECTION OBSERVER FOR SCROLL ─────────
function setupScrollObserver(stations) {
    if (tourObserver) tourObserver.disconnect();

    const pane = document.getElementById('tour-story-pane');
    const cards = document.querySelectorAll('.tour-station');

    const options = {
        root: pane,
        rootMargin: '-30% 0px -50% 0px',
        threshold: 0
    };

    tourObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const i = parseInt(entry.target.dataset.index);
                if (i !== currentStation) {
                    flyToStation(stations[i], i, stations.length);
                }
            }
        });
    }, options);

    cards.forEach(card => tourObserver.observe(card));
}

// ── CLOSE TOUR OVERLAY ────────────────────────
function closeTourOverlay() {
    const overlay = document.getElementById('tour-overlay');
    overlay.classList.add('fade-out');
    setTimeout(() => {
        overlay.classList.remove('fade-out');
        overlay.classList.add('hidden');
        document.body.style.overflow = '';
        tourActive = false;
        if (tourObserver) { tourObserver.disconnect(); tourObserver = null; }
        // Don't destroy map – keep it for fast re-open
    }, 300);
}

// ── BIND TOUR EVENTS ─────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('btn-start-tour').addEventListener('click', openTourOverlay);
    document.getElementById('btn-close-tour').addEventListener('click', closeTourOverlay);

    // Close on Escape key
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && tourActive) closeTourOverlay();
    });
});
