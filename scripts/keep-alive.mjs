// Keep-alive Supabase: menjalankan query ringan agar project tidak di-pause
// karena inaktivitas. Dipakai oleh GitHub Actions (lihat
// .github/workflows/keep-supabase-alive.yml).
import pg from 'pg';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL tidak di-set. Tambahkan sebagai GitHub Secret.');
  process.exit(1);
}

const client = new pg.Client({
  connectionString: url,
  ssl: { rejectUnauthorized: false },
});

try {
  await client.connect();
  const r = await client.query('SELECT now() AS ts, current_database() AS db');
  console.log('Keep-alive OK');
  console.log('  Database :', r.rows[0].db);
  console.log('  Waktu    :', r.rows[0].ts.toISOString());
} catch (err) {
  console.error('Keep-alive GAGAL:', err.message);
  process.exit(1);
} finally {
  await client.end();
}
