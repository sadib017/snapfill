// Shared by the popup, background and page script: the standard fields and loading saved info.
// `var` and function declarations so the page script can be injected more than once.
var STANDARD = [
  ['firstName', 'First name'], ['lastName', 'Last name'], ['fullName', 'Full name'],
  ['email', 'Email'], ['phone', 'Phone'], ['username', 'Username'],
  ['address', 'Street address'], ['city', 'City'], ['state', 'State / province'], ['zip', 'ZIP / postal code'], ['country', 'Country'],
  ['university', 'University'], ['studentId', 'Student / university ID'],
  ['company', 'Company'], ['jobTitle', 'Job title'], ['linkedin', 'LinkedIn URL'], ['website', 'Website / portfolio'],
];
// Fields that keep two values; `use` (0 or 1) says which one gets filled.
var TWO = ['email', 'phone'];

function valueOf(f) {
  return (f.use ? f.value2 : f.value) || f.value || f.value2 || '';
}

// Returns the saved fields. The first time, converts what older versions saved:
// one `profile` (v1/v2) or several `profiles` (v2.1, whose other emails/phones become the second line).
async function loadFields() {
  const d = await chrome.storage.local.get(['fields', 'profiles', 'activeProfile', 'profile']);
  if (Array.isArray(d.fields)) return d.fields;
  let fields;
  if (d.profiles?.length) {
    const main = d.profiles.find(p => p.id === d.activeProfile) || d.profiles[0];
    const others = d.profiles.filter(p => p !== main);
    fields = main.fields.map(f => !TWO.includes(f.key) ? f : {
      ...f, use: 0,
      value2: others.map(p => p.fields.find(x => x.key === f.key)?.value).find(v => v && v !== f.value) || '',
    });
  } else {
    if (!d.profile) return STANDARD.map(([key, label]) => ({ key, label, value: '' })); // nothing saved yet
    const old = d.profile;
    fields = [
      ...STANDARD.map(([key, label]) => ({ key, label, value: old[key] || '' })),
      ...(old.custom || []).map(c => ({ label: c.label, value: c.value })),
    ];
  }
  await chrome.storage.local.set({ fields });
  return fields;
}
