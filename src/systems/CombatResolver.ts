import { GameState } from '../models/GameState';
import { Card, ProgramCard, IceCard } from '../models/Card';
import { PlayerType, CardType, EventType } from '../models/types';
import { createLogEntry } from '../models/LogEntry';
import { ProgramMechanics } from './ProgramMechanics';
import { ICEMechanics } from './ICEMechanics';

/**
 * Custom error for combat-related operations
 */
export class CombatError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CombatError';
  }
}

/**
 * Manages combat resolution between programs and ICE
 */
export class CombatResolver {
  /**
   * Declares an attack from a Runner program
   * @param gameState - Current game state
   * @param programIndex - Index of the attacking program in the Runner's field
   * @returns Updated game state with the attack declared
   */
  public static declareAttack(gameState: GameState, programIndex: number): GameState {
    // Check if the program can attack
    if (!ProgramMechanics.canAttack(gameState, programIndex)) {
      throw new CombatError('This program cannot attack');
    }
    
    const program = gameState.runner.field[programIndex] as ProgramCard;
    
    // Log the attack declaration
    const newState: GameState = {
      ...gameState,
      eventLog: [
        ...gameState.eventLog,
        createLogEntry(
          `Runner declares attack with ${program.name}`,
          EventType.COMBAT,
          { cardId: program.id, cardName: program.name }
        )
      ]
    };
    
    return newState;
  }
  
  /**
   * Determines which ICE is blocking the attack
   * @param gameState - Current game state
   * @param programIndex - Index of the attacking program
   * @param iceIndex - Index of the blocking ICE, or -1 for no block
   * @returns Updated game state with the block declared
   */
  public static declareBlock(gameState: GameState, programIndex: number, iceIndex: number): GameState {
    // Check if attack is valid
    if (!ProgramMechanics.canAttack(gameState, programIndex)) {
      throw new CombatError('No valid attack to block');
    }
    
    // Check if no block is declared
    if (iceIndex === -1) {
      return this.resolveUnblockedAttack(gameState, programIndex);
    }
    
    // Check if the ICE can block
    if (!ICEMechanics.canBlock(gameState, iceIndex)) {
      throw new CombatError('This ICE cannot block');
    }
    
    const program = gameState.runner.field[programIndex] as ProgramCard;
    const ice = gameState.corp.field[iceIndex] as IceCard;
    
    // Log the block declaration
    const stateWithLog: GameState = {
      ...gameState,
      eventLog: [
        ...gameState.eventLog,
        createLogEntry(
          `Corp blocks with ${ice.name}`,
          EventType.COMBAT,
          { cardId: ice.id, cardName: ice.name }
        )
      ]
    };
    
    // Resolve the combat
    return this.resolveCombat(stateWithLog, programIndex, iceIndex);
  }
  
  /**
   * Resolves combat between a program and an ICE
   * @param gameState - Current game state
   * @param programIndex - Index of the attacking program
   * @param iceIndex - Index of the blocking ICE
   * @returns Updated game state after combat
   */
  private static resolveCombat(gameState: GameState, programIndex: number, iceIndex: number): GameState {
    const program = gameState.runner.field[programIndex] as ProgramCard;
    const ice = gameState.corp.field[iceIndex] as IceCard;
    
    // Calculate damage in both directions simultaneously
    const programDamage = ProgramMechanics.calculateDamage(program, ice.iceType);
    const iceDamage = ICEMechanics.calculateDamage(ice);
    
    // Log the damage calculation
    const stateWithLog: GameState = {
      ...gameState,
      eventLog: [
        ...gameState.eventLog,
        createLogEntry(
          `${program.name} deals ${programDamage} damage to ${ice.name}`,
          EventType.COMBAT,
          { attacker: program.id, defender: ice.id, damage: programDamage }
        ),
        createLogEntry(
          `${ice.name} deals ${iceDamage} damage to ${program.name}`,
          EventType.COMBAT,
          { attacker: ice.id, defender: program.id, damage: iceDamage }
        )
      ]
    };
    
    // Apply damage and check for destroyed cards
    return this.applyDamageAndRemoveDestroyed(stateWithLog, programIndex, iceIndex, programDamage, iceDamage);
  }
  
