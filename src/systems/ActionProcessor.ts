import { GameStateManager } from './GameStateManager';
import { UserAction, ActionType, PlayCardPayload, AttackPayload } from '../models/UserAction';
import { GameState } from '../models/GameState';
import { CardType, PlayerType } from '../models/types';

/**
 * Error class for game-related errors
 */
export class GameError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GameError';
  }
}

/**
 * Class responsible for processing user actions and modifying game state
 */
export class ActionProcessor {
  private gameStateManager: GameStateManager;
  
  constructor(gameStateManager: GameStateManager) {
    this.gameStateManager = gameStateManager;
  }
  
  /**
   * Processes a user action and returns the updated game state
   */
  public processAction(action: UserAction): GameState {
    // Get current state
    const currentState = this.gameStateManager.getState();
    
    // Validate that action is allowed in current state
    this.validateAction(action, currentState);
    
    // Process different action types
    switch (action.type) {
      case ActionType.PLAY_NPU:
        return this.processPlayNpu(action);
        
      case ActionType.PLAY_CARD:
        return this.processPlayCard(action);
        
      case ActionType.ATTACK:
        return this.processAttack(action);
        
      case ActionType.END_PHASE:
        return this.processEndPhase();
        
      case ActionType.HELP:
        // Help doesn't change game state, just return current
        return currentState;
        
      case ActionType.QUIT:
        // Mark game as over, with no winner
        const newState = { ...currentState, gameOver: true };
        return newState;
        
      default:
        throw new GameError(`Unknown action type: ${action.type}`);
    }
  }
  
  /**
   * Validates that an action is allowed in the current game state
   */
  private validateAction(action: UserAction, gameState: GameState): void {
    // Special handling for game state
    if (gameState.gameOver) {
      if (action.type === ActionType.QUIT) {
        return; // Always allow quitting
      }
      throw new Error('Game is over. No further actions allowed except QUIT.');
    }
    
    // Special handling for Corp turn
    if (gameState.activePlayer === PlayerType.CORP) {
      if (action.type === ActionType.QUIT || action.type === ActionType.HELP ||
          action.type === ActionType.SAVE || action.type === ActionType.LOAD) {
        return; // Always allow quitting, help, save, and load even during Corp turn
      }
      throw new Error('Cannot perform actions during Corp turn.');
    }
    
    // Validate action by phase
    if (!this.isActionAllowed(action, gameState)) {
      throw new Error(`Action ${action.type} is not allowed in the current phase.`);
    }
  }
  
  /**
   * Check if an action is allowed in the current phase
   * @param action The action to check
   * @param gameState The current game state
   * @returns True if the action is allowed
   */
  private isActionAllowed(action: UserAction, gameState: GameState): boolean {
    const { phase } = gameState;
    
    // END_PHASE, HELP, QUIT are always allowed
    if (action.type === ActionType.END_PHASE || 
        action.type === ActionType.HELP || 
        action.type === ActionType.QUIT ||
        action.type === ActionType.SAVE ||
        action.type === ActionType.LOAD) {
      return true;
    }
    
    // Phase-specific actions
    switch (action.type) {
      case ActionType.PLAY_NPU:
      case ActionType.PLAY_CARD:
        return phase === 'MAIN';
      case ActionType.ATTACK:
        return phase === 'COMBAT';
      case ActionType.BLOCK:
        return phase === 'COMBAT' && gameState.activePlayer === PlayerType.RUNNER;
      case ActionType.USE_ABILITY:
        return phase === 'MAIN';
      default:
        return false;
    }
  }
  
  /**
   * Processes a PLAY_NPU action
   */
  private processPlayNpu(action: UserAction): GameState {
    const payload = action.payload as PlayCardPayload;
    
    if (!payload || payload.cardType !== CardType.NPU) {
      throw new GameError('Invalid NPU card');
    }
    
    // Play the NPU card
    return this.gameStateManager.playCard(PlayerType.RUNNER, payload.cardIndex);
  }
  
  /**
   * Processes a PLAY_CARD action
   */
  private processPlayCard(action: UserAction): GameState {
    const payload = action.payload as PlayCardPayload;
    
    if (!payload || payload.cardType === CardType.NPU) {
      throw new GameError('Invalid card type for PLAY_CARD action');
    }
    
    // Play the card
    return this.gameStateManager.playCard(PlayerType.RUNNER, payload.cardIndex);
  }
  
  /**
   * Processes an ATTACK action
   */
  private processAttack(action: UserAction): GameState {
    const payload = action.payload as AttackPayload;
    
    if (!payload) {
      throw new GameError('Missing payload for ATTACK action');
    }
    
    const state = this.gameStateManager.getState();
    const { runner } = state;
    
    // Validate program index
    if (payload.programIndex < 0 || payload.programIndex >= runner.field.length) {
      throw new GameError('Invalid program index for attack');
    }
    
    // For now, we just use a simple attack that deals damage to corp's core HP
    // In a full implementation, we'd handle ICE blocking, program vs ICE combat, etc.
    const attackPower = runner.field[payload.programIndex].power || 0;
    
    // Update Corp HP based on attack power
    return this.gameStateManager.updateCorpHp(-attackPower);
  }
  
  /**
   * Processes an END_PHASE action
   */
  private processEndPhase(): GameState {
    return this.gameStateManager.advancePhase();
  }
} 