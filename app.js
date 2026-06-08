/**
 * CHRONOS Engine - Modern Minimalist Interactive Storytelling Core
 */

// 1. Supabase Verbindung initialisieren
const SUPABASE_URL = 'https://mujciribnacdvoomcrjk.supabase.co'; 
const SUPABASE_ANON_KEY = 'sb_publishable_sJdttu5UqUqDsLEyT52wqA_07I0Fs2J'; 

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Diese Variable bleibt vorerst leer und wird gleich dynamisch befüllt
let HERITAGE_DATA = [];

// 2. Funktion: Daten asynchron aus Supabase laden
async function fetchSitesFromSupabase() {
    try {
        // ACHTUNG: 'heritage_sites' muss exakt so heißen wie deine Tabelle in Supabase!
        const { data, error } = await supabase
            .from('heritage_sites')
            .select('*');

        if (error) throw error;

        // Wir überschreiben unsere leere Variable mit den echten Cloud-Daten
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
    // Wir stoßen zuerst das Laden der Datenbank an
    fetchSitesFromSupabase();
});

// Diese Funktion startet die Karte erst, WENN die Daten aus der Cloud da sind
function initApp() {
    const bounds = L.latLngBounds(L.latLng(-85,-180), L.latLng(85,180));
    map = L.map("map", {
        zoomControl: false, attributionControl: false,
        minZoom: 2.2, maxBounds: bounds, maxBoundsViscosity: 1.0
    }).setView([22, 18], 3);

    activeTileLayer = L.tileLayer(TILE_LAYERS[currentTheme], { maxZoom: 19, noWrap: true }).addTo(map);

  // Marker auf Basis der frisch geladenen DB-Daten setzen
    HERITAGE_DATA.forEach(site => {
        // Wir prüfen, ob Breitengrad und Längengrad existieren
        if (site.latitude && site.longitude) {
            const coords = [parseFloat(site.latitude), parseFloat(site.longitude)];
            
            L.marker(coords, { icon: createMarkerIcon(site) })
             .addTo(map)
             .on("click", () => selectSite(site));
        }
    });

    updateXPUI();
    renderList();
    renderFavList();
    setupEvents();
    initTimeSlider();
}

function createMarker(site) {
    if (site.type === "wonder") {
        const icon = L.divIcon({
            className: "wonder-marker",
            html: `<div class="wonder-wrap"><div class="wonder-star-glyph">★</div><div class="wonder-ring"></div></div>`,
            iconSize: [24, 24], iconAnchor: [12, 12]
        });
        return L.marker(site.coordinates, { icon });
    } else {
        const color = EPOCH_COLORS[site.epoch] || EPOCH_COLORS.new;
        const icon = L.divIcon({
            className: "custom-marker",
            html: `<div class="marker-wrap">
                     <div class="marker-core" style="background:${color}"></div>
                     <div class="marker-ring" style="background:${color}33"></div>
                   </div>`,
            iconSize: [18, 18], iconAnchor: [9, 9]
        });
        return L.marker(site.coordinates, { icon });
    }
}

function updateXPUI() {
    const pointsEl = document.getElementById("xp-points");
    const badgeEl = document.getElementById("rank-badge");
    const fillEl = document.getElementById("xp-bar-fill");
    
    if (pointsEl) pointsEl.textContent = userXP;
    
    const ranks = [[0,"Novize"],[150,"Entdecker"],[300,"Analyst"],[600,"Elite-Forscher"],[900,"Groß-Archivar"]];
    let rank = "Novize";
    for (const [threshold, name] of ranks) { if (userXP >= threshold) rank = name; }
    if (badgeEl) badgeEl.textContent = rank;
    if (fillEl) fillEl.style.width = `${Math.min((userXP/900)*100,100)}%`;
}

