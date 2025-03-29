/**
 * Factory for creating card instances
 */

import { nanoid } from 'nanoid';
import { Card, NpuCard, ProgramCard, IceCard } from '../models/Card';
import { CardType, ProgramType, IceType } from '../models/types';

/**
 * ASCII art for different card types
 */
const ASCII_ART = {
  NPU: [
    '  ___[]___  ',
    ' |__   __| ',
    '    | |    ',
    '    |_|    '
  ],
  FRACTER: [
    '  /\\      ',
    ' /  \\     ',
    '/____\\    ',
    '|    |    '
  ],
  BARRIER: [
    ' ######    ',
    ' #    #    ',
    ' #    #    ',
    ' ######    '
  ]
};

/**
 * Flavor text for different card types
 */
const FLAVOR_TEXT = {
  NPU: 'Neural processing unit. The backbone of any runner\'s rig.',
  FRACTER: 'Breaking through barriers with digital force.',
  BARRIER: 'A wall between you and what you want.'
};

/**
 * Creates a new NPU card
 * @returns An NPU card instance
 */
export function createNpuCard(): NpuCard {
  return {
    id: nanoid(),
    name: 'NPU',
    type: CardType.NPU,
    cost: 0,
    ascii: ASCII_ART.NPU,
    flavorText: FLAVOR_TEXT.NPU
  };
}

/**
 * Creates a new Fracter program card
 * @returns A Fracter program card instance
 */
export function createFracterCard(): ProgramCard {
  return {
    id: nanoid(),
    name: 'Fracter',
    type: CardType.PROGRAM,
    programType: ProgramType.FRACTER,
    cost: 1,
    power: 1,
    toughness: 2,
    ascii: ASCII_ART.FRACTER,
    flavorText: FLAVOR_TEXT.FRACTER
  };
}

/**
 * Creates a new Barrier ICE card
 * @returns A Barrier ICE card instance
 */
export function createBarrierCard(): IceCard {
  return {
    id: nanoid(),
    name: 'Barrier',
    type: CardType.ICE,
    iceType: IceType.BARRIER,
    cost: 1,
    power: 1,
    toughness: 1,
    ascii: ASCII_ART.BARRIER,
    flavorText: FLAVOR_TEXT.BARRIER
  };
}

/**
 * Creates a runner starter deck
 * @returns Array of cards for the runner's starter deck
 */
export function createRunnerStarterDeck(): Card[] {
  const deck: Card[] = [];
  
  // Add 10 NPU cards
  for (let i = 0; i < 10; i++) {
    deck.push(createNpuCard());
  }
  
  // Add 3 Fracter cards
  for (let i = 0; i < 3; i++) {
    deck.push(createFracterCard());
  }
  
  // The remaining 17 slots are for future expansion
  
  return deck;
}

/**
 * Creates a corp starter deck
 * @returns Array of cards for the corp's starter deck
 */
export function createCorpStarterDeck(): Card[] {
  const deck: Card[] = [];
  
  // Add 5 NPU cards
  for (let i = 0; i < 5; i++) {
    deck.push(createNpuCard());
  }
  
  // Add 3 Barrier cards
  for (let i = 0; i < 3; i++) {
    deck.push(createBarrierCard());
  }
  
  return deck;
}

/**
 * Shuffles a deck of cards
 * @param deck - The deck to shuffle
 * @returns The shuffled deck
 */
export function shuffleDeck<T extends Card>(deck: T[]): T[] {
  // Create a copy of the deck to avoid modifying the original
  const shuffled = [...deck];
  
  // Fisher-Yates shuffle algorithm
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  
  return shuffled;
} 