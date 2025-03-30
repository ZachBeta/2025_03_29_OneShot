import { EventLogRenderer } from './EventLogRenderer';
import { CardPlayFormatter } from './formatters/CardPlayFormatter';
import { TimestampService } from '../services/TimestampService';
import { DefaultFormatter } from './formatters/BaseFormatter';
import { MockTimestampService } from '../services/MockTimestampService';

export class EventLogRendererFactory {
  static createRenderer(maxEntries: number, useMockTime: boolean = false): EventLogRenderer {
    return new EventLogRenderer(maxEntries, !useMockTime);
  }

  static createDefaultRenderer(maxEntries: number = 10): EventLogRenderer {
    return new EventLogRenderer(
      maxEntries,
      true
    );
  }

  static createTestRenderer(maxEntries: number = 10): EventLogRenderer {
    return new EventLogRenderer(
      maxEntries,
      false
    );
  }
} 