  /**
   * Applies damage to cards and removes destroyed cards
   * @param gameState - Current game state
   * @param programIndex - Index of the attacking program
   * @param iceIndex - Index of the blocking ICE
   * @param programDamage - Damage dealt by the program
   * @param iceDamage - Damage dealt by the ICE
   * @returns Updated game state after damage application
   */
  private static applyDamageAndRemoveDestroyed(
    gameState: GameState,
    programIndex: number,
    iceIndex: number,
    programDamage: number,
    iceDamage: number
  ): GameState {
    const program = gameState.runner.field[programIndex] as ProgramCard;
    const ice = gameState.corp.field[iceIndex] as IceCard;
    
    // Check if cards are destroyed
    const isProgramDestroyed = iceDamage >= program.toughness;
    const isIceDestroyed = programDamage >= ice.toughness;
    
    let newState = { ...gameState };
    
    // Handle destroyed program
    if (isProgramDestroyed) {
      newState = {
        ...newState,
        runner: {
          ...newState.runner,
          field: [
            ...newState.runner.field.slice(0, programIndex),
            ...newState.runner.field.slice(programIndex + 1)
          ]
        },
        eventLog: [
          ...newState.eventLog,
          createLogEntry(
            `${program.name} is destroyed`,
            EventType.COMBAT,
            { cardId: program.id, cardName: program.name }
          )
        ]
      };
    }
    
    // Handle destroyed ICE
    if (isIceDestroyed) {
      newState = {
        ...newState,
        corp: {
          ...newState.corp,
          field: [
            ...newState.corp.field.slice(0, iceIndex),
            ...newState.corp.field.slice(iceIndex + 1)
          ]
        },
        eventLog: [
          ...newState.eventLog,
          createLogEntry(
            `${ice.name} is destroyed`,
            EventType.COMBAT,
            { cardId: ice.id, cardName: ice.name }
          )
        ]
      };
    }
    
    return newState;
  }
  
  /**
   * Resolves an unblocked attack which damages the Corp core
   * @param gameState - Current game state
   * @param programIndex - Index of the attacking program
   * @returns Updated game state after the unblocked attack
   */
  private static resolveUnblockedAttack(gameState: GameState, programIndex: number): GameState {
    const program = gameState.runner.field[programIndex] as ProgramCard;
    const damage = ProgramMechanics.calculateDamage(program);
    
    // Log the unblocked attack
    const stateWithLog: GameState = {
      ...gameState,
      eventLog: [
        ...gameState.eventLog,
        createLogEntry(
          `${program.name} attack is unblocked`,
          EventType.COMBAT,
          { cardId: program.id, cardName: program.name }
        ),
        createLogEntry(
          `${program.name} deals ${damage} damage to Corp core`,
          EventType.COMBAT,
          { cardId: program.id, damage }
        )
      ]
    };
    
    // Apply damage to Corp core
    const newCoreHp = Math.max(0, gameState.corp.core.currentHp - damage);
    
    const newState: GameState = {
      ...stateWithLog,
      corp: {
        ...stateWithLog.corp,
        core: {
          ...stateWithLog.corp.core,
          currentHp: newCoreHp
        }
      }
    };
    
    return newState;
  }
  
  /**
   * Clears all combat damage and effects at the end of combat phase
   * @param gameState - Current game state
   * @returns Updated game state with combat effects cleared
   */
  public static clearCombatEffects(gameState: GameState): GameState {
    // Currently, there are no temporary combat effects to clear
    // This is a placeholder for future implementations that might track
    // temporary damage or effects during combat
    
    const newState: GameState = {
      ...gameState,
      eventLog: [
        ...gameState.eventLog,
        createLogEntry(
          'Combat phase ended',
          EventType.PHASE,
          { phase: 'COMBAT' }
        )
      ]
    };
    
    return newState;
  }
} 