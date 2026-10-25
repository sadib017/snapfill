// Injected on demand: fills empty fields that match your saved info, and attaches your saved files.
// Never touches passwords.
(async () => {
  const fields = (await loadFields()).map(f => ({ ...f, value: valueOf(f) })).filter(f => f.value); // data.js, injected first
  const { resumes = [], activeResume } = await chrome.storage.local.get(['resumes', 'activeResume']);
  const p = Object.fromEntries(fields.filter(f => f.key).map(f => [f.key, f.value]));
  p.fullName ||= [p.firstName, p.lastName].filter(Boolean).join(' ');
  // First match wins, so order matters ("email address" before "address", "company name" before "name").
  const rules = [
    ['email', /e-?mail|\bg?mail\b/],
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
  const custom = fields.filter(f => !f.key && f.label.trim()).sort((a, b) => b.label.length - a.label.length);
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
      && node.parentElement.querySelectorAll('input:not([type=hidden]), textarea, select').length === 1) node = node.parentElement;
    return (node.innerText || '').slice(0, 500).toLowerCase();
  };
  // Questions about someone else ("Father's name", "Emergency contact phone") never get the user's built-in info.
  const OTHER = /father|mother|guardian|parent|spouse|husband|wife|middle.?name|nominee|referee|reference|emergency|next.of.kin|recommender/;
  // Custom fields are the user's own wording, so they win over the built-in guesses (even for the cases above).
  const customFor = text => custom.find(c => text.includes(c.label.toLowerCase()))?.value;
  const builtin = text => {
    if (OTHER.test(text)) return;
    const key = rules.find(([, re]) => re.test(text))?.[0];
    return key && p[key];
  };
  const valueFor = el => {
    const text = describe(el);
    const own = customFor(text);
    if (own || OTHER.test(text)) return own;
    if (el.type === 'email') return p.email;
    if (el.type === 'tel') return p.phone;
    const around = context(el);
    return builtin(text) || customFor(around) || builtin(around);
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
    t.startsWith('.') ? r.name.toLowerCase().endsWith(t) : t.endsWith('/*') ? (r.type || '').startsWith(t.slice(0, -1)) : t === r.type);
  let filled = 0;
  for (const el of document.querySelectorAll('input, textarea, select')) {
    if (el.disabled || el.readOnly || skip.test(el.type)) continue;
    if (el.type === 'file') continue; // handled below
    if (el.checkVisibility && !el.checkVisibility()) continue; // hidden boxes are often anti-spam traps
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

  // Upload boxes. A CV/resume box gets the file picked on the Fill tab. Any other box gets the saved file whose
  // note names it (note "Transcript" -> "Upload your transcript"). Then the picked file, if still unused, goes
  // into the first remaining box that isn't for a cover letter or photo. Each file is used once.
  const STOP = new Set(['for', 'the', 'and', 'with', 'my', 'of', 'to', 'in', 'on', 'role', 'roles', 'job', 'jobs', 'file', 'copy', 'new', 'old', 'final', 'version', 'pdf', 'doc', 'docx']);
  const isCv = text => /resume|\bcv\b|curriculum/.test(text);
  const words = note => note.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(w => w.length > 1 && !STOP.has(w));
  const escape = w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // Whole-word match that also works for non-English letters (\b only knows a-z).
  const named = (r, text) => words(r.note).some(w => new RegExp(`(?<![\\p{L}\\p{N}])${escape(w)}(?![\\p{L}\\p{N}])`, 'u').test(text));
  const used = new Set();
  const boxes = [...document.querySelectorAll('input[type=file]')]
    .filter(el => !el.disabled && !el.files.length)
    .map(el => ({ el, text: describe(el) + ' ' + context(el) }));
  const put = (box, r) => {
    attach(box.el, r);
    used.add(r.id);
    box.done = true;
    filled++;
  };
  for (const box of boxes) {
    if (isCv(box.text)) {
      if (resume && !used.has(resume.id) && accepts(box.el, resume)) put(box, resume);
      continue;
    }
    const r = resumes.find(r => !used.has(r.id) && !isCv(r.note.toLowerCase()) && named(r, box.text) && accepts(box.el, r));
    if (r) put(box, r);
  }
  const free = boxes.find(b => !b.done && !isCv(b.text) && !/cover|photo|picture|image|avatar|signature|logo/.test(b.text));
  if (resume && !used.has(resume.id) && free && accepts(free.el, resume)) put(free, resume);
  return filled;
})();
