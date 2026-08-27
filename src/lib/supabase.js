// ---------------------------------------------------------------------------
// SUPABASE CLIENT
// ---------------------------------------------------------------------------
// One shared Supabase client for the whole app. Credentials are never
// hard-coded here — they are read from environment variables that Vite
// injects at build/dev time from .env.local (see .env.example).
//
// This file only exports the client connection itself. It intentionally
// does NOT contain any garland/order/review query functions yet — those
// will be added in later phases once the Admin Panel and public pages are
// ready to use them. For now this is just the foundation.
// ---------------------------------------------------------------------------

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

const isConfigured = Boolean(supabaseUrl && supabaseAnonKey)

if (!isConfigured) {
  // This only logs a warning (does not crash the app) so the existing
  // Phase 1 website keeps working even before Supabase is configured.
  console.warn(
    '[Supabase] VITE_SUPABASE_URL and/or VITE_SUPABASE_ANON_KEY are missing. ' +
      'Copy .env.example to .env.local and fill in your project values. ' +
      'The website will still run, but any Supabase calls will fail until this is set.'
  )
}

// createClient() validates that the URL is well-formed and throws
// synchronously if it isn't — which would crash the entire app on load
// before .env.local is filled in. Falling back to a syntactically valid
// placeholder URL keeps the client construction safe; real calls made with
// it will simply fail at request time, which the rest of the app already
// handles (public pages fall back to sample data, admin screens show a
// friendly error).
export const supabase = createClient(
  isConfigured ? supabaseUrl : 'https://placeholder.supabase.co',
  isConfigured ? supabaseAnonKey : 'placeholder-anon-key'
)
