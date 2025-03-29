/**
 * Common types and enums used throughout the application
 */

/**
 * Represents the type of player
 */
export enum PlayerType {
  RUNNER = 'RUNNER',
  CORP = 'CORP'
}

/**
 * Represents the current phase of a turn
 */
export enum PhaseType {
  DRAW = 'DRAW',
  NPU = 'NPU',
  MAIN = 'MAIN',
  COMBAT = 'COMBAT'
}

/**
 * Represents the type of card
 */
export enum CardType {
  NPU = 'NPU',
  PROGRAM = 'PROGRAM',
  ICE = 'ICE'
}

/**
 * Represents the subtype of a program card
 */
export enum ProgramType {
  FRACTER = 'FRACTER',
  KILLER = 'KILLER',
  DECODER = 'DECODER'
}

/**
 * Represents the subtype of an ICE card
 */
export enum IceType {
  BARRIER = 'BARRIER',
  SENTRY = 'SENTRY',
  CODE_GATE = 'CODE_GATE'
}

/**
 * Represents the type of event in the game log
 */
export enum EventType {
  GAME = 'GAME',
  COMBAT = 'COMBAT',
  CARD = 'CARD',
  PHASE = 'PHASE'
} 