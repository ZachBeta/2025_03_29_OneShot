import { LogEntry } from '../../models/LogEntry';

export interface ILogFormatter {
  canFormat(entry: LogEntry): boolean;
  format(entry: LogEntry): string;
} 