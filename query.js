require('dotenv').config();
const mariadb = require('mariadb');
const url = new URL(process.env.DATABASE_URL);

const pool = mariadb.createPool({
  host: url.hostname,
  port: Number(url.port),
  user: url.username,
  password: url.password,
  database: url.pathname.replace(/^\//, ""),
  connectionLimit: 5,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query("SELECT 1 as val");
    console.log("Connection successful:", rows);
  } catch (err) {
    console.error("Connection failed:", err);
  } finally {
    if (conn) conn.end();
    pool.end();
  }
}
main();
