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
  private validateAction(action: UserAction, state: GameState): void {
    const { activePlayer, phase, gameOver } = state;
    
    // Can't take actions if game is over
    if (gameOver) {
      throw new GameError('Game is over, no actions can be taken');
    }
    
    // Only RUNNER player can take actions (CORP is AI-controlled)
    if (activePlayer !== PlayerType.RUNNER && action.type !== ActionType.HELP && action.type !== ActionType.QUIT) {
      throw new GameError('Cannot take actions during Corp turn');
    }
    
    // Validate based on phase restrictions
    switch (action.type) {
      case ActionType.PLAY_NPU:
        if (phase !== 'NPU') {
          throw new GameError('NPU cards can only be played during NPU phase');
        }
        break;
        
      case ActionType.PLAY_CARD:
        if (phase !== 'MAIN') {
          throw new GameError('Cards can only be played during Main phase');
        }
        break;
        
      case ActionType.ATTACK:
        if (phase !== 'COMBAT') {
          throw new GameError('Attacks can only be declared during Combat phase');
        }
        break;
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