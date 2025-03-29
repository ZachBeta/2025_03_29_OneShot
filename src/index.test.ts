import { main } from './index';
import { GameLoop } from './systems/GameLoop';

// Prepare mock for later use
const mockGameLoopStart = jest.fn().mockResolvedValue(undefined);

// Mock dependencies
jest.mock('./systems/GameLoop', () => {
  return {
    GameLoop: jest.fn().mockImplementation(() => ({
      start: mockGameLoopStart
    }))
  };
});

// Mock process methods
const originalExit = process.exit;
// Use a safer approach to mock process.exit
process.exit = jest.fn() as unknown as typeof process.exit;

// Mock console methods
console.error = jest.fn();
console.clear = jest.fn();
console.log = jest.fn();

describe('Main Application', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  afterAll(() => {
    // Restore original process.exit
    process.exit = originalExit;
  });

  test('initializes and starts the game loop', async () => {
    await main();
    
    expect(GameLoop).toHaveBeenCalled();
    expect(mockGameLoopStart).toHaveBeenCalled();
    expect(process.exit).toHaveBeenCalledWith(0);
  });

  test('handles errors and exits with error code', async () => {
    // Set up the mock to reject on this call
    mockGameLoopStart.mockRejectedValueOnce(new Error('Test error'));
    
    await main();
    
    expect(console.error).toHaveBeenCalledWith('Unexpected error:', expect.any(Error));
    expect(console.clear).toHaveBeenCalled();
    expect(console.log).toHaveBeenCalledWith('An unexpected error occurred. The game will now exit.');
    expect(process.exit).toHaveBeenCalledWith(1);
  });

  // Test for exit handling setup
  test('sets up exit handling', async () => {
    // We can only verify that the handlers are registered
    // by checking if the process listeners increased
    const sigintListeners = process.listeners('SIGINT').length;
    const uncaughtExceptionListeners = process.listeners('uncaughtException').length;
    const unhandledRejectionListeners = process.listeners('unhandledRejection').length;
    
    await main();
    
    expect(process.listeners('SIGINT').length).toBeGreaterThan(sigintListeners);
    expect(process.listeners('uncaughtException').length).toBeGreaterThan(uncaughtExceptionListeners);
    expect(process.listeners('unhandledRejection').length).toBeGreaterThan(unhandledRejectionListeners);
  });
}); 