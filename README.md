# SnapFill

A Chrome extension that fills your saved personal info (name, email, phone, address, and your own custom fields) into forms with one click. Your data is stored only in your browser (`chrome.storage.local`). Password fields are never filled, and boxes you've already typed in are left alone.

## Install (Chrome, Edge, Brave)

1. Open `chrome://extensions` (Edge: `edge://extensions`).
2. Turn on **Developer mode** (top right).
3. Click **Load unpacked** and select this `snapfill` folder.
4. Pin SnapFill from the puzzle-piece menu, click it, and fill in **My info**, then **Save**.

## Use

Open a form and click **Fill this page**, or press **Alt+Shift+F**. To change the shortcut, go to `chrome://extensions/shortcuts`.

**My info** has the common fields (name, full name, email, phone, address, university, student ID, company, LinkedIn…). Click **×** next to any field you don't need; add it back from **+ Add back a standard field**. Click **+ Add my own field** for anything else, e.g. `Department` → `CSE`: SnapFill fills it into any box whose question contains "Department". If two of your own fields match (e.g. `University` and `University ID`), the longer, more specific one wins.

**Profiles:** keep different versions of your info, e.g. **Personal** and **Work** with different emails and phone numbers. In **My info**, click **+ New** to copy the current profile, rename it and change what differs. On the **Fill** tab, pick which profile to use. The right-click menu shows values from every profile, so you can drop in the other email on a single box.

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
├── data.js         the standard fields and loading saved profiles
├── inject.js       runs fill.js on the page, including embedded forms
├── fill.js         finds matching boxes, fills them, attaches your resume
├── background.js   shortcut, right-click menu, auto-fill on chosen sites
└── icons/          toolbar and store icons
```
