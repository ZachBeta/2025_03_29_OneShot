import { GameState } from '../models/GameState';
import { GameStateManager } from './GameStateManager';
import { InputHandler } from './InputHandler';
import { ActionProcessor } from './ActionProcessor';
import { PhaseManager } from './PhaseManager';
import { TurnManager } from './TurnManager';
import { CorpAI } from './CorpAI';
import { InteractiveGameBoard } from '../ui/InteractiveGameBoard';
import { EventLogRenderer } from '../ui/EventLogRenderer';
import { HelpSystem } from '../ui/HelpSystem';
import { PlayerType, PhaseType, UserAction as LegacyUserAction } from '../models/types';
import { UserAction, ActionType } from '../models/UserAction';
import { CardType } from '../models/types';

/**
 * Manages the main game loop and coordinates all game systems
 */
export class GameLoop {
  private gameStateManager: GameStateManager;
  private inputHandler: InputHandler;
  private actionProcessor: ActionProcessor;
  private gameBoard: InteractiveGameBoard;
  private eventLogRenderer: EventLogRenderer;
  private helpSystem: HelpSystem;
  private isRunning: boolean = false;
  private exitRequested: boolean = false;
  private currentState: GameState;
  
  // Static timeout values that can be overridden in tests
  public static TITLE_SCREEN_DELAY = 100;
  public static CORP_TURN_DELAY = 100;
  public static CORP_ACTION_DELAY = 50;
  public static USER_ACTION_DELAY = 50;
  public static GAME_OVER_DELAY = 200;
  public static ERROR_ACK_DELAY = 100;
  
  /**
   * Creates a new GameLoop instance
   */
  constructor() {
    this.gameStateManager = new GameStateManager();
    this.inputHandler = new InputHandler();
    this.actionProcessor = new ActionProcessor(this.gameStateManager);
    this.gameBoard = new InteractiveGameBoard();
    this.eventLogRenderer = new EventLogRenderer();
    this.helpSystem = new HelpSystem();
    // Initialize empty state
    this.currentState = {
      turn: 0,
      phase: PhaseType.DRAW,
      activePlayer: PlayerType.RUNNER,
      gameOver: false,
      winner: undefined,
      runner: {
        deck: [],
        hand: [],
        field: [],
        npuAvailable: 0,
        npuTotal: 0
      },
      corp: {
        deck: [],
        hand: [],
        field: [],
        npuAvailable: 0,
        npuTotal: 0,
        core: {
          maxHp: 10,
          currentHp: 10
        }
      },
      eventLog: []
    };
  }
  
  /**
   * Set all timeouts to zero for testing
   * This should be called before tests to speed up test execution
   */
  public static setTestMode(): void {
    GameLoop.TITLE_SCREEN_DELAY = 0;
    GameLoop.CORP_TURN_DELAY = 0;
    GameLoop.CORP_ACTION_DELAY = 0;
    GameLoop.USER_ACTION_DELAY = 0;
    GameLoop.GAME_OVER_DELAY = 0;
    GameLoop.ERROR_ACK_DELAY = 0;
  }
  
  /**
   * Reset timeouts to default values
   */
  public static resetTimeouts(): void {
    GameLoop.TITLE_SCREEN_DELAY = 100;
    GameLoop.CORP_TURN_DELAY = 100;
    GameLoop.CORP_ACTION_DELAY = 50;
    GameLoop.USER_ACTION_DELAY = 50;
    GameLoop.GAME_OVER_DELAY = 200;
    GameLoop.ERROR_ACK_DELAY = 100;
  }
  
