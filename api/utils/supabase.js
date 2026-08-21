const { createClient } = require('@supabase/supabase-js');

// Using the keys provided by the Supabase MCP
const supabaseUrl = 'https://leqvvgdwwllroqyknsvq.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxlcXZ2Z2R3d2xscm9xeWtuc3ZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcyNjc0OTcsImV4cCI6MjEwMjg0MzQ5N30.9gsmmDlPOBnSxI3-lEHDIjBy1RbqDgdmy1ASkbIjL_c';

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = { supabase };
