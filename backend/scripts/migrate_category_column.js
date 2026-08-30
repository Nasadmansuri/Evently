const pool = require('../src/shared/config/db');

async function migrateCategory() {
  console.log('--- Migrating events.category to VARCHAR(100) ---');
  await pool.query(`ALTER TABLE events MODIFY COLUMN category VARCHAR(100) NOT NULL DEFAULT 'Technical'`);
  console.log('Column altered successfully.');

  // Fix Event 176 and any other blank category records
  await pool.query(`UPDATE events SET category = 'Hackathon' WHERE id = 176`);
  await pool.query(`UPDATE events SET category = 'Technical' WHERE category = '' OR category IS NULL`);
  
  const [sample] = await pool.query('SELECT id, title, category FROM events WHERE id = 176');
  console.log('Verified Event 176 in DB:', sample[0]);

  const [cols] = await pool.query('SHOW COLUMNS FROM events LIKE "category"');
  console.log('Updated Column Definition:', cols[0]);
  process.exit(0);
}

migrateCategory().catch(err => {
  console.error('Migration error:', err);
  process.exit(1);
});
