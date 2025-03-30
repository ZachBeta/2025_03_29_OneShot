export interface ITimestampService {
  format(timestamp: Date | string): string;
}

export class TimestampService implements ITimestampService {
  format(timestamp: Date | string): string {
    let hours, minutes, seconds;
    
    if (timestamp instanceof Date) {
      hours = timestamp.getHours().toString().padStart(2, '0');
      minutes = timestamp.getMinutes().toString().padStart(2, '0');
      seconds = timestamp.getSeconds().toString().padStart(2, '0');
    } else {
      try {
        const date = new Date(timestamp);
        hours = date.getHours().toString().padStart(2, '0');
        minutes = date.getMinutes().toString().padStart(2, '0');
        seconds = date.getSeconds().toString().padStart(2, '0');
      } catch {
        return '[--:--:--]';
      }
    }
    
    return `[${hours}:${minutes}:${seconds}]`;
  }
} 