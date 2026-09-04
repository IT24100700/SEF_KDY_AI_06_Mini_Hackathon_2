import { useState } from 'react'
import { NavLink, Link } from 'react-router-dom'

const NAV_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/request-aid', label: 'Request Aid' },
  { to: '/donate', label: 'Donate' },
  { to: '/requests', label: 'Aid Requests' },
  { to: '/donations', label: 'Donations' },
  { to: '/about', label: 'About' },
  { to: '/feedback', label: 'Feedback' },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)

  const linkClass = ({ isActive }) =>
    `text-sm font-medium transition-colors ${
      isActive
        ? 'text-red-500'
        : 'text-slate-700 hover:text-red-500'
    }`

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl">🇱🇰</span>
            <span className="font-bold text-slate-900 text-lg leading-tight">
              Help<span className="text-red-500">SriLanka</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6">
            {NAV_LINKS.map(({ to, label }) => (
              <NavLink key={to} to={to} end={to === '/'} className={linkClass}>
                {label}
              </NavLink>
            ))}
          </nav>

          {/* Emergency badges + auth */}
          <div className="hidden md:flex items-center gap-3">
            <a
              href="tel:117"
              className="flex items-center gap-1.5 bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-full hover:bg-red-700 transition-colors"
            >
              🚨 117 — Disaster Hotline
            </a>
            <Link
              to="/login"
              className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              Log in
            </Link>
            <Link
              to="/signup"
              className="text-sm font-semibold bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-700 transition-colors"
            >
              Sign up
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
            className="md:hidden p-2 rounded-md text-slate-600 hover:bg-slate-100 transition-colors"
          >
            {open ? (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden border-t border-slate-100 bg-white px-4 pb-4">
          <nav className="flex flex-col gap-1 pt-3">
            {NAV_LINKS.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `px-3 py-2 rounded-md text-sm font-medium ${
                    isActive
                      ? 'bg-red-50 text-red-600'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>
          <div className="mt-4 flex flex-col gap-2">
            <a
              href="tel:117"
              className="flex items-center justify-center gap-2 bg-red-600 text-white text-sm font-bold px-4 py-2 rounded-lg"
            >
              🚨 Emergency: 117 — Disaster Management
            </a>
            <div className="flex gap-2">
              <Link
                to="/login"
                onClick={() => setOpen(false)}
                className="flex-1 text-center text-sm font-medium border border-slate-300 text-slate-700 px-4 py-2 rounded-lg"
              >
                Log in
              </Link>
              <Link
                to="/signup"
                onClick={() => setOpen(false)}
                className="flex-1 text-center text-sm font-semibold bg-slate-900 text-white px-4 py-2 rounded-lg"
              >
                Sign up
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
