const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:CfN$Nc8jPfhuZkx@db.fbcmldzculgqddmnepxw.supabase.co:5432/postgres'
});

async function run() {
  try {
    await client.connect();
    console.log('Connected to DB');
    const res = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='users';
    `);
    console.log('Columns in users table:', res.rows.map(r => r.column_name));
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

run();
