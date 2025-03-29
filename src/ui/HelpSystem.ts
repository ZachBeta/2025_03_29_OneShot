/**
 * HelpSystem class for providing context-sensitive help information
 * Integrates with the game to provide help based on the current state
 */

import { PhaseType, PlayerType } from '../models/types';
import { GameState } from '../models/GameState';
import { drawBox, cyberpunkStyle, createScreenBuffer, renderToBuffer, renderBufferToTerminal, clearScreen } from './TerminalUtils';

export class HelpSystem {
  private static readonly HELP_WIDTH = 76;
  private static readonly HELP_HEIGHT = 30;
  private static readonly TITLE_ART = [
    "  _   _   _____   _       _____  ",
    " | | | | |  ___| | |     |  _  | ",
    " | |_| | | |__   | |     | |_| | ",
    " |  _  | |  __|  | |     |  ___/ ",
    " | | | | | |___  | |___  | |     ",
    " |_| |_| |_____| |_____| |_|     "
  ];
  
  // Maps phases to help content
  private static readonly PHASE_HELP: Record<PhaseType, { title: string; content: string[] }> = {
    [PhaseType.DRAW]: {
      title: "DRAW PHASE",
      content: [
        "During the Draw Phase, you automatically draw a card from your deck.",
        "",
        "• Cards are drawn automatically at the start of this phase",
        "• No player actions needed during this phase",
        "• Press [SPACE] to advance to the NPU Phase",
        "",
        "If your deck is empty, you continue play with your current hand."
      ]
    },
    [PhaseType.NPU]: {
      title: "NEURAL PROCESSING UNIT (NPU) PHASE",
      content: [
        "During the NPU Phase, you can play NPU cards to increase your resources.",
        "",
        "• Press [1-9] to play an NPU card from your hand",
        "• Each NPU card adds 1 NPU to your pool",
        "• NPU is used to install Programs (for Runner) or ICE (for Corp)",
        "• Press [SPACE] to advance to the Main Phase",
        "",
        "NPU refreshes automatically at the start of each NPU phase."
      ]
    },
    [PhaseType.MAIN]: {
      title: "MAIN PHASE",
      content: [
        "During the Main Phase, you can play Program cards from your hand.",
        "",
        "• Press [1-9] to play a Program card from your hand",
        "• Programs require NPU to install",
        "• Different Program types have different effects",
        "• Fracter programs are effective against Barrier ICE",
        "• Press [SPACE] to advance to the Combat Phase",
        "",
        "For the Corp, ICE is played in this phase to defend the Core."
      ]
    },
    [PhaseType.COMBAT]: {
      title: "COMBAT PHASE",
      content: [
        "During the Combat Phase, you can attack with your Programs.",
        "",
        "• Press [1-9] to select a Program to attack with",
        "• The Corp player decides if/which ICE blocks your attack",
        "• Unblocked attacks deal damage to the Corp's Core",
        "• If ICE blocks, Program and ICE deal damage to each other",
        "• Cards are destroyed if damage equals or exceeds toughness",
        "• Press [SPACE] to end your turn",
        "",
        "The Runner wins if Corp Core HP reaches 0."
      ]
    }
  };
  
  // General game help content
  private static readonly GENERAL_HELP = {
    title: "GENERAL CONTROLS",
    content: [
      "SLOP_RUNNER is a cyberpunk card game inspired by Netrunner.",
      "",
      "• [SPACE] End the current phase",
      "• [1-9] Select a card (based on current phase)",
      "• [H] Display this help screen",
      "• [Q] Quit the game",
      "",
      "Runner wins by reducing Corp's Core HP to 0.",
      "Corp wins if the Runner has no cards in hand and no Programs in play."
    ]
  };
  
  private static readonly CARD_TYPE_HELP = {
    title: "CARD TYPES",
    content: [
      "NPU (Neural Processing Unit):",
      "• Cost: 0 NPU",
      "• Provides 1 NPU resource when played",
      "• Used to pay for Programs and ICE",
      "",
      "PROGRAM (Runner only):",
      "• Cost: 1+ NPU",
      "• Has Power (attack) and Toughness (health)",
      "• Used to attack the Corp's ICE and Core",
      "",
      "ICE (Corp only):",
      "• Cost: 1+ NPU",
      "• Has Power (attack) and Toughness (health)",
      "• Defends the Corp Core from Runner attacks"
    ]
  };
  
