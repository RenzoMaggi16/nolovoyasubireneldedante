import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseService = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);
const supabaseAdmin = createClient(supabaseUrl, supabaseService);

async function run() {
  console.log("Testing with ANON key...");
  const { error: err1 } = await supabase.from('pedidos').insert({
    mesa_id: 'some-uuid-or-just-fail-validation', // it might fail due to FK before RLS, but let's test RLS
    total: 100,
    estado: 'pendiente'
  });
  console.log("Anon Error:", err1);

  console.log("Testing with ANON + usuario_id...");
  const { error: err2 } = await supabase.from('pedidos').insert({
    mesa_id: 'some-uuid-or-just-fail-validation',
    total: 100,
    estado: 'pendiente',
    usuario_id: 'some-uuid'
  });
  console.log("Anon+usuario_id Error:", err2);

  // Get a valid mesa_id for real test
  const { data: mesa } = await supabaseAdmin.from('mesas').select('id').limit(1).single();
  const mesaId = mesa ? mesa.id : null;

  if (mesaId) {
    const { error: err3 } = await supabase.from('pedidos').insert({
      mesa_id: mesaId,
      total: 100,
      estado: 'pendiente'
    });
    console.log("Real Mesa Anon Error:", err3);
    
    // Test with service role
    const { error: err4 } = await supabaseAdmin.from('pedidos').insert({
      mesa_id: mesaId,
      total: 100,
      estado: 'pendiente'
    });
    console.log("Service Role Error:", err4);
  }
}
run();
