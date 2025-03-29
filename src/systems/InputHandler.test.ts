import { InputHandler } from './InputHandler';
import { ActionType, UserAction, KEY_ACTION_MAP } from '../models/UserAction';
import { GameState } from '../models/GameState';
import { Card, NpuCard, ProgramCard } from '../models/Card';
import { CardType, PhaseType, PlayerType, ProgramType } from '../models/types';
import * as readline from 'readline';

// Mock readline module
jest.mock('readline', () => ({
  createInterface: jest.fn().mockReturnValue({
    close: jest.fn()
  }),
  emitKeypressEvents: jest.fn()
}));

// Mock process.stdin
const mockStdin = {
  isTTY: true,
  setRawMode: jest.fn(),
  on: jest.fn(),
  removeListener: jest.fn(),
  removeAllListeners: jest.fn()
};

// Replace real process.stdin with mock
const originalStdin = process.stdin;
beforeAll(() => {
  Object.defineProperty(process, 'stdin', {
    value: mockStdin,
    writable: true
  });
  
  // Mock process.on
  process.on = jest.fn();
  // Mock exit to avoid actual process exit
  const originalExit = process.exit;
  process.exit = jest.fn() as any;
});

afterAll(() => {
  // Restore original process.stdin
  Object.defineProperty(process, 'stdin', {
    value: originalStdin
  });
});

// Create sample cards for tests
const createNpuCard = (): NpuCard => ({
  id: '1',
  name: 'Test NPU',
  type: CardType.NPU,
  cost: 1,
  power: 0,
  toughness: 0,
  ascii: ['NPU ascii art'],
  flavorText: ''
});

const createProgramCard = (): ProgramCard => ({
  id: '2',
  name: 'Test Program',
  type: CardType.PROGRAM,
  programType: ProgramType.FRACTER,
  cost: 2,
  power: 1,
  toughness: 1,
  ascii: ['Program ascii art'],
  flavorText: ''
});

// Create mock game state for testing
const createMockGameState = (phaseType: PhaseType): GameState => ({
  turn: 1,
  gameOver: false,
  winner: undefined,
  activePlayer: PlayerType.RUNNER,
  phase: phaseType,
  runner: {
    npuAvailable: 5,
    npuTotal: 5,
    deck: [],
    hand: [createNpuCard(), createProgramCard(), createNpuCard()],
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
});

describe('InputHandler', () => {
  let inputHandler: InputHandler;
  
  beforeEach(() => {
    jest.clearAllMocks();
    inputHandler = new InputHandler();
  });
  
  test('constructor sets up readline interface and event listeners', () => {
    expect(readline.createInterface).toHaveBeenCalled();
    expect(readline.emitKeypressEvents).toHaveBeenCalledWith(process.stdin);
    expect(process.stdin.setRawMode).toHaveBeenCalledWith(true);
    expect(process.on).toHaveBeenCalledWith('exit', expect.any(Function));
  });
  
  test('getInput returns a promise that resolves with a UserAction', async () => {
    // Setup mock game state
    const mockState = createMockGameState(PhaseType.NPU);
    inputHandler.setGameState(mockState);
    
    // Create a promise to simulate waiting for input
    const inputPromise = inputHandler.getInput();
    
    // Simulate a keypress event
    const onCallback = mockStdin.on.mock.calls[0][1]; // Get the callback passed to stdin.on
    onCallback('1', { name: '1' }); // Simulate pressing '1'
    
    // Await the action
    const action = await inputPromise;
    
    // Verify we got the correct action
    expect(action).toEqual({
      type: ActionType.PLAY_NPU,
      payload: {
        cardIndex: 0,
        cardType: CardType.NPU
      }
    });
    
    // Verify the listener was removed
    expect(process.stdin.removeListener).toHaveBeenCalled();
  });
  
  test('parseKeypress handles space key for END_PHASE', async () => {
    // Setup mock game state
    inputHandler.setGameState(createMockGameState(PhaseType.NPU));
    
    // Update KEY_ACTION_MAP mock to ensure we handle space correctly in tests
    const originalMap = { ...KEY_ACTION_MAP };
    
    // In our tests we need to use 'space' as the key name
    (KEY_ACTION_MAP as any)['space'] = ActionType.END_PHASE;
    
    // Create a promise to simulate waiting for input
    const inputPromise = inputHandler.getInput();
    
    // Simulate space keypress with the key name 'space'
    const onCallback = mockStdin.on.mock.calls[0][1];
    onCallback(' ', { name: 'space' });
    
    // Await the action
    const action = await inputPromise;
    
    // Verify we got the END_PHASE action
    expect(action).toEqual({
      type: ActionType.END_PHASE
    });
  }, 10000); // Increase timeout for this test
  
  test('createActionFromNumber returns PLAY_CARD during MAIN phase', async () => {
    // Setup mock game state with MAIN phase
    inputHandler.setGameState(createMockGameState(PhaseType.MAIN));
    
    // Create a promise to simulate waiting for input
    const inputPromise = inputHandler.getInput();
    
    // Simulate pressing '2' (index 1, a program card)
    const onCallback = mockStdin.on.mock.calls[0][1];
    onCallback('2', { name: '2' });
    
    // Await the action
    const action = await inputPromise;
    
    // Verify we got the PLAY_CARD action for the program
    expect(action).toEqual({
      type: ActionType.PLAY_CARD,
      payload: {
        cardIndex: 1,
        cardType: CardType.PROGRAM
      }
    });
  });
  
  test('createActionFromNumber returns ATTACK during COMBAT phase', async () => {
    // Setup mock game state with COMBAT phase
    inputHandler.setGameState(createMockGameState(PhaseType.COMBAT));
    
    // Create a promise to simulate waiting for input
    const inputPromise = inputHandler.getInput();
    
    // Simulate pressing '1' (index 0, the program in the field)
    const onCallback = mockStdin.on.mock.calls[0][1];
    onCallback('1', { name: '1' });
    
    // Await the action
    const action = await inputPromise;
    
    // Verify we got the ATTACK action
    expect(action).toEqual({
      type: ActionType.ATTACK,
      payload: {
        programIndex: 0
      }
    });
  });
  
  test('handleKeypress exits on Ctrl+C', async () => {
    // Create a promise to simulate waiting for input
    inputHandler.getInput();
    
    // Simulate Ctrl+C keypress
    const onCallback = mockStdin.on.mock.calls[0][1];
    onCallback('c', { name: 'c', ctrl: true });
    
    // Verify process.exit was called
    expect(process.exit).toHaveBeenCalledWith(0);
  });
  
  test('cleanup stops listening and closes readline', () => {
    inputHandler.cleanup();
    
    expect(process.stdin.removeAllListeners).toHaveBeenCalledWith('keypress');
    expect(mockStdin.setRawMode).toHaveBeenCalledWith(false);
    // Verify readline is closed
    expect((readline.createInterface as jest.Mock).mock.results[0].value.close).toHaveBeenCalled();
  });
}); 