  /**
   * Initializes the game and shows the title screen
   */
  public async start(): Promise<void> {
    try {
      this.isRunning = true;
      
      // Display title screen and wait for input
      await this.showTitleScreen();
      
      // Initialize a new game
      this.currentState = this.initializeNewGame();
      
      // Main game loop
      while (this.isRunning && !this.currentState.gameOver && !this.exitRequested) {
        // Refresh the display
        this.updateDisplay(this.currentState);
        
        // Process the current turn
        await this.processTurn();
        
        // Check for game over condition
        if (this.currentState.gameOver) {
          await this.showGameOverScreen();
          break;
        }
      }
      
      // Clean up and exit
      this.shutdown();
      
    } catch (error) {
      console.error('An error occurred in the game loop:', error);
      this.shutdown();
    }
  }
  
  /**
   * Requests a clean shutdown of the game
   */
  public requestExit(): void {
    this.exitRequested = true;
  }
  
  /**
   * Shows the title screen and waits for a key press
   */
  private async showTitleScreen(): Promise<void> {
    console.clear();
    
    const titleArt = [
      "   _____   _        ____    _____          _____    _    _   _   _   _   _   ______   _____  ",
      "  / ____| | |      / __ \\  |  __ \\        |  __ \\  | |  | | | \\ | | | \\ | | |  ____| |  __ \\ ",
      " | (___   | |     | |  | | | |__) |       | |__) | | |  | | |  \\| | |  \\| | | |__    | |__) |",
      "  \\___ \\  | |     | |  | | |  ___/        |  _  /  | |  | | | . ` | | . ` | |  __|   |  _  / ",
      "  ____) | | |____ | |__| | | |            | | \\ \\  | |__| | | |\\  | | |\\  | | |____  | | \\ \\ ",
      " |_____/  |______| \\____/  |_|            |_|  \\_\\  \\____/  |_| \\_| |_| \\_| |______| |_|  \\_\\",
      "",
      "                            A TERMINAL-BASED CYBERPUNK CARD GAME                             ",
      "",
      "                               Press any key to start...                                     "
    ];
    
    titleArt.forEach(line => console.log(line));
    
    // Wait for any key press - simulated since we don't have this method
    await new Promise(resolve => setTimeout(resolve, GameLoop.TITLE_SCREEN_DELAY));
  }
  
  /**
   * Initializes a new game state
   */
  private initializeNewGame(): GameState {
    // Use PhaseManager's setupNewGame method which already handles deck creation
    // and initial card drawing
    return PhaseManager.setupNewGame();
  }
  
  /**
   * Processes a single turn in the game
   */
  private async processTurn(): Promise<void> {
    const isRunnerTurn = this.currentState.activePlayer === PlayerType.RUNNER;
    
    if (isRunnerTurn) {
      await this.processRunnerTurn();
    } else {
      this.processCorpTurn();
    }
  }
  
  /**
   * Processes the Runner's turn with user input
   */
  private async processRunnerTurn(): Promise<void> {
    let phaseComplete = false;
    
    while (!phaseComplete && !this.currentState.gameOver && !this.exitRequested) {
      // Update available actions based on current phase
      const availableActions = this.getAvailableActions();
      this.showAvailableActions(availableActions);
      
      // Get user input
      const userAction = await this.getUserAction();
      
      // Handle quit action immediately
      if (userAction?.type === ActionType.QUIT) {
        this.requestExit();
        return;
      }
      
      // Handle help action
      if (userAction?.type === ActionType.HELP) {
        // Show help and wait for user to dismiss
        await this.helpSystem.showHelp(this.currentState);
        
        // Refresh the display after help is dismissed
        this.updateDisplay(this.currentState);
        continue; // Skip the rest of the loop
      }
      
      // Process the action
      if (userAction) {
        try {
          this.currentState = this.actionProcessor.processAction(userAction);
          
          // Check if phase is complete after this action
          if (userAction.type === ActionType.END_PHASE) {
            // Check if we need to advance to the next phase
            if (this.currentState.phase === PhaseType.COMBAT) {
              // End turn after combat phase
              this.currentState = TurnManager.endTurn(this.currentState);
              phaseComplete = true;
            } else {
              // Just advance to the next phase
              this.currentState = TurnManager.advanceToNextPhase(this.currentState);
            }
          }
          
          // Update the display after each action
          this.updateDisplay(this.currentState);
          
        } catch (error) {
          // Display error message
          this.showErrorMessage(error instanceof Error ? error.message : 'An unknown error occurred');
          
          // Wait for acknowledgment - simulated
          await new Promise(resolve => setTimeout(resolve, GameLoop.ERROR_ACK_DELAY));
          
          // Refresh display
          this.updateDisplay(this.currentState);
        }
      }
    }
  }
  
