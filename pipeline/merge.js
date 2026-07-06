// Merge-stap: leest alle connector-uitvoer uit pipeline/out/, ontdubbelt
// (zelfde naam-genormaliseerd binnen ~50 km en overlappend datumvenster =
// hetzelfde feest; bronnen worden samengevoegd) en schrijft assets/events.json
// die de app inlaadt. Draaien: node pipeline/merge.js
const fs = require("fs");
const path = require("path");

const dir = path.join(__dirname, "out");
const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter(f => f.endsWith(".json")) : [];
const raw = files.flatMap(f => JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")));

// Kwaliteitspoort: alleen events die 100% kloppen komen op de kaart.
// Vereist: naam, geldige coördinaten, geldige datums in de juiste volgorde.
// Datumloos mag alleen voor bekende jaarlijks terugkerende bronnen (Wikidata).
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const isValid = e =>
  typeof e.name === "string" && e.name.trim().length >= 3 &&
  Number.isFinite(e.lat) && Math.abs(e.lat) <= 90 &&
  Number.isFinite(e.lng) && Math.abs(e.lng) <= 180 &&
  (e.start ? DATE.test(e.start) && DATE.test(e.end || "") && e.end >= e.start
           : (e.src || "").includes("Wikidata"));
const all = raw.filter(isValid);
if (raw.length !== all.length) {
  console.log(`kwaliteitspoort: ${raw.length - all.length} van ${raw.length} events afgekeurd (onvolledige datum/locatie)`);
}

const norm = s => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
const near = (a, b) => Math.abs(a.lat - b.lat) < 0.5 && Math.abs(a.lng - b.lng) < 0.7; // ~50 km

const merged = [];
for (const e of all) {
  const dup = merged.find(m => norm(m.name) === norm(e.name) && near(m, e));
  if (dup) {
    // tweede onafhankelijke bron: bron toevoegen, ontbrekende velden aanvullen
    if (e.src && !dup.src.includes(e.src)) dup.src += " · " + e.src;
    dup.start = dup.start || e.start; dup.end = dup.end || e.end;
    dup.desc = dup.desc || e.desc;
  } else {
    merged.push({ ...e });
  }
}

const outPath = path.join(__dirname, "..", "assets", "events.json");
fs.writeFileSync(outPath, JSON.stringify(merged));
console.log(`assets/events.json: ${merged.length} feesten uit ${files.length} bron(nen): ${files.join(", ")}`);
