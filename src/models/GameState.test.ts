/**
 * Tests for GameState model
 */

import { CardType, PhaseType, PlayerType, EventType } from './types';
import { Card } from './Card';
import { GameState, PlayerState, RunnerState, CorpState } from './GameState';
import { LogEntry } from './LogEntry';

describe('GameState', () => {
  // Sample card for testing
  const sampleCard: Card = {
    id: 'sample1',
    name: 'Sample Card',
    type: CardType.NPU,
    cost: 1,
    ascii: ['Sample'],
    flavorText: 'Sample text'
  };

  // Sample log entry for testing
  const sampleLogEntry: LogEntry = {
    timestamp: '2023-04-01T12:00:00Z',
    message: 'Game started',
    type: EventType.GAME
  };

  describe('PlayerState', () => {
    test('can create a basic player state', () => {
      const playerState: PlayerState = {
        deck: [sampleCard],
        hand: [],
        field: [],
        npuAvailable: 0,
        npuTotal: 0
      };

      expect(playerState.deck).toHaveLength(1);
      expect(playerState.hand).toHaveLength(0);
      expect(playerState.field).toHaveLength(0);
      expect(playerState.npuAvailable).toBe(0);
      expect(playerState.npuTotal).toBe(0);
    });
  });

  describe('RunnerState', () => {
    test('can create a Runner state', () => {
      const runnerState: RunnerState = {
        deck: [sampleCard],
        hand: [],
        field: [],
        npuAvailable: 0,
        npuTotal: 0
      };

      expect(runnerState.deck).toHaveLength(1);
    });
  });

  describe('CorpState', () => {
    test('can create a Corp state with core HP', () => {
      const corpState: CorpState = {
        deck: [],
        hand: [sampleCard],
        field: [],
        npuAvailable: 1,
        npuTotal: 1,
        core: {
          maxHp: 5,
          currentHp: 5
        }
      };

      expect(corpState.hand).toHaveLength(1);
      expect(corpState.core.maxHp).toBe(5);
      expect(corpState.core.currentHp).toBe(5);
    });
  });

  describe('GameState', () => {
    test('can create a complete game state', () => {
      const gameState: GameState = {
        turn: 1,
        activePlayer: PlayerType.RUNNER,
        phase: PhaseType.DRAW,
        runner: {
          deck: [sampleCard, sampleCard],
          hand: [],
          field: [],
          npuAvailable: 0,
          npuTotal: 0
        },
        corp: {
          deck: [sampleCard],
          hand: [],
          field: [],
          npuAvailable: 0,
          npuTotal: 0,
          core: {
            maxHp: 5,
            currentHp: 5
          }
        },
        eventLog: [sampleLogEntry],
        gameOver: false
      };

      expect(gameState.turn).toBe(1);
      expect(gameState.activePlayer).toBe(PlayerType.RUNNER);
      expect(gameState.phase).toBe(PhaseType.DRAW);
      expect(gameState.runner.deck).toHaveLength(2);
      expect(gameState.corp.deck).toHaveLength(1);
      expect(gameState.corp.core.currentHp).toBe(5);
      expect(gameState.eventLog).toHaveLength(1);
      expect(gameState.gameOver).toBe(false);
      expect(gameState.winner).toBeUndefined();
    });

    test('can represent a finished game', () => {
      const gameState: GameState = {
        turn: 10,
        activePlayer: PlayerType.CORP,
        phase: PhaseType.MAIN,
        runner: {
          deck: [],
          hand: [],
          field: [],
          npuAvailable: 5,
          npuTotal: 5
        },
        corp: {
          deck: [],
          hand: [],
          field: [],
          npuAvailable: 3,
          npuTotal: 5,
          core: {
            maxHp: 5,
            currentHp: 0
          }
        },
        eventLog: [sampleLogEntry],
        gameOver: true,
        winner: PlayerType.RUNNER
      };

      expect(gameState.gameOver).toBe(true);
      expect(gameState.winner).toBe(PlayerType.RUNNER);
      expect(gameState.corp.core.currentHp).toBe(0);
    });
  });
}); 