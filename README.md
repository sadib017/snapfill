<p align="center">
  <img src="icons/icon128.png" width="96" alt="SnapFill logo">
</p>

<h1 align="center">SnapFill</h1>

<p align="center">
  Fill forms in one click. Your info, your files, your browser.
</p>

---

## Contents

- [What it does](#what-it-does)
- [Features](#features)
- [Install](#install)
- [How to use](#how-to-use)
- [Good to know](#good-to-know)
- [Project files](#project-files)
- [Contact](#contact)

---

## What it does

Typing the same name, email and phone number into every job application, sign-up page and Google Form gets old fast. SnapFill saves your info once and fills it in for you.

- Works on job portals, Google Forms, sign-up pages and contact forms
- Attaches your CV or other files to upload boxes
- Keeps everything **only in your browser**, nothing is uploaded

---

## Features

### Filling

| Feature | What it does |
| --- | --- |
| **One-click fill** | Click **Fill this page** or press **Alt + Shift + F** |
| **Smart matching** | Reads labels and question text, so "Email", "Gmail" and "Your e-mail" all work. Capitals don't matter |
| **Knows it's not you** | Skips questions about other people, like "Father's name" or "Emergency contact phone" |
| **Works everywhere** | Google Forms, React/Vue sites, and forms embedded from other sites |
| **Dropdowns** | Picks the matching option, e.g. your country |
| **Right-click fill** | Right-click any box and choose one saved value |
| **Auto-fill** | Fills on its own on sites you choose |

### Your info

| Feature | What it does |
| --- | --- |
| **Standard fields** | Name, full name, email, phone, username, address, city, state, ZIP, country, university, student ID, company, job title, LinkedIn, website |
| **Two emails and phones** | Save a second one and click **Use this** on the one to fill |
| **Your own fields** | Add anything, e.g. `Department` → `CSE` |
| **Delete any field** | Click **×**, and add it back any time |

### Files

| Feature | What it does |
| --- | --- |
| **Several files** | Save CVs and documents, each with a note like "CV for data analysis roles" |
| **Pick per form** | Choose which file to attach before you fill |

### Safety and backup

| Feature | What it does |
| --- | --- |
| **No passwords** | Password boxes are never filled |
| **No overwriting** | Boxes you already typed in are left alone |
| **Backup** | Export everything to a file, import it on another computer |

---

## Install

Works in **Chrome**, **Brave**, **Edge** and other Chromium browsers.

**1. Download**

On [github.com/sadib017/snapfill](https://github.com/sadib017/snapfill), click **Code → Download ZIP** and unzip it.
Or with git:

```bash
git clone https://github.com/sadib017/snapfill.git
```

**2. Open the extensions page**

| Browser | Address |
| --- | --- |
| Chrome | `chrome://extensions` |
| Brave | `brave://extensions` |
| Edge | `edge://extensions` |

**3. Turn on Developer mode** (switch in the top right corner)

**4. Click Load unpacked** and select the folder that contains `manifest.json`

**5. Pin it:** click the 🧩 puzzle icon in the toolbar and pin **SnapFill**

> **Tip:** On Windows, unzipping often creates a folder inside a folder. Pick the inner one, where you can see `manifest.json`. Keep it out of "online-only" Dropbox or OneDrive folders.

**Updating:** download the new version over the old folder (or run `git pull`), then click **↻ reload** on SnapFill in the extensions page.

---

## How to use

The popup has four tabs.

### 📝 My info: save your details

1. Click the SnapFill icon. It opens here the first time.
2. Fill in your details and click **Save**.
3. Got two emails or phones? Fill in both and click **Use this** on the one to fill.
4. Don't need a field? Click **×**.
5. Need something extra? Click **+ Add my own field**, e.g. `University ID` → `221-15-1234`.

### 📎 Files: save your CVs

1. Choose a file (PDF, Word or image, max 5 MB).
2. Add a note, e.g. *CV for software dev roles*.
3. Click **Add file**.

### ⚡ Fill: fill a form

1. Open any form.
2. Pick a file under **File to attach** (optional).
3. Click **Fill this page**, or press **Alt + Shift + F**.
4. Check the answers and submit as usual.

Extras:

- **One box only:** right-click it and pick a value from the **SnapFill** menu.
- **Auto-fill:** tick **Auto-fill on this site**.
- **Change the shortcut:** go to `chrome://extensions/shortcuts`.

### 💬 Contact: backup and support

- **Export** saves `snapfill-backup.json`. **Import** loads it back.
- The backup holds your personal info, so keep it private.

---

## Good to know

| Situation | What happens |
| --- | --- |
| A question uses unusual wording | Add your own field with that word, or right-click the box |
| You want "Father's name" filled too | Add your own field `Father's name` with the answer, and it will be |
| Google Forms file upload | It uses Google Drive's picker, so upload by hand there |
| A site with its own custom upload tool | SnapFill may not reach it, so upload by hand |
| Browser pages (`chrome://…`) and the Web Store | Browsers block all extensions there |

---

## Project files

| File | Purpose |
| --- | --- |
| `manifest.json` | Extension settings and permissions |
| `popup.html` | The popup window and its four tabs |
| `popup.js` | Saving info and files, backup, the Fill button |
| `data.js` | The standard fields and loading saved info |
| `fill.js` | Finds matching boxes, fills them, attaches files |
| `inject.js` | Runs the filler on the page, including embedded forms |
| `background.js` | Shortcut, right-click menu, auto-fill |
| `icons/` | Toolbar and store icons |

---

## Contact

Made with ❤️ by **Sadib**

- 🌐 Website: [sadib017.github.io](https://sadib017.github.io/)
- ✉️ Email: [sadibhasan3259@gmail.com](mailto:sadibhasan3259@gmail.com)
