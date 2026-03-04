const { runPendingMigrations, runSeedCatalogMigration } = require('../migrations/migration-service.js');
const { pool } = require('../config/db.js');

async function main() {
  await runPendingMigrations();
  const result = await runSeedCatalogMigration();
  console.log(result.message);
  console.log(`Catalog models available: ${result.createdModels}`);
  console.log(`Catalog rings available: ${result.createdRings}`);
}

main()
  .catch((error) => {
    console.error('Seed migration failed:', error.message || error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
