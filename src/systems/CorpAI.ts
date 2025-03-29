import { GameState } from '../models/GameState';
import { Card, NpuCard, IceCard } from '../models/Card';
import { PlayerType, CardType, PhaseType, UserAction } from '../models/types';
import { ICEMechanics } from './ICEMechanics';

/**
 * Handles automated Corp decision making
 */
export class CorpAI {
  /**
   * Gets the next action for the Corp to take based on the current game state
   */
  public static getNextAction(gameState: GameState): UserAction | null {
    const { phase, corp } = gameState;
    
    // Corp doesn't act during Runner's Combat phase
    if (gameState.activePlayer !== PlayerType.CORP) {
      // During Runner's combat phase, Corp may need to decide on blocking
      if (phase === PhaseType.COMBAT) {
        return this.getBlockingDecision(gameState);
      }
      return null;
    }
    
    // Corp's turn
    switch (phase) {
      case PhaseType.DRAW:
      case PhaseType.NPU:
        // Automatically end these phases
        return { type: 'EndPhase' };
        
      case PhaseType.MAIN:
        // Decide what to play, if anything
        return this.getMainPhaseAction(gameState);
        
      default:
        return null;
    }
  }
  
  /**
   * Decides what to do during the Main phase
   */
  private static getMainPhaseAction(gameState: GameState): UserAction | null {
    const { corp } = gameState;
    
    // Try to play NPU cards first
    const npuCardIndex = this.findPlayableNpuCardIndex(gameState);
    if (npuCardIndex !== -1) {
      return { 
        type: 'PlayNPU', 
        cardIndex: npuCardIndex 
      };
    }
    
    // Then try to play ICE cards
    const iceCardIndex = this.findPlayableIceCardIndex(gameState);
    if (iceCardIndex !== -1) {
      return { 
        type: 'PlayCard', 
        cardIndex: iceCardIndex 
      };
    }
    
    // If nothing to play, end the phase
    return { type: 'EndPhase' };
  }
  
  /**
   * Finds an index of NPU card that can be played
   */
  private static findPlayableNpuCardIndex(gameState: GameState): number {
    const { corp } = gameState;
    
    for (let i = 0; i < corp.hand.length; i++) {
      const card = corp.hand[i];
      if (card.type === CardType.NPU && (card as NpuCard).cost <= corp.npuAvailable) {
        return i;
      }
    }
    
    return -1;
  }
  
  /**
   * Finds an index of ICE card that can be played
   */
  private static findPlayableIceCardIndex(gameState: GameState): number {
    const { corp } = gameState;
    
    for (let i = 0; i < corp.hand.length; i++) {
      const card = corp.hand[i];
      if (card.type === CardType.ICE && (card as IceCard).cost <= corp.npuAvailable) {
        return i;
      }
    }
    
    return -1;
  }
  
  /**
   * Decides which ICE to block with, if any
   */
  private static getBlockingDecision(gameState: GameState): UserAction | null {
    const { corp } = gameState;
    
    // If there's no ICE, can't block
    if (corp.field.length === 0) {
      return null;
    }
    
    // Find the oldest ICE that can block
    // (In a more complex AI, we would evaluate which ICE is best to block with)
    let oldestBlockingIceIndex = -1;
    
    for (let i = 0; i < corp.field.length; i++) {
      if (ICEMechanics.canBlock(gameState, i)) {
        oldestBlockingIceIndex = i;
        break;
      }
    }
    
    // If no ICE can block, return null (no blocking decision)
    if (oldestBlockingIceIndex === -1) {
      return null;
    }
    
    // Return the blocking decision
    return {
      type: 'Block',
      iceIndex: oldestBlockingIceIndex
    };
  }
  
  /**
   * Determines where to place a new ICE card
   * For now, just returns the next available index (end of field)
   */
  public static getIcePlacementIndex(gameState: GameState): number {
    return gameState.corp.field.length;
  }
} 