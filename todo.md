# SLOP_RUNNER Implementation Checklist

## Phase 1: Project Setup & Core Models

### Project Initialization
- [x] Create package.json with appropriate dependencies
  - [x] TypeScript
  - [x] Node.js types
  - [x] Jest for testing
  - [x] Terminal handling library (e.g., chalk, terminal-kit)
- [x] Configure tsconfig.json with strict type checking
- [x] Set up Jest configuration
- [x] Create basic directory structure
  - [x] src/
  - [x] src/models/
  - [x] src/systems/
  - [x] src/ui/
  - [x] src/utils/
  - [x] tests/
- [x] Create initial src/index.ts entry point
- [x] Write basic test to verify environment setup
- [x] Add README.md with project description
- [x] Configure linting (ESLint)
- [x] Set up Git repository with .gitignore

### Core Data Models
- [x] Implement Card interface (src/models/Card.ts)
  - [x] Properties: id, name, type, cost, power, toughness, ascii, flavorText
  - [x] Type guards for different card types
  - [x] Unit tests for Card interface
- [x] Implement GameState interface (src/models/GameState.ts)
  - [x] Game progression properties
  - [x] Runner state properties
  - [x] Corp state properties
  - [x] Event log properties
  - [x] Unit tests for GameState interface
- [x] Implement LogEntry interface (src/models/LogEntry.ts)
  - [x] Properties: timestamp, message, type
  - [x] Unit tests for LogEntry interface
- [x] Create shared types file for common enums and types
  - [x] PlayerType enum (RUNNER, CORP)
  - [x] PhaseType enum (DRAW, NPU, MAIN, COMBAT)
  - [x] CardType enum (NPU, PROGRAM, ICE)
  - [x] EventType enum (GAME, COMBAT, CARD, PHASE)

## Phase 2: Game State Management

### Card Factory
- [x] Implement CardFactory utility (src/utils/CardFactory.ts)
  - [x] Function to create NPU cards
  - [x] Function to create Fracter program cards
  - [x] Function to create Barrier ICE cards
  - [x] ID generation for unique card identification
  - [x] ASCII art representation for each card type
  - [x] Flavor text for each card type
- [x] Implement deck generation functions
  - [x] Function to create Runner starter deck (10x NPU, 3x Fracter)
  - [x] Function to create Corp starter deck (5x NPU, 3x Barrier)
- [x] Write tests for CardFactory
  - [x] Test card property correctness
  - [x] Test unique ID generation
  - [x] Test deck composition
  - [x] Test deck size

### Game State Manager
- [x] Implement GameStateManager class (src/systems/GameStateManager.ts)
  - [x] Constructor for initial empty state
  - [x] Method to initialize decks using CardFactory
  - [x] Method to draw cards from deck to hand
  - [x] Method to play cards from hand to field
  - [x] Method to update NPU resources
  - [x] Method to log events with ISO8601 timestamps
  - [x] Method to switch active player
  - [x] Method to advance to next phase
  - [x] Method to check win/loss conditions
- [x] Ensure all state changes are immutable
- [x] Write tests for GameStateManager
  - [x] Test initial state creation
  - [x] Test deck initialization
  - [x] Test drawing cards (including edge cases)
  - [x] Test playing cards
  - [x] Test NPU updates
  - [x] Test event logging
  - [x] Test player switching
  - [x] Test phase advancement
  - [x] Test win/loss condition checking

## Phase 3: Basic Rendering

### Terminal Utilities
- [x] Implement TerminalUtils functions (src/ui/TerminalUtils.ts)
  - [x] Function to clear terminal screen
  - [x] Function to set text colors (green on black)
  - [x] Function to position cursor
  - [x] Functions to draw ASCII boxes and lines
  - [x] Function to create screen buffer
  - [x] Function to render buffer to terminal
- [x] Create function to render title screen with ASCII art
- [x] Write tests for TerminalUtils
  - [x] Mock terminal output for testing
  - [x] Test all utility functions
  - [x] Test title screen rendering

### Card Renderer
- [x] Implement CardRenderer class (src/ui/CardRenderer.ts)
  - [x] Method to render Card to string array
  - [x] Template-based rendering following spec design
  - [x] Text alignment and truncation for card properties
  - [x] Special rendering for different card types
- [x] Write tests for CardRenderer
  - [x] Test card dimensions
  - [x] Test text alignment and truncation
  - [x] Test unique styling for each card type
  - [x] Test edge cases (long names, missing values)

### Basic Game Board Renderer
- [x] Implement GameBoardRenderer class (src/ui/GameBoardRenderer.ts)
  - [x] Method to render complete game state
  - [x] Layout with Corp at top, Runner at bottom
  - [x] Section for Corp core and HP display
  - [x] Section for Corp ICE field
  - [x] Section for Runner program field
  - [x] Display for available NPU for both sides
  - [x] Display for hand cards
  - [x] Simple event log integration
- [x] Use CardRenderer for individual cards
- [x] Write tests for GameBoardRenderer
  - [x] Test overall layout
  - [x] Test card positioning
  - [x] Test state information display
  - [x] Test event log inclusion

