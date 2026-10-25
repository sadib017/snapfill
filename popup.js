const $ = id => document.getElementById(id);
const store = chrome.storage.local;
const form = $('form');
const KEYS = ['profiles', 'activeProfile', 'profile', 'resumes', 'activeResume', 'autoSites'];
const MAX_RESUME = 5 * 1024 * 1024;

const showTab = name => {
  for (const b of document.querySelectorAll('nav button')) {
    b.classList.toggle('on', b.dataset.tab === name);
    $(b.dataset.tab).hidden = b.dataset.tab !== name;
  }
};
for (const b of document.querySelectorAll('nav button')) b.onclick = () => showTab(b.dataset.tab);

// --- My info: profiles and their fields ---
let profiles = [];
let activeProfile = '';
let editing = '';
const current = () => profiles.find(p => p.id === editing);
const label = key => STANDARD.find(([k]) => k === key)[1];

const xButton = (onclick, name) => {
  const b = Object.assign(document.createElement('button'), { type: 'button', className: 'x', textContent: '×', onclick });
  b.setAttribute('aria-label', `Delete ${name}`);
  return b;
};

const addField = (f = { label: '', value: '' }) => {
  const row = document.createElement('div');
  row.className = f.key ? 'field' : 'row';
  if (f.key) {
    row.dataset.key = f.key;
    const l = document.createElement('label');
    l.textContent = label(f.key) + ' ';
    l.append(Object.assign(document.createElement('input'), { value: f.value, type: f.key === 'email' ? 'email' : 'text' }));
    row.append(l, xButton(() => { row.remove(); renderAddStandard(); }, label(f.key)));
  } else {
    const l = Object.assign(document.createElement('input'), { value: f.label, placeholder: 'Field name, e.g. Department' });
    const v = Object.assign(document.createElement('input'), { value: f.value, placeholder: 'Your answer' });
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
  addField({ key: e.target.value, label: label(e.target.value), value: '' });
  renderAddStandard();
};

const renderInfo = () => {
  $('profile-select').replaceChildren(...profiles.map(p => new Option(p.name, p.id)));
  $('profile-select').value = editing;
  $('profile-name').value = current().name;
  $('fields').replaceChildren();
  current().fields.forEach(f => addField(f));
  renderAddStandard();
  $('delete-profile').disabled = profiles.length < 2;
  $('delete-profile').textContent = 'Delete';
  $('active-profile').replaceChildren(...profiles.map(p => new Option(p.name, p.id)));
  $('active-profile').value = activeProfile;
};

// Copies what's on screen into the profile being edited.
const collect = () => {
  const p = current();
  p.name = $('profile-name').value.trim() || p.name;
  p.fields = [...$('fields').children].map(row => {
    const inputs = row.querySelectorAll('input');
    return row.dataset.key
      ? { key: row.dataset.key, label: label(row.dataset.key), value: inputs[0].value.trim() }
      : { label: inputs[0].value.trim(), value: inputs[1].value.trim() };
  }).filter(f => f.key || f.label);
};
const saveProfiles = () => store.set({ profiles, activeProfile });

$('profile-select').onchange = async e => {
  collect();
  editing = e.target.value;
  await saveProfiles();
  renderInfo();
};
$('new-profile').onclick = async () => {
  collect();
  const copy = { id: newId(), name: `Profile ${profiles.length + 1}`, fields: current().fields.map(f => ({ ...f })) };
  profiles.push(copy);
  editing = copy.id;
  await saveProfiles();
  renderInfo();
  $('profile-name').select();
};
$('delete-profile').onclick = async e => {
  if (profiles.length < 2) return;
  if (e.target.textContent !== 'Sure?') return (e.target.textContent = 'Sure?'); // click twice to delete
  profiles = profiles.filter(p => p.id !== editing);
  if (activeProfile === editing) activeProfile = profiles[0].id;
  editing = profiles[0].id;
  await saveProfiles();
  renderInfo();
};
$('active-profile').onchange = async e => {
  activeProfile = e.target.value;
  await store.set({ activeProfile });
};

form.onsubmit = async e => {
  e.preventDefault();
  collect();
  await saveProfiles();
  renderInfo();
  showTab('fill');
  $('fill-status').textContent = 'Saved.';
};

const loadInfo = async () => {
  ({ profiles, activeProfile } = await loadProfiles());
  editing = activeProfile;
  renderInfo();
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
      && (!data.profiles || Array.isArray(data.profiles))
      && (!data.resumes || Array.isArray(data.resumes))
      && (!data.autoSites || Array.isArray(data.autoSites));
    if (!ok) throw new Error();
    const clean = Object.fromEntries(KEYS.filter(k => k in data).map(k => [k, data[k]]));
    if (clean.resumes) clean.resumes = clean.resumes.filter(r => ['id', 'name', 'note', 'data'].every(k => typeof r?.[k] === 'string'));
    if (clean.profiles) clean.profiles = clean.profiles
      .filter(p => typeof p?.id === 'string' && typeof p.name === 'string' && Array.isArray(p.fields))
      .map(p => ({ ...p, fields: p.fields.filter(f => typeof f?.label === 'string' && typeof f.value === 'string') }));
    if (!clean.profiles?.length) clean.profiles = []; // an older backup: loadProfiles converts its `profile`
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
  if (!current().fields.some(f => f.value)) showTab('info'); // first run: ask for info before anything else
})();
