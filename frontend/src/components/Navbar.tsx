import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
    isActive ? "bg-emerald-600 text-white" : "text-slate-700 hover:bg-emerald-50"
  }`;

export function Navbar() {
  const { isAuthenticated, isAdmin, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b border-emerald-100 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link to="/" className="flex items-center gap-2 font-semibold text-emerald-700">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-sm text-white">
            TB
          </span>
          <span className="hidden sm:inline">TurfBook</span>
        </Link>

        <nav className="flex flex-wrap items-center justify-end gap-1 sm:gap-2">
          <NavLink to="/search" className={linkClass}>
            Find turfs
          </NavLink>
          {isAdmin && (
            <NavLink to="/admin" className={linkClass}>
              Admin
            </NavLink>
          )}
          {!isAuthenticated ? (
            <>
              <NavLink to="/login" className={linkClass}>
                Log in
              </NavLink>
              <NavLink
                to="/signup"
                className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
              >
                Sign up
              </NavLink>
            </>
          ) : (
            <button
              type="button"
              onClick={() => logout()}
              className="rounded-lg border border-emerald-200 px-3 py-2 text-sm font-medium text-emerald-800 hover:bg-emerald-50"
            >
              Log out
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
