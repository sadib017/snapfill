const $ = id => document.getElementById(id);
const form = $('form');

const showTab = info => {
  $('fill-view').hidden = info;
  $('info-view').hidden = !info;
  $('tab-fill').classList.toggle('on', !info);
  $('tab-info').classList.toggle('on', info);
};
$('tab-fill').onclick = () => showTab(false);
$('tab-info').onclick = () => showTab(true);

const addRow = (label = '', value = '') => {
  const row = document.createElement('div');
  row.className = 'row';
  row.innerHTML = '<input placeholder="Field name, e.g. GitHub" aria-label="Field name"><input placeholder="Your answer" aria-label="Your answer"><button type="button" aria-label="Remove field">×</button>';
  const [l, v] = row.querySelectorAll('input');
  l.value = label;
  v.value = value;
  row.querySelector('button').onclick = () => row.remove();
  $('custom').append(row);
};
$('add').onclick = () => addRow();

chrome.storage.local.get('profile').then(({ profile = {} }) => {
  for (const el of form.elements) if (el.name) el.value = profile[el.name] || '';
  (profile.custom || []).forEach(c => addRow(c.label, c.value));
  if (!profile.email) showTab(true); // first run: ask for info before anything else
});

form.onsubmit = async e => {
  e.preventDefault();
  const profile = {};
  for (const el of form.elements) if (el.name) profile[el.name] = el.value.trim();
  profile.custom = [...$('custom').children]
    .map(row => { const [l, v] = row.querySelectorAll('input'); return { label: l.value.trim(), value: v.value.trim() }; })
    .filter(c => c.label && c.value);
  await chrome.storage.local.set({ profile });
  showTab(false);
  $('status').textContent = 'Saved.';
};

$('fill').onclick = async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  try {
    const n = await fillTab(tab.id);
    $('status').textContent = n ? `Filled ${n} field${n > 1 ? 's' : ''}.` : 'No matching empty fields found.';
  } catch {
    $('status').textContent = "Can't fill this page (Chrome blocks its own pages and the Web Store).";
  }
};
