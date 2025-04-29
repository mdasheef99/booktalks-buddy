// This script runs the TypeScript sync script with proper path resolution
import { execSync } from 'child_process';

console.log('Starting profile sync process...');

try {
  // Run the TypeScript script with proper path resolution
  execSync('npx ts-node -r tsconfig-paths/register src/scripts/syncAllProfiles.ts', {
    stdio: 'inherit'
  });

  console.log('Profile sync completed successfully!');
} catch (error) {
  console.error('Error running sync script:', error.message);
  process.exit(1);
}
