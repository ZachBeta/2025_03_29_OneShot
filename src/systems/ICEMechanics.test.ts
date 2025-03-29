import { ICEMechanics, ICEError } from './ICEMechanics';
import { GameState } from '../models/GameState';
import { Card, IceCard, NpuCard } from '../models/Card';
import { CardType, PlayerType, PhaseType, IceType } from '../models/types';

describe('ICEMechanics', () => {
  // Helper functions to create test cards
  const createIceCard = (iceType: IceType, cost: number, power: number): IceCard => ({
    id: `ice-${iceType}-${Math.random()}`,
    name: `Test ${iceType}`,
    type: CardType.ICE,
    iceType,
    cost,
    power,
    toughness: 3,
    ascii: ['Test ICE'],
    flavorText: 'Test ICE flavor text'
  });
  
  const createNpuCard = (): NpuCard => ({
    id: `npu-${Math.random()}`,
    name: 'Test NPU',
    type: CardType.NPU,
    cost: 1,
    ascii: ['Test NPU'],
    flavorText: 'Test NPU flavor text'
  });
  
  // Helper function to create a test game state
  const createGameState = (
    phase: PhaseType = PhaseType.MAIN,
    activePlayer: PlayerType = PlayerType.CORP,
    corpNpu: number = 5,
    hand: Card[] = [],
    field: Card[] = [],
    coreHp: number = 10
  ): GameState => ({
    turn: 1,
    phase,
    activePlayer,
    gameOver: false,
    winner: undefined,
    runner: {
      deck: [],
      hand: [],
      field: [],
      npuAvailable: 3,
      npuTotal: 5
    },
    corp: {
      deck: [],
      hand,
      field,
      npuAvailable: corpNpu,
      npuTotal: 10,
      core: {
        maxHp: 10,
        currentHp: coreHp
      }
    },
    eventLog: []
  });
  
  describe('canInstallICE', () => {
    test('returns false for invalid card index', () => {
      const gameState = createGameState();
      
      expect(ICEMechanics.canInstallICE(gameState, -1)).toBe(false);
      expect(ICEMechanics.canInstallICE(gameState, 0)).toBe(false);
    });
    
    test('returns false for non-ICE cards', () => {
      const hand = [createNpuCard()];
      const gameState = createGameState(PhaseType.MAIN, PlayerType.CORP, 5, hand);
      
      expect(ICEMechanics.canInstallICE(gameState, 0)).toBe(false);
    });
    
    test('returns false if not enough NPU', () => {
      const expensiveIce = createIceCard(IceType.BARRIER, 10, 3);
      const hand = [expensiveIce];
      const gameState = createGameState(PhaseType.MAIN, PlayerType.CORP, 5, hand);
      
      expect(ICEMechanics.canInstallICE(gameState, 0)).toBe(false);
    });
    
    test('returns false if not in Corp main phase', () => {
      const ice = createIceCard(IceType.BARRIER, 3, 2);
      const hand = [ice];
      
      // Wrong phase
      const stateWrongPhase = createGameState(PhaseType.COMBAT, PlayerType.CORP, 5, hand);
      expect(ICEMechanics.canInstallICE(stateWrongPhase, 0)).toBe(false);
      
      // Wrong player
      const stateWrongPlayer = createGameState(PhaseType.MAIN, PlayerType.RUNNER, 5, hand);
      expect(ICEMechanics.canInstallICE(stateWrongPlayer, 0)).toBe(false);
    });
    
    test('returns true for valid ICE installation', () => {
      const ice = createIceCard(IceType.BARRIER, 3, 2);
      const hand = [ice];
      const gameState = createGameState(PhaseType.MAIN, PlayerType.CORP, 5, hand);
      
      expect(ICEMechanics.canInstallICE(gameState, 0)).toBe(true);
    });
  });
  
  describe('installICE', () => {
    test('throws error if ICE cannot be installed', () => {
      const gameState = createGameState();
      
      expect(() => ICEMechanics.installICE(gameState, 0)).toThrow(ICEError);
      expect(() => ICEMechanics.installICE(gameState, 0)).toThrow('Cannot install ICE');
    });
    
    test('installs ICE and updates game state', () => {
      const ice = createIceCard(IceType.BARRIER, 3, 2);
      const hand = [ice];
      const gameState = createGameState(PhaseType.MAIN, PlayerType.CORP, 5, hand);
      
      const newState = ICEMechanics.installICE(gameState, 0);
      
      // ICE should be removed from hand
      expect(newState.corp.hand).toHaveLength(0);
      
      // ICE should be added to field
      expect(newState.corp.field).toHaveLength(1);
      expect(newState.corp.field[0]).toBe(ice);
      
      // NPU should be deducted
      expect(newState.corp.npuAvailable).toBe(2);
      
      // Log entry should be added
      expect(newState.eventLog).toHaveLength(1);
      expect(newState.eventLog[0].message).toContain('installed');
      expect(newState.eventLog[0].message).toContain(ice.name);
      expect(newState.eventLog[0].message).toContain(ice.iceType);
    });
  });
  
  describe('canBlock', () => {
    test('returns false for invalid ICE index', () => {
      const gameState = createGameState(PhaseType.COMBAT, PlayerType.RUNNER);
      
      expect(ICEMechanics.canBlock(gameState, -1)).toBe(false);
      expect(ICEMechanics.canBlock(gameState, 0)).toBe(false);
    });
    
    test('returns false for non-ICE cards', () => {
      const npu = createNpuCard();
      const field = [npu];
      const gameState = createGameState(PhaseType.COMBAT, PlayerType.RUNNER, 5, [], field);
      
      expect(ICEMechanics.canBlock(gameState, 0)).toBe(false);
    });
    
    test('returns false if not in Runner combat phase', () => {
      const ice = createIceCard(IceType.BARRIER, 3, 2);
      const field = [ice];
      
      // Wrong phase
      const stateWrongPhase = createGameState(PhaseType.MAIN, PlayerType.RUNNER, 5, [], field);
      expect(ICEMechanics.canBlock(stateWrongPhase, 0)).toBe(false);
      
      // Wrong player
      const stateWrongPlayer = createGameState(PhaseType.COMBAT, PlayerType.CORP, 5, [], field);
      expect(ICEMechanics.canBlock(stateWrongPlayer, 0)).toBe(false);
    });
    
    test('returns true for valid ICE blocking', () => {
      const ice = createIceCard(IceType.BARRIER, 3, 2);
      const field = [ice];
      const gameState = createGameState(PhaseType.COMBAT, PlayerType.RUNNER, 5, [], field);
      
      expect(ICEMechanics.canBlock(gameState, 0)).toBe(true);
    });
  });
  
  describe('calculateDamage', () => {
    test('returns base power as damage for non-Barrier ICE', () => {
      const sentryIce = createIceCard(IceType.SENTRY, 3, 2);
      const codeGateIce = createIceCard(IceType.CODE_GATE, 3, 4);
      
      expect(ICEMechanics.calculateDamage(sentryIce)).toBe(2);
      expect(ICEMechanics.calculateDamage(codeGateIce)).toBe(4);
    });
    
    test('adds 1 to power for Barrier ICE', () => {
      const barrierIce = createIceCard(IceType.BARRIER, 3, 2);
      
      expect(ICEMechanics.calculateDamage(barrierIce)).toBe(3); // 2 + 1
    });
  });
  
  describe('canUseSpecialAbility', () => {
    test('returns true for Barrier ICE', () => {
      const barrierIce = createIceCard(IceType.BARRIER, 3, 2);
      
      expect(ICEMechanics.canUseSpecialAbility(barrierIce)).toBe(true);
    });
    
    test('returns false for non-Barrier ICE', () => {
      const sentryIce = createIceCard(IceType.SENTRY, 3, 2);
      const codeGateIce = createIceCard(IceType.CODE_GATE, 3, 4);
      
      expect(ICEMechanics.canUseSpecialAbility(sentryIce)).toBe(false);
      expect(ICEMechanics.canUseSpecialAbility(codeGateIce)).toBe(false);
    });
  });
  
  describe('useBarrierAbility', () => {
    test('throws error for invalid ICE index', () => {
      const gameState = createGameState();
      
      expect(() => ICEMechanics.useBarrierAbility(gameState, -1)).toThrow(ICEError);
      expect(() => ICEMechanics.useBarrierAbility(gameState, 0)).toThrow(ICEError);
    });
    
    test('throws error for non-Barrier ICE', () => {
      const sentryIce = createIceCard(IceType.SENTRY, 3, 2);
      const field = [sentryIce];
      const gameState = createGameState(PhaseType.MAIN, PlayerType.CORP, 5, [], field);
      
      expect(() => ICEMechanics.useBarrierAbility(gameState, 0)).toThrow(ICEError);
      expect(() => ICEMechanics.useBarrierAbility(gameState, 0)).toThrow('Only Barrier ICE');
    });
    
    test('throws error if not in Corp main phase', () => {
      const barrierIce = createIceCard(IceType.BARRIER, 3, 2);
      const field = [barrierIce];
      
      // Wrong phase
      const stateWrongPhase = createGameState(PhaseType.COMBAT, PlayerType.CORP, 5, [], field);
      expect(() => ICEMechanics.useBarrierAbility(stateWrongPhase, 0)).toThrow(ICEError);
      
      // Wrong player
      const stateWrongPlayer = createGameState(PhaseType.MAIN, PlayerType.RUNNER, 5, [], field);
      expect(() => ICEMechanics.useBarrierAbility(stateWrongPlayer, 0)).toThrow(ICEError);
    });
    
    test('heals Corp core by 1 HP', () => {
      const barrierIce = createIceCard(IceType.BARRIER, 3, 2);
      const field = [barrierIce];
      const gameState = createGameState(PhaseType.MAIN, PlayerType.CORP, 5, [], field, 7);
      
      const newState = ICEMechanics.useBarrierAbility(gameState, 0);
      
      // Core HP should increase by 1
      expect(newState.corp.core.currentHp).toBe(8);
      
      // Log entry should be added
      expect(newState.eventLog).toHaveLength(1);
      expect(newState.eventLog[0].message).toContain('special ability');
      expect(newState.eventLog[0].message).toContain('heal');
      expect(newState.eventLog[0].message).toContain('1 HP');
    });
    
    test('does not heal beyond max HP', () => {
      const barrierIce = createIceCard(IceType.BARRIER, 3, 2);
      const field = [barrierIce];
      const gameState = createGameState(PhaseType.MAIN, PlayerType.CORP, 5, [], field, 10);
      
      const newState = ICEMechanics.useBarrierAbility(gameState, 0);
      
      // Core HP should remain at max
      expect(newState.corp.core.currentHp).toBe(10);
    });
  });
}); 