/**
 * Represents a card in the game
 */

import { CardType, ProgramType, IceType } from './types';

/**
 * Base interface for all cards in the game
 */
export interface Card {
  /**
   * Unique identifier for the card
   */
  id: string;
  
  /**
   * Display name of the card
   */
  name: string;
  
  /**
   * Type of the card (NPU, PROGRAM, ICE)
   */
  type: CardType;
  
  /**
   * Resource cost to play the card
   */
  cost: number;
  
  /**
   * Attack strength (for PROGRAM and ICE types)
   */
  power?: number;
  
  /**
   * Health points (for PROGRAM and ICE types)
   */
  toughness?: number;
  
  /**
   * ASCII art representation of the card
   */
  ascii: string[];
  
  /**
   * Flavor text displayed on the card
   */
  flavorText: string;
  
  /**
   * Additional card-specific properties
   */
  properties?: Record<string, unknown>;
}

/**
 * Interface for NPU (Neural Processing Unit) cards
 */
export interface NpuCard extends Card {
  type: CardType.NPU;
}

/**
 * Interface for program cards
 */
export interface ProgramCard extends Card {
  type: CardType.PROGRAM;
  power: number;
  toughness: number;
  programType: ProgramType;
}

/**
 * Interface for ICE (Intrusion Countermeasure Electronics) cards
 */
export interface IceCard extends Card {
  type: CardType.ICE;
  power: number;
  toughness: number;
  iceType: IceType;
}

/**
 * Type guards to check card types
 */

/**
 * Type guard to check if a card is an NPU card
 */
export function isNpuCard(card: Card): card is NpuCard {
  return card.type === CardType.NPU;
}

/**
 * Type guard to check if a card is a program card
 */
export function isProgramCard(card: Card): card is ProgramCard {
  return card.type === CardType.PROGRAM;
}

/**
 * Type guard to check if a card is an ICE card
 */
export function isIceCard(card: Card): card is IceCard {
  return card.type === CardType.ICE;
} 