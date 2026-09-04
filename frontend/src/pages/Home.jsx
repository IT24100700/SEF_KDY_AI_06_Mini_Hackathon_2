import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getSupabase, describeSupabaseError, NOT_CONFIGURED } from '../components/safeSupabase'
import MobileTabBar from '../components/MobileTabBar'
import heroWide from '../assets/hero-help-srilanka.jpg'
import heroNarrow from '../assets/hero-help-srilanka-768.jpg'

/* ────────────────────────────────────────────────────────────────
   Static content
   ──────────────────────────────────────────────────────────────── */

const AID_CATEGORIES = [
  {
    key: 'water-food',
    title: 'Clean Water & Rations',
    blurb: 'Bottled water, dry food packs',
    tint: 'bg-[#FEE2E2] text-[#B91C1C]',
    icon: 'M12 3s6 6.4 6 10.4A6 6 0 0 1 6 13.4C6 9.4 12 3 12 3Z',
  },
  {
    key: 'medical',
    title: 'Medical & First Aid',
    blurb: 'Insulin, wound kits, fever relief',
    tint: 'bg-[#FEE2E2] text-[#B91C1C]',
    icon: 'M4.5 6.5h15v12h-15v-12Zm7.5 3v6m-3-3h6',
  },
  {
    key: 'rescue',
    title: 'Rescue Boat / Shelter',
    blurb: 'Rooftop & marooned family pickup',
    tint: 'bg-[#FFEDD5] text-[#C2410C]',
    icon: 'M4 16.5h16l-2 4H6l-2-4Zm2.5 0V9l5.5-3 5.5 3v7.5',
  },
  {
    key: 'missing-person',
    title: 'Missing Person Alert',
    blurb: 'Log family member contact check',
    tint: 'bg-[#DBEAFE] text-[#2563EB]',
    icon: 'M15.5 20.5v-1.75a3.5 3.5 0 0 0-3.5-3.5H7a3.5 3.5 0 0 0-3.5 3.5v1.75M9.5 11.5a3.25 3.25 0 1 0 0-6.5 3.25 3.25 0 0 0 0 6.5Zm8 0 2 2 3-3.5',
  },
]

const COMMITMENTS = [
  {
    title: 'Verified Ground Needs',
    body: 'Every aid request is verified by a local Grama Niladhari or certified rescue coordinator before resources are allocated, preventing hoarding and duplicate dispatch.',
    icon: 'M12 3.5 4.5 6.5v5c0 4.4 3.1 8.1 7.5 9 4.4-.9 7.5-4.6 7.5-9v-5L12 3.5Zm-2.4 8.2 1.9 1.9 3.9-3.9',
  },
  {
    title: 'Zero Intermediary Loss',
    body: 'Donated funds translate directly into grocery and medical vouchers issued straight to verified ground suppliers on Sri Lankan soil — no overhead cuts.',
    icon: 'M4 8.5h12a4 4 0 0 1 4 4v3a2 2 0 0 1-2 2h-2.5m-11.5-9v9h3m-3-9a2.5 2.5 0 0 1 2.5-2.5h4M8 19.5h6m-6.5-8h.01',
  },
  {
    title: 'Real-Time GPS Dispatch',
    body: 'Rescue boats and delivery 4×4s receive live latitude/longitude pins from marooned individuals with signal, even in low-bandwidth conditions.',
    icon: 'M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11Zm0-8.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z',
  },
]

// 117 and 1919 lead, per the design. The other three official lines stay
// on the same row rather than being dropped — never hide a working
// emergency number to save space.
const HOTLINE_CARDS = [
  { label: 'Disaster Mgt Centre', number: '117', accent: 'text-[#B91C1C]', lead: true },
  { label: 'Gov Emergency Ops', number: '1919', accent: 'text-[#111827]', lead: true },
  { label: 'Police Emergency', number: '119', accent: 'text-[#111827]' },
  { label: 'Fire & Rescue', number: '110', accent: 'text-[#111827]' },
  { label: 'Suwaseriya Ambulance', number: '1990', accent: 'text-[#111827]' },
]

