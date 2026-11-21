/* Atlas privacy-first analytics. Default: OFF.
   1. Register this site in Plausible.
   2. Paste the site-specific URL from its official installation snippet.
   3. After legal/privacy review, set legalReady to true.
   4. Each visitor must still explicitly opt in.
   Never publish any private dashboard API key here.
*/
window.ITMO_ANALYTICS_CONFIG = Object.freeze({
  provider: 'plausible',
  siteScriptUrl: '', // e.g. https://plausible.io/js/pa-XXXXX.js (unique to your site)
  legalReady: false
});
