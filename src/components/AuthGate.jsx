import { createContext, useContext, useEffect, useState } from "react";
import { getSession, login, logout } from "../lib/api.js";

const AuthContext = createContext({ required: false, doLogout: () => {} });
export const useAuth = () => useContext(AuthContext);

// Wraps the app. If the server requires a password and we're not authed yet,
// shows the login screen instead of the app.
export default function AuthGate({ children }) {
  const [state, setState] = useState(null); // { required, authed }

  useEffect(() => {
    getSession()
      .then(setState)
      .catch(() => setState({ required: false, authed: true }));
  }, []);

  async function doLogout() {
    await logout();
    setState({ required: true, authed: false });
  }

  if (state === null) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-muted">
        <span className="animate-pulse text-4xl">🍺</span>
      </div>
    );
  }

  if (state.required && !state.authed) {
    return <Login onSuccess={() => setState({ required: true, authed: true })} />;
  }

  return (
    <AuthContext.Provider value={{ required: state.required, doLogout }}>
      {children}
    </AuthContext.Provider>
  );
}

function Login({ onSuccess }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await login(password);
      onSuccess();
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm animate-rise text-center">
        <div className="text-6xl">🍺</div>
        <h1 className="mt-3 font-display text-3xl font-bold">Tipple</h1>
        <p className="mt-1 text-sm text-muted">Enter the shared password to continue.</p>

        <form onSubmit={submit} className="mt-6 space-y-3">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            autoFocus
            className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-center text-cream placeholder:text-muted/60 focus:border-amber focus:outline-none"
          />
          {error && (
            <p className="rounded-lg bg-red-500/15 px-3 py-2 text-sm text-red-300">{error}</p>
          )}
          <button
            type="submit"
            disabled={busy || !password}
            className="w-full rounded-xl bg-amber py-3 font-semibold text-bg shadow-lg shadow-amber/20 active:scale-[0.98] disabled:opacity-60"
          >
            {busy ? "Checking…" : "Enter"}
          </button>
        </form>
      </div>
    </div>
  );
}
