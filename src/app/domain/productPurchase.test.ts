import { describe, expect, it } from 'vitest';
import type { Product } from '@/app/types';
import { getAccountFieldCopy, getProductPurchaseMode } from './productPurchase';

const createProduct = (overrides: Partial<Product>): Product => ({
  id: 'product',
  name: 'Product',
  slug: 'product',
  category: 'services',
  type: 'voucher',
  logo: '',
  description: '',
  denominations: [{ id: 'amount', amount: 100, currency: 'RUB', price: 100 }],
  fulfillment: { type: 'activation-code', channel: 'protected-order-page', estimate: 'instant' },
  ...overrides,
});

describe('product purchase presentation', () => {
  it('uses a custom top-up flow only for supported direct top-ups', () => {
    expect(getProductPurchaseMode(createProduct({ type: 'top-up', slug: 'steam-wallet' }))).toBe(
      'custom-top-up'
    );
    expect(getProductPurchaseMode(createProduct({ type: 'top-up', slug: 'telegram-stars' }))).toBe(
      'custom-top-up'
    );
  });

  it('prioritizes configured variants over the generic fixed offer flow', () => {
    expect(getProductPurchaseMode(createProduct({ options: [{ id: 'eu', label: 'EU' }] }))).toBe(
      'configured-offer'
    );
  });

  it('keeps gift cards and vouchers in the fixed offer flow', () => {
    expect(getProductPurchaseMode(createProduct({ type: 'gift-card' }))).toBe('fixed-offer');
  });

  it('uses service-specific account wording', () => {
    expect(getAccountFieldCopy(createProduct({ slug: 'steam-wallet' })).label).toContain('Steam');
    expect(getAccountFieldCopy(createProduct({ slug: 'telegram-stars' })).label).toContain(
      'Telegram'
    );
  });
});