## Phase 4: User Input Handling

### Input Handler
- [x] Create UserAction interface for standardized actions
- [x] Implement InputHandler class (src/systems/InputHandler.ts)
  - [x] Method to capture raw keyboard input
  - [x] Method to parse input based on game state
  - [x] Handlers for number keys (1-9) for card selection
  - [x] Handler for space key (phase advancement)
  - [x] Handler for enter key (action confirmation)
  - [x] Handlers for h (help) and q (quit) keys
  - [x] Promise-based getInput() method
- [x] Write tests for InputHandler
  - [x] Mock keyboard input
  - [x] Test key mapping
  - [x] Test action translation
  - [x] Test invalid input handling

### Action Processor
- [x] Implement ActionProcessor class (src/systems/ActionProcessor.ts)
  - [x] Method to process PlayNPU action
  - [x] Method to process PlayCard action
  - [x] Method to process Attack action
  - [x] Method to process EndPhase action
  - [x] Method to process Quit action
  - [x] Action validation based on game state
- [x] Integrate with GameStateManager
- [x] Implement GameError class for error handling
- [x] Write tests for ActionProcessor
  - [x] Test each action type
  - [x] Test validation logic
  - [x] Test error handling
  - [x] Test game rule enforcement

## Phase 5: Card Mechanics

### Program Mechanics
- [x] Implement ProgramMechanics module (src/systems/ProgramMechanics.ts)
  - [x] Function to install a program
  - [x] Function to calculate program effectiveness against ICE types
  - [x] Function to determine if a program can attack
  - [x] Function to calculate damage dealt by programs
- [x] Implement special rules for Fracter
  - [x] More effective against Barrier ICE
  - [x] Standard 1 power damage calculation
- [x] Include NPU cost validation
- [x] Write tests for ProgramMechanics
  - [x] Test installation requirements
  - [x] Test effectiveness calculations
  - [x] Test attack eligibility
  - [x] Test damage calculation
  - [x] Test Fracter's special effectiveness

### ICE Mechanics
- [x] Implement ICEMechanics module (src/systems/ICEMechanics.ts)
  - [x] Function to install ICE
  - [x] Function to determine which programs an ICE can block
  - [x] Function to calculate damage dealt to programs
  - [x] Framework for special ICE abilities
- [x] Implement specific rules for Barrier ICE
  - [x] Blocking behavior
  - [x] Damage taking based on attacker's power
  - [x] Damage dealing based on own power
- [x] Include Corp NPU cost validation
- [x] Write tests for ICEMechanics
  - [x] Test installation requirements
  - [x] Test blocking determinations
  - [x] Test damage calculations
  - [x] Test Barrier-specific behavior

## Phase 6: Turn & Phase Implementation

### Phase Manager
- [x] Implement PhaseManager class (src/systems/PhaseManager.ts)
  - [x] Implementation of Draw Phase
  - [x] Implementation of NPU Phase
  - [x] Implementation of Main Phase
  - [x] Implementation of Combat Phase (Runner only)
  - [x] Entry/exit logic for each phase
  - [x] Tracking of allowed actions per phase
  - [x] Method to advance to next phase
  - [x] Logic for Corp AI action triggers
- [x] Add validation for phase-appropriate actions
- [x] Write tests for PhaseManager
  - [x] Test phase transitions
  - [x] Test action restrictions by phase
  - [x] Test automatic effects
  - [x] Test phase differences between Runner and Corp

### Turn Manager
- [x] Implement TurnManager class (src/systems/TurnManager.ts)
  - [x] Method to start new turn
  - [x] Method to end current turn
  - [x] Method to switch players
  - [x] Method to reset phase tracking
  - [x] Framework for end-of-turn effects
- [x] Handle Runner vs Corp turn differences
- [x] Implement win/loss condition checking
- [x] Write tests for TurnManager
  - [x] Test turn alternation
  - [x] Test player-specific differences
  - [x] Test state updates during turn changes
  - [x] Test win/loss evaluation

## Phase 7: Combat System

### Combat Resolution
- [x] Implement CombatResolver class (src/systems/CombatResolver.ts)
  - [x] Method to declare attacks
  - [x] Method to determine blocking ICE
  - [x] Method to resolve program vs ICE combat
  - [x] Method to calculate Corp core damage
  - [x] Method to process card destruction
  - [x] Method to clear damage at end of combat
- [x] Implement core combat rules
  - [x] One-at-a-time program attacks
  - [x] Corp-decided blocking
  - [x] Simultaneous damage
  - [x] Unblocked damage to Corp core
- [x] Add event logging for combat actions
- [x] Write tests for CombatResolver
  - [x] Test rules compliance
  - [x] Test damage calculation
  - [x] Test card destruction
  - [x] Test unblocked attack handling
  - [x] Test event logging

### Corp AI Decision Making
- [x] Implement CorpAI class (src/systems/CorpAI.ts)
  - [x] Logic for card play decisions
  - [x] Logic for ICE placement
  - [x] Logic for blocking decisions
  - [x] NPU prioritization algorithm
