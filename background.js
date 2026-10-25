importScripts('data.js', 'inject.js');

// Right-click menu: "Fill this page" plus every saved value (both emails and phones), rebuilt whenever they change.
async function rebuildMenus() {
  const items = (await loadFields()).flatMap(f => [f.value, f.value2].filter(Boolean).map(v => [f.label, v]));
  await chrome.contextMenus.removeAll();
  chrome.contextMenus.create({ id: 'page', title: 'SnapFill: fill this page', contexts: ['page', 'editable'] });
  items.forEach(([label, value], i) => {
    const short = value.length > 30 ? value.slice(0, 29) + '…' : value;
    chrome.contextMenus.create({ id: 'v' + i, title: `${label}: ${short}`, contexts: ['editable'] });
  });
  menuValues = items.map(([, v]) => v);
}
let menuValues = [];
// Runs one rebuild at a time; overlapping ones would create duplicate menu ids.
let menuQueue = Promise.resolve();
function buildMenus() {
  return (menuQueue = menuQueue.then(rebuildMenus, rebuildMenus));
}

// Puts one value into the box the user right-clicked (the focused element in that frame).
function insertValue(v) {
  const el = document.activeElement;
  if (!el || el.type === 'password') return;
  if (!el.isContentEditable && !('value' in el)) return; // nothing editable is focused
  if (el.isContentEditable) return document.execCommand('insertText', false, v);
  Object.getOwnPropertyDescriptor(Object.getPrototypeOf(el), 'value').set.call(el, v);
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
}

async function onMenuClick(info, tab) {
  if (info.menuItemId === 'page') return fillTab(tab.id).catch(() => {});
  if (!menuValues.length) await buildMenus(); // service worker may have restarted
  const v = menuValues[Number(info.menuItemId.slice(1))];
  if (v) await chrome.scripting.executeScript({ target: { tabId: tab.id, frameIds: [info.frameId] }, func: insertValue, args: [v] }).catch(() => {});
}

// Auto-fill on sites the user marked as trusted.
async function onTabUpdated(tabId, change, tab) {
  if (change.status !== 'complete' || !/^https?:/.test(tab.url || '')) return;
  const { autoSites = [] } = await chrome.storage.local.get('autoSites');
  if (!autoSites.includes(new URL(tab.url).hostname)) return;
  fillTab(tabId).catch(() => {});
  // Second pass for pages that draw their form after loading; already-filled boxes are skipped.
  setTimeout(() => fillTab(tabId).catch(() => {}), 2000);
}

chrome.runtime.onInstalled.addListener(buildMenus);
chrome.storage.onChanged.addListener(c => { if (c.fields) buildMenus(); });
chrome.contextMenus.onClicked.addListener(onMenuClick);
chrome.tabs.onUpdated.addListener(onTabUpdated);
chrome.commands.onCommand.addListener((cmd, tab) => { if (cmd === 'fill-form') fillTab(tab.id).catch(() => {}); }); // fails quietly on browser pages
