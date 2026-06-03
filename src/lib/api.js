// Thin fetch wrapper around the Express API.
async function handle(res) {
  if (!res.ok) {
    let msg = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.error) msg = body.error;
    } catch {}
    throw new Error(msg);
  }
  if (res.status === 204) return null;
  return res.json();
}

export function getReviews(params = {}) {
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v != null && v !== "")
  ).toString();
  return fetch(`/api/reviews${qs ? `?${qs}` : ""}`).then(handle);
}

export function getReview(id) {
  return fetch(`/api/reviews/${id}`).then(handle);
}

export function createReview(formData) {
  return fetch(`/api/reviews`, { method: "POST", body: formData }).then(handle);
}

export function updateReview(id, formData) {
  return fetch(`/api/reviews/${id}`, { method: "PUT", body: formData }).then(handle);
}

export function deleteReview(id) {
  return fetch(`/api/reviews/${id}`, { method: "DELETE" }).then(handle);
}

export function getStats() {
  return fetch(`/api/stats`).then(handle);
}

export function getSession() {
  return fetch(`/api/session`).then(handle);
}

export function login(password) {
  return fetch(`/api/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  }).then(handle);
}

export function logout() {
  return fetch(`/api/logout`, { method: "POST" }).then(handle);
}
