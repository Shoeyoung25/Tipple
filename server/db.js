import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
// DATA_DIR is overridable so a cloud host can point it at a persistent volume
// (e.g. DATA_DIR=/data on Fly). Defaults to ./data for local self-hosting.
export const DATA_DIR = process.env.DATA_DIR || join(__dirname, "..", "data");
mkdirSync(DATA_DIR, { recursive: true });

export const UPLOAD_DIR = join(DATA_DIR, "uploads");
mkdirSync(UPLOAD_DIR, { recursive: true });

const db = new DatabaseSync(join(DATA_DIR, "tipple.db"));
db.exec("PRAGMA journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS reviews (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT    NOT NULL,
    type       TEXT    NOT NULL,
    country    TEXT    NOT NULL,
    rating     REAL    NOT NULL,
    review     TEXT    NOT NULL DEFAULT '',
    reviewer   TEXT    NOT NULL DEFAULT '',
    image      TEXT,
    created_at TEXT    NOT NULL DEFAULT (datetime('now'))
  )
`);

// Prepared statements are kept around for the lifetime of the process —
// SQLite is fastest when prepares are re-used instead of re-parsed per call.
const stmts = {
  get: db.prepare("SELECT * FROM reviews WHERE id = ?"),
  insert: db.prepare(
    `INSERT INTO reviews (name, type, country, rating, review, reviewer, image)
     VALUES ($name, $type, $country, $rating, $review, $reviewer, $image)`
  ),
  update: db.prepare(
    `UPDATE reviews SET name=$name, type=$type, country=$country, rating=$rating,
       review=$review, reviewer=$reviewer, image=COALESCE($image, image)
     WHERE id=$id`
  ),
  delete: db.prepare("DELETE FROM reviews WHERE id = ?"),
  count: db.prepare("SELECT COUNT(*) AS n FROM reviews"),
  byCountry: db.prepare(
    "SELECT country, COUNT(*) AS n, AVG(rating) AS avg FROM reviews GROUP BY country ORDER BY n DESC, country ASC"
  ),
  byType: db.prepare(
    "SELECT type, COUNT(*) AS n FROM reviews GROUP BY type ORDER BY n DESC, type ASC"
  ),
  reviewers: db.prepare(
    "SELECT reviewer, COUNT(*) AS n FROM reviews WHERE reviewer != '' GROUP BY reviewer ORDER BY n DESC"
  ),
};

// listReviews builds SQL dynamically based on which filters are active. Cache
// prepared statements keyed by the SQL string so each filter shape compiles
// once and is reused for the lifetime of the process.
const listCache = new Map();
function prepareList(sql) {
  let stmt = listCache.get(sql);
  if (!stmt) {
    stmt = db.prepare(sql);
    listCache.set(sql, stmt);
  }
  return stmt;
}

const ORDER_BY = {
  newest: "created_at DESC",
  oldest: "created_at ASC",
  rating: "rating DESC, created_at DESC",
  lowest: "rating ASC, created_at DESC",
  name: "name COLLATE NOCASE ASC",
};

export function listReviews({ country, type, reviewer, search, sort } = {}) {
  const where = [];
  const params = {};
  if (country) {
    where.push("country = $country");
    params.country = country;
  }
  if (type) {
    where.push("type = $type");
    params.type = type;
  }
  if (reviewer) {
    where.push("reviewer = $reviewer");
    params.reviewer = reviewer;
  }
  if (search) {
    where.push("(name LIKE $search OR review LIKE $search)");
    params.search = `%${search}%`;
  }

  const orderBy = ORDER_BY[sort] || ORDER_BY.newest;
  const sql =
    "SELECT * FROM reviews" +
    (where.length ? ` WHERE ${where.join(" AND ")}` : "") +
    ` ORDER BY ${orderBy}`;

  return prepareList(sql).all(params);
}

export function getReview(id) {
  return stmts.get.get(id);
}

export function createReview(r) {
  const info = stmts.insert.run({
    name: r.name,
    type: r.type,
    country: r.country,
    rating: r.rating,
    review: r.review,
    reviewer: r.reviewer,
    image: r.image,
  });
  return getReview(info.lastInsertRowid);
}

export function updateReview(id, r) {
  stmts.update.run({
    id,
    name: r.name,
    type: r.type,
    country: r.country,
    rating: r.rating,
    review: r.review,
    reviewer: r.reviewer,
    image: r.image ?? null,
  });
  return getReview(id);
}

export function deleteReview(id) {
  return stmts.delete.run(id);
}

// Aggregates for the browse / filter UI.
export function stats() {
  return {
    total: stmts.count.get().n,
    byCountry: stmts.byCountry.all(),
    byType: stmts.byType.all(),
    reviewers: stmts.reviewers.all(),
  };
}
