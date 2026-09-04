import { useCallback, useEffect, useMemo, useState } from 'react'
import { getSupabase } from '../components/safeSupabase'
import MobileTabBar from '../components/MobileTabBar'
import { DISTRICTS } from '../components/theme'

/* ────────────────────────────────────────────────────────────────
   Reference data
   ──────────────────────────────────────────────────────────────── */

/** Whoever is leaving the feedback — the wording the boards already use. */
const ROLES = [
  { key: 'requester', label: 'Aid Requester' },
  { key: 'donor', label: 'Donor / Volunteer' },
]

const ROLE_CHIP = {
  requester: 'bg-[#FEE2E2] text-[#B91C1C]',
  donor: 'bg-[#FFEDD5] text-[#C2410C]',
}

const MESSAGE_MIN = 10
const MESSAGE_MAX = 1000
const PENDING_KEY = 'helpsrilanka.feedback.pending'

const BLANK_FORM = {
  name: '',
  role: 'requester',
  location: '',
  rating: 0,
  message: '',
}

/* ────────────────────────────────────────────────────────────────
   Helpers
   ──────────────────────────────────────────────────────────────── */

function validate(form) {
  const errors = {}

  if (!form.name.trim()) {
    errors.name = 'Please enter your name.'
  } else if (form.name.trim().length < 2) {
    errors.name = 'Please enter your full name.'
  }

  if (!form.location) errors.location = 'Select your district.'

  if (form.rating < 1 || form.rating > 5) {
    errors.rating = 'Give the relief effort a rating from 1 to 5 stars.'
  }

  const message = form.message.trim()
  if (!message) {
    errors.message = 'Please write your feedback.'
  } else if (message.length < MESSAGE_MIN) {
    errors.message = `Add a little more detail (at least ${MESSAGE_MIN} characters).`
  } else if (message.length > MESSAGE_MAX) {
    errors.message = `Keep it under ${MESSAGE_MAX} characters.`
  }

  return errors
}

/** Shape a form into the row stored in the `feedback` table. */
function toRow(form) {
  return {
    name: form.name.trim(),
    role: form.role,
    location: form.location,
    rating: form.rating,
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

const inputClass =
  'w-full rounded-lg border border-[#E5E7EB] bg-white px-3 py-2.5 text-sm text-[#111827] ' +
  'placeholder:text-[#9CA3AF] focus:border-[#B91C1C] focus:outline-none focus:ring-2 focus:ring-[#FEE2E2]'

function Field({ id, label, error, hint, children }) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-[#111827]">
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

function Star({ filled, className = 'w-8 h-8' }) {
  return (
    <svg
      className={`${className} ${filled ? 'text-[#FFC400]' : 'text-[#D1D5DB]'}`}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="m12 3.2 2.7 5.75 6.3.86-4.6 4.32 1.18 6.17L12 17.35 6.42 20.3 7.6 14.13 3 9.81l6.3-.86L12 3.2Z" />
    </svg>
  )
}

/** Interactive 1-5 rating. Hover previews the score before committing. */
function StarRating({ value, onChange }) {
  const [hover, setHover] = useState(0)
  const shown = hover || value

  return (
    <div className="flex items-center gap-2">
      <div
        role="radiogroup"
        aria-label="Rating out of 5"
        className="flex items-center gap-0.5"
        onMouseLeave={() => setHover(0)}
      >
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={value === star}
            aria-label={`${star} star${star === 1 ? '' : 's'}`}
            onClick={() => onChange(star)}
            onMouseEnter={() => setHover(star)}
            onFocus={() => setHover(star)}
            onBlur={() => setHover(0)}
            className="rounded p-0.5 transition-transform hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B91C1C]"
          >
            <Star filled={star <= shown} />
          </button>
        ))}
      </div>
      <span className="text-sm font-semibold text-[#111827]">
        {shown ? `${shown} / 5` : <span className="font-normal text-[#6B7280]">Tap to rate</span>}
      </span>
    </div>
  )
}

