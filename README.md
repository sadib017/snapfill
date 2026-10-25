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

**Right-click fill:** right-click any box and pick a saved value from the SnapFill menu. Handy for odd labels like "How can we reach you?".

**Resumes:** in the **Resumes** tab, add each CV with a note on what it's for (e.g. "Software dev roles", "Data analysis roles"). On the **Fill** tab, pick which one to attach. SnapFill puts it into upload boxes labelled Resume or CV, never into Cover letter boxes. Max 5 MB per file. Some sites use custom upload widgets it can't reach; upload by hand there.

**Auto-fill on chosen sites:** on the **Fill** tab, tick "Auto-fill on <site>". That site's forms then fill as soon as the page opens. Other sites still wait for your click.

**Backup:** **My info → Export** saves your info, resumes and auto-fill sites to `snapfill-backup.json`. **Import** loads it back, on this or another computer. The file contains your personal info, so keep it private.

## Files

```
snapfill/
├── manifest.json   extension settings and permissions
├── popup.html      the popup window (Fill / My info / Resumes tabs)
├── popup.js        saves your info and resumes, backup, runs the fill
├── inject.js       runs fill.js on the page, including embedded forms
├── fill.js         finds matching boxes, fills them, attaches your resume
├── background.js   shortcut, right-click menu, auto-fill on chosen sites
└── icons/          toolbar and store icons
```
