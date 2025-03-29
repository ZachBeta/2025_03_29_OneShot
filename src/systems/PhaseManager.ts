import { GameState } from '../models/GameState';
import { PlayerType, PhaseType, EventType } from '../models/types';
import { createLogEntry } from '../models/LogEntry';
import { createRunnerStarterDeck, createCorpStarterDeck } from '../utils/CardFactory';

/**
 * Custom error for phase-related operations
 */
export class PhaseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PhaseError';
  }
}

/**
 * Manages game phases and turn transitions
 */
export class PhaseManager {
  /**
   * Gets the next phase in the sequence
   */
  public static getNextPhase(currentPhase: PhaseType): PhaseType {
    switch (currentPhase) {
      case PhaseType.DRAW:
        return PhaseType.NPU;
      case PhaseType.NPU:
        return PhaseType.MAIN;
      case PhaseType.MAIN:
        // Only Runner has a combat phase
        return PhaseType.COMBAT;
      case PhaseType.COMBAT:
        return PhaseType.DRAW;
      default:
        throw new PhaseError(`Invalid phase: ${currentPhase}`);
    }
  }
  
  /**
   * Advances the game to the next phase
   */
  public static advancePhase(gameState: GameState): GameState {
    const currentPhase = gameState.phase;
    const activePlayer = gameState.activePlayer;
    
    let nextPhase = this.getNextPhase(currentPhase);
    let newActivePlayer = activePlayer;
    
    // Corp skips combat phase, and we switch to Runner's draw phase
    if (activePlayer === PlayerType.CORP && nextPhase === PhaseType.COMBAT) {
      nextPhase = PhaseType.DRAW;
      newActivePlayer = PlayerType.RUNNER;
    }
    
    // Runner ends turn after combat, we switch to Corp's draw phase
    if (activePlayer === PlayerType.RUNNER && currentPhase === PhaseType.COMBAT) {
      newActivePlayer = PlayerType.CORP;
    }
    
    // Create new state with updated phase and active player
    const newState: GameState = {
      ...gameState,
      phase: nextPhase,
      activePlayer: newActivePlayer,
      turn: newActivePlayer === PlayerType.CORP && nextPhase === PhaseType.DRAW ? 
             gameState.turn + 1 : gameState.turn,
      // Add log entry for phase change
      eventLog: [
        ...gameState.eventLog,
        createLogEntry(
          `${newActivePlayer} begins ${nextPhase} phase${
            newActivePlayer !== activePlayer ? ' (new turn)' : ''
          }`,
          EventType.PHASE,
          { player: newActivePlayer, phase: nextPhase }
        )
      ]
    };
    
    // Execute phase entry actions
    return this.executePhaseEntryActions(newState);
  }
  
  /**
   * Executes automatic actions upon entering a phase
   */
  private static executePhaseEntryActions(gameState: GameState): GameState {
    const { phase, activePlayer } = gameState;
    
    switch (phase) {
      case PhaseType.DRAW:
        return this.executeDraw(gameState);
      case PhaseType.NPU:
        return this.executeNPU(gameState);
      case PhaseType.MAIN:
        // No automatic actions for Main phase
        return gameState;
      case PhaseType.COMBAT:
        // No automatic actions for Combat phase
        return gameState;
      default:
        return gameState;
    }
  }
  
  /**
   * Executes the Draw phase logic (draw cards)
   */
  private static executeDraw(gameState: GameState): GameState {
    const { activePlayer } = gameState;
    
    // Determine how many cards to draw
    const cardsToDraw = 1; // Default to 1 card per turn
    
    if (activePlayer === PlayerType.RUNNER) {
      // Draw cards for Runner
      return this.drawCards(gameState, activePlayer, cardsToDraw);
    } else {
      // Draw cards for Corp
      return this.drawCards(gameState, activePlayer, cardsToDraw);
    }
  }
  
  /**
   * Executes the NPU phase logic (increase available NPU)
   */
  private static executeNPU(gameState: GameState): GameState {
    const { activePlayer } = gameState;
    
    if (activePlayer === PlayerType.RUNNER) {
      // Calculate new NPU for Runner (all NPU is refreshed each turn)
      const newState: GameState = {
        ...gameState,
        runner: {
          ...gameState.runner,
          npuAvailable: gameState.runner.npuTotal
        },
        eventLog: [
          ...gameState.eventLog,
          createLogEntry(
            `Runner refreshed NPU to ${gameState.runner.npuTotal}`,
            EventType.GAME,
            { player: PlayerType.RUNNER, npuAmount: gameState.runner.npuTotal }
          )
        ]
      };
      return newState;
    } else {
      // Calculate new NPU for Corp (all NPU is refreshed each turn)
      const newState: GameState = {
        ...gameState,
        corp: {
          ...gameState.corp,
          npuAvailable: gameState.corp.npuTotal
        },
        eventLog: [
          ...gameState.eventLog,
          createLogEntry(
            `Corp refreshed NPU to ${gameState.corp.npuTotal}`,
            EventType.GAME,
            { player: PlayerType.CORP, npuAmount: gameState.corp.npuTotal }
          )
        ]
      };
      return newState;
    }
  }
  
