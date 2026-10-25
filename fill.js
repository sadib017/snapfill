// Injected on demand: fills empty fields that match your saved info, and attaches the chosen resume.
// Never touches passwords.
(async () => {
  const fields = (await loadFields()).map(f => ({ ...f, value: valueOf(f) })).filter(f => f.value); // data.js, injected first
  const { resumes = [], activeResume } = await chrome.storage.local.get(['resumes', 'activeResume']);
  const p = Object.fromEntries(fields.filter(f => f.key).map(f => [f.key, f.value]));
  p.fullName ||= [p.firstName, p.lastName].filter(Boolean).join(' ');
  // First match wins, so order matters ("email address" before "address", "company name" before "name").
  const rules = [
    ['email', /e-?mail/],
    ['firstName', /first.?name|given.?name|fname|forename/],
    ['lastName', /last.?name|family.?name|surname|lname/],
    ['studentId', /student.?id|universit\w*.?id|varsity.?id|\broll\b|registration.?(no|num)|matric/],
    ['university', /universit|varsity|college|institut|school/],
    ['username', /user.?name|login.?id|nickname/],
    ['linkedin', /linkedin/],
    ['website', /website|portfolio|homepage|url/],
    ['jobTitle', /job.?title|position|designation|organization-title/],
    ['company', /company|employer|organi[sz]ation/],
    ['phone', /phone|mobile|\btel\b|cell|whatsapp|contact.?(no|num)/],
    ['zip', /zip|postal|post.?code/],
    ['city', /city|town|address-level2/],
    ['state', /state|province|region|address-level1/],
    ['country', /country/],
    ['address', /address|street|addr/],
    ['fullName', /name/],
  ];
  // Longest label first, so "University ID" beats "University" on a question that contains both.
  const custom = fields.filter(f => !f.key).sort((a, b) => b.label.length - a.label.length);
  const resume = resumes.find(r => r.id === activeResume);
  const skip = /^(password|hidden|submit|button|checkbox|radio|image|reset|range|color)$/;
  const describe = el => [
    el.autocomplete, el.name, el.id, el.placeholder, el.getAttribute('aria-label'),
    ...[...(el.labels || [])].map(l => l.textContent),
    ...(el.getAttribute('aria-labelledby') || '').split(/\s+/).map(id => id && document.getElementById(id)?.textContent),
  ].join(' ').toLowerCase();
  // Fallback for forms that show the question as plain text (no <label>): the text of the
  // largest block around this box that holds no other box.
  const context = el => {
    let node = el;
    while (node.parentElement && node.parentElement !== document.body
      && node.parentElement.querySelectorAll('input, textarea, select').length === 1) node = node.parentElement;
    return (node.innerText || '').slice(0, 500).toLowerCase();
  };
  const match = text => {
    // Custom fields are the user's own wording, so they win over the built-in guesses.
    const c = custom.find(c => text.includes(c.label.toLowerCase()));
    if (c) return c.value;
    const key = rules.find(([, re]) => re.test(text))?.[0];
    return key && p[key];
  };
  const valueFor = el => {
    if (el.type === 'email') return p.email;
    if (el.type === 'tel') return p.phone;
    return match(describe(el)) || match(context(el));
  };
  const setValue = (el, v) => {
    // Native setter so React/Vue forms notice the change.
    Object.getOwnPropertyDescriptor(Object.getPrototypeOf(el), 'value').set.call(el, v);
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  };
  const attach = (el, r) => {
    const bytes = Uint8Array.from(atob(r.data), c => c.charCodeAt(0));
    const dt = new DataTransfer();
    dt.items.add(new File([bytes], r.name, { type: r.type }));
    el.files = dt.files;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  };
  const accepts = (el, r) => !el.accept || el.accept.split(',').map(t => t.trim().toLowerCase()).some(t =>
    t.startsWith('.') ? r.name.toLowerCase().endsWith(t) : t.endsWith('/*') ? r.type.startsWith(t.slice(0, -1)) : t === r.type);
  let filled = 0;
  for (const el of document.querySelectorAll('input, textarea, select')) {
    if (el.disabled || el.readOnly || skip.test(el.type)) continue;
    if (el.type === 'file') {
      // Any empty upload box takes the chosen file, unless it asks for something else (a cover letter or a photo)
      // or only accepts other file types.
      // ponytail: custom uploaders without a real <input type=file> (e.g. Google Forms' Drive picker) are not reached.
      const text = describe(el) + ' ' + context(el);
      if (resume && !el.files.length && !/cover|photo|picture|image|avatar|signature|logo/.test(text) && accepts(el, resume)) {
        attach(el, resume);
        filled++;
      }
      continue;
    }
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
