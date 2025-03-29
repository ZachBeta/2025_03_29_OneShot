/**
 * Game state model representing the current state of the game
 */

import { PhaseType, PlayerType } from './types';
import { Card } from './Card';
import { LogEntry } from './LogEntry';

/**
 * Interface representing a player's state (Runner or Corp)
 */
export interface PlayerState {
  /**
   * Cards in the player's deck (not yet drawn)
   */
  deck: Card[];
  
  /**
   * Cards in the player's hand
   */
  hand: Card[];
  
  /**
   * Cards in play on the player's field
   */
  field: Card[];
  
  /**
   * Currently available NPU resources
   */
  npuAvailable: number;
  
  /**
   * Total NPU resources played this game
   */
  npuTotal: number;
}

/**
 * Interface representing the Corp's state
 */
export interface CorpState extends PlayerState {
  /**
   * Corp's core health points
   */
  core: {
    /**
     * Maximum HP of the core
     */
    maxHp: number;
    
    /**
     * Current HP of the core
     */
    currentHp: number;
  };
}

/**
 * Interface representing the Runner's state
 */
export interface RunnerState extends PlayerState {
  // Runner-specific properties can be added in the future
}

/**
 * Interface representing the entire game state
 */
export interface GameState {
  /**
   * Current turn number
   */
  turn: number;
  
  /**
   * Currently active player (RUNNER or CORP)
   */
  activePlayer: PlayerType;
  
  /**
   * Current phase of the turn
   */
  phase: PhaseType;
  
  /**
   * Runner player's state
   */
  runner: RunnerState;
  
  /**
   * Corp player's state
   */
  corp: CorpState;
  
  /**
   * Log of game events
   */
  eventLog: LogEntry[];
  
  /**
   * Whether the game is over
   */
  gameOver: boolean;
  
  /**
   * The winning player, if game is over
   */
  winner?: PlayerType;
} 