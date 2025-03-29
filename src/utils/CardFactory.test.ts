/**
 * Tests for CardFactory utility
 */

import { CardType, ProgramType, IceType } from '../models/types';
import { 
  createNpuCard, 
  createFracterCard, 
  createBarrierCard, 
  createRunnerStarterDeck, 
  createCorpStarterDeck,
  shuffleDeck
} from './CardFactory';
import { Card } from '../models/Card';

// Mock nanoid to return predictable IDs for testing
jest.mock('nanoid', () => ({
  nanoid: () => 'test-id'
}));

describe('CardFactory', () => {
  describe('createNpuCard', () => {
    test('creates a valid NPU card', () => {
      const npu = createNpuCard();
      
      expect(npu.id).toBe('test-id');
      expect(npu.name).toBe('NPU');
      expect(npu.type).toBe(CardType.NPU);
      expect(npu.cost).toBe(0);
      expect(npu.ascii).toBeDefined();
      expect(npu.ascii.length).toBeGreaterThan(0);
      expect(npu.flavorText).toBeDefined();
      expect(npu.flavorText.length).toBeGreaterThan(0);
      expect(npu.power).toBeUndefined();
      expect(npu.toughness).toBeUndefined();
    });
  });

  describe('createFracterCard', () => {
    test('creates a valid Fracter card', () => {
      const fracter = createFracterCard();
      
      expect(fracter.id).toBe('test-id');
      expect(fracter.name).toBe('Fracter');
      expect(fracter.type).toBe(CardType.PROGRAM);
      expect(fracter.programType).toBe(ProgramType.FRACTER);
      expect(fracter.cost).toBe(1);
      expect(fracter.power).toBe(1);
      expect(fracter.toughness).toBe(2);
      expect(fracter.ascii).toBeDefined();
      expect(fracter.ascii.length).toBeGreaterThan(0);
      expect(fracter.flavorText).toBeDefined();
      expect(fracter.flavorText.length).toBeGreaterThan(0);
    });
  });

  describe('createBarrierCard', () => {
    test('creates a valid Barrier card', () => {
      const barrier = createBarrierCard();
      
      expect(barrier.id).toBe('test-id');
      expect(barrier.name).toBe('Barrier');
      expect(barrier.type).toBe(CardType.ICE);
      expect(barrier.iceType).toBe(IceType.BARRIER);
      expect(barrier.cost).toBe(1);
      expect(barrier.power).toBe(1);
      expect(barrier.toughness).toBe(1);
      expect(barrier.ascii).toBeDefined();
      expect(barrier.ascii.length).toBeGreaterThan(0);
      expect(barrier.flavorText).toBeDefined();
      expect(barrier.flavorText.length).toBeGreaterThan(0);
    });
  });

  describe('createRunnerStarterDeck', () => {
    test('creates a valid Runner starter deck', () => {
      const deck = createRunnerStarterDeck();
      
      expect(deck).toHaveLength(13); // 10 NPU + 3 Fracter
      
      // Count card types
      const npuCount = deck.filter(card => card.type === CardType.NPU).length;
      const fracterCount = deck.filter(card => card.type === CardType.PROGRAM).length;
      
      expect(npuCount).toBe(10);
      expect(fracterCount).toBe(3);
    });
  });

  describe('createCorpStarterDeck', () => {
    test('creates a valid Corp starter deck', () => {
      const deck = createCorpStarterDeck();
      
      expect(deck).toHaveLength(8); // 5 NPU + 3 Barrier
      
      // Count card types
      const npuCount = deck.filter(card => card.type === CardType.NPU).length;
      const barrierCount = deck.filter(card => card.type === CardType.ICE).length;
      
      expect(npuCount).toBe(5);
      expect(barrierCount).toBe(3);
    });
  });

  describe('shuffleDeck', () => {
    test('returns a new array with the same elements', () => {
      // Create a sample deck
      const original: Card[] = [
        { id: '1', name: 'Card 1', type: CardType.NPU, cost: 0, ascii: [], flavorText: '' },
        { id: '2', name: 'Card 2', type: CardType.NPU, cost: 0, ascii: [], flavorText: '' },
        { id: '3', name: 'Card 3', type: CardType.NPU, cost: 0, ascii: [], flavorText: '' }
      ];
      
      // Mock random to always return 0 (no shuffle)
      const mockRandom = jest.spyOn(Math, 'random').mockReturnValue(0);
      
      const shuffled = shuffleDeck(original);
      
      // Restore Math.random
      mockRandom.mockRestore();
      
      // Check that it's a new array
      expect(shuffled).not.toBe(original);
      
      // Check that all cards are still present
      expect(shuffled).toHaveLength(original.length);
      expect(shuffled).toContainEqual(original[0]);
      expect(shuffled).toContainEqual(original[1]);
      expect(shuffled).toContainEqual(original[2]);
    });

    test('shuffles the deck', () => {
      // Set up a deterministic shuffle by controlling Math.random
      let callCount = 0;
      const mockRandom = jest.spyOn(Math, 'random').mockImplementation(() => {
        callCount += 1;
        // Return values that will cause cards to swap
        return callCount % 2 === 0 ? 0 : 0.9;
      });
      
      const original: Card[] = [
        { id: '1', name: 'Card 1', type: CardType.NPU, cost: 0, ascii: [], flavorText: '' },
        { id: '2', name: 'Card 2', type: CardType.NPU, cost: 0, ascii: [], flavorText: '' },
        { id: '3', name: 'Card 3', type: CardType.NPU, cost: 0, ascii: [], flavorText: '' }
      ];
      
      const shuffled = shuffleDeck(original);
      
      // Restore Math.random
      mockRandom.mockRestore();
      
      // With our mock random values, the deck should be shuffled
      expect(shuffled).not.toEqual(original);
    });
  });
}); 