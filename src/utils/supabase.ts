import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[Supabase] Missing environment variables (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY). '
    + 'Auth and database features will be disabled. '
    + 'Please create a .env file with the correct values.'
  )
}

/**
 * A no-op Supabase client that returns safe defaults when env vars are missing.
 * This prevents the entire app from crashing due to misconfiguration.
 */
function createSafeClient(): SupabaseClient {
  if (supabaseUrl && supabaseAnonKey) {
    return createClient(supabaseUrl, supabaseAnonKey)
  }

  // Return a proxy that logs warnings instead of crashing
  const warn = () => console.warn('[Supabase] Client is disabled — missing environment variables.')

  return new Proxy({} as SupabaseClient, {
    get(_target, prop) {
      // Allow certain safe properties through
      if (prop === 'then') return undefined // not a thenable
      warn()
      // Return a no-op function for method calls, or an empty object for nested access
      return new Proxy(() => Promise.resolve({ data: null, error: { message: 'Supabase is not configured' } }), {
        get() { return warn },
        apply() { return Promise.resolve({ data: null, error: { message: 'Supabase is not configured' } }) },
      })
    },
  })
}

export const supabase = createSafeClient()
