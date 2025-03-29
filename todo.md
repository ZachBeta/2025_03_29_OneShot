# SLOP_RUNNER Implementation Checklist

## Phase 1: Project Setup & Core Models

### Project Initialization
- [ ] Create package.json with appropriate dependencies
  - [ ] TypeScript
  - [ ] Node.js types
  - [ ] Jest for testing
  - [ ] Terminal handling library (e.g., chalk, terminal-kit)
- [ ] Configure tsconfig.json with strict type checking
- [ ] Set up Jest configuration
- [ ] Create basic directory structure
  - [ ] src/
  - [ ] src/models/
  - [ ] src/systems/
  - [ ] src/ui/
  - [ ] src/utils/
  - [ ] tests/
- [ ] Create initial src/index.ts entry point
- [ ] Write basic test to verify environment setup
- [ ] Add README.md with project description
- [ ] Configure linting (ESLint)
- [ ] Set up Git repository with .gitignore

### Core Data Models
- [ ] Implement Card interface (src/models/Card.ts)
  - [ ] Properties: id, name, type, cost, power, toughness, ascii, flavorText
  - [ ] Type guards for different card types
  - [ ] Unit tests for Card interface
- [ ] Implement GameState interface (src/models/GameState.ts)
  - [ ] Game progression properties
  - [ ] Runner state properties
  - [ ] Corp state properties
  - [ ] Event log properties
  - [ ] Unit tests for GameState interface
- [ ] Implement LogEntry interface (src/models/LogEntry.ts)
  - [ ] Properties: timestamp, message, type
  - [ ] Unit tests for LogEntry interface
- [ ] Create shared types file for common enums and types
  - [ ] PlayerType enum (RUNNER, CORP)
  - [ ] PhaseType enum (DRAW, NPU, MAIN, COMBAT)
  - [ ] CardType enum (NPU, PROGRAM, ICE)
  - [ ] EventType enum (GAME, COMBAT, CARD, PHASE)

## Phase 2: Game State Management

### Card Factory
- [ ] Implement CardFactory utility (src/utils/CardFactory.ts)
  - [ ] Function to create NPU cards
  - [ ] Function to create Fracter program cards
  - [ ] Function to create Barrier ICE cards
  - [ ] ID generation for unique card identification
  - [ ] ASCII art representation for each card type
  - [ ] Flavor text for each card type
- [ ] Implement deck generation functions
  - [ ] Function to create Runner starter deck (10x NPU, 3x Fracter)
  - [ ] Function to create Corp starter deck (5x NPU, 3x Barrier)
- [ ] Write tests for CardFactory
  - [ ] Test card property correctness
  - [ ] Test unique ID generation
  - [ ] Test deck composition
  - [ ] Test deck size

### Game State Manager
- [ ] Implement GameStateManager class (src/systems/GameStateManager.ts)
  - [ ] Constructor for initial empty state
  - [ ] Method to initialize decks using CardFactory
  - [ ] Method to draw cards from deck to hand
  - [ ] Method to play cards from hand to field
  - [ ] Method to update NPU resources
  - [ ] Method to log events with ISO8601 timestamps
  - [ ] Method to switch active player
  - [ ] Method to advance to next phase
  - [ ] Method to check win/loss conditions
- [ ] Ensure all state changes are immutable
- [ ] Write tests for GameStateManager
  - [ ] Test initial state creation
  - [ ] Test deck initialization
  - [ ] Test drawing cards (including edge cases)
  - [ ] Test playing cards
  - [ ] Test NPU updates
  - [ ] Test event logging
  - [ ] Test player switching
  - [ ] Test phase advancement
  - [ ] Test win/loss condition checking

## Phase 3: Basic Rendering

### Terminal Utilities
- [ ] Implement TerminalUtils functions (src/ui/TerminalUtils.ts)
  - [ ] Function to clear terminal screen
  - [ ] Function to set text colors (green on black)
  - [ ] Function to position cursor
  - [ ] Functions to draw ASCII boxes and lines
  - [ ] Function to create screen buffer
  - [ ] Function to render buffer to terminal
- [ ] Create function to render title screen with ASCII art
- [ ] Write tests for TerminalUtils
  - [ ] Mock terminal output for testing
  - [ ] Test all utility functions
  - [ ] Test title screen rendering

### Card Renderer
- [ ] Implement CardRenderer class (src/ui/CardRenderer.ts)
  - [ ] Method to render Card to string array
  - [ ] Template-based rendering following spec design
  - [ ] Text alignment and truncation for card properties
  - [ ] Special rendering for different card types
