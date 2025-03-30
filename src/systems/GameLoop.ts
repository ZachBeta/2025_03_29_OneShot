import { GameState } from '../models/GameState';
import { GameStateManager } from './GameStateManager';
import { ActionProcessor } from './ActionProcessor';
import { CorpAI } from './CorpAI';
import { GameUI } from '../ui/GameUI';
import { UserAction, ActionType } from '../models/UserAction';
import { PlayerType, PhaseType, EventType } from '../models/types';
import { LogEntry } from '../models/LogEntry';

/**
 * Manages the main game loop and coordinates all game systems
 */
export class GameLoop {
    private gameStateManager: GameStateManager;
    private actionProcessor: ActionProcessor;
    private gameUI: GameUI;
    private isRunning: boolean = false;
    private currentState: GameState;

    constructor() {
        this.gameStateManager = new GameStateManager();
        this.actionProcessor = new ActionProcessor(this.gameStateManager);
        
        // Initialize UI with action callback
        this.gameUI = new GameUI((action: UserAction) => {
            this.handleUserAction(action);
        });

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
     * Initializes the game and starts the main loop
     */
    public async start(): Promise<void> {
        try {
            this.isRunning = true;
            
            // Initialize a new game
            this.currentState = this.initializeNewGame();
            
            // Update UI with initial state
            this.gameUI.updateState(this.currentState);
            
            // Main game loop runs through callbacks now
            // The UI will trigger actions via handleUserAction
            
        } catch (error) {
            console.error('An error occurred in the game loop:', error);
            if (error instanceof Error) {
                this.shutdown(error);
            } else {
                this.shutdown(new Error(String(error)));
            }
        }
    }

    /**
     * Handles user actions from the UI
     */
    private handleUserAction(action: UserAction): void {
        try {
            if (this.currentState.gameOver || !this.isRunning) {
                return;
            }

            // Process the action
            this.currentState = this.actionProcessor.processAction(action);
            
            // If it's the Corp's turn after the action, process Corp's turn
            if (this.currentState.activePlayer === PlayerType.CORP) {
                this.processCorpTurn();
            }

            // Update UI with new state
            this.gameUI.updateState(this.currentState);

        } catch (error) {
            console.error('Error processing action:', error);
            // Display error in UI through game state
            this.currentState = {
                ...this.currentState,
                eventLog: [
                    ...this.currentState.eventLog,
                    {
                        message: `Error: ${error instanceof Error ? error.message : String(error)}`,
                        timestamp: new Date().toISOString(),
                        type: EventType.GAME
                    } as LogEntry
                ]
            };
            this.gameUI.updateState(this.currentState);
        }
    }

    /**
     * Processes the Corp's turn with AI
     */
    private processCorpTurn(): void {
        if (this.currentState.gameOver || !this.isRunning) {
            return;
        }

        // Get and process Corp actions until turn is complete
        while (this.currentState.activePlayer === PlayerType.CORP) {
            const corpAction = CorpAI.getNextAction(this.currentState);
            
            if (corpAction) {
                try {
                    this.currentState = this.actionProcessor.processAction(corpAction);
                    this.gameUI.updateState(this.currentState);
                } catch (error) {
                    console.error('Error during Corp action:', error);
                    break;
                }
            } else {
                // No more actions available, end Corp turn
                break;
            }
        }
    }

    /**
     * Initializes a new game state
     */
    private initializeNewGame(): GameState {
        return this.gameStateManager.setupGame();
    }

    /**
     * Cleans up and prepares for exit
     */
    private shutdown(error?: Error): void {
        this.isRunning = false;
        if (error) {
            this.currentState = {
                ...this.currentState,
                gameOver: true,
                eventLog: [
                    ...this.currentState.eventLog,
                    {
                        message: `Fatal Error: ${error.message}`,
                        timestamp: new Date().toISOString(),
                        type: EventType.GAME
                    } as LogEntry
                ]
            };
            this.gameUI.updateState(this.currentState);
        }
    }
} 