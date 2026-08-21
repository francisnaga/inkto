const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://leqvvgdwwllroqyknsvq.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY;

let supabase = null;
if (supabaseKey) {
    try {
        supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });
    } catch (err) {
        console.error('Supabase init error:', err);
    }
}

module.exports = { 
    supabase,
    checkSupabase: () => {
        if (!supabase) throw new Error('Supabase is not configured (missing SUPABASE_ANON_KEY). Please add it in Vercel settings and redeploy.');
        return supabase;
    }
};
