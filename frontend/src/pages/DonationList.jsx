/**
 * DonationList.jsx — Live Donation Listings
 * ==========================================
 * Fetches all donations from GET /api/donations,
 * displays them in modern cards with search/filter,
 * and allows status updates (PATCH) and cancellation (DELETE).
 *
 * Route: /donations  (wired in App.jsx → DonationList)
 * Author: Help Sri Lanka Hackathon Team
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'

// ─── Constants ────────────────────────────────────────────────────────────────
const API_BASE = 'http://localhost:5000/api/donations'

const STATUS_CFG = {
  Pending:    { label: 'Pending',    bg: 'bg-amber-100',  text: 'text-amber-700',  dot: 'bg-amber-400'  },
  Dispatched: { label: 'Dispatched', bg: 'bg-blue-100',   text: 'text-blue-700',   dot: 'bg-blue-500'   },
  Delivered:  { label: 'Delivered',  bg: 'bg-green-100',  text: 'text-green-700',  dot: 'bg-green-500'  },
}

const STATUSES = Object.keys(STATUS_CFG)

// Friendly item labels (mirrors DonateForm catalogue)
const ITEM_LABELS = {
  'bottled-water':  'Bottled Water',
  'gallon-water':   'Water Gallon',
  'rice-10kg':      'Rice 10kg',
  'red-dhal':       'Red Dhal',
  'canned-fish':    'Canned Fish',
  'milk-powder':    'Milk Powder',
  'infant-cereal':  'Infant Cereal',
  'biscuits':       'Biscuits',
  'tea-sugar':      'Tea & Sugar',
  'sanitary-care':  'Sanitary Care',
  'chlorine-tabs':  'Chlorine Tabs',
  'paracetamol':    'Paracetamol',
  'first-aid-kit':  'First Aid Kit',
  'dettol':         'Dettol',
  'ors':            'ORS Sachets',
  'mosquito-rep':   'Mosquito Rep.',
  'diapers':        'Diapers',
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-LK', {
    year: 'numeric', month: 'short', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: true,
  })
}

function getItemLabel(id) {
  return ITEM_LABELS[id] ?? id
}

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Coloured status badge */
function StatusBadge({ status }) {
  const cfg = STATUS_CFG[status] ?? STATUS_CFG.Pending
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.text}`}>
      <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  )
}

/** Item pills row */
function ItemPills({ items }) {
  if (!items?.length) return <span className="text-xs text-slate-400">No items</span>
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((it) => (
        <span
          key={it.itemId}
          className="inline-flex items-center gap-1 text-xs bg-slate-100 text-slate-600 font-medium px-2 py-0.5 rounded-md border border-slate-200"
        >
          {getItemLabel(it.itemId)}
          <span className="font-bold text-[#A50116]">×{it.quantity}</span>
        </span>
      ))}
    </div>
  )
}

/** Status update dropdown inside card */
function StatusSelect({ donationId, current, onUpdate, updating }) {
  return (
    <select
      id={`status-${donationId}`}
      aria-label="Update status"
      value={current}
      disabled={updating}
      onChange={(e) => onUpdate(donationId, e.target.value)}
      className="text-xs border border-slate-300 rounded-lg px-2 py-1.5 bg-white outline-none focus:border-[#A50116] focus:ring-2 focus:ring-red-100 transition-all disabled:opacity-50 cursor-pointer"
    >
      {STATUSES.map((s) => (
        <option key={s} value={s}>{s}</option>
      ))}
    </select>
  )
}

/** Individual donation card */
function DonationCard({ donation, onDelete, onUpdateStatus, updatingId, deletingId }) {
  const { id, donor, items, totalUnits, status, createdAt } = donation
  const shortId = id?.slice(0, 8).toUpperCase() ?? '—'
  const isUpdating = updatingId === id
  const isDeleting = deletingId === id

  return (
    <article
      className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all duration-200 ${
        isDeleting ? 'opacity-40 scale-95' : 'border-slate-200 hover:shadow-md hover:-translate-y-0.5'
      }`}
    >
      {/* Card header */}
      <div className="flex items-center justify-between gap-3 px-5 py-3.5 border-b border-slate-100 bg-slate-50 flex-wrap">
        <div className="flex items-center gap-2.5">
          <span className="font-mono text-xs font-bold text-slate-400 bg-white border border-slate-200 px-2 py-0.5 rounded-md">
            #{shortId}
          </span>
          <span className="text-xs text-slate-400">🕐 {formatDate(createdAt)}</span>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={status} />
          <span className="text-xs bg-[#fff0f2] text-[#A50116] font-bold px-2 py-0.5 rounded-full">
            {totalUnits} unit{totalUnits !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Card body */}
      <div className="px-5 py-4 flex flex-col gap-4">
        {/* Donor row */}
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <p className="font-bold text-slate-900 text-base leading-tight flex items-center gap-2">
              {donor.anonymous && (
                <span className="text-xs font-medium bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">
                  anon
                </span>
              )}
              {donor.name}
            </p>
            <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1">
              <a
                href={`tel:${donor.phone}`}
                className="text-xs text-slate-500 hover:text-[#A50116] transition-colors"
              >
                {donor.phone}
              </a>
              <a
                href={`mailto:${donor.email}`}
                className="text-xs text-slate-500 hover:text-[#A50116] transition-colors truncate max-w-[200px]"
              >
                {donor.email}
              </a>
            </div>
          </div>
          {/* Drop-off badge */}
          <span className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 border border-blue-200 font-medium px-2.5 py-1 rounded-full max-w-[220px] text-right leading-snug">
            {donor.dropOff?.split('—')[0]?.trim()}
          </span>
        </div>

        {/* Items */}
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
            Pledged Items
          </p>
          <ItemPills items={items} />
        </div>

        {donor.notes && (
          <p className="text-xs text-slate-500 italic bg-slate-50 rounded-lg px-3 py-2 border border-slate-100">
            {donor.notes}
          </p>
        )}
      </div>

      {/* Card footer — actions */}
      <div className="flex items-center justify-between gap-3 px-5 py-3 border-t border-slate-100 bg-slate-50/60 flex-wrap">
        {/* Status changer */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">Change status:</span>
          <StatusSelect
            donationId={id}
            current={status}
            onUpdate={onUpdateStatus}
            updating={isUpdating}
          />
          {isUpdating && (
            <svg className="animate-spin h-3.5 w-3.5 text-[#A50116]" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          )}
        </div>

        {/* Delete button */}
        <button
          id={`delete-${id}`}
          type="button"
          disabled={isDeleting}
          onClick={() => onDelete(id, donor.name)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:text-white hover:bg-red-600 border border-red-300 hover:border-red-600 px-3 py-1.5 rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isDeleting ? (
            <>
              <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Cancelling...
            </>
          ) : (
            <>Cancel Donation</>
          )}
        </button>
      </div>
    </article>
  )
}

