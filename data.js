// Shared by the popup, background and page script: the standard fields and loading saved profiles.
// `var` and function declarations so the page script can be injected more than once.
var STANDARD = [
  ['firstName', 'First name'], ['lastName', 'Last name'], ['fullName', 'Full name'],
  ['email', 'Email'], ['phone', 'Phone'], ['username', 'Username'],
  ['address', 'Street address'], ['city', 'City'], ['state', 'State / province'], ['zip', 'ZIP / postal code'], ['country', 'Country'],
  ['university', 'University'], ['studentId', 'Student / university ID'],
  ['company', 'Company'], ['jobTitle', 'Job title'], ['linkedin', 'LinkedIn URL'], ['website', 'Website / portfolio'],
];

function newId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

// Returns { profiles, activeProfile }. The first time, converts the single profile saved by v1/v2.
async function loadProfiles() {
  const d = await chrome.storage.local.get(['profiles', 'activeProfile', 'profile']);
  if (d.profiles?.length) {
    const active = d.profiles.some(p => p.id === d.activeProfile) ? d.activeProfile : d.profiles[0].id;
    return { profiles: d.profiles, activeProfile: active };
  }
  const old = d.profile || {};
  const fields = [
    ...STANDARD.map(([key, label]) => ({ key, label, value: old[key] || '' })),
    ...(old.custom || []).map(c => ({ label: c.label, value: c.value })),
  ];
  const profiles = [{ id: newId(), name: 'Personal', fields }];
  await chrome.storage.local.set({ profiles, activeProfile: profiles[0].id });
  return { profiles, activeProfile: profiles[0].id };
}
