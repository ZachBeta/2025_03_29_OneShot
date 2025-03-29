import { HelpSystem } from './HelpSystem';
import { GameState } from '../models/GameState';
import { PhaseType, PlayerType } from '../models/types';
import { clearScreen, createScreenBuffer, renderToBuffer, drawBox, cyberpunkStyle } from './TerminalUtils';

// Mock TerminalUtils functions
jest.mock('./TerminalUtils', () => ({
  clearScreen: jest.fn(),
  createScreenBuffer: jest.fn().mockImplementation((width, height) => {
    return Array(height).fill(0).map(() => Array(width).fill(' '));
  }),
  renderToBuffer: jest.fn(),
  renderBufferToTerminal: jest.fn(),
  drawBox: jest.fn(),
  cyberpunkStyle: jest.fn().mockImplementation((text) => text)
}));

// Mock process.stdin for waitForHelpInput
const originalStdin = process.stdin;
const mockStdin = {
  setRawMode: jest.fn(),
  resume: jest.fn(),
  on: jest.fn(),
  removeListener: jest.fn()
};

// Mock console.log
console.log = jest.fn();

describe('HelpSystem', () => {
  let helpSystem: HelpSystem;
  let mockGameState: GameState;
  
  beforeEach(() => {
    jest.clearAllMocks();
    helpSystem = new HelpSystem();
    
    // Create a basic mock GameState
    mockGameState = {
      turn: 1,
      phase: PhaseType.MAIN,
      activePlayer: PlayerType.RUNNER,
      gameOver: false,
      runner: {
        deck: [],
        hand: [],
        field: [],
        npuAvailable: 2,
        npuTotal: 2
      },
      corp: {
        deck: [],
        hand: [],
        field: [],
        npuAvailable: 2,
        npuTotal: 2,
        core: {
          maxHp: 10,
          currentHp: 10
        }
      },
      eventLog: []
    };
    
    // Mock process.stdin
    Object.defineProperty(process, 'stdin', {
      value: mockStdin,
      writable: true
    });
  });
  
  afterAll(() => {
    // Restore process.stdin
    Object.defineProperty(process, 'stdin', {
      value: originalStdin,
      writable: true
    });
  });
  
  test('getContextHelp returns phase-specific help content', () => {
    // Test for each phase
    const phases = [PhaseType.DRAW, PhaseType.NPU, PhaseType.MAIN, PhaseType.COMBAT];
    
    for (const phase of phases) {
      mockGameState.phase = phase;
      const help = helpSystem.getContextHelp(mockGameState);
      
      expect(help).toBeDefined();
      expect(help.title).toContain(phase);
      expect(help.content.length).toBeGreaterThan(0);
    }
  });
  
  test('displayHelpOverlay renders help content', () => {
    helpSystem.displayHelpOverlay(mockGameState);
    
    // Verify screen was cleared
    expect(clearScreen).toHaveBeenCalled();
    
    // Verify buffer was created
    expect(createScreenBuffer).toHaveBeenCalled();
    
    // Verify content was rendered
    expect(renderToBuffer).toHaveBeenCalled();
    
    // Verify box was drawn
    expect(drawBox).toHaveBeenCalled();
    
    // Verify output was logged
    expect(console.log).toHaveBeenCalled();
  });
  
  test('displayHelpOverlay renders different content based on page number', () => {
    // Create spies to detect which help content is rendered
    const contextHelpSpy = jest.spyOn(helpSystem, 'getContextHelp');
    
    // Clear mock call history
    (console.log as jest.Mock).mockClear();
    
    // First page should show context help
    helpSystem.displayHelpOverlay(mockGameState, 1);
    expect(contextHelpSpy).toHaveBeenCalled();
    
    // Clear mock call history
    (console.log as jest.Mock).mockClear();
    contextHelpSpy.mockClear();
    
    // Second page should not call getContextHelp 
    helpSystem.displayHelpOverlay(mockGameState, 2);
    expect(contextHelpSpy).not.toHaveBeenCalled();
    
    // Clear mock call history
    (console.log as jest.Mock).mockClear();
    
    // Third page should also not call getContextHelp
    helpSystem.displayHelpOverlay(mockGameState, 3);
    expect(contextHelpSpy).not.toHaveBeenCalled();
  });
  
  test('waitForHelpInput returns null on escape', async () => {
    // Setup mock to trigger escape key
    const mockListener = jest.fn();
    mockStdin.on.mockImplementation((event, listener) => {
      mockListener.mockReturnValue(listener);
      // Immediately call the listener with ESC key
      listener('', { name: 'escape', ctrl: false });
      return mockStdin;
    });
    
    const result = await helpSystem.waitForHelpInput();
    
    expect(mockStdin.setRawMode).toHaveBeenCalledWith(true);
    expect(mockStdin.resume).toHaveBeenCalled();
    expect(mockStdin.on).toHaveBeenCalledWith('keypress', expect.any(Function));
    expect(mockStdin.removeListener).toHaveBeenCalled();
    expect(mockStdin.setRawMode).toHaveBeenCalledWith(false);
    expect(result).toBeNull();
  });
  
  test('waitForHelpInput returns page number on numeric key', async () => {
    // Setup mock to trigger "2" key
    const mockListener = jest.fn();
    mockStdin.on.mockImplementation((event, listener) => {
      mockListener.mockReturnValue(listener);
      // Immediately call the listener with key "2"
      listener('2', { name: '2', ctrl: false });
      return mockStdin;
    });
    
    const result = await helpSystem.waitForHelpInput();
    
    expect(mockStdin.setRawMode).toHaveBeenCalledWith(true);
    expect(mockStdin.resume).toHaveBeenCalled();
    expect(mockStdin.on).toHaveBeenCalledWith('keypress', expect.any(Function));
    expect(mockStdin.removeListener).toHaveBeenCalled();
    expect(mockStdin.setRawMode).toHaveBeenCalledWith(false);
    expect(result).toBe(2);
  });
  
  // This test uses a mock implementation of showHelp to avoid dealing with the loops
  test('showHelp navigates between pages and eventually dismisses', async () => {
    // Save the original method
    const originalDisplayMethod = helpSystem.displayHelpOverlay;
    const originalWaitMethod = helpSystem.waitForHelpInput;
    
    // Create mocks
    helpSystem.displayHelpOverlay = jest.fn();
    helpSystem.waitForHelpInput = jest.fn()
      .mockResolvedValueOnce(2) // First input: go to page 2
      .mockResolvedValueOnce(3) // Second input: go to page 3
      .mockResolvedValueOnce(null); // Third input: dismiss
    
    await helpSystem.showHelp(mockGameState);
    
    // Should have displayed 3 help pages
    expect(helpSystem.displayHelpOverlay).toHaveBeenCalledTimes(3);
    expect(helpSystem.displayHelpOverlay).toHaveBeenCalledWith(mockGameState, 1);
    expect(helpSystem.displayHelpOverlay).toHaveBeenCalledWith(mockGameState, 2);
    expect(helpSystem.displayHelpOverlay).toHaveBeenCalledWith(mockGameState, 3);
    
    // Should have waited for input 3 times
    expect(helpSystem.waitForHelpInput).toHaveBeenCalledTimes(3);
    
    // Restore original methods
    helpSystem.displayHelpOverlay = originalDisplayMethod;
    helpSystem.waitForHelpInput = originalWaitMethod;
  });
}); 