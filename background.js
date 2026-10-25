importScripts('inject.js');
chrome.commands.onCommand.addListener((cmd, tab) => { if (cmd === 'fill-form') fillTab(tab.id); });
