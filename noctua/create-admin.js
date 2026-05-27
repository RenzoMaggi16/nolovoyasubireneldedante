const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gncnhbxwfejdmpbenvdt.supabase.co';
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImduY25oYnh3ZmVqZG1wYmVudmR0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODUxMzM1MiwiZXhwIjoyMDk0MDg5MzUyfQ.dpquB1pdMKn4p3IJNX-AoaGv00zitr8Zgr-T8L3nteg';

const supabase = createClient(supabaseUrl, supabaseServiceRole);

async function createAdminUser() {
  console.log("Creating admin user...");
  const { data, error } = await supabase.auth.admin.createUser({
    email: 'admin@noctua.local',
    password: '1234',
    email_confirm: true
  });

  if (error) {
    console.error("Error creating user:", error);
  } else {
    console.log("Admin user created successfully in Supabase Auth:", data.user.id);
    
    // Check if the user exists in 'usuarios' table and update their auth_id if needed
    const { data: userData, error: userError } = await supabase
      .from('usuarios')
      .select('*')
      .eq('username', 'admin')
      .single();
      
    if (userData) {
      console.log("Updating admin auth_id in usuarios table to:", data.user.id);
      await supabase.from('usuarios').update({ auth_id: data.user.id }).eq('id', userData.id);
    } else {
      console.log("Admin user not found in usuarios table, creating...");
      await supabase.from('usuarios').insert({
        auth_id: data.user.id,
        nombre: 'Administrador',
        username: 'admin',
        rol: 'admin',
        activo: true
      });
    }
  }
}

createAdminUser();
