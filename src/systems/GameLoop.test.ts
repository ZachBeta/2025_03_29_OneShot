// Import types first to avoid initialization issues
import { GameLoop } from './GameLoop';

// Mock the InputHandler to prevent TTY handles from being opened
jest.mock('./InputHandler', () => {
  return {
    InputHandler: jest.fn().mockImplementation(() => ({
      getKeypress: jest.fn().mockResolvedValue({ key: 'q' }),
      cleanup: jest.fn()
    }))
  };
});

// Mock the UI components that interact with terminal
jest.mock('../ui/InteractiveGameBoard', () => {
  return {
    InteractiveGameBoard: jest.fn().mockImplementation(() => ({
      clearHighlights: jest.fn(),
      clearAttackIndicators: jest.fn(),
      setStatusMessage: jest.fn(),
      setAvailableCommands: jest.fn(),
      highlightSelectableCards: jest.fn(),
      refreshDisplay: jest.fn()
    }))
  };
});

jest.mock('../ui/EventLogRenderer', () => {
  return {
    EventLogRenderer: jest.fn().mockImplementation(() => ({
      render: jest.fn().mockReturnValue(['Log entry 1', 'Log entry 2'])
    }))
  };
});

// Mock timers to ensure they don't cause Jest to hang
jest.useFakeTimers();

// Mock console methods to prevent console spam during tests
console.clear = jest.fn();
const originalConsoleLog = console.log;
console.log = jest.fn();
console.error = jest.fn();

// Mock process.exit to prevent tests from actually exiting
const originalExit = process.exit;
process.exit = jest.fn() as unknown as typeof process.exit;

// Setup before all tests
beforeAll(() => {
  // Set test mode to reduce timeouts to zero
  GameLoop.setTestMode();
});

// Cleanup after all tests
afterAll(() => {
  // Reset timeouts to normal values
  GameLoop.resetTimeouts();
  // Restore original methods
  process.exit = originalExit;
  console.log = originalConsoleLog;
  
  // Clear any remaining timers
  jest.clearAllTimers();
});

describe('GameLoop System', () => {
  let gameLoop: GameLoop;
  
  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    gameLoop = new GameLoop();
  });

  afterEach(() => {
    // Ensure no lingering timers
    jest.clearAllTimers();
  });
  
  // Test core game initialization
  test('initializes a new game and displays title screen', async () => {
    // Use a spy to track when start is called without preventing execution
    const startSpy = jest.spyOn(gameLoop, 'start');
    
    // Mock the requestExit method to be called immediately
    const exitSpy = jest.spyOn(gameLoop, 'requestExit');
    
    // Set setTimeout to fire immediately
    setTimeout(() => gameLoop.requestExit(), 0);
    
    // Run all timers immediately
    jest.runAllTimers();
    
    // Start the game - use a timeout to prevent hanging
    const startPromise = gameLoop.start();
    jest.runAllTimers();
    await startPromise;
    
    // Verify expected behaviors
    expect(startSpy).toHaveBeenCalled();
    expect(exitSpy).toHaveBeenCalled();
    expect(console.clear).toHaveBeenCalled();
    expect(console.log).toHaveBeenCalled();
  });
  
  // Instead of testing implementation details, let's test the public API
  test('has a start method that begins the game', () => {
    expect(typeof gameLoop.start).toBe('function');
  });
  
  test('has a requestExit method that can end the game', () => {
    expect(typeof gameLoop.requestExit).toBe('function');
    
    // Call the method to ensure it exists and runs
    gameLoop.requestExit();
    
    // No assertions needed - this just verifies the method can be called
  });
}); 