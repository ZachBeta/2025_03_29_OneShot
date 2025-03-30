Okay, let's refactor the core game flow logic to make it feel more like a traditional card game turn structure.

The main changes involve:

1.  **Consolidating State Logic:** Moving the primary responsibility for phase and turn management *into* `GameStateManager`. This centralizes state transitions.
2.  **Simplifying Managers:** Removing `TurnManager` as its logic is merged into `GameStateManager`. Simplifying `PhaseManager` to primarily check action validity based on phase.
3.  **Refining `GameStateManager`:** Adding methods to handle phase transitions, turn start/end, and ensuring win conditions are checked at the right moments (e.g., decking out during draw, HP reaching zero).
4.  **Adjusting `GameLoop`:** Making the main loop rely on `GameStateManager` for advancing the game state and handling player/AI actions based on the current state.
5.  **Adjusting `ActionProcessor`:** Ensuring the `END_PHASE` action correctly triggers the phase advancement in `GameStateManager`.

Here are the diffs for the necessary files:

---

**1. `src/systems/GameStateManager.ts`**

*   **Changes:** Added methods for phase/turn management (`advancePhase`, `executePhaseEntryActions`, `startTurn`, `endTurn`), integrated win condition checks more closely with state changes, and refined `setupGame`. Removed reliance on external `PhaseManager` and `TurnManager` for state transitions.

