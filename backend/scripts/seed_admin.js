require('dotenv').config();
const { seedAdminUser } = require('../src/shared/utils/seedAdmin');
const pool = require('../src/shared/config/db');

(async () => {
  try {
    await seedAdminUser();
    console.log('Admin seeding process complete.');
    process.exit(0);
  } catch (err) {
    console.error('Failed to seed admin:', err);
    process.exit(1);
  }
})();
