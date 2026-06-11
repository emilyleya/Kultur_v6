// ── 8. DETAILS ────────────────────────────────
async function showDetails(site, coords) {
    // SICHERHEITS-CHECK: Falls die Daten noch nicht da sind, garnicht erst ausführen
    if (!site) return;
    
    activeSite = site;
    
    // Sidebar wieder reinschieben, falls sie geschlossen war
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) sidebar.classList.remove('collapsed');
    
    if (map) map.flyTo(coords, 11, { duration: 1.6 });

    const id       = getSiteId(site);
    const siteName = site.site || site.name_en || '';

    // Sicherheits-Check für die HTML-Elemente vor dem Befüllen
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

    const dbDescription = site.short_description_en || 'Keine Beschreibung vorhanden.';
    
    // TAB 1: NUR die reinen Texte (UNESCO, Wikipedia) & das Quiz – KEINE Geodaten mehr hier!
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

    // TAB 2: Hier kommen die Geodaten jetzt exklusiv und sauber isoliert rein
    const geoEl = document.getElementById('detail-geodata');
    if (geoEl) {
        geoEl.innerHTML = `
            <div class="content-block">
                <div class="content-label">Geografische Daten</div>
                <p class="content-text"><strong>Fläche:</strong> ${site.area_hectares || '–'} Hektar</p>
                <p class="content-text"><strong>Region:</strong> ${site.region_en || '–'}</p>
            </div>
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
