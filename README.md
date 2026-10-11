# Cappelen Dimyr Projects – UI-utkast

En fristående, klickbar prototyp för flödet:

`Lead → Förfrågan → Kvalificering → Go/No Go → Projekt → Artiklar → Offertversioner`

## Starta

Appen är en statisk HTML/JS-prototyp (inte Next.js). Inloggning sker i webbläsaren med `@supabase/supabase-js`. Alla vyer ligger i `index.html` och hålls dolda tills Supabase Auth har en giltig session.

```bash
npm install
npm run build
python3 -m http.server 3000 --directory dist
```

Öppna därefter `http://localhost:3000/`. `npm start` gör samma bygge och startar servern.

`npm run build` kontrollerar att inloggningsgrinden finns, syntaxkollar skripten och samlar en publicerbar kopia i `dist/`. Bygget läser `NEXT_PUBLIC_SUPABASE_URL` och `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` från miljön eller från en lokal `.env` (se `.env.example`). Saknas de används de publika standardvärdena i `JS/supabase-config.js`. Service role-nyckeln ska inte sättas i de här variablerna.

## Filer

- `index.html` – appens vyer, inloggningsskärm och grundstruktur
- `CSS/styles.css` – komplett responsiv design
- `JS/auth.js` – Supabase-inloggning, grind och utloggning
- `JS/supabase-config.js` – publik Supabase-URL och publishable key
- `JS/data.js` – separat lokalt datalager för läsning, lagring och Lead-/förfrågningsoperationer
- `JS/app.js` – UI, navigation, artiklar, offerter, acceptans, vunna projekt och leveransuppföljning
- `data/demo-data.json` – gemensamma statusvärden och datatyper

Artiklar beräknar automatiskt kvm och produktionskostnad från storlek × godkänt pris/kvm. Prisförslag från tillverkare sparas i artikelns historik. En ny offertversion tar en ögonblicksbild av projektets aktuella artiklar, så senare storleks- eller prisändringar inte förändrar en äldre version.

Prototypen använder exempeldata och sparar ändringar lokalt i webbläsaren (IndexedDB, med äldre `localStorage` som reserv). Lagringen går via ett separat adapterlager i `JS/data.js`, vilket ger en tydlig utbytespunkt för en framtida Supabase-adapter. Affärsdata läses inte från Supabase. Ingen SQL-migration ingår.

## Inloggning

Oinloggade besökare ser bara inloggningssidan. E-post och lösenord skickas till Supabase Auth. Efter lyckad inloggning visas appen på samma adress, och `JS/data.js` samt `JS/app.js` laddas först då. Utloggning finns i sidomenyn och i toppmenyn (`Logga ut`) och tar bort sessionen.

Det finns bara en HTML-sida. Grinden är klientbaserad: den döljer gränssnittet och hämtar inte appens skript utan session, men den är inte en serversideskontroll. När data flyttas till Supabase behöver tabellerna RLS, se nedan.

### Supabase

Projektets publika värden (får ligga i klienten):

- URL: `https://emludmnxyuzbicgkzhpn.supabase.co`
- Publishable key: `sb_publishable_GPRmV7tqR6WTYd2KwGMDNQ_MRP7YdQ4`

E-postinloggning ska vara på. När den här grinden lades till var öppen självregistrering fortfarande tillåten, och nya konton måste bekräfta e-post innan de kan logga in. Kontrollera inställningarna och gör så här för ett stängt verktyg:

1. Öppna Supabase Dashboard → Authentication → Providers (eller Sign In / Up) → Email.
2. Låt e-post och lösenord vara aktiverat.
3. Stäng av **Allow new users to sign up** så att ingen kan skapa konto via API:t. Appen har ingen registreringsknapp.
4. Skapa användare under Authentication → Users → **Add user**. Ange e-post och lösenord och bocka i **Auto Confirm User**, eftersom automatisk e-postbekräftelse är av. Utan den kryssrutan, eller utan ett klick på bekräftelsemejlet, nekas inloggningen.
5. Lägg inte in service role-nyckeln i frontend, `.env` eller hostingmiljön för den här appen.

### Hosting

Publicera mappen `dist/` efter `npm run build`. På Netlify, Vercel, Cloudflare Pages eller liknande: build command `npm run build`, publish directory `dist`. Sätt `NEXT_PUBLIC_SUPABASE_URL` och `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` i hostingmiljön om de ska skilja sig från standardvärdena. Bygget bakar in dem i `dist/JS/supabase-config.js`. En ren statisk server utan bygge använder inte `.env`.

### Testa inloggningen

1. Skapa en användare enligt stegen ovan.
2. Kör `npm install`, `npm run build` och öppna `http://localhost:3000/`.
3. Kontrollera att offertverktyget inte syns, och att ett felaktigt lösenord ger "Fel e-postadress eller lösenord." utan att öppna appen.
4. Logga in med användaren. Översikten ska visas, och sidomenyn ska visa e-postadressen.
5. Ladda om sidan: sessionen ska räcka för att komma in utan formuläret.
6. Välj **Logga ut**. Inloggningssidan ska visas igen, även efter omladdning.
7. Öppna en privat flik: inloggning krävs på nytt.

### RLS

Appen läser inga Supabase-tabeller, så den här ändringen rör inte databasen. När en Supabase-adapter läggs till ska Row Level Security vara påslaget på de tabellerna, och policies ska kräva en inloggad användare (`authenticated`, till exempel `auth.uid() is not null`). Publishable key är publik; utan RLS kan vem som helst med nyckeln läsa data även om gränssnittet kräver inloggning.

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
