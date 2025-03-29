# SLOP_RUNNER Implementation Blueprint

## Project Structure and Planning

### High-Level Structure

I'll break down the SLOP_RUNNER implementation into a series of progressive steps, each building on the previous ones in a test-driven approach. The blueprint follows this structure:

1. **Project Setup & Core Models**
2. **Game State Management**
3. **Basic Rendering**
4. **User Input Handling**
5. **Card Mechanics**
6. **Turn & Phase Implementation**
7. **Combat System**
8. **AI for Corp Actions**
9. **UI Refinement**
10. **Final Integration & Polish**

### Detailed Implementation Steps

Let's break each of these down into smaller, manageable chunks:

## Implementation Prompts

### Phase 1: Project Setup & Core Models

#### Prompt 1: Project Initialization
```
Create the initial project structure for SLOP_RUNNER, a terminal-based cyberpunk card game. Set up a TypeScript Node.js project with the following:

1. Initialize a new npm project with appropriate package.json
2. Configure TypeScript with tsconfig.json
3. Set up Jest for testing
4. Create the basic directory structure:
   - src/
     - models/
     - systems/
     - ui/
     - utils/
   - tests/

Create a simple entry point (src/index.ts) that logs "SLOP_RUNNER initializing..." to verify setup.

Write a basic test to ensure the environment is working correctly.

Use best practices for TypeScript configuration and project structure.
```

#### Prompt 2: Core Data Models
```
Implement the core data models for SLOP_RUNNER based on the spec. Create the following interfaces in src/models/:

1. Card.ts - Define the Card interface with properties for id, name, type, cost, power, toughness, ascii art representation, and flavor text.

2. GameState.ts - Create the GameState interface that tracks:
   - Game progression (turn number, active player, current phase)
   - Runner state (deck, hand, field, NPU resources)
   - Corp state (core HP, deck, hand, field, NPU resources)
   - Event log entries

3. LogEntry.ts - Define the structure for game event logging

Include appropriate TypeScript types, ensure immutability where needed, and write unit tests for each model to verify their structure and basic functionality.

Focus on clean, maintainable code with proper typing. Do not implement any game logic yet, just the data structures.
```

### Phase 2: Game State Management

#### Prompt 3: Card Factory
```
Create a CardFactory utility to generate cards for SLOP_RUNNER. Implement the following in src/utils/CardFactory.ts:

1. A function to create NPU cards
2. A function to create the basic Fracter program (1/2, cost: 1)
3. A function to create Barrier ICE (1/1, cost: 1)

Each function should properly set all card properties including appropriate flavor text and a simple ASCII art representation.

Include a method to generate complete starter decks:
- Runner deck (10x NPU, 3x Fracter, 17 placeholders)
- Corp deck (5x NPU, 3x Barrier)

Write tests to verify:
- Cards have the correct properties
- Generated decks have the correct size and composition
- Each card has a unique ID

Use TypeScript's type system to ensure type safety throughout.
```

#### Prompt 4: Game State Manager
```
Implement a GameStateManager class in src/systems/GameStateManager.ts that will handle all game state mutations. The class should:

1. Initialize a new game state with:
   - Empty decks, hands, and fields
   - Starting HP for Corp core (5)
   - Turn counter at 0
   - Runner as active player
   - Empty event log

2. Provide methods to:
   - Set up initial decks using the CardFactory
   - Draw cards from deck to hand
   - Play cards from hand to field
   - Update NPU resources
   - Log events with ISO8601 timestamps
   - Switch active player
   - Advance to next phase
   - Check win/loss conditions

3. Ensure all state changes are immutable (create new state objects)

Write comprehensive tests for each method, verifying that:
- State transitions work correctly
- Game rules are enforced (e.g., can't draw from empty deck)
- Events are properly logged

Focus on clean separation of concerns - this class should manage state only, not game rules or rendering.
```

### Phase 3: Basic Rendering

#### Prompt 5: Terminal Utilities
```
Create utility functions for terminal rendering in src/ui/TerminalUtils.ts:

1. Implement functions to:
   - Clear the terminal screen
   - Set text colors (especially green text on black background)
   - Position the cursor at specific coordinates
   - Draw simple boxes and lines using ASCII characters

2. Create a simple buffer system that allows composing a screen before rendering

3. Add a function to render the game title screen with ASCII art as specified in the spec

Write tests to verify these functions, using mocks for terminal output.

This module should provide the low-level rendering capabilities needed by the higher-level renderer components.
```

