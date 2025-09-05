const mysql = require('mysql2/promise');

async function checkRentalData() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'sakila'
    });

    console.log('=== Checking rental table schema ===');
    const [columns] = await connection.execute('DESCRIBE rental');
    columns.forEach(col => {
      console.log(`${col.Field}: ${col.Type} (${col.Null === 'YES' ? 'NULL' : 'NOT NULL'})`);
    });

    console.log('\n=== Sample rental data (last 10) ===');
    const [rentals] = await connection.execute(`
      SELECT r.rental_id, r.amount, r.status, f.title, f.rental_rate 
      FROM rental r
      JOIN inventory i ON r.inventory_id = i.inventory_id
      JOIN film f ON i.film_id = f.film_id
      ORDER BY r.rental_id DESC 
      LIMIT 10
    `);
    
    rentals.forEach(rental => {
      console.log(`ID: ${rental.rental_id}, Amount: ${rental.amount}, Status: ${rental.status}, Film: ${rental.title}, Rate: ${rental.rental_rate}`);
    });

    console.log('\n=== Amount statistics ===');
    const [stats] = await connection.execute(`
      SELECT 
        COUNT(*) as total_rentals,
        COUNT(amount) as rentals_with_amount,
        AVG(amount) as avg_amount,
        MIN(amount) as min_amount,
        MAX(amount) as max_amount
      FROM rental
    `);
    console.log('Total rentals:', stats[0].total_rentals);
    console.log('Rentals with amount:', stats[0].rentals_with_amount);
    console.log('Average amount:', stats[0].avg_amount);
    console.log('Min amount:', stats[0].min_amount);
    console.log('Max amount:', stats[0].max_amount);

    await connection.end();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkRentalData();
