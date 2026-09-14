# Cappelen Dimyr Projects – UI-utkast

En fristående, klickbar prototyp för flödet:

`Lead → Förfrågan → Kvalificering → Go/No Go → Projekt → Artiklar → Offertversioner`

## Starta

Öppna `index.html` direkt i webbläsaren eller kör en enkel lokal webbserver i mappen, exempelvis:

```bash
python -m http.server 3000
```

Öppna därefter `http://localhost:3000/index.html`.

## Filer

- `index.html` – appens vyer och grundstruktur
- `CSS/styles.css` – komplett responsiv design
- `JS/data.js` – separat lokalt datalager för läsning, lagring och Lead-/förfrågningsoperationer
- `JS/app.js` – UI, navigation, artiklar, offerter, acceptans, vunna projekt och leveransuppföljning
- `data/demo-data.json` – gemensamma statusvärden och datatyper

Artiklar beräknar automatiskt kvm och produktionskostnad från storlek × godkänt pris/kvm. Prisförslag från tillverkare sparas i artikelns historik. En ny offertversion tar en ögonblicksbild av projektets aktuella artiklar, så senare storleks- eller prisändringar inte förändrar en äldre version.

Prototypen använder exempeldata och sparar ändringar lokalt i webbläsarens `localStorage`. Lagringen går via ett separat adapterlager i `JS/data.js`, vilket ger en tydlig utbytespunkt för en framtida Supabase-adapter. Ingen Supabase-koppling eller SQL-migration ingår ännu.

## Aktuella funktioner

- Leads kan läggas till, ändras och tas bort samt sorteras efter förväntad startmånad. Kommentarer kan redigeras direkt i Leads-tabellen.
- Ett aktivt lead kan konverteras till en förfrågan; namn, kommentar och förväntad start följer med och ursprunget sparas.
- Dashboarden visar de tre aktiva leads som har närmast förväntad start.
- Offerter kan markeras som skickade, accepterade eller avböjda.
- Acceptansen sparar datum, kontaktperson, metod, PO-nummer, belopp och preliminär leverans.
- Accepterad offert låses och projektet blir automatiskt Vunnet.
- Övriga aktiva offertversioner för projektet blir Ersatta.
- Offerter har flikarna Aktiva, Accepterade, Förlorade och Alla.
- Vunna projekt följs vidare genom order-, produktions- och leveransstatus.
