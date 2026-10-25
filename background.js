importScripts('inject.js');

const LABELS = {
  firstName: 'First name', lastName: 'Last name', email: 'Email', phone: 'Phone', username: 'Username',
  address: 'Street address', city: 'City', state: 'State', zip: 'ZIP', country: 'Country',
  company: 'Company', jobTitle: 'Job title', linkedin: 'LinkedIn', website: 'Website',
};

// Right-click menu: "Fill this page" plus one entry per saved value, rebuilt whenever the info changes.
async function buildMenus() {
  const { profile = {} } = await chrome.storage.local.get('profile');
  const items = [
    ...Object.entries(LABELS).filter(([k]) => profile[k]).map(([k, label]) => [label, profile[k]]),
    ...(profile.custom || []).map(c => [c.label, c.value]),
  ];
  await chrome.contextMenus.removeAll();
  chrome.contextMenus.create({ id: 'page', title: 'SnapFill: fill this page', contexts: ['page', 'editable'] });
  items.forEach(([label, value], i) => {
    const short = value.length > 30 ? value.slice(0, 29) + '…' : value;
    chrome.contextMenus.create({ id: 'v' + i, title: `${label}: ${short}`, contexts: ['editable'] });
  });
  menuValues = items.map(([, v]) => v);
}
let menuValues = [];

// Puts one value into the box the user right-clicked (the focused element in that frame).
function insertValue(v) {
  const el = document.activeElement;
  if (!el || el.type === 'password') return;
  if (el.isContentEditable) return document.execCommand('insertText', false, v);
  Object.getOwnPropertyDescriptor(Object.getPrototypeOf(el), 'value').set.call(el, v);
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
}

async function onMenuClick(info, tab) {
  if (info.menuItemId === 'page') return fillTab(tab.id);
  if (!menuValues.length) await buildMenus(); // service worker may have restarted
  const v = menuValues[Number(info.menuItemId.slice(1))];
  if (v) await chrome.scripting.executeScript({ target: { tabId: tab.id, frameIds: [info.frameId] }, func: insertValue, args: [v] });
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
chrome.storage.onChanged.addListener(c => { if (c.profile) buildMenus(); });
chrome.contextMenus.onClicked.addListener(onMenuClick);
chrome.tabs.onUpdated.addListener(onTabUpdated);
chrome.commands.onCommand.addListener((cmd, tab) => { if (cmd === 'fill-form') fillTab(tab.id); });
