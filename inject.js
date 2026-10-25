// Runs fill.js in every frame (job forms are often embedded iframes); returns how many fields were filled.
async function fillTab(tabId) {
  const results = await chrome.scripting.executeScript({ target: { tabId, allFrames: true }, files: ['fill.js'] });
  return results.reduce((n, r) => n + (r.result || 0), 0);
}