#### Prompt 6: Card Renderer
```
Implement a CardRenderer class in src/ui/CardRenderer.ts that visualizes cards using ASCII art:

1. Create a render method that takes a Card object and returns an array of strings representing the card's visual appearance
2. Follow the template specified in the spec:
   ```
   +---------------+
   |NAME       COST|
   |===============|
   |  ___[]___    |
   | |__   __|    |
   |    | |       |
   |    |_|       |
   |===============|
   |FLAVOR_TEXT1   |
   |FLAVOR_TEXT2   |
   |FLAVOR_TEXT3   |
   |===============|
   |P/T: P/T       |
   +---------------+
   ```
3. Implement proper text alignment and truncation for card names and flavor text
4. Include special rendering for different card types (NPU, PROGRAM, ICE)

Write tests to verify:
- Cards render with the correct dimensions
- Text is properly aligned and truncated
- Different card types have appropriate visual distinctions

Use the TerminalUtils for any common rendering functions.
```

#### Prompt 7: Basic Game Board Renderer
```
Create a GameBoardRenderer class in src/ui/GameBoardRenderer.ts to render the basic game state:

1. Implement a render method that takes a GameState and returns a string representation of the game board
2. The layout should follow the spec, with:
   - Corp section at the top (corp core HP, field with ICE)
   - Runner section at the bottom (field with programs)
   - Available NPU counters for both sides
   - Hand card indicators for the player

3. Include a simple event log on the side showing the most recent game events

4. Use the CardRenderer to render individual cards on the board

Write tests to verify:
   - The board renders with the correct layout
   - Cards appear in the appropriate locations
   - Game information (HP, NPU, etc.) is displayed correctly
   - Event log shows the most recent events

Focus on a clean, readable representation. Don't worry about interactivity yet.
```

### Phase 4: User Input Handling

#### Prompt 8: Input Handler
```
Implement an InputHandler class in src/systems/InputHandler.ts to process user keyboard input:

1. Create an interface for standardized user actions (e.g., PlayCard, EndPhase, Attack)

2. Implement methods to:
   - Capture raw keyboard input
   - Parse input into standardized actions based on the current game state
   - Handle number keys (1-9) for card selection
   - Handle space for phase advancement
   - Handle enter for action confirmation
   - Handle h for help and q for quit

3. Create a promise-based getInput() method that resolves with the next valid user action

Write tests using mocked keyboard input to verify:
   - Key mapping works correctly
   - Input is properly translated to game actions
   - Invalid input is handled appropriately

This class should not directly modify game state - it should only return actions that will be processed elsewhere.
```

#### Prompt 9: Action Processor
```
Create an ActionProcessor class in src/systems/ActionProcessor.ts that applies user actions to the game state:

1. Implement methods to process each type of action:
   - PlayNPU: Add NPU to available resources
   - PlayCard: Move a card from hand to field
   - Attack: Initiate combat with a program
   - EndPhase: Advance to the next game phase
   - Quit: End the game

2. Each method should:
   - Validate the action against the current game state
   - Use the GameStateManager to apply valid actions
   - Return the updated game state
   - Throw appropriate GameErrors for invalid actions

Write comprehensive tests for each action type, verifying:
   - Valid actions correctly modify the game state
   - Invalid actions are rejected with appropriate errors
   - Game rules are enforced (e.g., can't play a card without sufficient NPU)

This class bridges the input handling and game state management systems.
```

### Phase 5: Card Mechanics

#### Prompt 10: Program Mechanics
```
Implement the core mechanics for program cards in src/systems/ProgramMechanics.ts:

1. Create functions to:
   - Install a program (play from hand to field)
   - Calculate program effectiveness against different ICE types
   - Determine if a program can attack based on the current state
   - Calculate damage dealt by programs

2. Implement special rules for the Fracter program:
   - More effective against Barrier ICE
   - Standard 1 power damage calculation

3. Include NPU cost validation when installing programs

Write tests verifying:
   - Programs can only be installed with sufficient NPU
   - Fracter is more effective against Barriers
   - Damage calculation works correctly
   - Installation properly updates the game state

Focus on implementing the mechanics described in the spec, particularly how programs interact with ICE during combat.
```

#### Prompt 11: ICE Mechanics
```
Implement the mechanics for ICE cards in src/systems/ICEMechanics.ts:

1. Create functions to:
   - Install ICE (play from Corp hand to field)
   - Determine which programs an ICE can block
   - Calculate damage dealt to programs during combat
   - Handle special ICE abilities (for future expansion)

2. Implement specific rules for Barrier ICE:
   - Blocks runner progress
   - Takes damage based on attacker's power
   - Deals damage based on its own power

3. Include proper NPU cost validation for the Corp

Write tests verifying:
   - ICE can only be installed with sufficient Corp NPU
   - Barriers properly block attacks
   - Damage calculation works correctly in both directions
   - Installation properly updates the game state

These mechanics will form the foundation of the combat system.
```

