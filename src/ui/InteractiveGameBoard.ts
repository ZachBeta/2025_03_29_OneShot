import { GameState } from '../models/GameState';
import { Card } from '../models/Card';
import { PlayerType, PhaseType } from '../models/types';
import { GameBoardRenderer } from './GameBoardRenderer';
import { createScreenBuffer, renderBufferToTerminal, drawBox, cyberpunkStyle, renderToBuffer } from './TerminalUtils';

// Simplified clear screen function
const clearScreen = () => {
  console.clear();
};

/**
 * Enhanced game board renderer with interactive elements
 * Extends GameBoardRenderer with interactive visual elements
 */
export class InteractiveGameBoard {
  private highlightedCards: Map<string, number[]> = new Map();
  private statusMessage: string = '';
  private availableCommands: string[] = [];
  private attackSource: number | null = null;
  private attackTarget: number | null = null;
  
  // Board dimensions and positions (copied from GameBoardRenderer to maintain consistency)
  private readonly BOARD_WIDTH = 80;
  private readonly BOARD_HEIGHT = 40;
  private readonly CARD_WIDTH = 14;
  private readonly CARD_HEIGHT = 12;
  private readonly MARGIN = 2;
  private readonly CORP_Y = 2;
  private readonly RUNNER_Y = 22;
  
  /**
   * Renders the interactive game board
   * @param gameState The current game state
   * @returns Array of strings representing the rendered game board
   */
  public render(gameState: GameState): string[] {
    // Create a buffer for the entire board
    const buffer = createScreenBuffer(this.BOARD_WIDTH, this.BOARD_HEIGHT);
    
    // Use GameBoardRenderer for basic rendering
    GameBoardRenderer.renderGameState(gameState);
    
    // Then, convert the buffer to a string array before adding our interactive elements
    const baseBoard = buffer.map(row => row.join(''));
    
    // Apply highlights to cards if any
    const boardWithHighlights = this.applyHighlights(baseBoard);
    
    // Add phase indicator
    const boardWithPhase = this.addPhaseIndicator(boardWithHighlights, gameState.phase);
    
    // Add attack indicators if applicable
    const boardWithAttacks = this.addAttackIndicators(boardWithPhase);
    
    // Add status messages and available commands
    const finalBoard = this.addStatusAndCommands(boardWithAttacks);
    
    return finalBoard;
  }
  
  /**
   * Highlights cards that are selectable for the current action
   * @param cardType The type of cards to highlight ('runner' or 'corp')
   * @param indices The indices of cards to highlight
   */
  public highlightSelectableCards(cardType: 'runner' | 'corp', indices: number[]): void {
    this.highlightedCards.set(cardType, indices);
  }
  
  /**
   * Clears all card highlights
   */
  public clearHighlights(): void {
    this.highlightedCards.clear();
  }
  
  /**
   * Sets the current status message to display
   * @param message The status message to display
   */
  public setStatusMessage(message: string): void {
    this.statusMessage = message;
  }
  
  /**
   * Sets the available commands to display
   * @param commands Array of command strings to display
   */
  public setAvailableCommands(commands: string[]): void {
    this.availableCommands = commands;
  }
  
  /**
   * Sets attack indicators for visualizing an attack
   * @param sourceIndex The index of the attacking program
   * @param targetIndex The index of the targeted ICE or -1 for direct attack
   */
  public setAttackIndicators(sourceIndex: number, targetIndex: number | null): void {
    this.attackSource = sourceIndex;
    this.attackTarget = targetIndex;
  }
  
  /**
   * Clears attack indicators
   */
  public clearAttackIndicators(): void {
    this.attackSource = null;
    this.attackTarget = null;
  }
  
  /**
   * Refreshes the display with the current game state
   * @param gameState The current game state
   */
  public refreshDisplay(gameState: GameState): void {
    const board = this.render(gameState);
    // Use our local clearScreen function
    clearScreen();
    console.log(board.join('\n'));
  }
  
