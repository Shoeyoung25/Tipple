import { Routes, Route, NavLink, Link, useLocation } from "react-router-dom";
import Home from "./pages/Home.jsx";
import Countries from "./pages/Countries.jsx";
import ReviewDetail from "./pages/ReviewDetail.jsx";
import ReviewForm from "./pages/ReviewForm.jsx";
import { useAuth } from "./components/AuthGate.jsx";

export default function App() {
  const location = useLocation();
  return (
    <div className="mx-auto flex min-h-dvh max-w-3xl flex-col">
      <Header />
      <main className="flex-1 px-4 pb-28 pt-4">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/countries" element={<Countries />} />
          <Route path="/add" element={<ReviewForm />} />
          <Route path="/edit/:id" element={<ReviewForm />} />
          <Route path="/drink/:id" element={<ReviewDetail />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <BottomNav key={location.pathname} />
    </div>
  );
}

function Header() {
  const { required, doLogout } = useAuth();
  return (
    <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border/70 bg-bg/80 px-4 py-3 backdrop-blur-md">
      <Link to="/" className="flex items-center gap-2">
        <span className="text-2xl">🍺</span>
        <span className="font-display text-xl font-bold tracking-tight">Tipple</span>
        <span className="ml-1 hidden text-xs text-muted sm:inline">· your drinks, reviewed</span>
      </Link>
      {required && (
        <button
          onClick={doLogout}
          className="rounded-full border border-border px-3 py-1 text-xs text-muted hover:text-cream"
          title="Log out"
        >
          Log out
        </button>
      )}
    </header>
  );
}

function BottomNav() {
  const tabs = [
    { to: "/", label: "Archive", icon: GridIcon },
    { to: "/countries", label: "Browse", icon: GlobeIcon },
    { to: "/add", label: "Review", icon: PlusIcon, primary: true },
  ];
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border/70 bg-bg/90 backdrop-blur-md">
      <div
        className="mx-auto flex max-w-3xl items-center justify-around px-4 pt-2"
        style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
      >
        {tabs.map(({ to, label, icon: Icon, primary }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              [
                "flex flex-1 flex-col items-center gap-1 rounded-lg py-1.5 text-xs transition-colors",
                primary
                  ? "text-bg"
                  : isActive
                    ? "text-amber"
                    : "text-muted hover:text-cream",
              ].join(" ")
            }
          >
            {primary ? (
              <span className="flex flex-col items-center">
                <span className="-mt-5 flex h-12 w-12 items-center justify-center rounded-full bg-amber shadow-lg shadow-amber/30 ring-4 ring-bg">
                  <Icon className="h-6 w-6" />
                </span>
                <span className="mt-1 text-amber">{label}</span>
              </span>
            ) : (
              <>
                <Icon className="h-5 w-5" />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

function NotFound() {
  return (
    <div className="py-20 text-center text-muted">
      <p className="text-5xl">🍂</p>
      <p className="mt-4">Nothing poured here.</p>
      <Link to="/" className="mt-4 inline-block text-amber underline">
        Back to the archive
      </Link>
    </div>
  );
}

/* — inline icons (no dependency) — */
function GridIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}
function GlobeIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.5 2.5 2.5 15 0 18M12 3c-2.5 2.5-2.5 15 0 18" />
    </svg>
  );
}
function PlusIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
