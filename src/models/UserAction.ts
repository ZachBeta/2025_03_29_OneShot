import { CardType } from './types';

/**
 * Represents a standardized action taken by a user or the AI
 */
export interface UserAction {
  type: ActionType;
  payload?: ActionPayload;
}

/**
 * Types of actions available in the game
 */
export enum ActionType {
  PLAY_NPU = 'PLAY_NPU',
  PLAY_CARD = 'PLAY_CARD',
  SELECT_CARD = 'SELECT_CARD',
  ATTACK = 'ATTACK',
  BLOCK = 'BLOCK',
  END_PHASE = 'END_PHASE',
  USE_ABILITY = 'USE_ABILITY',
  HELP = 'HELP',
  SAVE = 'SAVE',
  LOAD = 'LOAD',
  QUIT = 'QUIT',
}

/**
 * Payloads that can be attached to actions
 */
export type ActionPayload = 
  | PlayCardPayload
  | SelectCardPayload
  | AttackPayload
  | null;

/**
 * Payload for playing a card
 */
export interface PlayCardPayload {
  cardIndex: number; // Index in the hand
  cardType: CardType;
}

/**
 * Payload for selecting a card (for targeting)
 */
export interface SelectCardPayload {
  cardIndex: number; // Index in the field
  isOpponentCard: boolean;
}

/**
 * Payload for attacking
 */
export interface AttackPayload {
  programIndex: number; // Index of attacking program
  targetIndex?: number; // Index of target ICE (if selected)
}

/**
 * Maps key presses to action types
 */
export const KEY_ACTION_MAP: Record<string, ActionType> = {
  ' ': ActionType.END_PHASE,
  'enter': ActionType.END_PHASE,
  'h': ActionType.HELP,
  'q': ActionType.QUIT,
}; 