const mysql = require('mysql2');

const connection = mysql.createConnection({
  host: 'localhost',     // (Default)
  user: 'root',          // pas aan naar jouw MySQL user (Default)
  password: '', // pas aan naar jouw MySQL wachtwoord (wachtwoord die je heb gemaakt bij MySQL installatie)
  database: 'sakila'     // pas aan naar je eigen database naam. (het moet wel matchen)
});
// Verwijder de . achter de db om het werkend te krijgen. (!BELANGERIJK!)

module.exports = connection;
