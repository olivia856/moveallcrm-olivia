require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

async function check() {
    // try to get users
    const { data, error } = await supabase.from('users').select('*').limit(1);
    if (error) {
        console.error("Error fetching users:", error);
    } else {
        console.log("Users schema:");
        if (data && data.length > 0) {
            console.log(Object.keys(data[0]));
        } else {
            console.log("No users found to inspect.");
        }
    }
}
check();
