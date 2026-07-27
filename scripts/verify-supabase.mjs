/**
 * Quick Supabase connectivity check. Run: node scripts/verify-supabase.mjs
 * Loads .env from project root (simple parse, no dotenv dep).
 */
import { readFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

function loadEnv() {
  try {
    const raw = readFileSync(resolve(root, '.env'), 'utf8');
    for (const line of raw.split('\n')) {
      const t = line.trim();
      if (!t || t.startsWith('#')) continue;
      const i = t.indexOf('=');
      if (i === -1) continue;
      const k = t.slice(0, i).trim();
      let v = t.slice(i + 1).trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1);
      }
      if (!process.env[k]) process.env[k] = v;
    }
  } catch {
    console.error('No .env file found at project root.');
    process.exit(1);
  }
}

const TABLES = [
  'profiles',
  'trend_records',
  'trend_snapshots',
  'trend_bookmarks',
  'queue_items',
  'user_connections',
];

loadEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !anonKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

console.log('Supabase URL:', url);
console.log('Checking connection...\n');

const anon = createClient(url, anonKey);
const { error: healthError } = await anon.from('profiles').select('id').limit(1);

if (healthError?.code === 'PGRST205' || healthError?.message?.includes('does not exist')) {
  console.log('Connected to Supabase, but schema not applied yet.');
  console.log('Run migrations 001 → 002 → 003 in Supabase SQL Editor.');
  console.log('See supabase/migrations/ folder.\n');
  process.exit(2);
}

if (healthError) {
  console.error('Anon client error:', healthError.message);
  process.exit(1);
}

console.log('Anon client: OK (profiles table reachable)\n');

if (serviceKey) {
  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
  console.log('Table check (service role):');
  for (const table of TABLES) {
    const { error } = await admin.from(table).select('*').limit(1);
    console.log(`  ${error ? 'MISSING' : 'OK'}  ${table}${error ? ` — ${error.message}` : ''}`);
  }
} else {
  console.log('SUPABASE_SERVICE_ROLE_KEY not set — skipping service role checks.');
}

console.log('\nSupabase connection verified.');
