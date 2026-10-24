const { execSync } = require('child_process');

if (process.env.DATABASE_URL) {
  try {
    console.log('DATABASE_URL detected. Synchronizing Prisma schema to database...');
    execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' });
    console.log('Database synchronization completed successfully.');
  } catch (error) {
    console.error('Database sync encountered an issue:', error.message);
  }
} else {
  console.log('Notice: DATABASE_URL environment variable is not defined yet.');
  console.log('Skipping prisma db push. Please configure DATABASE_URL in Vercel Project Settings.');
}
