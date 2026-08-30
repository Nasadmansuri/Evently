const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// TiDB Cloud (and other managed MySQL providers) require SSL/TLS.
// The CA cert is a public certificate — safe to commit to git.
const sslCert = fs.readFileSync(path.join(__dirname, '../../../certs/tidb-ca.pem'));

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  dateStrings: true,
  ssl: {
    ca: sslCert,
    minVersion: 'TLSv1.2',
  },
});

module.exports = pool;