function getFilteredSorted() {
    let data = [...HERITAGE_DATA];
    if (activeFilter === "wonder") data = data.filter(s => s.type === "wonder");
    else if (activeFilter === "ancient") data = data.filter(s => s.epoch === "ancient" && s.type === "unesco");
    else if (activeFilter === "medieval") data = data.filter(s => s.epoch === "medieval" && s.type === "unesco");
    else if (activeFilter === "modern") data = data.filter(s => s.epoch === "modern" && s.type === "unesco");

    if (activeSort === "oldest") data.sort((a,b) => a.builtYear - b.builtYear);
    else if (activeSort === "newest") data.sort((a,b) => b.builtYear - a.builtYear);
    else if (activeSort === "name") data.sort((a,b) => a.title.localeCompare(b.title, "de"));

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
        item.className = "quick-item" + (site.type === "wonder" ? " wonder-item" : "");
        const isFav = favorites.includes(site.id);
        const glyph = site.type === "wonder" ? "★" : "●";
        const yearLabel = site.builtYear < 0 ? `${Math.abs(site.builtYear)} v. Chr.` : `${site.builtYear} n. Chr.`;

        item.innerHTML = `
            <div class="quick-item-icon">${glyph}</div>
            <div class="quick-item-body">
                <div class="quick-item-title">${site.title}</div>
                <div class="quick-item-meta">${site.country} · Erbaut: ${yearLabel}</div>
            </div>
            <span class="fav-star-mini ${isFav ? 'active' : ''}" data-id="${site.id}">★</span>
        `;

        item.addEventListener("click", (e) => {
            if (e.target.classList.contains("fav-star-mini")) { toggleFav(site.id, e); return; }
            selectSite(site);
        });

        container.appendChild(item);
    });
}

function toggleFav(id, e) {
    if (e) e.stopPropagation();
    const idx = favorites.indexOf(id);
    if (idx === -1) favorites.push(id);
    else favorites.splice(idx, 1);
    localStorage.setItem("chronos_favs_v5", JSON.stringify(favorites));
    
    const favCountEl = document.getElementById("fav-count");
    if (favCountEl) favCountEl.textContent = favorites.length;
    
    renderList();
    renderFavList();
    if (activeSite && activeSite.id === id) {
        const btnFav = document.getElementById("btn-favorite");
        if (btnFav) btnFav.textContent = favorites.includes(id) ? "★" : "☆";
    }
}

