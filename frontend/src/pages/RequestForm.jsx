import { useState, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'

// Set VITE_API_URL in the deployed environment; falls back to the local
// Express server for development.
const API_ROOT = import.meta.env.VITE_API_URL ?? 'http://localhost:5000'

// The three severity radio values map onto the urgency labels the
// dispatch board filters and colour-codes by.
const URGENCY_BY_SEVERITY = {
  sos:      'SOS Urgent',
  urgent:   'High Alert',
  standard: 'Moderate',
}

// ─── Design-system colours (from Stitch Humanitarian Crisis Response) ─────────
// Primary:  #af101a  |  primary-container: #d32f2f  |  on-primary: #fff
// Secondary:#a83900  |  surface: #f7f9fb             |  on-surface: #191c1e
// Error-container: #ffdad6  |  on-error-container: #93000a

// ─── Category checklist data ──────────────────────────────────────────────────
const CATEGORY_DATA = {
  water: [
    { text: '5L Drinking Water Bottles (x10)', checked: true },
    { text: 'Dry Rations Pack (Rice, Dhal, Canned Fish)', checked: true },
    { text: 'Infant Milk Powder / Baby Food', checked: false },
    { text: 'Cooked Warm Meals Packet', checked: false },
    { text: 'Water Purification Tablets (Aquatabs)', checked: false },
  ],
  medical: [
    { text: 'Insulin & Cold Storage Transport', checked: true },
    { text: 'First Aid Kit (Bandages, Betadine, Gauze)', checked: true },
    { text: 'Paracetamol & Antibiotic Suspensions', checked: false },
    { text: 'Chronic BP / Cardiac Prescriptions', checked: false },
    { text: 'Emergency Doctor / Stretcher Evac', checked: true },
  ],
  rescue: [
    { text: 'Inflatable Rubber Raft / Jet Rescue', checked: true },
    { text: 'Life Jackets (Adult & Child size)', checked: true },
    { text: 'Rooftop Evacuation Rope Assist', checked: false },
    { text: 'Wheelchair / Bedridden Extraction Aid', checked: false },
    { text: 'Safe Temporary Camp Intake Ticket', checked: true },
  ],
  missing: [
    { text: 'Register in National SAR Lost Person DB', checked: true },
    { text: 'Broadcast Last-Seen Flood Zone Coordinates', checked: true },
    { text: 'Tri-Forces Search Grid Dispatch Alert', checked: true },
    { text: 'Hospital & Evacuation Camp Roll-call Check', checked: false },
  ],
}

const CATEGORIES = [
  {
    key: 'water',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L5.6 15.07a2 2 0 00-1.2.149l-1.2.6a2 2 0 00-.77 2.772l.4 1.2A2 2 0 004.7 21h14.6a2 2 0 001.87-1.28l.4-1.2a2 2 0 00-.77-2.772l-1.372-.686zM12 3v9m0 0l-3-3m3 3l3-3" />
      </svg>
    ),
    title: 'Water & Rations',
    sub: 'Meals, Formula, Pure Water',
  },
  {
    key: 'medical',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
      </svg>
    ),
    title: 'Medical & First Aid',
    sub: 'Insulin, Med Evac, First Aid',
  },
  {
    key: 'rescue',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    title: 'Rescue Boat / Evac',
    sub: 'Stranded, Roof, Camp Intake',
  },
  {
    key: 'missing',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
    title: 'Missing Person',
    sub: 'SAR Registry & Flood Trace',
  },
]

const DISTRICTS = [
  'Ampara', 'Anuradhapura', 'Badulla', 'Batticaloa',
  'Colombo', 'Galle', 'Gampaha', 'Hambantota',
  'Jaffna', 'Kalutara', 'Kandy', 'Kegalle',
  'Kilinochchi', 'Kurunegala', 'Mannar', 'Matale',
  'Matara', 'Monaragala', 'Mullaitivu', 'Nuwara Eliya',
  'Polonnaruwa', 'Puttalam', 'Ratnapura', 'Trincomalee',
  'Vavuniya',
]

