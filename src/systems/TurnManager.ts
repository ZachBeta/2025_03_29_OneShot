import { GameState } from '../models/GameState';
import { PlayerType, PhaseType, EventType } from '../models/types';
import { createLogEntry } from '../models/LogEntry';
import { PhaseManager } from './PhaseManager';

/**
 * Custom error for turn-related operations
 */
export class TurnError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TurnError';
  }
}

/**
 * Manages turn transitions and win condition checking
 */
export class TurnManager {
  /**
   * Starts a new turn for the next player
   */
  public static startNewTurn(gameState: GameState): GameState {
    // Switch active player
    const newActivePlayer = this.getOppositePlayer(gameState.activePlayer);
    
    // Create a new game state
    const newState: GameState = {
      ...gameState,
      activePlayer: newActivePlayer,
      phase: PhaseType.DRAW, // Always start turn with Draw phase
      turn: newActivePlayer === PlayerType.CORP ? gameState.turn + 1 : gameState.turn,
      eventLog: [
        ...gameState.eventLog,
        createLogEntry(
          `Turn ${newActivePlayer === PlayerType.CORP ? gameState.turn + 1 : gameState.turn}: ${newActivePlayer}'s turn begins`,
          EventType.GAME,
          { player: newActivePlayer, turn: newActivePlayer === PlayerType.CORP ? gameState.turn + 1 : gameState.turn }
        )
      ]
    };
    
    // Start with Draw phase
    return PhaseManager.advancePhase(newState);
  }
  
  /**
   * Ends the current turn and starts the next player's turn
   */
  public static endTurn(gameState: GameState): GameState {
    const { activePlayer } = gameState;
    
    // Log the end of the turn
    const stateWithLog: GameState = {
      ...gameState,
      eventLog: [
        ...gameState.eventLog,
        createLogEntry(
          `${activePlayer}'s turn ends`,
          EventType.GAME,
          { player: activePlayer, turn: gameState.turn }
        )
      ]
    };
    
    // Apply any end-of-turn effects
    const stateAfterEffects = this.applyEndOfTurnEffects(stateWithLog);
    
    // Check win conditions
    const stateAfterWinCheck = this.checkWinConditions(stateAfterEffects);
    
    // If game is over, don't start a new turn
    if (stateAfterWinCheck.gameOver) {
      return stateAfterWinCheck;
    }
    
    // Start a new turn for the next player
    return this.startNewTurn(stateAfterWinCheck);
  }
  
  /**
   * Applies any effects that happen at the end of a turn
   */
  private static applyEndOfTurnEffects(gameState: GameState): GameState {
    const { activePlayer } = gameState;
    
    // TODO: Add any end of turn effects here
    // For now, we're just returning the state as-is
    return gameState;
  }
  
  /**
   * Gets the opposite player
   */
  private static getOppositePlayer(player: PlayerType): PlayerType {
    return player === PlayerType.RUNNER ? PlayerType.CORP : PlayerType.RUNNER;
  }
  
  /**
   * Checks if the game has reached a win condition
   */
  public static checkWinConditions(gameState: GameState): GameState {
    // Runner wins if Corp core HP reaches 0
    if (gameState.corp.core.currentHp <= 0) {
      return this.setWinner(gameState, PlayerType.RUNNER);
    }
    
    // Corp wins if Runner has no programs and no cards in hand and deck
    const runnerHasPrograms = gameState.runner.field.some(card => card.type === 'PROGRAM');
    const runnerHasCards = gameState.runner.hand.length > 0 || gameState.runner.deck.length > 0;
    
    if (!runnerHasPrograms && !runnerHasCards) {
      return this.setWinner(gameState, PlayerType.CORP);
    }
    
    // No winner yet
    return gameState;
  }
  
  /**
   * Sets the winner of the game
   */
  private static setWinner(gameState: GameState, winner: PlayerType): GameState {
    const winMessage = winner === PlayerType.RUNNER
      ? 'Runner wins by reducing Corp core to 0 HP!'
      : 'Corp wins by exhausting Runner resources!';
    
    return {
      ...gameState,
      gameOver: true,
      winner,
      eventLog: [
        ...gameState.eventLog,
        createLogEntry(
          winMessage,
          EventType.GAME,
          { winner }
        )
      ]
    };
  }
  
  /**
   * Advances to the next phase, or next turn if at end of phases
   */
  public static advanceToNextPhase(gameState: GameState): GameState {
    const { phase, activePlayer } = gameState;
    
    // If Runner is at Combat phase or Corp is at Main phase, end the turn
    if ((activePlayer === PlayerType.RUNNER && phase === PhaseType.COMBAT) ||
        (activePlayer === PlayerType.CORP && phase === PhaseType.MAIN)) {
      return this.endTurn(gameState);
    }
    
    // Otherwise just advance to the next phase
    return PhaseManager.advancePhase(gameState);
  }
} 