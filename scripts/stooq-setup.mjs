/**
 * Prints step-by-step instructions for Stooq SPY access (no traditional API signup).
 */
console.log(`
Stooq does NOT have an "API keys" page or developer dashboard.

The "apikey" is a token embedded in the CSV download link after you pass a captcha.

Steps (use a normal browser — not this terminal):

  1. Open SPY historical data:
     https://stooq.com/q/d/?s=spy.us

  2. Scroll to the bottom of the price table.

  3. Click the triangle:
     "▼ Download data in csv file..."
     (Polish site: "▼ Pobierz dane w pliku csv...")

  4. If Stooq shows a captcha ("Rewrite the above code"), type the letters/numbers
     and submit. You may see "Authorization succeeded" / "Autoryzacja powiodła się!".

  5. Right-click the CSV download link → Copy link address
     (do NOT use "Save link as" unless you also copy the URL from the download bar).

  6. The URL looks like:
     https://stooq.com/q/d/l/?s=spy.us&i=d&apikey=XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

  7. Add to your `.env` file — the line MUST start with the variable name:

     STOOQ_SPY_CSV_URL=https://stooq.com/q/d/l/?s=spy.us&i=d&apikey=YOUR_KEY_HERE

     Wrong (will not work): pasting only the URL on its own line with no STOOQ_SPY_CSV_URL=

     Or extract only the apikey value:

     STOOQ_API_KEY=YOUR_KEY_HERE

  8. Refresh market data (restart `npm run dev` if it is already running):

     npm run update-sp500

  9. For GitHub Actions / Supabase edge function, set the same value as a secret
     (STOOQ_API_KEY or STOOQ_SPY_CSV_URL).

If the download link never shows an apikey= parameter, complete the captcha on the
main table first, then expand the download section again.

If the link stops working later, repeat the captcha — Stooq keys can expire.
`)
