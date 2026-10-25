// Runs fill.js in every frame (job forms are often embedded iframes); returns how many fields were filled
// and shows the count on the toolbar icon.
async function fillTab(tabId) {
  const results = await chrome.scripting.executeScript({ target: { tabId, allFrames: true }, files: ['fill.js'] });
  const n = results.reduce((n, r) => n + (r.result || 0), 0);
  chrome.action.setBadgeBackgroundColor({ tabId, color: '#2563eb' });
  chrome.action.setBadgeText({ tabId, text: n ? String(n) : '' });
  return n;
}
