import { beforeEach, describe, expect, it } from 'vitest';
import { clearCheckoutData, getCheckoutData, storeCheckoutData } from '@/app/utils/checkoutStorage';

describe('checkoutStorage', () => {
  beforeEach(() => {
    clearCheckoutData();
  });

  it('stores the initial selection without requiring an email', () => {
    storeCheckoutData({
      productId: 'steam-wallet',
      denominationId: 'steam-1000',
      accountId: 'steamuser123',
    });

    expect(getCheckoutData()).toEqual({
      productId: 'steam-wallet',
      denominationId: 'steam-1000',
      email: undefined,
      accountId: 'steamuser123',
      region: undefined,
      server: undefined,
      optionId: undefined,
      optionLabel: undefined,
      optionValue: undefined,
      customAmount: undefined,
      customPrice: undefined,
    });
  });

  it('keeps an email when checkout data already contains one', () => {
    storeCheckoutData({
      productId: 'telegram-stars',
      denominationId: 'stars-100',
      email: 'buyer@example.com',
      accountId: 'telegram_user',
    });

    expect(getCheckoutData()?.email).toBe('buyer@example.com');
  });
});
