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
const IS_PROD = process.env.NODE_ENV === "production";
// Prod hosts (Fly, Docker, npm start) all set PORT explicitly; 3001 is the
// dev fallback that matches the Vite proxy in vite.config.js.
const PORT = process.env.PORT || 3001;

// ---- Authentication ------------------------------------------------------
// Model: the user proves they know a shared password once (verified in
// constant time), and the server then issues a stateless HMAC-SHA256-signed
// token of the form  base64url(payload).base64url(signature)  carried in an
// httpOnly cookie. The signing key (TIPPLE_SECRET) lives only on the server
// and is never derived from the password. Every API request re-verifies the
// signature in constant time and checks the embedded expiry. Zero session
// state is kept server-side; rotating TIPPLE_SECRET invalidates every active
// session.
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

// Production must have both a password and a signing secret. Fail loudly
// rather than silently boot in an insecure mode.
if (IS_PROD && !AUTH_REQUIRED) {
  console.error("FATAL: production requires TIPPLE_PASSWORD (or data/password.txt).");
  process.exit(1);
}
if (IS_PROD && !process.env.TIPPLE_SECRET) {
  console.error("FATAL: production requires TIPPLE_SECRET (a long random string).");
  process.exit(1);
}

// SECRET is the HMAC key used to sign and verify tokens. In dev we fall back
// to an ephemeral random key so the server boots without configuration —
// cookies just won't survive a restart, which is the correct behavior when
// no real secret has been provisioned.
const SECRET = process.env.TIPPLE_SECRET
  ? Buffer.from(process.env.TIPPLE_SECRET, "utf8")
  : randomBytes(32);
const SECRET_IS_EPHEMERAL = !process.env.TIPPLE_SECRET;

const COOKIE = "tipple_auth";
const TOKEN_TTL_MS = 1000 * 60 * 60 * 24 * 60; // 60 days

// base64url (RFC 4648 §5) without padding.
const toB64Url = (buf) =>
  Buffer.from(buf)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
const fromB64Url = (s) =>
  Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/"), "base64");
const signPayload = (payloadB64) =>
  createHmac("sha256", SECRET).update(payloadB64).digest();

function issueToken() {
  const now = Date.now();
  const payload = toB64Url(JSON.stringify({ iat: now, exp: now + TOKEN_TTL_MS }));
  const sig = toB64Url(signPayload(payload));
  return `${payload}.${sig}`;
}

function verifyToken(token) {
  if (typeof token !== "string") return false;
  const dot = token.indexOf(".");
  if (dot < 1 || dot === token.length - 1) return false;

  const payloadB64 = token.slice(0, dot);
  const sigB64 = token.slice(dot + 1);

  let given;
  try {
    given = fromB64Url(sigB64);
  } catch {
    return false;
  }
  const expected = signPayload(payloadB64);
  if (given.length !== expected.length) return false;
  if (!timingSafeEqual(given, expected)) return false;

  try {
    const { exp } = JSON.parse(fromB64Url(payloadB64).toString("utf8"));
    return typeof exp === "number" && exp > Date.now();
  } catch {
    return false;
  }
}

function safePasswordEqual(a, b) {
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
  return c ? verifyToken(c) : false;
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
  if (!safePasswordEqual(password, PASSWORD)) {
    return res.status(401).json({ error: "Wrong password" });
  }
  res.cookie(COOKIE, issueToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: IS_PROD, // Fly/Cloudflare terminate TLS; cookies should be HTTPS-only there.
    maxAge: TOKEN_TTL_MS,
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
if (IS_PROD) {
  const dist = join(__dirname, "..", "dist");
  if (existsSync(dist)) {
    app.use(express.static(dist));
    app.get("*", (_req, res) => res.sendFile(join(dist, "index.html")));
  } else {
    console.warn(`  ⚠  dist/ not found at ${dist} — run \`npm run build\` before starting in production.`);
  }
}

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(400).json({ error: err.message || "Request failed" });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`\n  🍺 Tipple server running`);
  console.log(`     local:   http://localhost:${PORT}`);
  console.log(`     auth:    ${AUTH_REQUIRED ? "ON (shared password + signed token)" : "OFF (open — set TIPPLE_PASSWORD or data/password.txt)"}`);
  if (SECRET_IS_EPHEMERAL)
    console.log(`     secret:  ephemeral (set TIPPLE_SECRET for persistent sessions)`);
  if (IS_PROD)
    console.log(`     network: http://<this-device-LAN-ip>:${PORT}  (share with friends)\n`);
  else console.log(`     (dev) open the Vite URL on :5173\n`);
});
