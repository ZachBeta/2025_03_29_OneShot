import { PhaseManager, PhaseError } from './PhaseManager';
import { GameState } from '../models/GameState';
import { PlayerType, PhaseType, CardType } from '../models/types';
import { Card, NpuCard, ProgramCard, IceCard } from '../models/Card';

describe('PhaseManager', () => {
  // Helper function to create a test game state
  const createGameState = (
    phase: PhaseType = PhaseType.MAIN,
    activePlayer: PlayerType = PlayerType.RUNNER,
    turn: number = 1,
    runnerDeckSize: number = 5,
    corpDeckSize: number = 5
  ): GameState => {
    const runnerDeck: Card[] = Array(runnerDeckSize).fill(null).map((_, i) => ({
      id: `runner-card-${i}`,
      name: `Runner Card ${i}`,
      type: CardType.NPU,
      cost: 1,
      ascii: ['Test Card'],
      flavorText: 'Test flavor text'
    } as NpuCard));
    
    const corpDeck: Card[] = Array(corpDeckSize).fill(null).map((_, i) => ({
      id: `corp-card-${i}`,
      name: `Corp Card ${i}`,
      type: CardType.NPU,
      cost: 1,
      ascii: ['Test Card'],
      flavorText: 'Test flavor text'
    } as NpuCard));
    
    return {
      turn,
      phase,
      activePlayer,
      gameOver: false,
      winner: undefined,
      runner: {
        deck: runnerDeck,
        hand: [],
        field: [],
        npuAvailable: 2,
        npuTotal: 5
      },
      corp: {
        deck: corpDeck,
        hand: [],
        field: [],
        npuAvailable: 2,
        npuTotal: 4,
        core: {
          maxHp: 10,
          currentHp: 10
        }
      },
      eventLog: []
    };
  };
  
  describe('getNextPhase', () => {
    test('returns the correct next phase in sequence', () => {
      expect(PhaseManager.getNextPhase(PhaseType.DRAW)).toBe(PhaseType.NPU);
      expect(PhaseManager.getNextPhase(PhaseType.NPU)).toBe(PhaseType.MAIN);
      expect(PhaseManager.getNextPhase(PhaseType.MAIN)).toBe(PhaseType.COMBAT);
      expect(PhaseManager.getNextPhase(PhaseType.COMBAT)).toBe(PhaseType.DRAW);
    });
    
    test('throws error for invalid phase', () => {
      expect(() => PhaseManager.getNextPhase('INVALID_PHASE' as PhaseType)).toThrow(PhaseError);
    });
  });
  
  describe('advancePhase', () => {
    test('advances to the next phase for Runner', () => {
      const gameState = createGameState(PhaseType.DRAW, PlayerType.RUNNER);
      const newState = PhaseManager.advancePhase(gameState);
      
      expect(newState.phase).toBe(PhaseType.NPU);
      expect(newState.activePlayer).toBe(PlayerType.RUNNER);
      expect(newState.eventLog.length).toBeGreaterThan(0);
      expect(newState.eventLog[0].message).toContain('phase');
    });
    
    test('advances to the next phase for Corp', () => {
      const gameState = createGameState(PhaseType.DRAW, PlayerType.CORP);
      const newState = PhaseManager.advancePhase(gameState);
      
      expect(newState.phase).toBe(PhaseType.NPU);
      expect(newState.activePlayer).toBe(PlayerType.CORP);
      expect(newState.eventLog.length).toBeGreaterThan(0);
    });
    
    test('Corp skips Combat phase and switches to Runner', () => {
      const gameState = createGameState(PhaseType.MAIN, PlayerType.CORP);
      const newState = PhaseManager.advancePhase(gameState);
      
      expect(newState.phase).toBe(PhaseType.DRAW);
      expect(newState.activePlayer).toBe(PlayerType.RUNNER);
    });
    
    test('Runner switches to Corp after Combat phase', () => {
      const gameState = createGameState(PhaseType.COMBAT, PlayerType.RUNNER);
      const newState = PhaseManager.advancePhase(gameState);
      
      expect(newState.phase).toBe(PhaseType.DRAW);
      expect(newState.activePlayer).toBe(PlayerType.CORP);
    });
    
    test('increments turn counter when Corp begins Draw phase', () => {
      const gameState = createGameState(PhaseType.COMBAT, PlayerType.RUNNER, 1);
      const newState = PhaseManager.advancePhase(gameState);
      
      expect(newState.turn).toBe(2);
    });
    
    test('does not increment turn counter for other phase transitions', () => {
      const drawState = createGameState(PhaseType.DRAW, PlayerType.RUNNER, 1);
      const npuState = PhaseManager.advancePhase(drawState);
      expect(npuState.turn).toBe(1);
      
      const mainState = PhaseManager.advancePhase(npuState);
      expect(mainState.turn).toBe(1);
      
      const combatState = PhaseManager.advancePhase(mainState);
      expect(combatState.turn).toBe(1);
    });
  });
  
  describe('executePhaseEntryActions', () => {
    test('Draw phase draws a card for Runner', () => {
      const gameState = createGameState(PhaseType.DRAW, PlayerType.RUNNER);
      const newState = PhaseManager['executePhaseEntryActions'](gameState);
      
      expect(newState.runner.hand.length).toBe(1);
      expect(newState.runner.deck.length).toBe(gameState.runner.deck.length - 1);
      expect(newState.eventLog.length).toBeGreaterThan(0);
      expect(newState.eventLog[0].message).toContain('drew a card');
    });
    
    test('Draw phase draws a card for Corp', () => {
      const gameState = createGameState(PhaseType.DRAW, PlayerType.CORP);
      const newState = PhaseManager['executePhaseEntryActions'](gameState);
      
      expect(newState.corp.hand.length).toBe(1);
      expect(newState.corp.deck.length).toBe(gameState.corp.deck.length - 1);
      expect(newState.eventLog.length).toBeGreaterThan(0);
      expect(newState.eventLog[0].message).toContain('drew a card');
    });
    
    test('NPU phase refreshes Runner NPU', () => {
      const gameState = createGameState(PhaseType.NPU, PlayerType.RUNNER);
      gameState.runner.npuAvailable = 1; // Set to some value lower than total
      const newState = PhaseManager['executePhaseEntryActions'](gameState);
      
      expect(newState.runner.npuAvailable).toBe(gameState.runner.npuTotal);
      expect(newState.eventLog.length).toBeGreaterThan(0);
      expect(newState.eventLog[0].message).toContain('refreshed NPU');
    });
    
    test('NPU phase refreshes Corp NPU', () => {
      const gameState = createGameState(PhaseType.NPU, PlayerType.CORP);
      gameState.corp.npuAvailable = 1; // Set to some value lower than total
      const newState = PhaseManager['executePhaseEntryActions'](gameState);
      
      expect(newState.corp.npuAvailable).toBe(gameState.corp.npuTotal);
      expect(newState.eventLog.length).toBeGreaterThan(0);
      expect(newState.eventLog[0].message).toContain('refreshed NPU');
    });
    
    test('Main phase has no automatic actions', () => {
      const gameState = createGameState(PhaseType.MAIN, PlayerType.RUNNER);
      const eventLogLengthBefore = gameState.eventLog.length;
      const newState = PhaseManager['executePhaseEntryActions'](gameState);
      
      expect(newState.eventLog.length).toBe(eventLogLengthBefore);
    });
    
    test('Combat phase has no automatic actions', () => {
      const gameState = createGameState(PhaseType.COMBAT, PlayerType.RUNNER);
      const eventLogLengthBefore = gameState.eventLog.length;
      const newState = PhaseManager['executePhaseEntryActions'](gameState);
      
      expect(newState.eventLog.length).toBe(eventLogLengthBefore);
    });
  });
  
  describe('drawCards', () => {
    test('handles empty Runner deck', () => {
      const gameState = createGameState(PhaseType.DRAW, PlayerType.RUNNER, 1, 0); // Empty Runner deck
      const newState = PhaseManager['drawCards'](gameState, PlayerType.RUNNER, 1);
      
      expect(newState.runner.hand.length).toBe(0);
      expect(newState.eventLog.length).toBeGreaterThan(0);
      expect(newState.eventLog[0].message).toContain('deck is empty');
    });
    
    test('handles empty Corp deck', () => {
      const gameState = createGameState(PhaseType.DRAW, PlayerType.CORP, 1, 5, 0); // Empty Corp deck
      const newState = PhaseManager['drawCards'](gameState, PlayerType.CORP, 1);
      
      expect(newState.corp.hand.length).toBe(0);
      expect(newState.eventLog.length).toBeGreaterThan(0);
      expect(newState.eventLog[0].message).toContain('deck is empty');
    });
    
    test('draws multiple cards for Runner', () => {
      const gameState = createGameState(PhaseType.DRAW, PlayerType.RUNNER);
      const cardsToDraw = 3;
      const newState = PhaseManager['drawCards'](gameState, PlayerType.RUNNER, cardsToDraw);
      
      expect(newState.runner.hand.length).toBe(cardsToDraw);
      expect(newState.runner.deck.length).toBe(gameState.runner.deck.length - cardsToDraw);
      expect(newState.eventLog.length).toBe(cardsToDraw);
    });
  });
  
  describe('isActionAllowed', () => {
    test('PlayNPU is only allowed in Main phase', () => {
      expect(PhaseManager.isActionAllowed(createGameState(PhaseType.MAIN), 'PlayNPU')).toBe(true);
      expect(PhaseManager.isActionAllowed(createGameState(PhaseType.DRAW), 'PlayNPU')).toBe(false);
      expect(PhaseManager.isActionAllowed(createGameState(PhaseType.NPU), 'PlayNPU')).toBe(false);
      expect(PhaseManager.isActionAllowed(createGameState(PhaseType.COMBAT), 'PlayNPU')).toBe(false);
    });
    
    test('PlayCard is only allowed in Main phase', () => {
      expect(PhaseManager.isActionAllowed(createGameState(PhaseType.MAIN), 'PlayCard')).toBe(true);
      expect(PhaseManager.isActionAllowed(createGameState(PhaseType.DRAW), 'PlayCard')).toBe(false);
      expect(PhaseManager.isActionAllowed(createGameState(PhaseType.NPU), 'PlayCard')).toBe(false);
      expect(PhaseManager.isActionAllowed(createGameState(PhaseType.COMBAT), 'PlayCard')).toBe(false);
    });
    
    test('Attack is only allowed in Combat phase for Runner', () => {
      expect(PhaseManager.isActionAllowed(createGameState(PhaseType.COMBAT, PlayerType.RUNNER), 'Attack')).toBe(true);
      expect(PhaseManager.isActionAllowed(createGameState(PhaseType.COMBAT, PlayerType.CORP), 'Attack')).toBe(false);
      expect(PhaseManager.isActionAllowed(createGameState(PhaseType.MAIN, PlayerType.RUNNER), 'Attack')).toBe(false);
    });
    
    test('Block is only allowed in Combat phase when Runner is active', () => {
      expect(PhaseManager.isActionAllowed(createGameState(PhaseType.COMBAT, PlayerType.RUNNER), 'Block')).toBe(true);
      expect(PhaseManager.isActionAllowed(createGameState(PhaseType.COMBAT, PlayerType.CORP), 'Block')).toBe(false);
      expect(PhaseManager.isActionAllowed(createGameState(PhaseType.MAIN, PlayerType.RUNNER), 'Block')).toBe(false);
    });
    
    test('EndPhase is always allowed', () => {
      expect(PhaseManager.isActionAllowed(createGameState(PhaseType.DRAW), 'EndPhase')).toBe(true);
      expect(PhaseManager.isActionAllowed(createGameState(PhaseType.NPU), 'EndPhase')).toBe(true);
      expect(PhaseManager.isActionAllowed(createGameState(PhaseType.MAIN), 'EndPhase')).toBe(true);
      expect(PhaseManager.isActionAllowed(createGameState(PhaseType.COMBAT), 'EndPhase')).toBe(true);
    });
    
    test('UseAbility is only allowed in Main phase', () => {
      expect(PhaseManager.isActionAllowed(createGameState(PhaseType.MAIN), 'UseAbility')).toBe(true);
      expect(PhaseManager.isActionAllowed(createGameState(PhaseType.DRAW), 'UseAbility')).toBe(false);
      expect(PhaseManager.isActionAllowed(createGameState(PhaseType.NPU), 'UseAbility')).toBe(false);
      expect(PhaseManager.isActionAllowed(createGameState(PhaseType.COMBAT), 'UseAbility')).toBe(false);
    });
    
    test('Unknown action types are not allowed', () => {
      expect(PhaseManager.isActionAllowed(createGameState(), 'UnknownAction')).toBe(false);
    });
  });
  
  describe('setupNewGame', () => {
    test('creates a new game state with initialized decks', () => {
      const gameState = PhaseManager.setupNewGame();
      
      // Game should start with Runner in NPU phase
      expect(gameState.activePlayer).toBe(PlayerType.RUNNER);
      expect(gameState.phase).toBe(PhaseType.NPU);
      expect(gameState.turn).toBe(1);
      
      // Runner should have a deck and starting hand
      expect(gameState.runner.deck.length).toBeGreaterThan(0);
      expect(gameState.runner.hand.length).toBeGreaterThan(0);
      
      // Corp should have a deck and no cards in hand yet
      expect(gameState.corp.deck.length).toBeGreaterThan(0);
      expect(gameState.corp.hand.length).toBe(0);
      
      // Event log should contain game start and phase entries
      expect(gameState.eventLog.length).toBeGreaterThan(0);
      expect(gameState.eventLog[0].message).toContain('Game started');
    });
  });
}); 