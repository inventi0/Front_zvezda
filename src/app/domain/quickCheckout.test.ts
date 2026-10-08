import { describe, expect, it } from 'vitest';
import type { Product } from '@/app/types';
import { getQuickCheckoutProducts, supportsCustomQuickCheckoutAmount } from './quickCheckout';

const createProduct = (overrides: Partial<Product>): Product => ({
  id: 'product',
  name: 'Product',
  slug: 'product',
  category: 'services',
  type: 'top-up',
  logo: '',
  description: '',
  denominations: [{ id: 'amount', amount: 100, currency: 'RUB', price: 100 }],
  fulfillment: { type: 'account-top-up', channel: 'target-account', estimate: 'instant' },
  ...overrides,
});

describe('getQuickCheckoutProducts', () => {
  it('returns only Steam and Telegram Stars in the product order', () => {
    const telegram = createProduct({ id: 'telegram', slug: 'telegram-stars' });
    const steam = createProduct({ id: 'steam', slug: 'steam-wallet' });
    const playstation = createProduct({ id: 'playstation', slug: 'playstation-wallet' });

    expect(getQuickCheckoutProducts([telegram, playstation, steam])).toEqual([steam, telegram]);
  });

  it('excludes products that cannot be purchased through the compact form', () => {
    const steamWithOptions = createProduct({
      slug: 'steam-wallet',
      options: [{ id: 'region', label: 'RU' }],
    });
    const telegramWithoutOffers = createProduct({
      slug: 'telegram-stars',
      denominations: [],
    });

    expect(getQuickCheckoutProducts([steamWithOptions, telegramWithoutOffers])).toEqual([]);
  });
});

describe('supportsCustomQuickCheckoutAmount', () => {
  it('allows a custom amount for Steam and Telegram Stars', () => {
    expect(supportsCustomQuickCheckoutAmount(createProduct({ slug: 'steam-wallet' }))).toBe(true);
    expect(supportsCustomQuickCheckoutAmount(createProduct({ slug: 'telegram-stars' }))).toBe(true);
    expect(supportsCustomQuickCheckoutAmount(createProduct({ slug: 'playstation-wallet' }))).toBe(
      false
    );
  });
});
