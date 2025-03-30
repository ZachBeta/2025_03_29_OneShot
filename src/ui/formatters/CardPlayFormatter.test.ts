import { CardPlayFormatter } from './CardPlayFormatter';
import { LogEntry } from '../../models/LogEntry';
import { EventType } from '../../models/types';

describe('CardPlayFormatter', () => {
  let formatter: CardPlayFormatter;
  
  beforeEach(() => {
    formatter = new CardPlayFormatter();
  });
  
  test('canFormat returns true for card events with metadata', () => {
    const entry: LogEntry = {
      timestamp: '2023-01-01T12:00:00.000Z',
      message: 'Card was played',
      type: EventType.CARD,
      metadata: {
        cardName: 'Test Card',
        cardId: 'card-123',
        player: 'Runner'
      }
    };
    
    expect(formatter.canFormat(entry)).toBe(true);
  });
  
  test('canFormat returns false for non-card events', () => {
    const entry: LogEntry = {
      timestamp: '2023-01-01T12:00:00.000Z',
      message: 'Phase changed',
      type: EventType.PHASE,
      metadata: {}
    };
    
    expect(formatter.canFormat(entry)).toBe(false);
  });
  
  test('canFormat returns false for card events without metadata', () => {
    const entry: LogEntry = {
      timestamp: '2023-01-01T12:00:00.000Z',
      message: 'Card was played',
      type: EventType.CARD
    };
    
    expect(formatter.canFormat(entry)).toBe(false);
  });
  
  test('format generates correct message for card play events', () => {
    const entry: LogEntry = {
      timestamp: '2023-01-01T12:00:00.000Z',
      message: 'Original message',
      type: EventType.CARD,
      metadata: {
        cardName: 'Fracter',
        cardId: 'card-123',
        player: 'Runner'
      }
    };
    
    const result = formatter.format(entry);
    expect(result).toContain('Runner played Fracter [ID: card-123]');
  });
  
  test('format retains original timestamps and type', () => {
    const timestamp = '2023-01-01T12:00:00.000Z';
    const entry: LogEntry = {
      timestamp,
      message: 'Original message',
      type: EventType.CARD,
      metadata: {
        cardName: 'ICE Wall',
        cardId: 'card-456',
        player: 'Corp'
      }
    };
    
    const result = formatter.format(entry);
    const resultEntry = JSON.parse(result) as LogEntry;
    
    expect(resultEntry.timestamp).toBe(timestamp);
    expect(resultEntry.type).toBe(EventType.CARD);
  });
}); 