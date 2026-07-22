import { Client } from "pg";

async function run() {
  const client = new Client({
    connectionString: "postgresql://markt_user:VPMhQ92b6mSCKmeRcwfkryBG6zI9DT0A@dpg-d92p9ipkh4rs738s0sm0-a.virginia-postgres.render.com/markt",
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();
  const { rows } = await client.query('SELECT * FROM "User" WHERE cpf = \'64290840434\'');
  console.log(rows[0]);
  await client.end();
}

run();
