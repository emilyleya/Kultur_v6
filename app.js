// =============================================
//  CHRONOS – app.js
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
let currentFilterType = 'all';
let currentFilterVal  = 'all';
let mapMarkers        = [];

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
    // 1. Vorhandene Marker von der Karte entfernen
    mapMarkers.forEach(m => map.removeLayer(m));
    mapMarkers = [];

    // 2. Nur gefilterte Stätten holen
    const filteredSites = getFilteredSites();

    filteredSites.forEach(site => {
        const lat = parseCoord(site.latitude);
        const lng = parseCoord(site.longitude);
        if (lat === null || lng === null) return;

        let icon;
        
        // Wenn Weltwunder -> Goldenes Stern-Icon, sonst Standard-Punkt
        if (isWorldWonder(site)) {
            icon = L.divIcon({
                className: 'wonder-marker',
                html: `<div class="wonder-wrap"><div class="wonder-star-glyph">★</div></div>`,
                iconSize: [24, 24], iconAnchor: [12, 12]
            });
        } else {
            icon = L.divIcon({
                className: 'custom-marker',
                html: `<div class="marker-wrap"><div class="marker-core" style="background:#FF8C42"></div></div>`,
                iconSize: [14, 14], iconAnchor: [7, 7]
            });
        }

        const marker = L.marker([lat, lng], { icon })
            .addTo(map)
            .on('click', () => showDetails(site, [lat, lng]));
            
        mapMarkers.push(marker); // Im Array speichern für spätere Filter-Wechsel
    });
}
function getFilteredSites() {
    return sites.filter(site => {
        if (currentFilterType === 'all') return true;
        
        if (currentFilterType === 'type') {
            if (currentFilterVal === 'wonder') return isWorldWonder(site);
            if (currentFilterVal === 'heritage') return !isWorldWonder(site);
        }
        if (currentFilterType === 'era') {
            return getSiteEra(site) === currentFilterVal;
        }
        if (currentFilterType === 'region') {
            return site.region_en === currentFilterVal;
        }
        return true;
    });
}

function applyFiltering() {
    // Aktualisiert sowohl die Marker auf der Karte als auch die Seitenliste
    addMarkers();
    renderExploreList();
}

