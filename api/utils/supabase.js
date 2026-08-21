const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://leqvvgdwwllroqyknsvq.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY;

// Don't throw synchronously on require, let it be handled gracefully
const supabase = supabaseKey 
    ? createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } }) 
    : null;

module.exports = { 
    supabase,
    checkSupabase: () => {
        if (!supabase) throw new Error('Supabase is not configured (missing SUPABASE_ANON_KEY). Please add it in Vercel settings and redeploy.');
        return supabase;
    }
};
