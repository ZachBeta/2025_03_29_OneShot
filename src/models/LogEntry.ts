/**
 * Represents a log entry in the game event log
 */

import { EventType } from './types';

/**
 * Interface for a log entry in the game's event log
 */
export interface LogEntry {
  /**
   * ISO8601 timestamp of when the event occurred
   */
  timestamp: string;
  
  /**
   * Message describing the event
   */
  message: string;
  
  /**
   * Type of event (used for filtering and display)
   */
  type: EventType;
  
  /**
   * Optional metadata related to the event
   */
  metadata?: Record<string, unknown>;
}

/**
 * Creates a new log entry with the current timestamp
 * @param message - The message for the log entry
 * @param type - The type of event
 * @param metadata - Optional metadata for the event
 * @returns A new LogEntry object
 */
export function createLogEntry(
  message: string,
  type: EventType,
  metadata?: Record<string, unknown>
): LogEntry {
  return {
    timestamp: new Date().toISOString(),
    message,
    type,
    metadata
  };
} 