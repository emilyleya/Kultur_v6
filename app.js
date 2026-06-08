// 1. Supabase Verbindung initialisieren
const SUPABASE_URL = 'https://mujciribnacdvoomcrjk.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im11amNpcmlibmFjZHZvb21jcmprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzMDUzMjgsImV4cCI6MjA5NTg4MTMyOH0.6Ck0OCyzWh78P77iYj4LqGpVGOfVeC649Qf7KtZ5BDs'; 

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let HERITAGE_DATA = [];

// 2. Daten asynchron aus Supabase laden
async function fetchSitesFromSupabase() {
    try {
        const { data, error } = await supabase
            .from('heritage_sites')
            .select('*');

        if (error) throw error;

        HERITAGE_DATA = data;
        initApp();
        
    } catch (err) {
        console.error("Fehler beim Laden aus Supabase:", err.message);
    }
}

const TILE_LAYERS = {
    light: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png",
    dark:  "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
};

let map, activeTileLayer, currentTheme = "light";
let userXP = parseInt(localStorage.getItem("chronos_xp_v5")) || 0;
let favorites = JSON.parse(localStorage.getItem("chronos_favs_v5")) || [];
let activeSite = null, currentView = "explore";

function initApp() {
    // Falls die Karte bereits existiert, initialisiere sie nicht neu
    if (map) return;

    const bounds = L.latLngBounds(L.latLng(-85,-180), L.latLng(85,180));
    map = L.map("map", {
        zoomControl: false, attributionControl: false,
        minZoom: 2.3, maxBounds: bounds, maxBoundsViscosity: 1.0
    }).setView([20, 10], 3);

    activeTileLayer = L.tileLayer(TILE_LAYERS[currentTheme], { maxZoom: 19, noWrap: true }).addTo(map);

    // Marker auf Basis der frisch geladenen DB-Daten setzen
    HERITAGE_DATA.forEach(site => {
        const lat = parseFlexCoordinate(site.latitude);
        const lng = parseFlexCoordinate(site.longitude);

        if (lat !== null && lng !== null) {
            const coords = [lat, lng];
            L.marker(coords, { icon: createMarkerIcon(site) })
             .addTo(map)
             .on("click", () => selectSite(site, coords));
        }
    });

    updateXPUI();
    renderList();
    renderFavList();
    setupEvents();
}

// Wandelt deutsche Excel-Kommas aus Supabase in Punkte um
function parseFlexCoordinate(val) {
    if (val === undefined || val === null) return null;
    let str = String(val).trim();
    if (!str) return null;
    
    str = str.replace(',', '.');
    const num = parseFloat(str);
    return isNaN(num) ? null : num;
}

function createMarkerIcon(site) {
    return L.divIcon({
        className: "custom-marker",
        html: `<div class="marker-wrap"><div class="marker-core" style="background:#FF8C42"></div></div>`,
        iconSize: [14, 14], iconAnchor: [7, 7]
    });
}

function updateXPUI() {
    if(document.getElementById("xp-points")) document.getElementById("xp-points").textContent = userXP;
    if(document.getElementById("xp-fill")) document.getElementById("xp-fill").style.width = `40%`;
}

function renderList() {
    const container = document.getElementById("quick-list-container");
    if (!container) return;
    container.innerHTML = "";

    // Zeige zur Performance die ersten 150 Welterbestätten der UNESCO
    HERITAGE_DATA.slice(0, 150).forEach(site => {
        const item = document.createElement("button");
        item.className = "quick-item";
        const siteId = site.id_no || site.unique_number;
        const isFav = favorites.includes(siteId);

        item.innerHTML = `
            <div style="font-size: 14px; opacity: 0.5; color:#FF8C42;">●</div>
            <div class="quick-item-body">
                <div class="quick-item-title">${site.site || site.name_en || "Unbekannte Stätte"}</div>
                <div class="quick-item-meta">${site.states_name_en || "Weltweit"} · Seit ${site.date_inscribed || "–"}</div>
            </div>
            <span class="quick-item-fav" style="color:#FF8C42;">${isFav ? "★" : "☆"}</span>
        `;

        item.addEventListener("click", (e) => {
            if (e.target.classList.contains("quick-item-fav")) { toggleFav(siteId); return; }
            const lat = parseFlexCoordinate(site.latitude);
            const lng = parseFlexCoordinate(site.longitude);
            if (lat !== null && lng !== null) selectSite(site, [lat, lng]);
        });

        container.appendChild(item);
    });
}

function toggleFav(id) {
    const idx = favorites.indexOf(id);
    if (idx === -1) favorites.push(id);
    else favorites.splice(idx, 1);
    localStorage.setItem("chronos_favs_v5", JSON.stringify(favorites));
    if(document.getElementById("fav-count")) document.getElementById("fav-count").textContent = favorites.length;
    renderList();
    renderFavList();
    if (activeSite && (activeSite.id_no === id || activeSite.unique_number === id)) {
        if(document.getElementById("btn-favorite")) document.getElementById("btn-favorite").textContent = favorites.includes(id) ? "★" : "☆";
    }
}

