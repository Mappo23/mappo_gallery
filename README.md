# FILM OS — `mappo_gallery`

A retro-OS photo diary for a Route 66 trip (Chicago → LA). Static HTML/CSS/JS
front-end — no framework, no build step — backed by a small PHP + MySQL API for
shared storage and owner auth. Draggable pixel windows, a Leaflet route map, and a
live Trip → Post itinerary, all wrapped in a sun-faded jet-age theme.

## Run it locally

Serve the static files:

```bash
python3 serve.py          # serves on http://localhost:8000
```

The desktop, map, and itinerary render locally, but **uploads/edits need the PHP
backend** (`api/`), which only runs on the hosting server. Locally you get a
read-only, empty view — that's expected. To deploy the full app (data + login) to
your Namecheap host, see **[DEPLOY.md](DEPLOY.md)**.

## Working across devices

The easiest workflow — two scripts:

```bash
./start.sh                # pull latest, then serve  → run this when you sit down
./save.sh "what I did"    # commit + push everything  → run this before you leave
```

`start.sh` pulls (auto-stashing anything uncommitted) and boots the server.
`save.sh` stages, commits, and pushes — the message is optional (defaults to a
timestamped `wip`). Always `start` when you arrive and `save` when you leave, and the
two machines never drift.

First time on a new device:

```bash
git clone https://github.com/Mappo23/mappo_gallery.git
cd mappo_gallery
./start.sh
```

## How your data works

Content lives on the **server**, not the browser. Photos are uploaded to
`uploads/` (files) and their metadata + the trip itinerary live in **MySQL** via the
`api/` PHP endpoints. So everyone sees the same gallery, and you can add photos from
any device — they persist and sync. Git still syncs only the **code**; the database
and `uploads/` stay on the server (and are git-ignored).

The one per-device setting kept in `localStorage` is the light/dark **theme**.

## Owner mode (auth)

Editing is owner-only, enforced server-side. There's **no login box** — visitors see
a clean, read-only desktop. To unlock: **triple-click the FILM OS logo** (bottom-left
taskbar) and enter the owner password. Edit controls (upload, save, delete, trip
editing) then appear; triple-click again to lock. Password setup is in
[DEPLOY.md](DEPLOY.md).

## Project layout

```
index.html        markup + window templates
serve.py          tiny no-cache static server (local dev only)
css/              desktop tokens (themes), windows, gallery, map, trip, mobile, auth
js/               storage · auth · exif · window-manager · gallery · map · route66 · trip · app
api/              PHP backend: db · login/logout/me · photos · trip  (+ config.php, git-ignored)
uploads/          photo files written by the server (git-ignored)
```

- Theme tokens (both light + dark "Sun-faded 66" palettes) live at the top of
  `css/desktop.css`.
- Photos are compressed on load and stored as base64 in `localStorage`.
- The map uses Leaflet + CARTO tiles via CDN (no API key).
