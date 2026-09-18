"use strict";
const zone = "America/New_York";
let events = [];
let period = "week";
let loaded = false;
let hasSnapshot = false;
const schedule = document.getElementById("schedule");

function localDate(now = new Date()) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-US", { timeZone: zone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now).map(p => [p.type, p.value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}
function dateValue(iso) { return new Date(`${iso}T12:00:00Z`); }
function shift(iso, days) { const d = dateValue(iso); d.setUTCDate(d.getUTCDate() + days); return d.toISOString().slice(0, 10); }
function monday(iso) { return shift(iso, -((dateValue(iso).getUTCDay() + 6) % 7)); }
function pretty(iso, options) { return new Intl.DateTimeFormat("en-US", { timeZone: "UTC", ...options }).format(dateValue(iso)); }
function element(tag, text, className) { const node = document.createElement(tag); if (text) node.textContent = text; if (className) node.className = className; return node; }
function webLink(value) { try { const url = new URL(value); return ["https:", "http:"].includes(url.protocol) ? url.href : null; } catch { return null; } }
function timeNumber(value) {
  const m = /^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?$/i.exec((value || "").trim());
  if (!m) return 1440;
  let hour = Number(m[1]); if (m[3]) hour = hour % 12 + (m[3].toUpperCase() === "PM" ? 12 : 0);
  return hour * 60 + Number(m[2] || 0);
}
function periodBounds(view, today) {
  if (view === "previous") return ["0001-01-01", today];
  if (view === "upcoming") return [today, "9999-12-31"];
  const start = shift(monday(today), view === "next" ? 7 : 0);
  return [start, shift(start, 7)];
}
function matchingEvents(items, view, today) {
  const [start, end] = periodBounds(view, today);
  return items.filter(e => e.date >= start && e.date < end).sort((a, b) =>
    (view === "previous" ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date)) ||
    timeNumber(a.time) - timeNumber(b.time) || a.title.localeCompare(b.title));
}
function renderTalk(event) {
  const article = element("article", "", "talk");
  const meta = element("div", "", "talk-meta");
  if (event.series) meta.append(element("span", event.series, "series"));
  if (event.time) meta.append(element("span", event.time));
  if (event.location) meta.append(element("span", /^\d+$/.test(event.location) ? `Room ${event.location}` : event.location));
  article.append(meta);
  if (event.title) article.append(element("h3", event.title));
  if (event.speaker || event.affiliation) {
    const speaker = element("p", "", "speaker");
    if (event.speaker) speaker.append(element("em", event.speaker));
    if (event.affiliation) speaker.append(element("span", `${event.speaker ? " · " : ""}${event.affiliation}`, "affiliation"));
    article.append(speaker);
  }
  if (event.description) {
    const details = element("details");
    details.append(element("summary", "Abstract"), element("p", event.description, "abstract"));
    article.append(details);
  }
  const href = webLink(event.link);
  if (href) { const link = element("a", "Talk reference", "talk-link"); link.href = href; link.target = "_blank"; link.rel = "noopener noreferrer"; article.append(link); }
  return article;
}
function render() {
  const today = localDate();
  const [start, end] = periodBounds(period, today);
  document.getElementById("period-title").textContent = period === "previous" ? "Previous events" : period === "upcoming" ? "Upcoming seminars" : `${pretty(start, { month: "long", day: "numeric" })} – ${pretty(shift(end, -1), { month: "long", day: "numeric", year: "numeric" })}`;
  if (!loaded) return;
  const matches = matchingEvents(events, period, today);
  document.getElementById("event-count").textContent = hasSnapshot ? `${matches.length} ${matches.length === 1 ? "seminar" : "seminars"}` : "Not yet synced";
  schedule.replaceChildren();
  if (!hasSnapshot) { schedule.append(element("p", "The schedule will appear after the first bot update.", "empty")); return; }
  if (!matches.length) {
    const message = period === "previous" ? "No previous events in the current schedule." : `No seminars ${period === "upcoming" ? "currently listed for upcoming dates" : "scheduled for this week"}.`;
    schedule.append(element("p", message, "empty")); return;
  }
  const groups = new Map();
  for (const event of matches) { if (!groups.has(event.date)) groups.set(event.date, []); groups.get(event.date).push(event); }
  for (const [date, dayEvents] of groups) {
    const section = element("section", "", "day");
    section.setAttribute("aria-label", pretty(date, { weekday: "long", month: "long", day: "numeric", year: "numeric" }));
    const column = element("div", "", "date-column");
    column.append(element("span", pretty(date, { weekday: "long" }), "day-name"));
    const dateLabel = element("time", pretty(date, { month: "short", day: "numeric" }), "date-label"); dateLabel.dateTime = date; column.append(dateLabel);
    if (period === "previous") column.append(element("span", date.slice(0, 4), "day-name"));
    if (date === today) column.append(element("span", "Today", "today"));
    const talks = element("div"); dayEvents.forEach(event => talks.append(renderTalk(event)));
    section.append(column, talks); schedule.append(section);
  }
}
async function load() {
  schedule.setAttribute("aria-busy", "true");
  try {
    const response = await fetch("data/events.json", { cache: "no-cache" });
    if (!response.ok) throw new Error("Schedule unavailable");
    const data = await response.json();
    if (data.schema_version !== 1 || !Array.isArray(data.events)) throw new Error("Invalid schedule");
    events = data.events.filter(e => e && /^\d{4}-\d{2}-\d{2}$/.test(e.date) && !isNaN(dateValue(e.date)) && ["title", "speaker", "affiliation", "description", "time", "location", "series", "link"].every(k => typeof e[k] === "string"));
    const updated = new Date(data.updated_at);
    const validUpdate = data.updated_at && !isNaN(updated);
    hasSnapshot = !!validUpdate;
    document.getElementById("updated").textContent = validUpdate ? `Last synced ${new Intl.DateTimeFormat("en-US", { timeZone: zone, month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(updated)} ET` : "Waiting for the first bot update";
    const stale = validUpdate && Date.now() - updated.getTime() > 48 * 3600000;
    const notice = document.getElementById("freshness");
    notice.hidden = !stale && !!validUpdate;
    notice.textContent = stale ? "This schedule has not been refreshed recently. Please confirm event details with the organizers." : "The website is ready. The seminar bot has not published its first schedule yet.";
    loaded = true; render();
  } catch {
    if (!loaded) {
      schedule.replaceChildren(element("p", "The schedule could not be loaded. Please try again.", "empty"));
      const retry = element("button", "Try again", "retry"); retry.type = "button"; retry.addEventListener("click", load); schedule.append(retry);
      document.getElementById("updated").textContent = "Schedule temporarily unavailable";
    } else {
      const notice = document.getElementById("freshness"); notice.hidden = false; notice.textContent = "Could not check for updates. Showing the last loaded schedule.";
    }
  } finally { schedule.setAttribute("aria-busy", "false"); }
}
document.querySelectorAll("[data-period]").forEach(button => button.addEventListener("click", () => {
  period = button.dataset.period;
  document.querySelectorAll("[data-period]").forEach(b => b.setAttribute("aria-pressed", String(b === button)));
  render();
}));
render(); load();
setInterval(() => { if (!document.hidden) load(); }, 5 * 60 * 1000);