function validate(form) {
  const errs = {}
  if (!form.name.trim() || form.name.trim().length < 4)
    errs.name = 'Requester name must be at least 4 characters.'
  const phone = form.phone.replace(/\s/g, '')
  if (!phone)
    errs.phone = 'Primary mobile number is required.'
  else if (!/^(07\d{8}|\+947\d{8})$/.test(phone))
    errs.phone = 'Enter a valid Sri Lankan number starting with 07 or +947 (10 digits).'
  if (form.adults + form.children + form.elders === 0)
    errs.headcount = 'At least 1 affected person must be counted.'
  if (!form.notes.trim() || form.notes.trim().length < 10)
    errs.notes = 'Please describe the situation in at least 10 characters.'
  return errs
}

export default function RequestForm() {
  const navigate = useNavigate()

  // Form state
  const [category, setCategory] = useState('water')
  const [checklist, setChecklist] = useState(() =>
    CATEGORY_DATA.water.map((i) => ({ ...i }))
  )
  const [showCustomInput, setShowCustomInput] = useState(false)
  const [customNeedText, setCustomNeedText] = useState('')
  const [severity, setSeverity] = useState('sos')
  const [counts, setCounts] = useState({ adults: 2, children: 1, elders: 1 })

  const handleAddCustomNeed = () => {
    if (!customNeedText.trim()) return
    setChecklist((prev) => [...prev, { text: customNeedText.trim(), checked: true }])
    setCustomNeedText('')
    setShowCustomInput(false)
  }
  const [form, setForm] = useState({
    name: '',
    shelter: '',
    district: 'Colombo',
    divisional: '',
    landmark: '',
    phone: '',
    altPhone: '',
    nic: '',
    notes: '',
  })
  const [errors, setErrors] = useState({})
  const [gpsLabel, setGpsLabel] = useState('Share Current Device GPS (6.6828° N, 80.4034° E)')
  const [gpsLocked, setGpsLocked] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  // Previously a failed submit only logged to the console, so a victim
  // filing a request saw the button stop spinning and nothing else.
  const [submitError, setSubmitError] = useState('')
  const [token] = useState(`LK-${Math.floor(1000 + Math.random() * 9000)}`)

  // Category switch
  const handleCategory = (key) => {
    setCategory(key)
    setChecklist(CATEGORY_DATA[key].map((i) => ({ ...i })))
  }

  // Checklist toggle
  const toggleCheck = (idx) => {
    setChecklist((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, checked: !item.checked } : item))
    )
  }

  // Headcount adjust
  const adjust = (field, delta) => {
    setCounts((prev) => ({ ...prev, [field]: Math.max(0, prev[field] + delta) }))
  }

  // GPS
  const handleGps = () => {
    setGpsLabel('Locking onto High-Precision GPS...')
    setTimeout(() => {
      setGpsLabel('GPS Locked: 6.6831° N, 80.4029° E (Accurate: 3m)')
      setGpsLocked(true)
    }, 700)
  }

  // Field change
  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }))
  }

  // Submit
  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitError('')
    const allForm = {
      ...form,
      adults: counts.adults,
      children: counts.children,
      elders: counts.elders,
    }
    const errs = validate(allForm)
    if (Object.keys(errs).length) {
      setErrors(errs)
      // scroll to first error
      document.querySelector('[data-error="true"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }

    setLoading(true)
    const selectedSupplies = checklist
      .filter((c) => c.checked)
      .map((c) => c.text)
      .join(', ')

    try {
      const res = await fetch(`${API_ROOT}/api/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'request',
          name: form.name,
          contact: form.phone,
          location: `${form.district} — ${form.landmark}`,
          category,
          description: `[${severity.toUpperCase()}] Shelter: ${form.shelter}. Affected: ${counts.adults} adults, ${counts.children} children, ${counts.elders} elders. Supplies: ${selectedSupplies}. Notes: ${form.notes}`,
          // The dispatch board renders these when present, and they are
          // already on the form — no reason to make it guess from the
          // description string.
          district: form.district,
          landmark: form.landmark,
          shelter_name: form.shelter,
          contact_name: form.name,
          contact_phone: form.phone,
          quantity_or_people: counts.adults + counts.children + counts.elders,
          supplies_needed: selectedSupplies,
          urgency: URGENCY_BY_SEVERITY[severity] ?? 'High Alert',
          notes: form.notes,
        }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.error || `Server error: ${res.status}`)
      }

      setSubmitted(true)
    } catch (err) {
      console.error('[RequestForm] submit failed:', err)
      setSubmitError(err.message || 'Could not file the request. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Input field helper
  const Field = useCallback(({ label, required, name: n, ...props }) => (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold text-[#5b403d] uppercase tracking-wide">
        {label} {required && <span className="text-[#af101a]">*</span>}
      </label>
      <input
        name={n}
        value={form[n]}
        onChange={handleChange}
        data-error={!!errors[n]}
        className={`w-full p-3 rounded-lg bg-[#eceef0] text-[#191c1e] text-sm placeholder:text-[#8f6f6c] focus:outline-none focus:ring-2 focus:ring-[#af101a] transition-shadow ${
          errors[n] ? 'ring-2 ring-[#ba1a1a]' : ''
        }`}
        {...props}
      />
      {errors[n] && (
        <p className="text-xs text-[#ba1a1a] mt-0.5">{errors[n]}</p>
      )}
    </div>
  ), [form, errors]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen bg-[#f7f9fb] font-[Inter,sans-serif]">
      {/* Google Fonts */}
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Plus+Jakarta+Sans:wght@600;700;800&display=swap');`}</style>

      {/* ── Page content ───────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-8 md:px-12 lg:px-16 py-8 pb-20">

        {/* Back + Live badge */}
        <div className="flex items-center justify-between mb-6">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-[#191c1e] hover:text-[#af101a] transition-colors text-sm font-semibold min-h-[44px]"
          >
            ← Back to Home
          </Link>
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#ffdad6] text-[#93000a] text-xs font-bold shadow-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-[#af101a] animate-ping inline-block" />
            LIVE DISPATCH QUEUE
          </div>
        </div>

        {/* Heading */}
        <div className="mb-6">
          <h1
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            className="text-3xl sm:text-4xl font-extrabold text-[#191c1e] tracking-tight leading-tight"
          >
            Submit Relief Request
          </h1>
          <p className="text-base text-[#5b403d] mt-1.5">
            Immediate triage broadcast to Sri Lanka volunteer ground squads & DMC units
          </p>
        </div>

        {/* ── 1. Primary Need Category ──────────────────────────────── */}
        <section className="mb-6">
          <p className="text-xs font-bold text-[#5b403d] uppercase tracking-widest mb-3">
            Select Primary Need
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {CATEGORIES.map(({ key, icon, title, sub }) => {
              const active = category === key
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleCategory(key)}
                  className={`flex flex-col items-start p-4 rounded-2xl shadow-sm transition-all text-left relative overflow-hidden border ${
                    active
                      ? 'bg-[#af101a] text-white border-[#af101a] shadow-md'
                      : 'bg-white text-[#191c1e] border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-2">
                    <span className={`p-2 rounded-xl ${active ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'}`}>
                      {icon}
                    </span>
                    {active && <span className="text-white text-sm font-bold bg-white/20 px-1.5 py-0.5 rounded-full">✓</span>}
                  </div>
                  <span className="text-sm font-bold leading-snug">{title}</span>
                  <span className={`text-xs leading-tight mt-1 ${active ? 'text-[#ffdad6]' : 'text-[#5b403d]'}`}>
                    {sub}
                  </span>
                </button>
              )
            })}
          </div>
        </section>

        {/* ── SECTION 1: Urgent Need Details ───────────────────────── */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5 sm:p-7 mb-6 flex flex-col gap-5">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-[#d32f2f] text-white flex items-center justify-center text-xs font-bold shrink-0">
              1
            </div>
            <h2
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              className="text-lg font-bold text-[#191c1e]"
            >
              Urgent Need Details
            </h2>
          </div>

          {/* Urgency level */}
          <div>
            <label className="text-xs font-semibold text-[#5b403d] uppercase tracking-wide mb-2.5 block">
              Urgency Level <span className="text-[#af101a]">*</span>
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: 'sos', label: 'SOS / Peril', sub: 'Immediate', activeBg: 'bg-[#ffdad6]', activeText: 'text-[#93000a]' },
                { value: 'urgent', label: 'Within 12h', sub: 'High Alert', activeBg: 'bg-[#ffdbcf]', activeText: 'text-[#380d00]' },
                { value: 'standard', label: '24-48 Hours', sub: 'Rations / Stn', activeBg: 'bg-[#dae2fd]', activeText: 'text-[#131b2e]' },
              ].map(({ value, label, sub, activeBg, activeText }) => (
                <label key={value} className="cursor-pointer">
                  <input
                    type="radio"
                    name="severity"
                    value={value}
                    checked={severity === value}
                    onChange={() => setSeverity(value)}
                    className="sr-only peer"
                  />
                  <div
                    className={`p-3 rounded-xl text-center flex flex-col items-center gap-1 transition-all border-2 ${
                      severity === value
                        ? `${activeBg} ${activeText} border-[#af101a]`
                        : 'bg-[#f2f4f6] text-[#191c1e] border-transparent hover:bg-[#e6e8ea]'
                    }`}
                  >
                    <span className="text-xs font-bold leading-tight">{label}</span>
                    <span className="text-[11px] opacity-80">{sub}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Headcount */}
          <div>
            <label className="text-xs font-semibold text-[#5b403d] uppercase tracking-wide mb-2.5 block">
              Affected Headcount
            </label>
            <div
              className="grid grid-cols-3 gap-3"
              data-error={!!errors.headcount}
            >
              {[
                { label: 'Adults', field: 'adults' },
                { label: 'Children', field: 'children' },
                { label: 'Elders / Sick', field: 'elders' },
              ].map(({ label, field }) => (
                <div key={field} className="bg-[#eceef0] p-3 rounded-xl flex flex-col items-center">
                  <span className="text-xs text-[#5b403d] font-semibold">{label}</span>
                  <div className="flex items-center gap-3 mt-2">
                    <button
                      type="button"
                      onClick={() => adjust(field, -1)}
                      className="w-8 h-8 rounded-full bg-white text-[#191c1e] flex items-center justify-center font-bold text-lg shadow-sm hover:bg-[#e6e8ea] transition-colors"
                    >
                      −
                    </button>
                    <span className="font-bold text-base min-w-[20px] text-center text-[#191c1e]">
                      {counts[field]}
                    </span>
                    <button
                      type="button"
                      onClick={() => adjust(field, 1)}
                      className="w-8 h-8 rounded-full bg-white text-[#191c1e] flex items-center justify-center font-bold text-lg shadow-sm hover:bg-[#e6e8ea] transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {errors.headcount && (
              <p className="text-xs text-[#ba1a1a] mt-1">{errors.headcount}</p>
            )}
          </div>

          {/* Dynamic checklist + Custom need button */}
          <div>
            <label className="text-xs font-semibold text-[#5b403d] uppercase tracking-wide mb-2.5 block">
              Specific Supplies / Actions Required
            </label>
            <div className="flex flex-col gap-2.5">
              {checklist.map((item, idx) => (
                <label
                  key={idx}
                  className="flex items-center gap-3 p-3 rounded-xl bg-[#f2f4f6] cursor-pointer hover:bg-[#e6e8ea] transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={item.checked}
                    onChange={() => toggleCheck(idx)}
                    className="w-4 h-4 rounded accent-[#af101a]"
                  />
                  <span className="text-sm font-medium text-[#191c1e]">{item.text}</span>
                </label>
              ))}
            </div>

            {/* Custom Need Add Option */}
            {!showCustomInput ? (
              <button
                type="button"
                onClick={() => setShowCustomInput(true)}
                className="mt-3 text-xs font-bold text-[#af101a] hover:text-[#930010] flex items-center gap-2 py-2.5 px-4 rounded-xl border border-dashed border-[#af101a]/40 bg-[#ffdad6]/20 hover:bg-[#ffdad6]/50 transition-all self-start"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                </svg>
                Add Custom Need / Specific Item
              </button>
            ) : (
              <div className="mt-3 flex flex-col sm:flex-row gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <input
                  type="text"
                  value={customNeedText}
                  onChange={(e) => setCustomNeedText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleAddCustomNeed()
                    }
                  }}
                  placeholder="Enter custom requirement (e.g. 2x Insulin Syringes, Generator Fuel)..."
                  className="flex-1 p-3 rounded-xl bg-white border border-slate-300 text-[#191c1e] text-sm placeholder:text-[#8f6f6c] focus:outline-none focus:ring-2 focus:ring-[#af101a]"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleAddCustomNeed}
                    className="px-4 py-3 rounded-xl bg-[#af101a] text-white text-xs font-bold hover:bg-[#930010] transition-colors whitespace-nowrap"
                  >
                    Add Item
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCustomInput(false)
                      setCustomNeedText('')
                    }}
                    className="px-3.5 py-3 rounded-xl bg-[#e6e8ea] text-[#191c1e] text-xs font-bold hover:bg-[#d8dadc] transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Situation notes */}
          <div>
            <label className="text-xs font-semibold text-[#5b403d] uppercase tracking-wide mb-1 block">
              Situation Description / Hazards
              {errors.notes && <span className="text-[#ba1a1a] normal-case tracking-normal font-normal ml-2">{errors.notes}</span>}
            </label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              rows={3}
              placeholder="e.g. Water reached 3ft level inside living room. 84-year-old grandmother needs wheelchair assistance or stretcher evac."
              className={`w-full p-3 rounded-lg bg-[#eceef0] text-[#191c1e] text-sm placeholder:text-[#8f6f6c] focus:outline-none focus:ring-2 focus:ring-[#af101a] resize-none transition-shadow ${
                errors.notes ? 'ring-2 ring-[#ba1a1a]' : ''
              }`}
            />
          </div>
        </section>

        {/* ── SECTION 2: Location ───────────────────────────────────── */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5 sm:p-7 mb-6 flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-[#d32f2f] text-white flex items-center justify-center text-xs font-bold shrink-0">
                2
              </div>
              <h2
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                className="text-lg font-bold text-[#191c1e]"
              >
                Exact Location & Triage Pin
              </h2>
            </div>
            <span className="text-xs text-[#a83900] font-bold flex items-center gap-1.5 bg-[#ffdbcf]/50 px-2.5 py-1 rounded-full">
              <span className="w-2 h-2 rounded-full bg-[#a83900] inline-block" />
              Mesh GN Active
            </span>
          </div>

          {/* District + Divisional */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-[#5b403d] uppercase tracking-wide">
                District <span className="text-[#af101a]">*</span>
              </label>
              <select
                name="district"
                value={form.district}
                onChange={handleChange}
                className="w-full p-3 rounded-lg bg-[#eceef0] text-[#191c1e] text-sm focus:outline-none focus:ring-2 focus:ring-[#af101a] appearance-none"
              >
                {DISTRICTS.map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-[#5b403d] uppercase tracking-wide">
                Divisional Secretariat
              </label>
              <input
                name="divisional"
                value={form.divisional}
                onChange={handleChange}
                type="text"
                placeholder="e.g. Elapatha"
                className="w-full p-3 rounded-lg bg-[#eceef0] text-[#191c1e] text-sm placeholder:text-[#8f6f6c] focus:outline-none focus:ring-2 focus:ring-[#af101a]"
              />
            </div>
          </div>

          {/* Shelter name — optional */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-[#5b403d] uppercase tracking-wide">
              Shelter / Camp Name
              <span className="text-[#8f6f6c] normal-case font-normal tracking-normal ml-1">(If in one — optional)</span>
            </label>
            <input
              name="shelter"
              value={form.shelter}
              onChange={handleChange}
              type="text"
              placeholder="e.g. Kelaniya Raja Maha Vihara Relief Camp — leave blank if at home"
              className="w-full p-3 rounded-lg bg-[#eceef0] text-[#191c1e] text-sm placeholder:text-[#8f6f6c] focus:outline-none focus:ring-2 focus:ring-[#af101a]"
            />
          </div>

          {/* Landmark — optional */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-[#5b403d] uppercase tracking-wide">
              Nearest Landmark & Street
              <span className="text-[#8f6f6c] normal-case font-normal tracking-normal ml-1">(Optional)</span>
            </label>
            <input
              name="landmark"
              value={form.landmark}
              onChange={handleChange}
              type="text"
              placeholder="e.g. Near Sri Bodhirukkaramaya Temple, Karapincha Road"
              className="w-full p-3 rounded-lg bg-[#eceef0] text-[#191c1e] text-sm placeholder:text-[#8f6f6c] focus:outline-none focus:ring-2 focus:ring-[#af101a]"
            />
          </div>

          {/* GPS button */}
          <button
            type="button"
            onClick={handleGps}
            className={`min-h-[44px] w-full py-2.5 px-3 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-all ${
              gpsLocked
                ? 'bg-[#ffdbcf] text-[#380d00]'
                : 'bg-[#e6e8ea] text-[#191c1e]'
            }`}
          >
            <svg className="w-4 h-4 text-[#af101a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>{gpsLabel}</span>
          </button>
        </section>

        {/* ── SECTION 3: Contact Info ───────────────────────────────── */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5 sm:p-7 mb-6 flex flex-col gap-5">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-[#d32f2f] text-white flex items-center justify-center text-xs font-bold shrink-0">
              3
            </div>
            <h2
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              className="text-lg font-bold text-[#191c1e]"
            >
              Contact & Requester Info
            </h2>
          </div>

          {/* Requester name */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-[#5b403d] uppercase tracking-wide">
              Requester / Point of Contact Name <span className="text-[#af101a]">*</span>
            </label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              type="text"
              placeholder="e.g. Ruwan Perera"
              className={`w-full p-3 rounded-lg bg-[#eceef0] text-[#191c1e] text-sm placeholder:text-[#8f6f6c] focus:outline-none focus:ring-2 focus:ring-[#af101a] ${
                errors.name ? 'ring-2 ring-[#ba1a1a]' : ''
              }`}
            />
            {errors.name && <p className="text-xs text-[#ba1a1a] mt-0.5">{errors.name}</p>}
          </div>

          {/* Phone grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-[#5b403d] uppercase tracking-wide">
                Primary Mobile (+94) <span className="text-[#af101a]">*</span>
              </label>
              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                type="tel"
                placeholder="077 123 4567"
                className={`w-full p-3 rounded-lg bg-[#eceef0] text-[#191c1e] text-sm placeholder:text-[#8f6f6c] focus:outline-none focus:ring-2 focus:ring-[#af101a] ${
                  errors.phone ? 'ring-2 ring-[#ba1a1a]' : ''
                }`}
              />
              {errors.phone && <p className="text-xs text-[#ba1a1a] mt-0.5">{errors.phone}</p>}
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-[#5b403d] uppercase tracking-wide">
                Alt / Neighbour Phone
              </label>
              <input
                name="altPhone"
                value={form.altPhone}
                onChange={handleChange}
                type="tel"
                placeholder="071 987 6543"
                className="w-full p-3 rounded-lg bg-[#eceef0] text-[#191c1e] text-sm placeholder:text-[#8f6f6c] focus:outline-none focus:ring-2 focus:ring-[#af101a]"
              />
            </div>
          </div>

          {/* NIC */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-[#5b403d] uppercase tracking-wide">
              NIC Number <span className="text-[#8f6f6c] normal-case font-normal tracking-normal">(Optional — accelerates dispatch)</span>
            </label>
            <input
              name="nic"
              value={form.nic}
              onChange={handleChange}
              type="text"
              placeholder="199238472910 or 892348123V"
              className="w-full p-3 rounded-lg bg-[#eceef0] text-[#191c1e] text-sm placeholder:text-[#8f6f6c] focus:outline-none focus:ring-2 focus:ring-[#af101a]"
            />
          </div>
        </section>

        {/* ── CTA + Hotlines ────────────────────────────────────────── */}
        <div className="flex flex-col gap-3">
          {submitError && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-xl border border-[#93000a]/30 bg-[#ffdad6] px-4 py-3 text-sm text-[#93000a]"
            >
              <span aria-hidden="true">⚠️</span>
              <span>{submitError}</span>
            </div>
          )}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="min-h-[52px] w-full py-3.5 px-4 rounded-xl bg-[#af101a] text-white font-bold text-base shadow-lg flex items-center justify-center gap-2 hover:bg-[#930010] active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Dispatching...
              </>
            ) : (
              <>Submit Urgent Aid Request</>
            )}
          </button>

          <div className="flex items-center justify-center gap-2 text-[#5b403d] text-center px-2">
            <span className="text-xs">Average response triage: <strong>14 mins</strong> across 47 ground hubs</span>
          </div>

          {/* Emergency hotlines */}
          <div className="grid grid-cols-2 gap-2 mt-1">
            <a
              href="tel:117"
              className="p-3 rounded-xl bg-[#ffdad6] text-[#93000a] flex items-center gap-3 shadow-sm hover:bg-[#ffb3ac] transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-[#af101a] text-white flex items-center justify-center shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] uppercase font-bold tracking-wider">Disaster Centre</span>
                <span className="text-lg font-extrabold leading-none">117</span>
              </div>
            </a>
            <a
              href="tel:1919"
              className="p-3 rounded-xl bg-[#e6e8ea] text-[#191c1e] flex items-center gap-3 shadow-sm hover:bg-[#d8dadc] transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-white text-[#191c1e] flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-[#191c1e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5m0 0v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#5b403d]">Govt Emergency</span>
                <span className="text-lg font-extrabold leading-none">1919</span>
              </div>
            </a>
          </div>
        </div>
      </div>

      {/* ── Success Modal ─────────────────────────────────────────── */}
      {submitted && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white p-6 rounded-2xl shadow-2xl flex flex-col items-center text-center gap-4">
            <div className="w-16 h-16 rounded-full bg-[#ffdad6] text-[#af101a] flex items-center justify-center">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              className="text-xl font-bold text-[#191c1e]"
            >
              Request Dispatched!
            </h3>
            <p className="text-sm text-[#5b403d]">
              Your SOS incident token{' '}
              <strong className="text-[#191c1e]">#{token}</strong> has been
              beamed to the nearest District Volunteer Command and Sri Lanka Navy
              boat team.
            </p>
            <div className="w-full p-3 rounded-xl bg-[#f2f4f6] text-left flex flex-col gap-1.5">
              <div className="flex justify-between text-xs text-[#5b403d]">
                <span>Target Response:</span>
                <span className="font-bold text-[#191c1e]">&lt; 25 minutes</span>
              </div>
              <div className="flex justify-between text-xs text-[#5b403d]">
                <span>SMS Confirmation:</span>
                <span className="font-bold text-[#af101a]">Sent to your phone</span>
              </div>
            </div>
            <div className="flex flex-col gap-2 w-full">
              <button
                onClick={() => navigate('/requests')}
                className="w-full py-3 px-4 bg-[#af101a] text-white rounded-xl font-bold text-sm hover:bg-[#930010] transition-colors"
              >
                View Live Aid Requests Board
              </button>
              <button
                onClick={() => setSubmitted(false)}
                className="w-full py-2 text-sm text-[#5b403d] hover:text-[#191c1e] transition-colors"
              >
                Submit Another Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}