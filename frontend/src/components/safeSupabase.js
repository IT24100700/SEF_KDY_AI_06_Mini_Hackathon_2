/**
 * Defensive accessor for the shared Supabase client.
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
