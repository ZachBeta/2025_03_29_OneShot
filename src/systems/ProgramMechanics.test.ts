import { ProgramMechanics, ProgramError } from './ProgramMechanics';
import { GameState } from '../models/GameState';
import { Card, ProgramCard, NpuCard } from '../models/Card';
import { CardType, PlayerType, PhaseType, ProgramType, IceType } from '../models/types';

describe('ProgramMechanics', () => {
  // Helper functions to create test cards
  const createProgramCard = (programType: ProgramType, cost: number, power: number): ProgramCard => ({
    id: `program-${programType}-${Math.random()}`,
    name: `Test ${programType}`,
    type: CardType.PROGRAM,
    programType,
    cost,
    power,
    toughness: 2,
    ascii: ['Test Program'],
    flavorText: 'Test program flavor text'
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
    activePlayer: PlayerType = PlayerType.RUNNER,
    runnerNpu: number = 5,
    hand: Card[] = [],
    field: Card[] = []
  ): GameState => ({
    turn: 1,
    phase,
    activePlayer,
    gameOver: false,
    winner: undefined,
    runner: {
      deck: [],
      hand,
      field,
      npuAvailable: runnerNpu,
      npuTotal: 10
    },
    corp: {
      deck: [],
      hand: [],
      field: [],
      npuAvailable: 3,
      npuTotal: 5,
      core: {
        maxHp: 10,
        currentHp: 10
      }
    },
    eventLog: []
  });
  
  describe('canInstallProgram', () => {
    test('returns false for invalid card index', () => {
      const gameState = createGameState();
      
      expect(ProgramMechanics.canInstallProgram(gameState, -1)).toBe(false);
      expect(ProgramMechanics.canInstallProgram(gameState, 0)).toBe(false);
    });
    
    test('returns false for non-program cards', () => {
      const hand = [createNpuCard()];
      const gameState = createGameState(PhaseType.MAIN, PlayerType.RUNNER, 5, hand);
      
      expect(ProgramMechanics.canInstallProgram(gameState, 0)).toBe(false);
    });
    
    test('returns false if not enough NPU', () => {
      const expensiveProgram = createProgramCard(ProgramType.FRACTER, 10, 3);
      const hand = [expensiveProgram];
      const gameState = createGameState(PhaseType.MAIN, PlayerType.RUNNER, 5, hand);
      
      expect(ProgramMechanics.canInstallProgram(gameState, 0)).toBe(false);
    });
    
    test('returns true for valid program installation', () => {
      const program = createProgramCard(ProgramType.FRACTER, 3, 2);
      const hand = [program];
      const gameState = createGameState(PhaseType.MAIN, PlayerType.RUNNER, 5, hand);
      
      expect(ProgramMechanics.canInstallProgram(gameState, 0)).toBe(true);
    });
  });
  
  describe('installProgram', () => {
    test('throws error if program cannot be installed', () => {
      const gameState = createGameState();
      
      expect(() => ProgramMechanics.installProgram(gameState, 0)).toThrow(ProgramError);
      expect(() => ProgramMechanics.installProgram(gameState, 0)).toThrow('Cannot install program');
    });
    
    test('installs program and updates game state', () => {
      const program = createProgramCard(ProgramType.FRACTER, 3, 2);
      const hand = [program];
      const gameState = createGameState(PhaseType.MAIN, PlayerType.RUNNER, 5, hand);
      
      const newState = ProgramMechanics.installProgram(gameState, 0);
      
      // Program should be removed from hand
      expect(newState.runner.hand).toHaveLength(0);
      
      // Program should be added to field
      expect(newState.runner.field).toHaveLength(1);
      expect(newState.runner.field[0]).toBe(program);
      
      // NPU should be deducted
      expect(newState.runner.npuAvailable).toBe(2);
      
      // Log entry should be added
      expect(newState.eventLog).toHaveLength(1);
      expect(newState.eventLog[0].message).toContain('installed');
      expect(newState.eventLog[0].message).toContain(program.name);
    });
  });
  
  describe('calculateEffectiveness', () => {
    test('returns 1.5 effectiveness for Fracter vs Barrier', () => {
      const fracter = createProgramCard(ProgramType.FRACTER, 3, 2);
      
      const effectiveness = ProgramMechanics.calculateEffectiveness(fracter, IceType.BARRIER);
      
      expect(effectiveness).toBe(1.5);
    });
    
    test('returns default effectiveness for other combinations', () => {
      const fracter = createProgramCard(ProgramType.FRACTER, 3, 2);
      const decoder = createProgramCard(ProgramType.DECODER, 3, 2);
      
      // Fracter vs non-Barrier
      expect(ProgramMechanics.calculateEffectiveness(fracter, IceType.SENTRY)).toBe(1.0);
      
      // Other program vs Barrier
      expect(ProgramMechanics.calculateEffectiveness(decoder, IceType.BARRIER)).toBe(1.0);
      
      // Other program vs other ICE
      expect(ProgramMechanics.calculateEffectiveness(decoder, IceType.CODE_GATE)).toBe(1.0);
    });
  });
  
  describe('canAttack', () => {
    test('returns false if not in combat phase', () => {
      const program = createProgramCard(ProgramType.FRACTER, 3, 2);
      const field = [program];
      const gameState = createGameState(PhaseType.MAIN, PlayerType.RUNNER, 5, [], field);
      
      expect(ProgramMechanics.canAttack(gameState, 0)).toBe(false);
    });
    
    test('returns false if not runner\'s turn', () => {
      const program = createProgramCard(ProgramType.FRACTER, 3, 2);
      const field = [program];
      const gameState = createGameState(PhaseType.COMBAT, PlayerType.CORP, 5, [], field);
      
      expect(ProgramMechanics.canAttack(gameState, 0)).toBe(false);
    });
    
    test('returns false for invalid program index', () => {
      const program = createProgramCard(ProgramType.FRACTER, 3, 2);
      const field = [program];
      const gameState = createGameState(PhaseType.COMBAT, PlayerType.RUNNER, 5, [], field);
      
      expect(ProgramMechanics.canAttack(gameState, -1)).toBe(false);
      expect(ProgramMechanics.canAttack(gameState, 1)).toBe(false);
    });
    
    test('returns false for non-program cards', () => {
      const npu = createNpuCard();
      const field = [npu];
      const gameState = createGameState(PhaseType.COMBAT, PlayerType.RUNNER, 5, [], field);
      
      expect(ProgramMechanics.canAttack(gameState, 0)).toBe(false);
    });
    
    test('returns true for valid program attack', () => {
      const program = createProgramCard(ProgramType.FRACTER, 3, 2);
      const field = [program];
      const gameState = createGameState(PhaseType.COMBAT, PlayerType.RUNNER, 5, [], field);
      
      expect(ProgramMechanics.canAttack(gameState, 0)).toBe(true);
    });
  });
  
  describe('calculateDamage', () => {
    test('returns base power as damage when no ICE type provided', () => {
      const program = createProgramCard(ProgramType.FRACTER, 3, 2);
      
      const damage = ProgramMechanics.calculateDamage(program);
      
      expect(damage).toBe(2);
    });
    
    test('applies effectiveness multiplier when ICE type provided', () => {
      const fracter = createProgramCard(ProgramType.FRACTER, 3, 2);
      
      // Fracter vs Barrier (1.5x effectiveness)
      const damageVsBarrier = ProgramMechanics.calculateDamage(fracter, IceType.BARRIER);
      expect(damageVsBarrier).toBe(3); // 2 * 1.5 = 3
      
      // Fracter vs Sentry (1.0x effectiveness)
      const damageVsSentry = ProgramMechanics.calculateDamage(fracter, IceType.SENTRY);
      expect(damageVsSentry).toBe(2); // 2 * 1.0 = 2
    });
  });
}); 