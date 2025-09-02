const express = require('express');
const router = express.Router();
const connection = require('../db');

router.get('/', (req, res) => {
  const sql = 'SELECT customer_id, first_name, last_name, email FROM customer LIMIT 50';
  connection.query(sql, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Database error');
    }
    res.render('customers', { customers: results });
  });
});

module.exports = router;
