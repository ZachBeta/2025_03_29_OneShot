import { LogEntry } from '../../models/LogEntry';
import { EventType } from '../../models/types';
import { BaseFormatter } from './BaseFormatter';

export class CardPlayFormatter extends BaseFormatter {
  canFormat(entry: LogEntry): boolean {
    return entry.type === EventType.CARD && !!entry.metadata;
  }
  
  format(entry: LogEntry): string {
    const { cardName, cardId, player } = entry.metadata as { 
      cardName: string;
      cardId: string;
      player: string;
    };
    
    const message = `${player} played ${cardName} [ID: ${cardId}]`;
    return super.format({ ...entry, message });
  }
} 