/**
 * HelpSriLanka — shared design tokens.
 *
 * Kept as a plain module (not a Tailwind config change) because
 * `tailwind` config / `index.css` are locked global files per AGENTS.md.
 * Import these constants, or use the matching Tailwind arbitrary values
 * documented next to each token.
 *
 * NOTE: this file is intentionally identical on the `Landing` and
 * `Feedback` branches so both merge into `main` without conflicts.
 */

export const COLORS = {
  crisis: '#B91C1C',      // bg-[#B91C1C] — SOS / primary emergency red
  crisisDark: '#7F1D1D',  // hover state for crisis red
  crisisSoft: '#FEE2E2',  // alert banner background
  crisisInk: '#991B1B',   // alert banner text
  relief: '#C2410C',      // bg-[#C2410C] — donate / supplies rust-orange
  reliefDark: '#9A3412',
  reliefSoft: '#FFEDD5',
  flag: '#FFC400',        // Sri Lanka flag yellow — display accent only
  ink: '#111827',         // primary text
  muted: '#6B7280',       // secondary text
  hairline: '#E5E7EB',    // borders
  canvas: '#F4F4F5',      // page / section background
  surface: '#FFFFFF',
  medical: '#2563EB',     // blue accent — missing-person / medical tags
  medicalSoft: '#DBEAFE',
}

/** Serif display face used for section + hero headings. */
export const DISPLAY = 'font-serif tracking-tight'

/** Official Sri Lankan emergency numbers (AGENTS.md §Emergency Contacts). */
export const HOTLINES = [
  { label: 'Disaster Mgt Centre', number: '117', tone: 'crisis' },
  { label: 'Police Emergency', number: '119', tone: 'ink' },
  { label: 'Fire & Rescue', number: '110', tone: 'ink' },
  { label: 'Suwaseriya Ambulance', number: '1990', tone: 'ink' },
]

/** Districts used across request / feedback forms. */
export const DISTRICTS = [
  'Ampara', 'Anuradhapura', 'Badulla', 'Batticaloa', 'Colombo', 'Galle',
  'Gampaha', 'Hambantota', 'Jaffna', 'Kalutara', 'Kandy', 'Kegalle',
  'Kilinochchi', 'Kurunegala', 'Mannar', 'Matale', 'Matara', 'Monaragala',
  'Mullaitivu', 'Nuwara Eliya', 'Polonnaruwa', 'Puttalam', 'Ratnapura',
  'Trincomalee', 'Vavuniya',
]
