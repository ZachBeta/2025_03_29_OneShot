import * as readline from 'readline';
import { ActionType, KEY_ACTION_MAP, PlayCardPayload, SelectCardPayload, AttackPayload, UserAction } from '../models/UserAction';
import { GameState } from '../models/GameState';
import { CardType } from '../models/types';

/**
 * Handler for processing user keyboard input
 */
export class InputHandler {
  private rl: readline.Interface;
  private isListening: boolean = false;
  private gameState: GameState | null = null;
  
  constructor() {
    // Create readline interface for capturing keyboard input
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    
    // Configure raw mode to get each keypress
    readline.emitKeypressEvents(process.stdin);
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(true);
    }
    
    // Close readline interface on exit
    process.on('exit', () => {
      this.rl.close();
      if (process.stdin.isTTY) {
        process.stdin.setRawMode(false);
      }
    });
  }
  
  /**
   * Updates the current game state
   */
  public setGameState(state: GameState): void {
    this.gameState = state;
  }
  
  /**
   * Gets user input and converts it to a UserAction
   */
  public async getInput(): Promise<UserAction> {
    this.isListening = true;
    
    return new Promise<UserAction>((resolve) => {
      const keyListener = (str: string, key: readline.Key) => {
        if (key.ctrl && key.name === 'c') {
          // Handle Ctrl+C
          process.exit(0);
        } else {
          const action = this.parseKeypress(str, key);
          if (action) {
            // Remove listener once we have a valid action
            process.stdin.removeListener('keypress', keyListener);
            this.isListening = false;
            resolve(action);
          }
        }
      };
      
      // Add temporary keypress listener
      process.stdin.on('keypress', keyListener);
    });
  }
  
  /**
   * Parse a keypress into a UserAction
   * @param str - The key pressed
   * @param key - The key object
   * @returns A UserAction based on the pressed key
   */
  private parseKeypress(str: string, key: readline.Key): UserAction | null {
    // Check for direct mappings
    if (key.ctrl && key.name === 'c') {
      // Ctrl+C to exit
      process.exit(0);
      return null;
    }
    
    // Handle special keys
    switch (key.name) {
      case 'q':
        return { type: ActionType.QUIT };
      case 'space':
        return { type: ActionType.END_PHASE };
      case 'h':
        return { type: ActionType.HELP };
      case 's':
        return { type: ActionType.SAVE };
      case 'l':
        return { type: ActionType.LOAD };
    }
    
    // Check for number keys (1-9)
    if (str >= '1' && str <= '9') {
      return this.createActionFromNumber(parseInt(str, 10) - 1);
    }
    
    // No matching key
    return null;
  }
  
  /**
   * Creates an appropriate action based on the current game state and the number pressed
   */
  private createActionFromNumber(index: number): UserAction | null {
    if (!this.gameState) {
      return null;
    }
    
    const { runner, activePlayer, phase } = this.gameState;
    
    // Handle number keys based on the current phase
    switch (phase) {
      case 'NPU':
        // During NPU phase, numbers play NPU cards from hand
        if (index < runner.hand.length) {
          const card = runner.hand[index];
          if (card.type === CardType.NPU) {
            return {
              type: ActionType.PLAY_NPU,
              payload: {
                cardIndex: index,
                cardType: CardType.NPU
              } as PlayCardPayload
            };
          }
        }
        break;
        
      case 'MAIN':
        // During main phase, numbers play non-NPU cards from hand
        if (index < runner.hand.length) {
          const card = runner.hand[index];
          if (card.type !== CardType.NPU) {
            return {
              type: ActionType.PLAY_CARD,
              payload: {
                cardIndex: index,
                cardType: card.type
              } as PlayCardPayload
            };
          }
        }
        break;
        
      case 'COMBAT':
        // During combat phase, numbers select programs to attack with
        if (index < runner.field.length) {
          return {
            type: ActionType.ATTACK,
            payload: {
              programIndex: index
            } as AttackPayload
          };
        }
        break;
    }
    
    return null;
  }
  
  /**
   * Stops listening for keyboard input
   */
  public stopListening(): void {
    this.isListening = false;
    process.stdin.removeAllListeners('keypress');
  }
  
  /**
   * Cleans up resources
   */
  public cleanup(): void {
    this.stopListening();
    this.rl.close();
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(false);
    }
  }
} 