  /**
   * Get help content based on the current game state
   * @param gameState The current game state
   * @returns An object with title and content
   */
  public getContextHelp(gameState: GameState): { title: string; content: string[] } {
    // Return phase-specific help by default
    return HelpSystem.PHASE_HELP[gameState.phase];
  }
  
  /**
   * Display context-sensitive help overlay
   * @param gameState The current game state
   * @param pageNumber The help page number (1-3)
   */
  public displayHelpOverlay(gameState: GameState, pageNumber: number = 1): void {
    // Clear the screen
    clearScreen();
    
    // Create a screen buffer for the help content
    const buffer = createScreenBuffer(HelpSystem.HELP_WIDTH, HelpSystem.HELP_HEIGHT);
    
    // Get help content based on page number
    let helpContent: { title: string; content: string[] };
    
    switch (pageNumber) {
      case 1:
        helpContent = this.getContextHelp(gameState);
        break;
      case 2:
        helpContent = HelpSystem.GENERAL_HELP;
        break;
      case 3:
        helpContent = HelpSystem.CARD_TYPE_HELP;
        break;
      default:
        helpContent = this.getContextHelp(gameState);
    }
    
    // Render title art
    for (let i = 0; i < HelpSystem.TITLE_ART.length; i++) {
      const startX = Math.floor((HelpSystem.HELP_WIDTH - HelpSystem.TITLE_ART[i].length) / 2);
      renderToBuffer(buffer, startX, 1 + i, HelpSystem.TITLE_ART[i]);
    }
    
    // Render help title
    const titleText = cyberpunkStyle(helpContent.title);
    const titleX = Math.floor((HelpSystem.HELP_WIDTH - helpContent.title.length) / 2);
    renderToBuffer(buffer, titleX, 8, titleText);
    
    // Render page indicator
    const pageText = `Page ${pageNumber}/3`;
    const pageX = HelpSystem.HELP_WIDTH - pageText.length - 2;
    renderToBuffer(buffer, pageX, 8, pageText);
    
    // Render content lines
    for (let i = 0; i < helpContent.content.length; i++) {
      renderToBuffer(buffer, 4, 10 + i, helpContent.content[i]);
    }
    
    // Render navigation instructions
    const navText = "Press [1-3] to change pages, [ESC] to return to game";
    const navX = Math.floor((HelpSystem.HELP_WIDTH - navText.length) / 2);
    renderToBuffer(buffer, navX, HelpSystem.HELP_HEIGHT - 2, navText);
    
    // Draw a box around everything
    drawBox(buffer, 0, 0, HelpSystem.HELP_WIDTH - 1, HelpSystem.HELP_HEIGHT - 1);
    
    // Output the buffer to the terminal
    const finalScreen = buffer.map(row => row.join(''));
    console.log(finalScreen.join('\n'));
  }
  
  /**
   * Wait for user input to navigate or dismiss help
   * @returns Promise that resolves when user dismisses help
   */
  public async waitForHelpInput(): Promise<number | null> {
    return new Promise((resolve) => {
      const handleKeypress = (str: string, key: { name: string; ctrl: boolean }) => {
        // Handle key presses
        if (key.ctrl && key.name === 'c') {
          // Ctrl+C to exit
          process.exit(0);
        } else if (key.name === 'escape') {
          // ESC to return to game
          process.stdin.removeListener('keypress', handleKeypress);
          process.stdin.setRawMode(false);
          resolve(null);
        } else if (['1', '2', '3'].includes(str)) {
          // 1-3 to change pages
          process.stdin.removeListener('keypress', handleKeypress);
          process.stdin.setRawMode(false);
          resolve(parseInt(str, 10));
        }
      };
      
      // Set up keypress handling
      process.stdin.setRawMode(true);
      process.stdin.resume();
      process.stdin.on('keypress', handleKeypress);
    });
  }
  
  /**
   * Show full help modal with navigation
   * @param gameState The current game state
   */
  public async showHelp(gameState: GameState): Promise<void> {
    let currentPage = 1;
    let isDismissed = false;
    
    while (!isDismissed) {
      this.displayHelpOverlay(gameState, currentPage);
      const result = await this.waitForHelpInput();
      
      if (result === null) {
        isDismissed = true;
      } else {
        currentPage = result;
      }
    }
  }
} 