/**
 * Tests for LogEntry model
 */

import { EventType } from './types';
import { LogEntry, createLogEntry } from './LogEntry';

describe('LogEntry', () => {
  describe('interface structure', () => {
    test('LogEntry has required properties', () => {
      const logEntry: LogEntry = {
        timestamp: '2023-04-01T12:00:00Z',
        message: 'Test message',
        type: EventType.GAME
      };

      expect(logEntry.timestamp).toBe('2023-04-01T12:00:00Z');
      expect(logEntry.message).toBe('Test message');
      expect(logEntry.type).toBe(EventType.GAME);
      expect(logEntry.metadata).toBeUndefined();
    });

    test('LogEntry can include optional metadata', () => {
      const logEntry: LogEntry = {
        timestamp: '2023-04-01T12:00:00Z',
        message: 'Test message with metadata',
        type: EventType.CARD,
        metadata: {
          cardId: '123',
          cardName: 'Test Card'
        }
      };

      expect(logEntry.metadata).toBeDefined();
      expect(logEntry.metadata?.cardId).toBe('123');
      expect(logEntry.metadata?.cardName).toBe('Test Card');
    });
  });

  describe('createLogEntry', () => {
    test('creates a log entry with current timestamp', () => {
      // Mock current date
      const mockDate = new Date('2023-04-01T12:34:56Z');
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate);

      const logEntry = createLogEntry('Test message', EventType.GAME);

      expect(logEntry.timestamp).toBe('2023-04-01T12:34:56.000Z');
      expect(logEntry.message).toBe('Test message');
      expect(logEntry.type).toBe(EventType.GAME);
      expect(logEntry.metadata).toBeUndefined();

      // Restore Date constructor
      jest.restoreAllMocks();
    });

    test('creates a log entry with metadata', () => {
      const metadata = { key: 'value' };
      const logEntry = createLogEntry('Test with metadata', EventType.COMBAT, metadata);

      expect(logEntry.message).toBe('Test with metadata');
      expect(logEntry.type).toBe(EventType.COMBAT);
      expect(logEntry.metadata).toBe(metadata);
    });
  });
}); 