  /**
   * Helper method to draw cards for a player
   */
  private static drawCards(gameState: GameState, player: PlayerType, count: number): GameState {
    let newState = { ...gameState };
    
    // Draw cards one at a time, updating the state each time
    for (let i = 0; i < count; i++) {
      if (player === PlayerType.RUNNER) {
        // Check if Runner deck is empty
        if (newState.runner.deck.length === 0) {
          newState = {
            ...newState,
            eventLog: [
              ...newState.eventLog,
              createLogEntry(
                'Runner deck is empty, cannot draw more cards',
                EventType.GAME,
                { player: PlayerType.RUNNER }
              )
            ]
          };
          break;
        }
        
        // Draw a card for Runner
        const [drawnCard, ...remainingDeck] = newState.runner.deck;
        newState = {
          ...newState,
          runner: {
            ...newState.runner,
            deck: remainingDeck,
            hand: [...newState.runner.hand, drawnCard]
          },
          eventLog: [
            ...newState.eventLog,
            createLogEntry(
              `Runner drew a card (${drawnCard.name})`,
              EventType.CARD,
              { player: PlayerType.RUNNER, cardId: drawnCard.id }
            )
          ]
        };
      } else {
        // Check if Corp deck is empty
        if (newState.corp.deck.length === 0) {
          newState = {
            ...newState,
            eventLog: [
              ...newState.eventLog,
              createLogEntry(
                'Corp deck is empty, cannot draw more cards',
                EventType.GAME,
                { player: PlayerType.CORP }
              )
            ]
          };
          break;
        }
        
        // Draw a card for Corp
        const [drawnCard, ...remainingDeck] = newState.corp.deck;
        newState = {
          ...newState,
          corp: {
            ...newState.corp,
            deck: remainingDeck,
            hand: [...newState.corp.hand, drawnCard]
          },
          eventLog: [
            ...newState.eventLog,
            createLogEntry(
              `Corp drew a card (${drawnCard.name})`,
              EventType.CARD,
              { player: PlayerType.CORP, cardId: drawnCard.id }
            )
          ]
        };
      }
    }
    
    return newState;
  }
  
  /**
   * Checks if an action is allowed in the current phase
   */
  public static isActionAllowed(gameState: GameState, actionType: string): boolean {
    const { phase, activePlayer } = gameState;
    
    switch (actionType) {
      case 'PlayNPU':
        // NPU cards can only be played during Main phase
        return phase === PhaseType.MAIN;
        
      case 'PlayCard':
        // Program/ICE cards can only be played during Main phase
        return phase === PhaseType.MAIN;
        
      case 'Attack':
        // Only Runner can attack, and only during combat phase
        return phase === PhaseType.COMBAT && activePlayer === PlayerType.RUNNER;
        
      case 'Block':
        // Only Corp can block, and only during Runner's combat phase
        return phase === PhaseType.COMBAT && activePlayer === PlayerType.RUNNER;
        
      case 'EndPhase':
        // Always allowed
        return true;
        
      case 'UseAbility':
        // Special abilities can only be used during Main phase
        return phase === PhaseType.MAIN;
        
      default:
        return false;
    }
  }
  
  /**
   * Creates a new game state with initialized decks and initial phase setup
   */
  public static setupNewGame(): GameState {
    // Create initial game state
    const initialState: GameState = {
      turn: 1,
      phase: PhaseType.DRAW,
      activePlayer: PlayerType.RUNNER, // Runner goes first
      gameOver: false,
      winner: undefined,
      runner: {
        deck: createRunnerStarterDeck(),
        hand: [],
        field: [],
        npuAvailable: 0,
        npuTotal: 0
      },
      corp: {
        deck: createCorpStarterDeck(),
        hand: [],
        field: [],
        npuAvailable: 0,
        npuTotal: 0,
        core: {
          maxHp: 10,
          currentHp: 10
        }
      },
      eventLog: [
        createLogEntry('Game started - Runner\'s turn', EventType.GAME, {})
      ]
    };
    
    // Execute Draw phase to get initial cards
    const afterDrawState = this.executeDraw(initialState);
    
    // Move to NPU phase
    return this.advancePhase(afterDrawState);
  }
} 