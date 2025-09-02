const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /customers → lijst van klanten
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT customer_id, first_name, last_name, email FROM customer LIMIT 50'
    );
    res.render('customers', { customers: rows });
  } catch (err) {
    console.error(err);
    res.status(500).send('Database error');
  }
});

module.exports = router;
