// Quick database test
const databaseConfig = require('./src/config/database');

async function testDatabase() {
  try {
    const connection = await databaseConfig.getConnection();
    console.log('✅ Database connection successful');
    
    // Test basic query
    const [rows] = await connection.execute('SELECT 1 as test');
    console.log('✅ Database query successful:', rows[0]);
    
    // Test sakila database
    const [tables] = await connection.execute('SHOW TABLES');
    console.log('✅ Tables found:', tables.length);
    
    connection.release();
  } catch (error) {
    console.error('❌ Database test failed:', error.message);
  }
}

testDatabase();
