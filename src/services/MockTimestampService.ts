import { ITimestampService } from './TimestampService';

export class MockTimestampService implements ITimestampService {
  private fixedTime: string = '[00:00:00]';

  setFixedTime(time: string) {
    this.fixedTime = time;
  }

  format(): string {
    return this.fixedTime;
  }
} 