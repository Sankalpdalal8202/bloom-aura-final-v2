// ---------------------------------------------------------------------------
// SUPABASE CONNECTION TEST
// ---------------------------------------------------------------------------
// Run with:   npm run test:supabase
//
// This is a one-off developer check, not part of the website. It proves the
// chain: this script -> Supabase client -> your Supabase database is wired
// up correctly, by reading VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY from
// .env.local and querying the "garlands" table created by supabase/schema.sql.
//
// It does not modify any data. Safe to run as many times as you like.
// ---------------------------------------------------------------------------

import { readFileSync, existsSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'

function loadEnvLocal() {
  const path = '.env.local'
  if (!existsSync(path)) {
    console.error(`\n❌ Could not find ${path} in the project root.`)
    console.error('   Copy .env.example to .env.local and fill in your Supabase values first.\n')
    process.exit(1)
  }

  const contents = readFileSync(path, 'utf-8')
  const env = {}
  for (const line of contents.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    const value = trimmed.slice(eq + 1).trim()
    env[key] = value
  }
  return env
}

async function main() {
  const env = loadEnvLocal()
  const url = env.VITE_SUPABASE_URL
  const key = env.VITE_SUPABASE_ANON_KEY

  if (!url || !key) {
    console.error('\n❌ VITE_SUPABASE_URL and/or VITE_SUPABASE_ANON_KEY are empty in .env.local.')
    console.error('   Open .env.local and paste in the values from your Supabase project settings.\n')
    process.exit(1)
  }

  console.log('\n🔌 Connecting to Supabase...')
  const supabase = createClient(url, key)

  const { data, error, count } = await supabase
    .from('garlands')
    .select('id, name, published', { count: 'exact' })
    .limit(5)

  if (error) {
    console.error('\n❌ Connected to Supabase, but the query failed.')
    console.error(`   Error: ${error.message}`)
    if (error.message.includes('relation "public.garlands" does not exist')) {
      console.error('   → It looks like the schema hasn\'t been created yet.')
      console.error('   → Open the Supabase SQL Editor and run supabase/schema.sql.')
    }
    console.error('')
    process.exit(1)
  }

  console.log('✅ Success! React ↔ Supabase client ↔ Supabase database is working.')
  console.log(`   Table "garlands" currently has ${count ?? 0} row(s).`)
  if (data && data.length > 0) {
    console.log('   Sample rows:')
    for (const row of data) {
      console.log(`     - ${row.name} (published: ${row.published})`)
    }
  } else {
    console.log('   The table is empty — that\'s expected until the Admin Panel is built.')
  }
  console.log('')
}

main()
