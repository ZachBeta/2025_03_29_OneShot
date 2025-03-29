import { LogEntry } from '../models/LogEntry';
import { EventType } from '../models/types';

/**
 * Handles rendering of game event logs with formatting and color coding
 */
export class EventLogRenderer {
  private maxEntries: number;
  private colorEnabled: boolean;
  
  /**
   * Creates a new EventLogRenderer
   * @param maxEntries Maximum number of entries to display at once
   * @param colorEnabled Whether to use color formatting
   */
  constructor(maxEntries: number = 10, colorEnabled: boolean = true) {
    this.maxEntries = maxEntries;
    this.colorEnabled = colorEnabled;
  }
  
  /**
   * Renders the event log entries
   * @param entries Array of log entries to render
   * @param width Width of the log display area
   * @returns Array of formatted strings
   */
  public render(entries: LogEntry[], width: number = 80): string[] {
    // Get the most recent entries up to maxEntries
    const recentEntries = this.getRecentEntries(entries);
    
    // Format each entry
    const formattedEntries = recentEntries.map(entry => 
      this.formatEntry(entry, width)
    );
    
    // Add a header
    const header = this.createHeader(width);
    
    return [header, ...formattedEntries];
  }
  
  /**
   * Creates a header for the event log
   * @param width Width of the log display area
   * @returns Formatted header string
   */
  private createHeader(width: number): string {
    const title = ' EVENT LOG ';
    const paddingSize = Math.floor((width - title.length) / 2);
    const leftPadding = '='.repeat(paddingSize);
    const rightPadding = '='.repeat(width - paddingSize - title.length);
    
    return this.colorText(leftPadding + title + rightPadding, 'header');
  }
  
  /**
   * Gets the most recent entries up to maxEntries
   * @param entries Full array of log entries
   * @returns Array of recent entries
   */
  private getRecentEntries(entries: LogEntry[]): LogEntry[] {
    if (entries.length <= this.maxEntries) {
      return [...entries];
    }
    
    return entries.slice(entries.length - this.maxEntries);
  }
  
  /**
   * Formats a single log entry
   * @param entry The log entry to format
   * @param width Width of the log display area
   * @returns Formatted entry string
   */
  private formatEntry(entry: LogEntry, width: number): string {
    // Format the timestamp
    const timestamp = this.formatTimestamp(entry.timestamp);
    
    // Format the message, ensuring it fits within width
    const maxMessageLength = width - timestamp.length - 3; // 3 for spacing and separator
    const message = this.truncateMessage(entry.message, maxMessageLength);
    
    // Combine with formatting
    const formattedEntry = `${timestamp} | ${message}`;
    
    // Apply color based on event type
    return this.colorText(formattedEntry, entry.type);
  }
  
  /**
   * Formats a timestamp to a more readable form
   * @param timestamp ISO timestamp string
   * @returns Formatted timestamp
   */
  private formatTimestamp(timestamp: string): string {
    const date = new Date(timestamp);
    
    // Format as HH:MM:SS
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }
  
  /**
   * Truncates a message to fit within maxLength
   * @param message Original message
   * @param maxLength Maximum allowed length
   * @returns Truncated message
   */
  private truncateMessage(message: string, maxLength: number): string {
    if (message.length <= maxLength) {
      return message;
    }
    
    return message.substring(0, maxLength - 3) + '...';
  }
  
  /**
   * Applies color formatting based on event type
   * @param text Text to color
   * @param type Event type or 'header' for header coloring
   * @returns Colored text string
   */
  private colorText(text: string, type: EventType | 'header'): string {
    if (!this.colorEnabled) {
      return text;
    }
    
    const colorCodes = {
      [EventType.GAME]: '\x1b[36m',  // Cyan for game events
      [EventType.COMBAT]: '\x1b[31m', // Red for combat
      [EventType.CARD]: '\x1b[32m',   // Green for card events
      [EventType.PHASE]: '\x1b[33m',  // Yellow for phase changes
      header: '\x1b[1;37m'            // Bright white for header
    };
    
    const reset = '\x1b[0m';
    const colorCode = colorCodes[type] || '';
    
    return `${colorCode}${text}${reset}`;
  }
  
  /**
   * Creates a specialized formatter for card play events
   * @param entry Log entry for a card play event
   * @returns Formatted string
   */
  public formatCardPlayEvent(entry: LogEntry): string {
    if (entry.type !== EventType.CARD || !entry.metadata) {
      return this.formatEntry(entry, 80);
    }
    
    const { cardName, cardId, player } = entry.metadata as { 
      cardName: string;
      cardId: string;
      player: string;
    };
    
    // Create a more descriptive message
    const enhancedMessage = `${player} played ${cardName} [ID: ${cardId}]`;
    
    // Create a new entry with the enhanced message
    const enhancedEntry: LogEntry = {
      ...entry,
      message: enhancedMessage
    };
    
    return this.formatEntry(enhancedEntry, 80);
  }
  
  /**
   * Creates a specialized formatter for combat events
   * @param entry Log entry for a combat event
   * @returns Formatted string
   */
  public formatCombatEvent(entry: LogEntry): string {
    if (entry.type !== EventType.COMBAT || !entry.metadata) {
      return this.formatEntry(entry, 80);
    }
    
    // Combat events are already well-formatted in CombatResolver
    // But we could enhance them further if needed
    return this.formatEntry(entry, 80);
  }
  
  /**
   * Creates a specialized formatter for phase change events
   * @param entry Log entry for a phase change event
   * @returns Formatted string
   */
  public formatPhaseChangeEvent(entry: LogEntry): string {
    if (entry.type !== EventType.PHASE || !entry.metadata) {
      return this.formatEntry(entry, 80);
    }
    
    const { phase, player } = entry.metadata as {
      phase: string;
      player?: string;
    };
    
    // Create a more descriptive message
    let enhancedMessage = `Phase changed to: ${phase}`;
    if (player) {
      enhancedMessage += ` (${player})`;
    }
    
    // Create a new entry with the enhanced message
    const enhancedEntry: LogEntry = {
      ...entry,
      message: enhancedMessage
    };
    
    return this.formatEntry(enhancedEntry, 80);
  }
  
  /**
   * Auto-selects the appropriate formatter based on event type
   * @param entry Log entry to format
   * @returns Formatted string
   */
  public formatByEventType(entry: LogEntry): string {
    switch (entry.type) {
      case EventType.CARD:
        return this.formatCardPlayEvent(entry);
      case EventType.COMBAT:
        return this.formatCombatEvent(entry);
      case EventType.PHASE:
        return this.formatPhaseChangeEvent(entry);
      default:
        return this.formatEntry(entry, 80);
    }
  }
} 