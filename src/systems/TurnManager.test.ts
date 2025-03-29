import { TurnManager } from './TurnManager';
import { PhaseManager } from './PhaseManager';
import { GameState } from '../models/GameState';
import { PlayerType, PhaseType, CardType, ProgramType } from '../models/types';
import { Card, ProgramCard } from '../models/Card';

// Mock PhaseManager to avoid dependencies in tests
jest.mock('./PhaseManager', () => ({
  PhaseManager: {
    advancePhase: jest.fn((state) => ({
      ...state,
      phase: PhaseType.NPU // Always advance to NPU for simplicity in tests
    }))
  }
}));

describe('TurnManager', () => {
  // Helper function to create a test game state
  const createGameState = (
    activePlayer: PlayerType = PlayerType.RUNNER,
    phase: PhaseType = PhaseType.MAIN,
    turn: number = 1,
    corpHp: number = 10,
    runnerPrograms: number = 1,
    runnerHand: number = 3,
    runnerDeck: number = 5
  ): GameState => {
    // Create program cards for the runner field
    const programCards: ProgramCard[] = Array(runnerPrograms).fill(null).map((_, i) => ({
      id: `program-${i}`,
      name: `Program ${i}`,
      type: CardType.PROGRAM,
      programType: ProgramType.FRACTER,
      cost: 2,
      power: 2,
      toughness: 2,
      ascii: ['Test Program'],
      flavorText: 'Test program flavor text'
    }));
    
    // Create cards for the runner hand
    const handCards: Card[] = Array(runnerHand).fill(null).map((_, i) => ({
      id: `hand-card-${i}`,
      name: `Hand Card ${i}`,
      type: CardType.NPU,
      cost: 1,
      ascii: ['Test Card'],
      flavorText: 'Test flavor text'
    }));
    
    // Create cards for the runner deck
    const deckCards: Card[] = Array(runnerDeck).fill(null).map((_, i) => ({
      id: `deck-card-${i}`,
      name: `Deck Card ${i}`,
      type: CardType.NPU,
      cost: 1,
      ascii: ['Test Card'],
      flavorText: 'Test flavor text'
    }));
    
    return {
      turn,
      phase,
      activePlayer,
      gameOver: false,
      winner: undefined,
      runner: {
        deck: deckCards,
        hand: handCards,
        field: programCards,
        npuAvailable: 3,
        npuTotal: 5
      },
      corp: {
        deck: [],
        hand: [],
        field: [],
        npuAvailable: 3,
        npuTotal: 5,
        core: {
          maxHp: 10,
          currentHp: corpHp
        }
      },
      eventLog: []
    };
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('startNewTurn', () => {
    test('switches to the opposite player', () => {
      const runnerState = createGameState(PlayerType.RUNNER);
      const newState = TurnManager.startNewTurn(runnerState);
      
      expect(newState.activePlayer).toBe(PlayerType.CORP);
      
      const corpState = createGameState(PlayerType.CORP);
      const newState2 = TurnManager.startNewTurn(corpState);
      
      expect(newState2.activePlayer).toBe(PlayerType.RUNNER);
    });
    
    test('sets phase to DRAW', () => {
      const gameState = createGameState(PlayerType.RUNNER, PhaseType.MAIN);
      const newState = TurnManager.startNewTurn(gameState);
      
      expect(newState.phase).toBe(PhaseType.NPU); // Because we mocked PhaseManager.advancePhase
      expect(PhaseManager.advancePhase).toHaveBeenCalledWith(expect.objectContaining({
        phase: PhaseType.DRAW
      }));
    });
    
    test('increments turn counter when switching to Corp', () => {
      const gameState = createGameState(PlayerType.RUNNER, PhaseType.MAIN, 1);
      const newState = TurnManager.startNewTurn(gameState);
      
      expect(newState.turn).toBe(2);
    });
    
    test('does not increment turn counter when switching to Runner', () => {
      const gameState = createGameState(PlayerType.CORP, PhaseType.MAIN, 2);
      const newState = TurnManager.startNewTurn(gameState);
      
      expect(newState.turn).toBe(2);
    });
    
    test('adds log entry for turn start', () => {
      const gameState = createGameState(PlayerType.RUNNER);
      const newState = TurnManager.startNewTurn(gameState);
      
      expect(newState.eventLog.length).toBe(1);
      expect(newState.eventLog[0].message).toContain('turn begins');
    });
  });
  
  describe('endTurn', () => {
    test('logs the end of the turn', () => {
      const gameState = createGameState();
      const newState = TurnManager.endTurn(gameState);
      
      expect(newState.eventLog[0].message).toContain('turn ends');
    });
    
    test('starts a new turn for the opposite player', () => {
      const gameState = createGameState(PlayerType.RUNNER);
      const newState = TurnManager.endTurn(gameState);
      
      expect(newState.activePlayer).toBe(PlayerType.CORP);
    });
    
    test('does not start a new turn if the game is over', () => {
      // Create a state where Corp has 0 HP, which should trigger a win for Runner
      const gameState = createGameState(PlayerType.RUNNER, PhaseType.MAIN, 1, 0);
      const newState = TurnManager.endTurn(gameState);
      
      expect(newState.gameOver).toBe(true);
      expect(newState.winner).toBe(PlayerType.RUNNER);
      expect(PhaseManager.advancePhase).not.toHaveBeenCalled();
    });
  });
  
  describe('checkWinConditions', () => {
    test('Runner wins if Corp core HP reaches 0', () => {
      const gameState = createGameState(PlayerType.RUNNER, PhaseType.MAIN, 1, 0);
      const newState = TurnManager.checkWinConditions(gameState);
      
      expect(newState.gameOver).toBe(true);
      expect(newState.winner).toBe(PlayerType.RUNNER);
      expect(newState.eventLog[0].message).toContain('Runner wins');
    });
    
    test('Corp wins if Runner has no programs and no cards', () => {
      const gameState = createGameState(
        PlayerType.CORP, 
        PhaseType.MAIN, 
        2,
        10, // Corp HP
        0,  // No programs
        0,  // No hand cards
        0   // No deck cards
      );
      const newState = TurnManager.checkWinConditions(gameState);
      
      expect(newState.gameOver).toBe(true);
      expect(newState.winner).toBe(PlayerType.CORP);
      expect(newState.eventLog[0].message).toContain('Corp wins');
    });
    
    test('No winner if Runner has programs but no cards', () => {
      const gameState = createGameState(
        PlayerType.CORP, 
        PhaseType.MAIN, 
        2,
        10, // Corp HP
        1,  // Has programs
        0,  // No hand cards
        0   // No deck cards
      );
      const newState = TurnManager.checkWinConditions(gameState);
      
      expect(newState.gameOver).toBe(false);
      expect(newState.winner).toBeUndefined();
      expect(newState.eventLog.length).toBe(0);
    });
    
    test('No winner if Runner has no programs but has cards', () => {
      const gameState = createGameState(
        PlayerType.CORP, 
        PhaseType.MAIN, 
        2,
        10, // Corp HP
        0,  // No programs
        3,  // Has hand cards
        0   // No deck cards
      );
      const newState = TurnManager.checkWinConditions(gameState);
      
      expect(newState.gameOver).toBe(false);
      expect(newState.winner).toBeUndefined();
      expect(newState.eventLog.length).toBe(0);
    });
  });
  
  describe('advanceToNextPhase', () => {
    test('advances to the next phase if not at end of turn', () => {
      const gameState = createGameState(PlayerType.RUNNER, PhaseType.DRAW);
      TurnManager.advanceToNextPhase(gameState);
      
      expect(PhaseManager.advancePhase).toHaveBeenCalledWith(gameState);
    });
    
    test('ends the turn if Runner is at Combat phase', () => {
      const gameState = createGameState(PlayerType.RUNNER, PhaseType.COMBAT);
      const spy = jest.spyOn(TurnManager, 'endTurn').mockReturnValue(gameState);
      
      TurnManager.advanceToNextPhase(gameState);
      
      expect(spy).toHaveBeenCalledWith(gameState);
      expect(PhaseManager.advancePhase).not.toHaveBeenCalledWith(gameState);
      
      spy.mockRestore();
    });
    
    test('ends the turn if Corp is at Main phase', () => {
      const gameState = createGameState(PlayerType.CORP, PhaseType.MAIN);
      const spy = jest.spyOn(TurnManager, 'endTurn').mockReturnValue(gameState);
      
      TurnManager.advanceToNextPhase(gameState);
      
      expect(spy).toHaveBeenCalledWith(gameState);
      expect(PhaseManager.advancePhase).not.toHaveBeenCalledWith(gameState);
      
      spy.mockRestore();
    });
  });
}); 