```diff
--- a/src/systems/GameStateManager.ts
+++ b/src/systems/GameStateManager.ts
@@ -1,8 +1,9 @@
 /**
  * Manager for handling game state mutations
  */
-
+ 
 import { GameState, RunnerState, CorpState } from '../models/GameState';
-import { Card } from '../models/Card';
+import { Card, isNpuCard } from '../models/Card'; // Added isNpuCard
 import { PhaseType, PlayerType, EventType } from '../models/types';
 import { LogEntry, createLogEntry } from '../models/LogEntry';
 import { createRunnerStarterDeck, createCorpStarterDeck, shuffleDeck } from '../utils/CardFactory';
@@ -10,6 +11,16 @@
 /**
  * Class responsible for managing the game state
  */
+
+/**
+ * Custom error for Game State operations
+ */
+export class GameStateError extends Error {
+  constructor(message: string) {
+    super(message);
+    this.name = 'GameStateError';
+  }
+}
 export class GameStateManager {
   /**
    * Creates a new instance of the game state manager
@@ -81,10 +92,11 @@
     this.state = {
       ...this.state,
       turn: 1,
+      activePlayer: PlayerType.RUNNER, // Runner starts
+      phase: PhaseType.DRAW, // Start with DRAW phase
       runner: {
         ...this.state.runner,
         deck: runnerDeck,
-      },
-      corp: {
         ...this.state.corp,
         deck: corpDeck,
       },
@@ -94,10 +106,8 @@
       ]
     };
-    
-    // Draw initial hands
-    this.drawCards(PlayerType.RUNNER, 7);
-    this.drawCards(PlayerType.CORP, 4);
-    
+
+    // Execute initial phase actions (draw, refresh NPU)
+    this.executePhaseEntryActions();
     return this.getState();
   }
-
@@ -113,18 +123,16 @@
   drawCards(player: PlayerType, count: number): GameState {
     const playerState = player === PlayerType.RUNNER ? this.state.runner : this.state.corp;
-    
-    // Check if there are enough cards
-    const availableCards = Math.min(count, playerState.deck.length);
-    
-    if (availableCards === 0) {
-      // No cards to draw - could be a loss condition
-      this.logEvent(`${player} attempted to draw but has no cards left`, EventType.GAME);
-      
-      // Check if this is a loss condition
-      if (count > 0) {
+
+    for (let i = 0; i < count; i++) {
+      // Check if deck is empty BEFORE trying to draw
+      if (playerState.deck.length === 0) {
+        // Loss condition: attempting to draw from an empty deck
+        this.logEvent(`${player} deck empty! Attempted to draw.`, EventType.GAME);
+        this.state.gameOver = true;
+        this.state.winner = player === PlayerType.RUNNER ? PlayerType.CORP : PlayerType.RUNNER;
+        this.logEvent(`${this.state.winner} wins!`, EventType.GAME);
         this.checkWinCondition(); // Update state based on win condition
-      }
-      
-      return this.getState();
+        break; // Stop drawing
+      }
+
+      // Draw the card
+      const drawnCard = playerState.deck[0];
+      const remainingDeck = playerState.deck.slice(1);
+
+      // Update the player state immediately within the loop
+      if (player === PlayerType.RUNNER) {
+        this.state.runner = {
+          ...this.state.runner,
+          deck: remainingDeck,
+          hand: [...this.state.runner.hand, drawnCard]
+        };
+      } else {
+        this.state.corp = {
+          ...this.state.corp,
+          deck: remainingDeck,
+          hand: [...this.state.corp.hand, drawnCard]
+        };
+      }
+      this.logEvent(`${player} drew a card (${drawnCard.name})`, EventType.CARD, { cardId: drawnCard.id });
     }
-    
-    // Draw the cards
-    const drawnCards = playerState.deck.slice(0, availableCards);
-    const remainingDeck = playerState.deck.slice(availableCards);
-    
-    // Update the player state
-    if (player === PlayerType.RUNNER) {
-      this.state.runner = {
-        ...this.state.runner,
-        deck: remainingDeck,
-        hand: [...this.state.runner.hand, ...drawnCards]
-      };
-    } else {
-      this.state.corp = {
-        ...this.state.corp,
-        deck: remainingDeck,
-        hand: [...this.state.corp.hand, ...drawnCards]
-      };
-    }
-    
-    // Log the event
-    this.logEvent(`${player} drew ${availableCards} card(s)`, EventType.GAME);
-    
     return this.getState();
   }
-
@@ -141,19 +149,18 @@
     const playerState = player === PlayerType.RUNNER ? this.state.runner : this.state.corp;
-    
+
     // Check if card index is valid
     if (cardIndex < 0 || cardIndex >= playerState.hand.length) {
-      this.logEvent(`Invalid card index: ${cardIndex}`, EventType.GAME);
-      return this.getState();
+      throw new GameStateError(`Invalid card index: ${cardIndex}`);
     }
-    
+
     // Get the card
     const card = playerState.hand[cardIndex];
-    
+
     // Check if player has enough NPU
     if (card.cost > playerState.npuAvailable) {
-      this.logEvent(`Not enough NPU to play ${card.name}`, EventType.GAME);
-      return this.getState();
+      throw new GameStateError(`Not enough NPU to play ${card.name}. Cost: ${card.cost}, Available: ${playerState.npuAvailable}`);
     }
-    
+
     // Remove the card from hand
     const newHand = [...playerState.hand];
     newHand.splice(cardIndex, 1);
@@ -161,10 +168,13 @@
     // Add the card to the field
     const newField = [...playerState.field, card];
-    
+
     // Update NPU
     const newNpuAvailable = playerState.npuAvailable - card.cost;
-    
+
+    // If it's an NPU card, also increase total NPU
+    const newNpuTotal = isNpuCard(card) ? playerState.npuTotal + 1 : playerState.npuTotal;
+
     // Update player state
     if (player === PlayerType.RUNNER) {
       this.state.runner = {
@@ -172,7 +182,8 @@
         hand: newHand,
         field: newField,
         npuAvailable: newNpuAvailable
+        npuTotal: newNpuTotal // Update total if NPU card played
       };
     } else {
       this.state.corp = {
@@ -180,12 +191,13 @@
         hand: newHand,
         field: newField,
         npuAvailable: newNpuAvailable
+        npuTotal: newNpuTotal // Update total if NPU card played
       };
     }
-    
+
     // Log the event
-    this.logEvent(`${player} played ${card.name}`, EventType.CARD, { cardId: card.id });
-    
+    this.logEvent(`${player} played ${card.name} (Cost: ${card.cost})`, EventType.CARD, { cardId: card.id });
+
     return this.getState();
   }
-
@@ -200,7 +212,7 @@
    */
   updateNpu(player: PlayerType, amount: number): GameState {
     if (player === PlayerType.RUNNER) {
-      const newAvailable = this.state.runner.npuAvailable + amount;
+      const newAvailable = Math.max(0, this.state.runner.npuAvailable + amount); // Cannot go below 0
       const newTotal = amount > 0 ? this.state.runner.npuTotal + amount : this.state.runner.npuTotal;
-      
+
       this.state.runner = {
         ...this.state.runner,
         npuAvailable: newAvailable,
@@ -208,17 +220,17 @@
       };
     } else {
       const newAvailable = this.state.corp.npuAvailable + amount;
+      const newAvailable = Math.max(0, this.state.corp.npuAvailable + amount); // Cannot go below 0
       const newTotal = amount > 0 ? this.state.corp.npuTotal + amount : this.state.corp.npuTotal;
-      
+
       this.state.corp = {
         ...this.state.corp,
         npuAvailable: newAvailable,
         npuTotal: newTotal
       };
     }
-    
+
     // Log the event
     if (amount > 0) {
       this.logEvent(`${player} gained ${amount} NPU`, EventType.GAME);
@@ -226,10 +238,9 @@
       this.logEvent(`${player} spent ${-amount} NPU`, EventType.GAME);
     }
-    
+
     return this.getState();
   }
-
@@ -242,7 +253,7 @@
    */
   updateCorpHp(amount: number): GameState {
     const newHp = Math.max(0, Math.min(this.state.corp.core.currentHp + amount, this.state.corp.core.maxHp));
-    
+
     this.state.corp = {
       ...this.state.corp,
       core: {
@@ -251,7 +262,7 @@
         currentHp: newHp
       }
     };
-    
+
     // Log the event
     if (amount > 0) {
       this.logEvent(`Corp core repaired ${amount} HP`, EventType.GAME);
@@ -259,31 +270,34 @@
       this.logEvent(`Corp core took ${-amount} damage`, EventType.COMBAT);
     }
-    
+
     // Check if this is a win condition
-    if (newHp === 0) {
-      this.checkWinCondition();
+    if (newHp <= 0) {
+      this.state.gameOver = true;
+      this.state.winner = PlayerType.RUNNER;
+      this.logEvent(`Runner wins! Corp core HP reached 0.`, EventType.GAME);
     }
-    
+
     return this.getState();
   }
-
+ 
   /**
    * Switches the active player
    * @returns The updated game state
    */
-   switchActivePlayer(): GameState {
-     const newActivePlayer = this.state.activePlayer === PlayerType.RUNNER 
+   private switchActivePlayer(): GameState {
+     const newActivePlayer = this.state.activePlayer === PlayerType.RUNNER
        ? PlayerType.CORP 
        : PlayerType.RUNNER;
-     
-     this.state.activePlayer = newActivePlayer;
-     this.logEvent(`${newActivePlayer}'s turn`, EventType.GAME);
-     
+
+     // Update state directly
+     this.state = {
+        ...this.state,
+        activePlayer: newActivePlayer
+     };
+     this.logEvent(`Switching turn to ${newActivePlayer}`, EventType.GAME);
      return this.getState();
    }