- [ ] Write tests for CardRenderer
  - [ ] Test card dimensions
  - [ ] Test text alignment and truncation
  - [ ] Test unique styling for each card type
  - [ ] Test edge cases (long names, missing values)

### Basic Game Board Renderer
- [ ] Implement GameBoardRenderer class (src/ui/GameBoardRenderer.ts)
  - [ ] Method to render complete game state
  - [ ] Layout with Corp at top, Runner at bottom
  - [ ] Section for Corp core and HP display
  - [ ] Section for Corp ICE field
  - [ ] Section for Runner program field
  - [ ] Display for available NPU for both sides
  - [ ] Display for hand cards
  - [ ] Simple event log integration
- [ ] Use CardRenderer for individual cards
- [ ] Write tests for GameBoardRenderer
  - [ ] Test overall layout
  - [ ] Test card positioning
  - [ ] Test state information display
  - [ ] Test event log inclusion

## Phase 4: User Input Handling

### Input Handler
- [ ] Create UserAction interface for standardized actions
- [ ] Implement InputHandler class (src/systems/InputHandler.ts)
  - [ ] Method to capture raw keyboard input
  - [ ] Method to parse input based on game state
  - [ ] Handlers for number keys (1-9) for card selection
  - [ ] Handler for space key (phase advancement)
  - [ ] Handler for enter key (action confirmation)
  - [ ] Handlers for h (help) and q (quit) keys
  - [ ] Promise-based getInput() method
- [ ] Write tests for InputHandler
  - [ ] Mock keyboard input
  - [ ] Test key mapping
  - [ ] Test action translation
  - [ ] Test invalid input handling

### Action Processor
- [ ] Implement ActionProcessor class (src/systems/ActionProcessor.ts)
  - [ ] Method to process PlayNPU action
  - [ ] Method to process PlayCard action
  - [ ] Method to process Attack action
  - [ ] Method to process EndPhase action
  - [ ] Method to process Quit action
  - [ ] Action validation based on game state
- [ ] Integrate with GameStateManager
- [ ] Implement GameError class for error handling
- [ ] Write tests for ActionProcessor
  - [ ] Test each action type
  - [ ] Test validation logic
  - [ ] Test error handling
  - [ ] Test game rule enforcement

## Phase 5: Card Mechanics

### Program Mechanics
- [ ] Implement ProgramMechanics module (src/systems/ProgramMechanics.ts)
  - [ ] Function to install a program
  - [ ] Function to calculate program effectiveness against ICE types
  - [ ] Function to determine if a program can attack
  - [ ] Function to calculate damage dealt by programs
- [ ] Implement special rules for Fracter
  - [ ] More effective against Barrier ICE
  - [ ] Standard 1 power damage calculation
- [ ] Include NPU cost validation
- [ ] Write tests for ProgramMechanics
  - [ ] Test installation requirements
  - [ ] Test effectiveness calculations
  - [ ] Test attack eligibility
  - [ ] Test damage calculation
  - [ ] Test Fracter's special effectiveness

### ICE Mechanics
- [ ] Implement ICEMechanics module (src/systems/ICEMechanics.ts)
  - [ ] Function to install ICE
  - [ ] Function to determine which programs an ICE can block
  - [ ] Function to calculate damage dealt to programs
  - [ ] Framework for special ICE abilities
- [ ] Implement specific rules for Barrier ICE
  - [ ] Blocking behavior
  - [ ] Damage taking based on attacker's power
  - [ ] Damage dealing based on own power
- [ ] Include Corp NPU cost validation
- [ ] Write tests for ICEMechanics
  - [ ] Test installation requirements
  - [ ] Test blocking determinations
  - [ ] Test damage calculations
  - [ ] Test Barrier-specific behavior

## Phase 6: Turn & Phase Implementation

### Phase Manager
- [ ] Implement PhaseManager class (src/systems/PhaseManager.ts)
  - [ ] Implementation of Draw Phase
  - [ ] Implementation of NPU Phase
  - [ ] Implementation of Main Phase
  - [ ] Implementation of Combat Phase (Runner only)
  - [ ] Entry/exit logic for each phase
  - [ ] Tracking of allowed actions per phase
  - [ ] Method to advance to next phase
  - [ ] Logic for Corp AI action triggers
- [ ] Add validation for phase-appropriate actions
- [ ] Write tests for PhaseManager
  - [ ] Test phase transitions
  - [ ] Test action restrictions by phase
  - [ ] Test automatic effects
  - [ ] Test phase differences between Runner and Corp

### Turn Manager
- [ ] Implement TurnManager class (src/systems/TurnManager.ts)
  - [ ] Method to start new turn
  - [ ] Method to end current turn
  - [ ] Method to switch players
  - [ ] Method to reset phase tracking
  - [ ] Framework for end-of-turn effects
