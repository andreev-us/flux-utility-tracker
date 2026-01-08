import { createBrowserClient } from '@supabase/ssr'
import type { Database } from './database.types'

let supabaseClient: ReturnType<typeof createBrowserClient<Database>> | null = null

export function createClient() {
  // Return cached client if available
  if (supabaseClient) {
    return supabaseClient
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  // Support both naming conventions for the anon key
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  
  if (!url || !anonKey) {
    console.warn('[Supabase] Missing environment variables. Running in demo mode.', { 
      url: !!url, 
      anonKey: !!anonKey,
    })
    // Return a mock client that will fail gracefully
    // The app will work in demo mode with sample data
  }
  
  // Create client even with missing vars - it will fail gracefully on API calls
  supabaseClient = createBrowserClient<Database>(
    url || 'https://placeholder.supabase.co',
    anonKey || 'placeholder-key'
  )
  
  return supabaseClient
}

// Check if Supabase is properly configured
export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  return Boolean(url && anonKey)
}
