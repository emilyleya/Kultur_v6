// =============================================
//  CHRONOS – app.js
//  Supabase + Leaflet UNESCO Heritage Map
// =============================================

// ── 1. CONFIG ─────────────────────────────────
const SUPABASE_URL      = 'https://mujciribnacdvoomcrjk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im11amNpcmlibmFjZHZvb21jcmprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzMDUzMjgsImV4cCI6MjA5NTg4MTMyOH0.6Ck0OCyzWh78P77iYj4LqGpVGOfVeC649Qf7KtZ5BDs'; // eyJ... aus Supabase Settings → API

const TILE_LAYERS = {
    light: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png',
    dark:  'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
};

// ── 2. STATE ──────────────────────────────────
let map            = null;
let tileLayer      = null;
let theme          = 'light';
let sites          = [];
let activeSite     = null;
let currentView    = 'explore';
let userXP         = parseInt(localStorage.getItem('chronos_xp'))  || 0;
let favorites      = JSON.parse(localStorage.getItem('chronos_favs')) || [];

// ── 3. SUPABASE ───────────────────────────────
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
async function loadSites() {
    try {
        const { data, error } = await supabaseClient.from('heritage_sites').select('*');
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

// ── 6. LISTS ──────────────────────────────────
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

// —7. WIKIPEDIA BILD ________
Async function loadsWikipediaImage(siteName) {
	const img = document.getElementById('detail-img');
	img.style.opacity = '0.4';

	try {
	const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(siteName)}&prop=pageimages&format=json&pithumbsize=800&origin=*`;
	const res = await fetch(searchUrl);
	const data = await res.json();
	const pages = date.query.pages;
	const page = Object.values(pages)[0];

	if (page && page.thumbnail && page.thumbnail.source) {
		img.src = page.thumbnail.source;
	} else {

	const fallbackUrl = 'https://en.wikipedia.org/w/api.php?
action=query&list=search&rsearch=${encodeURIComponent(siteName)}&prop=pageimages&format=json&origin=*';
	const res2 = await fetch(fallbackUrl)
	const data2 = await res2.json();
	const firstResult =data2.query?.[0];

	if (firstResult) {
		const imgUrl =`https://en.wikipedia.org/w/api.php?
action=query&titels=${encodeURIComponent(firstResult.title)}&prop=pageimages&format=json&pithumbsize=800&origin=*`;
	const res3 = await fetch(imgUrl);
	const data3 = await res3.json();
	const pages3 = data3.query.pages;
	const page3 = Object.values(page3)[0];
	if (page3?.thumbnail?.source) {
		img.src = page3.thumbnail.source;
	} else {
		img src = 'https://images.unsplash.com/photo-155861866-fcd25c85cd64?auto=format&fit=crop&w=800&q=80';
	}
}
} catch (e) {
	img src = 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?aut0=format&fit=crop&w=800&q=80';
	}

			img.style.opacity = ´1´;
}

// ── 7. DETAILS ────────────────────────────────
function showDetails(site, coords) {
    activeSite = site;
    map.flyTo(coords, 11, { duration: 1.6 });

    const id = getSiteId(site);
    document.getElementById('detail-country').textContent  = site.states_name_en || 'Weltweit';
    document.getElementById('detail-category').textContent = site.category || 'UNESCO';
    document.getElementById('detail-title').textContent    = site.site || site.name_en || 'Unbekannt';
    document.getElementById('detail-meta').textContent     = `Eingeschrieben: ${site.date_inscribed || '–'}`;
    document.getElementById('btn-fav').textContent         = favorites.includes(id) ? '★' : '☆';

    document.getElementById('detail-description').innerHTML = `
        <div class="content-block">
            <div class="content-label">UNESCO Beschreibung</div>
            <p class="content-text">${site.short_description_en || 'Keine Beschreibung vorhanden.'}</p>
        </div>
    `;

    document.getElementById('detail-geodata').innerHTML = `
        <div class="content-block">
            <div class="content-label">Geografische Daten</div>
            <p class="content-text">Fläche: ${site.area_hectares || '–'} Hektar</p>
            <p class="content-text">Region: ${site.region_en || '–'}</p>
            <p class="content-text">Kriterien: ${site.criteria_txt || '–'}</p>
        </div>
    `;

    // Reset tabs to first
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    document.querySelector('[data-tab="tab-desc"]').classList.add('active');
    document.getElementById('tab-desc').classList.add('active');

    // Switch panels
    document.getElementById('panel-welcome').classList.remove('active');
    document.getElementById('panel-details').classList.add('active');

    // XP reward
    earnXP(10);
}

// ── 8. FAVORITES ──────────────────────────────
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

// ── 9. XP ─────────────────────────────────────
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

// ── 10. EVENTS ────────────────────────────────
function bindEvents() {

    // Theme toggle
    document.getElementById('btn-theme').addEventListener('click', () => {
        theme = theme === 'light' ? 'dark' : 'light';
        document.body.className = theme === 'dark' ? 'dark' : '';
        tileLayer.setUrl(TILE_LAYERS[theme]);
    });

    // Zoom
    document.getElementById('btn-zoom-in').addEventListener('click',  () => map.zoomIn());
    document.getElementById('btn-zoom-out').addEventListener('click', () => map.zoomOut());

    // Back to overview
    document.getElementById('btn-back').addEventListener('click', () => {
        document.getElementById('panel-details').classList.remove('active');
        document.getElementById('panel-welcome').classList.add('active');
        map.flyTo([20, 10], 3, { duration: 1.5 });
        activeSite = null;
    });

    // Favorite button in details
    document.getElementById('btn-fav').addEventListener('click', () => {
        if (!activeSite) return;
        toggleFav(getSiteId(activeSite));
    });

    // Nav tabs (Entdecken / Gespeichert)
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.addEventListener('click', e => {
            document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
            e.currentTarget.classList.add('active');
            currentView = e.currentTarget.dataset.view;
            document.getElementById('view-explore').style.display    = currentView === 'explore'   ? 'flex' : 'none';
            document.getElementById('view-favorites').style.display  = currentView === 'favorites' ? 'block' : 'none';
        });
    });

    // Content tabs (Beschreibung / Geodaten)
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', e => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
            e.currentTarget.classList.add('active');
            document.getElementById(e.currentTarget.dataset.tab).classList.add('active');
        });
    });
}

// ── 11. HELPERS ───────────────────────────────
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
