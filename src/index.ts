import { GameLoop } from './systems/GameLoop';

/**
 * SLOP_RUNNER - A cyberpunk card game inspired by Netrunner
 * Main entry point for web version
 */

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
    try {
        // Create and start the game
        const game = new GameLoop();
        game.start();
    } catch (error) {
        console.error('Failed to start game:', error);
        // Display error to user
        const container = document.getElementById('game-container');
        if (container) {
            container.innerHTML = `
                <div class="error-message">
                    <h2>Error Starting Game</h2>
                    <p>${error instanceof Error ? error.message : 'Unknown error occurred'}</p>
                </div>
            `;
        }
    }
}); 