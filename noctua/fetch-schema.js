const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gncnhbxwfejdmpbenvdt.supabase.co';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImduY25oYnh3ZmVqZG1wYmVudmR0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODUxMzM1MiwiZXhwIjoyMDk0MDg5MzUyfQ.dpquB1pdMKn4p3IJNX-AoaGv00zitr8Zgr-T8L3nteg';

async function fetchSchema() {
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/?apikey=${serviceKey}`);
    const data = await res.json();
    
    // In OpenAPI v2 it's definitions, in v3 it's components.schemas
    const schemas = data.definitions || (data.components && data.components.schemas) || data;
    
    if (schemas && schemas.pedidos) {
      console.log("pedidos columns:", Object.keys(schemas.pedidos.properties));
    } else {
      console.log("pedidos not found in schemas. Available tables:", Object.keys(schemas));
    }
    
    if (schemas && schemas.pedido_items) {
      console.log("pedido_items columns:", Object.keys(schemas.pedido_items.properties));
    }
  } catch (err) {
    console.error("Error fetching schema:", err);
  }
}

fetchSchema();
