# Feestkaart — elk feest, één kaart

[![Data-pijplijn](https://github.com/luxacc123/kai_icon/actions/workflows/data-pipeline.yml/badge.svg)](https://github.com/luxacc123/kai_icon/actions/workflows/data-pipeline.yml)
[![Site deploy](https://github.com/luxacc123/kai_icon/actions/workflows/deploy-pages.yml/badge.svg)](https://github.com/luxacc123/kai_icon/actions/workflows/deploy-pages.yml)

**De Google Maps van feestjes.** Zie op één kaart welke feesten er nú actief zijn in jouw dorp, stad, regio of land — met per feest de classificatie van hoe ver het reikt (het *feestgebied*), reviews als maatstaf, en directe ticketlinks.

**Live:** https://luxacc123.github.io/kai_icon/ (na de eerste deploy op `main`)

## Wat zit erin

- **Bereik-classificatie**: elk feest geldt voor een gebied — dorp, stad, gemeente, regio, land of wereldwijd. Eigen kleur per niveau, cirkel op de kaart toont het feestgebied.
- **Filters**: soort feest, gratis/met ticket, nu bezig, dit weekend.
- **Reviews**: beoordelingen tellen live mee in de rating en blijven bewaard op het apparaat.
- **Feest toevoegen**: bezoekers zetten zelf feesten op de kaart. Huisfeesten, straatraves en alternatieve feesten vormen een aparte *community*-laag (eigen pin-vorm, eigen schakelaar).
- **Verificatie**: feesten uit officiële bronnen dragen een "Geverifieerd"-badge met bronvermelding; inzendingen zijn "Onbevestigd" tot een tweede bron ze bevestigt.
- **Organisator-ticketing**: organisatoren kunnen bij het toevoegen kiezen voor kaartverkoop via Feestkaart (servicefee-model).

## Datapijplijn (`pipeline/`)

Draait elke nacht automatisch via GitHub Actions (`.github/workflows/data-pipeline.yml`) en commit een verse `assets/events.json`:

| Script | Bron | Werkt |
|---|---|---|
| `fetch_holidays.js` | Officiële feestdagregels van 46 landen (offline dataset) | direct |
| `fetch_wikidata.js` | Wikidata/Wikipedia: traditionele feesten wereldwijd | in CI/productie |
| `fetch_ticketmaster.js` | Ticketmaster Discovery API: ticket-events + echte ticket-URL's | na API-key |
| `merge.js` | Ontdubbeling (naam + afstand) en samenvoegen van bronnen | direct |

Lokaal draaien: `cd pipeline && npm install && cd .. && node pipeline/fetch_holidays.js && node pipeline/merge.js`

### Ticketmaster activeren

1. Maak een gratis key aan op https://developer.ticketmaster.com
2. Repo → Settings → Secrets and variables → Actions → **New repository secret**: naam `TM_API_KEY`, waarde je key.
3. Klaar — de eerstvolgende pijplijn-run haalt duizenden echte ticket-events binnen.

## Deploy

`.github/workflows/deploy-pages.yml` publiceert de site bij elke push naar `main` naar GitHub Pages. Mocht de eerste run klagen over Pages: Settings → Pages → Source op **GitHub Actions** zetten.

## Roadmap

1. Echte backend (Supabase): accounts, reviews en inzendingen centraal i.p.v. per apparaat, moderatie.
2. Wikidata-verrijking: datums (P837), scope-afleiding, beschrijvingen.
3. Affiliate-netwerken (Awin/Impact) op de ticketlinks; daarna eigen kaartverkoop voor de long tail.
4. Notificaties: "feest in jouw buurt volgende week".
