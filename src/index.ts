/**
 * SLOP_RUNNER - A cyberpunk card game inspired by Netrunner
 * Main entry point
 */

console.log('SLOP_RUNNER initializing...');

const main = async () => {
  try {
    console.log('Welcome to SLOP_RUNNER v0.1-alpha');
    // TODO: Initialize game components
    // TODO: Start game loop
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
};

// Run the main function if this file is executed directly
if (require.main === module) {
  main().catch(err => {
    console.error('Unhandled error:', err);
    process.exit(1);
  });
}

export default main; 