/**
 * Tests for TerminalUtils
 */

import * as TerminalUtils from './TerminalUtils';

// Mock console.log for the renderTitleScreen
jest.spyOn(console, 'log').mockImplementation(() => {});

// Mock terminal-kit
jest.mock('terminal-kit', () => {
  const terminal = function(text: string) {
    // Mock implementation of terminal as a function
  };
  
  // Add properties to the function
  terminal.clear = jest.fn();
  terminal.moveTo = jest.fn();
  terminal.bgBlack = jest.fn();
  terminal.green = jest.fn();
  terminal.width = 80;
  terminal.height = 24;
  terminal.once = jest.fn((event: string, callback: (key: string) => void) => {
    if (event === 'key') {
      callback('enter');
    }
  });
  
  return { terminal };
});

// Mock chalk
jest.mock('chalk', () => ({
  green: jest.fn((text: string) => `[green]${text}[/green]`)
}));

describe('TerminalUtils', () => {
  // Reset mocks between tests
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('basic terminal functions', () => {
    test('clearScreen calls terminal.clear', () => {
      TerminalUtils.clearScreen();
      
      const { terminal } = require('terminal-kit');
      expect(terminal.clear).toHaveBeenCalled();
    });
    
    test('moveCursor calls terminal.moveTo with correct coordinates', () => {
      TerminalUtils.moveCursor(10, 20);
      
      const { terminal } = require('terminal-kit');
      expect(terminal.moveTo).toHaveBeenCalledWith(10, 20);
    });
    
    test('setCyberpunkTheme sets the correct colors', () => {
      TerminalUtils.setCyberpunkTheme();
      
      const { terminal } = require('terminal-kit');
      expect(terminal.bgBlack).toHaveBeenCalled();
      expect(terminal.green).toHaveBeenCalled();
    });
    
    test('cyberpunkStyle returns green text', () => {
      const result = TerminalUtils.cyberpunkStyle('test');
      
      expect(result).toBe('[green]test[/green]');
    });
  });
  
  describe('drawing functions', () => {
    test('drawHorizontalLine returns correct line', () => {
      const line = TerminalUtils.drawHorizontalLine(5, '*');
      expect(line).toBe('*****');
      
      const defaultLine = TerminalUtils.drawHorizontalLine(5);
      expect(defaultLine).toBe('─────');
    });
    
    test('drawVerticalLine returns correct line array', () => {
      const lines = TerminalUtils.drawVerticalLine(3, '*');
      expect(lines).toEqual(['*', '*', '*']);
      
      const defaultLines = TerminalUtils.drawVerticalLine(3);
      expect(defaultLines).toEqual(['│', '│', '│']);
    });
    
    test('drawBox returns correct box structure', () => {
      const box = TerminalUtils.drawBox(5, 3);
      expect(box).toEqual([
        '┌───┐',
        '│   │',
        '└───┘'
      ]);
    });
    
    test('drawTextBox centers text correctly', () => {
      const box = TerminalUtils.drawTextBox('Hi', 10, 3);
      expect(box).toEqual([
        '┌────────┐',
        '│   Hi   │',
        '└────────┘'
      ]);
    });
  });
  
  describe('buffer handling', () => {
    test('createScreenBuffer creates buffer with correct dimensions', () => {
      const buffer = TerminalUtils.createScreenBuffer(3, 2);
      expect(buffer).toEqual([
        [' ', ' ', ' '],
        [' ', ' ', ' ']
      ]);
    });
    
    test('renderToBuffer adds content to buffer at correct position', () => {
      const buffer = [
        [' ', ' ', ' ', ' ', ' '],
        [' ', ' ', ' ', ' ', ' '],
        [' ', ' ', ' ', ' ', ' ']
      ];
      
      const content = ['AB', 'CD'];
      
      TerminalUtils.renderToBuffer(buffer, content, 1, 1);
      
      expect(buffer).toEqual([
        [' ', ' ', ' ', ' ', ' '],
        [' ', 'A', 'B', ' ', ' '],
        [' ', 'C', 'D', ' ', ' ']
      ]);
    });
    
    test('renderToBuffer handles out-of-bounds content', () => {
      const buffer = [
        [' ', ' ', ' '],
        [' ', ' ', ' ']
      ];
      
      const content = ['TOOLONG', 'ALSOTOOLONG'];
      
      TerminalUtils.renderToBuffer(buffer, content, 0, 0);
      
      // Only the part of the content that fits should be rendered
      expect(buffer).toEqual([
        ['T', 'O', 'O'],
        ['A', 'L', 'S']
      ]);
      
      // Test negative coordinates
      const buffer2 = [
        [' ', ' ', ' '],
        [' ', ' ', ' ']
      ];
      
      TerminalUtils.renderToBuffer(buffer2, content, -1, 0);
      
      // Only part of content should be visible (starting from second character)
      expect(buffer2).toEqual([
        ['O', 'O', 'L'],
        ['L', 'S', 'O']
      ]);
    });
  });
  
  describe('title screen', () => {
    test('renderTitleScreen sets up the title correctly', () => {
      TerminalUtils.renderTitleScreen();
      
      const { terminal } = require('terminal-kit');
      
      // Verify terminal setup
      expect(terminal.clear).toHaveBeenCalled();
      expect(terminal.bgBlack).toHaveBeenCalled();
      expect(terminal.green).toHaveBeenCalled();
      
      // Title positioning and rendering
      expect(terminal.moveTo).toHaveBeenCalled();
      
      // Verify console.log was called for title rendering (our fallback)
      expect(console.log).toHaveBeenCalled();
      
      // Key press handler
      expect(terminal.once).toHaveBeenCalledWith('key', expect.any(Function));
    });
    
    test('waitForKeyPress returns a promise that resolves on key press', async () => {
      const keyPromise = TerminalUtils.waitForKeyPress();
      
      const key = await keyPromise;
      
      expect(key).toBe('enter');
    });
  });
}); 