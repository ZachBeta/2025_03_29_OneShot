/**
 * Tests for GameBoardRenderer
 */

import { GameBoardRenderer } from './GameBoardRenderer';
import { GameState } from '../models/GameState';
import { CardType, PlayerType, PhaseType, EventType } from '../models/types';
import { Card } from '../models/Card';
import { CardRenderer } from './CardRenderer';
import * as TerminalUtils from './TerminalUtils';
import { createLogEntry } from '../models/LogEntry';

// Mock dependencies
jest.mock('./CardRenderer', () => ({
  CardRenderer: {
    renderCard: jest.fn(() => [
      '┌────────────┐',
      '│ Card Mock  │',
      '│            │',
      '│            │',
      '│            │',
      '│            │',
      '│            │',
      '│            │',
      '│            │',
      '│            │',
      '│            │',
      '└────────────┘'
    ])
  }
}));

jest.mock('./TerminalUtils', () => ({
  createScreenBuffer: jest.fn(() => Array(40).fill(null).map(() => Array(80).fill(' '))),
  renderToBuffer: jest.fn(),
  renderBufferToTerminal: jest.fn(),
  drawBox: jest.fn((width, height) => {
    const result = [];
    result.push('┌' + '─'.repeat(width - 2) + '┐');
    for (let i = 0; i < height - 2; i++) {
      result.push('│' + ' '.repeat(width - 2) + '│');
    }
    result.push('└' + '─'.repeat(width - 2) + '┘');
    return result;
  }),
  cyberpunkStyle: jest.fn((text) => text) // No styling in tests
}));

describe('GameBoardRenderer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  const createMockCard = (id: string, type: CardType): Card => ({
    id,
    name: `Mock ${type}`,
    type,
    cost: 1,
    ascii: ['Mock ASCII'],
    flavorText: 'Mock flavor text'
  });
  
  const createMockGameState = (): GameState => ({
    turn: 2,
    activePlayer: PlayerType.RUNNER,
    phase: PhaseType.MAIN,
    runner: {
      deck: [createMockCard('r1', CardType.NPU), createMockCard('r2', CardType.PROGRAM)],
      hand: [createMockCard('r3', CardType.PROGRAM)],
      field: [createMockCard('r4', CardType.NPU), createMockCard('r5', CardType.PROGRAM)],
      npuAvailable: 3,
      npuTotal: 5
    },
    corp: {
      deck: [createMockCard('c1', CardType.NPU), createMockCard('c2', CardType.ICE)],
      hand: [createMockCard('c3', CardType.ICE), createMockCard('c4', CardType.NPU)],
      field: [createMockCard('c5', CardType.ICE)],
      npuAvailable: 2,
      npuTotal: 4,
      core: {
        maxHp: 5,
        currentHp: 3
      }
    },
    eventLog: [
      createLogEntry('Game started', EventType.GAME),
      createLogEntry('Runner played NPU', EventType.CARD)
    ],
    gameOver: false
  });
  
  test('renderGameState creates and renders a buffer with all game components', () => {
    const mockGameState = createMockGameState();
    
    GameBoardRenderer.renderGameState(mockGameState);
    
    // Check that createScreenBuffer was called with correct dimensions
    expect(TerminalUtils.createScreenBuffer).toHaveBeenCalledWith(80, 40);
    
    // Check that renderBufferToTerminal was called
    expect(TerminalUtils.renderBufferToTerminal).toHaveBeenCalled();
    
    // Check that CardRenderer.renderCard was called for each card in the field
    expect(CardRenderer.renderCard).toHaveBeenCalledTimes(3); // 2 runner cards + 1 corp card
    
    // Check that key game elements were rendered
    const renderCalls = (TerminalUtils.renderToBuffer as jest.Mock).mock.calls;
    
    // Check if Corp header was rendered
    const corpHeaderCall = renderCalls.find(call => 
      call[1] && call[1][0] && call[1][0].includes('CORP - NPU: 2/4'));
    expect(corpHeaderCall).toBeDefined();
    
    // Check if Runner header was rendered
    const runnerHeaderCall = renderCalls.find(call => 
      call[1] && call[1][0] && call[1][0].includes('RUNNER - NPU: 3/5'));
    expect(runnerHeaderCall).toBeDefined();
    
    // Check if Core HP was rendered
    const corpHpCall = renderCalls.find(call => 
      call[1] && call[1][1] && call[1][1].includes('Core HP: 3/5'));
    expect(corpHpCall).toBeDefined();
    
    // Check if game info was rendered
    const gameInfoCall = renderCalls.find(call => 
      call[1] && call[1][1] && call[1][1].includes('Turn: 2'));
    expect(gameInfoCall).toBeDefined();
  });
  
  test('renderGameState handles empty fields and logs gracefully', () => {
    const emptyGameState = createMockGameState();
    emptyGameState.runner.field = [];
    emptyGameState.corp.field = [];
    emptyGameState.eventLog = [];
    
    GameBoardRenderer.renderGameState(emptyGameState);
    
    // Check that CardRenderer.renderCard was not called (no cards in field)
    expect(CardRenderer.renderCard).not.toHaveBeenCalled();
    
    // Check that renderToBuffer was called with empty field message
    const renderCalls = (TerminalUtils.renderToBuffer as jest.Mock).mock.calls;
    
    const emptyRunnerFieldCall = renderCalls.find(call => 
      call[1] && call[1][0] && call[1][0].includes('No cards played yet'));
    expect(emptyRunnerFieldCall).toBeDefined();
    
    const emptyCorpFieldCall = renderCalls.find(call => 
      call[1] && call[1][0] && call[1][0].includes('No cards played yet'));
    expect(emptyCorpFieldCall).toBeDefined();
    
    const emptyLogCall = renderCalls.find(call => 
      call[1] && call[1][0] && call[1][0].includes('No events logged yet'));
    expect(emptyLogCall).toBeDefined();
  });
  
  test('renderGameState displays game over message when game is over', () => {
    const gameOverState = createMockGameState();
    gameOverState.gameOver = true;
    gameOverState.winner = PlayerType.RUNNER;
    
    GameBoardRenderer.renderGameState(gameOverState);
    
    // Check that renderToBuffer was called with game over message
    const renderCalls = (TerminalUtils.renderToBuffer as jest.Mock).mock.calls;
    
    const gameOverCall = renderCalls.find(call => 
      call[1] && call[1][1] && call[1][1].includes('GAME OVER - RUNNER WINS!'));
    expect(gameOverCall).toBeDefined();
  });
}); 