  /**
   * Applies highlight formatting to selected cards on the board
   * @param board The rendered board array
   * @returns The board with highlights applied
   */
  private applyHighlights(board: string[]): string[] {
    const result = [...board];
    
    // Apply runner card highlights
    const runnerIndices = this.highlightedCards.get('runner') || [];
    for (const index of runnerIndices) {
      // Actual highlight implementation would depend on your terminal library
      // This is a simple example using ASCII escape codes for bright background
      const cardPosition = this.getRunnerCardPosition(index);
      if (cardPosition) {
        this.highlightRegion(result, cardPosition.startRow, cardPosition.endRow, cardPosition.startCol, cardPosition.endCol);
      }
    }
    
    // Apply corp card highlights
    const corpIndices = this.highlightedCards.get('corp') || [];
    for (const index of corpIndices) {
      const cardPosition = this.getCorpCardPosition(index);
      if (cardPosition) {
        this.highlightRegion(result, cardPosition.startRow, cardPosition.endRow, cardPosition.startCol, cardPosition.endCol);
      }
    }
    
    return result;
  }
  
  /**
   * Adds phase indicator to the board
   * @param board The rendered board array
   * @param phase The current game phase
   * @returns The board with phase indicator
   */
  private addPhaseIndicator(board: string[], phase: PhaseType): string[] {
    const result = [...board];
    
    // Create phase indicator string
    const phaseText = `PHASE: ${phase}`;
    const phaseRow = 2; // Place it near the top
    
    // Center the phase indicator
    const startCol = Math.max(0, Math.floor((result[phaseRow].length - phaseText.length) / 2));
    
    // Replace the characters in the row with the phase text
    result[phaseRow] = this.replaceSubstring(result[phaseRow], startCol, phaseText);
    
    return result;
  }
  
  /**
   * Adds attack direction indicators to the board
   * @param board The rendered board array
   * @returns The board with attack indicators
   */
  private addAttackIndicators(board: string[]): string[] {
    if (this.attackSource === null) {
      return board;
    }
    
    const result = [...board];
    
    // Get source card position (always a runner program)
    const sourcePos = this.getRunnerCardPosition(this.attackSource);
    if (!sourcePos) {
      return result;
    }
    
    // Draw an attack arrow
    const sourceCenter = {
      row: Math.floor((sourcePos.startRow + sourcePos.endRow) / 2),
      col: Math.floor((sourcePos.startCol + sourcePos.endCol) / 2)
    };
    
    if (this.attackTarget === null || this.attackTarget === -1) {
      // Direct attack to corp core
      const targetRow = 5; // Approximate row for corp core
      const targetCol = Math.floor(result[targetRow].length / 2);
      
      // Draw a vertical line from source to target
      for (let row = sourceCenter.row - 1; row >= targetRow; row--) {
        if (row < result.length && row >= 0) {
          result[row] = this.replaceChar(result[row], sourceCenter.col, '↑');
        }
      }
    } else {
      // Attack to a specific ICE
      const targetPos = this.getCorpCardPosition(this.attackTarget);
      if (targetPos) {
        const targetCenter = {
          row: Math.floor((targetPos.startRow + targetPos.endRow) / 2),
          col: Math.floor((targetPos.startCol + targetPos.endCol) / 2)
        };
        
        // Draw a line from source to target
        for (let row = sourceCenter.row - 1; row >= targetCenter.row; row--) {
          if (row < result.length && row >= 0) {
            result[row] = this.replaceChar(result[row], sourceCenter.col, '↑');
          }
        }
      }
    }
    
    return result;
  }
  
  /**
   * Adds status message and available commands to the board
   * @param board The rendered board array
   * @returns The board with status and commands
   */
  private addStatusAndCommands(board: string[]): string[] {
    const result = [...board];
    
    // Add status message near the bottom
    const statusRow = result.length - 4;
    if (statusRow >= 0 && this.statusMessage) {
      result[statusRow] = this.centerText(this.statusMessage, result[statusRow].length);
    }
    
    // Add available commands below the status
    if (this.availableCommands.length > 0) {
      const commandsRow = result.length - 2;
      if (commandsRow >= 0) {
        const commandsText = this.availableCommands.join(' | ');
        result[commandsRow] = this.centerText(commandsText, result[commandsRow].length);
      }
    }
    
    return result;
  }
  
