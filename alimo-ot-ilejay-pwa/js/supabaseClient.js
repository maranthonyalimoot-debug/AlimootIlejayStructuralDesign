// ---- Supabase project connection (public site) ----
// Same project/key as admin/js/supabaseClient.js. Safe to expose client-side:
// the `inquiries` table only grants anonymous INSERT via Row Level Security —
// no read/update/delete — so this key can't be used to see or change data.
const SUPABASE_URL = 'https://kmuumscddwxivgaqkpku.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_NM1PHH4ARvHLfGp00ISDqA_dC_zZX3n';

const sb = supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
