/**
 * Manager for handling game state mutations
 */

import { GameState, RunnerState, CorpState } from '../models/GameState';
import { Card } from '../models/Card';
import { PhaseType, PlayerType, EventType } from '../models/types';
import { LogEntry, createLogEntry } from '../models/LogEntry';
import { createRunnerStarterDeck, createCorpStarterDeck, shuffleDeck } from '../utils/CardFactory';

/**
 * Class responsible for managing the game state
 */
export class GameStateManager {
  /**
   * Creates a new instance of the game state manager
   * @param initialState - Optional initial state to use
   */
  constructor(private state: GameState = GameStateManager.createInitialState()) {}

  /**
   * Gets the current game state (immutable)
   * @returns The current game state
   */
  getState(): GameState {
    return { ...this.state };
  }

  /**
   * Creates an initial empty game state
   * @returns A new game state with default values
   */
  static createInitialState(): GameState {
    return {
      turn: 0,
      activePlayer: PlayerType.RUNNER,
      phase: PhaseType.DRAW,
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
          maxHp: 5,
          currentHp: 5
        }
      },
      eventLog: [],
      gameOver: false
    };
  }

  /**
   * Sets up the initial game state with shuffled decks
   * @returns The updated game state
   */
  setupGame(): GameState {
    // Create and shuffle runner deck
    const runnerDeck = shuffleDeck(createRunnerStarterDeck());
    
    // Create and shuffle corp deck
    const corpDeck = shuffleDeck(createCorpStarterDeck());
    
    // Update the state with new decks
    this.state = {
      ...this.state,
      turn: 1,
      runner: {
        ...this.state.runner,
        deck: runnerDeck,
      },
      corp: {
        ...this.state.corp,
        deck: corpDeck,
      },
      eventLog: [
        createLogEntry('Game started', EventType.GAME)
      ]
    };
    
    // Draw initial hands
    this.drawCards(PlayerType.RUNNER, 7);
    this.drawCards(PlayerType.CORP, 4);
    
    return this.getState();
  }

  /**
   * Draws cards from a player's deck to their hand
   * @param player - The player drawing cards
   * @param count - Number of cards to draw
   * @returns The updated game state
   */
  drawCards(player: PlayerType, count: number): GameState {
    const playerState = player === PlayerType.RUNNER ? this.state.runner : this.state.corp;
    
    // Check if there are enough cards
    const availableCards = Math.min(count, playerState.deck.length);
    
    if (availableCards === 0) {
      // No cards to draw - could be a loss condition
      this.logEvent(`${player} attempted to draw but has no cards left`, EventType.GAME);
      
      // Check if this is a loss condition
      if (count > 0) {
        this.checkWinCondition();
      }
      
      return this.getState();
    }
    
    // Draw the cards
    const drawnCards = playerState.deck.slice(0, availableCards);
    const remainingDeck = playerState.deck.slice(availableCards);
    
    // Update the player state
    if (player === PlayerType.RUNNER) {
      this.state.runner = {
        ...this.state.runner,
        deck: remainingDeck,
        hand: [...this.state.runner.hand, ...drawnCards]
      };
    } else {
      this.state.corp = {
        ...this.state.corp,
        deck: remainingDeck,
        hand: [...this.state.corp.hand, ...drawnCards]
      };
    }
    
    // Log the event
    this.logEvent(`${player} drew ${availableCards} card(s)`, EventType.GAME);
    
    return this.getState();
  }

  /**
   * Plays a card from a player's hand to their field
   * @param player - The player playing the card
   * @param cardIndex - Index of the card in the player's hand
   * @returns The updated game state
   */
  playCard(player: PlayerType, cardIndex: number): GameState {
    const playerState = player === PlayerType.RUNNER ? this.state.runner : this.state.corp;
    
    // Check if card index is valid
    if (cardIndex < 0 || cardIndex >= playerState.hand.length) {
      this.logEvent(`Invalid card index: ${cardIndex}`, EventType.GAME);
      return this.getState();
    }
    
    // Get the card
    const card = playerState.hand[cardIndex];
    
    // Check if player has enough NPU
    if (card.cost > playerState.npuAvailable) {
      this.logEvent(`Not enough NPU to play ${card.name}`, EventType.GAME);
      return this.getState();
    }
    
    // Remove the card from hand
    const newHand = [...playerState.hand];
    newHand.splice(cardIndex, 1);
    
    // Add the card to the field
    const newField = [...playerState.field, card];
    
    // Update NPU
    const newNpuAvailable = playerState.npuAvailable - card.cost;
    
    // Update player state
    if (player === PlayerType.RUNNER) {
      this.state.runner = {
        ...this.state.runner,
        hand: newHand,
        field: newField,
        npuAvailable: newNpuAvailable
      };
    } else {
      this.state.corp = {
        ...this.state.corp,
        hand: newHand,
        field: newField,
        npuAvailable: newNpuAvailable
      };
    }
    
    // Log the event
    this.logEvent(`${player} played ${card.name}`, EventType.CARD, { cardId: card.id });
    
    return this.getState();
  }

  /**
   * Updates a player's available NPU resources
   * @param player - The player to update
   * @param amount - The amount to add (positive) or subtract (negative)
   * @returns The updated game state
   */
  updateNpu(player: PlayerType, amount: number): GameState {
    if (player === PlayerType.RUNNER) {
      const newAvailable = this.state.runner.npuAvailable + amount;
      const newTotal = amount > 0 ? this.state.runner.npuTotal + amount : this.state.runner.npuTotal;
      
      this.state.runner = {
        ...this.state.runner,
        npuAvailable: newAvailable,
        npuTotal: newTotal
      };
    } else {
      const newAvailable = this.state.corp.npuAvailable + amount;
      const newTotal = amount > 0 ? this.state.corp.npuTotal + amount : this.state.corp.npuTotal;
      
      this.state.corp = {
        ...this.state.corp,
        npuAvailable: newAvailable,
        npuTotal: newTotal
      };
    }
    
    // Log the event
    if (amount > 0) {
      this.logEvent(`${player} gained ${amount} NPU`, EventType.GAME);
    } else {
      this.logEvent(`${player} spent ${-amount} NPU`, EventType.GAME);
    }
    
    return this.getState();
  }

  /**
   * Updates the Corp's core HP
   * @param amount - The amount to add (positive) or subtract (negative)
   * @returns The updated game state
   */
  updateCorpHp(amount: number): GameState {
    const newHp = Math.max(0, Math.min(this.state.corp.core.currentHp + amount, this.state.corp.core.maxHp));
    
    this.state.corp = {
      ...this.state.corp,
      core: {
        ...this.state.corp.core,
        currentHp: newHp
      }
    };
    
    // Log the event
    if (amount > 0) {
      this.logEvent(`Corp core repaired ${amount} HP`, EventType.GAME);
    } else {
      this.logEvent(`Corp core took ${-amount} damage`, EventType.COMBAT);
    }
    
    // Check if this is a win condition
    if (newHp === 0) {
      this.checkWinCondition();
    }
    
    return this.getState();
  }

  /**
   * Switches the active player
   * @returns The updated game state
   */
  switchActivePlayer(): GameState {
    const newActivePlayer = this.state.activePlayer === PlayerType.RUNNER 
      ? PlayerType.CORP 
      : PlayerType.RUNNER;
    
    this.state.activePlayer = newActivePlayer;
    this.logEvent(`${newActivePlayer}'s turn`, EventType.GAME);
    
    return this.getState();
  }

  /**
   * Advances to the next phase
   * @returns The updated game state
   */
  advancePhase(): GameState {
    let nextPhase: PhaseType;
    
    // Determine the next phase based on current phase and active player
    switch (this.state.phase) {
      case PhaseType.DRAW:
        nextPhase = PhaseType.NPU;
        break;
      case PhaseType.NPU:
        nextPhase = PhaseType.MAIN;
        break;
      case PhaseType.MAIN:
        // Combat phase only for Runner
        if (this.state.activePlayer === PlayerType.RUNNER) {
          nextPhase = PhaseType.COMBAT;
        } else {
          // Corp player goes from MAIN directly to DRAW and switches to Runner
          nextPhase = PhaseType.DRAW;
          this.switchActivePlayer();
          // Increment turn as the cycle completes
          this.state.turn += 1;
        }
        break;
      case PhaseType.COMBAT:
        nextPhase = PhaseType.DRAW;
        // Switch players after combat
        this.switchActivePlayer();
        break;
      default:
        nextPhase = PhaseType.DRAW;
    }
    
    this.state.phase = nextPhase;
    this.logEvent(`Phase changed to ${nextPhase}`, EventType.PHASE);
    
    return this.getState();
  }

  /**
   * Checks win conditions and updates game state if the game is over
   * @returns The updated game state
   */
  checkWinCondition(): GameState {
    // Check if Corp's core HP is 0
    if (this.state.corp.core.currentHp === 0) {
      this.state.gameOver = true;
      this.state.winner = PlayerType.RUNNER;
      this.logEvent('Runner wins by reducing Corp core to 0', EventType.GAME);
      return this.getState();
    }
    
    // Check if Runner has no cards left to draw when required
    if (this.state.runner.deck.length === 0 && this.state.phase === PhaseType.DRAW) {
      this.state.gameOver = true;
      this.state.winner = PlayerType.CORP;
      this.logEvent('Corp wins by depleting Runner\'s deck', EventType.GAME);
      return this.getState();
    }
    
    return this.getState();
  }

  /**
   * Adds a log entry to the game event log
   * @param message - The message for the log entry
   * @param type - The type of event
   * @param metadata - Optional metadata for the event
   * @returns The updated game state
   */
  logEvent(message: string, type: EventType, metadata?: Record<string, unknown>): GameState {
    const logEntry = createLogEntry(message, type, metadata);
    this.state.eventLog = [...this.state.eventLog, logEntry];
    return this.getState();
  }
} 