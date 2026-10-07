# Portfolio Tracker

A Chrome new-tab extension that turns your coding progress into heatmaps. Paste a profile link, and your GitHub, LeetCode and other activity shows up in a glass panel on every new tab.

Includes **Daily Planner**, a small companion extension whose completed days appear in the tracker as another heatmap.

![Portfolio Tracker screenshot](screenshots/newtab.png)

## Features

- **Heatmaps per platform**, each with a 🔥 current-streak counter. Scroll the panel to add as many platforms as you like.
- **Paste a profile link.** The platform and username are detected automatically.
- **Manual trackers** for any site that can't be synced. Click a square to log +1 for that day, shift-click to remove one.
- **Customisable look:** light, dark or match-your-wallpaper theme, panel opacity and blur, font, heatmap range (3, 6 or 12 months) and your own wallpaper.
- **Toolbar switch** to show or hide the panel without disabling the extension.
- **Editable shortcuts** under the search bar (right-click one to remove it).
- **Cached data**, refreshed every 30 minutes or with the ↻ button, so the page opens instantly.

## Supported sites

| Site | What is counted | Source |
| --- | --- | --- |
| GitHub | Public contributions (private ones only if you enable them in your GitHub profile settings) | Profile contribution graph, with a public API as fallback |
| LeetCode | Submissions per day, plus total solved | LeetCode GraphQL |
| Codeforces | Accepted submissions | Official API |
| HackerRank | Submissions | Public profile endpoint |
| CodeChef | Submissions | Public profile page |
| AtCoder | Accepted submissions | Community API (kenkoooo) |
| Anything else | Whatever you log by hand | Manual tracker |

> HackerRank, CodeChef and AtCoder rely on unofficial endpoints and may stop working if those sites change. A ⚠ on a card means the last sync failed; hover it to read the error.

## Install

1. Download or clone this repository.
2. Open `chrome://extensions` and turn on **Developer mode**.
3. Click **Load unpacked** and select the `portfolio-tracker` folder.
4. Open a new tab, then click ⚙ and paste a profile link (for example `github.com/your-username`).
5. Optional: upload your wallpaper under ⚙ → Wallpaper. Extensions can't read Chrome's theme image, so it needs uploading once.

Chrome shows the extension's name in a footer bar on the new tab page. To hide it, right-click the bar and choose **Hide footer on New Tab page**.

## Daily Planner (optional)

A simple daily checklist in a toolbar popup. A day counts as complete only when every task is ticked, and completed days show up in Portfolio Tracker as a "Daily Planner" heatmap.

1. Load the `daily-planner` folder the same way as above.
2. Copy the Portfolio Tracker's extension ID from its card on `chrome://extensions`.
3. Paste it into the planner's **Tracker connection** box.
4. Tick tasks. The heatmap updates in the tracker.

## Privacy

There is no account, server or analytics. Your trackers, settings, tasks and wallpaper are stored in `chrome.storage.local` on your own machine. The only network requests go to the sites you track, listed under `host_permissions` in the manifest.

## Permissions

| Permission | Why |
| --- | --- |
| `storage`, `unlimitedStorage` | Save settings, trackers and the wallpaper |
| `topSites`, `favicon` | Seed and display the shortcut tiles |
| Host access to GitHub, LeetCode, Codeforces, HackerRank, CodeChef, kenkoooo.com and a GitHub contributions API | Fetch your public activity |

## Project structure

```
portfolio-tracker/   new-tab page, popup, background worker, icons
daily-planner/       companion planner extension
screenshots/         images used in this README
```

Plain HTML, CSS and JavaScript (Manifest V3). No build step, no dependencies.

## Disclaimer

Not affiliated with Google or any of the listed platforms. The new tab page imitates the look of Chrome's default page for personal use, and the "Google" logo is plain text.

## License

MIT
