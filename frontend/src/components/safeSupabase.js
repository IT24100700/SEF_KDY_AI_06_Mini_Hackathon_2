/**
 * Defensive accessor for the shared Supabase client, plus error
 * translation for the failures this project actually hits.
 *
 * `src/lib/supabaseClient.js` is a locked global file (AGENTS.md) and
 * `createClient()` throws at *module evaluation* time when
 * VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are absent. A static
 * `import` of it therefore takes the entire React tree down with a white
 * screen on any machine that has not copied `.env.example` to `.env`.
 *
 * The landing page must render for everyone, so we import it lazily and
 * swallow that failure — callers get `null` and fall back to a
 * degraded-but-usable view.
 *
 * NOTE: this file is intentionally identical on the `Landing` and
 * `Feedback` branches so both merge into `main` without conflicts.
 */

let cached

/** @returns {Promise<import('@supabase/supabase-js').SupabaseClient | null>} */
export async function getSupabase() {
  if (cached !== undefined) return cached
  try {
    const mod = await import('../lib/supabaseClient')
    cached = mod.supabase ?? null
  } catch {
    cached = null
  }
  return cached
}

/** Marker thrown by callers when getSupabase() returned null. */
export const NOT_CONFIGURED = 'HELPSRILANKA_NOT_CONFIGURED'

/**
 * Turn a Supabase/Postgrest error into something a teammate can act on.
 *
 * Every data path in this app degrades gracefully, which is right for a
 * disaster tool but hides *why* it degraded. This maps the handful of
 * failures that actually come up during setup to a concrete next step.
 *
 * @param {unknown} error
 * @param {string} [table] table being queried, for a sharper message
 * @returns {{ summary: string, fix: string | null, code: string | null }}
 */
export function describeSupabaseError(error, table) {
  const code = error?.code ?? null
  const raw = String(error?.message ?? error ?? '')
  const named = table ? `\`${table}\`` : 'that table'

  if (raw.includes(NOT_CONFIGURED) || raw.includes('supabaseUrl is required')) {
    return {
      code,
      summary: 'Supabase is not configured.',
      fix: 'Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to frontend/.env, then restart the dev server.',
    }
  }

  // Table missing — PostgREST reports PGRST205, Postgres reports 42P01.
  if (code === 'PGRST205' || code === '42P01' || /does not exist|schema cache/i.test(raw)) {
    return {
      code,
      summary: `The ${named} table does not exist.`,
      fix: 'Run db/feedback.sql in the Supabase dashboard: SQL Editor → New query → Run.',
    }
  }

  // Row-level security refused the operation.
  if (code === '42501' || /row-level security|violates row level/i.test(raw)) {
    return {
      code,
      summary: `Row-level security blocked access to ${named}.`,
      fix: 'Re-run the policy statements at the bottom of db/feedback.sql.',
    }
  }

  // A check constraint rejected the row.
  if (code === '23514') {
    return {
      code,
      summary: 'The database rejected these values.',
      fix: 'A check constraint failed — rating must be 1-5 and the message 10-1000 characters.',
    }
  }

  if (/invalid api key|jwt|401|apikey/i.test(raw)) {
    return {
      code,
      summary: 'Supabase rejected the API key.',
      fix: 'Re-copy the anon / publishable key from Project Settings → API into frontend/.env.',
    }
  }

  if (/failed to fetch|networkerror|load failed/i.test(raw)) {
    return {
      code,
      summary: 'Could not reach Supabase.',
      fix: 'Check VITE_SUPABASE_URL is the full https:// project URL, and that you are online.',
    }
  }

  return { code, summary: raw || 'Unknown error talking to Supabase.', fix: null }
}
