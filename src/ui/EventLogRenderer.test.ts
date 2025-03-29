import { EventLogRenderer } from './EventLogRenderer';
import { LogEntry } from '../models/LogEntry';
import { EventType } from '../models/types';
import { createLogEntry } from '../models/LogEntry';

describe('EventLogRenderer', () => {
  let renderer: EventLogRenderer;
  let mockEntries: LogEntry[];
  
  beforeEach(() => {
    // Create a new renderer for each test
    renderer = new EventLogRenderer(5, false); // Disable colors for easier testing
    
    // Create some test log entries
    mockEntries = [
      createLogEntry('Game started', EventType.GAME, { session: 'test' }),
      createLogEntry('Player RUNNER draws card', EventType.CARD, { 
        cardName: 'Test Card', 
        cardId: 'card-123',
        player: 'RUNNER'
      }),
      createLogEntry('Phase changed to MAIN', EventType.PHASE, { 
        phase: 'MAIN',
        player: 'RUNNER'
      }),
      createLogEntry('Runner declares attack with Test Program', EventType.COMBAT, { 
        cardId: 'program-123',
        cardName: 'Test Program'
      }),
      createLogEntry('Corp blocks with Test ICE', EventType.COMBAT, { 
        cardId: 'ice-123',
        cardName: 'Test ICE'
      }),
      createLogEntry('Test Program is destroyed', EventType.COMBAT, { 
        cardId: 'program-123',
        cardName: 'Test Program'
      })
    ];
  });
  
  describe('render', () => {
    test('renders a header and entries', () => {
      const result = renderer.render(mockEntries);
      
      // Should have a header plus entries
      expect(result.length).toBe(6);  // header + 5 entries (limited by maxEntries=5)
      
      // First line should be the header
      expect(result[0]).toContain('EVENT LOG');
      
      // Should contain timestamps and messages
      // We only get the last 5 entries due to maxEntries
      const lastFiveEntries = mockEntries.slice(-5);
      lastFiveEntries.forEach((entry, i) => {
        expect(result[i+1]).toContain(entry.message);
      });
    });
    
    test('limits entries to maxEntries', () => {
      // Create renderer with maxEntries = 3
      const limitedRenderer = new EventLogRenderer(3, false);
      
      const result = limitedRenderer.render(mockEntries);
      
      // Should have a header plus 3 entries (not all 6)
      expect(result.length).toBe(4);
      
      // Should contain the last 3 entries
      const lastThreeEntries = mockEntries.slice(-3);
      lastThreeEntries.forEach((entry, i) => {
        expect(result[i+1]).toContain(entry.message);
      });
    });
    
    test('handles empty entries array', () => {
      const result = renderer.render([]);
      
      // Should just have the header
      expect(result.length).toBe(1);
      expect(result[0]).toContain('EVENT LOG');
    });
  });
  
  describe('formatEntry', () => {
    test('formats timestamp and message', () => {
      const entry = mockEntries[0];
      const result = renderer['formatEntry'](entry, 80);
      
      // Should contain the message
      expect(result).toContain(entry.message);
      
      // Should format the timestamp as HH:MM:SS
      const timestampPattern = /\d{2}:\d{2}:\d{2}/;
      expect(result).toMatch(timestampPattern);
    });
    
    test('truncates long messages', () => {
      // Create entry with very long message
      const longMessage = 'This is a very long message that should be truncated when formatted into the event log since it exceeds the maximum allowed width of the log display area.';
      const entry = createLogEntry(longMessage, EventType.GAME);
      
      // Format with a small width
      const width = 50;
      const result = renderer['formatEntry'](entry, width);
      
      // Should be truncated with '...'
      expect(result.length).toBeLessThanOrEqual(width);
      expect(result).toContain('...');
    });
  });
  
  describe('specialized formatters', () => {
    test('formatCardPlayEvent enhances card play entries', () => {
      const cardEvent = mockEntries[1]; // Card play event
      const result = renderer.formatCardPlayEvent(cardEvent);
      
      // Should contain enhanced information
      expect(result).toContain('RUNNER played Test Card');
      expect(result).toContain('ID: card-123');
    });
    
    test('formatCardPlayEvent passes through non-card entries', () => {
      const gameEvent = mockEntries[0]; // Game event, not card
      const result = renderer.formatCardPlayEvent(gameEvent);
      
      // Should be the same as regular format
      expect(result).toContain(gameEvent.message);
      expect(result).not.toContain('played');
    });
    
    test('formatPhaseChangeEvent enhances phase change entries', () => {
      const phaseEvent = mockEntries[2]; // Phase change event
      const result = renderer.formatPhaseChangeEvent(phaseEvent);
      
      // Should contain enhanced information
      expect(result).toContain('Phase changed to: MAIN');
      expect(result).toContain('(RUNNER)');
    });
    
    test('formatByEventType selects the correct formatter', () => {
      // Test with different event types
      const formatCardSpy = jest.spyOn(renderer, 'formatCardPlayEvent');
      const formatCombatSpy = jest.spyOn(renderer, 'formatCombatEvent');
      const formatPhaseSpy = jest.spyOn(renderer, 'formatPhaseChangeEvent');
      
      renderer.formatByEventType(mockEntries[0]); // GAME
      renderer.formatByEventType(mockEntries[1]); // CARD
      renderer.formatByEventType(mockEntries[2]); // PHASE
      renderer.formatByEventType(mockEntries[3]); // COMBAT
      
      expect(formatCardSpy).toHaveBeenCalledTimes(1);
      expect(formatCombatSpy).toHaveBeenCalledTimes(1);
      expect(formatPhaseSpy).toHaveBeenCalledTimes(1);
    });
  });
  
  describe('helper methods', () => {
    test('getRecentEntries returns all entries if fewer than maxEntries', () => {
      const entries = mockEntries.slice(0, 3); // Just take 3
      const result = renderer['getRecentEntries'](entries);
      
      expect(result).toHaveLength(3);
      expect(result).toEqual(entries);
    });
    
    test('getRecentEntries returns only the most recent if more than maxEntries', () => {
      // Renderer has maxEntries = 5, but mockEntries has 6
      const result = renderer['getRecentEntries'](mockEntries);
      
      expect(result).toHaveLength(5);
      expect(result).toEqual(mockEntries.slice(1)); // Should skip the first entry
    });
    
    test('truncateMessage does not modify short messages', () => {
      const message = 'Short message';
      const result = renderer['truncateMessage'](message, 20);
      
      expect(result).toBe(message);
    });
    
    test('truncateMessage adds ellipsis to long messages', () => {
      const message = 'This is a very long message that should be truncated';
      const maxLength = 20;
      const result = renderer['truncateMessage'](message, maxLength);
      
      expect(result.length).toBe(maxLength);
      expect(result).toContain('...');
    });
    
    test('formatTimestamp formats ISO timestamp to HH:MM:SS', () => {
      const timestamp = '2023-05-15T14:30:45.000Z';
      const result = renderer['formatTimestamp'](timestamp);
      
      // Extract the time part and ignore timezone adjustments
      const timePattern = /\d{2}:\d{2}:\d{2}/;
      expect(result).toMatch(timePattern);
    });
  });
}); 