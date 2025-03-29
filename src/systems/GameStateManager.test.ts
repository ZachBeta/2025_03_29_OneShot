import { GameStateManager } from './GameStateManager';
import { PlayerType, PhaseType, EventType, CardType } from '../models/types';
import { Card, isNpuCard } from '../models/Card';
import * as CardFactory from '../utils/CardFactory';

// Mock the CardFactory
jest.mock('../utils/CardFactory', () => ({
  createRunnerStarterDeck: jest.fn(),
  createCorpStarterDeck: jest.fn(),
  shuffleDeck: jest.fn((cards) => cards),
  createNpuCard: jest.fn()
}));

describe('GameStateManager', () => {
  let manager: GameStateManager;
  let runnerDeck: Card[];
  let corpDeck: Card[];
  
  beforeEach(() => {
    // Reset manager
    manager = new GameStateManager();
    
    // Setup mock decks
    runnerDeck = [
      { id: 'npu1', name: 'NPU Card 1', type: CardType.NPU, cost: 1, power: 2, toughness: 3, ascii: ['NPU'], flavorText: 'Test' },
      { id: 'npu2', name: 'NPU Card 2', type: CardType.NPU, cost: 2, power: 3, toughness: 4, ascii: ['NPU'], flavorText: 'Test' },
      { id: 'npu3', name: 'NPU Card 3', type: CardType.NPU, cost: 3, power: 4, toughness: 5, ascii: ['NPU'], flavorText: 'Test' }
    ] as Card[];
    
    corpDeck = [
      { id: 'cnpu1', name: 'Corp NPU 1', type: CardType.NPU, cost: 1, power: 2, toughness: 3, ascii: ['NPU'], flavorText: 'Test' },
      { id: 'cnpu2', name: 'Corp NPU 2', type: CardType.NPU, cost: 2, power: 3, toughness: 4, ascii: ['NPU'], flavorText: 'Test' }
    ] as Card[];
    
    // Configure mocks
    (CardFactory.createRunnerStarterDeck as jest.Mock).mockReturnValue(runnerDeck);
    (CardFactory.createCorpStarterDeck as jest.Mock).mockReturnValue(corpDeck);
  });
  
  test('creates initial state correctly', () => {
    const state = GameStateManager.createInitialState();
    
    expect(state.turn).toBe(0);
    expect(state.activePlayer).toBe(PlayerType.RUNNER);
    expect(state.phase).toBe(PhaseType.DRAW);
    expect(state.runner.deck).toHaveLength(0);
    expect(state.corp.deck).toHaveLength(0);
    expect(state.gameOver).toBe(false);
    expect(state.eventLog).toHaveLength(0);
  });
  
  test('sets up the game with correct decks and hands', () => {
    const state = manager.setupGame();
    
    // Verify game initialization
    expect(state.turn).toBe(1);
    expect(state.runner.deck).toHaveLength(0); // All cards drawn
    expect(state.runner.hand).toHaveLength(3); // Drew from a 3-card deck
    expect(state.corp.deck).toHaveLength(0); // All cards drawn
    expect(state.corp.hand).toHaveLength(2); // Drew from a 2-card deck
    expect(state.eventLog).toHaveLength(3); // Game started + 2 draw events
    
    // Verify mocks were called
    expect(CardFactory.createRunnerStarterDeck).toHaveBeenCalled();
    expect(CardFactory.createCorpStarterDeck).toHaveBeenCalled();
    expect(CardFactory.shuffleDeck).toHaveBeenCalledTimes(2);
  });
  
  test('draws cards correctly', () => {
    manager = new GameStateManager();
    
    // Setup game state manually to test drawing
    const manualState = manager.getState();
    manualState.runner.deck = [...runnerDeck];
    manualState.corp.deck = [...corpDeck];
    
    // Use reflection to update private state
    Object.defineProperty(manager, 'state', { value: manualState });
    
    // Draw for runner
    manager.drawCards(PlayerType.RUNNER, 2);
    const stateAfterRunnerDraw = manager.getState();
    
    // Verify runner draw
    expect(stateAfterRunnerDraw.runner.deck).toHaveLength(1);
    expect(stateAfterRunnerDraw.runner.hand).toHaveLength(2);
    
    // Draw for corp
    manager.drawCards(PlayerType.CORP, 1);
    const stateAfterCorpDraw = manager.getState();
    
    // Verify corp draw
    expect(stateAfterCorpDraw.corp.deck).toHaveLength(1);
    expect(stateAfterCorpDraw.corp.hand).toHaveLength(1);
  });
  
  test('plays card correctly', () => {
    manager = new GameStateManager();
    
    // Setup game state manually for testing card play
    const manualState = manager.getState();
    const testCard = { 
      id: 'test1', 
      name: 'Test Card', 
      type: CardType.NPU, 
      cost: 2, 
      power: 3, 
      toughness: 4, 
      ascii: ['Test Line 1', 'Test Line 2'], 
      flavorText: 'Test Card'
    } as Card;
    
    manualState.runner.hand = [testCard];
    manualState.runner.npuAvailable = 3;
    
    // Use reflection to update private state
    Object.defineProperty(manager, 'state', { value: manualState });
    
    // Play the card
    manager.playCard(PlayerType.RUNNER, 0);
    const stateAfterPlay = manager.getState();
    
    // Verify card play
    expect(stateAfterPlay.runner.hand).toHaveLength(0);
    expect(stateAfterPlay.runner.field).toHaveLength(1);
    expect(stateAfterPlay.runner.field[0].id).toBe('test1');
    expect(stateAfterPlay.runner.npuAvailable).toBe(1); // 3 - 2 = 1
  });
  
  test('updates NPU resources correctly', () => {
    manager = new GameStateManager();
    
    // Add NPU
    manager.updateNpu(PlayerType.RUNNER, 3);
    const stateAfterAdd = manager.getState();
    
    // Verify add
    expect(stateAfterAdd.runner.npuAvailable).toBe(3);
    expect(stateAfterAdd.runner.npuTotal).toBe(3);
    
    // Subtract NPU
    manager.updateNpu(PlayerType.RUNNER, -2);
    const stateAfterSubtract = manager.getState();
    
    // Verify subtract
    expect(stateAfterSubtract.runner.npuAvailable).toBe(1);
    expect(stateAfterSubtract.runner.npuTotal).toBe(3); // Total shouldn't decrease
  });
  
  test('updates Corp HP correctly', () => {
    manager = new GameStateManager();
    
    // Damage the Corp
    manager.updateCorpHp(-2);
    const stateAfterDamage = manager.getState();
    
    // Verify damage
    expect(stateAfterDamage.corp.core.currentHp).toBe(3); // 5 - 2 = 3
    
    // Repair the Corp
    manager.updateCorpHp(1);
    const stateAfterRepair = manager.getState();
    
    // Verify repair
    expect(stateAfterRepair.corp.core.currentHp).toBe(4); // 3 + 1 = 4
  });
  
  test('switches active player correctly', () => {
    manager = new GameStateManager();
    
    // Initial player is RUNNER
    expect(manager.getState().activePlayer).toBe(PlayerType.RUNNER);
    
    // Switch to CORP
    manager.switchActivePlayer();
    expect(manager.getState().activePlayer).toBe(PlayerType.CORP);
    
    // Switch back to RUNNER
    manager.switchActivePlayer();
    expect(manager.getState().activePlayer).toBe(PlayerType.RUNNER);
  });
  
  test('advances phases correctly for Runner turn', () => {
    manager = new GameStateManager();
    const state = manager.getState();
    
    // Initial phase is DRAW
    expect(state.phase).toBe(PhaseType.DRAW);
    
    // DRAW -> NPU
    manager.advancePhase();
    expect(manager.getState().phase).toBe(PhaseType.NPU);
    
    // NPU -> MAIN
    manager.advancePhase();
    expect(manager.getState().phase).toBe(PhaseType.MAIN);
    
    // MAIN -> COMBAT (for Runner)
    manager.advancePhase();
    expect(manager.getState().phase).toBe(PhaseType.COMBAT);
    
    // COMBAT -> DRAW (and switch to Corp)
    manager.advancePhase();
    const finalState = manager.getState();
    expect(finalState.phase).toBe(PhaseType.DRAW);
    expect(finalState.activePlayer).toBe(PlayerType.CORP);
  });
  
  test('advances phases correctly for Corp turn', () => {
    manager = new GameStateManager();
    
    // Set active player to CORP
    const manualState = manager.getState();
    manualState.activePlayer = PlayerType.CORP;
    Object.defineProperty(manager, 'state', { value: manualState });
    
    // Initial phase is DRAW
    expect(manager.getState().phase).toBe(PhaseType.DRAW);
    
    // DRAW -> NPU
    manager.advancePhase();
    expect(manager.getState().phase).toBe(PhaseType.NPU);
    
    // NPU -> MAIN
    manager.advancePhase();
    expect(manager.getState().phase).toBe(PhaseType.MAIN);
    
    // MAIN -> DRAW (for Corp, no COMBAT)
    manager.advancePhase();
    const finalState = manager.getState();
    expect(finalState.phase).toBe(PhaseType.DRAW);
    expect(finalState.activePlayer).toBe(PlayerType.RUNNER);
    expect(finalState.turn).toBe(1); // Turn incremented
  });
  
  test('detects Runner win condition', () => {
    manager = new GameStateManager();
    
    // Reduce Corp HP to 0
    manager.updateCorpHp(-5);
    const state = manager.getState();
    
    // Verify win condition
    expect(state.gameOver).toBe(true);
    expect(state.winner).toBe(PlayerType.RUNNER);
  });
  
  test('detects Corp win condition', () => {
    manager = new GameStateManager();
    
    // Setup an empty Runner deck
    const manualState = manager.getState();
    manualState.runner.deck = [];
    manualState.phase = PhaseType.DRAW;
    Object.defineProperty(manager, 'state', { value: manualState });
    
    // Try to draw from empty deck
    manager.drawCards(PlayerType.RUNNER, 1);
    const state = manager.getState();
    
    // Verify win condition
    expect(state.gameOver).toBe(true);
    expect(state.winner).toBe(PlayerType.CORP);
  });
}); 