const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gncnhbxwfejdmpbenvdt.supabase.co';
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImduY25oYnh3ZmVqZG1wYmVudmR0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODUxMzM1MiwiZXhwIjoyMDk0MDg5MzUyfQ.dpquB1pdMKn4p3IJNX-AoaGv00zitr8Zgr-T8L3nteg';

const supabase = createClient(supabaseUrl, supabaseServiceRole);

async function inspectPedidos() {
  const { data, error } = await supabase.rpc('get_pedidos_columns').select('*').limit(1);
  if (error) {
    // try to just insert a dummy to see the error schema
    const { data: d2, error: e2 } = await supabase.from('pedidos').insert({ id: 'dummy' });
    console.log(e2);
  } else {
    console.log(data);
  }
}

inspectPedidos();
