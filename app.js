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
function addMarkers() {
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
            // Ermittle die Epoche für die dynamische Farbe des Punktes
            const era = getSiteEra(site);
            let markerColor = '#FF8C42'; // Fallback-Farbe
            
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
            const siteRegion = String(site.region_en || site.region || "").toLowerCase();
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
    activeSite = site;
