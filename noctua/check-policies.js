const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://gncnhbxwfejdmpbenvdt.supabase.co';
const supabaseServiceRole = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImduY25oYnh3ZmVqZG1wYmVudmR0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODUxMzM1MiwiZXhwIjoyMDk0MDg5MzUyfQ.dpquB1pdMKn4p3IJNX-AoaGv00zitr8Zgr-T8L3nteg';
const serviceClient = createClient(supabaseUrl, supabaseServiceRole);

async function checkPolicies() {
  const { data, error } = await serviceClient.from('pg_policies').select('*');
  console.log(data, error);
}

checkPolicies();