/** Read-only star row used on the feedback board. */
function StarDisplay({ rating }) {
  return (
    <span className="flex items-center gap-0.5" aria-label={`Rated ${rating} out of 5`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star key={star} filled={star <= rating} className="w-4 h-4" />
      ))}
    </span>
  )
}

function EntryCard({ entry, unsent }) {
  const role = ROLES.find((r) => r.key === entry.role)
  return (
    <li className="rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className="text-sm font-bold text-[#111827]">{entry.name}</span>
        {role && (
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
              ROLE_CHIP[entry.role] ?? 'bg-slate-200 text-slate-700'
            }`}
          >
            {role.label}
          </span>
        )}
        {unsent && (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-800">
            Not sent yet
          </span>
        )}
        <span className="ml-auto text-[11px] text-[#9CA3AF]">{relativeTime(entry.created_at)}</span>
      </div>

      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
        <StarDisplay rating={entry.rating} />
        <span className="text-xs text-[#6B7280]">📍 {entry.location}</span>
      </div>

      <p className="mt-2.5 whitespace-pre-line text-sm leading-relaxed text-[#374151]">
        {entry.message}
      </p>
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

  const set = (key) => (event) => {
    const value = event?.target ? event.target.value : event
    setForm((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev))
  }

  /* ── Load the published board ────────────────────────────── */
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
      // Never lose feedback from the field: hold it on the device and let
      // the volunteer retry once they are back in coverage.
      const queued = [{ ...row, ref, created_at: new Date().toISOString() }, ...readPending()]
      writePending(queued)
      setPending(queued)
      setReceipt({ ref, queued: true })
      setForm(BLANK_FORM)
    } finally {
      setSubmitting(false)
    }
  }

  /* ── Derived board ───────────────────────────────────────── */
  const visible = useMemo(
    () => [...pending.map((entry) => ({ ...entry, _unsent: true })), ...entries],
    [entries, pending]
  )

  const average = useMemo(() => {
    const rated = visible.filter((entry) => entry.rating > 0)
    if (rated.length === 0) return null
    return rated.reduce((sum, entry) => sum + entry.rating, 0) / rated.length
  }, [visible])

  return (
    <div className="min-h-full bg-[#F4F4F5]">
      <div className="mx-auto w-full max-w-[1600px] px-3 py-5 sm:px-5 sm:py-8 lg:px-8">

        {/* ── Header ─────────────────────────────────────────── */}
        <header className="mb-5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#B91C1C]">
            Close the Loop
          </span>
          <h1 className="font-serif text-2xl font-bold text-[#111827] sm:text-3xl">
            Share Your Feedback
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm text-[#6B7280]">
            Whether you requested aid or gave it, tell us how the relief effort reached you.
            Ground truth from real people is what keeps dispatch honest.
          </p>
        </header>

        {/* ── Stranded-feedback banner ───────────────────────── */}
        {pending.length > 0 && (
          <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3">
            <span className="text-sm text-amber-900">
              <strong>{pending.length}</strong> message{pending.length === 1 ? '' : 's'} saved on this
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

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-6">

          {/* ── Form ─────────────────────────────────────────── */}
          <section className="lg:col-span-7 xl:col-span-6">
            {receipt ? (
              <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 text-center">
                <div
                  className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full ${
                    receipt.queued ? 'bg-amber-100 text-amber-700' : 'bg-[#FEE2E2] text-[#B91C1C]'
                  }`}
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d={receipt.queued ? 'M12 8v5m0 3h.01' : 'm5 13 4 4L19 7'} />
                  </svg>
                </div>

                <h2 className="mt-3 font-serif text-xl font-bold text-[#111827]">
                  {receipt.queued ? 'Saved on this device' : 'Thank you — feedback received'}
                </h2>
                <p className="mt-1.5 text-sm text-[#6B7280]">
                  {receipt.queued
                    ? 'Dispatch is unreachable right now. Your message is held safely on this phone — tap “Retry send” above once you have signal.'
                    : 'Your message is now on the feedback board and a coordinator will read it.'}
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
                    Leave more feedback
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
                className="space-y-4 rounded-2xl border border-[#E5E7EB] bg-white p-5 sm:p-6"
              >
                {/* Name */}
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

                {/* Requester or donor */}
                <fieldset>
                  <legend className="text-sm font-semibold text-[#111827]">You are a…</legend>
                  <div className="mt-1.5 grid grid-cols-2 gap-2">
                    {ROLES.map(({ key, label }) => (
                      <button
                        key={key}
                        type="button"
                        aria-pressed={form.role === key}
                        onClick={() => set('role')(key)}
                        className={`rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${
                          form.role === key
                            ? 'border-[#B91C1C] bg-[#FEE2E2] text-[#B91C1C]'
                            : 'border-[#E5E7EB] bg-white text-[#374151] hover:border-[#9CA3AF]'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </fieldset>

                {/* Location */}
                <Field id="location" label="Location" error={errors.location}>
                  <select
                    id="location"
                    value={form.location}
                    onChange={set('location')}
                    aria-invalid={Boolean(errors.location)}
                    aria-describedby={errors.location ? 'location-error' : undefined}
                    className={inputClass}
                  >
                    <option value="">Select your district…</option>
                    {DISTRICTS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </Field>

                {/* Rating */}
                <Field
                  id="rating"
                  label="Rating"
                  hint="How well did the relief effort work for you?"
                  error={errors.rating}
                >
                  <StarRating value={form.rating} onChange={set('rating')} />
                </Field>

                {/* Message */}
                <Field id="message" label="Message" error={errors.message}>
                  <textarea
                    id="message"
                    rows={5}
                    value={form.message}
                    onChange={set('message')}
                    maxLength={MESSAGE_MAX}
                    aria-invalid={Boolean(errors.message)}
                    aria-describedby={errors.message ? 'message-error' : undefined}
                    placeholder="What aid arrived, what was missing, how quickly the team reached you, and anything that would help the next family…"
                    className={`${inputClass} resize-y`}
                  />
                  <div className="mt-1 text-right text-[11px] text-[#9CA3AF]">
                    {form.message.length} / {MESSAGE_MAX}
                  </div>
                </Field>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-xl bg-[#B91C1C] px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-[#7F1D1D] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? 'Sending…' : 'Submit Feedback'}
                </button>

                <p className="text-center text-[11px] text-[#6B7280]">
                  Life-threatening emergency? Call{' '}
                  <a href="tel:117" className="font-semibold text-[#B91C1C] underline">117</a>{' '}
                  before filing here.
                </p>
              </form>
            )}
          </section>

          {/* ── Board ────────────────────────────────────────── */}
          <section className="lg:col-span-5 xl:col-span-6" aria-labelledby="board-heading">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 id="board-heading" className="font-serif text-lg font-bold text-[#111827]">
                Recent Feedback
              </h2>
              <button
                type="button"
                onClick={loadFeed}
                className="text-xs font-medium text-[#6B7280] hover:text-[#B91C1C]"
              >
                ↻ Refresh
              </button>
            </div>

            {average !== null && (
              <div className="mb-3 flex flex-wrap items-center gap-2.5 rounded-xl border border-[#E5E7EB] bg-white px-4 py-3">
                <StarDisplay rating={Math.round(average)} />
                <span className="text-sm font-bold text-[#111827]">{average.toFixed(1)}</span>
                <span className="text-xs text-[#6B7280]">
                  from {visible.length} response{visible.length === 1 ? '' : 's'}
                </span>
              </div>
            )}

            {loadingFeed ? (
              <ul className="grid grid-cols-1 gap-2.5 xl:grid-cols-2">
                {[0, 1, 2].map((i) => (
                  <li key={i} className="h-28 animate-pulse rounded-xl border border-[#E5E7EB] bg-white" />
                ))}
              </ul>
            ) : visible.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[#D1D5DB] bg-white p-6 text-center">
                <p className="text-sm text-[#6B7280]">
                  {feedOffline
                    ? 'Published feedback cannot be loaded right now. You can still submit — it is held on this device until dispatch is reachable.'
                    : 'No feedback yet. Yours would be the first.'}
                </p>
              </div>
            ) : (
              <ul className="grid grid-cols-1 gap-2.5 xl:grid-cols-2">
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
