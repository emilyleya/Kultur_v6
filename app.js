// 1. Supabase Verbindung initialisieren
const SUPABASE_URL = 'https://mujciribnacdvoomcrjk.supabase.co'; 
const SUPABASE_ANON_KEY = 'sb_publishable_sJdttu5UqUqDsLEyT52wqA_07I0Fs2J'; 

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Diese Variable wird dynamisch aus der Cloud befüllt
let HERITAGE_DATA = [];

// 2. Funktion: Daten asynchron aus Supabase laden
async function fetchSitesFromSupabase() {
    try {
        const { data, error } = await supabase
            .from('heritage_sites')
            .select('*');

        if (error) throw error;

        HERITAGE_DATA = data;
        
        // Erst wenn die Daten erfolgreich da sind, starten wir die App!
        initApp();
        
    } catch (err) {
        console.error("Fehler beim Laden der UNESCO-Daten:", err.message);
        alert("Datenbank-Verbindung fehlgeschlagen. Siehe Konsole.");
    }
}

const EPOCH_COLORS = {
    ancient:  "#a32a2a",
    medieval: "#b8860b",
    modern:   "#2e6f40",
    new:      "#1b4f8a"
};

const TILE_LAYERS = {
    light: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
    dark:  "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
};

let map, activeTileLayer;
let currentTheme = "light";
let userXP = parseInt(localStorage.getItem("chronos_xp_v5")) || 0;
let claimedSites = JSON.parse(localStorage.getItem("chronos_claimed_v5")) || [];
let favorites = JSON.parse(localStorage.getItem("chronos_favs_v5")) || [];
let activeSite = null;
let activeFilter = "all";
let activeSort = "default";
let currentView = "explore";

// 3. Den App-Start anpassen
document.addEventListener("DOMContentLoaded", () => {
    fetchSitesFromSupabase();
});

function initApp() {
    const bounds = L.latLngBounds(L.latLng(-85,-180), L.latLng(85,180));
    map = L.map("map", {
        zoomControl: false, attributionControl: false,
        minZoom: 2.2, maxBounds: bounds, maxBoundsViscosity: 1.0
    }).setView([22, 18], 3);

    activeTileLayer = L.tileLayer(TILE_LAYERS[currentTheme], { maxZoom: 19, noWrap: true }).addTo(map);

    // Marker auf Basis der frisch geladenen DB-Daten setzen
    HERITAGE_DATA.forEach(site => {
        if (site.latitude && site.longitude) {
            const coords = [parseFloat(site.latitude), parseFloat(site.longitude)];
            const marker = createMarker(site, coords);
            marker.addTo(map).on("click", () => selectSite(site));
        }
    });

    updateXPUI();
    renderList();
    renderFavList();
    setupEvents();
    initTimeSlider();
}

function createMarker(site, coords) {
    // Falls die Kategorie "wonder" im Feld 'category' vorkommt
    if (site.category && site.category.toLowerCase().includes("wonder")) {
        const icon = L.divIcon({
            className: "wonder-marker",
            html: `<div class="wonder-wrap"><div class="wonder-star-glyph">★</div><div class="wonder-ring"></div></div>`,
            iconSize: [24, 24], iconAnchor: [12, 12]
        });
        return L.marker(coords, { icon });
    } else {
        const icon = L.divIcon({
            className: "custom-marker",
            html: `<div class="marker-wrap">
                     <div class="marker-core" style="background:var(--theme-medieval)"></div>
                     <div class="marker-ring" style="background:var(--theme-medieval)33"></div>
                   </div>`,
            iconSize: [18, 18], iconAnchor: [9, 9]
        });
        return L.marker(coords, { icon });
    }
}

function updateXPUI() {
    if(document.getElementById("xp-points")) document.getElementById("xp-points").textContent = userXP;
    const ranks = [[0,"Novize"],[150,"Entdecker"],[300,"Analyst"],[600,"Elite-Forscher"],[900,"Groß-Archivar"]];
    let rank = "Novize";
    for (const [threshold, name] of ranks) { if (userXP >= threshold) rank = name; }
    if(document.getElementById("rank-badge")) document.getElementById("rank-badge").textContent = rank;
    if(document.getElementById("xp-bar-fill")) document.getElementById("xp-bar-fill").style.width = `${Math.min((userXP/900)*100,100)}%`;
}

function getFilteredSorted() {
    let data = [...HERITAGE_DATA];
    if (activeSort === "name") data.sort((a,b) => (a.site || "").localeCompare(b.site || "", "de"));
    return data;
}

