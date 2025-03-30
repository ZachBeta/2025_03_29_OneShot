import { createInterface } from 'readline';
import { UserAction, ActionType, PlayCardPayload, AttackPayload, SelectCardPayload } from '../models/UserAction';
import { GameState } from '../models/GameState';
import { PlayerType, PhaseType, CardType } from '../models/types';

/**
 * Handles user input for the game
 */
export class InputHandler {
  private readline: any;
  private currentState: GameState | null = null;
  
  constructor() {
    this.readline = createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }
  
  /**
   * Gets a single keypress from the user
   * @returns Promise resolving to the key pressed
   */
  public async getKeypress(): Promise<{ key: string }> {
    return new Promise((resolve) => {
      const onData = (data: Buffer) => {
        process.stdin.removeListener('data', onData);
        process.stdin.setRawMode(false);
        process.stdin.pause();
        resolve({ key: data.toString() });
      };
      
      process.stdin.setRawMode(true);
      process.stdin.resume();
      process.stdin.once('data', onData);
    });
  }
  
  /**
   * Gets user input as a string
   * @param prompt The prompt to display to the user
   * @returns Promise resolving to the input string
   */
  public async getInput(prompt: string = '> '): Promise<string> {
    return new Promise((resolve) => {
      this.readline.question(prompt, (answer: string) => {
        resolve(answer.trim());
      });
    });
  }
  
  /**
   * Sets the current game state for context-aware input handling
   * @param state Current game state
   */
  public setGameState(state: GameState): void {
    this.currentState = state;
  }
  
  /**
   * Gets the next user action based on input
   * @param gameState Current game state for context
   * @returns Promise resolving to a UserAction object
   */
  public async getNextUserAction(gameState: GameState): Promise<UserAction> {
    // Store the current state for reference
    this.currentState = gameState;
    
    // Display prompt based on the current phase
    const { phase } = gameState;
    const promptPrefix = `[${phase}]`;
    
    // Get raw input from user
    const input = await this.getInput(`${promptPrefix} > `);
    
    // Parse the input into an action
    return this.parseInput(input);
  }
  
  /**
   * Parses user input into a UserAction
   * @param input The raw input string
   * @returns A UserAction object
   */
  private parseInput(input: string): UserAction {
    // Convert to lowercase and trim
    const normalizedInput = input.toLowerCase().trim();
    
    // Handle common commands
    switch (normalizedInput) {
      case '':
      case 'end':
      case 'e':
        return { type: ActionType.END_PHASE };
        
      case 'help':
      case 'h':
      case '?':
        return { type: ActionType.HELP };
        
      case 'quit':
      case 'q':
      case 'exit':
        return { type: ActionType.QUIT };
        
      case 'save':
      case 's':
        return { type: ActionType.SAVE };
        
      case 'load':
      case 'l':
        return { type: ActionType.LOAD };
    }
    
    // Parse more complex commands
    if (normalizedInput.startsWith('play ')) {
      return this.parsePlayCommand(normalizedInput.substring(5));
    }
    
    if (normalizedInput.startsWith('attack ')) {
      return this.parseAttackCommand(normalizedInput.substring(7));
    }
    
    // Default to END_PHASE if we can't understand the command
    return { type: ActionType.END_PHASE };
  }
  
  /**
   * Parses a play command
   * @param args Arguments for the play command
   * @returns A UserAction for playing a card
   */
  private parsePlayCommand(args: string): UserAction {
    // Try to parse card index
    const cardIndex = parseInt(args, 10);
    
    if (isNaN(cardIndex)) {
      // Invalid index, default to first card
      return { 
        type: ActionType.PLAY_CARD,
        payload: { 
          cardIndex: 0,
          isOpponentCard: false
        } as SelectCardPayload
      };
    }
    
    // Convert to 0-based index if user provided 1-based
    const adjustedIndex = cardIndex > 0 ? cardIndex - 1 : cardIndex;
    
    // Check if this is an NPU card (would need to access current state/hand)
    const isNpu = this.isNpuCard(adjustedIndex);
    
    return {
      type: isNpu ? ActionType.PLAY_NPU : ActionType.PLAY_CARD,
      payload: { 
        cardIndex: adjustedIndex,
        cardType: isNpu ? CardType.NPU : CardType.PROGRAM
      } as PlayCardPayload
    };
  }
  
  /**
   * Parses an attack command
   * @param args Arguments for the attack command
   * @returns A UserAction for attacking
   */
  private parseAttackCommand(args: string): UserAction {
    // Try to parse program index
    const programIndex = parseInt(args, 10);
    
    if (isNaN(programIndex)) {
      // Invalid index, default to first program
      return { 
        type: ActionType.ATTACK,
        payload: { programIndex: 0 }
      };
    }
    
    // Convert to 0-based index if user provided 1-based
    const adjustedIndex = programIndex > 0 ? programIndex - 1 : programIndex;
    
    return {
      type: ActionType.ATTACK,
      payload: { programIndex: adjustedIndex }
    };
  }
  
  /**
   * Checks if a card is an NPU card
   * @param cardIndex Index of the card in hand
   * @returns True if the card is an NPU card
   */
  private isNpuCard(cardIndex: number): boolean {
    // In a real implementation, this would check the current state/hand
    // For now, just return a simple implementation
    if (!this.currentState) return false;
    
    const { activePlayer, runner, corp } = this.currentState;
    const hand = activePlayer === PlayerType.RUNNER ? runner.hand : corp.hand;
    
    if (cardIndex < 0 || cardIndex >= hand.length) {
      return false;
    }
    
    return hand[cardIndex].type === 'NPU';
  }
  
  /**
   * Cleans up resources
   */
  public cleanup(): void {
    if (this.readline) {
      this.readline.close();
    }
  }
} 