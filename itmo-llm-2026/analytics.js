/* ITMO editorial atlas: privacy-first, opt-in Plausible bridge.
   Without a registered site/domain, legalReady=true and per-visitor consent,
   no third-party analytics resources are loaded. No free-text fields ever leave.
*/
(function () {
  'use strict';
  const c = window.ITMO_ANALYTICS_CONFIG || {};
  const serviceReady = c.provider === 'plausible'
    && typeof c.domain === 'string'
    && /^(?=.{4,253}$)[a-z0-9][a-z0-9.-]*[a-z0-9]$/i.test(c.domain)
    && c.domain.includes('.')
    && c.legalReady === true;
  const dnt = navigator.doNotTrack === '1' || window.doNotTrack === '1'
    || navigator.globalPrivacyControl === true;
  const key = 'itmo-llm-2026-analytics-consent-v1';
  const get = id => document.getElementById(id);
  const modal = get('analytics-dialog');
  const status = get('analytics-status');
  const banner = get('analytics-banner');
  let choice = null;
  let loaded = false;
  try {
    const saved = localStorage.getItem(key);
    if (saved === 'yes' || saved === 'no') choice = saved;
  } catch (_) {}

  // A fixed schema is safer than copying the original CustomEvent.detail.
  // Never include URLs, model outputs, prompt text, versions or search queries.
  const fields = Object.freeze({
    search_open: {source:['searchbtn','navsearch','coversearch']},
    search_result_open: {chapter:['context','findings','data','models','benchmarks','training','sectors','future','glossary','sources'],kind:['model','glossary','article']},
    model_outbound: {index:'int16',kind:['chat','weights','code','docs','evidence','paper','demo']},
    model_access_filter: {value:['all','chat','weights','restricted']},
    model_type_filter: {value:['all','open','own','adapt','niche']},
    compare_models: {a:'int16',b:'int16'},
    test_prompt_copy: {prompt:'int4'},
    stage_next:{},
    stage_previous:{},
    share_issue:{},
    scenario_selected: {scenario:['general','medical','code']},
    chapter_navigation: {chapter:['cover','context','findings','data','models','benchmarks','training','sectors','future','glossary','sources']},
    source_pdf_open:{},
    lab_task_select: {task:['ru','logic','business','code']},
    lab_model_select: {index:'int16'},
    lab_prompt_copy: {task:['ru','logic','business','code']},
    lab_result_saved: {task:['ru','logic','business','code'],modelIndex:'int16'},
    lab_results_export: {count:'int50'},
    lab_results_clear:{},
    training_stage_explain: {step:'int7'}
  });
  function clean(event) {
    const detail = event && event.detail;
    if (!detail || typeof detail.event !== 'string' || !Object.prototype.hasOwnProperty.call(fields, detail.event)) return null;
    const schema = fields[detail.event];
    const props = {};
    Object.keys(schema).forEach(key => {
      const allowed = schema[key], raw = detail[key];
      if (Array.isArray(allowed)) {
        if (typeof raw === 'string' && allowed.includes(raw)) props[key] = raw;
      } else if (typeof allowed === 'string' && allowed.startsWith('int')) {
        const limit = Number(allowed.slice(3));
        if (typeof raw === 'number' && Number.isInteger(raw) && raw >= 0 && raw <= limit) props[key] = raw;
      }
    });
    return {name:'Atlas · '+detail.event, props};
  }
  function showStatus() {
    if (!status) return;
    if (!serviceReady) {
      status.textContent = 'Внешняя аналитика пока не подключена. События остаются только в браузере.';
    } else if (dnt) {
      status.textContent = 'Ваш браузер запросил не отслеживать действия. Аналитика отключена.';
    } else if (choice === 'yes') {
      status.textContent = 'Вы разрешили обезличенную аналитику. Можно отозвать согласие в любой момент.';
    } else if (choice === 'no') {
      status.textContent = 'Вы запретили аналитику. Данные не отправляются.';
    } else {
      status.textContent = 'Аналитика не включена. Вы можете добровольно разрешить или отклонить её.';
    }
    const allow = get('analytics-allow');
    const reject = get('analytics-reject');
    if (allow) allow.disabled = !serviceReady || dnt || choice === 'yes';
    if (reject) reject.disabled = choice === 'no';
    if (banner) banner.hidden = !serviceReady || dnt || choice !== null;
  }
  function remember(value) {
    choice = value;
    try { localStorage.setItem(key, value); } catch (_) {
      // Without persistent consent, do not activate a remote tracker.
      choice = null;
      showStatus();
      if (status) status.textContent = 'Браузер не сохраняет согласие. Аналитика осталась выключенной.';
      return false;
    }
    showStatus();
    return true;
  }
  function installPlausible() {
    if (!serviceReady || dnt || choice !== 'yes' || loaded) return;
    loaded = true;
    window.plausible = window.plausible || function () {
      (window.plausible.q = window.plausible.q || []).push(arguments);
    };
    const s = document.createElement('script');
    s.async = true;
    s.dataset.domain = c.domain;
    s.src = 'https://plausible.io/js/script.js';
    s.id = 'itmo-plausible-script';
    document.head.appendChild(s);
  }
  function closeModal() { if (modal && modal.open) modal.close(); }
  function openModal() {
    if (!modal) return;
    showStatus();
    if (!modal.open) modal.showModal();
    const close = get('analytics-close');
    if (close) close.focus();
  }
  const open = get('analytics-open');
  const close = get('analytics-close');
  const allow = get('analytics-allow');
  const reject = get('analytics-reject');
  const bannerAllow = get('analytics-banner-allow');
  const bannerReject = get('analytics-banner-reject');
  if (open) open.addEventListener('click', openModal);
  if (close) close.addEventListener('click', closeModal);
  if (modal) modal.addEventListener('click', event => {
    if (event.target === modal) closeModal();
  });
  function permit() {
    if (!serviceReady || dnt) return;
    if (!remember('yes')) return;
    installPlausible();
    closeModal();
  }
  function deny() {
    const hadTracker = loaded;
    remember('no');
    closeModal();
    // The third-party script cannot reliably be unloaded. Reload to stop
    // its listeners and any further pageview tracking after consent withdrawal.
    if (hadTracker) window.location.reload();
  }
  if (allow) allow.addEventListener('click', permit);
  if (bannerAllow) bannerAllow.addEventListener('click', permit);
  if (reject) reject.addEventListener('click', deny);
  if (bannerReject) bannerReject.addEventListener('click', deny);

  document.addEventListener('itmo:interaction', event => {
    if (!serviceReady || dnt || choice !== 'yes' || !loaded) return;
    const safe = clean(event);
    if (!safe || typeof window.plausible !== 'function') return;
    // Plausible custom goal must be configured to appear in its dashboard.
    window.plausible(safe.name, {props: safe.props});
  });
  showStatus();
  installPlausible();
  // Publicly accessible test helper exposes ONLY whitelisted schema, never data.
  window.ITMO_ANALYTICS_STATUS = () => ({
    serviceReady: Boolean(serviceReady), dnt: Boolean(dnt),
    consent: choice === 'yes' ? 'granted' : choice === 'no' ? 'denied' : 'unset',
    collectorLoaded: Boolean(loaded)
  });
}());