-
@@ -293,8 +307,48 @@
     * @returns The updated game state
     */
   advancePhase(): GameState {
+    const { phase, activePlayer } = this.state;
     let nextPhase: PhaseType;
-    
+    let switchPlayers = false;
+    let incrementTurn = false;
+
+    switch (phase) {
+      case PhaseType.DRAW:
+        nextPhase = PhaseType.NPU;
+        break;
+      case PhaseType.NPU:
+        nextPhase = PhaseType.MAIN;
+        break;
+      case PhaseType.MAIN:
+        if (activePlayer === PlayerType.RUNNER) {
+          nextPhase = PhaseType.COMBAT;
+        } else { // Corp turn
+          nextPhase = PhaseType.DRAW; // Skip combat
+          switchPlayers = true;
+          incrementTurn = true; // Increment turn when Corp finishes main phase
+        }
+        break;
+      case PhaseType.COMBAT: // Only Runner reaches here
+        nextPhase = PhaseType.DRAW;
+        switchPlayers = true;
+        break;
+      default:
+        throw new GameStateError(`Invalid current phase: ${phase}`);
+    }
+
+    // Update the state
+    this.state = {
+      ...this.state,
+      phase: nextPhase,
+      turn: incrementTurn ? this.state.turn + 1 : this.state.turn,
+    };
+
+    if (switchPlayers) {
+        this.switchActivePlayer(); // This also logs the turn switch
+    }
+
+    this.logEvent(`${this.state.activePlayer} starting ${nextPhase} phase`, EventType.PHASE);
+    this.executePhaseEntryActions(); // Perform actions for the *new* phase
+    /*
     // Determine the next phase based on current phase and active player
     switch (this.state.phase) {
       case PhaseType.DRAW:
@@ -327,11 +381,55 @@
     this.state.phase = nextPhase;
     this.logEvent(`Phase changed to ${nextPhase}`, EventType.PHASE);
-    
+    */
+    return this.getState();
+  }
+
+  /**
+   * Executes automatic actions upon entering a phase (e.g., draw, refresh NPU)
+   */
+  private executePhaseEntryActions(): GameState {
+    const { phase, activePlayer } = this.state;
+
+    switch (phase) {
+      case PhaseType.DRAW:
+        this.drawCards(activePlayer, 1); // Draw 1 card
+        break;
+      case PhaseType.NPU:
+        // Refresh NPU to total
+        if (activePlayer === PlayerType.RUNNER) {
+          this.state = {
+            ...this.state,
+            runner: { ...this.state.runner, npuAvailable: this.state.runner.npuTotal }
+          };
+          this.logEvent(`Runner NPU refreshed to ${this.state.runner.npuTotal}`, EventType.GAME);
+        } else {
+          this.state = {
+            ...this.state,
+            corp: { ...this.state.corp, npuAvailable: this.state.corp.npuTotal }
+          };
+          this.logEvent(`Corp NPU refreshed to ${this.state.corp.npuTotal}`, EventType.GAME);
+        }
+        break;
+      // MAIN and COMBAT have no automatic entry actions in this version
+      case PhaseType.MAIN:
+      case PhaseType.COMBAT:
+        break;
+    }
     return this.getState();
   }
 
