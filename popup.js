const $ = id => document.getElementById(id);
const store = chrome.storage.local;
const form = $('form');
const KEYS = ['fields', 'profiles', 'activeProfile', 'profile', 'resumes', 'activeResume', 'autoSites'];
const MAX_RESUME = 5 * 1024 * 1024;

const showTab = name => {
  for (const b of document.querySelectorAll('nav button')) {
    b.classList.toggle('on', b.dataset.tab === name);
    $(b.dataset.tab).hidden = b.dataset.tab !== name;
  }
};
for (const b of document.querySelectorAll('nav button')) b.onclick = () => showTab(b.dataset.tab);

// --- My info ---
const label = key => STANDARD.find(([k]) => k === key)[1];
const el = (tag, props = {}) => Object.assign(document.createElement(tag), props);

const xButton = (onclick, name) => {
  const b = el('button', { type: 'button', className: 'x', textContent: '×', onclick });
  b.setAttribute('aria-label', `Delete ${name}`);
  return b;
};

// Email and phone: two lines, each with a "Use this" button; the one in use gets filled.
const twoLines = (row, f) => {
  const type = f.key === 'email' ? 'email' : 'text';
  const name = label(f.key).toLowerCase();
  row.dataset.use = f.use ? 1 : 0;
  const lines = [f.value, f.value2 || ''].map((value, i) => {
    const input = el('input', { value, type, placeholder: i ? `Second ${name} (optional)` : `Main ${name}` });
    input.setAttribute('aria-label', `${label(f.key)} ${i + 1}`);
    const use = el('button', { type: 'button', className: 'use' });
    use.onclick = async () => {
      row.dataset.use = i;
      paint();
      await store.set({ fields: collect() });
    };
    return [el('div', { className: 'line' }), input, use];
  });
  const paint = () => lines.forEach(([, , use], i) => {
    const on = Number(row.dataset.use) === i;
    use.textContent = on ? '✓ In use' : 'Use this';
    use.classList.toggle('on', on);
    use.setAttribute('aria-pressed', on);
  });
  const head = el('div', { className: 'field-head' });
  head.append(el('span', { textContent: label(f.key) }), xButton(() => { row.remove(); renderAddStandard(); }, label(f.key)));
  row.append(head);
  for (const [line, input, use] of lines) { line.append(input, use); row.append(line); }
  paint();
};

const addField = (f = { label: '', value: '' }) => {
  const row = el('div');
  if (TWO.includes(f.key)) {
    row.className = 'two';
    row.dataset.key = f.key;
    twoLines(row, f);
  } else if (f.key) {
    row.className = 'field';
    row.dataset.key = f.key;
    const l = el('label', { textContent: label(f.key) + ' ' });
    l.append(el('input', { value: f.value }));
    row.append(l, xButton(() => { row.remove(); renderAddStandard(); }, label(f.key)));
  } else {
    row.className = 'row';
    const l = el('input', { value: f.label, placeholder: 'Field name, e.g. Department' });
    const v = el('input', { value: f.value, placeholder: 'Your answer' });
    l.setAttribute('aria-label', 'Field name');
    v.setAttribute('aria-label', 'Your answer');
    row.append(l, v, xButton(() => row.remove(), 'this field'));
  }
  $('fields').append(row);
};
$('add').onclick = () => addField();

// Standard fields the user deleted can be added back from this menu.
const renderAddStandard = () => {
  const shown = new Set([...$('fields').children].map(r => r.dataset.key));
  const missing = STANDARD.filter(([k]) => !shown.has(k));
  $('add-standard').hidden = !missing.length;
  $('add-standard').replaceChildren(new Option('+ Add back a standard field…', ''), ...missing.map(([k, l]) => new Option(l, k)));
};
$('add-standard').onchange = e => {
  if (!e.target.value) return;
  addField({ key: e.target.value, label: label(e.target.value), value: '', value2: '', use: 0 });
  renderAddStandard();
};

// Reads the fields from the screen.
const collect = () => [...$('fields').children].map(row => {
  const inputs = row.querySelectorAll('input');
  const key = row.dataset.key;
  if (TWO.includes(key)) return { key, label: label(key), value: inputs[0].value.trim(), value2: inputs[1].value.trim(), use: Number(row.dataset.use) };
  return key ? { key, label: label(key), value: inputs[0].value.trim() } : { label: inputs[0].value.trim(), value: inputs[1].value.trim() };
}).filter(f => f.key || f.label);

form.onsubmit = async e => {
  e.preventDefault();
  await store.set({ fields: collect() });
  showTab('fill');
  $('fill-status').textContent = 'Saved.';
};

let fields = [];
const loadInfo = async () => {
  fields = await loadFields();
  $('fields').replaceChildren();
  fields.forEach(f => addField(f));
  renderAddStandard();
};

