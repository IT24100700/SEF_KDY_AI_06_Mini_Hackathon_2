import { useCallback, useEffect, useMemo, useState } from 'react'
import { getSupabase } from '../components/safeSupabase'
import MobileTabBar from '../components/MobileTabBar'
import { DISTRICTS } from '../components/theme'

/* ────────────────────────────────────────────────────────────────
   Reference data
   ──────────────────────────────────────────────────────────────── */

const CATEGORIES = [
  { key: 'incident', label: 'Incident Report', hint: 'Something happening on the ground right now' },
  { key: 'platform', label: 'Platform Feedback', hint: 'How this dispatch tool is working for you' },
  { key: 'volunteer', label: 'Volunteer Note', hint: 'Field notes from a relief run' },
  { key: 'complaint', label: 'Complaint', hint: 'Aid never arrived, or was misdirected' },
]

const URGENCIES = [
  { key: 'low', label: 'Low', chip: 'bg-slate-100 text-slate-700 border-slate-300' },
  { key: 'medium', label: 'Medium', chip: 'bg-[#FFEDD5] text-[#9A3412] border-[#FDBA74]' },
  { key: 'high', label: 'High', chip: 'bg-[#FEE2E2] text-[#B91C1C] border-[#FCA5A5]' },
  { key: 'critical', label: 'Critical', chip: 'bg-[#B91C1C] text-white border-[#B91C1C]' },
]

const CATEGORY_CHIP = {
  incident: 'bg-[#FEE2E2] text-[#B91C1C]',
  platform: 'bg-[#DBEAFE] text-[#2563EB]',
  volunteer: 'bg-[#FFEDD5] text-[#C2410C]',
  complaint: 'bg-slate-200 text-slate-700',
}

const MESSAGE_MIN = 15
const MESSAGE_MAX = 1000
const PENDING_KEY = 'helpsrilanka.feedback.pending'

const BLANK_FORM = {
  name: '',
  contact: '',
  district: '',
  category: 'incident',
  urgency: 'medium',
  rating: 0,
  message: '',
}

/* ────────────────────────────────────────────────────────────────
   Helpers
   ──────────────────────────────────────────────────────────────── */

function validate(form) {
  const errors = {}

  if (!form.name.trim()) {
    errors.name = 'Tell us who to credit this report to.'
  } else if (form.name.trim().length < 2) {
    errors.name = 'Please enter your full name.'
  }

  // Contact is optional, but must be usable if supplied — dispatch calls back.
  if (form.contact.trim()) {
    const value = form.contact.trim()
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)
    const isPhone = /^\+?[\d\s-]{9,15}$/.test(value)
    if (!isEmail && !isPhone) {
      errors.contact = 'Enter a valid email or Sri Lankan phone number.'
    }
  }

  if (!form.district) errors.district = 'Select the district this concerns.'

  const message = form.message.trim()
  if (!message) {
    errors.message = 'Please describe what happened.'
  } else if (message.length < MESSAGE_MIN) {
    errors.message = `Add a little more detail (at least ${MESSAGE_MIN} characters).`
  } else if (message.length > MESSAGE_MAX) {
    errors.message = `Keep it under ${MESSAGE_MAX} characters.`
  }

  if (form.category === 'platform' && form.rating === 0) {
    errors.rating = 'Rate the platform from 1 to 5 stars.'
  }

  return errors
}

/** Shape a form into the row stored in the `feedback` table. */
function toRow(form) {
  return {
    name: form.name.trim(),
    contact: form.contact.trim() || null,
    district: form.district,
    category: form.category,
    urgency: form.category === 'incident' ? form.urgency : null,
    rating: form.category === 'platform' ? form.rating : null,
    message: form.message.trim(),
  }
}

