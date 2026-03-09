const { runPendingMigrations } = require('../migrations/migration-service.js');
const { pool } = require('../config/db.js');

async function main() {
  const result = await runPendingMigrations();
  console.log(
    result.appliedCount > 0
      ? `Applied ${result.appliedCount} migration(s): ${result.appliedMigrations.join(', ')}`
      : 'No pending migrations.',
  );
}

main()
  .catch((error) => {
    console.error('Migration failed:', error.message || error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