### Phase 6: Turn & Phase Implementation

#### Prompt 12: Phase Manager
```
Create a PhaseManager class in src/systems/PhaseManager.ts to handle game phase transitions:

1. Implement the four main phases:
   - Draw Phase: Add a card to the active player's hand
   - NPU Phase: Allow playing NPU cards
   - Main Phase: Allow playing program/ICE cards
   - Combat Phase: Process attacks (Runner only)

2. Each phase should:
   - Have entry/exit logic (e.g., auto-drawing a card in Draw Phase)
   - Track allowed actions during the phase
   - Provide a method to advance to the next phase
   - Automatically trigger Corp AI actions during Corp turn

3. Include proper validation to ensure actions are only performed in appropriate phases

Write tests verifying:
   - Phases transition correctly
   - Phase-specific actions are properly restricted
   - Automatic effects (like drawing) happen at the right times
   - The combat phase is skipped during Corp turns

This class should work closely with the GameStateManager and ActionProcessor.
```

#### Prompt 13: Turn Manager
```
Implement a TurnManager class in src/systems/TurnManager.ts to handle turn progression:

1. Create methods to:
   - Start a new turn for the current player
   - End the current turn and switch to the other player
   - Reset phase tracking for a new turn
   - Apply end-of-turn effects (future expansion)

2. Handle the differences between Runner and Corp turns:
   - Runner turn includes combat phase
   - Corp turn is mostly automated (will use AI)

3. Include win/loss condition checking at the end of each turn

Write tests verifying:
   - Turns alternate correctly between Runner and Corp
   - Player-specific turn differences are handled properly
   - Game state is updated appropriately when turns change
   - Win/loss conditions are correctly evaluated

This class provides the high-level turn structure that uses the phase system.
```

### Phase 7: Combat System

#### Prompt 14: Combat Resolution
```
Implement a CombatResolver class in src/systems/CombatResolver.ts to handle the combat phase:

1. Create methods to:
   - Declare attacks with specific program cards
   - Determine which ICE can block each attack
   - Resolve combat between programs and ICE
   - Calculate damage to the Corp core when unblocked
   - Process program/ICE destruction when toughness reaches 0
   - Clear damage at the end of combat

2. Implement the core combat rules from the spec:
   - Programs can attack one at a time
   - Corp decides which ICE blocks (AI-controlled)
   - Damage is dealt simultaneously
   - Unblocked attacks hit the Corp core

3. Include proper event logging for all combat actions

Write tests verifying:
   - Combat resolution follows the specified rules
   - Damage calculation is accurate
   - Cards are destroyed when they reach 0 toughness
   - Unblocked attacks correctly damage the Corp core
   - Events are properly logged

This class implements the most complex mechanics in the game.
```

#### Prompt 15: Corp AI Decision Making
```
Create a CorpAI class in src/systems/CorpAI.ts to automate Corp actions:

1. Implement decision-making for:
   - Which cards to play from hand
   - Where to place ICE
   - Which ICE to use for blocking attacks
   - Prioritizing actions within limited NPU

2. For the tutorial level Corp, implement the specific rules:
   - Always play NPU cards first when available
   - Play Barrier ICE when possible
   - Block with the oldest Barrier first when attacked

3. Create a method to get the next Corp action based on the current state

Write tests verifying:
   - The Corp AI makes consistent decisions
   - The "oldest first" blocking strategy works correctly
   - The AI prioritizes NPU and then ICE placement
   - Decisions respect the available resources

This class should provide predictable AI behavior for the tutorial scenario.
```

### Phase 8: UI Refinement

#### Prompt 16: Interactive Game Board
```
Enhance the GameBoardRenderer to create an InteractiveGameBoard class in src/ui/InteractiveGameBoard.ts:

1. Extend the basic renderer with:
   - Highlighting for selected cards
   - Visual indicators for the current phase
   - Arrows showing attack direction during combat
   - Status messages for player guidance

2. Add methods to:
   - Highlight selectable cards based on valid actions
   - Display available keyboard commands
   - Show action confirmation prompts
   - Provide visual feedback for actions

3. Implement a refreshDisplay method that updates the terminal with the current state

Write tests verifying:
   - Highlighting works correctly
   - Phase indicators are accurate
   - Available actions are clearly shown
   - The display updates properly after state changes

This class adds interactivity to the basic visual representation.
```

