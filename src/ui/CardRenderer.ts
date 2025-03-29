/**
 * Card rendering utilities
 */

import { Card, isProgramCard, isIceCard, isNpuCard } from '../models/Card';
import { CardType } from '../models/types';
import { drawBox, cyberpunkStyle } from './TerminalUtils';

/**
 * Class for rendering cards to ASCII art
 */
export class CardRenderer {
  // Card dimensions
  private static readonly CARD_WIDTH = 14;
  private static readonly CARD_HEIGHT = 12;
  
  /**
   * Renders a card to a string array
   * @param card - The card to render
   * @returns An array of strings representing the rendered card
   */
  public static renderCard(card: Card): string[] {
    // Create the basic box for the card
    const cardBox = drawBox(this.CARD_WIDTH, this.CARD_HEIGHT);
    
    // Add card content based on type
    this.renderCardName(cardBox, card);
    this.renderCardType(cardBox, card);
    this.renderCardCost(cardBox, card);
    this.renderCardStats(cardBox, card);
    this.renderCardAscii(cardBox, card);
    this.renderCardFlavorText(cardBox, card);
    
    // Apply styling
    return cardBox.map(line => cyberpunkStyle(line));
  }
  
  /**
   * Renders the card's name
   * @param cardBox - The card box to render into
   * @param card - The card to render
   */
  private static renderCardName(cardBox: string[], card: Card): void {
    const name = this.truncateText(card.name, this.CARD_WIDTH - 4);
    const centeredName = this.centerText(name, this.CARD_WIDTH - 2);
    cardBox[1] = cardBox[1].substring(0, 1) + centeredName + cardBox[1].substring(this.CARD_WIDTH - 1);
  }
  
  /**
   * Renders the card's type
   * @param cardBox - The card box to render into
   * @param card - The card to render
   */
  private static renderCardType(cardBox: string[], card: Card): void {
    let typeText = card.type.toString();
    
    // Add subtype for program and ICE
    if (isProgramCard(card)) {
      typeText += `/${card.programType}`;
    } else if (isIceCard(card)) {
      typeText += `/${card.iceType}`;
    }
    
    const truncatedType = this.truncateText(typeText, this.CARD_WIDTH - 4);
    const centeredType = this.centerText(truncatedType, this.CARD_WIDTH - 2);
    cardBox[2] = cardBox[2].substring(0, 1) + centeredType + cardBox[2].substring(this.CARD_WIDTH - 1);
  }
  
  /**
   * Renders the card's cost
   * @param cardBox - The card box to render into
   * @param card - The card to render
   */
  private static renderCardCost(cardBox: string[], card: Card): void {
    const cost = `Cost: ${card.cost}`;
    cardBox[3] = cardBox[3].substring(0, 1) + ` ${cost}` + ' '.repeat(this.CARD_WIDTH - cost.length - 3) + cardBox[3].substring(this.CARD_WIDTH - 1);
  }
  
  /**
   * Renders the card's stats (power & toughness)
   * @param cardBox - The card box to render into
   * @param card - The card to render
   */
  private static renderCardStats(cardBox: string[], card: Card): void {
    // Only render stats for cards that have them
    if (card.power !== undefined && card.toughness !== undefined) {
      const stats = `${card.power}/${card.toughness}`;
      cardBox[3] = cardBox[3].substring(0, this.CARD_WIDTH - stats.length - 2) + stats + ' ' + cardBox[3].substring(this.CARD_WIDTH - 1);
    }
  }
  
  /**
   * Renders the card's ASCII art
   * @param cardBox - The card box to render into
   * @param card - The card to render
   */
  private static renderCardAscii(cardBox: string[], card: Card): void {
    const asciiStart = 4;
    const asciiLines = Math.min(card.ascii.length, 5); // Limit to 5 lines
    
    for (let i = 0; i < asciiLines; i++) {
      const line = card.ascii[i];
      const truncatedLine = this.truncateText(line, this.CARD_WIDTH - 4);
      const centeredLine = this.centerText(truncatedLine, this.CARD_WIDTH - 2);
      cardBox[asciiStart + i] = cardBox[asciiStart + i].substring(0, 1) + centeredLine + cardBox[asciiStart + i].substring(this.CARD_WIDTH - 1);
    }
  }
  
  /**
   * Renders the card's flavor text
   * @param cardBox - The card box to render into
   * @param card - The card to render
   */
  private static renderCardFlavorText(cardBox: string[], card: Card): void {
    // Start at the line after ASCII art
    const flavorStart = 9;
    
    // Split flavor text into multiple lines if needed
    const flavorLines = this.wrapText(card.flavorText, this.CARD_WIDTH - 4);
    const lineCount = Math.min(flavorLines.length, 2); // Limit to 2 lines
    
    for (let i = 0; i < lineCount; i++) {
      const line = flavorLines[i];
      cardBox[flavorStart + i] = cardBox[flavorStart + i].substring(0, 1) + ' ' + line + ' '.repeat(this.CARD_WIDTH - line.length - 3) + cardBox[flavorStart + i].substring(this.CARD_WIDTH - 1);
    }
  }
  
  /**
   * Truncates text to the given length
   * @param text - The text to truncate
   * @param maxLength - The maximum length of the text
   * @returns The truncated text
   */
  private static truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) {
      return text;
    }
    
    return text.substring(0, maxLength - 3) + '...';
  }
  
  /**
   * Centers text within a given width
   * @param text - The text to center
   * @param width - The width to center within
   * @returns The centered text
   */
  private static centerText(text: string, width: number): string {
    const padding = width - text.length;
    const leftPadding = Math.floor(padding / 2);
    const rightPadding = padding - leftPadding;
    
    return ' '.repeat(leftPadding) + text + ' '.repeat(rightPadding);
  }
  
  /**
   * Wraps text to fit within a given width
   * @param text - The text to wrap
   * @param width - The maximum width of each line
   * @returns An array of wrapped lines
   */
  private static wrapText(text: string, width: number): string[] {
    if (text.length <= width) {
      return [text];
    }
    
    const result: string[] = [];
    let remaining = text;
    
    while (remaining.length > 0) {
      if (remaining.length <= width) {
        result.push(remaining);
        break;
      }
      
      let lineEnd = width;
      
      // Find a good breaking point
      while (lineEnd > 0 && remaining[lineEnd] !== ' ' && remaining[lineEnd] !== '\n') {
        lineEnd--;
      }
      
      // If no space found, hard break at width
      if (lineEnd === 0) {
        lineEnd = width;
      }
      
      result.push(remaining.substring(0, lineEnd).trim());
      remaining = remaining.substring(lineEnd).trim();
    }
    
    return result;
  }
} 