function relativeTime(iso) {
  const ms = Date.now() - new Date(iso).getTime()
  if (Number.isNaN(ms)) return ''

  const minutes = Math.round(ms / 60_000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes} min ago`

  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`

  const days = Math.round(hours / 24)
  if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`

  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function readPending() {
  try {
    const raw = localStorage.getItem(PENDING_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function writePending(rows) {
  try {
    localStorage.setItem(PENDING_KEY, JSON.stringify(rows))
  } catch {
    /* private browsing / quota — nothing more we can do */
  }
}

/* ────────────────────────────────────────────────────────────────
   Presentational pieces
   ──────────────────────────────────────────────────────────────── */

function Field({ id, label, error, hint, children }) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-[#111827]">
        {label}
      </label>
      {hint && <p className="mt-0.5 text-xs text-[#6B7280]">{hint}</p>}
      <div className="mt-1.5">{children}</div>
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-1 text-xs font-medium text-[#B91C1C]">
          {error}
        </p>
      )}
    </div>
  )
}

const inputClass =
  'w-full rounded-lg border border-[#E5E7EB] bg-white px-3 py-2.5 text-sm text-[#111827] ' +
  'placeholder:text-[#9CA3AF] focus:border-[#B91C1C] focus:outline-none focus:ring-2 focus:ring-[#FEE2E2]'

function StarRating({ value, onChange, error }) {
  return (
    <div className="flex items-center gap-1" role="radiogroup" aria-label="Platform rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          role="radio"
          aria-checked={value === star}
          aria-label={`${star} star${star === 1 ? '' : 's'}`}
          onClick={() => onChange(star)}
          className="p-0.5 transition-transform hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B91C1C]"
        >
          <svg
            className={`w-7 h-7 ${star <= value ? 'text-[#FFC400]' : 'text-slate-300'}`}
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="m12 3.5 2.6 5.6 6.1.8-4.5 4.2 1.2 6-5.4-3-5.4 3 1.2-6-4.5-4.2 6.1-.8L12 3.5Z" />
          </svg>
        </button>
      ))}
      <span className="ml-2 text-xs text-[#6B7280]">
        {value ? `${value} / 5` : error ? '' : 'Tap to rate'}
      </span>
    </div>
  )
}

function EntryCard({ entry, unsent }) {
  const category = CATEGORIES.find((c) => c.key === entry.category)
  return (
    <li className="rounded-xl bg-white border border-[#E5E7EB] p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
            CATEGORY_CHIP[entry.category] ?? 'bg-slate-200 text-slate-700'
          }`}
        >
          {category?.label ?? entry.category}
        </span>
        {entry.urgency && (
          <span
            className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
              URGENCIES.find((u) => u.key === entry.urgency)?.chip ?? ''
            }`}
          >
            {entry.urgency}
          </span>
        )}
        {unsent && (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-800">
            Not sent yet
          </span>
        )}
        <span className="ml-auto text-[11px] text-[#9CA3AF]">{relativeTime(entry.created_at)}</span>
      </div>

      <p className="mt-2.5 text-sm leading-relaxed text-[#374151] whitespace-pre-line">
        {entry.message}
      </p>

      <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[#6B7280]">
        <span className="font-medium text-[#111827]">{entry.name}</span>
        {entry.district && <span>📍 {entry.district}</span>}
        {entry.rating > 0 && (
          <span className="text-[#B45309]">{'★'.repeat(entry.rating)}{'☆'.repeat(5 - entry.rating)}</span>
        )}
      </div>
    </li>
  )
}

/* ────────────────────────────────────────────────────────────────
   Page
   ──────────────────────────────────────────────────────────────── */

export default function Feedback() {
  const [form, setForm] = useState(BLANK_FORM)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [receipt, setReceipt] = useState(null)

  const [entries, setEntries] = useState([])
  const [pending, setPending] = useState(() => readPending())
  const [loadingFeed, setLoadingFeed] = useState(true)
  const [feedOffline, setFeedOffline] = useState(false)
  const [filter, setFilter] = useState('all')

  const set = (key) => (event) => {
    const value = event?.target ? event.target.value : event
    setForm((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev))
  }

  /* ── Load the published feed ─────────────────────────────── */
  const loadFeed = useCallback(async () => {
    try {
      const supabase = await getSupabase()
      if (!supabase) throw new Error('Supabase is not configured')

      const { data, error } = await supabase
        .from('feedback')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(30)

      if (error) throw error
      setEntries(data ?? [])
      setFeedOffline(false)
    } catch {
      setFeedOffline(true)
    } finally {
      setLoadingFeed(false)
    }
  }, [])

  useEffect(() => {
    // loadFeed is async and awaits before touching state, so no setState
    // actually runs synchronously here.
    // eslint-disable-next-line react/set-state-in-effect
    loadFeed()
  }, [loadFeed])

  /* ── Retry anything stranded on this device ──────────────── */
  const syncPending = useCallback(async () => {
    const queued = readPending()
    if (queued.length === 0) return

    const supabase = await getSupabase()
    if (!supabase) return

    // Queued entries are already row-shaped; drop the client-only fields.
    const rows = queued.map((entry) => {
      const row = { ...entry }
      delete row.ref
      delete row.created_at
      return row
    })

    const { error } = await supabase.from('feedback').insert(rows)
    if (error) return

    writePending([])
    setPending([])
    await loadFeed()
  }, [loadFeed])

  /* ── Submit ──────────────────────────────────────────────── */
  async function handleSubmit(event) {
    event.preventDefault()

    const found = validate(form)
    setErrors(found)
    if (Object.keys(found).length > 0) {
      document.querySelector('[aria-invalid="true"]')?.focus()
      return
    }

    setSubmitting(true)
    const row = toRow(form)
    const ref = `FB-${Date.now().toString(36).toUpperCase().slice(-6)}`

    try {
      const supabase = await getSupabase()
      if (!supabase) throw new Error('unconfigured')

      const { error } = await supabase.from('feedback').insert([row])
      if (error) throw error

      setReceipt({ ref, queued: false })
      setForm(BLANK_FORM)
      await loadFeed()
    } catch {
      // Never lose a field report: hold it on the device and let the
      // volunteer retry once they are back in coverage.
      const queued = [{ ...row, ref, created_at: new Date().toISOString() }, ...readPending()]
      writePending(queued)
      setPending(queued)
      setReceipt({ ref, queued: true })
      setForm(BLANK_FORM)
    } finally {
      setSubmitting(false)
    }
  }

  /* ── Derived feed ────────────────────────────────────────── */
  const visible = useMemo(() => {
    const combined = [
      ...pending.map((entry) => ({ ...entry, _unsent: true })),
      ...entries,
    ]
    return filter === 'all' ? combined : combined.filter((entry) => entry.category === filter)
  }, [entries, pending, filter])

  const counts = useMemo(() => {
    const all = [...pending, ...entries]
    return CATEGORIES.reduce(
      (acc, { key }) => ({ ...acc, [key]: all.filter((e) => e.category === key).length }),
      { all: all.length }
    )
  }, [entries, pending])

  const activeCategory = CATEGORIES.find((c) => c.key === form.category)

  return (
    <div className="bg-[#F4F4F5] min-h-full">
      <div className="max-w-5xl mx-auto px-3 sm:px-6 py-5 sm:py-8">

        {/* ── Header ─────────────────────────────────────────── */}
        <header className="mb-5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#B91C1C]">
            Close the Loop
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#111827]">
            Feedback &amp; Incident Reports
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm text-[#6B7280]">
            Ground truth from citizens and relief teams is what keeps dispatch honest.
            Report an unfolding incident, flag aid that never arrived, or tell us how this
            platform is holding up in the field.
          </p>
        </header>

        {/* ── Stranded-reports banner ────────────────────────── */}
        {pending.length > 0 && (
          <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3">
            <span className="text-sm text-amber-900">
              <strong>{pending.length}</strong> report{pending.length === 1 ? '' : 's'} saved on this
              device only — not yet delivered to dispatch.
            </span>
            <button
              type="button"
              onClick={syncPending}
              className="ml-auto rounded-lg bg-amber-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-900"
            >
              Retry send
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 lg:gap-6">

          {/* ── Form ─────────────────────────────────────────── */}
          <section className="lg:col-span-3">
            {receipt ? (
              <div className="rounded-2xl bg-white border border-[#E5E7EB] p-6 text-center">
                <div
                  className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full ${
                    receipt.queued ? 'bg-amber-100 text-amber-700' : 'bg-[#FEE2E2] text-[#B91C1C]'
                  }`}
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d={receipt.queued ? 'M12 8v5m0 3h.01' : 'm5 13 4 4L19 7'} />
                  </svg>
                </div>

                <h2 className="mt-3 font-serif text-xl font-bold text-[#111827]">
                  {receipt.queued ? 'Saved on this device' : 'Report received'}
                </h2>
                <p className="mt-1.5 text-sm text-[#6B7280]">
                  {receipt.queued
                    ? 'Dispatch is unreachable right now. Your report is held safely on this phone — tap “Retry send” above once you have signal.'
                    : 'A coordinator reviews every submission. Critical incidents are escalated to the Disaster Management Centre.'}
                </p>
                <p className="mt-3 inline-block rounded-lg bg-[#F4F4F5] px-3 py-1.5 font-mono text-sm font-semibold text-[#111827]">
                  Ref {receipt.ref}
                </p>

                <div className="mt-5 flex flex-wrap justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => setReceipt(null)}
                    className="rounded-lg bg-[#B91C1C] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#7F1D1D]"
                  >
                    Submit another report
                  </button>
                  <a
                    href="tel:117"
                    className="rounded-lg border border-[#E5E7EB] bg-white px-4 py-2.5 text-sm font-semibold text-[#111827] hover:bg-[#F4F4F5]"
                  >
                    🚨 Call 117 instead
                  </a>
                </div>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                noValidate
                className="space-y-4 rounded-2xl bg-white border border-[#E5E7EB] p-5 sm:p-6"
              >
                {/* Category */}
                <fieldset>
                  <legend className="text-sm font-medium text-[#111827]">
                    What are you reporting?
                  </legend>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {CATEGORIES.map(({ key, label }) => (
                      <button
                        key={key}
                        type="button"
                        aria-pressed={form.category === key}
                        onClick={() => set('category')(key)}
                        className={`rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${
                          form.category === key
                            ? 'border-[#B91C1C] bg-[#FEE2E2] text-[#B91C1C]'
                            : 'border-[#E5E7EB] bg-white text-[#374151] hover:border-[#9CA3AF]'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  <p className="mt-1.5 text-xs text-[#6B7280]">{activeCategory?.hint}</p>
                </fieldset>

                {/* Urgency — incidents only */}
                {form.category === 'incident' && (
                  <fieldset>
                    <legend className="text-sm font-medium text-[#111827]">Urgency</legend>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {URGENCIES.map(({ key, label, chip }) => (
                        <button
                          key={key}
                          type="button"
                          aria-pressed={form.urgency === key}
                          onClick={() => set('urgency')(key)}
                          className={`rounded-full border px-3.5 py-1.5 text-xs font-bold uppercase tracking-wide transition-colors ${
                            form.urgency === key
                              ? `${chip} ring-2 ring-offset-1 ring-[#B91C1C]`
                              : 'border-[#E5E7EB] bg-white text-[#6B7280] hover:border-[#9CA3AF] hover:text-[#111827]'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </fieldset>
                )}

                {/* Rating — platform feedback only */}
                {form.category === 'platform' && (
                  <Field id="rating" label="How well is the platform working?" error={errors.rating}>
                    <StarRating value={form.rating} onChange={set('rating')} error={errors.rating} />
                  </Field>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field id="name" label="Your name" error={errors.name}>
                    <input
                      id="name"
                      type="text"
                      value={form.name}
                      onChange={set('name')}
                      aria-invalid={Boolean(errors.name)}
                      aria-describedby={errors.name ? 'name-error' : undefined}
                      placeholder="e.g. Nuwan Perera"
                      className={inputClass}
                    />
                  </Field>

                  <Field
                    id="contact"
                    label="Phone or email"
                    hint="Optional — only so dispatch can call back"
                    error={errors.contact}
                  >
                    <input
                      id="contact"
                      type="text"
                      value={form.contact}
                      onChange={set('contact')}
                      aria-invalid={Boolean(errors.contact)}
                      aria-describedby={errors.contact ? 'contact-error' : undefined}
                      placeholder="+94 71 234 5678"
                      className={inputClass}
                    />
                  </Field>
                </div>

                <Field id="district" label="District" error={errors.district}>
                  <select
                    id="district"
                    value={form.district}
                    onChange={set('district')}
                    aria-invalid={Boolean(errors.district)}
                    aria-describedby={errors.district ? 'district-error' : undefined}
                    className={inputClass}
                  >
                    <option value="">Select a district…</option>
                    {DISTRICTS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </Field>

                <Field id="message" label="What happened?" error={errors.message}>
                  <textarea
                    id="message"
                    rows={5}
                    value={form.message}
                    onChange={set('message')}
                    maxLength={MESSAGE_MAX}
                    aria-invalid={Boolean(errors.message)}
                    aria-describedby={errors.message ? 'message-error' : undefined}
                    placeholder="Water level, number of people affected, what aid arrived or did not, and any landmark a rescue team can find…"
                    className={`${inputClass} resize-y`}
                  />
                  <div className="mt-1 text-right text-[11px] text-[#9CA3AF]">
                    {form.message.length} / {MESSAGE_MAX}
                  </div>
                </Field>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-xl bg-[#B91C1C] px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-[#7F1D1D] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? 'Sending to dispatch…' : 'Submit report'}
                </button>

                <p className="text-center text-[11px] text-[#6B7280]">
                  Life-threatening emergency? Call{' '}
                  <a href="tel:117" className="font-semibold text-[#B91C1C] underline">117</a>{' '}
                  before filing here.
                </p>
              </form>
            )}
          </section>

          {/* ── Recent feed ──────────────────────────────────── */}
          <section className="lg:col-span-2" aria-labelledby="feed-heading">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 id="feed-heading" className="font-serif text-lg font-bold text-[#111827]">
                Recent Reports
              </h2>
              <button
                type="button"
                onClick={loadFeed}
                className="text-xs font-medium text-[#6B7280] hover:text-[#B91C1C]"
              >
                ↻ Refresh
              </button>
            </div>

            {/* Filters */}
            <div className="mb-3 flex flex-wrap gap-1.5">
              {[{ key: 'all', label: 'All' }, ...CATEGORIES].map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  aria-pressed={filter === key}
                  onClick={() => setFilter(key)}
                  className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors ${
                    filter === key
                      ? 'bg-[#111827] text-white'
                      : 'bg-white text-[#6B7280] border border-[#E5E7EB] hover:text-[#111827]'
                  }`}
                >
                  {label} ({counts[key] ?? 0})
                </button>
              ))}
            </div>

            {loadingFeed ? (
              <ul className="space-y-2.5">
                {[0, 1, 2].map((i) => (
                  <li key={i} className="h-28 animate-pulse rounded-xl bg-white border border-[#E5E7EB]" />
                ))}
              </ul>
            ) : visible.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[#D1D5DB] bg-white p-6 text-center">
                <p className="text-sm text-[#6B7280]">
                  {feedOffline
                    ? 'Published reports cannot be loaded right now. You can still file one — it is held on this device until dispatch is reachable.'
                    : filter === 'all'
                      ? 'No reports filed yet. Yours would be the first.'
                      : 'No reports in this category yet.'}
                </p>
              </div>
            ) : (
              <ul className="space-y-2.5">
                {visible.map((entry, index) => (
                  <EntryCard
                    key={entry.id ?? entry.ref ?? index}
                    entry={entry}
                    unsent={entry._unsent}
                  />
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>

      <MobileTabBar />
    </div>
  )
}
