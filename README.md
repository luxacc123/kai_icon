# 🎉 FeestKaart — demo

**De Google Maps van feestjes.** Zie op een kaart welke feesten er nú actief zijn in jouw dorp, stad, gemeente, regio of land — en hoe ver het feestgebied reikt.

## Demo openen

Open `index.html` in een browser. Geen build of server nodig (internet wel, voor de kaarttegels).

## Kernconcepten in deze demo

- **Classificatie per feest** — elk feest geldt voor een gebied: dorp, stad, gemeente, provincie/regio, land of wereldwijd. Elke classificatie heeft een eigen kleur.
- **Feestgebied-cirkel** — elke pin heeft een cirkel die laat zien hoe ver het feest reikt (per feest instelbaar, bv. Zwarte Cross = dorpsfeest met groot bereik).
- **Zoeken** — zoek "carnaval" en je ziet alle carnavalsfeesten (stad + regio); zoek "Oeteldonk" en je ziet alleen Den Bosch.
- **Nu actief** — filter op feesten die vandaag bezig zijn (groene NU-badge).
- **Reviews** — sterren + aantal reviews per feest; zo word je de maatstaf voor welk feest de moeite waard is.
- **Affiliate** — de "Tickets & info"-knop is een partner-deeplink met ref-code (demo-URL).
- **Ik ben in…** — snelkeuze (Den Bosch, Dénia, Amsterdam, Maastricht) of eigen GPS-locatie.

## Volgende stappen (productie)

1. Data-pijplijn: feestdagen-API's + gemeentelijke evenementenkalenders + handmatige curatie.
2. Backend met database (feesten, gebieden als polygonen i.p.v. cirkels, reviews, gebruikers).
3. Echte affiliate-koppelingen (ticketpartners) en click-tracking.
4. Reviews met accounts en moderatie.
