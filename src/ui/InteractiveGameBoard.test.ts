import { InteractiveGameBoard } from './InteractiveGameBoard';
import { GameState } from '../models/GameState';
import { PlayerType, PhaseType } from '../models/types';

// Mock dependencies
jest.mock('./GameBoardRenderer', () => {
  return {
    GameBoardRenderer: {
      renderGameState: jest.fn()
    }
  };
});

jest.mock('./TerminalUtils', () => {
  return {
    createScreenBuffer: jest.fn().mockReturnValue([['']]),
    renderBufferToTerminal: jest.fn(),
    drawBox: jest.fn(),
    cyberpunkStyle: jest.fn().mockImplementation(text => text),
    renderToBuffer: jest.fn()
  };
});

// Mock console methods
console.clear = jest.fn();
console.log = jest.fn();

describe('InteractiveGameBoard', () => {
  let interactiveBoard: InteractiveGameBoard;
  let mockGameState: GameState;
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    interactiveBoard = new InteractiveGameBoard();
    
    // Create a minimal mock game state
    mockGameState = {
      turn: 1,
      phase: PhaseType.MAIN,
      activePlayer: PlayerType.RUNNER,
      gameOver: false,
      winner: undefined,
      runner: {
        deck: [],
        hand: [],
        field: [],
        npuAvailable: 5,
        npuTotal: 5
      },
      corp: {
        deck: [],
        hand: [],
        field: [],
        npuAvailable: 5,
        npuTotal: 5,
        core: {
          maxHp: 10,
          currentHp: 10
        }
      },
      eventLog: []
    };
  });
  
  describe('highlightSelectableCards', () => {
    test('sets highlighted cards for runner', () => {
      interactiveBoard.highlightSelectableCards('runner', [0, 1, 2]);
      expect(interactiveBoard['highlightedCards'].get('runner')).toEqual([0, 1, 2]);
    });
    
    test('sets highlighted cards for corp', () => {
      interactiveBoard.highlightSelectableCards('corp', [0, 1]);
      expect(interactiveBoard['highlightedCards'].get('corp')).toEqual([0, 1]);
    });
    
    test('overwrites previous highlights for the same player', () => {
      interactiveBoard.highlightSelectableCards('runner', [0, 1]);
      interactiveBoard.highlightSelectableCards('runner', [2, 3]);
      expect(interactiveBoard['highlightedCards'].get('runner')).toEqual([2, 3]);
    });
  });
  
  describe('clearHighlights', () => {
    test('clears all highlighted cards', () => {
      interactiveBoard.highlightSelectableCards('runner', [0, 1]);
      interactiveBoard.highlightSelectableCards('corp', [0, 1]);
      
      interactiveBoard.clearHighlights();
      
      expect(interactiveBoard['highlightedCards'].size).toBe(0);
    });
  });
  
  describe('setStatusMessage', () => {
    test('sets the status message', () => {
      const message = 'Test status message';
      interactiveBoard.setStatusMessage(message);
      expect(interactiveBoard['statusMessage']).toBe(message);
    });
  });
  
  describe('setAvailableCommands', () => {
    test('sets the available commands', () => {
      const commands = ['Command 1', 'Command 2'];
      interactiveBoard.setAvailableCommands(commands);
      expect(interactiveBoard['availableCommands']).toEqual(commands);
    });
  });
  
  describe('setAttackIndicators', () => {
    test('sets the attack source and target', () => {
      interactiveBoard.setAttackIndicators(1, 2);
      expect(interactiveBoard['attackSource']).toBe(1);
      expect(interactiveBoard['attackTarget']).toBe(2);
    });
    
    test('handles null target for direct attack', () => {
      interactiveBoard.setAttackIndicators(1, null);
      expect(interactiveBoard['attackSource']).toBe(1);
      expect(interactiveBoard['attackTarget']).toBeNull();
    });
  });
  
  describe('clearAttackIndicators', () => {
    test('clears attack indicators', () => {
      interactiveBoard.setAttackIndicators(1, 2);
      interactiveBoard.clearAttackIndicators();
      expect(interactiveBoard['attackSource']).toBeNull();
      expect(interactiveBoard['attackTarget']).toBeNull();
    });
  });
  
  describe('refreshDisplay', () => {
    test('renders and outputs game state', () => {
      // Setup render method to return a simple board
      jest.spyOn(interactiveBoard, 'render').mockReturnValue(['Board line 1', 'Board line 2']);
      
      interactiveBoard.refreshDisplay(mockGameState);
      
      expect(interactiveBoard.render).toHaveBeenCalledWith(mockGameState);
      expect(console.clear).toHaveBeenCalled();
      expect(console.log).toHaveBeenCalledWith('Board line 1\nBoard line 2');
    });
  });
  
  // Test helper methods
  describe('helper methods', () => {
    test('centerText centers text within a specified width', () => {
      const text = 'test';
      const width = 10;
      const result = interactiveBoard['centerText'](text, width);
      
      expect(result.length).toBe(width);
      expect(result).toBe('   test   ');
    });
    
    test('replaceSubstring replaces part of a string', () => {
      const original = '0123456789';
      const result = interactiveBoard['replaceSubstring'](original, 2, 'abc');
      
      expect(result).toBe('01abc56789');
    });
    
    test('replaceChar replaces a single character', () => {
      const original = '0123456789';
      const result = interactiveBoard['replaceChar'](original, 5, 'X');
      
      expect(result).toBe('01234X6789');
    });
  });
}); 