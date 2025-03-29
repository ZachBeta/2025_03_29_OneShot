/**
 * Game board rendering utilities
 */

import { GameState } from '../models/GameState';
import { Card } from '../models/Card';
import { CardType, PlayerType, PhaseType } from '../models/types';
import { CardRenderer } from './CardRenderer';
import { 
  createScreenBuffer, 
  renderToBuffer, 
  renderBufferToTerminal, 
  drawBox, 
  cyberpunkStyle 
} from './TerminalUtils';

/**
 * Class for rendering the game board
 */
export class GameBoardRenderer {
  // Board dimensions and positions
  private static readonly BOARD_WIDTH = 80;
  private static readonly BOARD_HEIGHT = 40;
  private static readonly CARD_WIDTH = 14;
  private static readonly CARD_HEIGHT = 12;
  private static readonly MARGIN = 2;
  private static readonly CORP_Y = 2;
  private static readonly RUNNER_Y = 22;
  private static readonly LOG_HEIGHT = 6;
  private static readonly LOG_WIDTH = 76;
  private static readonly LOG_X = 2;
  private static readonly LOG_Y = 33;
  
  /**
   * Renders the game state to the terminal
   * @param gameState - The game state to render
   */
  public static renderGameState(gameState: GameState): void {
    // Create a buffer for the entire board
    const buffer = createScreenBuffer(this.BOARD_WIDTH, this.BOARD_HEIGHT);
    
    // Render the board components
    this.renderCorpSection(buffer, gameState);
    this.renderRunnerSection(buffer, gameState);
    this.renderEventLog(buffer, gameState);
    this.renderGameInfo(buffer, gameState);
    
    // Render the buffer to the terminal
    renderBufferToTerminal(buffer);
  }
  
  /**
   * Renders the Corp section of the board
   * @param buffer - The buffer to render to
   * @param gameState - The game state to render
   */
  private static renderCorpSection(buffer: string[][], gameState: GameState): void {
    // Corp header
    const corpHeader = `CORP - NPU: ${gameState.corp.npuAvailable}/${gameState.corp.npuTotal} - Cards: ${gameState.corp.hand.length}`;
    const corpHeaderFormatted = cyberpunkStyle(corpHeader);
    renderToBuffer(buffer, [corpHeaderFormatted], this.MARGIN, this.CORP_Y);
    
    // Corp core HP
    const corpHpBox = drawBox(20, 3);
    corpHpBox[1] = corpHpBox[1].substring(0, 1) + ` Core HP: ${gameState.corp.core.currentHp}/${gameState.corp.core.maxHp} ` + corpHpBox[1].substring(19);
    renderToBuffer(buffer, corpHpBox.map(line => cyberpunkStyle(line)), this.BOARD_WIDTH - 22, this.CORP_Y);
    
    // Corp field (ICE)
    this.renderCardRow(buffer, gameState.corp.field, this.MARGIN, this.CORP_Y + 4);
    
    // Draw line to separate Corp from Runner
    const separator = '─'.repeat(this.BOARD_WIDTH - 4);
    renderToBuffer(buffer, [cyberpunkStyle(`┌${separator}┐`)], 2, this.CORP_Y + 17);
  }
  
  /**
   * Renders the Runner section of the board
   * @param buffer - The buffer to render to
   * @param gameState - The game state to render
   */
  private static renderRunnerSection(buffer: string[][], gameState: GameState): void {
    // Runner header
    const runnerHeader = `RUNNER - NPU: ${gameState.runner.npuAvailable}/${gameState.runner.npuTotal} - Cards: ${gameState.runner.hand.length}`;
    const runnerHeaderFormatted = cyberpunkStyle(runnerHeader);
    renderToBuffer(buffer, [runnerHeaderFormatted], this.MARGIN, this.RUNNER_Y);
    
    // Runner field (programs)
    this.renderCardRow(buffer, gameState.runner.field, this.MARGIN, this.RUNNER_Y + 2);
  }
  
  /**
   * Renders a row of cards
   * @param buffer - The buffer to render to
   * @param cards - The cards to render
   * @param startX - The starting X position
   * @param startY - The starting Y position
   */
  private static renderCardRow(buffer: string[][], cards: Card[], startX: number, startY: number): void {
    // Limit to 5 cards per row
    const cardsToRender = cards.slice(0, 5);
    
    cardsToRender.forEach((card, index) => {
      const cardRendered = CardRenderer.renderCard(card);
      const cardX = startX + (index * (this.CARD_WIDTH + 2));
      renderToBuffer(buffer, cardRendered, cardX, startY);
    });
    
    // If there are no cards, show a placeholder
    if (cardsToRender.length === 0) {
      const emptyField = cyberpunkStyle('No cards played yet');
      renderToBuffer(buffer, [emptyField], startX, startY + 5);
    }
  }
  
  /**
   * Renders the event log section
   * @param buffer - The buffer to render to
   * @param gameState - The game state to render
   */
  private static renderEventLog(buffer: string[][], gameState: GameState): void {
    // Draw the event log box
    const logBox = drawBox(this.LOG_WIDTH, this.LOG_HEIGHT);
    renderToBuffer(buffer, logBox.map(line => cyberpunkStyle(line)), this.LOG_X, this.LOG_Y);
    
    // Get the most recent log entries (up to 4)
    const recentLogs = gameState.eventLog.slice(-4);
    
    // Render each log entry
    recentLogs.forEach((log, index) => {
      const timestamp = new Date(log.timestamp).toLocaleTimeString();
      const logLine = `${timestamp} - ${log.message}`;
      renderToBuffer(buffer, [cyberpunkStyle(logLine)], this.LOG_X + 2, this.LOG_Y + 1 + index);
    });
    
    // If there are no logs, show a placeholder
    if (recentLogs.length === 0) {
      renderToBuffer(buffer, [cyberpunkStyle('No events logged yet')], this.LOG_X + 2, this.LOG_Y + 2);
    }
  }
  
  /**
   * Renders game information (turn, phase, active player)
   * @param buffer - The buffer to render to
   * @param gameState - The game state to render
   */
  private static renderGameInfo(buffer: string[][], gameState: GameState): void {
    // Create game info box
    const infoBox = drawBox(30, 3);
    
    // Add game info
    const turnText = `Turn: ${gameState.turn}`;
    const phaseText = `Phase: ${gameState.phase}`;
    const playerText = `Active: ${gameState.activePlayer}`;
    
    // Combine all info
    const infoText = `${turnText} | ${phaseText} | ${playerText}`;
    infoBox[1] = infoBox[1].substring(0, 1) + ` ${infoText} ` + infoBox[1].substring(infoText.length + 3);
    
    // Render the info box
    renderToBuffer(buffer, infoBox.map(line => cyberpunkStyle(line)), this.BOARD_WIDTH - 32, this.LOG_Y - 4);
    
    // Add game over message if applicable
    if (gameState.gameOver) {
      const gameOverText = gameState.winner 
        ? `GAME OVER - ${gameState.winner} WINS!` 
        : 'GAME OVER';
        
      const gameOverBox = drawBox(30, 3);
      gameOverBox[1] = gameOverBox[1].substring(0, 1) + ' ' + gameOverText + ' '.repeat(28 - gameOverText.length) + gameOverBox[1].substring(29);
      
      renderToBuffer(buffer, gameOverBox.map(line => cyberpunkStyle(line)), Math.floor((this.BOARD_WIDTH - 30) / 2), Math.floor(this.BOARD_HEIGHT / 2) - 1);
    }
  }
} 