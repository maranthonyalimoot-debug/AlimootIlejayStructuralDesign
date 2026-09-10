// ---- Supabase project connection ----
// The publishable key is safe to expose client-side: access to real data is
// enforced by Row Level Security on the `leads`/`tasks` tables (see the
// alimo-ot-ilejay-crm migrations), keyed to specific allowed email addresses.
const SUPABASE_URL = 'https://kmuumscddwxivgaqkpku.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_NM1PHH4ARvHLfGp00ISDqA_dC_zZX3n';

const sb = supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
