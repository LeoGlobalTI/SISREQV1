import { createClient } from '@supabase/supabase-js';
const SUPABASE_URL = 'https://giwyowsqmgwsaliiduqi.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_Owy6oQHM50c9v1tNp1PCPg_TTSNIger';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
async function run() {
    console.log("Getting users...");
    const { data: users } = await supabase.from('users').select('*');
    if (!users || users.length === 0) return console.log("No users");
    const user = users[users.length - 1]; // get the last user
    console.log("Attempting to delete:", user.id);
    const { data, error, count } = await supabase.from('users').delete().eq('id', user.id).select();
    console.log("Delete result:", { data, error, count });
}
run();