+
+  /**
+  * Starts a new turn. Called usually by ending the previous turn.
+  * Resets phase to DRAW and triggers phase entry actions.
+  */
+  startTurn(): GameState {
+      this.state = { ...this.state, phase: PhaseType.DRAW };
+      this.logEvent(`Starting Turn ${this.state.turn} for ${this.state.activePlayer}`, EventType.GAME);
+      return this.executePhaseEntryActions();
+  }
+
   /**
    * Checks win conditions and updates game state if the game is over
    * @returns The updated game state
@@ -340,24 +438,19 @@
     // Check if Corp's core HP is 0
     if (this.state.corp.core.currentHp <= 0) {
       this.state.gameOver = true;
-      this.state.winner = PlayerType.RUNNER;
-      this.logEvent('Runner wins by reducing Corp core to 0', EventType.GAME);
-      return this.getState();
+      if (!this.state.winner) { // Ensure winner is set only once
+          this.state.winner = PlayerType.RUNNER;
+          this.logEvent('Runner wins! Corp core destroyed.', EventType.GAME);
+      }
     }
-    
+
     // Check if Runner has no cards left to draw when required
-    if (this.state.runner.deck.length === 0 && this.state.phase === PhaseType.DRAW) {
-      this.state.gameOver = true;
-      this.state.winner = PlayerType.CORP;
-      this.logEvent('Corp wins by depleting Runner\'s deck', EventType.GAME);
-      return this.getState();
-    }
-    
+    // (Loss condition is now handled directly in drawCards)
+
     return this.getState();
   }
 
-   /**
+  /**
    * Adds a log entry to the game event log
    * @param message - The message for the log entry
    * @param type - The type of event
@@ -366,7 +459,11 @@
    */
   logEvent(message: string, type: EventType, metadata?: Record<string, unknown>): GameState {
     const logEntry = createLogEntry(message, type, metadata);
+    // Keep only the last N entries (e.g., 50) to prevent memory issues
+    const MAX_LOG_ENTRIES = 50;
     this.state.eventLog = [...this.state.eventLog, logEntry];
+    if (this.state.eventLog.length > MAX_LOG_ENTRIES) {
+      this.state.eventLog = this.state.eventLog.slice(-MAX_LOG_ENTRIES);
+    }
     return this.getState();
   }
 } 

