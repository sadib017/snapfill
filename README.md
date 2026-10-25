# SnapFill

A Chrome extension that fills your saved personal info (name, email, phone, address, and your own custom fields) into forms with one click. Your data is stored only in your browser (`chrome.storage.local`). Password fields are never filled, and boxes you've already typed in are left alone.

## Install (Chrome, Edge, Brave)

1. Open `chrome://extensions` (Edge: `edge://extensions`).
2. Turn on **Developer mode** (top right).
3. Click **Load unpacked** and select this `snapfill` folder.
4. Pin SnapFill from the puzzle-piece menu, click it, and fill in **My info**, then **Save**.

## Use

Open a form and click **Fill this page**, or press **Alt+Shift+F**. To change the shortcut, go to `chrome://extensions/shortcuts`.

Under **My info → My own fields**, add a field like `GitHub` → `github.com/you`. SnapFill fills it into any box whose label contains "GitHub".

## Files

```
snapfill/
├── manifest.json   extension settings and permissions
├── popup.html      the popup window (Fill / My info tabs)
├── popup.js        saves your info, runs the fill
├── inject.js       runs fill.js on the page, including embedded forms
├── fill.js         finds matching boxes and fills them
├── background.js   handles the Alt+Shift+F shortcut
└── icons/          toolbar and store icons
```