/* ────────────────────────────────────────────────────────────────
   Small presentational helpers
   ──────────────────────────────────────────────────────────────── */

function Icon({ d, className = 'w-5 h-5' }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={d} />
    </svg>
  )
}

function StatValue({ loading, offline, value, suffix }) {
  if (loading) {
    return <span className="inline-block h-6 w-24 rounded bg-slate-200 animate-pulse align-middle" />
  }
  // Never present a stale/absent feed as a real count of zero.
  return <>{offline ? '—' : value.toLocaleString()} {suffix}</>
}

/* ────────────────────────────────────────────────────────────────
   Live figures
   ──────────────────────────────────────────────────────────────── */

const EMPTY_STATS = { pledges: 0, pending: 0, districts: 0 }

/**
 * Pulls a single snapshot of the shared `items` table and derives the
 * headline figures. Returns `offline: true` when Supabase is unreachable
 * or unconfigured so the landing page still renders for everyone.
 */
function useReliefStats() {
  const [stats, setStats] = useState(EMPTY_STATS)
  const [loading, setLoading] = useState(true)
  const [offline, setOffline] = useState(false)
  const [diagnosis, setDiagnosis] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const supabase = await getSupabase()
        if (!supabase) throw new Error(NOT_CONFIGURED)

        const { data, error } = await supabase.from('items').select('type, location')
        if (error) throw error
        if (cancelled) return

        const rows = data ?? []
        const requests = rows.filter((r) => r.type === 'request')

        setStats({
          pledges: rows.filter((r) => r.type === 'donation').length,
          pending: requests.length,
          districts: new Set(
            requests.map((r) => (r.location ?? '').trim().toLowerCase()).filter(Boolean)
          ).size,
        })
        setOffline(false)
        setDiagnosis(null)
      } catch (err) {
        if (!cancelled) {
          setOffline(true)
          setDiagnosis(describeSupabaseError(err, 'items'))
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    // Refresh while a coordinator leaves the dashboard open.
    const timer = setInterval(load, 30_000)
    return () => {
      cancelled = true
      clearInterval(timer)
    }
  }, [])

  return { stats, loading, offline, diagnosis }
}

/* ────────────────────────────────────────────────────────────────
   Page
   ──────────────────────────────────────────────────────────────── */

