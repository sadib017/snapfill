# SnapFill

SnapFill is a browser extension that fills your personal info into forms with one click: job applications, sign-up pages, Google Forms, contact forms and more. It can also attach your CV or other files to upload boxes.

Your data is stored only in your own browser. Nothing is uploaded anywhere.

## Features

- **One-click fill:** click **Fill this page** or press **Alt+Shift+F**, and every box SnapFill recognises is filled.
- **Smart matching:** it reads each box's label, name, placeholder and surrounding question text, so "Email", "E-mail address" and "Your email" all get your email. It works on Google Forms, on modern sites built with React or Vue, and on forms embedded from other sites.
- **Dropdowns:** it picks the matching option, e.g. your country in a Country list.
- **Standard fields:** first name, last name, full name, email, phone, username, address, city, state, ZIP, country, university, student ID, company, job title, LinkedIn and website.
- **Your own fields:** add anything else, e.g. `Department` → `CSE`. It fills any box whose question contains that word. If two of your fields match, the longer, more specific one wins (`University ID` beats `University`).
- **Delete any field:** click **×** next to it. Add a standard field back from **+ Add back a standard field**.
- **Two emails and phone numbers:** keep a second email and phone, and click **Use this** on the one SnapFill should fill.
- **Files (CVs and documents):** save several files, each with a note on what it's for (e.g. "CV for software dev roles", "CV for data analysis roles"). Pick one on the Fill tab and it's attached to the page's upload box.
- **Right-click fill:** right-click any box and pick one saved value from the SnapFill menu. Handy for unusual questions, or to use your second email just once.
- **Auto-fill on chosen sites:** tick **Auto-fill on this site** and that site fills as soon as a page opens. Other sites wait for your click.
- **Backup:** on the **Contact** tab, export everything to a file and import it on another computer.
- **Safe by design:** never fills password boxes, never overwrites something you've already typed, and leaves open questions (like "Why do you want this job?") for you.

## Install

SnapFill isn't on the Chrome Web Store, so you install it from its folder. It works in Chrome, Brave, Edge and other Chromium browsers.

1. **Download it.** On [github.com/sadib017/snapfill](https://github.com/sadib017/snapfill), click **Code → Download ZIP**, then unzip it. Or run `git clone https://github.com/sadib017/snapfill.git`.
2. **Open the extensions page:** `chrome://extensions` in Chrome, `brave://extensions` in Brave, or `edge://extensions` in Edge.
3. **Turn on Developer mode** (switch in the top right).
4. **Click Load unpacked** and select the folder that contains `manifest.json`. After unzipping on Windows this is often the inner `snapfill` folder.
5. **Pin it:** click the puzzle-piece icon in the toolbar and pin **SnapFill**.

Tip: keep the folder somewhere permanent, not in a cloud-only (Dropbox/OneDrive "online only") folder. The browser needs to read the files every time.

**To update:** download the new version over the old folder (or `git pull`), then click **↻ reload** on SnapFill in the extensions page.

## How to use

1. **Add your info.** Click the SnapFill icon. The first time, it opens on **My info**. Fill in what you want, delete fields you don't need with **×**, add your own with **+ Add my own field**, and click **Save**.
2. **Add your files (optional).** Open **Files**, choose a file (up to 5 MB), write a note like "CV for software dev roles", and click **Add file**.
3. **Fill a form.** Open any form and click **Fill this page**, or press **Alt+Shift+F**. The toolbar icon shows how many boxes were filled. Check the answers, then submit as usual.
4. **Pick the right email, phone or file.** In **My info**, click **Use this** next to the email or phone you want. On the **Fill** tab, choose the file under **File to attach**.
5. **One box at a time.** Right-click a box and choose a value from the **SnapFill** menu.
6. **Auto-fill.** On a site you trust, open SnapFill and tick **Auto-fill on this site**.
7. **Back up.** **Contact → Export** saves `snapfill-backup.json`. **Import** loads it back. The file contains your personal info, so keep it private.

To change the keyboard shortcut, go to `chrome://extensions/shortcuts`.

## Limits

- Matching uses English keywords. For questions in other wording, add your own field or use right-click.
- Files attach to normal upload boxes. Some sites use their own upload tools that SnapFill can't reach, including Google Forms (which uses Google Drive's picker). Upload by hand there.
- Browsers block extensions on their own pages (like `chrome://` pages) and on the Web Store.

## Files

```
snapfill/
├── manifest.json   extension settings and permissions
├── popup.html      the popup window (Fill / My info / Files / Contact tabs)
├── popup.js        saves your info and files, backup, runs the fill
├── data.js         the standard fields and loading saved info
├── inject.js       runs fill.js on the page, including embedded forms
├── fill.js         finds matching boxes, fills them, attaches your file
├── background.js   shortcut, right-click menu, auto-fill on chosen sites
└── icons/          toolbar and store icons
```

## Contact

Made by Sadib · [sadib017.github.io](https://sadib017.github.io/) · [sadibhasan3259@gmail.com](mailto:sadibhasan3259@gmail.com)
