// ── 8. DETAILS ────────────────────────────────
async function showDetails(site, coords) {
    activeSite = site;
    
    // Sidebar wieder reinschieben, falls sie geschlossen war
    document.querySelector('.sidebar').classList.remove('collapsed');
    
    map.flyTo(coords, 11, { duration: 1.6 });

    const id       = getSiteId(site);
    const siteName = site.site || site.name_en || '';

    document.getElementById('detail-country').textContent  = site.states_name_en || 'Weltweit';
    document.getElementById('detail-category').textContent = site.category || 'UNESCO';
    document.getElementById('detail-title').textContent    = siteName;
    document.getElementById('detail-meta').textContent     = `Eingeschrieben: ${site.date_inscribed || '–'}`;
    document.getElementById('btn-fav').textContent         = favorites.includes(id) ? '★' : '☆';

    const dbDescription = site.short_description_en || 'Keine Beschreibung vorhanden.';
    
    // TAB 1: NUR die reinen Texte (UNESCO, Wikipedia) & das Quiz – KEINE Geodaten mehr hier!
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

    document.getElementById('panel-welcome').classList.remove('active');
    document.getElementById('panel-details').classList.add('active');

    const slideshowEl = document.getElementById('slideshow');
    if (slideshowEl) {
        slideshowEl.innerHTML = `<div class="slide-loading">Bilder werden geladen…</div>`;
        fetchSlideshow(siteName).then(urls => renderSlideshow(urls));
    }

    fetchWikipediaSummary(siteName).then(wikiText => {
        const wikiBlock = document.getElementById('wiki-extended-block');
        const wikiPara = document.getElementById('wiki-extended-text');
        if (wikiText && wikiText.trim().length > 10) {
            wikiPara.textContent = wikiText;
            wikiBlock.style.display = 'block';
            injectAdvancedQuiz(site, wikiText);
        } else {
            injectAdvancedQuiz(site, "");
        }
    });

    earnXP(10);
}
