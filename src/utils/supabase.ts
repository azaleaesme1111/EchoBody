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
 * Timeout wrapper — rejects if the promise doesn't resolve within `ms` milliseconds.
 */
export function withTimeout<T>(promise: Promise<T>, ms: number, label = 'Operation'): Promise<T> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(`${label} timed out after ${ms / 1000}s. Please check your network and try again.`)), ms)
  )
  return Promise.race([promise, timeout])
}

/**
 * Retry wrapper — retries once on failure (useful for Supabase cold-start recovery).
 */
export async function withRetry<T>(fn: () => Promise<T>, retries = 1, delayMs = 2000): Promise<T> {
  try {
    return await fn()
  } catch (err: any) {
    if (retries <= 0) throw err
    const isNetwork = err?.message?.includes('timed out') || err?.message?.includes('Failed to fetch') || err?.message?.includes('ERR_CONNECTION')
    if (isNetwork) {
      console.warn(`[Supabase] Network error, retrying in ${delayMs / 1000}s... (${err.message})`)
      await new Promise(r => setTimeout(r, delayMs))
      return fn()
    }
    throw err
  }
}

/**
 * A no-op Supabase client that returns safe defaults when env vars are missing.
 * This prevents the entire app from crashing due to misconfiguration.
 */
function createSafeClient(): SupabaseClient {
  if (supabaseUrl && supabaseAnonKey) {
    console.log('[Supabase] Client initializing — URL:', supabaseUrl)
    console.log('[Supabase] Anon key format:', supabaseAnonKey.slice(0, 20) + '...', `length: ${supabaseAnonKey.length}`)
    const client = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        fetch: (url, options = {}) => {
          return fetch(url, { ...options, signal: AbortSignal.timeout(15000) })
        },
      },
      auth: {
        autoRefreshToken: true,
        persistSession: true,
      },
    })
    console.log('[Supabase] Client created successfully (15s fetch timeout)')
    return client
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
