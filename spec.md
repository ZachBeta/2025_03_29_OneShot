# SLOP_RUNNER v0.1 - Developer Documentation

## Overview
SLOP_RUNNER is a cyberpunk card game that combines deck building with hacking mechanics. This document outlines the MVP/tutorial implementation.

## Tech Stack Requirements
- TypeScript for type safety and maintainability
- Node.js for the runtime environment
- ASCII art rendering for terminal-style UI

## Core Game Architecture

### 1. Game State Interface
```typescript
interface GameState {
  // Core game state
  turn: number;
  activePlayer: 'RUNNER' | 'CORP';
  phase: 'DRAW' | 'NPU' | 'MAIN' | 'COMBAT';
  
  // Player states
  runner: {
    deck: Card[];
    hand: Card[];
    field: Card[];
    npuAvailable: number;
    npuTotal: number;
  };
  
  corp: {
    core: {
      maxHp: number;
      currentHp: number;
    };
    deck: Card[];
    hand: Card[];
    field: Card[];
    npuAvailable: number;
    npuTotal: number;
  };
  
  // Event log
  eventLog: LogEntry[];
}

interface Card {
  id: string;
  name: string;
  type: 'NPU' | 'PROGRAM' | 'ICE';
  cost: number;
  power?: number;
  toughness?: number;
  ascii: string[];
  flavorText: string;
}

interface LogEntry {
  timestamp: string; // ISO8601
  message: string;
  type: 'GAME' | 'COMBAT' | 'CARD' | 'PHASE';
}
```

### 2. Core Systems

#### Game Loop
```typescript
class GameLoop {
  private state: GameState;
  
  // Main game loop
  async start() {
    await this.showTitleScreen();
    this.initializeGame();
    
    while (!this.isGameOver()) {
      await this.processTurn();
      this.switchActivePlayer();
    }
    
    await this.showGameOver();
  }
  
  private async processTurn() {
    await this.drawPhase();
    await this.npuPhase();
    await this.mainPhase();
    if (this.state.activePlayer === 'RUNNER') {
      await this.combatPhase();
    }
  }
}
```

#### Input Handler
```typescript
class InputHandler {
  // Key mappings
  private static readonly KEYS = {
    NUMBERS: ['1', '2', '3', '4', '5', '6', '7', '8', '9'],
    CONFIRM: 'Enter',
    NEXT_PHASE: 'Space',
    HELP: 'h',
    QUIT: 'q'
  };
  
  async getInput(): Promise<UserAction> {
    // Return standardized user action
  }
}
```

#### Renderer
```typescript
class AsciiRenderer {
  // Card template (13x17)
  private static readonly CARD_TEMPLATE = [
    '+---------------+',
    '|{NAME}    {COST}|',
    '|===============|',
    '|  ___[]___    |',
    '| |__   __|    |',
    '|    | |       |',
    '|    |_|       |',
    '|===============|',
    '|{FLAVOR_TEXT1} |',
    '|{FLAVOR_TEXT2} |',
    '|{FLAVOR_TEXT3} |',
    '|===============|',
    '|P/T: {P}/{T}  |',
    '+---------------+'
  ];

  render(state: GameState) {
    // Render game state to terminal
  }
}
```

## Tutorial Implementation

### Starting Decks

#### Runner Deck (30 cards)
- 10x NPU
- 3x Fracter (1/2, Cost: 1)
- 17x Empty slots for future expansion

#### Corp Deck (8 cards)
- 5x NPU
- 3x Barrier (1/1, Cost: 1)

### Game Flow

1. Title Screen
```
░█▀▀░█░░░█▀█░█▀█░░░█▀▄░█░█░█▀█░█▀█░█▀▀░█▀▄
░▀▀█░█░░░█░█░█▀▀░░░█▀▄░█░█░█░█░█░█░█▀▀░█▀▄
░▀▀▀░▀▀▀░▀▀▀░▀░░░░░▀░▀░▀▀▀░▀░▀░▀░▀░▀▀▀░▀░▀

        [Press ENTER to jack in]
        [Press H for help]
        [Press Q to quit]

        < SL0P_RUNNER v0.1-alpha >
        <<< UNDERGROUND BUILD >>>
        [[ NOT FOR DISTRIBUTION ]]
```

2. Game Initialize
   - Runner draws 7 cards
   - Corp draws 4 cards
   - Corp core set to 5 HP
   - Place 1 Barrier in Corp field

3. Turn Structure
   ```
   Runner Turn:
   1. Draw (1 card)
   2. NPU (play optional)
   3. Main (play cards)
   4. Combat (declare attacks)
   
   Corp Turn:
   1. Draw (1 card)
   2. NPU (play optional)
   3. Main (play ICE)
   ```

## Error Handling

```typescript
class GameError extends Error {
  constructor(
    message: string,
    public readonly type: 'INVALID_ACTION' | 'GAME_RULE' | 'SYSTEM'
  ) {
    super(message);
  }
}

// Example error handling
try {
  await gameAction();
} catch (error) {
  if (error instanceof GameError) {
    logEvent({
      timestamp: new Date().toISOString(),
      message: error.message,
      type: 'GAME'
    });
  }
}
```

## Testing Plan

1. Unit Tests
   - Card mechanics
   - Combat resolution
   - NPU management
   - Turn progression

2. Integration Tests
   - Full game loop
   - Win/loss conditions
   - Save/load state

3. UI Tests
   - Input handling
   - Display rendering
   - Event logging

## Implementation Steps

1. Core Framework
   ```bash
   npm init
   npm install typescript @types/node
   # Set up tsconfig.json
   ```

2. Basic Components
   - Create game state management
   - Implement input handling
   - Build ASCII renderer

3. Game Logic
   - Card mechanics
   - Combat system
   - Turn structure

4. UI/UX
   - Title screen
   - Game board
   - Event log

5. Testing
   - Unit test framework
   - Test scenarios
   - Integration tests

## Getting Started

1. Clone the repository
2. Install dependencies
3. Run the development server
4. Start with `src/index.ts`

```bash
git clone <repo>
cd slop_runner
npm install
npm run dev
```

## Next Steps

After implementing the tutorial:
1. Add more ICE types
2. Implement deck building
3. Add more complex card effects
4. Create campaign progression 