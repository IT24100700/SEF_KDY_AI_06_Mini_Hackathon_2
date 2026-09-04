/**
 * DonateForm.jsx — Donate & Support Sri Lanka
 * ============================================
 * Physical consignment builder with:
 *   - Impact counter hero
 *   - Two-category item quantity builder (Water/Rations + Medical/Hygiene)
 *   - Donor information & logistics form
 *   - Full validation (name, +94 phone, email, min 1 item)
 *   - POST to http://localhost:5000/api/donations via fetch
 *   - Loading state, inline toast errors, success banner
 *
 * Route: /donate  (wired in App.jsx → DonateForm)
 * Author: Help Sri Lanka Hackathon Team
 */

import { useState, useCallback, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'

// ─── Brand constants ─────────────────────────────────────────────────────────
const RED      = '#A50116'
const RED_DARK = '#7a0110'
const RED_LITE = '#fff0f2'

// ─── Catalogue definition ────────────────────────────────────────────────────
const CATALOGUE = [
  {
    id: 'water-rations',
    title: 'Water & Dry Rations',
    items: [
      { id: 'bottled-water',    label: 'Bottled Water (500 ml × 24)',  unit: 'Carton'  },
      { id: 'gallon-water',     label: 'Drinking Water Gallon (5 L)',  unit: 'Gallon'  },
      { id: 'rice-10kg',        label: 'Rice Sack (10 kg)',            unit: 'Sack'    },
      { id: 'red-dhal',         label: 'Red Dhal (1 kg)',              unit: 'Pack'    },
      { id: 'canned-fish',      label: 'Canned Fish (425 g)',          unit: 'Tin'     },
      { id: 'milk-powder',      label: 'Milk Powder (400 g)',          unit: 'Pack'    },
      { id: 'infant-cereal',    label: 'Infant Cereal (200 g)',        unit: 'Pack'    },
      { id: 'biscuits',         label: 'Biscuits (400 g assorted)',    unit: 'Pack'    },
      { id: 'tea-sugar',        label: 'Tea & Sugar (500 g each)',     unit: 'Set'     },
    ],
  },
  {
    id: 'medical-hygiene',
    title: 'Medical & Hygiene',
    items: [
      { id: 'sanitary-care',    label: 'Sanitary Care Pack',           unit: 'Pack'    },
      { id: 'chlorine-tabs',    label: 'Chlorine Tablets (100 tabs)',  unit: 'Bottle'  },
      { id: 'paracetamol',      label: 'Paracetamol (10 tabs)',        unit: 'Strip'   },
      { id: 'first-aid-kit',    label: 'First Aid Kit (standard)',     unit: 'Kit'     },
      { id: 'dettol',           label: 'Antiseptic Dettol (750 ml)',   unit: 'Bottle'  },
      { id: 'ors',              label: 'ORS Sachets (10-pack)',        unit: 'Pack'    },
      { id: 'mosquito-rep',     label: 'Mosquito Repellent (100 ml)', unit: 'Bottle'  },
      { id: 'diapers',          label: 'Diaper Packs (30 count)',      unit: 'Pack'    },
    ],
  },
]

// Build flat initial quantity map: { [itemId]: 0, ... }
const INITIAL_QTY = Object.fromEntries(
  CATALOGUE.flatMap((cat) => cat.items.map((item) => [item.id, 0]))
)

// ─── Drop-off locations ───────────────────────────────────────────────────────
const DROP_OFF_LOCATIONS = [
  'Colombo — Disaster Management Centre (DMC), Vidya Mawatha',
  'Gampaha — Divisional Secretariat, Gampaha',
  'Kandy — District Secretariat, Kandy',
  'Galle — Galle Municipal Council Relief Hub',
  'Matara — Matara District Secretariat',
  'Ratnapura — Ratnapura DMC Sub-Office',
  'Kurunegala — Kurunegala Divisional Secretariat',
  'Jaffna — Jaffna District Secretariat',
  'Trincomalee — Trinco District Relief Centre',
  'Anuradhapura — North-Central Relief Hub',
  'Batticaloa — Batticaloa District Secretariat',
  'Other (specify in notes)',
]

// ─── Impact stats ─────────────────────────────────────────────────────────────
const IMPACT_STATS = [
  { value: '128 Tons', label: 'Supplies Moved'  },
  { value: '34,200',   label: 'Food Kits Given' },
  { value: '12',       label: 'Rescue Boats'    },
  { value: '8,400',    label: 'Medical Packs'   },
  { value: '6',        label: 'Relief Camps'    },
]

// ─── Thumbnail images (Unsplash relief-themed, no auth required) ──────────────
const THUMBNAILS = [
  { src: 'https://images.unsplash.com/photo-1593113630400-ea4288922559?w=300&q=70', alt: 'Flood relief distribution' },
  { src: 'https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=300&q=70', alt: 'Aid volunteers'           },
  { src: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=300&q=70', alt: 'Displaced families'       },
  { src: 'https://images.unsplash.com/photo-1563281577-a7be47e20aa9?w=300&q=70', alt: 'Medical supplies'          },
  { src: 'https://images.unsplash.com/photo-1547623641-d2c56c03e2a7?w=300&q=70', alt: 'Emergency shelter'         },
]

// ─── Validation helpers ───────────────────────────────────────────────────────
const SL_PHONE_RE = /^\+94[0-9]{9}$/
const EMAIL_RE    = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validateDonorForm(donor, qty, additionalItems) {
  const errs = {}
  if (!donor.name.trim())                 errs.name     = 'Full name or company name is required.'
  if (!SL_PHONE_RE.test(donor.phone.trim()))
    errs.phone = 'Enter a valid Sri Lanka number: +94XXXXXXXXX (9 digits after +94).'
  if (!EMAIL_RE.test(donor.email.trim()))  errs.email    = 'Enter a valid email address.'
  if (!donor.dropOff)                      errs.dropOff  = 'Please select a drop-off location.'

  const totalItems = Object.values(qty).reduce((s, v) => s + v, 0)
  if (totalItems === 0 && !additionalItems.trim())
    errs.items = 'Add at least one catalogue item or describe additional items before submitting.'

  return errs
}

// ─── Small reusable sub-components ───────────────────────────────────────────

/** Quantity stepper: [-] [n] [+] */
function Stepper({ itemId, value, onChange }) {
  const dec = () => onChange(itemId, Math.max(0, value - 1))
  const inc = () => onChange(itemId, value + 1)

  return (
    <div className="flex items-center gap-0 rounded-lg overflow-hidden border border-slate-200 h-9 select-none">
      <button
        type="button"
        aria-label={`Decrease ${itemId}`}
        onClick={dec}
        disabled={value === 0}
        className="w-9 h-full flex items-center justify-center text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors font-bold text-lg"
      >
        −
      </button>
      <span
        className={`w-10 text-center text-sm font-bold tabular-nums ${value > 0 ? 'text-[#A50116]' : 'text-slate-400'}`}
        aria-live="polite"
      >
        {value}
      </span>
      <button
        type="button"
        aria-label={`Increase ${itemId}`}
        onClick={inc}
        className="w-9 h-full flex items-center justify-center hover:bg-red-50 hover:text-[#A50116] text-slate-500 transition-colors font-bold text-lg"
      >
        +
      </button>
    </div>
  )
}

/** Single item row inside a category */
function ItemRow({ item, qty, onChange }) {
  const active = qty > 0
  return (
    <div
      className={`flex items-center justify-between gap-3 px-4 py-3 rounded-xl border transition-all duration-150 ${
        active
          ? 'border-[#A50116] bg-[#fff8f9] shadow-sm'
          : 'border-slate-100 bg-white hover:border-slate-200'
      }`}
    >
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium leading-tight ${active ? 'text-[#A50116]' : 'text-slate-700'}`}>
          {item.label}
        </p>
        <p className="text-xs text-slate-400 mt-0.5">per {item.unit}</p>
      </div>
      <Stepper itemId={item.id} value={qty} onChange={onChange} />
    </div>
  )
}

/** Category section card */
function CategoryCard({ cat, qty, onChange }) {
  const subtotal = cat.items.reduce((s, it) => s + qty[it.id], 0)
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Card header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-slate-800 text-base">{cat.title}</h3>
        </div>
        {subtotal > 0 && (
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#A50116] text-white">
            {subtotal} item{subtotal !== 1 ? 's' : ''}
          </span>
        )}
      </div>
      {/* Items list */}
      <div className="p-4 flex flex-col gap-2">
        {cat.items.map((item) => (
          <ItemRow
            key={item.id}
            item={item}
            qty={qty[item.id]}
            onChange={onChange}
          />
        ))}
      </div>
    </div>
  )
}

/** Labelled form field wrapper */
function Field({ label, required, error, children, hint }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-semibold text-slate-700">
        {label}
        {required && <span className="text-[#A50116] ml-0.5" aria-hidden>*</span>}
      </label>
      {hint && <p className="text-xs text-slate-400 -mt-0.5">{hint}</p>}
      {children}
      {error && (
        <p className="text-xs text-red-600 mt-0.5">{error}</p>
      )}
    </div>
  )
}

/** Styled text/email/tel input */
function TextInput({ id, type = 'text', placeholder, value, onChange, hasError }) {
  return (
    <input
      id={id}
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className={`w-full border rounded-lg px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition-all ${
        hasError
          ? 'border-red-400 bg-red-50 focus:border-red-500 focus:ring-2 focus:ring-red-200'
          : 'border-slate-300 focus:border-[#A50116] focus:ring-2 focus:ring-red-100'
      }`}
    />
  )
}

/** Toast / error alert banner */
function ErrorToast({ message, onClose }) {
  if (!message) return null
  return (
    <div
      role="alert"
      className="flex items-start gap-3 bg-red-50 border border-red-300 text-red-700 rounded-xl px-4 py-3 text-sm font-medium"
    >
      <span className="flex-1">{message}</span>
      <button
        type="button"
        onClick={onClose}
        aria-label="Dismiss"
        className="ml-auto text-red-400 hover:text-red-600 font-bold text-base leading-none"
      >
        x
      </button>
    </div>
  )
}

/** Success banner shown after 200 OK */
function SuccessBanner({ name, onReset }) {
  return (
    <div className="max-w-2xl mx-auto px-4 py-20 flex flex-col items-center text-center gap-6">
      <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center shadow-inner">
        <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Donation Registered!</h2>
        <p className="text-slate-500 text-base">
          Thank you{name ? `, ${name}` : ''}. Your physical consignment has been logged and a
          coordinator will contact you shortly about drop-off arrangements.
        </p>
      </div>
      {/* Emergency reminder */}
      <div className="w-full bg-[#fff0f2] border border-red-200 rounded-xl p-4 text-left">
        <p className="text-xs font-bold text-[#A50116] uppercase tracking-wider mb-2">Emergency Hotlines</p>
        <div className="grid grid-cols-2 gap-1">
          {[['117', 'Disaster Management'], ['1990', 'Suwaseriya Ambulance'], ['110', 'Fire & Rescue'], ['119', 'Police Emergency']].map(
            ([num, label]) => (
              <a key={num} href={`tel:${num}`} className="text-sm text-slate-700 hover:text-[#A50116] transition-colors">
                <strong>{num}</strong> — {label}
              </a>
            )
          )}
        </div>
      </div>
      <div className="flex flex-wrap gap-3 justify-center">
        <button
          type="button"
          onClick={onReset}
          className="px-5 py-2.5 rounded-xl border-2 border-[#A50116] text-[#A50116] font-semibold text-sm hover:bg-[#fff0f2] transition-colors"
        >
          Submit Another Donation
        </button>
        <Link
          to="/donations"
          className="px-5 py-2.5 rounded-xl font-semibold text-sm text-white transition-all shadow"
          style={{ background: RED }}
          onMouseEnter={(e) => (e.currentTarget.style.background = RED_DARK)}
          onMouseLeave={(e) => (e.currentTarget.style.background = RED)}
        >
          View Live Donation Listings
        </Link>
      </div>
    </div>
  )
}

// ─── Main page component ──────────────────────────────────────────────────────
export default function DonateForm() {
  const navigate = useNavigate()

  // ── Quantity state ──────────────────────────────────────────────────────────
  const [qty, setQty] = useState(INITIAL_QTY)

  const handleQtyChange = useCallback((itemId, newVal) => {
    setQty((prev) => ({ ...prev, [itemId]: newVal }))
  }, [])

  // Additional free-text items
  const [additionalItems, setAdditionalItems] = useState('')

  // Derived total across all items
  const totalItems = useMemo(() => Object.values(qty).reduce((s, v) => s + v, 0), [qty])

  // ── Donor form state ────────────────────────────────────────────────────────
  const [donor, setDonor] = useState({
    name:      '',
    phone:     '+94',
    email:     '',
    anonymous: false,
    dropOff:   '',
    notes:     '',
  })

  const handleAdditionalItems = (e) => {
    setAdditionalItems(e.target.value)
    if (fieldErrors.items) setFieldErrors((prev) => ({ ...prev, items: undefined }))
  }

  const setField = (field) => (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setDonor((prev) => ({ ...prev, [field]: val }))
    // Clear that field's error on change
    if (fieldErrors[field]) setFieldErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  // ── Validation / submission state ───────────────────────────────────────────
  const [fieldErrors, setFieldErrors] = useState({})
  const [toastMsg,    setToastMsg]    = useState('')
  const [loading,     setLoading]     = useState(false)
  const [success,     setSuccess]     = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setToastMsg('')

    const errs = validateDonorForm(donor, qty, additionalItems)
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs)
      if (errs.items) setToastMsg(errs.items)
      const el = document.querySelector('[data-error-anchor]')
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    setFieldErrors({})

    // Build payload
    const payload = {
      donor: {
        name:      donor.anonymous ? 'Anonymous' : donor.name.trim(),
        phone:     donor.phone.trim(),
        email:     donor.email.trim(),
        anonymous: donor.anonymous,
        dropOff:   donor.dropOff,
        notes:     donor.notes.trim(),
      },
      items: Object.entries(qty)
        .filter(([, v]) => v > 0)
        .map(([id, quantity]) => ({ itemId: id, quantity })),
      additionalItems: additionalItems.trim(),
      totalUnits: totalItems,
      submittedAt: new Date().toISOString(),
    }

    setLoading(true)
    try {
      const res = await fetch('http://localhost:5000/api/donations', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.message || `Server error: ${res.status}`)
      }

      setSuccess(true)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      setToastMsg(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setQty(INITIAL_QTY)
    setAdditionalItems('')
    setDonor({ name: '', phone: '+94', email: '', anonymous: false, dropOff: '', notes: '' })
    setFieldErrors({})
    setToastMsg('')
    setSuccess(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // ─── Success screen ─────────────────────────────────────────────────────────
  if (success) {
    return <SuccessBanner name={donor.anonymous ? '' : donor.name} onReset={handleReset} />
  }

  // ─── Main render ────────────────────────────────────────────────────────────
  return (
    <div className="bg-slate-50 min-h-screen">

      {/* ── HERO SECTION ── */}
      <section style={{ background: `linear-gradient(135deg, ${RED} 0%, #7a0110 100%)` }} className="text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-10">

          {/* Back link */}
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-red-200 hover:text-white text-sm font-medium transition-colors mb-8"
          >
            ← Back to Relief Hub
          </Link>

          {/* Hero copy */}
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-8">
            <div>
              <span className="inline-block bg-white/20 backdrop-blur text-white text-xs font-bold px-3 py-1 rounded-full mb-3 uppercase tracking-widest">
                Physical Aid Donation
              </span>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight mb-3">
                Donate &amp; Support<br />
                <span className="text-red-200">Sri Lanka</span>
              </h1>
              <p className="text-red-100 text-base max-w-xl leading-relaxed">
                Build a physical consignment of essential supplies and arrange drop-off
                at a certified relief hub. Every item you contribute reaches a family in need.
              </p>
            </div>
            <Link
              to="/donations"
              className="shrink-0 inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 border border-white/30 text-white font-semibold text-sm px-5 py-2.5 rounded-xl backdrop-blur transition-all"
            >
              Live Donation Listings
            </Link>
          </div>

          {/* Impact stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {IMPACT_STATS.map(({ value, label }) => (
              <div
                key={label}
                className="bg-white/15 backdrop-blur border border-white/20 rounded-xl px-4 py-3 text-center"
              >
                <div className="text-xl font-extrabold text-white leading-none">{value}</div>
                <div className="text-red-200 text-xs mt-0.5 font-medium">{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Thumbnail strip */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
          <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none">
            {THUMBNAILS.map(({ src, alt }) => (
              <img
                key={src}
                src={src}
                alt={alt}
                className="h-20 w-32 object-cover rounded-xl flex-shrink-0 border-2 border-white/30 shadow-lg"
                loading="lazy"
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── PAGE BODY ── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <form onSubmit={handleSubmit} noValidate>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* ─────────────────────────────────────────────────────────────────
                LEFT COLUMN (2/3): Consignment builder
            ───────────────────────────────────────────────────────────────── */}
            <div className="lg:col-span-2 flex flex-col gap-6">

              {/* Section heading */}
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 mb-0.5">
                  Build Your Consignment
                </h2>
                <p className="text-sm text-slate-500">
                  Use the + / - controls to set quantities. Items you add will appear in the summary.
                </p>
                {/* Items-level error anchor */}
                {fieldErrors.items && (
                  <div data-error-anchor className="mt-3">
                    <ErrorToast message={fieldErrors.items} onClose={() => setFieldErrors((p) => ({ ...p, items: undefined }))} />
                  </div>
                )}
              </div>

              {/* Category cards */}
              {CATALOGUE.map((cat) => (
                <CategoryCard
                  key={cat.id}
                  cat={cat}
                  qty={qty}
                  onChange={handleQtyChange}
                />
              ))}

              {/* Additional Items free-text */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50">
                  <h3 className="font-bold text-slate-800 text-base">Additional Items</h3>
                  <span className="text-xs text-slate-400 font-medium">Optional</span>
                </div>
                <div className="p-4">
                  <p className="text-xs text-slate-500 mb-2">
                    List any supplies not covered by the categories above (one item per line or comma-separated).
                  </p>
                  <textarea
                    id="additional-items"
                    rows={4}
                    placeholder={`e.g.\nWheelchair (1)\nBlankets (10)\nGenerator fuel (20L)`}
                    value={additionalItems}
                    onChange={handleAdditionalItems}
                    className="w-full border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none resize-none focus:border-[#A50116] focus:ring-2 focus:ring-red-100 transition-all font-mono"
                  />
                </div>
              </div>
            </div>

            {/* ─────────────────────────────────────────────────────────────────
                RIGHT COLUMN (1/3): Donor info + summary + submit
            ───────────────────────────────────────────────────────────────── */}
            <div className="flex flex-col gap-6">

              {/* ── Consignment Summary card ── */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden sticky top-20">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="font-bold text-slate-800">Consignment Summary</h3>
                  {totalItems > 0 && (
                    <span
                      className="text-xs font-bold px-2.5 py-1 rounded-full text-white"
                      style={{ background: RED }}
                    >
                      {totalItems} unit{totalItems !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>

                <div className="p-5 flex flex-col gap-5">
                  {/* Catalogue item breakdown */}
                  {totalItems === 0 && !additionalItems.trim() ? (
                    <p className="text-sm text-slate-400 text-center py-4">
                      No items added yet.<br />Use the + buttons to the left or describe additional items.
                    </p>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {totalItems > 0 && (
                        <ul className="flex flex-col gap-1.5 max-h-40 overflow-y-auto pr-1">
                          {CATALOGUE.flatMap((cat) =>
                            cat.items
                              .filter((it) => qty[it.id] > 0)
                              .map((it) => (
                                <li key={it.id} className="flex items-center justify-between text-sm">
                                  <span className="text-slate-600 truncate mr-2">{it.label}</span>
                                  <span className="font-bold text-[#A50116] shrink-0">x {qty[it.id]}</span>
                                </li>
                              ))
                          )}
                        </ul>
                      )}
                      {additionalItems.trim() && (
                        <div className="border-t border-slate-100 pt-2">
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Additional Items</p>
                          <p className="text-sm text-slate-700 whitespace-pre-wrap break-words">{additionalItems.trim()}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── Donor Information ── */}
                  <div className="border-t border-slate-100 pt-5 flex flex-col gap-4">
                    <h3 className="font-bold text-slate-800 text-sm">Donor Information</h3>

                    <Field label="Full Name / Company" required error={fieldErrors.name}>
                      <TextInput
                        id="donor-name"
                        placeholder="e.g. Nimal Perera / Perera & Sons"
                        value={donor.name}
                        onChange={setField('name')}
                        hasError={!!fieldErrors.name}
                      />
                    </Field>

                    <Field
                      label="Phone Number"
                      required
                      error={fieldErrors.phone}
                      hint="Sri Lanka format: +94XXXXXXXXX"
                    >
                      <TextInput
                        id="donor-phone"
                        type="tel"
                        placeholder="+94771234567"
                        value={donor.phone}
                        onChange={setField('phone')}
                        hasError={!!fieldErrors.phone}
                      />
                    </Field>

                    <Field label="Email Address" required error={fieldErrors.email}>
                      <TextInput
                        id="donor-email"
                        type="email"
                        placeholder="you@example.com"
                        value={donor.email}
                        onChange={setField('email')}
                        hasError={!!fieldErrors.email}
                      />
                    </Field>

                    {/* Anonymous checkbox */}
                    <label
                      htmlFor="donor-anon"
                      className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all text-sm ${
                        donor.anonymous
                          ? 'border-[#A50116] bg-[#fff8f9] text-[#A50116] font-medium'
                          : 'border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <input
                        id="donor-anon"
                        type="checkbox"
                        className="accent-[#A50116] w-4 h-4 shrink-0"
                        checked={donor.anonymous}
                        onChange={setField('anonymous')}
                      />
                      Keep my donation anonymous
                    </label>

                    {/* Drop-off location */}
                    <Field label="Drop-off Location" required error={fieldErrors.dropOff}>
                      <select
                        id="donor-dropoff"
                        value={donor.dropOff}
                        onChange={setField('dropOff')}
                        className={`w-full border rounded-lg px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all bg-white ${
                          fieldErrors.dropOff
                            ? 'border-red-400 bg-red-50 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                            : 'border-slate-300 focus:border-[#A50116] focus:ring-2 focus:ring-red-100'
                        }`}
                      >
                        <option value="">Select nearest hub…</option>
                        {DROP_OFF_LOCATIONS.map((loc) => (
                          <option key={loc} value={loc}>{loc}</option>
                        ))}
                      </select>
                    </Field>

                    {/* Optional notes */}
                    <Field label="Additional Notes" hint="Optional">
                      <textarea
                        id="donor-notes"
                        rows={3}
                        placeholder="Any special instructions for collection or delivery…"
                        value={donor.notes}
                        onChange={setField('notes')}
                        className="w-full border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none resize-none focus:border-[#A50116] focus:ring-2 focus:ring-red-100 transition-all"
                      />
                    </Field>
                  </div>

                  {/* Toast / network error */}
                  {toastMsg && (
                    <ErrorToast message={toastMsg} onClose={() => setToastMsg('')} />
                  )}

                  {/* Submit button */}
                  <button
                    id="donate-submit-btn"
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-white text-base transition-all shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
                    style={{ background: loading ? '#999' : RED }}
                    onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = RED_DARK }}
                    onMouseLeave={(e) => { if (!loading) e.currentTarget.style.background = RED }}
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                        </svg>
                        Submitting…
                      </>
                    ) : (
                      <>Register Donation</>
                    )}
                  </button>

                  {/* Quick link to listings */}
                  <Link
                    to="/donations"
                    className="block text-center text-xs text-slate-400 hover:text-[#A50116] transition-colors"
                  >
                    View existing donation listings
                  </Link>

                  {/* Disclaimer */}
                  <p className="text-[11px] text-slate-400 text-center leading-relaxed">
                    By submitting you confirm all information is accurate.
                    Misuse of relief channels is a punishable offence under Sri Lankan law.
                  </p>
                </div>
              </div>
              {/* /sticky card */}

            </div>
            {/* /right column */}

          </div>
        </form>
      </div>
    </div>
  )
}
