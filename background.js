// Receives completed-task counts from the Daily Planner extension.
chrome.runtime.onMessageExternal.addListener((m, sender, send) => {
  if (m?.type !== 'planner-sync' || typeof m.data !== 'object') return;
  (async () => {
    const v = await chrome.storage.local.get('cfg');
    const cfg = v.cfg || { trackers: [], ui: {} };
    cfg.trackers = cfg.trackers || [];
    let t = cfg.trackers.find(x => x.source === 'planner');
    if (!t) {
      t = { id: 'planner', type: 'manual', user: '', label: 'Daily Planner', color: '#c58af9', data: {}, source: 'planner' };
      cfg.trackers.push(t);
    }
    t.data = t.data || {};
    for (const k in m.data) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(k)) continue;
      const n = Math.max(0, Math.floor(+m.data[k]) || 0);
      n ? (t.data[k] = n) : delete t.data[k];
    }
    await chrome.storage.local.set({ cfg });
    send({ ok: true });
  })();
  return true;
});
