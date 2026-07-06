// Connector 3: Ticketmaster Discovery API — ticket-events wereldwijd met
// echte ticket-URL's. Gratis API-key via developer.ticketmaster.com; zet die
// als omgevingsvariabele TM_API_KEY (lokaal) of als repo-secret (CI).
// Zonder key slaat de connector zichzelf netjes over, zodat de rest van de
// pijplijn gewoon doorloopt. Draaien: TM_API_KEY=... node pipeline/fetch_ticketmaster.js
const fs = require("fs");
const path = require("path");

const KEY = process.env.TM_API_KEY;
if (!KEY) {
  console.log("TM_API_KEY niet gezet — Ticketmaster-connector overgeslagen.");
  process.exit(0);
}

// Landen met Ticketmaster-dekking; uit te breiden naarmate het bereik groeit.
const COUNTRIES = ["NL","BE","DE","FR","ES","PT","IT","GB","IE","AT","CH","DK","SE","NO","PL","CZ","US","CA","MX","AU","NZ"];
const BASE = "https://app.ticketmaster.com/discovery/v2/events.json";
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function fetchCountry(cc) {
  const events = [];
  for (let page = 0; page < 3; page++) {           // max 3×200 per land per run
    const url = `${BASE}?apikey=${KEY}&countryCode=${cc}&classificationName=Festival&size=200&page=${page}&sort=date,asc`;
    const res = await fetch(url);
    if (res.status === 429) { await sleep(2000); page--; continue; }
    if (!res.ok) { console.warn(`${cc}: HTTP ${res.status}`); break; }
    const data = await res.json();
    const list = data._embedded?.events || [];
    events.push(...list);
    if (page >= (data.page?.totalPages || 1) - 1) break;
    await sleep(250);                               // rate-limit: 5 req/s
  }
  return events;
}

function normalize(e) {
  const venue = e._embedded?.venues?.[0];
  const loc = venue?.location;
  if (!loc?.latitude || !loc?.longitude) return null;
  const start = e.dates?.start?.localDate;
  if (!start) return null;
  return {
    name: e.name,
    scope: "stad", type: "Muziekfestival",
    lat: +(+loc.latitude).toFixed(4), lng: +(+loc.longitude).toFixed(4),
    place: [venue?.city?.name, venue?.country?.name].filter(Boolean).join(", "),
    start, end: e.dates?.end?.localDate || start,
    rating: null, reviews: 0, ticket: true,
    url: e.url,                                    // echte ticketpagina
    tags: (e.classifications || []).flatMap(c => [c.genre?.name, c.segment?.name]).filter(Boolean).map(s => s.toLowerCase()),
    desc: venue?.name ? `Bij ${venue.name}.` : "",
    verified: true, community: false,
    src: "Ticketmaster",
  };
}

async function run() {
  const out = [];
  for (const cc of COUNTRIES) {
    const raw = await fetchCountry(cc);
    const norm = raw.map(normalize).filter(Boolean);
    out.push(...norm);
    console.log(`${cc}: ${norm.length} events`);
    await sleep(250);
  }
  const dir = path.join(__dirname, "out");
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "events-ticketmaster.json"), JSON.stringify(out, null, 1));
  console.log(`events-ticketmaster.json: ${out.length} ticket-events uit ${COUNTRIES.length} landen`);
}

run().catch(e => { console.error("Mislukt:", e.message); process.exit(1); });
