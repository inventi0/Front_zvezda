import { describe, it, expect } from 'vitest';
import {
  calculateOrderTotal,
  calculateCommissionFromTotal,
  computeCustomPrice,
  formatPrice,
  getCustomAmountLimits,
  sellerIncomeCalculator,
} from './orderCalculation';
import type { Product } from '@/app/types';

const telegramStarsProduct = {
  id: 'telegram-stars',
  name: 'Telegram Stars',
  slug: 'telegram-stars',
  category: 'services',
  type: 'top-up',
  logo: '',
  description: '',
  denominations: [
    { id: 'stars-100', amount: 100, currency: 'Stars', price: 199 },
    { id: 'stars-500', amount: 500, currency: 'Stars', price: 899 },
  ],
  fulfillment: { type: 'account-top-up', channel: 'target-account', estimate: 'instant' },
} satisfies Product;

describe('orderCalculation', () => {
  describe('calculateOrderTotal', () => {
    it('should calculate commission and total correctly', () => {
      const result = calculateOrderTotal(1000);
      expect(result.basePrice).toBe(1000);
      expect(result.commission).toBe(100); // 10% of 1000
      expect(result.total).toBe(1100);
      expect(result.commissionPercent).toBe(0.1);
    });

    it('should handle zero price', () => {
      const result = calculateOrderTotal(0);
      expect(result.basePrice).toBe(0);
      expect(result.commission).toBe(0);
      expect(result.total).toBe(0);
    });

    it('should round commission correctly', () => {
      const result = calculateOrderTotal(999);
      expect(result.commission).toBe(100); // Math.round(999 * 0.1) = 100
      expect(result.total).toBe(1099);
    });

    it('should accept custom commission percent', () => {
      const result = calculateOrderTotal(1000, 0.15);
      expect(result.commission).toBe(150);
      expect(result.total).toBe(1150);
      expect(result.commissionPercent).toBe(0.15);
    });
  });

  describe('calculateCommissionFromTotal', () => {
    it('should extract commission from total', () => {
      const commission = calculateCommissionFromTotal(1100);
      expect(commission).toBe(100);
    });

    it('should handle zero total', () => {
      const commission = calculateCommissionFromTotal(0);
      expect(commission).toBe(0);
    });
  });

  describe('formatPrice', () => {
    it('should format price in RUB by default', () => {
      const formatted = formatPrice(1000);
      expect(formatted).toContain('1');
      expect(formatted).toContain('000');
    });

    it('should format price with custom currency', () => {
      const formatted = formatPrice(100, 'USD');
      expect(formatted).toContain('100');
    });
  });

  describe('sellerIncomeCalculator', () => {
    it('should return seller income = basePrice, commission, buyerTotal', () => {
      const r = sellerIncomeCalculator(1000);
      expect(r.sellerIncome).toBe(1000);
      expect(r.commission).toBe(100);
      expect(r.buyerTotal).toBe(1100);
      expect(r.commissionPercent).toBe(0.1);
    });

    it('should accept custom commission percent', () => {
      const r = sellerIncomeCalculator(1000, 0.15);
      expect(r.sellerIncome).toBe(1000);
      expect(r.commission).toBe(150);
      expect(r.buyerTotal).toBe(1150);
    });
  });

  describe('custom amount pricing', () => {
    it('uses the smallest published Stars package as the minimum', () => {
      expect(getCustomAmountLimits(telegramStarsProduct).min).toBe(100);
    });

    it('keeps an exact package price when the amount matches a published offer', () => {
      expect(computeCustomPrice(500, telegramStarsProduct)).toBe(899);
    });

    it('prices another Stars amount from the base package rate', () => {
      expect(computeCustomPrice(250, telegramStarsProduct)).toBe(498);
    });
  });
});