  /**
   * Helper method to center text in a given width
   * @param text The text to center
   * @param width The total width
   * @returns Centered text string
   */
  private centerText(text: string, width: number): string {
    const padding = Math.max(0, Math.floor((width - text.length) / 2));
    return ' '.repeat(padding) + text + ' '.repeat(width - padding - text.length);
  }
  
  /**
   * Helper method to replace a substring in a string
   * @param original The original string
   * @param startIndex The starting index
   * @param newText The new text to insert
   * @returns The modified string
   */
  private replaceSubstring(original: string, startIndex: number, newText: string): string {
    if (startIndex < 0 || startIndex >= original.length) {
      return original;
    }
    
    const prefix = original.substring(0, startIndex);
    const suffix = original.substring(startIndex + newText.length);
    return prefix + newText + suffix;
  }
  
  /**
   * Helper method to replace a single character in a string
   * @param original The original string
   * @param index The index to replace
   * @param char The new character
   * @returns The modified string
   */
  private replaceChar(original: string, index: number, char: string): string {
    if (index < 0 || index >= original.length) {
      return original;
    }
    
    return original.substring(0, index) + char + original.substring(index + 1);
  }
  
  /**
   * Helper method to highlight a region in the terminal
   * @param board The board array to modify
   * @param startRow Starting row
   * @param endRow Ending row
   * @param startCol Starting column
   * @param endCol Ending column
   */
  private highlightRegion(
    board: string[], 
    startRow: number, 
    endRow: number, 
    startCol: number, 
    endCol: number
  ): void {
    for (let row = startRow; row <= endRow; row++) {
      if (row < 0 || row >= board.length) continue;
      
      const line = board[row];
      if (!line) continue;
      
      // Using a placeholder for highlighting - would be replaced with actual terminal codes
      const highlightPrefix = '\x1b[7m'; // Invert colors
      const highlightSuffix = '\x1b[0m'; // Reset
      
      const beforeHighlight = line.substring(0, startCol);
      const highlighted = line.substring(startCol, endCol + 1);
      const afterHighlight = line.substring(endCol + 1);
      
      board[row] = beforeHighlight + highlightPrefix + highlighted + highlightSuffix + afterHighlight;
    }
  }
  
  /**
   * Gets the position of a runner card on the board
   * @param index The index of the card
   * @returns The card position or null if not found
   */
  private getRunnerCardPosition(index: number): { startRow: number, endRow: number, startCol: number, endCol: number } | null {
    // These values would be calculated based on your actual board layout
    // This is a simplified example
    const cardWidth = this.CARD_WIDTH;
    const cardHeight = this.CARD_HEIGHT;
    const fieldStartRow = this.RUNNER_Y + 2; // Approximate row where runner field starts
    const fieldStartCol = this.MARGIN + (cardWidth + 2) * index; // 2 for spacing
    
    return {
      startRow: fieldStartRow,
      endRow: fieldStartRow + cardHeight - 1,
      startCol: fieldStartCol,
      endCol: fieldStartCol + cardWidth - 1
    };
  }
  
  /**
   * Gets the position of a corp card on the board
   * @param index The index of the card
   * @returns The card position or null if not found
   */
  private getCorpCardPosition(index: number): { startRow: number, endRow: number, startCol: number, endCol: number } | null {
    // These values would be calculated based on your actual board layout
    // This is a simplified example
    const cardWidth = this.CARD_WIDTH;
    const cardHeight = this.CARD_HEIGHT;
    const fieldStartRow = this.CORP_Y + 4; // Approximate row where corp field starts
    const fieldStartCol = this.MARGIN + (cardWidth + 2) * index; // 2 for spacing
    
    return {
      startRow: fieldStartRow,
      endRow: fieldStartRow + cardHeight - 1,
      startCol: fieldStartCol,
      endCol: fieldStartCol + cardWidth - 1
    };
  }
} 