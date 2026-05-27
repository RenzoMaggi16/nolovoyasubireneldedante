const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://gncnhbxwfejdmpbenvdt.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImduY25oYnh3ZmVqZG1wYmVudmR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1MTMzNTIsImV4cCI6MjA5NDA4OTM1Mn0.IMh5XpZ9vECU1iWKh1xl0lsAXKVuwJQZgHu4dYqZads';
const supabaseServiceRole = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImduY25oYnh3ZmVqZG1wYmVudmR0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODUxMzM1MiwiZXhwIjoyMDk0MDg5MzUyfQ.dpquB1pdMKn4p3IJNX-AoaGv00zitr8Zgr-T8L3nteg';

const anonClient = createClient(supabaseUrl, supabaseAnonKey);
const serviceClient = createClient(supabaseUrl, supabaseServiceRole);

async function test() {
  const { data: catAnon, error: errAnon } = await anonClient.from('categorias').select('*');
  console.log('Anon categorias:', catAnon?.length, errAnon);

  const { data: catService, error: errService } = await serviceClient.from('categorias').select('*');
  console.log('Service categorias:', catService?.length, errService);

  const { data: prodAnon, error: errProdAnon } = await anonClient.from('productos').select('*');
  console.log('Anon productos:', prodAnon?.length, errProdAnon);

  const { data: prodService, error: errProdService } = await serviceClient.from('productos').select('*');
  console.log('Service productos:', prodService?.length, errProdService);
}

test();
