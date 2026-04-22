import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
    isActive
      ? "bg-gradient-to-r from-rose-500 to-fuchsia-500 text-white shadow"
      : "text-slate-200 hover:bg-white/10"
  }`;

export function Navbar() {
  const { isAuthenticated, isAdmin, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link to="/" className="flex items-center gap-2 font-semibold text-white">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-rose-500 to-fuchsia-500 text-sm text-white shadow-lg shadow-rose-900/30">
            UP
          </span>
          <span className="hidden sm:inline">urbanplay</span>
        </Link>

        <nav className="flex flex-wrap items-center justify-end gap-1 sm:gap-2">
          <NavLink to="/search" className={linkClass}>
            Find turfs
          </NavLink>
          {isAuthenticated && (
            <NavLink to="/dashboard" className={linkClass}>
              My bookings
            </NavLink>
          )}
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
                className="rounded-lg bg-gradient-to-r from-rose-500 to-fuchsia-500 px-3 py-2 text-sm font-semibold text-white shadow-lg shadow-rose-900/30 hover:brightness-110"
              >
                Sign up
              </NavLink>
            </>
          ) : (
            <button
              type="button"
              onClick={() => logout()}
              className="rounded-lg border border-white/20 px-3 py-2 text-sm font-medium text-slate-100 hover:bg-white/10"
            >
              Log out
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
