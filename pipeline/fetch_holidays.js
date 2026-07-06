// Connector 1: nationale feestdagen — offline dataset (date-holidays, ~200
// landen met officiële feestdagregels). Filtert op feestelijke dagen
// (carnaval, nationale dagen, heiligenfeesten, lichtfeesten enz.), pakt per
// feest de eerstvolgende datum en zet alles om naar het Feestkaart-schema.
// Draaien: node pipeline/fetch_holidays.js
const fs = require("fs");
const path = require("path");
const Holidays = require("date-holidays");
const countries = require("world-countries");

const COUNTRIES = [
  "NL","BE","DE","FR","ES","PT","IT","GB","IE","DK","SE","NO","FI","IS",
  "PL","CZ","AT","CH","HU","RO","BG","GR","HR","RS","TR",
  "SK","SI","LU","EE","LV","LT","UA","MT","CY","AL","BA","MK","ME",
  "US","CA","MX","BR","AR","CL","CO","PE","UY","EC","BO","PY","VE","CR","PA","DO","JM","CU","GT",
  "AU","NZ","JP","KR","CN","IN","TH","VN","ID","PH","MY","SG","TW","HK","AE","IL",
  "ZA","MA","EG","KE","NG","GH","TZ","ET","SN",
];

// Alleen dagen met een feestelijk karakter — geen herdenkingen of stille
// religieuze dagen. Woordgrenzen waar verwarring dreigt (holi vs holiday).
const FESTIVE = [
  /carnaval|carnival|carnevale|karneval|fasching|fastnacht|vastenavond/i,
  /konings|king's day|fête du roi|koningin/i,
  /national|nationale|nacional|independen|republi|bevrijding|liberation/i,
  /\bsan\b|\bsant\b|\bsaint\b|\bsint\b|\bsankt\b|patrick/i,
  /fiesta|festa\b|midsummer|midsommar|juhannus|sankthans|midzomer/i,
  /muertos|diwali|deepavali|\bholi\b|songkran|\beid\b|lunar new year|春节/i,
  /australia day|canada day|waitangi|bastille|quatorze/i,
  /reyes magos|epifan|driekoningen|three kings/i,
  /matsuri|obon|chuseok|mid-autumn|中秋|vesak|loi krathong|loy krathong/i,
  /junina|são joão|sao joao|ferragosto|nowruz|norooz|santa lucia/i,
];
// Kerst en oud & nieuw staan al als wereldwijd feest op de kaart; en géén
// herdenkingen of stille dagen — dit is een feestkaart.
const SKIP = /christmas|kerst|navidad|natale|noël|weihnacht|nadal|new year|nieuwjaar|año nuevo|capodanno|jour de l'an|neujahr|ano novo|herdenk|memorial|remembrance|armistice|veteran|anzac|mourning|dodenherdenking|allerzielen|all souls|valentin/i;

const today = new Date("2026-07-06");
const out = [];

for (const cc of COUNTRIES) {
  const country = countries.find(c => c.cca2 === cc);
  if (!country || !country.latlng) continue;
  const nameNl = (country.translations && country.translations.nld && country.translations.nld.common) || country.name.common;
  let hd;
  try { hd = new Holidays(cc); } catch { continue; }   // land zonder dataset: overslaan
  const all = [...(hd.getHolidays(2026) || []), ...(hd.getHolidays(2027) || [])]
    .filter(h => ["public", "observance", "optional", "bank"].includes(h.type))
    .filter(h => FESTIVE.some(rx => rx.test(h.name)) && !SKIP.test(h.name));

  // per feestnaam de eerstvolgende datum kiezen
  const byName = new Map();
  for (const h of all) {
    const start = h.date.slice(0, 10);
    const cur = byName.get(h.name);
    const isFuture = new Date(start) >= today;
    if (!cur || (isFuture && (!cur.future || start < cur.start))) {
      byName.set(h.name, { ...h, start, future: isFuture });
    }
  }

  let i = 0;
  for (const h of byName.values()) {
    // meerdere feestdagen per land: pins licht spreiden rond het middelpunt
    const jitter = n => ((n * 2654435761 % 100) / 100 - 0.5) * 1.6;
    const end = h.end ? new Date(new Date(h.end) - 864e5).toISOString().slice(0, 10) : h.start;
    out.push({
      name: h.name,
      scope: "land", type: "Feestdag",
      lat: +(country.latlng[0] + jitter(i)).toFixed(4),
      lng: +(country.latlng[1] + jitter(i * 7 + 3)).toFixed(4),
      place: nameNl,
      start: h.start, end: end >= h.start ? end : h.start,
      rating: null, reviews: 0, ticket: false,
      tags: ["feestdag", nameNl.toLowerCase()],
      desc: `Officiële feestdag in ${nameNl}.`,
      verified: true, community: false,
      src: "Nationale feestdagenkalender",
    });
    i++;
  }
}

const dir = path.join(__dirname, "out");
fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(path.join(dir, "events-holidays.json"), JSON.stringify(out, null, 1));
console.log(`events-holidays.json: ${out.length} feestdagen uit ${COUNTRIES.length} landen`);
