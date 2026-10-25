// Injected on demand: fills empty fields that match the saved profile. Never touches passwords.
(async () => {
  const { profile = {} } = await chrome.storage.local.get('profile');
  const p = { ...profile, fullName: [profile.firstName, profile.lastName].filter(Boolean).join(' ') };
  // First match wins, so order matters ("email address" before "address", "company name" before "name").
  const rules = [
    ['email', /e-?mail/],
    ['firstName', /first.?name|given.?name|fname|forename/],
    ['lastName', /last.?name|family.?name|surname|lname/],
    ['username', /user.?name|login.?id|nickname/],
    ['linkedin', /linkedin/],
    ['website', /website|portfolio|homepage|url/],
    ['jobTitle', /job.?title|position|designation|organization-title/],
    ['company', /company|employer|organi[sz]ation/],
    ['phone', /phone|mobile|\btel\b|cell/],
    ['zip', /zip|postal|post.?code/],
    ['city', /city|town|address-level2/],
    ['state', /state|province|region|address-level1/],
    ['country', /country/],
    ['address', /address|street|addr/],
    ['fullName', /name/],
  ];
  const custom = (profile.custom || []).filter(c => c.label && c.value);
  const skip = /^(password|hidden|submit|button|checkbox|radio|file|image|reset|range|color)$/;
  const describe = el => [
    el.autocomplete, el.name, el.id, el.placeholder, el.getAttribute('aria-label'),
    ...[...(el.labels || [])].map(l => l.textContent),
  ].join(' ').toLowerCase();
  const valueFor = el => {
    const text = describe(el);
    // Custom fields are the user's own wording, so they win over the built-in guesses.
    const c = custom.find(c => text.includes(c.label.toLowerCase()));
    if (c) return c.value;
    if (el.type === 'email') return p.email;
    if (el.type === 'tel') return p.phone;
    const key = rules.find(([, re]) => re.test(text))?.[0];
    return key && p[key];
  };
  const setValue = (el, v) => {
    // Native setter so React/Vue forms notice the change.
    Object.getOwnPropertyDescriptor(Object.getPrototypeOf(el), 'value').set.call(el, v);
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  };
  let filled = 0;
  for (const el of document.querySelectorAll('input, textarea, select')) {
    if (el.disabled || el.readOnly || skip.test(el.type)) continue;
    const v = valueFor(el);
    if (!v) continue;
    if (el.tagName === 'SELECT') {
      if (el.selectedIndex > 0) continue;
      const want = v.toLowerCase();
      const opt = [...el.options].find(o => o.text.trim().toLowerCase() === want || o.value.toLowerCase() === want);
      if (!opt) continue;
      setValue(el, opt.value);
    } else {
      if (el.value) continue;
      setValue(el, v);
    }
    filled++;
  }
  return filled;
})();