```

---

**2. `src/systems/PhaseManager.ts`**

*   **Changes:** Removed methods (`getNextPhase`, `advancePhase`, `executePhaseEntryActions`, `setupNewGame`, `drawCards`, `executeDraw`, `executeNPU`) that were moved to `GameStateManager`. Kept `isActionAllowed` as a utility function.

```diff
--- a/src/systems/PhaseManager.ts
+++ b/src/systems/PhaseManager.ts
@@ -2,7 +2,7 @@
 import { GameState } from '../models/GameState';
 import { PlayerType, PhaseType, EventType } from '../models/types';
 import { createLogEntry } from '../models/LogEntry';
-import { createRunnerStarterDeck, createCorpStarterDeck } from '../utils/CardFactory';
+// import { createRunnerStarterDeck, createCorpStarterDeck } from '../utils/CardFactory'; // No longer needed here
 
 /**
  * Custom error for phase-related operations
@@ -20,6 +20,7 @@
  * Manages game phases and turn transitions
  */
 export class PhaseManager {
+  /* // Logic moved to GameStateManager
   /**
    * Gets the next phase in the sequence
    */
@@ -36,7 +37,7 @@
    * Advances the game to the next phase
    */
   public static advancePhase(gameState: GameState): GameState {
-    const currentPhase = gameState.phase;
     const activePlayer = gameState.activePlayer;
-    
+
     let nextPhase = this.getNextPhase(currentPhase);
     let newActivePlayer = activePlayer;
-    
+
     // Corp skips combat phase, and we switch to Runner's draw phase
     if (activePlayer === PlayerType.CORP && nextPhase === PhaseType.COMBAT) {
       nextPhase = PhaseType.DRAW;
       newActivePlayer = PlayerType.RUNNER;
     }
-    
+
     // Runner ends turn after combat, we switch to Corp's draw phase
     if (activePlayer === PlayerType.RUNNER && currentPhase === PhaseType.COMBAT) {
       newActivePlayer = PlayerType.CORP;
     }
-    
+
     // Create new state with updated phase and active player
     const newState: GameState = {
       ...gameState,
@@ -61,7 +62,7 @@
     // Execute phase entry actions
     return this.executePhaseEntryActions(newState);
   }
-  
+
   /**
    * Executes automatic actions upon entering a phase
    */
@@ -87,10 +88,10 @@
         return gameState;
     }
   }
-  
+
   /**
    * Executes the Draw phase logic (draw cards)
    */
@@ -103,10 +104,10 @@
     // Determine how many cards to draw
     const cardsToDraw = 1; // Default to 1 card per turn
-    
+
     if (activePlayer === PlayerType.RUNNER) {
       // Draw cards for Runner
-      return this.drawCards(gameState, activePlayer, cardsToDraw);
     } else {
       // Draw cards for Corp
       return this.drawCards(gameState, activePlayer, cardsToDraw);
@@ -146,10 +147,10 @@
         ]
       };
       return newState;
