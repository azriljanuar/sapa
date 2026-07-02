const mariadb = require('mariadb');
const pool = mariadb.createPool({
  host: 'localhost', 
  user: 'root', 
  password: '',
  database: 'sapa',
  connectionLimit: 5
});

async function main() {
  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query("SELECT email, role, password FROM User");
    console.log(rows);
  } catch (err) {
    throw err;
  } finally {
    if (conn) return conn.end();
  }
}
main();