/** Full-page skeleton loader */
function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-pulse">
      <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50 flex gap-3">
        <div className="h-5 w-20 bg-slate-200 rounded-md" />
        <div className="h-5 w-32 bg-slate-200 rounded-md" />
        <div className="ml-auto h-5 w-16 bg-slate-200 rounded-full" />
      </div>
      <div className="px-5 py-4 flex flex-col gap-3">
        <div className="h-4 w-40 bg-slate-200 rounded" />
        <div className="h-3 w-56 bg-slate-100 rounded" />
        <div className="flex gap-2 flex-wrap">
          {[80, 100, 70, 90].map((w) => (
            <div key={w} className="h-5 rounded-md bg-slate-100" style={{ width: w }} />
          ))}
        </div>
      </div>
      <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 flex gap-2">
        <div className="h-7 w-32 bg-slate-200 rounded-lg" />
        <div className="ml-auto h-7 w-28 bg-slate-200 rounded-lg" />
      </div>
    </div>
  )
}

/** Toast notification */
function Toast({ msg, type, onClose }) {
  if (!msg) return null
  const isErr = type === 'error'
  return (
    <div
      role="alert"
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl text-sm font-medium max-w-sm border transition-all ${
        isErr
          ? 'bg-red-50 border-red-300 text-red-700'
          : 'bg-green-50 border-green-300 text-green-700'
      }`}
    >
      <span className="flex-1">{msg}</span>
      <button
        type="button"
        onClick={onClose}
        className="ml-2 opacity-60 hover:opacity-100 font-bold text-base"
        aria-label="Dismiss"
      >x</button>
    </div>
  )
}

/** Empty state */
function EmptyState({ filtered }) {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-24 text-center">
      <div className="w-14 h-14 mb-4 rounded-full bg-slate-100 flex items-center justify-center">
        <svg className="w-7 h-7 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          {filtered
            ? <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            : <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7m16 0v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-5m16 0H4" />}
        </svg>
      </div>
      <p className="text-slate-500 font-medium text-lg">
        {filtered ? 'No donations match your filters.' : 'No donations yet.'}
      </p>
      <p className="text-slate-400 text-sm mt-1">
        {filtered
          ? 'Try clearing your search or filters.'
          : 'Be the first to register a donation!'}
      </p>
      <Link
        to="/donate"
        className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-semibold text-sm shadow transition-all"
        style={{ background: '#A50116' }}
      >
        Register a Donation
      </Link>
    </div>
  )
}

// ─── Drop-off location options (for filter) ───────────────────────────────────
const DROP_OFF_OPTIONS = [
  'All Locations',
  'Colombo', 'Gampaha', 'Kandy', 'Galle', 'Matara',
  'Ratnapura', 'Kurunegala', 'Jaffna', 'Trincomalee',
  'Anuradhapura', 'Batticaloa', 'Other',
]

// ─── Main component ───────────────────────────────────────────────────────────
export default function DonationList() {
  // ── Data & loading ──────────────────────────────────────────────────────────
  const [donations, setDonations] = useState([])
  const [loading,   setLoading]   = useState(true)
  const [fetchErr,  setFetchErr]  = useState('')

  // ── Filters ─────────────────────────────────────────────────────────────────
  const [search,        setSearch]        = useState('')
  const [filterStatus,  setFilterStatus]  = useState('All')
  const [filterDropOff, setFilterDropOff] = useState('All Locations')

  // ── Action states ────────────────────────────────────────────────────────────
  const [updatingId, setUpdatingId] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [toast,      setToast]      = useState({ msg: '', type: '' })

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast({ msg: '', type: '' }), 4000)
  }

  // ── Fetch donations ─────────────────────────────────────────────────────────
  const fetchDonations = useCallback(async () => {
    setLoading(true)
    setFetchErr('')
    try {
      const res = await fetch(API_BASE)
      if (!res.ok) throw new Error(`Server error: ${res.status}`)
      const data = await res.json()
      setDonations(data.donations ?? [])
    } catch (err) {
      setFetchErr(err.message || 'Failed to load donations. Is the backend running?')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchDonations() }, [fetchDonations])

  // ── Update status ───────────────────────────────────────────────────────────
  const handleUpdateStatus = useCallback(async (id, newStatus) => {
    setUpdatingId(id)
    try {
      const res = await fetch(`${API_BASE}/${id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.error || `Error ${res.status}`)
      }
      const { donation } = await res.json()
      setDonations((prev) => prev.map((d) => (d.id === id ? donation : d)))
      showToast(`Status updated to "${newStatus}" ✓`)
    } catch (err) {
      showToast(err.message || 'Failed to update status.', 'error')
    } finally {
      setUpdatingId(null)
    }
  }, [])

  // ── Delete donation ─────────────────────────────────────────────────────────
  const handleDelete = useCallback(async (id, name) => {
    const confirmed = window.confirm(
      `Cancel donation from "${name}"?\nThis action cannot be undone.`
    )
    if (!confirmed) return

    setDeletingId(id)
    try {
      const res = await fetch(`${API_BASE}/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.error || `Error ${res.status}`)
      }
      // Animate out then remove
      setTimeout(() => {
        setDonations((prev) => prev.filter((d) => d.id !== id))
        setDeletingId(null)
        showToast(`Donation from "${name}" cancelled.`)
      }, 350)
    } catch (err) {
      setDeletingId(null)
      showToast(err.message || 'Failed to cancel donation.', 'error')
    }
  }, [])

  // ── Client-side filtering ───────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return donations.filter((d) => {
      if (filterStatus !== 'All' && d.status !== filterStatus) return false

      if (filterDropOff !== 'All Locations') {
        const loc = d.donor.dropOff?.toLowerCase() ?? ''
        if (!loc.includes(filterDropOff.toLowerCase())) return false
      }

      if (search.trim()) {
        const q = search.toLowerCase()
        const inName  = d.donor.name.toLowerCase().includes(q)
        const inEmail = d.donor.email.toLowerCase().includes(q)
        const inLoc   = d.donor.dropOff?.toLowerCase().includes(q)
        if (!inName && !inEmail && !inLoc) return false
      }

      return true
    })
  }, [donations, search, filterStatus, filterDropOff])

  // ── Summary counts ──────────────────────────────────────────────────────────
  const counts = useMemo(() => ({
    total:      donations.length,
    pending:    donations.filter((d) => d.status === 'Pending').length,
    dispatched: donations.filter((d) => d.status === 'Dispatched').length,
    delivered:  donations.filter((d) => d.status === 'Delivered').length,
    units:      donations.reduce((s, d) => s + (d.totalUnits || 0), 0),
  }), [donations])

  const isFiltered = search || filterStatus !== 'All' || filterDropOff !== 'All Locations'

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="bg-slate-50 min-h-screen pb-16">

      {/* ── Page header ── */}
      <div style={{ background: 'linear-gradient(135deg, #A50116 0%, #7a0110 100%)' }} className="text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-8">
          <Link
            to="/donate"
            className="inline-flex items-center gap-1.5 text-red-200 hover:text-white text-sm font-medium transition-colors mb-6"
          >
            ← Back to Donate Page
          </Link>

          <div className="flex items-end justify-between flex-wrap gap-4">
            <div>
              <span className="inline-block bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full mb-3 uppercase tracking-widest backdrop-blur">
                Live Listings
              </span>
              <h1 className="text-3xl sm:text-4xl font-extrabold leading-tight mb-1">
                Donation <span className="text-red-200">Listings</span>
              </h1>
              <p className="text-red-100 text-sm max-w-lg">
                All registered physical aid donations. Update statuses as shipments are dispatched and delivered.
              </p>
            </div>
            <Link
              to="/donate"
              className="shrink-0 inline-flex items-center gap-2 bg-white text-[#A50116] font-bold text-sm px-5 py-2.5 rounded-xl shadow-md hover:bg-red-50 transition-colors"
            >
              New Donation
            </Link>
          </div>

          {/* Summary stat row */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-6">
            {[
              { label: 'Total',      val: counts.total,      bg: 'bg-white/15' },
              { label: 'Pending',    val: counts.pending,    bg: 'bg-amber-500/20' },
              { label: 'Dispatched', val: counts.dispatched, bg: 'bg-blue-500/20' },
              { label: 'Delivered',  val: counts.delivered,  bg: 'bg-green-500/20' },
              { label: 'Total Units',val: counts.units,      bg: 'bg-white/15' },
            ].map(({ label, val, bg }) => (
              <div key={label} className={`${bg} border border-white/20 rounded-xl px-3 py-2.5 text-center backdrop-blur`}>
                <div className="text-xl font-extrabold text-white">{val}</div>
                <div className="text-red-200 text-xs font-medium">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">

        {/* ── Search / Filter bar ── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 mb-6 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          {/* Search */}
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">Search</span>
            <input
              id="dl-search"
              type="search"
              placeholder="Search by donor name, email, or location…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border border-slate-300 rounded-xl pl-8 pr-4 py-2.5 text-sm outline-none focus:border-[#A50116] focus:ring-2 focus:ring-red-100 transition-all"
            />
          </div>

          {/* Status filter */}
          <select
            id="dl-filter-status"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm bg-white outline-none focus:border-[#A50116] focus:ring-2 focus:ring-red-100 transition-all"
          >
            <option value="All">All Statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{STATUS_CFG[s].label}</option>
            ))}
          </select>

          {/* Drop-off filter */}
          <select
            id="dl-filter-location"
            value={filterDropOff}
            onChange={(e) => setFilterDropOff(e.target.value)}
            className="border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm bg-white outline-none focus:border-[#A50116] focus:ring-2 focus:ring-red-100 transition-all"
          >
            {DROP_OFF_OPTIONS.map((loc) => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>

          {/* Refresh */}
          <button
            id="dl-refresh-btn"
            type="button"
            onClick={fetchDonations}
            disabled={loading}
            title="Refresh"
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-medium text-slate-600 hover:border-[#A50116] hover:text-[#A50116] transition-colors disabled:opacity-50"
          >
            <span className={loading ? 'animate-spin inline-block' : ''}>↻</span>
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>

        {/* Results count + clear */}
        {!loading && (
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs text-slate-500">
              Showing <strong className="text-slate-700">{filtered.length}</strong> of{' '}
              <strong className="text-slate-700">{donations.length}</strong> donation{donations.length !== 1 ? 's' : ''}
            </p>
            {isFiltered && (
              <button
                type="button"
                onClick={() => { setSearch(''); setFilterStatus('All'); setFilterDropOff('All Locations') }}
                className="text-xs text-[#A50116] font-medium hover:underline"
              >
                ✕ Clear filters
              </button>
            )}
          </div>
        )}

        {/* ── Fetch error ── */}
        {fetchErr && (
          <div className="flex items-start gap-3 bg-red-50 border border-red-300 text-red-700 rounded-xl px-4 py-3 text-sm mb-6">
            <div>
              <p className="font-semibold">Could not load donations</p>
              <p className="text-xs mt-0.5 opacity-80">{fetchErr}</p>
            </div>
            <button
              type="button"
              onClick={fetchDonations}
              className="ml-auto text-xs underline font-medium shrink-0"
            >
              Retry
            </button>
          </div>
        )}

        {/* ── Card grid ── */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
          ) : filtered.length === 0 ? (
            <EmptyState filtered={!!isFiltered} />
          ) : (
            filtered.map((donation) => (
              <DonationCard
                key={donation.id}
                donation={donation}
                onDelete={handleDelete}
                onUpdateStatus={handleUpdateStatus}
                updatingId={updatingId}
                deletingId={deletingId}
              />
            ))
          )}
        </div>
      </div>

      {/* ── Toast notification ── */}
      <Toast msg={toast.msg} type={toast.type} onClose={() => setToast({ msg: '', type: '' })} />
    </div>
  )
}
