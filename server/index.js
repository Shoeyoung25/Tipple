import express from "express";
import multer from "multer";
import { randomBytes, createHmac, timingSafeEqual } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { extname, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  UPLOAD_DIR,
  DATA_DIR,
  listReviews,
  getReview,
  createReview,
  updateReview,
  deleteReview,
  stats,
} from "./db.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || (process.env.NODE_ENV === "production" ? 3000 : 3001);

// ---- Shared-password gate ------------------------------------------------
// Password comes from $TIPPLE_PASSWORD or data/password.txt. If neither is set
// the app stays open (handy for local-only dev). The auth cookie holds an HMAC
// of the password, so it survives restarts and needs no session store.
function loadPassword() {
  if (process.env.TIPPLE_PASSWORD) return process.env.TIPPLE_PASSWORD.trim();
  const file = join(DATA_DIR, "password.txt");
  if (existsSync(file)) {
    const v = readFileSync(file, "utf8").trim();
    if (v) return v;
  }
  return null;
}
const PASSWORD = loadPassword();
const AUTH_REQUIRED = Boolean(PASSWORD);
const COOKIE = "tipple_auth";
const tokenFor = (pw) => createHmac("sha256", pw).update("tipple-auth-v1").digest("hex");
const AUTH_TOKEN = AUTH_REQUIRED ? tokenFor(PASSWORD) : null;

function safeEqual(a, b) {
  const ba = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

function readCookie(req, name) {
  const header = req.headers.cookie;
  if (!header) return null;
  for (const part of header.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) return decodeURIComponent(v.join("="));
  }
  return null;
}

function isAuthed(req) {
  if (!AUTH_REQUIRED) return true;
  const c = readCookie(req, COOKIE);
  return c ? safeEqual(c, AUTH_TOKEN) : false;
}

function requireAuth(req, res, next) {
  if (isAuthed(req)) return next();
  res.status(401).json({ error: "Not authorized" });
}

const app = express();
app.disable("x-powered-by");
app.set("trust proxy", 1); // behind Fly/Cloudflare/any reverse proxy
app.use(express.json());

// ---- Image uploads -> data/uploads --------------------------------------
const ALLOWED = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".heic"]);
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = (extname(file.originalname) || ".jpg").toLowerCase();
    cb(null, `${Date.now()}-${randomBytes(4).toString("hex")}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 12 * 1024 * 1024 },
  fileFilter: (_req, file, cb) =>
    cb(null, ALLOWED.has(extname(file.originalname).toLowerCase())),
});

app.use("/uploads", express.static(UPLOAD_DIR, { maxAge: "7d" }));

// ---- Validation ----------------------------------------------------------
function parseBody(body) {
  const name = String(body.name || "").trim();
  const type = String(body.type || "").trim();
  const country = String(body.country || "").trim();
  const review = String(body.review || "").trim();
  const reviewer = String(body.reviewer || "").trim();
  let rating = Number(body.rating);
  if (!Number.isFinite(rating)) rating = 0;
  rating = Math.max(0, Math.min(5, Math.round(rating * 2) / 2));

  const errors = [];
  if (!name) errors.push("Name is required");
  if (!type) errors.push("Type is required");
  if (!country) errors.push("Country is required");
  if (rating <= 0) errors.push("A rating is required");

  return { value: { name, type, country, review, reviewer, rating }, errors };
}

// ---- Auth routes (open) --------------------------------------------------
const auth = express.Router();

auth.get("/health", (_req, res) => res.json({ ok: true }));

auth.get("/session", (req, res) => {
  res.json({ required: AUTH_REQUIRED, authed: isAuthed(req) });
});

auth.post("/login", (req, res) => {
  if (!AUTH_REQUIRED) return res.json({ authed: true });
  const password = String(req.body?.password || "");
  if (!safeEqual(password, PASSWORD)) {
    return res.status(401).json({ error: "Wrong password" });
  }
  res.cookie(COOKIE, AUTH_TOKEN, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 1000 * 60 * 60 * 24 * 60, // 60 days
    path: "/",
  });
  res.json({ authed: true });
});

auth.post("/logout", (_req, res) => {
  res.clearCookie(COOKIE, { path: "/" });
  res.json({ authed: false });
});

app.use("/api", auth);

// ---- API (password-protected) --------------------------------------------
const api = express.Router();
api.use(requireAuth);

api.get("/reviews", (req, res) => {
  res.json(listReviews(req.query));
});

api.get("/reviews/:id", (req, res) => {
  const row = getReview(Number(req.params.id));
  if (!row) return res.status(404).json({ error: "Not found" });
  res.json(row);
});

api.post("/reviews", upload.single("image"), (req, res) => {
  const { value, errors } = parseBody(req.body);
  if (errors.length) return res.status(400).json({ error: errors.join(", ") });
  const image = req.file ? `/uploads/${req.file.filename}` : null;
  res.status(201).json(createReview({ ...value, image }));
});

api.put("/reviews/:id", upload.single("image"), (req, res) => {
  const id = Number(req.params.id);
  if (!getReview(id)) return res.status(404).json({ error: "Not found" });
  const { value, errors } = parseBody(req.body);
  if (errors.length) return res.status(400).json({ error: errors.join(", ") });
  const image = req.file ? `/uploads/${req.file.filename}` : undefined;
  res.json(updateReview(id, { ...value, image }));
});

api.delete("/reviews/:id", (req, res) => {
  deleteReview(Number(req.params.id));
  res.status(204).end();
});

api.get("/stats", (_req, res) => res.json(stats()));

app.use("/api", api);

// ---- Serve built frontend in production ----------------------------------
if (process.env.NODE_ENV === "production") {
  const dist = join(__dirname, "..", "dist");
  if (existsSync(dist)) {
    app.use(express.static(dist));
    app.get("*", (_req, res) => res.sendFile(join(dist, "index.html")));
  }
}

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(400).json({ error: err.message || "Request failed" });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`\n  🍺 Tipple server running`);
  console.log(`     local:   http://localhost:${PORT}`);
  console.log(`     auth:    ${AUTH_REQUIRED ? "ON (shared password)" : "OFF (open — set data/password.txt)"}`);
  if (process.env.NODE_ENV === "production")
    console.log(`     network: http://<this-device-LAN-ip>:${PORT}  (share with friends)\n`);
  else console.log(`     (dev) open the Vite URL on :5173\n`);
});
