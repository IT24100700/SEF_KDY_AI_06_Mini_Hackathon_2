import { NavLink } from 'react-router-dom'

/**
 * Fixed bottom tab bar for field use on phones.
 *
 * Mobile only (`md:hidden`) so it never competes with the shared desktop
 * Navbar, which stays owned by the project lead.
 *
 * NOTE: this file is intentionally identical on the `Landing` and
 * `Feedback` branches so both merge into `main` without conflicts.
 */

const TABS = [
  { to: '/', label: 'Home', end: true, icon: 'M3 10.5 12 3l9 7.5M5.25 9.75V20a1 1 0 0 0 1 1h3.5v-5.5h4.5V21h3.5a1 1 0 0 0 1-1V9.75' },
  { to: '/request-aid', label: 'Request', icon: 'M12 3v9m0 0 3.5-3.5M12 12 8.5 8.5M4 15v3a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3v-3' },
  { to: '/requests', label: 'Crises', icon: 'M12 4 2.5 20h19L12 4Zm0 6v4.5m0 3h.01' },
  { to: '/donate', label: 'Donate', icon: 'M12 20.25S3.75 15.5 3.75 9.75A4.25 4.25 0 0 1 12 8a4.25 4.25 0 0 1 8.25 1.75c0 5.75-8.25 10.5-8.25 10.5Z' },
  { to: '/about', label: 'About', icon: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-13h.01M11 12h1v4h1' },
]

export default function MobileTabBar() {
  return (
    <>
      {/* Spacer so page content is never hidden behind the fixed bar */}
      <div className="h-20 md:hidden" aria-hidden="true" />

      <nav
        aria-label="Primary"
        className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-[#E5E7EB] shadow-[0_-2px_12px_rgba(0,0,0,0.06)]"
      >
        <ul className="grid grid-cols-5">
          {TABS.map(({ to, label, end, icon }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors ${
                    isActive ? 'text-[#B91C1C]' : 'text-[#6B7280] hover:text-[#111827]'
                  }`
                }
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.7}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d={icon} />
                </svg>
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </>
  )
}
