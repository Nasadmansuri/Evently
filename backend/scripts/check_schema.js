const pool = require('../src/shared/config/db');

async function inspect() {
  const [cols] = await pool.query('SHOW COLUMNS FROM events');
  console.log('Events columns:');
  cols.forEach(c => {
    if (['id', 'title', 'category', 'status'].includes(c.Field)) {
      console.log(`- ${c.Field}: ${c.Type} (Null: ${c.Null}, Default: ${c.Default})`);
    }
  });
  process.exit(0);
}
inspect();
