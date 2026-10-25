const $ = id => document.getElementById(id);
const store = chrome.storage.local;
const form = $('form');
const KEYS = ['profile', 'resumes', 'activeResume', 'autoSites'];
const MAX_RESUME = 5 * 1024 * 1024;

const showTab = name => {
  for (const b of document.querySelectorAll('nav button')) {
    b.classList.toggle('on', b.dataset.tab === name);
    $(b.dataset.tab).hidden = b.dataset.tab !== name;
  }
};
for (const b of document.querySelectorAll('nav button')) b.onclick = () => showTab(b.dataset.tab);

// --- My info ---
const addRow = (label = '', value = '') => {
  const row = document.createElement('div');
  row.className = 'row';
  row.innerHTML = '<input placeholder="Field name, e.g. GitHub" aria-label="Field name"><input placeholder="Your answer" aria-label="Your answer"><button type="button" class="x" aria-label="Remove field">×</button>';
  const [l, v] = row.querySelectorAll('input');
  l.value = label;
  v.value = value;
  row.querySelector('button').onclick = () => row.remove();
  $('custom').append(row);
};
$('add').onclick = () => addRow();

const showProfile = (profile = {}) => {
  for (const el of form.elements) if (el.name) el.value = profile[el.name] || '';
  $('custom').replaceChildren();
  (profile.custom || []).forEach(c => addRow(c.label, c.value));
};

form.onsubmit = async e => {
  e.preventDefault();
  const profile = {};
  for (const el of form.elements) if (el.name) profile[el.name] = el.value.trim();
  profile.custom = [...$('custom').children]
    .map(row => { const [l, v] = row.querySelectorAll('input'); return { label: l.value.trim(), value: v.value.trim() }; })
    .filter(c => c.label && c.value);
  await store.set({ profile });
  showTab('fill');
  $('fill-status').textContent = 'Saved.';
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
    const ok = data && typeof data === 'object'
      && (!data.profile || typeof data.profile === 'object')
      && (!data.resumes || Array.isArray(data.resumes))
      && (!data.autoSites || Array.isArray(data.autoSites));
    if (!ok) throw new Error();
    const clean = Object.fromEntries(KEYS.filter(k => k in data).map(k => [k, data[k]]));
    if (clean.resumes) clean.resumes = clean.resumes.filter(r => ['id', 'name', 'note', 'data'].every(k => typeof r?.[k] === 'string'));
    if (clean.autoSites) clean.autoSites = clean.autoSites.filter(h => typeof h === 'string');
    await store.set(clean);
    showProfile(clean.profile);
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
  showProfile(data.profile);
  renderResumes();
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  host = /^https?:/.test(tab?.url || '') ? new URL(tab.url).hostname : '';
  if (host) {
    $('auto-label').textContent = `Auto-fill on ${host}`;
    $('auto').checked = (data.autoSites || []).includes(host);
  } else {
    $('auto').disabled = true;
  }
  if (!data.profile?.email) showTab('info'); // first run: ask for info before anything else
})();