  /**
   * Processes the Corp's turn with AI
   */
  private processCorpTurn(): void {
    let turnComplete = false;
    
    this.showMessage("Corp's turn...");
    
    // Provide a brief delay for player to see turn change
    this.delay(GameLoop.CORP_TURN_DELAY);
    
    while (!turnComplete && !this.currentState.gameOver) {
      // Get next action from Corp AI
      const corpAction = CorpAI.getNextAction(this.currentState);
      
      if (corpAction) {
        // Process the Corp's action
        try {
          // Convert legacy UserAction to the new format if needed
          const action = this.convertLegacyAction(corpAction);
          this.currentState = this.actionProcessor.processAction(action);
          
          // Update display after each action
          this.updateDisplay(this.currentState);
          
          // Provide a brief delay between Corp actions
          this.delay(GameLoop.CORP_ACTION_DELAY);
          
          // Check if phase is complete
          if (corpAction.type === 'EndPhase') {
            if (this.currentState.phase === PhaseType.MAIN) {
              // End turn after main phase for Corp
              this.currentState = TurnManager.endTurn(this.currentState);
              turnComplete = true;
            } else {
              // Just advance to the next phase
              this.currentState = TurnManager.advanceToNextPhase(this.currentState);
            }
          }
        } catch (error) {
          // Log error but continue Corp turn
          console.error('Error during Corp action:', error);
        }
      } else {
        // No action available, end the turn
        this.currentState = TurnManager.endTurn(this.currentState);
        turnComplete = true;
      }
    }
  }
  
  /**
   * Convert legacy UserAction format to the new format
   */
  private convertLegacyAction(legacyAction: LegacyUserAction): UserAction {
    switch (legacyAction.type) {
      case 'PlayNPU':
        return {
          type: ActionType.PLAY_NPU,
          payload: {
            cardIndex: legacyAction.cardIndex,
            cardType: CardType.NPU
          }
        };
      case 'PlayCard':
        return {
          type: ActionType.PLAY_CARD,
          payload: {
            cardIndex: legacyAction.cardIndex,
            cardType: CardType.ICE
          }
        };
      case 'Attack':
        return {
          type: ActionType.ATTACK,
          payload: {
            programIndex: legacyAction.programIndex,
            targetIndex: undefined
          }
        };
      case 'EndPhase':
        return {
          type: ActionType.END_PHASE,
          payload: null
        };
      case 'Quit':
        return {
          type: ActionType.QUIT,
          payload: null
        };
      case 'Help':
        return {
          type: ActionType.HELP,
          payload: null
        };
      default:
        return {
          type: ActionType.END_PHASE,
          payload: null
        };
    }
  }
  
  /**
   * Updates the game display with current state
   * @param gameState Current game state
   */
  private updateDisplay(gameState: GameState): void {
    // Clear any highlights and indicators
    this.gameBoard.clearHighlights();
    this.gameBoard.clearAttackIndicators();
    
    // Add appropriate highlights based on game state
    this.updateHighlights(gameState);
    
    // Set status message based on current phase
    this.gameBoard.setStatusMessage(this.getStatusMessage(gameState));
    
    // Refresh the display
    this.gameBoard.refreshDisplay(gameState);
  }
  