-    } else {
+    } else { // Corp player
       // Calculate new NPU for Corp (all NPU is refreshed each turn)
       const newState: GameState = {
         ...gameState,
@@ -173,7 +174,7 @@
    * Helper method to draw cards for a player
    */
   private static drawCards(gameState: GameState, player: PlayerType, count: number): GameState {
-    let newState = { ...gameState };
+    let newState = { ...gameState }; // Create a new object to avoid direct mutation
-    
+
     // Draw cards one at a time, updating the state each time
     for (let i = 0; i < count; i++) {
       if (player === PlayerType.RUNNER) {
@@ -194,7 +195,7 @@
199 |           ...newState.runner,
200 |           deck: remainingDeck,
201 |           hand: [...newState.runner.hand, drawnCard]
-          },
+          },
202 |         eventLog: [
203 |           ...newState.eventLog,
204 |           createLogEntry(
205 |             `Runner drew a card (${drawnCard.name})`,
206 |             EventType.CARD,
207 |             { player: PlayerType.RUNNER, cardId: drawnCard.id }
208 |           )
209 |         ]
210 |       };
211 |     } else {
212 |       // Check if Corp deck is empty
213 |       if (newState.corp.deck.length === 0) {
214 |         newState = {
215 |           ...newState,
216 |           eventLog: [
217 |             ...newState.eventLog,
218 |             createLogEntry(
219 |               'Corp deck is empty, cannot draw more cards',
220 |               EventType.GAME,
221 |               { player: PlayerType.CORP }
222 |             )
223 |           ]
224 |         };
225 |         break;
226 |       }
227 |       
228 |       // Draw a card for Corp
229 |       const [drawnCard, ...remainingDeck] = newState.corp.deck;
230 |       newState = {
231 |         ...newState,
232 |         corp: {
233 |           ...newState.corp,
234 |           deck: remainingDeck,
235 |           hand: [...newState.corp.hand, drawnCard]
236 |         },
237 |         eventLog: [
238 |           ...newState.eventLog,
239 |           createLogEntry(
240 |             `Corp drew a card (${drawnCard.name})`,
241 |             EventType.CARD,
242 |             { player: PlayerType.CORP, cardId: drawnCard.id }
243 |           )
244 |         ]
245 |       };
246 |     }
247 |   }
248 |   
249 |   return newState;
250 | }
251 | */ // End of moved logic
   
   /**
    * Checks if an action is allowed in the current phase
288 | }
289 | 
290 | /**
291 |  * Creates a new game state with initialized decks and initial phase setup
292 |  * Logic moved to GameStateManager.setupGame
293 |  */
294 | /* // Logic moved to GameStateManager
295 | public static setupNewGame(): GameState {
296 |   // Create initial game state
297 |   const initialState: GameState = {
298 |     turn: 1,
299 |     phase: PhaseType.DRAW,
300 |     activePlayer: PlayerType.RUNNER, // Runner goes first
301 |     gameOver: false,
302 |     winner: undefined,
303 |     runner: {
304 |       deck: createRunnerStarterDeck(),
305 |       hand: [],
306 |       field: [],
307 |       npuAvailable: 0,
308 |       npuTotal: 0
309 |     },
310 |     corp: {
311 |       deck: createCorpStarterDeck(),
312 |       hand: [],
313 |       field: [],
314 |       npuAvailable: 0,
315 |       npuTotal: 0,
316 |       core: {
317 |         maxHp: 10,
318 |         currentHp: 10
319 |       }
320 |     },
321 |     eventLog: [
322 |       createLogEntry('Game started - Runner\'s turn', EventType.GAME, {})
323 |     ]
324 |   };
325 |   
326 |   // Execute Draw phase to get initial cards
327 |   const afterDrawState = this.executeDraw(initialState);
328 |   
329 |   // Move to NPU phase
330 |   return this.advancePhase(afterDrawState);
331 | }
332 | */ // End of moved logic
333 | } 

