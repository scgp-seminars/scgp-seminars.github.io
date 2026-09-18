# SCGP Seminars

Public seminar schedule at https://scgp-seminars.github.io/.

This repository contains only the static website and the public event snapshot in `data/events.json`. The SCGP Telegram bot runs on a separate server and publishes a new snapshot after schedule refreshes, additions, and deletions. Do not add bot code, passwords, subscriber lists, `.env`, or Google credentials here.

Enable GitHub Pages in **Settings → Pages → Deploy from a branch → main → / (root)**. Every update to `main` then deploys automatically. No build step or API key is required for visitors.

The page uses New York time, supports this week / next week / upcoming dates / previous events, and displays when the bot last synchronized. Previous events includes dates before today in New York, with the most recent day first and talks within each day ordered by time. Today's talks remain in the current/upcoming views. This view uses past records in the latest bot snapshot; it is not a separate permanent archive of removed events. After the bot creates its public calendar, the **SCGP Google Calendar** button links to that calendar. Times and abstracts are presented as provided by the bot. Empty titles and abstracts stay blank.

Run the date-filtering regression tests with `node --test test_schedule.cjs`.

To preview, run `python3 -m http.server 8080 --bind 127.0.0.1` in this directory and open http://127.0.0.1:8080. Serve over HTTP so the browser can fetch the JSON file.
