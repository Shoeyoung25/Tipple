# 🍺 Tipple

A Letterboxd-style review archive for beer & alcohol — for you and your friends.
Self-hosted on your own device. No accounts, no cloud, your data stays in
`data/tipple.db`.

## Features

- **Archive** of every drink you've reviewed, as a poster-style grid
- **5-star ratings** (half stars supported)
- **Photo, name, type, country of origin, written review** per entry
- **Filter & sort** by country, type, reviewer, rating, name, or recency
- **Browse by country of origin** with per-country average scores
- **Reviewer names** so friends can tell their reviews apart (no login needed)
- Mobile-first design — add it to your phone home screen

## Run it (host on this device)

```bash
npm install
npm run build   # builds the mobile web app
npm start       # serves everything on http://localhost:4000
```

Then on the same Wi-Fi, friends open `http://<your-device-ip>:4000`
(find your IP with `ipconfig getifaddr en0` on macOS).

## Develop

```bash
npm run dev     # Vite on :5173 + API on :3001 with hot reload
```

## Shared password (for sharing beyond your home)

When the app is reachable from the internet (e.g. via a tunnel), it's protected
by a single shared password that you give to your friends.

- The password lives in `data/password.txt` (default: `friends`).
- **Change it** by editing that file (or setting `TIPPLE_PASSWORD`) and
  restarting the server.
- Delete the file to disable the gate (only safe on a private LAN).

## Share with friends in another country (Cloudflare Tunnel)

Keep the server running, then in another terminal:

```bash
cloudflared tunnel --url http://localhost:4000
```

It prints a public `https://….trycloudflare.com` URL — send that to your
friends along with the password. The URL changes each time you restart the
tunnel; for a permanent URL, set up a named Cloudflare tunnel with your own
domain.

## Deploy to the cloud — always-on, permanent URL (Fly.io)

A laptop that sleeps can't host. To get a 24/7 permanent `https://<app>.fly.dev`
link (free URL + HTTPS, no domain needed), deploy to Fly.io. The repo is already
container-ready (`Dockerfile`, `fly.toml`, `DATA_DIR` env, `/api/health`).

Your machine already has `flyctl` installed. Steps (the account + card are yours;
everything else is automated):

```bash
fly auth login                       # opens browser; create account, add a card

cd ~/Desktop/BeerApp
fly launch --no-deploy               # keep the existing Dockerfile + fly.toml
                                     # pick a UNIQUE app name + a region near friends

fly volumes create tipple_data --size 1   # persistent storage for DB + photos
fly secrets set TIPPLE_PASSWORD="friends"   # the shared password (change it!)

fly deploy                           # build remotely + go live
fly open                             # opens https://<your-app>.fly.dev
```

Notes:
- **Cost:** the `.fly.dev` URL is free; a tiny always-on machine is ~$2–4/mo.
- **Always-on:** `fly.toml` sets `min_machines_running = 1` / `auto_stop_machines = false`.
- **Data persists** on the `tipple_data` volume across deploys and restarts.
- **Change the password later:** `fly secrets set TIPPLE_PASSWORD="…"` (auto-redeploys).
- **Custom domain later (optional):** `fly certs add tipple.yourdomain.com`.

Same `Dockerfile` runs on Railway, Render (paid disk), or any VM with Docker, if
you'd rather use those.

## Data

- Database: `data/tipple.db` (SQLite, via Node's built-in `node:sqlite`)
- Uploaded photos: `data/uploads/`

Back up the `data/` folder to keep your archive safe.
