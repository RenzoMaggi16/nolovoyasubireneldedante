const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gncnhbxwfejdmpbenvdt.supabase.co';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImduY25oYnh3ZmVqZG1wYmVudmR0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODUxMzM1MiwiZXhwIjoyMDk0MDg5MzUyfQ.dpquB1pdMKn4p3IJNX-AoaGv00zitr8Zgr-T8L3nteg';
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(supabaseUrl, serviceKey);

async function testSelect() {
  const { data, error } = await supabase.from('pedidos').select('*, mesas(*), pedido_items(*, productos(*))').limit(1);
  console.log(data);
  console.log(error);
}

testSelect();