- [x] Implement tutorial Corp behavior
  - [x] Play NPU cards first
  - [x] Play Barrier ICE when possible
  - [x] Block with oldest Barrier first
- [x] Method to get next Corp action
- [x] Write tests for CorpAI
  - [x] Test decision consistency
  - [x] Test "oldest first" blocking
  - [x] Test NPU and ICE priorities
  - [x] Test resource-constrained decisions

## Phase 8: UI Refinement

### Interactive Game Board
- [x] Implement InteractiveGameBoard class (src/ui/InteractiveGameBoard.ts)
  - [x] Extend GameBoardRenderer
  - [x] Add card highlighting
  - [x] Add phase indicators
  - [x] Add attack direction indicators
  - [x] Add status messages
- [x] Add methods for UI interactions
  - [x] Highlight selectable cards
  - [x] Display available commands
  - [x] Show action confirmations
  - [x] Provide visual feedback
- [x] Add refreshDisplay method
- [x] Write tests for InteractiveGameBoard
  - [x] Test highlighting
  - [x] Test phase indicators
  - [x] Test action display
  - [x] Test display updates

### Event Log Renderer
- [x] Implement EventLogRenderer class (src/ui/EventLogRenderer.ts)
  - [x] Method to format log entries with timestamps
  - [x] Color coding for different event types
  - [x] Display of most recent N entries
  - [x] Automatic scrolling for new events
- [x] Create specialized formatters
  - [x] Card play event formatter
  - [x] Combat event formatter
  - [x] Phase change formatter
  - [x] Game state formatter
- [x] Integrate with main game board
- [x] Write tests for EventLogRenderer
  - [x] Test formatting
  - [x] Test color coding
  - [x] Test scrolling behavior
  - [x] Test event type handling

## Phase 9: Game Loop Integration

### Main Game Loop
- [x] Implement GameLoop class (src/systems/GameLoop.ts)
  - [x] Core loop as per spec
  - [x] Title screen display
  - [x] Game state initialization
  - [x] Turn processing
  - [x] Game over screen
- [x] Create turn processing methods
  - [x] Runner turn handling with user input
  - [x] Corp turn automation with AI
  - [x] Win/loss condition checking
- [x] Add error handling and logging
- [x] Write tests for GameLoop
  - [x] Test game progression
  - [x] Test input processing
  - [x] Test Corp automation
  - [x] Test game ending conditions

### Main Application
- [x] Update main application entry point (src/index.ts)
  - [x] Create async main function
  - [x] Component initialization
  - [x] GameLoop instantiation
  - [x] Game loop starting
  - [x] Graceful exit handling
- [x] Add error handling
  - [x] Unexpected error catching
  - [x] Terminal state cleanup
  - [x] User-friendly error messages
- [x] Add command line argument processing
  - [x] Debug mode flag
  - [x] Help text option
  - [x] Version display
- [x] Write tests for main application
  - [x] Test initialization
  - [x] Test error handling
  - [x] Test command line argument processing

## Phase 10: Final Polish

### Help System
- [ ] Implement HelpSystem class (src/ui/HelpSystem.ts)
  - [ ] Context-sensitive help methods
  - [ ] Game rules explanation
  - [ ] Phase-specific action help
  - [ ] Card type explanations
  - [ ] Keyboard control reference
- [ ] Create modal help display
  - [ ] Overlay for current game board
  - [ ] Dismissal mechanism
  - [ ] Multi-page navigation
- [ ] Add ASCII art for help screens
- [ ] Write tests for HelpSystem
  - [ ] Test content accuracy
  - [ ] Test modal display
  - [ ] Test context sensitivity
  - [ ] Test navigation

### Saving and Loading
- [ ] Implement SaveSystem class (src/systems/SaveSystem.ts)
  - [ ] Game state serialization
  - [ ] Game state deserialization
  - [ ] File I/O for saves
  - [ ] Auto-save functionality
- [ ] Add command line options
  - [ ] New game option
  - [ ] Load game option
  - [ ] List saves option
- [ ] Add save file versioning
- [ ] Write tests for SaveSystem
  - [ ] Test serialization/deserialization
  - [ ] Test file I/O
  - [ ] Test error handling
  - [ ] Test command options

### Integration Testing
- [ ] Create comprehensive integration tests
  - [ ] Complete game scenario tests
  - [ ] Tutorial win scenario test
  - [ ] Invalid action prevention test
  - [ ] Win/loss condition tests
- [ ] Add specialized tests
  - [ ] Card interaction tests
  - [ ] Turn cycle tests
  - [ ] Full game loop tests
  - [ ] Edge case tests
- [ ] Create mock input sequences
- [ ] Run final integration test suite

## Final Steps

### Documentation
- [ ] Update README.md with complete instructions
- [ ] Add inline code documentation
- [ ] Create user guide/tutorial
- [ ] Document known issues

### Performance Optimization
- [ ] Profile application
- [ ] Optimize rendering
- [ ] Optimize game logic
- [ ] Reduce memory usage

### Release Preparation
- [ ] Create build script
- [ ] Package application
- [ ] Set up version tagging
- [ ] Prepare release notes 