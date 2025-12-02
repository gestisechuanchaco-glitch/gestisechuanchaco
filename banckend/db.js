const mysql = require('mysql2');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '123eRe456',
  database: 'DefensaCivilH',
  port: 3306
});

module.exports = {
  pool,           // para callbacks
  promise: pool.promise() // para promesas
};