#### Prompt 17: Event Log Renderer
```
Create an EventLogRenderer class in src/ui/EventLogRenderer.ts to display the game history:

1. Implement methods to:
   - Format log entries with ISO8601 timestamps
   - Color-code different types of events
   - Display the most recent N log entries
   - Automatically scroll as new events are added

2. Create specific formatters for:
   - Card play events
   - Combat events
   - Phase change events
   - Game state events (win/loss)

3. Integrate with the main game board display

Write tests verifying:
   - Log entries are correctly formatted
   - Color coding works as expected
   - Scrolling behaves properly with many events
   - Different event types have appropriate formatting

This component enhances the game experience by providing clear feedback on game actions.
```

### Phase 9: Game Loop Integration

#### Prompt 18: Main Game Loop
```
Create the main GameLoop class in src/systems/GameLoop.ts to tie everything together:

1. Implement the core game loop as described in the spec:
   - Display title screen
   - Initialize game state
   - Process turns until game over
   - Show game over screen

2. Create methods to:
   - Process a single turn (using TurnManager)
   - Handle user input during the Runner's turn
   - Automate the Corp's turn using CorpAI
   - Check for and handle win/loss conditions

3. Include proper error handling and logging

Write tests verifying:
   - The game loop progresses correctly
   - User input is properly processed
   - Corp turns are correctly automated
   - Win/loss conditions properly end the game

This class serves as the central coordinator for the entire game.
```

#### Prompt 19: Main Application
```
Update the main application entry point in src/index.ts to:

1. Create an async main function that:
   - Initializes all necessary components
   - Creates a new GameLoop instance
   - Starts the game loop
   - Handles graceful exit

2. Add proper error handling to:
   - Catch and log unexpected errors
   - Clean up terminal state on exit
   - Display friendly error messages

3. Include command line argument processing for:
   - Debug mode
   - Help text
   - Version display

Write tests verifying:
   - The application initializes correctly
   - Error handling works as expected
   - Command line arguments are processed properly

This ties together all the previously implemented components into a complete application.
```

### Phase 10: Final Polish

#### Prompt 20: Help System
```
Implement a HelpSystem class in src/ui/HelpSystem.ts:

1. Create methods to display context-sensitive help:
   - General game rules
   - Available actions in the current phase
   - Card type explanations
   - Keyboard controls

2. Implement a modal help display that:
   - Overlays the current game board
   - Can be dismissed to return to the game
   - Provides navigation for multi-page help

3. Include ASCII art in the help screens to maintain the game's aesthetic

Write tests verifying:
   - Help content is accurate and comprehensive
   - The modal display works correctly
   - Context-sensitive help shows appropriate information
   - Navigation works in multi-page help

This system makes the game more accessible to new players.
```

#### Prompt 21: Saving and Loading
```
Create a SaveSystem class in src/systems/SaveSystem.ts:

1. Implement methods to:
   - Serialize the game state to JSON
   - Deserialize JSON to game state
   - Save to and load from local files
   - Auto-save on turn completion

2. Add command line options to:
   - Start a new game
   - Load a saved game
   - List available saves

3. Include save file versioning for future compatibility

Write tests verifying:
   - Serialization/deserialization preserves state exactly
   - Save files can be written and read
   - Error handling for corrupted saves
   - Command line options work correctly

This feature allows players to resume games later and preserves progress.
```

#### Prompt 22: Integration Testing
```
Create comprehensive integration tests in tests/integration/:

1. Implement tests that verify:
   - Complete game scenarios play out correctly
   - The tutorial encounter can be won
   - Invalid actions are properly prevented
   - The game correctly identifies win/loss conditions

2. Include tests for:
   - Card interactions
   - Complete turn cycles
   - Full game loops
   - Edge cases

3. Use mocked input sequences to simulate player actions

These tests ensure that all components work together correctly and the game functions as a cohesive whole.
```

## Ensuring Iterative Progress

Each prompt builds incrementally on previous implementations:

1. First, we establish core models and state management
2. Then we add visualization capabilities
3. Next comes user input handling
4. Then we implement game mechanics
5. Finally, we integrate everything into a complete game

Each step is:
- Testable in isolation
- Based on previously implemented components
- Focused on a specific aspect of functionality
- Small enough to implement with confidence

## Benefits of This Approach

1. **Early Testing**: Each component is tested as it's built, reducing integration issues later
2. **Clear Dependencies**: Each step explicitly builds on previous work
3. **Incremental Progress**: The game becomes playable in stages
4. **Focused Development**: Each prompt addresses a specific aspect of functionality
5. **Maintainable Codebase**: Clean separation of concerns from the beginning

This step-by-step approach ensures the project develops in a controlled, methodical manner while maintaining high code quality and testability. 