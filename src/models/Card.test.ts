/**
 * Tests for Card models
 */

import { CardType, ProgramType, IceType } from './types';
import { Card, NpuCard, ProgramCard, IceCard, isNpuCard, isProgramCard, isIceCard } from './Card';

describe('Card Models', () => {
  describe('Card interface', () => {
    test('can create a basic card', () => {
      const card: Card = {
        id: '123',
        name: 'Test Card',
        type: CardType.NPU,
        cost: 1,
        ascii: ['Test ASCII'],
        flavorText: 'Test flavor text'
      };

      expect(card.id).toBe('123');
      expect(card.name).toBe('Test Card');
      expect(card.type).toBe(CardType.NPU);
      expect(card.cost).toBe(1);
      expect(card.ascii).toEqual(['Test ASCII']);
      expect(card.flavorText).toBe('Test flavor text');
      expect(card.power).toBeUndefined();
      expect(card.toughness).toBeUndefined();
    });

    test('can create a card with power and toughness', () => {
      const card: Card = {
        id: '456',
        name: 'Combat Card',
        type: CardType.PROGRAM,
        cost: 2,
        power: 1,
        toughness: 2,
        ascii: ['Combat ASCII'],
        flavorText: 'Combat flavor text'
      };

      expect(card.power).toBe(1);
      expect(card.toughness).toBe(2);
    });

    test('can create a card with custom properties', () => {
      const card: Card = {
        id: '789',
        name: 'Custom Card',
        type: CardType.ICE,
        cost: 3,
        ascii: ['Custom ASCII'],
        flavorText: 'Custom flavor text',
        properties: {
          specialAbility: 'Draw a card',
          targetType: 'runner'
        }
      };

      expect(card.properties).toBeDefined();
      expect(card.properties?.specialAbility).toBe('Draw a card');
      expect(card.properties?.targetType).toBe('runner');
    });
  });

  describe('Specialized card types', () => {
    test('can create an NPU card', () => {
      const npuCard: NpuCard = {
        id: 'npu1',
        name: 'Neural Processor',
        type: CardType.NPU,
        cost: 0,
        ascii: ['NPU ASCII'],
        flavorText: 'Boost your processing power.'
      };

      expect(npuCard.type).toBe(CardType.NPU);
    });

    test('can create a Program card', () => {
      const programCard: ProgramCard = {
        id: 'prog1',
        name: 'Fracter',
        type: CardType.PROGRAM,
        programType: ProgramType.FRACTER,
        cost: 1,
        power: 1,
        toughness: 2,
        ascii: ['Fracter ASCII'],
        flavorText: 'Breaks through barriers.'
      };

      expect(programCard.type).toBe(CardType.PROGRAM);
      expect(programCard.programType).toBe(ProgramType.FRACTER);
      expect(programCard.power).toBe(1);
      expect(programCard.toughness).toBe(2);
    });

    test('can create an ICE card', () => {
      const iceCard: IceCard = {
        id: 'ice1',
        name: 'Barrier',
        type: CardType.ICE,
        iceType: IceType.BARRIER,
        cost: 1,
        power: 1,
        toughness: 1,
        ascii: ['Barrier ASCII'],
        flavorText: 'Keeps runners out.'
      };

      expect(iceCard.type).toBe(CardType.ICE);
      expect(iceCard.iceType).toBe(IceType.BARRIER);
      expect(iceCard.power).toBe(1);
      expect(iceCard.toughness).toBe(1);
    });
  });

  describe('Type guards', () => {
    const npuCard: Card = {
      id: 'npu2',
      name: 'NPU',
      type: CardType.NPU,
      cost: 0,
      ascii: ['NPU'],
      flavorText: 'NPU'
    };

    const programCard: Card = {
      id: 'prog2',
      name: 'Program',
      type: CardType.PROGRAM,
      cost: 1,
      power: 1,
      toughness: 1,
      ascii: ['Program'],
      flavorText: 'Program'
    };

    const iceCard: Card = {
      id: 'ice2',
      name: 'ICE',
      type: CardType.ICE,
      cost: 1,
      power: 1,
      toughness: 1,
      ascii: ['ICE'],
      flavorText: 'ICE'
    };

    test('isNpuCard correctly identifies NPU cards', () => {
      expect(isNpuCard(npuCard)).toBe(true);
      expect(isNpuCard(programCard)).toBe(false);
      expect(isNpuCard(iceCard)).toBe(false);
    });

    test('isProgramCard correctly identifies Program cards', () => {
      expect(isProgramCard(npuCard)).toBe(false);
      expect(isProgramCard(programCard)).toBe(true);
      expect(isProgramCard(iceCard)).toBe(false);
    });

    test('isIceCard correctly identifies ICE cards', () => {
      expect(isIceCard(npuCard)).toBe(false);
      expect(isIceCard(programCard)).toBe(false);
      expect(isIceCard(iceCard)).toBe(true);
    });
  });
}); 