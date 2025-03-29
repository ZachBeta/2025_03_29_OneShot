import { ActionProcessor, GameError } from './ActionProcessor';
import { GameStateManager } from './GameStateManager';
import { ActionType } from '../models/UserAction';
import { CardType, PhaseType, PlayerType, ProgramType } from '../models/types';
import { Card, NpuCard, ProgramCard } from '../models/Card';

// Mock GameStateManager methods
jest.mock('./GameStateManager');

// Create sample cards for testing
const createNpuCard = (): NpuCard => ({
  id: 'npu-1',
  name: 'Test NPU',
  type: CardType.NPU,
  cost: 1,
  power: 0,
  toughness: 0,
  ascii: ['NPU ascii art'],
  flavorText: ''
});

const createProgramCard = (): ProgramCard => ({
  id: 'prog-1',
  name: 'Test Program',
  type: CardType.PROGRAM,
  programType: ProgramType.FRACTER,
  cost: 2,
  power: 3,
  toughness: 2,
  ascii: ['Program ascii art'],
  flavorText: ''
});

describe('ActionProcessor', () => {
  let actionProcessor: ActionProcessor;
  let mockGameStateManager: jest.Mocked<GameStateManager>;
  let mockState: any;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup mock game state
    mockState = {
      turn: 1,
      gameOver: false,
      winner: undefined,
      activePlayer: PlayerType.RUNNER,
      phase: PhaseType.NPU,
      runner: {
        npuAvailable: 5,
        npuTotal: 5,
        deck: [],
        hand: [createNpuCard(), createProgramCard()],
        field: [createProgramCard()]
      },
      corp: {
        npuAvailable: 3,
        npuTotal: 3,
        core: {
          maxHp: 10,
          currentHp: 10
        },
        deck: [],
        hand: [],
        field: []
      },
      eventLog: []
    };
    
    // Setup mock GameStateManager
    mockGameStateManager = new GameStateManager() as jest.Mocked<GameStateManager>;
    mockGameStateManager.getState.mockReturnValue(mockState);
    mockGameStateManager.playCard.mockImplementation((player, index) => {
      // Simple mock implementation that just returns the current state
      return mockState;
    });
    mockGameStateManager.updateCorpHp.mockImplementation((amount) => {
      // Mock implementation that updates corp HP and returns state
      mockState.corp.core.currentHp += amount;
      return mockState;
    });
    mockGameStateManager.advancePhase.mockImplementation(() => {
      // Mock implementation that advances phase
      if (mockState.phase === PhaseType.NPU) {
        mockState.phase = PhaseType.MAIN;
      } else if (mockState.phase === PhaseType.MAIN) {
        mockState.phase = PhaseType.COMBAT;
      } else if (mockState.phase === PhaseType.COMBAT) {
        mockState.phase = PhaseType.DRAW;
        mockState.activePlayer = PlayerType.CORP;
      }
      return mockState;
    });
    
    actionProcessor = new ActionProcessor(mockGameStateManager);
  });
  
  test('processAction should process PLAY_NPU action', () => {
    const action = {
      type: ActionType.PLAY_NPU,
      payload: {
        cardIndex: 0,
        cardType: CardType.NPU
      }
    };
    
    actionProcessor.processAction(action);
    
    // Verify GameStateManager methods were called correctly
    expect(mockGameStateManager.playCard).toHaveBeenCalledWith(PlayerType.RUNNER, 0);
  });
  
  test('processAction should process PLAY_CARD action during MAIN phase', () => {
    // Change phase to MAIN
    mockState.phase = PhaseType.MAIN;
    
    const action = {
      type: ActionType.PLAY_CARD,
      payload: {
        cardIndex: 1,
        cardType: CardType.PROGRAM
      }
    };
    
    actionProcessor.processAction(action);
    
    // Verify GameStateManager methods were called correctly
    expect(mockGameStateManager.playCard).toHaveBeenCalledWith(PlayerType.RUNNER, 1);
  });
  
  test('processAction should process ATTACK action during COMBAT phase', () => {
    // Change phase to COMBAT
    mockState.phase = PhaseType.COMBAT;
    
    const action = {
      type: ActionType.ATTACK,
      payload: {
        programIndex: 0
      }
    };
    
    actionProcessor.processAction(action);
    
    // Verify GameStateManager methods were called correctly
    // The attack power of our mock program is 3, so we expect -3 HP to corp
    expect(mockGameStateManager.updateCorpHp).toHaveBeenCalledWith(-3);
  });
  
  test('processAction should process END_PHASE action', () => {
    const action = {
      type: ActionType.END_PHASE
    };
    
    actionProcessor.processAction(action);
    
    // Verify GameStateManager methods were called correctly
    expect(mockGameStateManager.advancePhase).toHaveBeenCalled();
  });
  
  test('processAction should handle QUIT action', () => {
    const action = {
      type: ActionType.QUIT
    };
    
    const result = actionProcessor.processAction(action);
    
    // Verify the game was marked as over
    expect(result.gameOver).toBe(true);
  });
  
  test('validateAction should throw on invalid phase for PLAY_NPU', () => {
    // Change phase to MAIN
    mockState.phase = PhaseType.MAIN;
    
    const action = {
      type: ActionType.PLAY_NPU,
      payload: {
        cardIndex: 0,
        cardType: CardType.NPU
      }
    };
    
    // Should throw error because PLAY_NPU is only valid in NPU phase
    expect(() => actionProcessor.processAction(action)).toThrow(GameError);
    expect(() => actionProcessor.processAction(action)).toThrow('NPU cards can only be played during NPU phase');
  });
  
  test('validateAction should throw on invalid phase for PLAY_CARD', () => {
    // Phase is NPU by default
    
    const action = {
      type: ActionType.PLAY_CARD,
      payload: {
        cardIndex: 1,
        cardType: CardType.PROGRAM
      }
    };
    
    // Should throw error because PLAY_CARD is only valid in MAIN phase
    expect(() => actionProcessor.processAction(action)).toThrow(GameError);
    expect(() => actionProcessor.processAction(action)).toThrow('Cards can only be played during Main phase');
  });
  
  test('validateAction should throw on invalid phase for ATTACK', () => {
    // Phase is NPU by default
    
    const action = {
      type: ActionType.ATTACK,
      payload: {
        programIndex: 0
      }
    };
    
    // Should throw error because ATTACK is only valid in COMBAT phase
    expect(() => actionProcessor.processAction(action)).toThrow(GameError);
    expect(() => actionProcessor.processAction(action)).toThrow('Attacks can only be declared during Combat phase');
  });
  
  test('validateAction should throw on actions during Corp turn', () => {
    // Change active player to CORP
    mockState.activePlayer = PlayerType.CORP;
    
    const action = {
      type: ActionType.END_PHASE
    };
    
    // Should throw error because only RUNNER can take actions
    expect(() => actionProcessor.processAction(action)).toThrow(GameError);
    expect(() => actionProcessor.processAction(action)).toThrow('Cannot take actions during Corp turn');
  });
  
  test('validateAction should allow HELP and QUIT during Corp turn', () => {
    // Change active player to CORP
    mockState.activePlayer = PlayerType.CORP;
    
    // HELP should not throw
    const helpAction = {
      type: ActionType.HELP
    };
    expect(() => actionProcessor.processAction(helpAction)).not.toThrow();
    
    // QUIT should not throw
    const quitAction = {
      type: ActionType.QUIT
    };
    expect(() => actionProcessor.processAction(quitAction)).not.toThrow();
  });
  
  test('validateAction should throw on game over', () => {
    // Mark game as over
    mockState.gameOver = true;
    
    const action = {
      type: ActionType.END_PHASE
    };
    
    // Should throw error because game is over
    expect(() => actionProcessor.processAction(action)).toThrow(GameError);
    expect(() => actionProcessor.processAction(action)).toThrow('Game is over, no actions can be taken');
  });
  
  test('processAttack should throw on invalid program index', () => {
    // Change phase to COMBAT
    mockState.phase = PhaseType.COMBAT;
    
    const action = {
      type: ActionType.ATTACK,
      payload: {
        programIndex: 5 // Out of bounds
      }
    };
    
    // Should throw error because program index is invalid
    expect(() => actionProcessor.processAction(action)).toThrow(GameError);
    expect(() => actionProcessor.processAction(action)).toThrow('Invalid program index for attack');
  });
}); 