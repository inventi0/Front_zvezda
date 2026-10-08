import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { Product } from '@/app/types';
import { mockOrdersService } from './mockAdapter';
import { mockOrders, mockProducts } from './mockData';

const product: Product = {
  id: 'variant-order-test',
  name: 'Variant order test',
  slug: 'variant-order-test',
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
    { id: 'us-10', optionId: 'us', amount: 10, currency: 'USD', price: 1_100 },
  ],
};

describe('mockOrdersService variant contract', () => {
  let productsLength: number;
  let ordersLength: number;

  beforeEach(() => {
    productsLength = mockProducts.length;
    ordersLength = mockOrders.length;
    mockProducts.push(product);
  });

  afterEach(() => {
    mockProducts.splice(productsLength);
    mockOrders.splice(ordersLength);
  });

  it('stores the selected option and denomination snapshot in an order', async () => {
    const response = await mockOrdersService.createOrder({
      productId: product.id,
      optionId: 'eu',
      denominationId: 'eu-10',
      email: 'buyer@example.com',
      paymentMethod: 'card',
    });

    expect(response.order).toMatchObject({
      optionId: 'eu',
      optionLabel: 'Для аккаунта',
      optionValue: 'EU',
      denominationId: 'eu-10',
      denominationLabel: '10 EUR',
    });
  });

  it('does not create an order when denomination belongs to another option', async () => {
    await expect(mockOrdersService.createOrder({
      productId: product.id,
      optionId: 'eu',
      denominationId: 'us-10',
      email: 'buyer@example.com',
      paymentMethod: 'card',
    })).rejects.toThrow('Выбранная сумма не подходит к указанному варианту');
  });
});
