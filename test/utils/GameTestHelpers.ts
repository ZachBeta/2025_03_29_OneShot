import { UserAction, ActionType } from '../../src/models/UserAction';
import { GameState } from '../../src/models/GameState';

export class TestInputHandler {
  private pendingInputs: UserAction[] = [];
  private gameState: GameState | null = null;
  
  async getInput(): Promise<UserAction> {
    return this.pendingInputs.shift() || { type: ActionType.END_PHASE };
  }
  
  simulateInput(action: UserAction): void {
    this.pendingInputs.push(action);
  }

  setGameState(state: GameState): void {
    this.gameState = state;
  }
} 