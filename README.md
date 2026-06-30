# FILM OS — `mappo_gallery`

A retro-OS photo diary for a Route 66 trip. Pure HTML/CSS/JS — no framework, no build
step. Draggable pixel windows, a Leaflet route map, and a live Trip → Post itinerary,
all wrapped in a sun-faded jet-age theme.

## Run it locally

No install needed — just a static file server:

```bash
python3 serve.py          # serves on http://localhost:8000
```

Then open <http://localhost:8000>. (Any static server works; `serve.py` just adds
no-cache headers so edits show up on reload.)

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

Git syncs the **app and its look** — not your **content**. Photos and trip progress
live in the browser's `localStorage` (`filmOS_photos`, `filmOS_trip`), which is
per-browser and per-device. So uploads and trip state do **not** travel between
machines via git. (An export/import button could fix that later.)

## Project layout

```
index.html        markup + window templates
serve.py          tiny no-cache static server
css/              desktop tokens (themes), windows, gallery, map, trip, mobile
js/               storage · exif · window-manager · gallery · map · route66 · trip · app
```

- Theme tokens (both light + dark "Sun-faded 66" palettes) live at the top of
  `css/desktop.css`.
- Photos are compressed on load and stored as base64 in `localStorage`.
- The map uses Leaflet + CARTO tiles via CDN (no API key).
