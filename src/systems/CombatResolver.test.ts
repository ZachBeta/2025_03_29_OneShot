import { CombatResolver, CombatError } from './CombatResolver';
import { GameState } from '../models/GameState';
import { Card, ProgramCard, IceCard } from '../models/Card';
import { PlayerType, PhaseType, CardType, IceType, ProgramType, EventType } from '../models/types';

// Mock the dependencies
jest.mock('./ProgramMechanics', () => ({
  ProgramMechanics: {
    canAttack: jest.fn(),
    calculateDamage: jest.fn()
  }
}));

jest.mock('./ICEMechanics', () => ({
  ICEMechanics: {
    canBlock: jest.fn(),
    calculateDamage: jest.fn()
  }
}));

import { ProgramMechanics } from './ProgramMechanics';
import { ICEMechanics } from './ICEMechanics';

describe('CombatResolver', () => {
  // Helper function to create a test game state
  const createGameState = (
    activePlayer: PlayerType = PlayerType.RUNNER,
    phase: PhaseType = PhaseType.COMBAT,
    runnerPrograms: ProgramCard[] = [],
    corpIce: IceCard[] = [],
    corpHp: number = 10
  ): GameState => {
    return {
      turn: 1,
      phase,
      activePlayer,
      gameOver: false,
      winner: undefined,
      runner: {
        deck: [],
        hand: [],
        field: runnerPrograms,
        npuAvailable: 3,
        npuTotal: 5
      },
      corp: {
        deck: [],
        hand: [],
        field: corpIce,
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

  // Helper to create a program card
  const createProgramCard = (
    id: string = 'program-1',
    name: string = 'Test Program',
    power: number = 2,
    toughness: number = 2
  ): ProgramCard => {
    return {
      id,
      name,
      type: CardType.PROGRAM,
      programType: ProgramType.FRACTER,
      cost: 2,
      power,
      toughness,
      ascii: ['Test Program'],
      flavorText: 'Test flavor text'
    };
  };

  // Helper to create an ICE card
  const createIceCard = (
    id: string = 'ice-1',
    name: string = 'Test ICE',
    power: number = 2,
    toughness: number = 2
  ): IceCard => {
    return {
      id,
      name,
      type: CardType.ICE,
      iceType: IceType.BARRIER,
      cost: 2,
      power,
      toughness,
      ascii: ['Test ICE'],
      flavorText: 'Test flavor text'
    };
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('declareAttack', () => {
    test('throws error if program cannot attack', () => {
      const program = createProgramCard();
      const gameState = createGameState(PlayerType.RUNNER, PhaseType.COMBAT, [program]);
      
      // Mock canAttack to return false
      (ProgramMechanics.canAttack as jest.Mock).mockReturnValue(false);
      
      expect(() => CombatResolver.declareAttack(gameState, 0)).toThrow(CombatError);
    });

    test('successfully declares an attack', () => {
      const program = createProgramCard();
      const gameState = createGameState(PlayerType.RUNNER, PhaseType.COMBAT, [program]);
      
      // Mock canAttack to return true
      (ProgramMechanics.canAttack as jest.Mock).mockReturnValue(true);
      
      const newState = CombatResolver.declareAttack(gameState, 0);
      
      expect(newState.eventLog.length).toBe(1);
      expect(newState.eventLog[0].message).toContain('declares attack');
      expect(newState.eventLog[0].metadata).toEqual(
        expect.objectContaining({ cardId: program.id, cardName: program.name })
      );
    });
  });

  describe('declareBlock', () => {
    test('throws error if there is no valid attack', () => {
      const program = createProgramCard();
      const ice = createIceCard();
      const gameState = createGameState(
        PlayerType.RUNNER, 
        PhaseType.COMBAT, 
        [program],
        [ice]
      );
      
      // Mock canAttack to return false
      (ProgramMechanics.canAttack as jest.Mock).mockReturnValue(false);
      
      expect(() => CombatResolver.declareBlock(gameState, 0, 0)).toThrow(CombatError);
    });

    test('throws error if ICE cannot block', () => {
      const program = createProgramCard();
      const ice = createIceCard();
      const gameState = createGameState(
        PlayerType.RUNNER, 
        PhaseType.COMBAT, 
        [program],
        [ice]
      );
      
      // Mock canAttack to return true but canBlock to return false
      (ProgramMechanics.canAttack as jest.Mock).mockReturnValue(true);
      (ICEMechanics.canBlock as jest.Mock).mockReturnValue(false);
      
      expect(() => CombatResolver.declareBlock(gameState, 0, 0)).toThrow(CombatError);
    });

    test('resolves unblocked attack when iceIndex is -1', () => {
      const program = createProgramCard('program-1', 'Test Program', 3, 3);
      const gameState = createGameState(
        PlayerType.RUNNER, 
        PhaseType.COMBAT, 
        [program],
        []
      );
      
      // Mock canAttack and calculateDamage
      (ProgramMechanics.canAttack as jest.Mock).mockReturnValue(true);
      (ProgramMechanics.calculateDamage as jest.Mock).mockReturnValue(3);
      
      const newState = CombatResolver.declareBlock(gameState, 0, -1);
      
      expect(newState.corp.core.currentHp).toBe(7); // 10 - 3
      expect(newState.eventLog.length).toBe(2);
      expect(newState.eventLog[0].message).toContain('unblocked');
      expect(newState.eventLog[1].message).toContain('deals 3 damage');
    });

    test('resolves blocked attack with combat between program and ICE', () => {
      const program = createProgramCard('program-1', 'Test Program', 3, 3);
      const ice = createIceCard('ice-1', 'Test ICE', 2, 2);
      const gameState = createGameState(
        PlayerType.RUNNER, 
        PhaseType.COMBAT, 
        [program],
        [ice]
      );
      
      // Mock required methods
      (ProgramMechanics.canAttack as jest.Mock).mockReturnValue(true);
      (ICEMechanics.canBlock as jest.Mock).mockReturnValue(true);
      (ProgramMechanics.calculateDamage as jest.Mock).mockReturnValue(3);
      (ICEMechanics.calculateDamage as jest.Mock).mockReturnValue(2);
      
      const newState = CombatResolver.declareBlock(gameState, 0, 0);
      
      // Check that block is logged
      expect(newState.eventLog[0].message).toContain('blocks with');
      expect(newState.eventLog[0].metadata).toEqual(
        expect.objectContaining({ cardId: ice.id, cardName: ice.name })
      );
      
      // Check damage logs
      expect(newState.eventLog[1].message).toContain('deals 3 damage');
      expect(newState.eventLog[2].message).toContain('deals 2 damage');
      
      // Since program damage (3) > ice toughness (2), ice should be destroyed
      expect(newState.eventLog[3].message).toContain('is destroyed');
      expect(newState.corp.field.length).toBe(0);
      
      // Since ice damage (2) < program toughness (3), program should survive
      expect(newState.runner.field.length).toBe(1);
    });

    test('both cards are destroyed when damage equals or exceeds toughness', () => {
      const program = createProgramCard('program-1', 'Test Program', 3, 2);
      const ice = createIceCard('ice-1', 'Test ICE', 2, 3);
      const gameState = createGameState(
        PlayerType.RUNNER, 
        PhaseType.COMBAT, 
        [program],
        [ice]
      );
      
      // Mock required methods
      (ProgramMechanics.canAttack as jest.Mock).mockReturnValue(true);
      (ICEMechanics.canBlock as jest.Mock).mockReturnValue(true);
      (ProgramMechanics.calculateDamage as jest.Mock).mockReturnValue(3);
      (ICEMechanics.calculateDamage as jest.Mock).mockReturnValue(3);
      
      const newState = CombatResolver.declareBlock(gameState, 0, 0);
      
      // Both cards should be destroyed
      expect(newState.runner.field.length).toBe(0);
      expect(newState.corp.field.length).toBe(0);
      expect(newState.eventLog.length).toBe(5); // block + 2 damage logs + 2 destroy logs
    });
  });

  describe('clearCombatEffects', () => {
    test('adds a log entry for combat phase end', () => {
      const gameState = createGameState();
      const newState = CombatResolver.clearCombatEffects(gameState);
      
      expect(newState.eventLog.length).toBe(1);
      expect(newState.eventLog[0].message).toBe('Combat phase ended');
      expect(newState.eventLog[0].metadata).toEqual({ phase: 'COMBAT' });
    });
  });
}); 