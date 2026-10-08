import { describe, expect, it } from 'vitest';
import {
  getDeliveryEstimateDescription,
  getFulfillmentChannelLabel,
  getFulfillmentTypeLabel,
  getLegacyFulfillment,
} from './productFulfillment';
import { ProductSchema } from '@/app/types/schemas';

describe('product fulfillment presentation', () => {
  it('keeps fulfillment type, delivery channel and estimate independent', () => {
    expect(getFulfillmentTypeLabel('activation-code')).toBe('Код активации');
    expect(getFulfillmentChannelLabel('protected-order-page')).toBe('На защищённой странице заказа');
    expect(getDeliveryEstimateDescription('up-to-10-minutes')).toBe('До 10 минут после подтверждения оплаты');
  });

  it('migrates a legacy voucher without treating its speed as a product type', () => {
    expect(getLegacyFulfillment('voucher', 'fast', 'До 10 минут')).toEqual({
      type: 'activation-code',
      channel: 'protected-order-page',
      estimate: 'up-to-10-minutes',
    });
  });

  it('keeps account top-ups out of the code delivery flow', () => {
    expect(getLegacyFulfillment('top-up', 'instant', 'Моментально')).toEqual({
      type: 'account-top-up',
      channel: 'target-account',
      estimate: 'instant',
    });
  });

  it('keeps legacy persisted products readable during the schema migration', () => {
    const migrated = ProductSchema.parse({
      id: 'legacy-voucher',
      name: 'Legacy voucher',
      slug: 'legacy-voucher',
      category: 'wallet',
      type: 'voucher',
      logo: '',
      description: '',
      denominations: [],
      deliverySpeed: 'fast',
      deliveryTimeText: 'До 10 минут',
    });

    expect(migrated.fulfillment).toEqual({
      type: 'activation-code',
      channel: 'protected-order-page',
      estimate: 'up-to-10-minutes',
    });
    expect(migrated).not.toHaveProperty('deliveryTimeText');
    expect(migrated).not.toHaveProperty('deliverySpeed');
  });
});
