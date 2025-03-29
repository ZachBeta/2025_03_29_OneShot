import { GameState } from '../models/GameState';
import { Card, IceCard } from '../models/Card';
import { CardType, PlayerType, PhaseType, IceType, EventType } from '../models/types';
import { LogEntry, createLogEntry } from '../models/LogEntry';

/**
 * Custom error for ICE operations
 */
export class ICEError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ICEError';
  }
}

/**
 * Handles game mechanics related to ICE cards
 */
export class ICEMechanics {
  /**
   * Checks if an ICE card can be installed from the Corp's hand
   */
  public static canInstallICE(gameState: GameState, cardIndex: number): boolean {
    // Check if card index is valid
    if (cardIndex < 0 || cardIndex >= gameState.corp.hand.length) {
      return false;
    }
    
    const card = gameState.corp.hand[cardIndex];
    
    // Check if the card is an ICE
    if (card.type !== CardType.ICE) {
      return false;
    }
    
    // Check if the corp has enough NPU
    if (gameState.corp.npuAvailable < card.cost) {
      return false;
    }
    
    // Can only install during Corp's main phase
    if (gameState.phase !== PhaseType.MAIN || gameState.activePlayer !== PlayerType.CORP) {
      return false;
    }
    
    return true;
  }
  
  /**
   * Installs an ICE card from the Corp's hand to their field
   */
  public static installICE(gameState: GameState, cardIndex: number): GameState {
    if (!this.canInstallICE(gameState, cardIndex)) {
      throw new ICEError('Cannot install ICE');
    }
    
    const card = gameState.corp.hand[cardIndex] as IceCard;
    
    // Create a new game state to avoid mutation
    const newState: GameState = {
      ...gameState,
      corp: {
        ...gameState.corp,
        // Remove card from hand
        hand: [
          ...gameState.corp.hand.slice(0, cardIndex),
          ...gameState.corp.hand.slice(cardIndex + 1)
        ],
        // Add card to field
        field: [...gameState.corp.field, card],
        // Deduct NPU
        npuAvailable: gameState.corp.npuAvailable - card.cost
      },
      // Add log entry
      eventLog: [
        ...gameState.eventLog,
        createLogEntry(`Corp installed ${card.name} (${card.iceType} ICE)`, EventType.CARD, {
          iceType: card.iceType,
          cost: card.cost
        })
      ]
    };
    
    return newState;
  }
  
  /**
   * Determines if an ICE can block a runner's attack
   */
  public static canBlock(gameState: GameState, iceIndex: number): boolean {
    // Check if the ICE index is valid
    if (iceIndex < 0 || iceIndex >= gameState.corp.field.length) {
      return false;
    }
    
    const ice = gameState.corp.field[iceIndex];
    
    // Check if the card is an ICE
    if (ice.type !== CardType.ICE) {
      return false;
    }
    
    // Can only block during Runner's combat phase
    if (gameState.phase !== PhaseType.COMBAT || gameState.activePlayer !== PlayerType.RUNNER) {
      return false;
    }
    
    return true;
  }
  
  /**
   * Calculates the damage dealt by ICE to a program
   */
  public static calculateDamage(ice: IceCard): number {
    // Barrier ICE deals 1 extra damage
    if (ice.iceType === IceType.BARRIER) {
      return ice.power + 1;
    }
    
    return ice.power;
  }
  
  /**
   * Checks if an ICE can use its special ability
   */
  public static canUseSpecialAbility(ice: IceCard): boolean {
    // Only Barrier ICE has special abilities in Phase 5
    return ice.iceType === IceType.BARRIER;
  }
  
  /**
   * Uses the special ability of Barrier ICE to heal the Corp's core
   */
  public static useBarrierAbility(gameState: GameState, iceIndex: number): GameState {
    if (iceIndex < 0 || iceIndex >= gameState.corp.field.length) {
      throw new ICEError('Invalid ICE index');
    }
    
    const ice = gameState.corp.field[iceIndex] as IceCard;
    
    if (ice.type !== CardType.ICE || (ice as IceCard).iceType !== IceType.BARRIER) {
      throw new ICEError('Only Barrier ICE can use this ability');
    }
    
    // Can only use special ability during Corp's main phase
    if (gameState.phase !== PhaseType.MAIN || gameState.activePlayer !== PlayerType.CORP) {
      throw new ICEError('Can only use special ability during Corp\'s main phase');
    }
    
    // Calculate healing (1 HP per Barrier ICE)
    const healing = 1;
    const newHp = Math.min(gameState.corp.core.currentHp + healing, gameState.corp.core.maxHp);
    
    // Create a new game state
    const newState: GameState = {
      ...gameState,
      corp: {
        ...gameState.corp,
        core: {
          ...gameState.corp.core,
          currentHp: newHp
        }
      },
      // Add log entry
      eventLog: [
        ...gameState.eventLog,
        createLogEntry(`${ice.name} used special ability to heal Corp's core for ${healing} HP`, EventType.GAME, {
          iceType: ice.iceType,
          healing
        })
      ]
    };
    
    return newState;
  }
} 