const mysql = require('mysql2/promise');

async function fixRentalAmounts() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'sakila'
    });

    console.log('=== Fixing rental amounts ===');
    
    // Update all rental amounts with the actual film rental rates
    const [result] = await connection.execute(`
      UPDATE rental r
      JOIN inventory i ON r.inventory_id = i.inventory_id
      JOIN film f ON i.film_id = f.film_id
      SET r.amount = f.rental_rate
      WHERE r.amount = 0.00 OR r.amount IS NULL
    `);

    console.log(`Updated ${result.affectedRows} rental records with correct amounts`);

    // Verify the fix
    console.log('\n=== Sample rental data after fix (last 10) ===');
    const [rentals] = await connection.execute(`
      SELECT r.rental_id, r.amount, r.status, f.title, f.rental_rate 
      FROM rental r
      JOIN inventory i ON r.inventory_id = i.inventory_id
      JOIN film f ON i.film_id = f.film_id
      ORDER BY r.rental_id DESC 
      LIMIT 10
    `);
    
    rentals.forEach(rental => {
      console.log(`ID: ${rental.rental_id}, Amount: €${rental.amount}, Status: ${rental.status}, Film: ${rental.title}, Rate: €${rental.rental_rate}`);
    });

    console.log('\n=== Updated amount statistics ===');
    const [stats] = await connection.execute(`
      SELECT 
        COUNT(*) as total_rentals,
        COUNT(amount) as rentals_with_amount,
        ROUND(AVG(amount), 2) as avg_amount,
        MIN(amount) as min_amount,
        MAX(amount) as max_amount
      FROM rental
    `);
    console.log('Total rentals:', stats[0].total_rentals);
    console.log('Rentals with amount:', stats[0].rentals_with_amount);
    console.log('Average amount: €', stats[0].avg_amount);
    console.log('Min amount: €', stats[0].min_amount);
    console.log('Max amount: €', stats[0].max_amount);

    await connection.end();
    console.log('\n✅ Rental amounts successfully fixed!');
  } catch (error) {
    console.error('Error:', error.message);
  }
}

fixRentalAmounts();
