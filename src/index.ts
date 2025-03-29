import { GameLoop } from './systems/GameLoop';

/**
 * SLOP_RUNNER - A cyberpunk card game inspired by Netrunner
 * Main entry point
 */

console.log('SLOP_RUNNER initializing...');

/**
 * Main application entry point
 */
async function main() {
  try {
    // Set up graceful exit handling
    setupExitHandling();
    
    // Create and start the game loop
    const gameLoop = new GameLoop();
    await gameLoop.start();
    
    // Exit cleanly when game is finished
    process.exit(0);
  } catch (error) {
    console.error('Unexpected error:', error);
    
    // Clean up terminal state
    console.clear();
    console.log('An unexpected error occurred. The game will now exit.');
    
    // Exit with error code
    process.exit(1);
  }
}

/**
 * Sets up handlers for graceful shutdown
 */
function setupExitHandling() {
  // Handle Ctrl+C
  process.on('SIGINT', () => {
    console.clear();
    console.log('Game terminated by user.');
    process.exit(0);
  });
  
  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    console.clear();
    console.error('Uncaught exception:', error);
    process.exit(1);
  });
  
  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason) => {
    console.clear();
    console.error('Unhandled promise rejection:', reason);
    process.exit(1);
  });
}

// Start the application
if (require.main === module) {
  main();
}

// Export for testing
export { main }; 