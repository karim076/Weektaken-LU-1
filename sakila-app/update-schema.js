const db = require('./src/config/database');

(async () => {
  try {
    console.log('Checking rental table schema...');
    
    // Check if status column exists
    const columns = await db.query('SHOW COLUMNS FROM rental WHERE Field = "status"');
    if (columns.length === 0) {
      console.log('Adding status column to rental table...');
      await db.query('ALTER TABLE rental ADD COLUMN status ENUM("pending", "paid", "rented", "returned") DEFAULT "pending" AFTER return_date');
      console.log('✅ Status column added successfully');
    } else {
      console.log('✅ Status column already exists');
    }
    
    // Check if amount column exists  
    const amountColumns = await db.query('SHOW COLUMNS FROM rental WHERE Field = "amount"');
    if (amountColumns.length === 0) {
      console.log('Adding amount column to rental table...');
      await db.query('ALTER TABLE rental ADD COLUMN amount DECIMAL(5,2) DEFAULT 0.00 AFTER status');
      console.log('✅ Amount column added successfully');
    } else {
      console.log('✅ Amount column already exists');
    }
    
    // Update existing rentals to have proper status
    const updateReturned = await db.query('UPDATE rental SET status = "returned" WHERE return_date IS NOT NULL AND (status = "pending" OR status IS NULL)');
    console.log(`✅ Updated ${updateReturned.affectedRows} returned rentals`);
    
    const updateRented = await db.query('UPDATE rental SET status = "rented" WHERE return_date IS NULL AND (status = "pending" OR status IS NULL)');  
    console.log(`✅ Updated ${updateRented.affectedRows} active rentals`);
    
    // Show updated schema
    const finalSchema = await db.query('DESCRIBE rental');
    console.log('\n📋 Final rental table schema:');
    console.table(finalSchema);
    
    console.log('\n🎉 Database schema updated successfully!');
  } catch (err) {
    console.error('❌ Error:', err);
  }
  process.exit();
})();
