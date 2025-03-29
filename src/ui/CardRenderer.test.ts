/**
 * Tests for CardRenderer
 */

import { CardRenderer } from './CardRenderer';
import { Card, ProgramCard, IceCard } from '../models/Card';
import { CardType, ProgramType, IceType } from '../models/types';
import * as TerminalUtils from './TerminalUtils';

// Mock TerminalUtils functions
jest.mock('./TerminalUtils', () => ({
  drawBox: jest.fn((width, height) => {
    const result = [];
    result.push('┌' + '─'.repeat(width - 2) + '┐');
    for (let i = 0; i < height - 2; i++) {
      result.push('│' + ' '.repeat(width - 2) + '│');
    }
    result.push('└' + '─'.repeat(width - 2) + '┘');
    return result;
  }),
  cyberpunkStyle: jest.fn((text) => text) // No styling in tests
}));

describe('CardRenderer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('renderCard', () => {
    test('renders an NPU card correctly', () => {
      const npuCard: Card = {
        id: 'npu1',
        name: 'Test NPU',
        type: CardType.NPU,
        cost: 2,
        ascii: ['   []   ', ' |____| '],
        flavorText: 'Neural Processing Unit'
      };
      
      const result = CardRenderer.renderCard(npuCard);
      
      // Check that the card has the correct dimensions
      expect(result.length).toBe(12); // Card height
      expect(result[0].length).toBe(14); // Card width
      
      // Check that card content is rendered
      const cardText = result.join('\n');
      expect(cardText).toContain('  Test NPU  ');
      expect(cardText).toContain('    NPU     ');
      expect(cardText).toContain(' Cost: 2    ');
      expect(cardText).toContain('     []     ');
      expect(cardText).toContain(' Neural     ');
      expect(cardText).toContain(' Processing ');
      
      // Check that TerminalUtils.drawBox was called with correct dimensions
      expect(TerminalUtils.drawBox).toHaveBeenCalledWith(14, 12);
      
      // Check that TerminalUtils.cyberpunkStyle was called for each line
      expect(TerminalUtils.cyberpunkStyle).toHaveBeenCalledTimes(12);
    });
    
    test('renders a Program card correctly', () => {
      const programCard: ProgramCard = {
        id: 'prog1',
        name: 'Test Program',
        type: CardType.PROGRAM,
        programType: ProgramType.FRACTER,
        cost: 3,
        power: 2,
        toughness: 4,
        ascii: [' /\\ ', '/  \\', '----'],
        flavorText: 'Breaking ICE since 2077'
      };
      
      const result = CardRenderer.renderCard(programCard);
      
      // Check that the card has the correct dimensions
      expect(result.length).toBe(12);
      expect(result[0].length).toBe(14);
      
      // Check that card content is rendered
      const cardText = result.join('\n');
      expect(cardText).toContain(' Test Pr... '); // Truncated due to length
      expect(cardText).toContain(' PROGRAM... '); // Truncated due to length
      expect(cardText).toContain(' Cost: 3'); // Cost on the left
      expect(cardText).toContain('2/4'); // Power/Toughness on the right
      expect(cardText).toContain('     /\\     ');
      expect(cardText).toContain(' Breaking   ');
    });
    
    test('renders an ICE card correctly', () => {
      const iceCard: IceCard = {
        id: 'ice1',
        name: 'Test ICE',
        type: CardType.ICE,
        iceType: IceType.BARRIER,
        cost: 4,
        power: 3,
        toughness: 5,
        ascii: ['######', '#    #', '######'],
        flavorText: 'Cannot be broken easily'
      };
      
      const result = CardRenderer.renderCard(iceCard);
      
      // Check that the card has the correct dimensions
      expect(result.length).toBe(12);
      expect(result[0].length).toBe(14);
      
      // Check that card content is rendered
      const cardText = result.join('\n');
      expect(cardText).toContain('  Test ICE  ');
      expect(cardText).toContain(' ICE/BAR... '); // Truncated due to length
      expect(cardText).toContain(' Cost: 4'); // Cost on the left
      expect(cardText).toContain('3/5'); // Power/Toughness on the right
      expect(cardText).toContain('   ######   ');
      expect(cardText).toContain(' Cannot be  ');
    });
  });
  
  describe('text handling', () => {
    test('truncates long card names', () => {
      const longNameCard: Card = {
        id: 'long1',
        name: 'This is an extremely long card name that should be truncated',
        type: CardType.NPU,
        cost: 1,
        ascii: ['-'],
        flavorText: 'Short flavor'
      };
      
      const result = CardRenderer.renderCard(longNameCard);
      
      // The name should be truncated with ellipsis
      const cardText = result.join('\n');
      expect(cardText).toContain(' This is... '); // Truncated with ellipsis
      expect(cardText).not.toContain('extremely long card name');
    });
    
    test('wraps long flavor text', () => {
      const longFlavorCard: Card = {
        id: 'flavor1',
        name: 'Short Name',
        type: CardType.NPU,
        cost: 1,
        ascii: ['-'],
        flavorText: 'This is an extremely long flavor text that should be wrapped to multiple lines for better display'
      };
      
      const result = CardRenderer.renderCard(longFlavorCard);
      
      // Check that there are two lines of flavor text (the maximum allowed)
      const cardText = result.join('\n');
      expect(cardText).toContain(' This is an ');
      expect(cardText).toContain(' extremely  ');
      
      // Check that there are no more than 2 lines of flavor text
      const flavorLineCount = (cardText.match(/This is an/g) || []).length + 
                             (cardText.match(/extremely/g) || []).length;
      
      expect(flavorLineCount).toBeLessThanOrEqual(2);
    });
  });
}); 