```

---

**3. `src/systems/TurnManager.ts`**

*   **Changes:** Delete this file entirely. Its functionality is now handled by `GameStateManager`.

---

**4. `src/systems/GameLoop.ts`**

*   **Changes:** Removed imports and usage of `PhaseManager` and `TurnManager`. The loop now relies on `GameStateManager.advancePhase` (called via `ActionProcessor` when `END_PHASE` is processed) to manage state transitions. Simplified the `processCorpTurn` loop.

```diff
--- a/src/systems/GameLoop.ts
+++ b/src/systems/GameLoop.ts
@@ -2,9 +2,7 @@
 import { GameState } from '../models/GameState';
 import { GameStateManager } from './GameStateManager';
 import { InputHandler } from './InputHandler';
-import { ActionProcessor } from './ActionProcessor';
-import { PhaseManager } from './PhaseManager';
-import { TurnManager } from './TurnManager';
+import { ActionProcessor, GameError } from './ActionProcessor'; // Added GameError
+// Removed PhaseManager, TurnManager
 import { CorpAI } from './CorpAI';
 import { InteractiveGameBoard } from '../ui/InteractiveGameBoard';
 import { EventLogRenderer } from '../ui/EventLogRenderer';
@@ -90,9 +88,9 @@
    * Initializes the game and shows the title screen
    */
   public async start(): Promise<void> {
-    try {
       this.isRunning = true;
       
+    try { // Added try block here to wrap the entire game execution
       // Display title screen and wait for input
       await this.showTitleScreen();
       
@@ -105,7 +103,12 @@
       this.createAutosave();
       
       // Main game loop
-      while (this.isRunning && !this.currentState.gameOver && !this.exitRequested) {
+      while (this.isRunning && !this.exitRequested) {
+        // Update current state from manager before each iteration
+        this.currentState = this.gameStateManager.getState();
+        if (this.currentState.gameOver) {
+          break; // Exit loop immediately if game is over
+        }
         // Refresh the display
         this.updateDisplay(this.currentState);
         
@@ -113,12 +116,7 @@
         await this.processTurn();
         
         // Check for game over condition
-        if (this.currentState.gameOver) {
-          await this.showGameOverScreen();
-          break;
-        }
-        
-        // Create autosave at the end of each turn
+        // (Win condition check is now inside GameStateManager)
+
         this.createAutosave();
       }
       
@@ -127,7 +125,9 @@
       
     } catch (error) {
       console.error('An error occurred in the game loop:', error);
+      this.gameBoard.setStatusMessage(`FATAL ERROR: ${error instanceof Error ? error.message : String(error)}`);
       this.shutdown();
+      process.exit(1); // Exit with error code
     }
   }
   
@@ -183,10 +183,11 @@
      * Processes a single turn in the game
      */
    private async processTurn(): Promise<void> {
+     this.currentState = this.gameStateManager.getState(); // Ensure we have the latest state
      const isRunnerTurn = this.currentState.activePlayer === PlayerType.RUNNER;
      
      if (isRunnerTurn) {
-       await this.processRunnerTurn();
+       await this.processRunnerTurn(); // Runner waits for input
      } else {
        this.processCorpTurn();
      }
@@ -234,8 +235,11 @@
       
       // Process regular game actions
       try {
-        this.actionProcessor.processAction(userAction);
+        // Process the action, which might change the state (including phase/turn)
+        this.gameStateManager = new GameStateManager(this.actionProcessor.processAction(userAction));
+        this.currentState = this.gameStateManager.getState(); // Update local state ref
         this.gameBoard.refreshDisplay(this.currentState);
-      } catch (error) {
+      } catch (error) { // Catch GameErrors specifically
         // Display error message
         const errorMessage = error instanceof Error ? error.message : String(error);
         this.gameBoard.setStatusMessage(`Error: ${errorMessage}`);
@@ -252,13 +256,13 @@
    * Processes the Corp's turn with AI
    */
   private processCorpTurn(): void {
-    let turnComplete = false;
+    // Corp turn is simpler now - AI makes one decision per loop iteration until it decides to EndPhase
     
     this.showMessage("Corp's turn...");
     
     // Provide a brief delay for player to see turn change
     this.delay(GameLoop.CORP_TURN_DELAY);
-    
+    /* // Old complex loop removed
     while (!turnComplete && !this.currentState.gameOver) {
       // Get next action from Corp AI
       const corpAction = CorpAI.getNextAction(this.currentState);
@@ -285,7 +289,7 @@
         }
       }
     }
+    */
+    // Get AI action
+    const corpAction = CorpAI.getNextAction(this.currentState);
+    if (corpAction) {
+        try {
+            // Convert legacy UserAction if needed
+            const action = this.convertLegacyAction(corpAction);
+            // Process the action. If it's EndPhase, GameStateManager will handle advancing state.
+            this.gameStateManager = new GameStateManager(this.actionProcessor.processAction(action));
+            this.currentState = this.gameStateManager.getState();
+            this.updateDisplay(this.currentState);
+            this.delay(GameLoop.CORP_ACTION_DELAY); // Small delay between actions
+        } catch (error) {
+            console.error('Error during Corp action:', error);
+            this.gameBoard.setStatusMessage(`Corp AI Error: ${error instanceof Error ? error.message : String(error)}`);
+            this.gameBoard.refreshDisplay(this.currentState);
+            this.delay(GameLoop.ERROR_ACK_DELAY);
+            // If AI errors, force end phase to prevent infinite loop
+            this.gameStateManager = new GameStateManager(this.actionProcessor.processAction({ type: ActionType.END_PHASE }));
+            this.currentState = this.gameStateManager.getState();
+        }
+    } else {
+      // If AI returns null (shouldn't happen in normal flow unless blocking), default to ending phase
+      this.gameStateManager = new GameStateManager(this.actionProcessor.processAction({ type: ActionType.END_PHASE }));
+      this.currentState = this.gameStateManager.getState();
+    }
   }
   
   /**
@@ -518,6 +522,7 @@
       this.gameBoard.refreshDisplay(this.currentState);
       this.currentState.eventLog.push(
         createLogEntry(`Game loaded from ${filename}`, EventType.GAME)
+        // Note: GameStateManager's log is replaced on load, so log to the *new* state's log
       );
     } catch (error) {
       console.error(`Error loading game: ${error instanceof Error ? error.message : String(error)}`);

```

---

**5. `src/systems/ActionProcessor.ts`**

*   **Changes:** Modified the `END_PHASE` case to call `gameStateManager.advancePhase()`.

```diff
--- a/src/systems/ActionProcessor.ts
+++ b/src/systems/ActionProcessor.ts
@@ -50,7 +50,7 @@
         return this.processAttack(action);
         
       case ActionType.END_PHASE:
-        return this.processEndPhase();
+        return this.gameStateManager.advancePhase(); // Call advancePhase on manager
         
       case ActionType.HELP:
         // Help doesn't change game state, just return current
@@ -181,10 +181,4 @@
     return this.gameStateManager.updateCorpHp(-attackPower);
   }
   
-  /**
-   * Processes an END_PHASE action
-   */
-  private processEndPhase(): GameState {
-    return this.gameStateManager.advancePhase();
-  }
 } 

```

---

**Summary of Changes:**

*   `GameStateManager` is now the central authority for game state transitions, including phase advancement, turn switching, drawing cards, spending resources, and checking win conditions.
*   `PhaseManager` is simplified, mostly acting as a helper for checking action validity within a phase.
*   `TurnManager` is removed entirely.
*   `GameLoop` interacts primarily with `GameStateManager` to get the current state and `ActionProcessor` to apply actions. It's simpler and driven by the state managed within `GameStateManager`.
*   The overall flow now more closely resembles a standard card game: start turn -> draw -> refresh resources -> main actions -> combat (if Runner) -> end turn -> check win -> switch player -> repeat.

After applying these diffs, the game's internal logic for managing turns and phases should align better with the feel of a typical card game. Remember to delete the `src/systems/TurnManager.ts` and `src/systems/TurnManager.test.ts` files.