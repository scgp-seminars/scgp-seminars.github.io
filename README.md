# SCGP Seminars

Public seminar schedule at https://scgp-seminars.github.io/.

This repository contains only the static website and the public event snapshot in `data/events.json`. The SCGP Telegram bot runs on a separate server and publishes a new snapshot after schedule refreshes, additions, and deletions. Do not add bot code, passwords, subscriber lists, `.env`, or Google credentials here.

Enable GitHub Pages in **Settings → Pages → Deploy from a branch → main → / (root)**. Every update to `main` then deploys automatically. No build step or API key is required for visitors.

The page uses New York time, supports this week / next week / upcoming dates, and displays when the bot last synchronized. Times and abstracts are presented as provided by the bot. Empty titles and abstracts stay blank.

To preview, run `python3 -m http.server 8080 --bind 127.0.0.1` in this directory and open http://127.0.0.1:8080. Serve over HTTP so the browser can fetch the JSON file.