function renderFavList() {
    const container = document.getElementById("fav-list-container");
    if (!container) return;
    if(document.getElementById("fav-count")) document.getElementById("fav-count").textContent = favorites.length;
    container.innerHTML = "";
    if (favorites.length === 0) {
        container.innerHTML = `<div class="empty-fav">Noch keine Favoriten</div>`;
        return;
    }
    favorites.forEach(id => {
        const site = HERITAGE_DATA.find(s => s.id_no === id || s.unique_number === id);
        if (!site) return;
        const item = document.createElement("div");
        item.className = "fav-item";
        item.innerHTML = `
            <span style="color:#FF8C42; margin-right: 4px;">●</span>
            <div style="flex: 1; min-width:0;">
                <div class="fav-item-title" style="font-size:13px; font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${site.site || site.name_en}</div>
                <div class="fav-item-country" style="font-size:11px; color:var(--text-secondary);">${site.states_name_en || "Weltweit"}</div>
            </div>
            <span class="fav-remove" style="cursor:pointer; padding:4px;">✕</span>
        `;
        item.addEventListener("click", (e) => {
            if (e.target.classList.contains("fav-remove")) { toggleFav(id); return; }
            const lat = parseFlexCoordinate(site.latitude);
            const lng = parseFlexCoordinate(site.longitude);
            if (lat !== null && lng !== null) selectSite(site, [lat, lng]);
        });
        container.appendChild(item);
    });
}

function setupEvents() {
    document.getElementById("btn-toggle-theme").addEventListener("click", () => {
        currentTheme = currentTheme === "light" ? "dark" : "light";
        document.body.className = currentTheme === "dark" ? "dark-theme" : "";
        activeTileLayer.setUrl(TILE_LAYERS[currentTheme]);
    });

    document.getElementById("btn-zoom-in").addEventListener("click", () => map.zoomIn());
    document.getElementById("btn-zoom-out").addEventListener("click", () => map.zoomOut());

    document.getElementById("btn-close-details").addEventListener("click", () => {
        document.getElementById("panel-details").classList.remove("active");
        setTimeout(() => {
            document.getElementById("panel-welcome").classList.add("active");
            map.flyTo([20, 10], 3, { duration: 1.5 });
            activeSite = null;
        }, 300);
    });

    document.querySelectorAll(".tab-trigger").forEach(tab => {
        tab.addEventListener("click", (e) => {
            document.querySelectorAll(".tab-trigger").forEach(t => t.classList.remove("active"));
            document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));
            e.currentTarget.classList.add("active");
            document.getElementById(e.currentTarget.dataset.tab).classList.add("active");
        });
    });

    document.querySelectorAll(".nav-tab").forEach(tab => {
        tab.addEventListener("click", (e) => {
            document.querySelectorAll(".nav-tab").forEach(t => t.classList.remove("active"));
            e.currentTarget.classList.add("active");
            currentView = e.currentTarget.dataset.view;
            document.getElementById("view-explore").style.display = currentView === "explore" ? "block" : "none";
            document.getElementById("view-favorites").style.display = currentView === "favorites" ? "block" : "none";
        });
    });
}

function selectSite(site, coords) {
    activeSite = site;
    map.flyTo(coords, 11, { duration: 1.6 });

    const siteId = site.id_no || site.unique_number;
    document.getElementById("site-country").textContent = site.states_name_en || "Weltweit";
    document.getElementById("site-category").textContent = site.category || "UNESCO";
    document.getElementById("site-title").textContent = site.site || site.name_en || "Unbekannt";
    document.getElementById("site-meta").textContent = `Eingeschrieben seit: ${site.date_inscribed || "–"}`;
    document.getElementById("btn-favorite").textContent = favorites.includes(siteId) ? "★" : "☆";

    document.getElementById("gallery-img-active").src = `https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?auto=format&fit=crop&w=800&q=80`;

    document.getElementById("site-context-dynamic").innerHTML = `
        <div class="content-section">
            <div class="content-heading">UNESCO Beschreibung</div>
            <p style="font-size:13px; line-height:1.6; color:var(--text-secondary);">${site.short_description_en || "Keine englische Beschreibung hinterlegt."}</p>
        </div>
    `;
    
    document.getElementById("site-details-dynamic").innerHTML = `
        <div class="content-section">
            <div class="content-heading">Geografische Daten</div>
            <p style="font-size:13px; margin-bottom:4px;">Fläche: ${site.area_hectares || "0"} Hektar</p>
            <p style="font-size:13px;">Region: ${site.region_en || "Global"} · Kriterien: ${site.criteria_txt || "–"}</p>
        </div>
    `;

    document.querySelectorAll(".tab-trigger").forEach(t => t.classList.remove("active"));
    document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));
    document.querySelector('[data-tab="tab-context"]').classList.add("active");
    document.getElementById("tab-context").classList.add("active");

    document.getElementById("panel-welcome").classList.remove("active");
    setTimeout(() => document.getElementById("panel-details").classList.add("active"), 300);
}