function renderList() {
    const container = document.getElementById("quick-list-container");
    if (!container) return;
    const data = getFilteredSorted();
    container.innerHTML = "";
    if (data.length === 0) {
        container.innerHTML = `<p style="font-size:12px;color:var(--text-muted);text-align:center;padding:16px;font-style:italic">Keine Stätten vorhanden.</p>`;
        return;
    }
    data.forEach(site => {
        const item = document.createElement("button");
        item.className = "quick-item";
        const isFav = favorites.includes(site.id || site.id_no);

        item.innerHTML = `
            <div class="quick-item-icon">●</div>
            <div class="quick-item-body">
                <div class="quick-item-title">${site.site || "Unbekannt"}</div>
                <div class="quick-item-meta">${site.states || "Unbekannt"} · Welterbe seit: ${site.date_inscribed || "–"}</div>
            </div>
            <span class="fav-star-mini ${isFav ? 'active' : ''}">★</span>
        `;

        item.addEventListener("click", (e) => {
            if (e.target.classList.contains("fav-star-mini")) { toggleFav(site.id || site.id_no); return; }
            selectSite(site);
        });

        container.appendChild(item);
    });
}

function toggleFav(id) {
    const idx = favorites.indexOf(id);
    if (idx === -1) favorites.push(id);
    else favorites.splice(idx, 1);
    localStorage.setItem("chronos_favs_v5", JSON.stringify(favorites));
    renderList();
    renderFavList();
}

function renderFavList() {
    const container = document.getElementById("fav-list-container");
    if (!container) return;
    container.innerHTML = "";
    if (favorites.length === 0) {
        container.innerHTML = `<div class="empty-fav">Noch keine Lesezeichen gesetzt.</div>`;
        return;
    }
    favorites.forEach(id => {
        const site = HERITAGE_DATA.find(s => (s.id || s.id_no) === id);
        if (!site) return;
        const item = document.createElement("div");
        item.className = "fav-item";
        item.innerHTML = `
            <span style="font-size:13px; color:var(--text-muted)">●</span>
            <span class="fav-item-title">${site.site || "Unbekannt"}</span>
            <span class="fav-item-country">${site.states || "Unbekannt"}</span>
            <span class="fav-remove">✕</span>
        `;
        item.addEventListener("click", (e) => {
            if (e.target.classList.contains("fav-remove")) { toggleFav(id); return; }
            selectSite(site);
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
            map.flyTo([22, 18], 3, { duration: 1.2 });
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

    document.getElementById("btn-favorite").addEventListener("click", () => {
        if (activeSite) toggleFav(activeSite.id || activeSite.id_no);
    });
}

function selectSite(site) {
    activeSite = site;
    const coords = [parseFloat(site.latitude), parseFloat(site.longitude)];
    map.flyTo(coords, 14, { duration: 1.4 });

    document.getElementById("site-country").textContent = site.states || "Unbekannt";
    document.getElementById("site-category").textContent = "UNESCO Welterbe";
    document.getElementById("site-title").textContent = site.site || "Unbekannt";
    document.getElementById("site-year").textContent = `Aufnahmejahr: ${site.date_inscribed || "–"}`;

    document.getElementById("btn-favorite").textContent = favorites.includes(site.id || site.id_no) ? "★" : "☆";

    const mainImg = document.getElementById("gallery-img-active");
    // Da die UNESCO-Tabelle keine Bild-URLs hat, nutzen wir ein Platzhalterbild basierend auf dem Namen
    mainImg.src = `https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?auto=format&fit=crop&w=800&q=80`;
    
    document.getElementById("site-context-dynamic").innerHTML = `
        <div class="info-section-title">UNESCO Beschreibung</div>
        <p class="body-text">${site.short_description || "Keine Beschreibung verfügbar."}</p>
        <div class="source-box">Kategorie: ${site.category || "Kulturerbe"} · Region: ${site.region_en || "Global"}</div>
    `;
    
    document.getElementById("site-anecdote-text").textContent = `Diese Stätte erfüllt die UNESCO-Kriterien Nummer: ${site.criteria_txt || "–"}`;

    document.getElementById("panel-welcome").classList.remove("active");
    setTimeout(() => document.getElementById("panel-details").classList.add("active"), 200);
}

function initTimeSlider() {
    const slider = document.getElementById("time-slider");
    const label = document.getElementById("time-label");
    if(slider && label) {
        slider.addEventListener("input", (e) => {
            label.textContent = e.target.value == 0 ? "Gegenwart" : `Zeitreise`;
        });
    }
}