// ── 6. WIKIPEDIA SLIDESHOW ────────────────────
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
        // Stufe 1: exakter Titel
        let files = await getImages(siteName);

        // Stufe 2: erste 3 Wörter
        if (files.length === 0) {
            const short = siteName.split(' ').slice(0, 3).join(' ');
            files = await getImages(short);
        }

        // Stufe 3: Volltextsuche
        if (files.length === 0) {
            const found = await searchTitle(siteName);
            if (found) files = await getImages(found);
        }

        if (files.length === 0) return [];

        const urls = await Promise.all(files.slice(0, 5).map(f => getImageUrl(f)));
        return urls.filter(Boolean);
    } catch (err) {
        console.error('Slideshow Fehler:', err);
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

// Ergänzung am Ende von Abschnitt 6: Wikipedia-Text laden
async function fetchWikipediaSummary(siteName) {
    try {
        // Nutzt die TextExtracts API von Wikipedia für sauberen Plaintext (nur Intro)
        const url = `https://en.wikipedia.org/w/api.php?action=query&prop=extracts&exintro=1&explaintext=1&titles=${encodeURIComponent(siteName)}&format=json&origin=*`;
        let res = await fetch(url);
        let data = await res.json();
        let page = Object.values(data.query.pages)[0];
        
        // Stufe 2: Falls unter dem exakten Namen nichts gefunden wurde, über die Suche probieren
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

// ── 7. QUIZ (DYNAMIC & INDIVIDUAL - ENGLISH VERSION) ───
function injectAdvancedQuiz(site, wikiText) {
    const quizContainer = document.getElementById('quiz-placeholder');
    if (!quizContainer) return;

    const quizPool = [];
    const textToSearch = (wikiText + " " + (site.short_description_en || "")).toLowerCase();

    // 1. Century detection
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

    // 2. Architecture & Material
    if (textToSearch.includes("stone") || textToSearch.includes("brick") || textToSearch.includes("marble")) {
        let material = textToSearch.includes("marble") ? "Marble" : textToSearch.includes("brick") ? "Brick" : "Stone / Rock";
        quizPool.push({
            question: `Which primary building material or geological feature is highlighted in the information text?`,
            correct: material,
            wrongs: ["Wooden structures", "Concrete foundations", "Cast iron ornaments"].filter(m => m !== material)
        });
    }

    // 3. Geography (UNESCO Region)
    if (site.region_en) {
        quizPool.push({
            question: `In which official UNESCO region is "${site.site || site.name_en}" geographically classified?`,
            correct: site.region_en,
            wrongs: ['Europe and North America', 'Asia and the Pacific', 'Latin America and the Caribbean', 'Africa', 'Arab States'].filter(r => r !== site.region_en)
        });
    }

    // Fallback: Inscription Year
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

    // Select a random question from the pool
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
    activeSite = site;
    map.flyTo(coords, 11, { duration: 1.6 });

    const id       = getSiteId(site);
    const siteName = site.site || site.name_en || '';

    // Textfelder befüllen
    document.getElementById('detail-country').textContent  = site.states_name_en || 'Weltweit';
    document.getElementById('detail-category').textContent = site.category || 'UNESCO';
    document.getElementById('detail-title').textContent    = siteName;
    document.getElementById('detail-meta').textContent     = `Eingeschrieben: ${site.date_inscribed || '–'}`;
    document.getElementById('btn-fav').textContent         = favorites.includes(id) ? '★' : '☆';

// --- NEU: HIER WIRD NUN DER TEXT UND DAS QUIZ ASYNCHRON GELADEN ---
    const dbDescription = site.short_description_en || 'Keine Beschreibung vorhanden.';
    
    document.getElementById('detail-description').innerHTML = `
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

    // Wikipedia-Text im Hintergrund abrufen und Quiz danach starten
    fetchWikipediaSummary(siteName).then(wikiText => {
        const wikiBlock = document.getElementById('wiki-extended-block');
        const wikiPara = document.getElementById('wiki-extended-text');
        
        if (wikiText && wikiText.trim().length > 10) {
            wikiPara.textContent = wikiText;
            wikiBlock.style.display = 'block';
            // Quiz basierend auf DB + Wiki-Inhalt injizieren
            injectAdvancedQuiz(site, wikiText);
        } else {
            // Fallback: Wenn kein Wiki-Text existiert, nur DB-Daten fürs Quiz nutzen
            injectAdvancedQuiz(site, "");
        }
    });

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

    // ── Panel wechseln (MUSS vor Slideshow sein) ──
    document.getElementById('panel-welcome').classList.remove('active');
    document.getElementById('panel-details').classList.add('active');

    // ── Slideshow laden (Panel ist jetzt im DOM sichtbar) ──
    const slideshowEl = document.getElementById('slideshow');
    if (slideshowEl) {
        slideshowEl.innerHTML = `<div class="slide-loading">Bilder werden geladen…</div>`;
        fetchSlideshow(siteName).then(urls => renderSlideshow(urls)).catch(err => {
            console.error('Slideshow laden fehlgeschlagen:', err);
            slideshowEl.innerHTML = `<div class="slide-loading">Fehler beim Laden der Bilder</div>`;
        });
    }

    earnXP(10);
}

// ── 9. LISTS ──────────────────────────────────
function renderExploreList() {
    const container = document.getElementById('view-explore');
    container.innerHTML = '';
    
    // NEU: Greift nun auf die gefilterten Daten zu statt auf alle
    const displayList = getFilteredSites();
    displayList.slice(0, 150).forEach(site => {
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
// Filter-Chips Event Listener
    document.querySelectorAll('.chip').forEach(chip => {
        chip.addEventListener('click', e => {
            // Aktiven Zustand bei den Knöpfen wechseln
            document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
            e.currentTarget.classList.add('active');
            
            // Filterwerte auslesen
            currentFilterType = e.currentTarget.dataset.filterType;
            currentFilterVal  = e.currentTarget.dataset.filterVal;
            
            // Filterung ausführen
            applyFiltering();
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

function isWorldWonder(site) {
    // Holt den englischen Namen der Stätte aus deiner Datenbank
    const name = (site.site || site.name_en || "").toLowerCase();
    
    // Prüft auf die exakten Begriffe der 7 neuen Weltwunder in der UNESCO-Liste
    return name.includes("great wall") ||          // Chinesische Mauer
           name.includes("petra") ||               // Felsenstadt Petra
           name.includes("rio de janeiro") ||      // Cristo Redentor (unter Rio de Janeiro gelistet)
           name.includes("machu picchu") ||        // Machu Picchu
           name.includes("chichen") ||             // Chichén Itzá
           name.includes("colosseum") ||           // Kolosseum (oder "historic centre of rome")
           name.includes("taj mahal");             // Taj Mahal
}

// ── START ─────────────────────────────────────
loadSites();
