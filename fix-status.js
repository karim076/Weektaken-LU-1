const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixRentals() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  try {
    console.log('Fixing existing processing rentals...');
    
    const [result] = await connection.execute(`
      UPDATE rental 
      SET status = 'pending' 
      WHERE status = 'processing' 
      AND return_date IS NULL
    `);
    
    console.log(`Updated ${result.affectedRows} rentals from processing to pending`);
    
  } finally {
    await connection.end();
  }
}

fixRentals().catch(console.error).finally(() => process.exit(0));
