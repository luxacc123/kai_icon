// Connector 2: festivals en volksfeesten uit Wikidata (productie).
// Wikidata is de whitelisted bron voor traditionele feesten wereldwijd:
// elk feest met een Wikipedia-pagina, met coördinaten en meertalige naam.
// Gratis, CC0-licentie. Draaien: node pipeline/fetch_wikidata.js
// NB: vereist uitgaande toegang tot query.wikidata.org (in de
// ontwikkel-sandbox geblokkeerd; in productie gewoon bereikbaar).
const fs = require("fs");
const path = require("path");

const SPARQL = `
SELECT ?item ?itemLabel ?typeLabel ?coord ?sitelinks ?countryLabel WHERE {
  VALUES ?cls { wd:Q132241 wd:Q868557 wd:Q4618 }   # festival, muziekfestival, carnaval
  ?item wdt:P31 ?cls .
  ?item wikibase:sitelinks ?sitelinks .
  FILTER(?sitelinks >= 5)                          # >= 5 Wikipedia-talen = relevant
  OPTIONAL { ?item wdt:P625 ?c1 }
  OPTIONAL { ?item wdt:P276 ?l1 . ?l1 wdt:P625 ?c2 }
  OPTIONAL { ?item wdt:P131 ?l2 . ?l2 wdt:P625 ?c3 }
  BIND(COALESCE(?c1, ?c2, ?c3) AS ?coord)
  FILTER(BOUND(?coord))
  OPTIONAL { ?item wdt:P17 ?country }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "nl,en". }
}
ORDER BY DESC(?sitelinks)
LIMIT 2000`;

const TYPE_MAP = { carnaval: "Carnaval", muziekfestival: "Muziekfestival" };

async function run() {
  const url = "https://query.wikidata.org/sparql?format=json&query=" + encodeURIComponent(SPARQL);
  const res = await fetch(url, { headers: { "User-Agent": "Feestkaart/0.1 (data-pijplijn)" } });
  if (!res.ok) throw new Error(`WDQS ${res.status}`);
  const data = await res.json();

  const out = data.results.bindings.map(b => {
    const m = /Point\(([-\d.]+) ([-\d.]+)\)/.exec(b.coord.value);
    if (!m) return null;
    const type = TYPE_MAP[(b.typeLabel?.value || "").toLowerCase()] || "Volksfeest";
    return {
      name: b.itemLabel.value,
      scope: "stad", type,                       // scope-verfijning: latere stap
      lat: +(+m[2]).toFixed(4), lng: +(+m[1]).toFixed(4),
      place: b.countryLabel?.value || "",
      start: null, end: null,                    // datums via P837/P580 in vervolgstap
      rating: null, reviews: 0, ticket: false,
      tags: [], desc: "",
      verified: true, community: false,
      src: "Wikidata / Wikipedia",
      wikidata: b.item.value.split("/").pop(),
    };
  }).filter(Boolean);

  const dir = path.join(__dirname, "out");
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "events-wikidata.json"), JSON.stringify(out, null, 1));
  console.log(`events-wikidata.json: ${out.length} feesten`);
}

run().catch(e => { console.error("Mislukt:", e.message); process.exit(1); });