- [ ] Handle Runner vs Corp turn differences
- [ ] Implement win/loss condition checking
- [ ] Write tests for TurnManager
  - [ ] Test turn alternation
  - [ ] Test player-specific differences
  - [ ] Test state updates during turn changes
  - [ ] Test win/loss evaluation

## Phase 7: Combat System

### Combat Resolution
- [ ] Implement CombatResolver class (src/systems/CombatResolver.ts)
  - [ ] Method to declare attacks
  - [ ] Method to determine blocking ICE
  - [ ] Method to resolve program vs ICE combat
  - [ ] Method to calculate Corp core damage
  - [ ] Method to process card destruction
  - [ ] Method to clear damage at end of combat
- [ ] Implement core combat rules
  - [ ] One-at-a-time program attacks
  - [ ] Corp-decided blocking
  - [ ] Simultaneous damage
  - [ ] Unblocked damage to Corp core
- [ ] Add event logging for combat actions
- [ ] Write tests for CombatResolver
  - [ ] Test rules compliance
  - [ ] Test damage calculation
  - [ ] Test card destruction
  - [ ] Test unblocked attack handling
  - [ ] Test event logging

### Corp AI Decision Making
- [ ] Implement CorpAI class (src/systems/CorpAI.ts)
  - [ ] Logic for card play decisions
  - [ ] Logic for ICE placement
  - [ ] Logic for blocking decisions
  - [ ] NPU prioritization algorithm
- [ ] Implement tutorial Corp behavior
  - [ ] Play NPU cards first
  - [ ] Play Barrier ICE when possible
  - [ ] Block with oldest Barrier first
- [ ] Method to get next Corp action
- [ ] Write tests for CorpAI
  - [ ] Test decision consistency
  - [ ] Test "oldest first" blocking
  - [ ] Test NPU and ICE priorities
  - [ ] Test resource-constrained decisions

## Phase 8: UI Refinement

### Interactive Game Board
- [ ] Implement InteractiveGameBoard class (src/ui/InteractiveGameBoard.ts)
  - [ ] Extend GameBoardRenderer
  - [ ] Add card highlighting
  - [ ] Add phase indicators
  - [ ] Add attack direction indicators
  - [ ] Add status messages
- [ ] Add methods for UI interactions
  - [ ] Highlight selectable cards
  - [ ] Display available commands
  - [ ] Show action confirmations
  - [ ] Provide visual feedback
- [ ] Add refreshDisplay method
- [ ] Write tests for InteractiveGameBoard
  - [ ] Test highlighting
  - [ ] Test phase indicators
  - [ ] Test action display
  - [ ] Test display updates

### Event Log Renderer
- [ ] Implement EventLogRenderer class (src/ui/EventLogRenderer.ts)
  - [ ] Method to format log entries with timestamps
  - [ ] Color coding for different event types
  - [ ] Display of most recent N entries
  - [ ] Automatic scrolling for new events
- [ ] Create specialized formatters
  - [ ] Card play event formatter
  - [ ] Combat event formatter
  - [ ] Phase change formatter
  - [ ] Game state formatter
- [ ] Integrate with main game board
- [ ] Write tests for EventLogRenderer
  - [ ] Test formatting
  - [ ] Test color coding
  - [ ] Test scrolling behavior
  - [ ] Test event type handling

## Phase 9: Game Loop Integration

### Main Game Loop
- [ ] Implement GameLoop class (src/systems/GameLoop.ts)
  - [ ] Core loop as per spec
  - [ ] Title screen display
  - [ ] Game state initialization
  - [ ] Turn processing
  - [ ] Game over screen
- [ ] Create turn processing methods
  - [ ] Runner turn handling with user input
  - [ ] Corp turn automation with AI
  - [ ] Win/loss condition checking
- [ ] Add error handling and logging
- [ ] Write tests for GameLoop
  - [ ] Test game progression
  - [ ] Test input processing
  - [ ] Test Corp automation
  - [ ] Test game ending conditions

### Main Application
- [ ] Update main application entry point (src/index.ts)
  - [ ] Create async main function
  - [ ] Component initialization
  - [ ] GameLoop instantiation
  - [ ] Game loop starting
  - [ ] Graceful exit handling
- [ ] Add error handling
  - [ ] Unexpected error catching
  - [ ] Terminal state cleanup
  - [ ] User-friendly error messages
- [ ] Add command line argument processing
  - [ ] Debug mode flag
  - [ ] Help text option
  - [ ] Version display
- [ ] Write tests for main application
  - [ ] Test initialization
  - [ ] Test error handling
  - [ ] Test command line argument processing

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