function renderFavList() {
    const container = document.getElementById("fav-list-container");
    if (!container) return;
    const favCountEl = document.getElementById("fav-count");
    if (favCountEl) favCountEl.textContent = favorites.length;
    container.innerHTML = "";
    if (favorites.length === 0) {
        container.innerHTML = `<div class="empty-fav">Noch keine Lesezeichen gesetzt. Klicken Sie auf ★ bei einer Stätte.</div>`;
        return;
    }
    favorites.forEach(id => {
        const site = HERITAGE_DATA.find(s => s.id === id);
        if (!site) return;
        const item = document.createElement("div");
        item.className = "fav-item";
        item.innerHTML = `
            <span style="font-size:13px; color:${site.type === "wonder" ? "#e0a900" : "var(--text-muted)"}">${site.type === "wonder" ? "★" : "●"}</span>
            <span class="fav-item-title">${site.title}</span>
            <span class="fav-item-country">${site.country}</span>
            <span class="fav-remove" data-id="${id}">✕</span>
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
        document.getElementById("time-slider").value = 0;
        document.getElementById("time-label").textContent = "Gegenwart";
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

    document.getElementById("btn-start-tour").addEventListener("click", () => {
        if (activeSite?.tourWaypoints) runTour(activeSite.tourWaypoints);
    });

    document.querySelectorAll(".chip").forEach(chip => {
        chip.addEventListener("click", (e) => {
            document.querySelectorAll(".chip").forEach(c => c.classList.remove("active"));
            e.currentTarget.classList.add("active");
            activeFilter = e.currentTarget.dataset.filter;
            renderList();
        });
    });

    document.querySelectorAll(".sort-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            document.querySelectorAll(".sort-btn").forEach(b => b.classList.remove("active"));
            e.currentTarget.classList.add("active");
            activeSort = e.currentTarget.dataset.sort;
            renderList();
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
        if (activeSite) toggleFav(activeSite.id);
    });
}

function selectSite(site) {
    activeSite = site;
    map.flyTo(site.coordinates, site.zoom, { duration: 1.4 });

    document.getElementById("site-country").textContent = site.country;
    document.getElementById("site-category").textContent = site.category;
    document.getElementById("site-title").textContent = site.title;
    
    const yearStr = site.builtYear < 0
        ? `Errichtungshorizont: ${Math.abs(site.builtYear)} v. Chr.`
        : `Errichtungshorizont: ${site.builtYear} n. Chr.`;
    document.getElementById("site-year").textContent = yearStr;

    document.getElementById("btn-favorite").textContent = favorites.includes(site.id) ? "★" : "☆";

    const mainImg = document.getElementById("gallery-img-active");
    mainImg.src = site.images[0];
    mainImg.alt = site.title;
    
    const thumbCont = document.getElementById("gallery-thumbs-container");
    thumbCont.innerHTML = "";
    site.images.forEach((url, i) => {
        const t = document.createElement("div");
        t.className = `thumb-item ${i === 0 ? "active" : ""}`;
        t.innerHTML = `<img src="${url}" alt="Bild ${i+1}">`;
        t.addEventListener("click", () => {
            document.querySelectorAll(".thumb-item").forEach(x => x.classList.remove("active"));
            t.classList.add("active");
            mainImg.src = url;
        });
        thumbCont.appendChild(t);
    });

    document.getElementById("site-context-dynamic").innerHTML = site.htmlContent || "";
    document.getElementById("site-anecdote-text").textContent = site.anecdote || "";

    document.querySelectorAll(".tab-trigger").forEach(t => t.classList.remove("active"));
    document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));
    document.querySelector('[data-tab="tab-context"]').classList.add("active");
    document.getElementById("tab-context").classList.add("active");

    buildQuiz(site);

    document.getElementById("time-slider").value = 0;
    document.getElementById("time-label").textContent = "Gegenwart";

    document.getElementById("panel-welcome").classList.remove("active");
    setTimeout(() => document.getElementById("panel-details").classList.add("active"), 200);
}

function buildQuiz(site) {
    const success = document.getElementById("task-success");
    const hint = document.getElementById("quiz-hint");
    hint.style.display = "none";

    if (claimedSites.includes(site.id)) {
        success.classList.remove("hidden");
        document.getElementById("quiz-options").innerHTML = "";
        document.getElementById("quiz-question").textContent = "Diese Stätte wurde bereits erfolgreich verifiziert.";
        return;
    }
    success.classList.add("hidden");

    document.getElementById("quiz-question").textContent = site.quiz.q;
    const opts = document.getElementById("quiz-options");
    opts.innerHTML = "";
    site.quiz.ans.forEach((text, idx) => {
        const btn = document.createElement("button");
        btn.className = "quiz-opt";
        btn.textContent = text;
        btn.addEventListener("click", () => {
            if (btn.classList.contains("disabled")) return;
            if (idx === site.quiz.correct) {
                document.querySelectorAll(".quiz-opt").forEach(b => b.classList.add("disabled"));
                btn.classList.add("correct");
                hint.style.display = "none";
                setTimeout(() => {
                    userXP += 150;
                    claimedSites.push(site.id);
                    localStorage.setItem("chronos_xp_v5", userXP);
                    localStorage.setItem("chronos_claimed_v5", JSON.stringify(claimedSites));
                    updateXPUI();
                    success.classList.remove("hidden");
                }, 500);
            } else {
                btn.classList.add("wrong", "disabled");
                hint.textContent = site.quiz.hint;
                hint.style.display = "block";
            }
        });
        opts.appendChild(btn);
    });
}

function runTour(waypoints) {
    const btn = document.getElementById("btn-start-tour");
    btn.disabled = true;
    let step = 0;
    function next() {
        if (step >= waypoints.length) {
            btn.disabled = false;
            btn.innerHTML = "Virtuelle Kamera-Tour starten";
            if (activeSite) map.flyTo(activeSite.coordinates, activeSite.zoom, { duration: 1.2 });
            return;
        }
        btn.innerHTML = `Wegpunkt ${step+1} von ${waypoints.length} anfliegen...`;
        const wp = waypoints[step];
        map.flyTo(wp.coords, wp.zoom, { duration: 2.0 });
        step++;
        setTimeout(next, 3800);
    }
    next();
}

function initTimeSlider() {
    const slider = document.getElementById("time-slider");
    const label = document.getElementById("time-label");
    slider.addEventListener("input", (e) => {
        const val = parseInt(e.target.value);
        if (val === 0) label.textContent = "Gegenwart";
        else if (val < 100) label.textContent = `Zeitreise: -${val * 25} J.`;
        else label.textContent = "Historische Epoche";
        if (activeSite) {
            const zoomDelta = (val / 100) * 1.2;
            map.setZoom(activeSite.zoom + zoomDelta, { animate: false });
        }
    });
}
