# HTML UI Tutorial for Card Game

This tutorial explains how to create an HTML-based user interface for our card game, integrating with the existing game state management system.

## 1. Basic Structure

First, we'll need to create an HTML structure that represents our game state:

```html
<!DOCTYPE html>
<html>
<head>
    <title>Card Game UI</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <div id="game-container">
        <!-- Corp Section -->
        <div id="corp-section">
            <div class="player-info">
                <h2>Corp</h2>
                <div class="core-hp">Core HP: <span id="corp-hp">5/5</span></div>
            </div>
            <div class="field" id="corp-field"></div>
            <div class="hand" id="corp-hand"></div>
        </div>

        <!-- Game Info Section -->
        <div id="game-info">
            <div class="phase">Phase: <span id="current-phase">DRAW</span></div>
            <div class="turn">Turn: <span id="turn-number">1</span></div>
            <div class="active-player">Active: <span id="active-player">RUNNER</span></div>
        </div>

        <!-- Runner Section -->
        <div id="runner-section">
            <div class="field" id="runner-field"></div>
            <div class="hand" id="runner-hand"></div>
            <div class="player-info">
                <h2>Runner</h2>
                <div class="npu">NPU: <span id="runner-npu">0/0</span></div>
            </div>
        </div>

        <!-- Action Buttons -->
        <div id="action-buttons">
            <button id="end-phase">End Phase</button>
            <button id="help">Help</button>
        </div>

        <!-- Event Log -->
        <div id="event-log"></div>
    </div>
    <script src="game-ui.ts"></script>
</body>
</html>
```

## 2. UI Component Class

Create a new TypeScript class to handle UI updates and interactions:

```typescript
// src/ui/GameUI.ts

import { GameState } from '../models/GameState';
import { UserAction, ActionType } from '../models/UserAction';
import { PlayerType, PhaseType } from '../models/types';

export class GameUI {
    private gameState: GameState;
    private actionCallback: (action: UserAction) => void;

    constructor(actionCallback: (action: UserAction) => void) {
        this.actionCallback = actionCallback;
        this.setupEventListeners();
    }

    private setupEventListeners() {
        // End Phase button
        document.getElementById('end-phase')?.addEventListener('click', () => {
            this.actionCallback({ type: ActionType.END_PHASE });
        });

        // Help button
        document.getElementById('help')?.addEventListener('click', () => {
            this.actionCallback({ type: ActionType.HELP });
        });
    }

    public updateState(newState: GameState) {
        this.gameState = newState;
        this.render();
    }

    private render() {
        // Update game info
        this.updateElement('current-phase', this.gameState.phase);
        this.updateElement('turn-number', this.gameState.turn.toString());
        this.updateElement('active-player', this.gameState.activePlayer);

        // Update Corp info
        this.updateElement('corp-hp', 
            `${this.gameState.corp.core.currentHp}/${this.gameState.corp.core.maxHp}`);

        // Update Runner info
        this.updateElement('runner-npu', 
            `${this.gameState.runner.npuAvailable}/${this.gameState.runner.npuTotal}`);

        // Render fields
        this.renderField('corp-field', this.gameState.corp.field);
        this.renderField('runner-field', this.gameState.runner.field);

        // Render hands (only show runner's hand)
        this.renderHand('runner-hand', this.gameState.runner.hand);
        this.renderHand('corp-hand', 
            this.gameState.corp.hand.map(() => ({ type: 'HIDDEN' })));

        // Update event log
        this.renderEventLog();
    }

    private renderField(elementId: string, cards: any[]) {
        const fieldElement = document.getElementById(elementId);
        if (!fieldElement) return;

        fieldElement.innerHTML = '';
        cards.forEach((card, index) => {
            const cardElement = this.createCardElement(card, index);
            if (this.gameState.activePlayer === PlayerType.RUNNER && 
                elementId === 'runner-field' && 
                this.gameState.phase === PhaseType.COMBAT) {
                cardElement.addEventListener('click', () => {
                    this.actionCallback({
                        type: ActionType.ATTACK,
                        payload: { programIndex: index }
                    });
                });
            }
            fieldElement.appendChild(cardElement);
        });
    }

    private renderHand(elementId: string, cards: any[]) {
        const handElement = document.getElementById(elementId);
        if (!handElement) return;

        handElement.innerHTML = '';
        cards.forEach((card, index) => {
            const cardElement = this.createCardElement(card, index);
            if (this.gameState.activePlayer === PlayerType.RUNNER && 
                elementId === 'runner-hand' && 
                this.gameState.phase === PhaseType.MAIN) {
                cardElement.addEventListener('click', () => {
                    this.actionCallback({
                        type: card.type === 'NPU' ? ActionType.PLAY_NPU : ActionType.PLAY_CARD,
                        payload: { cardIndex: index, cardType: card.type }
                    });
                });
            }
            handElement.appendChild(cardElement);
        });
    }

    private createCardElement(card: any, index: number): HTMLElement {
        const cardElement = document.createElement('div');
        cardElement.className = 'card';
        cardElement.dataset.index = index.toString();

        if (card.type === 'HIDDEN') {
            cardElement.classList.add('card-back');
        } else {
            cardElement.innerHTML = `
                <div class="card-name">${card.name}</div>
                <div class="card-type">${card.type}</div>
                ${card.power ? `<div class="card-power">Power: ${card.power}</div>` : ''}
            `;
        }

        return cardElement;
    }

    private renderEventLog() {
        const logElement = document.getElementById('event-log');
        if (!logElement) return;

        logElement.innerHTML = this.gameState.eventLog
            .slice(-5) // Show last 5 events
            .map(entry => `<div class="log-entry">${entry.message}</div>`)
            .join('');
    }

    private updateElement(elementId: string, value: string) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = value;
        }
    }
}
```