export default function Home() {
  const { stats, loading, offline, diagnosis } = useReliefStats()

  return (
    <div className="bg-[#F4F4F5]">
      <div className="mx-auto w-full max-w-[1600px] space-y-3 px-3 py-3 sm:space-y-4 sm:px-5 sm:py-5 lg:px-8">

        {/* ── Hero ───────────────────────────────────────────── */}
        <section className="overflow-hidden rounded-2xl bg-[#1C1917]">
          {/* The HELP SRI LANKA wordmark is burnt into the artwork, so the
              accessible heading is provided separately for screen readers. */}
          <h1 className="sr-only">Help Sri Lanka — flood and disaster emergency dispatch</h1>
          <img
            src={heroWide}
            srcSet={`${heroNarrow} 768w, ${heroWide} 1536w`}
            sizes="(max-width: 1024px) 100vw, 1024px"
            width={1536}
            height={1024}
            fetchPriority="high"
            alt="A relief worker in an orange high-visibility vest hands a bag of food down from a supply truck to a man, with a long queue of waiting families along the flooded street behind him."
            className="block h-auto w-full object-cover object-[50%_15%] sm:max-h-[520px] lg:max-h-[620px]"
          />
        </section>

        {/* ── Live crisis strip ──────────────────────────────── */}
        <Link
          to="/requests"
          className="group flex items-center gap-3 rounded-xl bg-[#FEE2E2] border border-[#FCA5A5] px-4 py-3 transition-colors hover:bg-[#FECACA]"
        >
          <span className="relative flex h-2.5 w-2.5 shrink-0">
            <span className="absolute inline-flex h-full w-full rounded-full bg-[#B91C1C] opacity-60 animate-ping" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#B91C1C]" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-[#B91C1C]">
              Active Monsoon &amp; Flood Alert
            </span>
            <span className="block truncate text-sm text-[#111827]">
              Southwestern basin overflowing
              {!loading && !offline && stats.districts > 0 && (
                <> • {stats.districts} district{stats.districts === 1 ? '' : 's'} critically impacted</>
              )}
            </span>
          </span>
          <Icon
            d="M9 5l7 7-7 7"
            className="w-5 h-5 shrink-0 text-[#B91C1C] transition-transform group-hover:translate-x-0.5"
          />
        </Link>

        {/* ── Headline figures ───────────────────────────────── */}
        <section className="grid grid-cols-2 divide-x divide-[#E5E7EB] rounded-xl bg-white border border-[#E5E7EB] py-4">
          <div className="px-4 text-center">
            <div className="text-[11px] text-[#6B7280]">Active Operations</div>
            <div className="mt-0.5 text-lg font-bold text-[#111827]">
              <StatValue loading={loading} offline={offline} value={stats.pledges} suffix="Relief Pledges" />
            </div>
          </div>
          <div className="px-4 text-center">
            <div className="text-[11px] text-[#6B7280]">Emergency Triage</div>
            <div className="mt-0.5 text-lg font-bold text-[#B91C1C]">
              <StatValue loading={loading} offline={offline} value={stats.pending} suffix="Pending" />
            </div>
          </div>
        </section>

        {offline && (
          <div className="rounded-lg border border-[#E5E7EB] bg-white px-4 py-2.5 text-center">
            <p className="text-[11px] text-[#6B7280]">
              Live figures unavailable — every emergency action below still works.
            </p>
            {diagnosis && (
              <p className="mt-0.5 text-[11px] text-[#9CA3AF]">
                <span className="font-medium text-[#6B7280]">{diagnosis.summary}</span>
                {diagnosis.fix && <> {diagnosis.fix}</>}
              </p>
            )}
          </div>
        )}

        {/* ── Primary calls to action ────────────────────────── */}
        <Link
          to="/request-aid"
          className="block rounded-xl bg-[#B91C1C] px-6 py-5 text-center text-white shadow-sm transition-colors hover:bg-[#7F1D1D] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B91C1C]"
        >
          <div className="flex items-center justify-center gap-2.5">
            <span className="rounded bg-white/20 px-1.5 py-0.5 text-[10px] font-black tracking-widest">
              SOS
            </span>
            <span className="font-serif text-xl font-bold">Request Emergency Relief</span>
          </div>
          <div className="mt-1 text-xs text-white/80">
            Targeted response within 2 hours • 24/7 hotline 117
          </div>
          <div className="mt-2.5 inline-block rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold">
            ⚡ Prioritised boat evacuation &amp; drinking water drop
          </div>
        </Link>

        <Link
          to="/donate"
          className="flex items-center gap-3 rounded-xl bg-[#C2410C] px-5 py-4 text-white shadow-sm transition-colors hover:bg-[#9A3412] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C2410C]"
        >
          <Icon d="M12 20.5S4 15.5 4 10a4 4 0 0 1 8-1.5A4 4 0 0 1 20 10c0 5.5-8 10.5-8 10.5Z" className="w-6 h-6 shrink-0" />
          <span className="min-w-0 flex-1">
            <span className="block font-semibold">Donate Supplies or Funds</span>
            <span className="block text-xs text-white/80">100% direct tracking • Zero overhead cuts</span>
          </span>
          <Icon d="M4 12h15m0 0-5.5-5.5M19 12l-5.5 5.5" className="w-5 h-5 shrink-0" />
        </Link>

        {/* ── Aid categories ─────────────────────────────────── */}
        <section aria-labelledby="aid-heading" className="pt-3">
          <div className="mb-3 flex items-end justify-between gap-4">
            <h2 id="aid-heading" className="font-serif text-lg font-bold text-[#111827]">
              Immediate Aid Requests
            </h2>
            <span className="text-[11px] text-[#6B7280]">Select type to flag need</span>
          </div>

          <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
            {AID_CATEGORIES.map(({ key, title, blurb, tint, icon }) => (
              <Link
                key={key}
                to={`/request-aid?category=${key}`}
                className="group rounded-xl bg-white border border-[#E5E7EB] p-3.5 transition-shadow hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B91C1C]"
              >
                <span className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${tint}`}>
                  <Icon d={icon} />
                </span>
                <div className="mt-2.5 text-sm font-semibold leading-snug text-[#111827] group-hover:text-[#B91C1C]">
                  {title}
                </div>
                <div className="mt-0.5 text-xs text-[#6B7280]">{blurb}</div>
              </Link>
            ))}
          </div>
        </section>

        {/* ── About + commitments ────────────────────────────── */}
        <section aria-labelledby="about-heading" className="rounded-2xl bg-[#EAEAEB] p-5 sm:p-6">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#B91C1C] text-white">
              <Icon d="M12 3.5 4.5 6.5v5c0 4.4 3.1 8.1 7.5 9 4.4-.9 7.5-4.6 7.5-9v-5L12 3.5Z" className="w-4 h-4" />
            </span>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#B91C1C]">
                Our Commitment
              </div>
              <h2 id="about-heading" className="font-serif text-lg font-bold text-[#111827]">
                About Help SriLanka
              </h2>
            </div>
          </div>

          <p className="mt-3 text-sm leading-relaxed text-[#374151]">
            Help SriLanka was founded during catastrophic monsoon flash floods to close the
            fatal gap between ground realities and disaster logistics. We unite local
            volunteer flotillas, religious charity centres, international diaspora donors,
            and tri-forces rescue command through one open, tamper-evident digital dispatch
            network.
          </p>

          <ul className="mt-4 grid grid-cols-1 gap-2.5 lg:grid-cols-3">
            {COMMITMENTS.map(({ title, body, icon }) => (
              <li key={title} className="rounded-xl bg-white p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-[#111827]">
                  <span className="text-[#B91C1C]">
                    <Icon d={icon} className="w-4 h-4" />
                  </span>
                  {title}
                </div>
                <p className="mt-1 text-xs leading-relaxed text-[#6B7280]">{body}</p>
              </li>
            ))}
          </ul>

          {/* Hotlines */}
          <div className="mt-5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">
              Emergency Disaster Hotlines
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
              {HOTLINE_CARDS.map(({ label, number, accent, lead }) => (
                <a
                  key={number}
                  href={`tel:${number}`}
                  className={`rounded-lg bg-white px-3 py-3 text-center transition-shadow hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B91C1C] ${
                    lead ? 'ring-1 ring-[#FCA5A5]' : ''
                  }`}
                >
                  <div className="text-[11px] text-[#6B7280]">{label}</div>
                  <div className={`font-serif text-xl font-bold ${accent}`}>{number}</div>
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* ── Closing links ──────────────────────────────────── */}
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 pt-1 text-xs text-[#6B7280]">
          <Link to="/requests" className="hover:text-[#B91C1C]">Aid Requests Board</Link>
          <Link to="/donations" className="hover:text-[#B91C1C]">Donations Board</Link>
          <Link to="/about" className="hover:text-[#B91C1C]">Guidelines</Link>
          <Link to="/feedback" className="hover:text-[#B91C1C]">Share Feedback</Link>
        </div>

        <p className="pb-2 text-center text-[11px] text-[#9CA3AF]">
          Built with Sri Lankan civic volunteers · Open Humanitarian Collective · 2024
        </p>
      </div>

      <MobileTabBar />
    </div>
  )
}
