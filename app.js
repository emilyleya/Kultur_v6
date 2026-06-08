/**
 * CHRONOS Engine - Modern Minimalist Interactive Storytelling Core
 */

const HERITAGE_DATA = [
    {
        id: "colosseum", type: "wonder",
        title: "Das Kolosseum von Rom", country: "Italien", category: "7 Weltwunder",
        unescoYear: 1980, builtYear: 80, epoch: "ancient",
        coordinates: [41.8902, 12.4922], zoom: 16,
        images: [
            "https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1515542622106-78bda8ba0e5b?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1604580864964-0462f5d5b1a8?auto=format&fit=crop&w=800&q=80"
        ],
        htmlContent: `
            <div class="info-section-title">Architektonische Analyse & Status</div>
            <p class="body-text">Das Kolosseum ist das größte antike Amphitheater der Erde und gilt weltweit als eines der 7 neuen Weltwunder. Zudem ist das Monument seit 1980 integraler Bestandteil des UNESCO-Welterbes (Historisches Zentrum von Rom). Es wurde primär aus Travertin-Kalkstein, Ziegeln und hochentwickeltem römischen Beton (Opus caementitium) unter den flavischen Kaisern Vespasian und Titus errichtet.</p>
            <div class="info-section-title">Kapazität & Evakuierungslogistik</div>
            <p class="body-text">Das Bauwerk fasste Schätzungen zufolge zwischen 50.000 und 80.000 Zuschauer. Durch ein ausgeklügeltes System aus nummerierten Zugangsbögen und Treppenanlagen (Vomitorien) konnte das gesamte Auditorium im Falle einer Notsituation innerhalb weniger Minuten vollständig evakuiert werden.</p>
            <div class="info-section-title">Das Hypogäum</div>
            <p class="body-text">Direkt unter dem hölzernen, sandbedeckten Arenaboden lag das Hypogäum: Ein zweistöckiges, unterirdisches Labyrinth aus Gängen, Käfigen, mechanischen Aufzügen und Flaschenzügen. Dieses System ermöglichte es, Gladiatoren, Dekorationen und wilde Tiere für Überraschungseffekte direkt in die Arena emporzuheben.</p>
            <div class="source-box">Klassifikation: Weltwunder & UNESCO Welterbe (Einschreibung 1980). Ref: 91</div>`,
        anecdote: "Die Errichtung wurde vollständig durch die Plünderung des Tempels von Jerusalem im Jüdischen Krieg finanziert. Über 100.000 versklavte Gefangene wurden nach Rom deportiert, um die schwersten Arbeiten in den Steinbrüchen von Tivoli zu verrichten.",
        quiz: { q: "Welches unterirdische System erlaubte die Aufzug-Logistik unter dem Arenaboden?", ans: ["Das Hypogäum", "Das Vomitorium", "Das Impluvium"], correct: 0, hint: "Siehe Abschnitt 'Das Hypogäum' im Reiter Analyse." },
        tourWaypoints: [{ coords: [41.8902, 12.4922], zoom: 17 }, { coords: [41.8905, 12.4935], zoom: 18 }]
    },
    {
        id: "petra", type: "wonder",
        title: "Die Felsenstadt Petra", country: "Jordanien", category: "7 Weltwunder",
        unescoYear: 1985, builtYear: -300, epoch: "ancient",
        coordinates: [30.3285, 35.4444], zoom: 15,
        images: [
            "https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1579606038753-a7ee00c0f4f5?auto=format&fit=crop&w=800&q=80"
        ],
        htmlContent: `
            <div class="info-section-title">Historische Einordnung</div>
            <p class="body-text">Petra, die monumentale Hauptstadt des nabatäischen Reiches, zählt zu den archäologischen Kronjuwelen der Menschheit und wird als eines der 7 neuen Weltwunder geführt. Seit 1985 ist sie zudem als UNESCO-Welterbestätte geschützt. Die Stadt liegt strategisch in einem Talkessel und kontrollierte die historischen Handelsrouten der Weihrauchstraße.</p>
            <div class="info-section-title">Hydrologische Meisterleistung</div>
            <p class="body-text">Inmitten einer extrem ariden Wüstenlandschaft gelang es den Nabatäern, ein komplexes Netzwerk aus Dämmen, Kanälen, Filterbecken und unterirdischen Zisternen anzulegen. Damit konnten sie Sturzfluten abfangen und ganzjährig sauberes Trinkwasser für über 30.000 Einwohner bereitstellen.</p>
            <div class="source-box">Klassifikation: Weltwunder & UNESCO Welterbe (Einschreibung 1985). Ref: 326</div>`,
        anecdote: "Das weltbekannte 'Schatzhaus des Pharaos' (Khazne al-Firaun) war in Wirklichkeit ein monumentales königliches Grabmal. Beduinen vermuteten jahrhundertelang einen Goldschatz in der massiven Steinurne an der Spitze der Fassade und beschossen diese mit Gewehren.",
        quiz: { q: "Wie sicherten die Nabatäer die ganzjährige Wasserversorgung in Petra?", ans: ["Durch Tiefbrunnen", "Durch ein System aus Aquädukten, Dämmen und Zisternen", "Ausschließlich durch Importe"], correct: 1, hint: "Siehe 'Hydrologische Meisterleistung'." },
        tourWaypoints: [{ coords: [30.3285, 35.4444], zoom: 17 }, { coords: [30.3223, 35.4516], zoom: 16 }]
    },
    {
        id: "machupicchu", type: "wonder",
        title: "Machu Picchu", country: "Peru", category: "7 Weltwunder",
        unescoYear: 1983, builtYear: 1450, epoch: "modern",
        coordinates: [-13.1631, -72.5450], zoom: 15,
        images: [
            "https://images.unsplash.com/photo-1587595431973-160d0d94adb1?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1526392060635-9d6019884377?auto=format&fit=crop&w=800&q=80"
        ],
        htmlContent: `
            <div class="info-section-title">Geografische Lage & Status</div>
            <p class="body-text">Machu Picchu thront auf einem schmalen Bergrücken in 2.430 Metern Höhe in den peruanischen Anden. Die legendäre Inka-Stadt ist als eines der 7 neuen Weltwunder anerkannt und wurde bereits 1983 von der UNESCO zum Weltkultur- und Naturerbe erklärt. Sie diente vermutlich als kaiserliche Residenz für den Herrscher Pachacútec.</p>
            <div class="info-section-title">Mörtellose Steintechnik</div>
            <p class="body-text">Die Architektur besticht durch die sogenannte Ashlar-Bauweise: Die tonnenschweren Granitblöcke wurden ohne jeglichen Mörtel so präzise behauen und fugenlos aneinandergefügt, dass keine Messerklinge dazwischen passt. Diese Technik macht die Gebäude hocherdbebensicher, da die Steine bei Erschütterungen flexibel schwingen können.</p>
            <div class="source-box">Klassifikation: Weltwunder & UNESCO Welterbe (Einschreibung 1983). Ref: 274</div>`,
        anecdote: "Die spanischen Konquistadoren entdeckten die Stadt aufgrund ihrer isolierten Lage nie. Erst im Jahr 1911 wurde sie durch den US-Forscher Hiram Bingham wiederentdeckt, nachdem lokale Bauern ihn zu den überwucherten Terrassen führten.",
        quiz: { q: "Wie nennt man die mörtellose Präzisionsbauweise der Inka?", ans: ["Opus Caementitium", "Ashlar-Technik", "Megolith-Verbund"], correct: 1, hint: "Suche nach dem Begriff im Abschnitt 'Mörtellose Steintechnik'." },
        tourWaypoints: [{ coords: [-13.1631, -72.5450], zoom: 17 }, { coords: [-13.1627, -72.5458], zoom: 18 }]
    },
    {
        id: "tajmahal", type: "wonder",
        title: "Das Taj Mahal", country: "Indien", category: "7 Weltwunder",
        unescoYear: 1983, builtYear: 1643, epoch: "modern",
        coordinates: [27.1751, 78.0421], zoom: 16,
        images: [
            "https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=800&q=80"
        ],
        htmlContent: `
            <div class="info-section-title">Strukturelle Übersicht</div>
            <p class="body-text">Das Taj Mahal in Agra ist ein weltberühmtes Monument der Symmetrie und ein globales Weltwunder. Die UNESCO deklarierte dieses Meisterwerk islamischer Kunst in Indien im Jahr 1983 zum Welterbe. Großmogul Shah Jahan gab den Bau als Mausoleum für seine verstorbene Große Liebe Mumtaz Mahal in Auftrag.</p>
            <div class="info-section-title">Symmetrie und Werkstoffe</div>
            <p class="body-text">Das weiße Hauptgebäude besteht aus reinstem Makrana-Marmor, der je nach Tageszeit und Lichteinfall seine Farbe von zartem Rosa über strahlendes Weiß bis zu goldenem Gelb ändert. Jedes architektonische Element, von den Gartenanlagen bis zu den Zwillingsgebäuden, ist absolut spiegelsymmetrisch angeordnet.</p>
            <div class="source-box">Klassifikation: Weltwunder & UNESCO Welterbe (Einschreibung 1983). Ref: 252</div>`,
        anecdote: "Die vier freistehenden Minarette an den Ecken der Plattform wurden gezielt mit einer Neigung von wenigen Grad nach außen erbaut. Im Falle eines verheerenden Erdbebens stürzen sie somit vom zentralen Kuppelbau weg.",
        quiz: { q: "Aus welchem Grund sind die Minarette leicht nach außen geneigt?", ans: ["Aus optischen Symmetriegründen", "Als statischer Schutz für die zentrale Hauptkuppel bei Erdbeben", "Zur exakten Ausrichtung nach Mekka"], correct: 1, hint: "Überprüfe den Inhalt der historischen Anekdote." },
        tourWaypoints: [{ coords: [27.1751, 78.0421], zoom: 17 }]
    },
    {
        id: "chichenitza", type: "wonder",
        title: "Chichén Itzá", country: "Mexiko", category: "7 Weltwunder",
        unescoYear: 1988, builtYear: 600, epoch: "medieval",
        coordinates: [20.6843, -88.5678], zoom: 16,
        images: [
            "https://images.unsplash.com/photo-1518638150340-f706e86654de?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1554014248-049e8573d8d2?auto=format&fit=crop&w=800&q=80"
        ],
        htmlContent: `
            <div class="info-section-title">Kulturelles Zentrum</div>
            <p class="body-text">Chichén Itzá war eine der bedeutendsten Ruinenstädte der späten Maya-Klassik auf der Halbinsel Yucatán. Sie ist als eines der 7 neuen Weltwunder klassifiziert und wurde 1988 als UNESCO-Welterbestätte eingetragen. Die Anlage spiegelt die Verschmelzung von Maya-Architektur und toltekischen Einflüssen wider.</p>
            <div class="info-section-title">Die Kalenderpyramide El Castillo</div>
            <p class="body-text">Die zentrale Pyramide des Kukulcán ist ein versteckter steinerner Kalender. Die vier Treppenstufen ergeben zusammen mit der obersten Plattform exakt die 365 Tage des Sonnenjahres. Zur Tag-und-Nacht-Gleiche erzeugt das Sonnenlicht an den Stufen ein Schattenspiel, das wie eine herabgleitende Schlange aussieht.</p>
            <div class="source-box">Klassifikation: Weltwunder & UNESCO Welterbe (Einschreibung 1988). Ref: 483</div>`,
        anecdote: "Die Maya besaßen herausragende akustische Kenntnisse. Wenn man vor der Treppe der Kukulcán-Pyramide in die Hände klatscht, erzeugt der reflektierte Schall ein hohes Zwitschern, das dem Ruf des heiligen Quetzal-Vogels gleicht.",
        quiz: { q: "Welches visuelle Phänomen ereignet sich zur Tag-und-Nacht-Gleiche an der Pyramide?", ans: ["Ein Lichtstrahl durchschießt die Spitze", "Der Schattenwurf imitiert eine kriechende Schlange", "Die Stufen leuchten rot auf"], correct: 1, hint: "Lies den text zur Kalenderpyramide El Castillo." },
        tourWaypoints: [{ coords: [20.6843, -88.5678], zoom: 17 }]
    },
    {
        id: "greatwall", type: "wonder",
        title: "Die Chinesische Mauer", country: "China", category: "7 Weltwunder",
        unescoYear: 1987, builtYear: -221, epoch: "ancient",
        coordinates: [40.4319, 116.5704], zoom: 15,
        images: [
            "https://images.unsplash.com/photo-1508804185872-d7badad00f7d?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1549893072-4bc678117f45?auto=format&fit=crop&w=800&q=80"
        ],
        htmlContent: `
            <div class="info-section-title">Dimensionen & Status</div>
            <p class="body-text">Als flächenmäßig größtes militärisches Schutzbauwerk der Erde ist die Chinesische Mauer ein zeitloses Weltwunder und wurde 1987 von der UNESCO als Welterbe unter Schutz gestellt. Ihre Gesamtlänge inklusive aller Verzweigungen wird auf über 21.196 Kilometer geschätzt.</p>
            <div class="info-section-title">Verteidigungsnetzwerk</div>
            <p class="body-text">Die Mauer ist kein zusammenhängendes Bauwerk, sondern ein über Jahrhunderte gewachsenes Verteidigungssystem. Sie besteht aus Erdwällen, Ziegelmauern, Wachtürmen und Signalstationen, mit denen Nachrichten mittels Rauchzeichen und Feuersignalen in Windeseile über weite Distanzen übermittelt werden konnten.</p>
            <div class="source-box">Klassifikation: Weltwunder & UNESCO Welterbe (Einschreibung 1987). Ref: 438</div>`,
        anecdote: "Die hartnäckige Behauptung, die Chinesische Mauer sei mit bloßem Auge aus dem Weltall oder gar vom Mond aus sichtbar, ist ein Mythos. Astronauten bestätigten mehrfach, dass sie ohne Hilfsmittel aufgrund der geringen Breite und Materialfarbe nicht zu erkennen ist.",
        quiz: { q: "Wie lang ist das Gesamtsystem der Chinesischen Mauer laut neuesten Messungen?", ans: ["Rund 5.000 Kilometer", "Über 21.000 Kilometer", "Exakt 10.000 Kilometer"], correct: 1, hint: "Siehe Abschnitt 'Dimensionen & Status'." },
        tourWaypoints: [{ coords: [40.4319, 116.5704], zoom: 15 }, { coords: [40.4380, 116.5780], zoom: 16 }]
    },
    {
        id: "christredeemer", type: "wonder",
        title: "Christus der Erlöser", country: "Brasilien", category: "7 Weltwunder",
        unescoYear: null, builtYear: 1931, epoch: "modern",
        coordinates: [-22.9519, -43.2105], zoom: 16,
        images: [
            "https://images.unsplash.com/photo-1483729558449-99ef09a8c325?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1548963670-7f9c28a9e002?auto=format&fit=crop&w=800&q=80"
        ],
        htmlContent: `
            <div class="info-section-title">Denkmalcharakter</div>
            <p class="body-text">Die monumentale Christusstatue Cristo Redentor steht auf dem Berg Corcovado in Rio de Janeiro und blickt über die Bucht von Guanabara. Sie wurde im Jahr 2007 im Rahmen einer weltweiten Wahl zu einem der 7 neuen Weltwunder gekürt. Die Eröffnung fand im Jahr 1931 statt.</p>
            <div class="info-section-title">Konstruktion und Materialkunde</div>
            <p class="body-text">Die Statue besitzt eine Höhe von 30 Metern und ruht auf einem 8 Meter hohen Sockel. Das innere Tragwerk besteht aus massivem Stahlbeton, während die charakteristische Außenhaut aus Millionen von Mosaikfliesen aus Speckstein gefertigt wurde. Dieses Material ist extrem witterungsbeständig und schützt den Beton vor Rissen.</p>
            <div class="source-box">Klassifikation: 7 Neue Weltwunder</div>`,
        anecdote: "Aufgrund ihrer exponierten Berglage wird die Statue statistisch gesehen etwa sechs Mal pro Jahr von Blitzeinschlägen getroffen. Ein integriertes System von blitzableitern leitet die Energie ab, dennoch müssen regelmäßig Restaurationen an Händen und Kopf vorgenommen werden.",
        quiz: { q: "Welches witterungsbeständige Material wurde für die Außenhaut verwendet?", ans: ["Weißer Carrara-Marmor", "Mosaikfliesen aus Speckstein", "Granitblöcke"], correct: 1, hint: "Lies den Abschnitt 'Konstruktion und Materialkunde'." },
        tourWaypoints: [{ coords: [-22.9519, -43.2105], zoom: 17 }]
    },
    {
        id: "pyramids", type: "unesco",
        title: "Pyramiden von Gizeh", country: "Ägypten", category: "Kulturerbe",
        unescoYear: 1979, builtYear: -2560, epoch: "ancient",
        coordinates: [29.9792, 31.1342], zoom: 15,
        images: [
            "https://images.unsplash.com/photo-1539650116574-8efeb43e2750?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1503177119275-0aa32b3a9368?auto=format&fit=crop&w=800&q=80"
        ],
        htmlContent: `
            <div class="info-section-title">Das antike Weltwunder der Urzeit</div>
            <p class="body-text">Die Nekropole von Gizeh zählt seit 1979 zum UNESCO-Weltkulturerbe. Die Cheops-Pyramide ist das älteste Bauwerk der Menschheitsgeschichte auf dieser Liste und das einzige verbliebene Monument der antiken Ur-Weltwunder des Antipater.</p>
            <div class="info-section-title">Mathematische Präzision</div>
            <p class="body-text">Die Ausrichtung des Bauwerks nach den echten Himmelsrichtungen weist eine minimale Abweichung von weniger als einem Zehntel Grad auf. Für den Bau wurden schätzungsweise 2,3 Millionen Kalksteinblöcke akribisch aufgeschichtet.</p>
            <div class="source-box">UNESCO Welterbe seit 1979. Ref: 86</div>`,
        anecdote: "Neueste forensische Ausgrabungen in den Arbeiterdörfern widerlegten den Mythos des Sklavenbaus. Die Arbeiter waren festangestellte, medizinisch erstklassig versorgte Fachkräfte, die mit Fleisch und Bier entlohnt wurden.",
        quiz: { q: "Für welchen Pharaonenkönig wurde die größte der drei Pyramiden errichtet?", ans: ["Khafre", "Cheops", "Menkaure"], correct: 1, hint: "Lies den Text aufmerksam durch." },
        tourWaypoints: [{ coords: [29.9792, 31.1342], zoom: 16 }]
    },
    {
        id: "kyoto", type: "unesco",
        title: "Historisches Kyoto", country: "Japan", category: "Kulturerbe",
        unescoYear: 1994, builtYear: 794, epoch: "medieval",
        coordinates: [34.9948, 135.7850], zoom: 14,
        images: [
            "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1583400470628-3abb0a4c5194?auto=format&fit=crop&w=800&q=80"
        ],
        htmlContent: `
            <div class="info-section-title">Imperiales Erbe Kyotos</div>
            <p class="body-text">Kyoto war über ein Jahrtausend lang die kaiserliche Residenzstadt Japans. Das 1994 ernannte UNESCO-Welterbe umfasst insgesamt 17 geschützte Tempelanlagen, Schreine und Paläste, die die Evolution der hölzernen japanischen Architektur dokumentieren.</p>
            <div class="info-section-title">Akustischer Ninja-Schutz</div>
            <p class="body-text">Im Nijo-Schloss der Shogune befinden sich die berühmten Nachtigallenböden. Die Metalldornen der Holzdielen wurden so konstruiert, dass sie bei jedem Schritt ein charakteristisches Vogelgezwitscher erzeugen, um feindliche Spione sofort akustisch zu entlarven.</p>
            <div class="source-box">UNESCO Welterbe seit 1994. Ref: 688</div>`,
        anecdote: "Kyoto entging im Zweiten Weltkrieg der Zerstörung durch Atomwaffen ausschließlich, weil der US-Kriegsminister Henry Stimson die Stadt wegen ihrer immensen Kulturwerte eigenhändig von der Ziel-Liste streichen ließ.",
        quiz: { q: "Welches Schutzsystem verhinderte das unbemrittene Eindringen im Schloss Nijo-jo?", ans: ["Falltüren", "Nachtigallenböden", "Wassergräben"], correct: 1, hint: "Finde das akustische System im Text." },
        tourWaypoints: [{ coords: [34.9948, 135.7850], zoom: 16 }]
    },
    {
        id: "acropolis", type: "unesco",
        title: "Die Akropolis von Athen", country: "Griechenland", category: "Kulturerbe",
        unescoYear: 1987, builtYear: -447, epoch: "ancient",
        coordinates: [37.9715, 23.7257], zoom: 16,
        images: [
            "https://images.unsplash.com/photo-1555992336-03a23c7b20eb?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1608541737042-87a12275d313?auto=format&fit=crop&w=800&q=80"
        ],
        htmlContent: `
            <div class="info-section-title">Die Wiege der Demokratie</div>
            <p class="body-text">Die Akropolis ist das universelle Symbol der klassischen Antike und der antiken griechischen Zivilisation. Der Tempelkomplex wurde im 5. Jahrhundert v. Chr. unter der Leitung des Staatsmannes Perikles auf einem markanten Kalksteinfelsen über Athen errichtet. Sie wurde 1987 in die UNESCO-Welterbeliste aufgenommen.</p>
            <div class="info-section-title">Architektonische Perfektion des Parthenon</div>
            <p class="body-text">Der Haupttempel, das Parthenon, ist der Göttin Athena geweiht. Die Baumeister nutzten raffinierte optische Korrekturen (Entasis), um Verzerrungen für das menschliche Auge auszugleichen: Keine Linie ist absolut gerade, die Säulen sind leicht nach innen geneigt und in der Mitte dicker, wodurch das Gebäude perfekt proportional wirkt.</p>
            <div class="source-box">UNESCO Welterbe seit 1987. Ref: 404</div>`,
        anecdote: "Im Jahr 1687 erlitt die Akropolis verheerende Schäden, als die Osmanen das Parthenon als Pulvermagazin nutzten und eine venezianische Kanonenkugel das Bauwerk traf, was eine gigantische Explosion auslöste.",
        quiz: { q: "Wie nennt man die bewusste optische Wölbung der Säulen zur Korrektur von Sehfehlern?", ans: ["Kannelierung", "Entasis", "Architrav"], correct: 1, hint: "Lies den Abschnitt zur Perfektion des Parthenon." },
        tourWaypoints: [{ coords: [37.9715, 23.7257], zoom: 17 }]
    },
    {
        id: "angkorwat", type: "unesco",
        title: "Angkor Archäologischer Park", country: "Kambodscha", category: "Kulturerbe",
        unescoYear: 1992, builtYear: 1113, epoch: "medieval",
        coordinates: [13.4125, 103.8670], zoom: 14,
        images: [
            "https://images.unsplash.com/photo-1569683795645-b62e50fbf103?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1542640244-7e672d6cef4e?auto=format&fit=crop&w=800&q=80"
        ],
        htmlContent: `
            <div class="info-section-title">Das sakrale Herz des Khmer-Reiches</div>
            <p class="body-text">Der archäologische Park von Angkor erstreckt sich über 400 Quadratkilometer und wurde 1992 von der UNESCO zum Welterbe deklariert. Er beherbergt die grandiosen Überreste verschiedener Hauptstädte des Khmer-Reiches vom 9. bis zum 15. Jahrhundert. Das bekannteste Monument ist Angkor Wat, das größte religiöse Bauwerk der Erde.</p>
            <div class="info-section-title">Wasserbau-Technologie</div>
            <p class="body-text">Der gigantische Erfolg der Khmer-Zivilisation basierte auf ihrer hochentwickelten Wasserwirtschaft. Riesige künstliche Stauseen (Barays) speicherten das Monsunwasser, um ein komplexes Kanalsystem zu speisen. Dies sicherte die ganzjährige Bewässerung der Reisfelder und stabilisierte den sandigen Untergrund der tonnenschweren Tempel.</p>
            <div class="source-box">UNESCO Welterbe seit 1992. Ref: 668</div>`,
        anecdote: "Angkor Wat wurde ursprünglich als hinduistischer Tempel für den Gott Vishnu erbaut, wandelte sich jedoch am Ende des 12. Jahrhunderts unter König Jayavarman VII. schrittweise in eine buddhistische Kultstätte.",
        quiz: { q: "Was speicherten die Khmer in den gigantischen Becken namens 'Barays'?", ans: ["Getreidevorräte", "Monsunwasser zur Bewässerung", "Heiliges Öl"], correct: 1, hint: "Überprüfe die Details im Text zur Wasserbau-Technologie." },
        tourWaypoints: [{ coords: [13.4125, 103.8670], zoom: 16 }]
    },
    {
        id: "alhambra", type: "unesco",
        title: "Alhambra von Granada", country: "Spanien", category: "Kulturerbe",
        unescoYear: 1984, builtYear: 1238, epoch: "medieval",
        coordinates: [37.1760, -3.5875], zoom: 16,
        images: [
            "https://images.unsplash.com/photo-1595152230551-214666c7f8c2?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1505995433366-e12047f3f144?auto=format&fit=crop&w=800&q=80"
        ],
        htmlContent: `
            <div class="info-section-title">Die rote Festung des Maurischen Spaniens</div>
            <p class="body-text">Die Alhambra auf dem Sabikah-Hügel in Granada ist eine überwältigende Palast- und Festungsanlage, die als Höhepunkt der islamisch-nasridischen Kunst in Europa gilt. Sie wurde 1984 in das UNESCO-Welterbe eingetragen und besticht durch die Verschmelzung von Architektur, Natur und ausgeklügelten Wasserspielen.</p>
            <div class="info-section-title">Stuck- und Kalligrafiekunst</div>
            <p class="body-text">Die Wände der Innenräume sind lückenlos mit feinsten arabesken Stuckverzierungen (Muqarnas) verkleidet, die wie Stalaktiten von den Decken hängen. Zudem sind Tausende von kalligrafischen Inschriften in die Mauern gemeißelt, darunter das wiederkehrende nasridische Motto: 'Es gibt keinen Sieger außer Allah'.</p>
            <div class="source-box">UNESCO Welterbe seit 1984. Ref: 312</div>`,
        anecdote: "Als der letzte maurische König Boabdil die Stadt 1492 kampflos an die katholischen Könige übergeben musste, blickte er auf einem Pass weinend zurück. Seine Mutter tadelte ihn mit den Worten: 'Weine nicht wie eine Frau um das, was du nicht wie ein Mann verteidigen konntest.'",
        quiz: { q: "Welches herrschende Motto findet sich tausendfach als Inschrift in den Palastwänden?", ans: ["Ehre dem König", "Es gibt keinen Sieger außer Allah", "Granada der Ewigkeit"], correct: 1, hint: "Finde das nasridische Motto im Text zur Stuckkunst." },
        tourWaypoints: [{ coords: [37.1760, -3.5875], zoom: 17 }]
    },
    {
        id: "serengeti", type: "unesco",
        title: "Serengeti-Nationalpark", country: "Tansania", category: "Naturerbe",
        unescoYear: 1981, builtYear: 1951, epoch: "new",
        coordinates: [-2.1540, 34.6857], zoom: 9,
        images: [
            "https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=800&q=80"
        ],
        htmlContent: `
            <div class="info-section-title">Ökologische Weltbedeutung</div>
            <p class="body-text">Die Serengeti umfasst 14.763 Quadratkilometer Savannenfläche und wurde 1981 zum UNESCO-Weltnaturerbe erhoben. Das Schutzgebiet schützt das intakteste und größte Landsäugetier-Ökosystem unseres Planeten.</p>
            <div class="info-section-title">The Great Migration</div>
            <p class="body-text">Weltbekannt ist der Park für die alljährliche große Wanderung: Über 1,5 Millionen Streifengnus, 200.000 Zebras und Hunderttausende Gazellen ziehen im ewigen Kreislauf Regenfällen hinterher, dicht gefolgt von Spitzenraubtieren wie Löwen, Leoparden und Hyänen. Dieses Naturschauspiel ist ökologisch absolut einzigartig.</p>
            <div class="source-box">UNESCO Weltnaturerbe seit 1981. Ref: 156</div>`,
        anecdote: "Der Name 'Serengeti' leitet sich direkt aus der Sprache der indigenen Massai ab. Das Wort 'Siringet' bedeutet übersetzt treffend 'Das endlose Land' oder 'die unendliche Ebene'.",
        quiz: { q: "Was bedeutet das ursprüngliche Massai-Wort 'Siringet'?", ans: ["Land des Löwen", "Die unendliche Ebene", "Wildes Wasser"], correct: 1, hint: "Siehe historische Herleitung in der Anekdote." },
        tourWaypoints: [{ coords: [-2.1540, 34.6857], zoom: 10 }]
    },
    {
        id: "greatbarrierreef", type: "unesco",
        title: "Great Barrier Reef", country: "Australien", category: "Naturerbe",
        unescoYear: 1981, builtYear: 1975, epoch: "new",
        coordinates: [-18.2871, 147.6992], zoom: 6,
        images: [
            "https://images.unsplash.com/photo-1546026423-cc4642628d2b?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1582967788606-a171c1080cb0?auto=format&fit=crop&w=800&q=80"
        ],
        htmlContent: `
            <div class="info-section-title">Das größte lebende Bauwerk der Erde</div>
            <p class="body-text">Das Great Barrier Reef vor der Küste Queenslands wurde 1981 von der UNESCO als Weltnaturerbe registriert. Es erstreckt sich über eine Länge von 2.300 Kilometern und besteht aus über 2.900 Einzelriffen. Es ist so gewaltig, dass es als Struktur vom Weltall aus sichtbar is.</p>
            <div class="info-section-title">Biodiversitäts-Hotspot</div>
            <p class="body-text">Das Ökosystem beheimatet eine beispiellose marine Artenvielfalt: Über 1.500 Fischarten, 400 Steinkorallenarten, ein Drittel aller weltweiten Weichkorallen sowie bedrohte Tierarten wie die Grüne Meeresschildkröte und Seekühe (Dugongs) sind hier heimisch.</p>
            <div class="source-box">UNESCO Weltnaturerbe seit 1981. Ref: 154</div>`,
        anecdote: "Das gesamte gigantische Riff wurde über Jahrmillionen von mikroskopisch kleinen Lebewesen, den Korallenpolypen, erbaut, die Kalkskelette abscheiden und so das marine Fundament schufen.",
        quiz: { q: "Welche winzigen Organismen schufen das Fundament des Great Barrier Reefs?", ans: ["Plankton-Algen", "Korallenpolypen", "Meeresschwämme"], correct: 1, hint: "Lies den Inhalt der biologischen Anekdote." },
        tourWaypoints: [{ coords: [-18.2871, 147.6992], zoom: 8 }]
    }
];

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

document.addEventListener("DOMContentLoaded", () => {
    const bounds = L.latLngBounds(L.latLng(-85,-180), L.latLng(85,180));
    map = L.map("map", {
        zoomControl: false, attributionControl: false,
        minZoom: 2.2, maxBounds: bounds, maxBoundsViscosity: 1.0
    }).setView([22, 18], 3);

    activeTileLayer = L.tileLayer(TILE_LAYERS[currentTheme], { maxZoom: 19, noWrap: true }).addTo(map);

    HERITAGE_DATA.forEach(site => {
        const marker = createMarker(site);
        marker.addTo(map).on("click", () => selectSite(site));
    });

    updateXPUI();
    renderList();
    renderFavList();
    setupEvents();
    initTimeSlider();
});

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