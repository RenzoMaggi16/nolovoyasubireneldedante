const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://gncnhbxwfejdmpbenvdt.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImduY25oYnh3ZmVqZG1wYmVudmR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1MTMzNTIsImV4cCI6MjA5NDA4OTM1Mn0.IMh5XpZ9vECU1iWKh1xl0lsAXKVuwJQZgHu4dYqZads';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  console.log('Probando conexión con Supabase...');
  const { data, error } = await supabase.from('usuarios').select('count', { count: 'exact', head: true });
  
  if (error) {
    console.error('❌ Error de conexión:', error.message);
    if (error.message.includes('Invalid API key')) {
      console.error('👉 La clave ANON_KEY parece ser inválida.');
    }
    if (error.message.includes('Failed to fetch') || error.code === 'ENOTFOUND') {
      console.error('👉 La URL de Supabase parece ser incorrecta o el proyecto está pausado.');
    }
  } else {
    console.log('✅ Conexión exitosa. La tabla "usuarios" es accesible.');
  }
}

testConnection();
