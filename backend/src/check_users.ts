import { Client } from 'pg';
async function run() {
  const source = new Client({ connectionString: 'postgresql://markt_user:VPMhQ92b6mSCKmeRcwfkryBG6zI9DT0A@dpg-d92p9ipkh4rs738s0sm0-a.virginia-postgres.render.com/markt', ssl: { rejectUnauthorized: false } });
  await source.connect();
  const res = await source.query('SELECT id, cpf, name FROM "User"');
  console.log('--- Render DB ---');
  console.table(res.rows);
  await source.end();
  
  const target = new Client({ connectionString: 'postgresql://postgres:LqyitzUmfrxpHyjYODsGjQGEHEyZTeyV@postgres.railway.internal:5432/railway' });
  await target.connect();
  const resTarget = await target.query('SELECT id, cpf, name FROM "User"');
  console.log('--- Railway DB ---');
  console.table(resTarget.rows);
  await target.end();
}
run().catch(console.error);
