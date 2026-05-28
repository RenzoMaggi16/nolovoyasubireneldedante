const url = "https://gncnhbxwfejdmpbenvdt.supabase.co/rest/v1/pedidos";
const anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImduY25oYnh3ZmVqZG1wYmVudmR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1MTMzNTIsImV4cCI6MjA5NDA4OTM1Mn0.IMh5XpZ9vECU1iWKh1xl0lsAXKVuwJQZgHu4dYqZads";

async function run() {
  try {
    // We need a valid mesa_id, let's just fetch one first
    const resMesa = await fetch("https://gncnhbxwfejdmpbenvdt.supabase.co/rest/v1/mesas?select=id&limit=1", {
      headers: { 'apikey': anonKey }
    });
    const mesas = await resMesa.json();
    const mesaId = mesas.length ? mesas[0].id : 1;

    console.log("Testing insert with Anon Key and NO usuario_id...");
    const res1 = await fetch(url, {
      method: 'POST',
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({ mesa_id: mesaId, total: 100, estado: 'pendiente' })
    });
    console.log(res1.status, await res1.text());

    console.log("Testing insert with Anon Key AND usuario_id...");
    const res2 = await fetch(url, {
      method: 'POST',
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({ mesa_id: mesaId, total: 100, estado: 'pendiente', usuario_id: "some-uuid" })
    });
    console.log(res2.status, await res2.text());

  } catch (err) {
    console.error(err);
  }
}
run();
