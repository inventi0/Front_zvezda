import { describe, expect, it } from 'vitest';
import type { Product } from '@/app/types';
import { getCustomerOptionCopy, getDenominationsForOption, resolveProductSelection, toggleSelection } from './productSelection';

const product: Product = {
  id: 'steam',
  name: 'Steam Wallet Code',
  slug: 'steam-wallet-code',
  category: 'wallet',
  type: 'voucher',
  logo: '',
  description: 'Test product',
  fulfillment: {
    type: 'activation-code',
    channel: 'protected-order-page',
    estimate: 'up-to-10-minutes',
  },
  optionLabel: 'Рынок активации',
  options: [
    { id: 'eu', label: 'EU', description: 'EUR' },
    { id: 'us', label: 'US', description: 'USD' },
  ],
  denominations: [
    { id: 'eu-10', optionId: 'eu', amount: 10, currency: 'EUR', price: 1_000 },
    { id: 'eu-unavailable', optionId: 'eu', amount: 20, currency: 'EUR', price: 0 },
    { id: 'us-10', optionId: 'us', amount: 10, currency: 'USD', price: 1_100 },
  ],
};

describe('product selection', () => {
  it('turns supplier terminology into customer-facing copy', () => {
    expect(getCustomerOptionCopy('Рынок активации')).toEqual({
      label: 'Для аккаунта',
      question: 'Где зарегистрирован аккаунт?',
    });
    expect(getCustomerOptionCopy('Платформа').question).toBe('Где будете использовать?');
  });

  it('clears a selection when the active value is pressed again', () => {
    expect(toggleSelection('eu', 'eu')).toBe('');
    expect(toggleSelection('eu', 'us')).toBe('us');
  });

  it('shows only purchasable denominations of the selected option', () => {
    expect(getDenominationsForOption(product, 'eu').map((item) => item.id)).toEqual(['eu-10']);
    expect(getDenominationsForOption(product, 'us').map((item) => item.id)).toEqual(['us-10']);
    expect(getDenominationsForOption(product)).toEqual([]);
  });

  it('resolves a denomination together with its option', () => {
    const selection = resolveProductSelection(product, 'eu', 'eu-10');

    expect(selection.option?.label).toBe('EU');
    expect(selection.denomination.currency).toBe('EUR');
  });

  it('rejects a denomination from a different option', () => {
    expect(() => resolveProductSelection(product, 'eu', 'us-10')).toThrow(
      'Выбранная сумма не подходит к указанному варианту',
    );
  });

  it('rejects unavailable denominations', () => {
    expect(() => resolveProductSelection(product, 'eu', 'eu-unavailable')).toThrow(
      'Выбранная сумма сейчас недоступна',
    );
  });
});
