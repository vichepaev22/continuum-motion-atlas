import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const match = html.match(/var modelAccess=(\[[^\n]+\]);\s*var models=\[/);
if (!match) throw new Error('Model-access array was not found');
const models = JSON.parse(match[1]);
if (models.length !== 16) throw new Error('Expected 16 ITMO model groups');

const links = [...new Map(
  models.flatMap((m, index) => m.links.map(l => ({ ...l, model: index })))
    .map(link => [link.url, link])
).values()];

async function inspect(link) {
  let response;
  try {
    response = await fetch(link.url, {
      method: 'HEAD', redirect: 'follow',
      headers: { 'User-Agent': 'ITMO-LLM-2026-editorial-link-check/1.0 (+https://github.com/vichepaev22/continuum-motion-atlas)' },
      signal: AbortSignal.timeout(12000)
    });
    // Some sites reject HEAD, especially login and app sites.
    if (response.status === 405 || response.status === 501) {
      response = await fetch(link.url, { redirect: 'follow', signal: AbortSignal.timeout(12000) });
    }
    const status = response.status;
    return { model: link.model + 1, title: link.title, url: link.url,
      status, verdict: status === 404 || status === 410 ? 'BROKEN' : status >= 200 && status < 400 ? 'OK' : 'UNKNOWN' };
  } catch (e) {
    return { model: link.model + 1, title: link.title, url: link.url,
      status: 0, verdict: 'UNKNOWN', error: String(e.message || e).slice(0, 140) };
  }
}
const results = [];
for (let i = 0; i < links.length; i += 4) {
  results.push(...await Promise.all(links.slice(i, i + 4).map(inspect)));
}
for (const v of results) console.log(`[${v.verdict}] [${String(v.status).padStart(3)}] Model #${v.model} ${v.title}: ${v.url}${v.error ? ' (' + v.error + ')' : ''}`);
const totals = Object.fromEntries(['OK','UNKNOWN','BROKEN'].map(k => [k, results.filter(r => r.verdict === k).length]));
console.log('\nTOTALS:', JSON.stringify(totals));
console.log('UNKNOWN includes access restrictions, login walls, rate limits and network failures; investigate manually, do not infer removal.');
if (totals.BROKEN > 0) process.exitCode = 1;