## 3. Styling

Create a CSS file to style the UI:

```css
/* styles.css */

#game-container {
    display: grid;
    grid-template-rows: auto auto auto;
    gap: 20px;
    padding: 20px;
    max-width: 1200px;
    margin: 0 auto;
}

.player-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px;
    background: #f0f0f0;
    border-radius: 5px;
}

.field, .hand {
    display: flex;
    gap: 10px;
    min-height: 150px;
    padding: 10px;
    background: #e0e0e0;
    border-radius: 5px;
}

.card {
    width: 100px;
    height: 140px;
    background: white;
    border: 1px solid #ccc;
    border-radius: 5px;
    padding: 5px;
    cursor: pointer;
    transition: transform 0.2s;
}

.card:hover {
    transform: translateY(-5px);
}

.card-back {
    background: #2c3e50;
}

#game-info {
    display: flex;
    justify-content: space-around;
    padding: 10px;
    background: #f8f9fa;
    border-radius: 5px;
}

#action-buttons {
    display: flex;
    gap: 10px;
    justify-content: center;
    margin: 20px 0;
}

button {
    padding: 10px 20px;
    border: none;
    border-radius: 5px;
    background: #007bff;
    color: white;
    cursor: pointer;
}

button:hover {
    background: #0056b3;
}

#event-log {
    height: 150px;
    overflow-y: auto;
    padding: 10px;
    background: #f8f9fa;
    border-radius: 5px;
}

.log-entry {
    padding: 5px;
    border-bottom: 1px solid #dee2e6;
}
```

## 4. Integration

Modify the `GameLoop` class to integrate with the UI:

```typescript
// src/systems/GameLoop.ts

import { GameUI } from '../ui/GameUI';

export class GameLoop {
    private gameUI: GameUI;

    constructor() {
        // ... existing initialization ...
        
        // Initialize UI
        this.gameUI = new GameUI((action) => {
            this.handleUserAction(action);
        });
    }

    private async handleUserAction(action: UserAction) {
        try {
            // Process the action
            this.currentState = this.actionProcessor.processAction(action);
            
            // Update UI
            this.gameUI.updateState(this.currentState);
            
            // Handle special actions
            if (action.type === ActionType.QUIT) {
                this.requestExit();
            }
        } catch (error) {
            // Display error in UI (you'll need to add error display functionality)
            console.error('Error processing action:', error);
        }
    }

    private updateDisplay(state: GameState) {
        this.gameUI.updateState(state);
    }
}
```

## 5. Usage

To implement this UI:

1. Create the HTML file and CSS file in your project
2. Create the new `GameUI` class
3. Modify the `GameLoop` class to use the UI
4. Initialize the game:

```typescript
// src/index.ts

import { GameLoop } from './systems/GameLoop';

document.addEventListener('DOMContentLoaded', () => {
    const game = new GameLoop();
    game.start();
});
```

## Features

This UI implementation provides:
- Visual representation of the game state
- Clickable cards in hand and field
- Phase and turn information
- Event log
- Core game actions (End Phase, Help)
- Corp and Runner state display
- Automatic updates when game state changes

The UI is designed to be responsive and provide visual feedback for user actions. It also maintains the game's rules by only allowing valid actions based on the current phase and active player. 