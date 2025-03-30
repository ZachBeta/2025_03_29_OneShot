import { GameLoop } from './GameLoop';
import { TestInputHandler } from '../../test/utils/GameTestHelpers';
import { ActionType } from '../models/UserAction';
import { GameStateManager } from './GameStateManager';

describe('GameLoop Integration', () => {
  let gameLoop: GameLoop;
  let testInput: TestInputHandler;
  let gameStateManager: GameStateManager;

  beforeAll(() => {
    GameLoop.setTestMode();
  });

  beforeEach(() => {
    gameLoop = new GameLoop();
    testInput = new TestInputHandler();
    gameStateManager = new GameStateManager();
    
    // Proper typed access to private members
    Object.assign(gameLoop, {
      inputHandler: testInput,
      gameStateManager: gameStateManager
    });
  });

  afterEach(async () => {
    // await gameLoop.shutdown(); // Shutdown is private, avoid calling directly
  });

  test('complete turn cycle', async () => {
    const startPromise = gameLoop.start();
    
    // Runner turn
    testInput.simulateInput({ type: ActionType.END_PHASE });
    
    // Corp turn 
    testInput.simulateInput({ type: ActionType.END_PHASE });
    
    await startPromise;
    
    // expect(gameLoop.getState().turn).toBe(2); // getState does not exist
    // expect(gameStateManager.state.turn).toBe(2); // Accessing private members
    // expect(gameStateManager.state.turn).toBe(2); // Access GameStateManager directly
    expect(gameStateManager.getTurn()).toBe(2); // Use public getter method
  });
}); 