// --- Resumes ---
const renderResumes = async () => {
  const { resumes = [], activeResume = '' } = await store.get(['resumes', 'activeResume']);
  $('resume-list').replaceChildren(...resumes.map(r => {
    const row = document.createElement('div');
    row.className = 'resume';
    row.innerHTML = '<div><strong></strong><span></span></div><button type="button" class="x" aria-label="Delete resume">×</button>';
    row.querySelector('strong').textContent = r.note;
    row.querySelector('span').textContent = `${r.name} · ${Math.ceil(r.size / 1024)} KB`;
    row.querySelector('button').onclick = async () => {
      const next = resumes.filter(x => x.id !== r.id);
      await store.set({ resumes: next, activeResume: activeResume === r.id ? '' : activeResume });
      renderResumes();
    };
    return row;
  }));
  if (!resumes.length) $('resume-list').innerHTML = '<p class="hint">No resumes yet.</p>';
  const select = $('active-resume');
  select.replaceChildren(new Option('None', ''), ...resumes.map(r => new Option(`${r.note} (${r.name})`, r.id)));
  select.value = activeResume;
};
$('active-resume').onchange = e => store.set({ activeResume: e.target.value });

const toBase64 = file => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result.split(',')[1]);
  reader.onerror = reject;
  reader.readAsDataURL(file);
});

$('resume-form').onsubmit = async e => {
  e.preventDefault();
  const file = $('resume-file').files[0];
  if (file.size > MAX_RESUME) return ($('resume-status').textContent = 'That file is over 5 MB. Please use a smaller PDF.');
  const { resumes = [], activeResume } = await store.get(['resumes', 'activeResume']);
  const r = { id: crypto.randomUUID(), note: $('resume-note').value.trim(), name: file.name, type: file.type, size: file.size, data: await toBase64(file) };
  await store.set({ resumes: [...resumes, r], activeResume: activeResume || r.id });
  e.target.reset();
  $('resume-status').textContent = 'Resume added.';
  renderResumes();
};

// --- Backup ---
$('export').onclick = async () => {
  const data = await store.get(KEYS);
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
  const a = Object.assign(document.createElement('a'), { href: url, download: 'snapfill-backup.json' });
  a.click();
  URL.revokeObjectURL(url);
};
$('import').onclick = () => $('import-file').click();
$('import-file').onchange = async e => {
  try {
    const data = JSON.parse(await e.target.files[0].text());
    const ok = data && typeof data === 'object' && !Array.isArray(data) && KEYS.some(k => k in data)
      && (!data.profile || typeof data.profile === 'object')
      && (!data.fields || Array.isArray(data.fields))
      && (!data.profiles || Array.isArray(data.profiles))
      && (!data.resumes || Array.isArray(data.resumes))
      && (!data.autoSites || Array.isArray(data.autoSites));
    if (!ok) throw new Error();
    const clean = Object.fromEntries(KEYS.filter(k => k in data).map(k => [k, data[k]]));
    if (clean.resumes) clean.resumes = clean.resumes.filter(r => ['id', 'name', 'note', 'data'].every(k => typeof r?.[k] === 'string'));
    if (clean.profiles) clean.profiles = clean.profiles
      .filter(p => typeof p?.id === 'string' && typeof p.name === 'string' && Array.isArray(p.fields))
      .map(p => ({ ...p, fields: p.fields.filter(f => typeof f?.label === 'string' && typeof f.value === 'string') }));
    if (clean.fields) clean.fields = clean.fields.filter(f => typeof f?.label === 'string' && typeof f.value === 'string');
    // Replace all saved info; for an older backup (no `fields`), loadFields then converts its profile(s).
    for (const k of ['fields', 'profiles', 'profile']) if (!clean[k]) clean[k] = null;
    if (clean.autoSites) clean.autoSites = clean.autoSites.filter(h => typeof h === 'string');
    await store.set(clean);
    await loadInfo();
    renderResumes();
    $('info-status').textContent = 'Backup imported.';
  } catch {
    $('info-status').textContent = "That file isn't a SnapFill backup.";
  }
  e.target.value = '';
};

// --- Fill tab ---
let host = '';
$('auto').onchange = async e => {
  const { autoSites = [] } = await store.get('autoSites');
  const next = e.target.checked ? [...new Set([...autoSites, host])] : autoSites.filter(h => h !== host);
  await store.set({ autoSites: next });
};

$('fill-btn').onclick = async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  try {
    const n = await fillTab(tab.id);
    $('fill-status').textContent = n ? `Filled ${n} field${n > 1 ? 's' : ''}.` : 'No matching empty fields found.';
  } catch {
    $('fill-status').textContent = "Can't fill this page (the browser blocks its own pages and the Web Store).";
  }
};

(async () => {
  const data = await store.get(KEYS);
  await loadInfo();
  renderResumes();
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  host = /^https?:/.test(tab?.url || '') ? new URL(tab.url).hostname : '';
  if (host) {
    $('auto-label').textContent = `Auto-fill on ${host}`;
    $('auto').checked = (data.autoSites || []).includes(host);
  } else {
    $('auto').disabled = true;
  }
  if (!fields.some(f => f.value)) showTab('info'); // first run: ask for info before anything else
})();
