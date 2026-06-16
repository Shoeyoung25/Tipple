# 🍺 Tipple — How to Use

Your personal, Letterboxd-style review archive for beer & alcohol — to share with
friends anywhere in the world. It's deployed to the cloud, so it's online 24/7
even when your computer is off.

---

## Your live app

**https://tipple.fly.dev**

- Open it on your phone or computer.
- Tap **Share → Add to Home Screen** (iPhone) or **Install app** (Android/Chrome)
  to use it like a real app, full-screen.

## The password

The app is protected by one shared password so only you and your friends can see it.

- The password is whatever you last set via `fly secrets set TIPPLE_PASSWORD=…`.
  Keep the current value somewhere private (1Password, Notes, etc.) — it is
  intentionally **not written down in this repo**.
- Everyone enters it **once** — it's remembered for 60 days on that device.
- Send friends the link + the current password through a private channel.

---

## Using the app

### Add a review
1. Tap the amber **Review** button in the bottom bar.
2. Add a **photo**, the **name**, pick a **type** (Beer, Wine, Whisky…) and the
   **country of origin**.
3. Tap the stars to give a **rating** (tap the left half of a star for a half-star).
4. Write a short **review**, put **your name** in the reviewer field, and **Save**.

> Your reviewer name is remembered, so you only type it once.

### Browse the archive
- **Archive** tab — every drink as a poster grid. Search, sort (newest, rating,
  name…), and filter by country, type, or reviewer.
- **Browse** tab — explore by country (with each country's average score), by drink
  type, or by reviewer.
- Tap any poster to see the full review, where you can **Edit** or **Delete** it.

### Reviewer names
No logins needed — everyone just types their name on each review, so you can tell
each other's reviews apart.

---

## Sharing with friends

Just send them two things, through a private channel:

1. The link: **https://tipple.fly.dev**
2. The current shared password (whatever you last set via `fly secrets`).

That's it — it works from any country, on any phone or computer.

---

## Maintaining it (the technical bits)

These are run from a terminal in the app folder (`cd ~/Desktop/BeerApp`).

| What you want | Command |
|---|---|
| **Change the password** | `fly secrets set TIPPLE_PASSWORD="your-new-password"` (auto-redeploys) |
| **Rotate the signing key** (kicks every device out, forces re-login) | `fly secrets set TIPPLE_SECRET="$(openssl rand -base64 32)"` |
| **Publish changes** to the app | `fly deploy` |
| **See live logs** | `fly logs` |
| **Check status** | `fly status` |
| **Open the app** | `fly open` |

You can also watch it in the dashboard: https://fly.io/apps/tipple/monitoring

### Good to know
- **Always-on:** runs 24/7 in the cloud — works even when your Mac is closed.
- **Permanent URL:** `tipple.fly.dev` never changes.
- **Your data is safe:** all reviews and photos are stored on a persistent cloud
  volume (`tipple_data`) and survive restarts and updates.
- **Cost:** the URL + HTTPS are free; the tiny always-on machine is ~$2–4/month on
  the card linked to your Fly.io account.

### Optional: a custom domain later
If you ever want `tipple.yourdomain.com` instead of `tipple.fly.dev`:
```bash
fly certs add tipple.yourdomain.com
```
…then point that domain's DNS at Fly (it prints the records to add).

---

Enjoy, and drink responsibly! 🍻
