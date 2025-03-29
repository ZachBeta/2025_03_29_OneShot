import { CorpAI } from './CorpAI';
import { GameState } from '../models/GameState';
import { Card, NpuCard, IceCard } from '../models/Card';
import { PlayerType, PhaseType, CardType, IceType } from '../models/types';
import { ICEMechanics } from './ICEMechanics';

// Mock ICEMechanics
jest.mock('./ICEMechanics', () => ({
  ICEMechanics: {
    canBlock: jest.fn()
  }
}));

describe('CorpAI', () => {
  // Helper function to create a test game state
  const createGameState = (
    activePlayer: PlayerType = PlayerType.CORP,
    phase: PhaseType = PhaseType.MAIN,
    corpHand: Card[] = [],
    corpField: Card[] = [],
    corpNpu: number = 5
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
        field: [],
        npuAvailable: 3,
        npuTotal: 5
      },
      corp: {
        deck: [],
        hand: corpHand,
        field: corpField,
        npuAvailable: corpNpu,
        npuTotal: 5,
        core: {
          maxHp: 10,
          currentHp: 10
        }
      },
      eventLog: []
    };
  };

  // Helper to create an NPU card
  const createNpuCard = (
    id: string = 'npu-1',
    name: string = 'Test NPU',
    cost: number = 2
  ): NpuCard => {
    return {
      id,
      name,
      type: CardType.NPU,
      cost,
      ascii: ['Test NPU Card'],
      flavorText: 'Test flavor text'
    };
  };

  // Helper to create an ICE card
  const createIceCard = (
    id: string = 'ice-1',
    name: string = 'Test ICE',
    cost: number = 3,
    power: number = 2,
    toughness: number = 2
  ): IceCard => {
    return {
      id,
      name,
      type: CardType.ICE,
      iceType: IceType.BARRIER,
      cost,
      power,
      toughness,
      ascii: ['Test ICE'],
      flavorText: 'Test flavor text'
    };
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getNextAction', () => {
    test('returns null when it is not Corp turn and not Combat phase', () => {
      const gameState = createGameState(PlayerType.RUNNER, PhaseType.MAIN);
      const action = CorpAI.getNextAction(gameState);
      expect(action).toBeNull();
    });

    test('returns EndPhase action for Draw phase', () => {
      const gameState = createGameState(PlayerType.CORP, PhaseType.DRAW);
      const action = CorpAI.getNextAction(gameState);
      expect(action).toEqual({ type: 'EndPhase' });
    });

    test('returns EndPhase action for NPU phase', () => {
      const gameState = createGameState(PlayerType.CORP, PhaseType.NPU);
      const action = CorpAI.getNextAction(gameState);
      expect(action).toEqual({ type: 'EndPhase' });
    });

    test('calls getBlockingDecision during Runner Combat phase', () => {
      const gameState = createGameState(PlayerType.RUNNER, PhaseType.COMBAT);
      const spy = jest.spyOn(CorpAI as any, 'getBlockingDecision').mockReturnValue(null);
      
      CorpAI.getNextAction(gameState);
      
      expect(spy).toHaveBeenCalledWith(gameState);
      spy.mockRestore();
    });

    test('calls getMainPhaseAction during Corp Main phase', () => {
      const gameState = createGameState(PlayerType.CORP, PhaseType.MAIN);
      const spy = jest.spyOn(CorpAI as any, 'getMainPhaseAction').mockReturnValue({ type: 'EndPhase' });
      
      CorpAI.getNextAction(gameState);
      
      expect(spy).toHaveBeenCalledWith(gameState);
      spy.mockRestore();
    });
  });

  describe('getMainPhaseAction', () => {
    test('prioritizes playing NPU cards', () => {
      const npuCard = createNpuCard('npu-1', 'Test NPU', 2);
      const iceCard = createIceCard('ice-1', 'Test ICE', 3);
      const gameState = createGameState(
        PlayerType.CORP,
        PhaseType.MAIN,
        [npuCard, iceCard],
        [],
        5 // Enough NPU to play either card
      );
      
      const action = CorpAI['getMainPhaseAction'](gameState);
      
      expect(action).toEqual({ type: 'PlayNPU', cardIndex: 0 });
    });

    test('plays ICE cards if no NPU cards can be played', () => {
      const npuCard = createNpuCard('npu-1', 'Test NPU', 6); // Too expensive
      const iceCard = createIceCard('ice-1', 'Test ICE', 3);
      const gameState = createGameState(
        PlayerType.CORP,
        PhaseType.MAIN,
        [npuCard, iceCard],
        [],
        5 // Only enough for ICE
      );
      
      const action = CorpAI['getMainPhaseAction'](gameState);
      
      expect(action).toEqual({ type: 'PlayCard', cardIndex: 1 });
    });

    test('ends phase if no cards can be played', () => {
      const npuCard = createNpuCard('npu-1', 'Test NPU', 6); // Too expensive
      const iceCard = createIceCard('ice-1', 'Test ICE', 7); // Too expensive
      const gameState = createGameState(
        PlayerType.CORP,
        PhaseType.MAIN,
        [npuCard, iceCard],
        [],
        5 // Not enough for either card
      );
      
      const action = CorpAI['getMainPhaseAction'](gameState);
      
      expect(action).toEqual({ type: 'EndPhase' });
    });

    test('ends phase if hand is empty', () => {
      const gameState = createGameState(
        PlayerType.CORP,
        PhaseType.MAIN,
        [], // Empty hand
        [],
        5
      );
      
      const action = CorpAI['getMainPhaseAction'](gameState);
      
      expect(action).toEqual({ type: 'EndPhase' });
    });
  });

  describe('findPlayableNpuCardIndex', () => {
    test('returns index of playable NPU card', () => {
      const npuCard1 = createNpuCard('npu-1', 'Test NPU 1', 6); // Too expensive
      const npuCard2 = createNpuCard('npu-2', 'Test NPU 2', 2); // Affordable
      const gameState = createGameState(
        PlayerType.CORP,
        PhaseType.MAIN,
        [npuCard1, npuCard2],
        [],
        5
      );
      
      const index = CorpAI['findPlayableNpuCardIndex'](gameState);
      expect(index).toBe(1);
    });

    test('returns -1 if no NPU cards can be played', () => {
      const npuCard = createNpuCard('npu-1', 'Test NPU', 6); // Too expensive
      const iceCard = createIceCard('ice-1', 'Test ICE', 3);
      const gameState = createGameState(
        PlayerType.CORP,
        PhaseType.MAIN,
        [npuCard, iceCard],
        [],
        5
      );
      
      const index = CorpAI['findPlayableNpuCardIndex'](gameState);
      expect(index).toBe(-1);
    });
  });

  describe('findPlayableIceCardIndex', () => {
    test('returns index of playable ICE card', () => {
      const iceCard1 = createIceCard('ice-1', 'Test ICE 1', 6); // Too expensive
      const iceCard2 = createIceCard('ice-2', 'Test ICE 2', 3); // Affordable
      const gameState = createGameState(
        PlayerType.CORP,
        PhaseType.MAIN,
        [iceCard1, iceCard2],
        [],
        5
      );
      
      const index = CorpAI['findPlayableIceCardIndex'](gameState);
      expect(index).toBe(1);
    });

    test('returns -1 if no ICE cards can be played', () => {
      const npuCard = createNpuCard('npu-1', 'Test NPU', 2);
      const iceCard = createIceCard('ice-1', 'Test ICE', 6); // Too expensive
      const gameState = createGameState(
        PlayerType.CORP,
        PhaseType.MAIN,
        [npuCard, iceCard],
        [],
        5
      );
      
      const index = CorpAI['findPlayableIceCardIndex'](gameState);
      expect(index).toBe(-1);
    });
  });

  describe('getBlockingDecision', () => {
    test('returns null if no ICE on field', () => {
      const gameState = createGameState(
        PlayerType.RUNNER,
        PhaseType.COMBAT,
        [],
        [] // No ICE
      );
      
      const action = CorpAI['getBlockingDecision'](gameState);
      expect(action).toBeNull();
    });

    test('returns null if no ICE can block', () => {
      const ice1 = createIceCard('ice-1', 'Test ICE 1');
      const ice2 = createIceCard('ice-2', 'Test ICE 2');
      const gameState = createGameState(
        PlayerType.RUNNER,
        PhaseType.COMBAT,
        [],
        [ice1, ice2]
      );
      
      // Mock ICEMechanics.canBlock to always return false
      (ICEMechanics.canBlock as jest.Mock).mockReturnValue(false);
      
      const action = CorpAI['getBlockingDecision'](gameState);
      expect(action).toBeNull();
    });

    test('returns block action with oldest ICE that can block', () => {
      const ice1 = createIceCard('ice-1', 'Test ICE 1');
      const ice2 = createIceCard('ice-2', 'Test ICE 2');
      const gameState = createGameState(
        PlayerType.RUNNER,
        PhaseType.COMBAT,
        [],
        [ice1, ice2]
      );
      
      // Mock ICEMechanics.canBlock to return true only for the first ICE
      (ICEMechanics.canBlock as jest.Mock)
        .mockImplementation((state, index) => index === 0);
      
      const action = CorpAI['getBlockingDecision'](gameState);
      expect(action).toEqual({ type: 'Block', iceIndex: 0 });
    });
  });

  describe('getIcePlacementIndex', () => {
    test('returns the next available index at the end of field', () => {
      const ice1 = createIceCard('ice-1', 'Test ICE 1');
      const ice2 = createIceCard('ice-2', 'Test ICE 2');
      const gameState = createGameState(
        PlayerType.CORP,
        PhaseType.MAIN,
        [],
        [ice1, ice2]
      );
      
      const index = CorpAI.getIcePlacementIndex(gameState);
      expect(index).toBe(2);
    });

    test('returns 0 for empty field', () => {
      const gameState = createGameState(
        PlayerType.CORP,
        PhaseType.MAIN,
        [],
        [] // Empty field
      );
      
      const index = CorpAI.getIcePlacementIndex(gameState);
      expect(index).toBe(0);
    });
  });
}); 