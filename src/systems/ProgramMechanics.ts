import { GameState } from '../models/GameState';
import { Card, ProgramCard } from '../models/Card';
import { CardType, PlayerType, PhaseType, ProgramType, IceType, EventType } from '../models/types';
import { LogEntry, createLogEntry } from '../models/LogEntry';

/**
 * Custom error for program operations
 */
export class ProgramError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ProgramError';
  }
}

/**
 * Handles game mechanics related to program cards
 */
export class ProgramMechanics {
  /**
   * Checks if a program can be installed from the Runner's hand
   */
  public static canInstallProgram(gameState: GameState, cardIndex: number): boolean {
    // Check if card index is valid
    if (cardIndex < 0 || cardIndex >= gameState.runner.hand.length) {
      return false;
    }
    
    const card = gameState.runner.hand[cardIndex];
    
    // Check if the card is a program
    if (card.type !== CardType.PROGRAM) {
      return false;
    }
    
    // Check if the runner has enough NPU
    if (gameState.runner.npuAvailable < card.cost) {
      return false;
    }
    
    return true;
  }
  
  /**
   * Installs a program from the Runner's hand to their field
   */
  public static installProgram(gameState: GameState, cardIndex: number): GameState {
    if (!this.canInstallProgram(gameState, cardIndex)) {
      throw new ProgramError('Cannot install program');
    }
    
    const card = gameState.runner.hand[cardIndex] as ProgramCard;
    
    // Create a new game state to avoid mutation
    const newState: GameState = {
      ...gameState,
      runner: {
        ...gameState.runner,
        // Remove card from hand
        hand: [
          ...gameState.runner.hand.slice(0, cardIndex),
          ...gameState.runner.hand.slice(cardIndex + 1)
        ],
        // Add card to field
        field: [...gameState.runner.field, card],
        // Deduct NPU
        npuAvailable: gameState.runner.npuAvailable - card.cost
      },
      // Add log entry
      eventLog: [
        ...gameState.eventLog,
        createLogEntry(`Runner installed ${card.name} program`, EventType.CARD, {
          programType: card.programType,
          cost: card.cost
        })
      ]
    };
    
    return newState;
  }
  
  /**
   * Calculates a program's effectiveness against a specific ICE type
   * Fracter programs are 1.5x effective against Barrier ICE
   */
  public static calculateEffectiveness(program: ProgramCard, iceType?: IceType): number {
    // Fracter vs Barrier gets 1.5x effectiveness
    if (program.programType === ProgramType.FRACTER && iceType === IceType.BARRIER) {
      return 1.5;
    }
    
    // Default effectiveness
    return 1.0;
  }
  
  /**
   * Checks if a program can attack
   */
  public static canAttack(gameState: GameState, programIndex: number): boolean {
    // Check if the program index is valid
    if (programIndex < 0 || programIndex >= gameState.runner.field.length) {
      return false;
    }
    
    const card = gameState.runner.field[programIndex];
    
    // Check if the card is a program
    if (card.type !== CardType.PROGRAM) {
      return false;
    }
    
    // Can only attack during combat phase and on Runner's turn
    if (gameState.phase !== PhaseType.COMBAT || gameState.activePlayer !== PlayerType.RUNNER) {
      return false;
    }
    
    return true;
  }
  
  /**
   * Calculates the damage dealt by a program
   */
  public static calculateDamage(program: ProgramCard, iceType?: IceType): number {
    const baseAttack = program.power;
    
    if (iceType) {
      // Apply effectiveness multiplier
      const effectiveness = this.calculateEffectiveness(program, iceType);
      return Math.floor(baseAttack * effectiveness);
    }
    
    return baseAttack;
  }
} 