  /**
   * Updates card highlights based on current game state
   * @param gameState Current game state
   */
  private updateHighlights(gameState: GameState): void {
    // This would contain logic to highlight cards based on the current phase
    // and available actions
    
    // For example, highlight playable cards in hand during Main phase
    if (gameState.activePlayer === PlayerType.RUNNER) {
      // Highlight cards in Runner's hand that can be played
      const playableCardIndices: number[] = [];
      
      gameState.runner.hand.forEach((card, index) => {
        // Check if card can be played based on NPU
        if (card.cost <= gameState.runner.npuAvailable) {
          playableCardIndices.push(index);
        }
      });
      
      if (playableCardIndices.length > 0) {
        this.gameBoard.highlightSelectableCards('runner', playableCardIndices);
      }
    }
  }
  
  /**
   * Gets a status message based on current game state
   * @param gameState Current game state
   * @returns Status message string
   */
  private getStatusMessage(gameState: GameState): string {
    const player = gameState.activePlayer === PlayerType.RUNNER ? 'Runner' : 'Corp';
    return `${player}'s Turn - ${gameState.phase} Phase`;
  }
  
  /**
   * Shows available actions to the player
   * @param actions Array of available action descriptions
   */
  private showAvailableActions(actions: string[]): void {
    this.gameBoard.setAvailableCommands(actions);
  }
  
  /**
   * Gets available action descriptions based on game state
   * @returns Array of action description strings
   */
  private getAvailableActions(): string[] {
    // This would return different actions based on the current phase
    const actions: string[] = [];
    
    // Common actions
    actions.push('[Space] End Phase', '[H] Help', '[Q] Quit');
    
    // Phase-specific actions
    switch (this.currentState.phase) {
      case PhaseType.MAIN:
        actions.push('[1-9] Play Card');
        break;
      case PhaseType.COMBAT:
        actions.push('[1-9] Select Program');
        break;
      default:
        // No additional actions
        break;
    }
    
    return actions;
  }
  
  /**
   * Shows an error message
   * @param message Error message to show
   */
  private showErrorMessage(message: string): void {
    this.gameBoard.setStatusMessage(`ERROR: ${message}`);
  }
  
  /**
   * Shows a general message
   * @param message Message to show
   */
  private showMessage(message: string): void {
    this.gameBoard.setStatusMessage(message);
    this.gameBoard.refreshDisplay(this.currentState);
  }
  
  /**
   * Shows the game over screen
   */
  private async showGameOverScreen(): Promise<void> {
    console.clear();
    
    const winner = this.currentState.winner === PlayerType.RUNNER ? 'RUNNER' : 'CORP';
    
    const gameOverArt = [
      "   _____                         ____                      ",
      "  / ____|                       / __ \\                     ",
      " | |  __  __ _ _ __ ___   ___  | |  | |_   _____ _ __     ",
      " | | |_ |/ _` | '_ ` _ \\ / _ \\ | |  | \\ \\ / / _ \\ '__|    ",
      " | |__| | (_| | | | | | |  __/ | |__| |\\ V /  __/ |       ",
      "  \\_____|\\__,_|_| |_| |_|\\___|  \\____/  \\_/ \\___|_|       ",
      "",
      `                   ${winner} WINS!`,
      "",
      "              Press any key to exit..."
    ];
    
    gameOverArt.forEach(line => console.log(line));
    
    // Wait for any key press - simulated
    await new Promise(resolve => setTimeout(resolve, GameLoop.GAME_OVER_DELAY));
  }
  
  /**
   * Get user input via the InputHandler
   * @returns A UserAction based on user's keyboard input
   */
  private async getUserAction(): Promise<UserAction> {
    // Set the current game state in the input handler
    this.inputHandler.setGameState(this.currentState);
    
    // Get user input through the input handler
    return this.inputHandler.getInput();
  }
  
  /**
   * Simple delay function
   * @param ms Milliseconds to delay
   */
  private delay(ms: number): void {
    const startTime = Date.now();
    while (Date.now() - startTime < ms) {
      // Busy wait
    }
  }
  
  /**
   * Cleans up and prepares for exit
   */
  private shutdown(): void {
    this.isRunning = false;
    console.clear();
    console.log('Thanks for playing SLOP_RUNNER!');
  }
} 