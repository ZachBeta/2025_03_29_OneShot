import { LogEntry } from '../../models/LogEntry';

export class BaseFormatter {
  protected colorCode: string;

  constructor(colorCode: string = '\x1b[37m') { // Default to white
    this.colorCode = colorCode;
  }

  canFormat(entry: LogEntry): boolean {
    // Base formatter can format any log entry
    return true;
  }
  
  format(entry: LogEntry): string {
    // Apply color formatting to the message
    const coloredMessage = `${this.colorCode}${entry.message}\x1b[0m`;
    
    // Return a JSON string with the colored message
    return JSON.stringify({
      ...entry,
      message: coloredMessage
    });
  }
}

// For backward compatibility
export { BaseFormatter as DefaultFormatter }; 