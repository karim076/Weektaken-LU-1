const mysql = require('mysql2/promise');

async function checkUsers() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root', 
    password: '',
    database: 'sakila'
  });
  
  try {
    console.log('🔍 Checking user_auth view...');
    const [rows] = await connection.query('SELECT * FROM user_auth LIMIT 10');
    console.log('Total users found:', rows.length);
    
    if (rows.length > 0) {
      rows.forEach(user => {
        console.log('User:', user.username, 'Type:', user.user_type, 'ID:', user.user_id);
      });
    }
    
    console.log('\n🔍 Checking for customer users...');
    const [customerRows] = await connection.query('SELECT * FROM user_auth WHERE user_type = ?', ['customer']);
    console.log('Customer users found:', customerRows.length);
    
    if (customerRows.length > 0) {
      customerRows.forEach(user => {
        console.log('Customer:', user.username, 'Email:', user.email, 'Active:', user.active);
      });
      
      // Test password voor eerste customer
      console.log('\n🔐 Testing password for first customer...');
      const bcrypt = require('bcrypt');
      const firstCustomer = customerRows[0];
      console.log('Testing customer:', firstCustomer.username);
      console.log('Stored password hash:', firstCustomer.password);
      
      // Test verschillende mogelijke wachtwoorden
      const testPasswords = ['password', 'test', '123456', 'customer', 'sakila'];
      for (const testPassword of testPasswords) {
        try {
          const isValid = await bcrypt.compare(testPassword, firstCustomer.password);
          if (isValid) {
            console.log('✅ Password "' + testPassword + '" works for', firstCustomer.username);
          }
        } catch (err) {
          console.log('❌ Error testing password "' + testPassword + '":', err.message);
        }
      }
    }
    
    console.log('\n🔍 Checking if user_auth view exists...');
    const [tables] = await connection.query('SHOW TABLES LIKE "user_auth"');
    console.log('user_auth table/view exists:', tables.length > 0);
    
    if (tables.length === 0) {
      console.log('\n❌ user_auth view does not exist! Checking customer table directly...');
      const [customerTable] = await connection.query('SELECT customer_id, username, email, first_name, last_name, active FROM customer WHERE username IS NOT NULL LIMIT 5');
      console.log('Direct customer table records:', customerTable.length);
      customerTable.forEach(customer => {
        console.log('Customer:', customer.username, 'Email:', customer.email, 'Name:', customer.first_name, customer.last_name);
      });
    }
    
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await connection.end();
  }
}

checkUsers();
