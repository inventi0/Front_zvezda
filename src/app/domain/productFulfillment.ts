import type {
  DeliveryEstimate,
  FulfillmentChannel,
  FulfillmentType,
  ProductFulfillment,
} from '@/app/types';

const FULFILLMENT_TYPE_LABELS: Record<FulfillmentType, string> = {
  'activation-code': 'Код активации',
  'account-top-up': 'Пополнение аккаунта',
};

const FULFILLMENT_CHANNEL_LABELS: Record<FulfillmentChannel, string> = {
  'protected-order-page': 'На защищённой странице заказа',
  'target-account': 'В указанном аккаунте',
};

const DELIVERY_ESTIMATE_LABELS: Record<DeliveryEstimate, string> = {
  instant: 'Моментально',
  'up-to-3-minutes': 'До 3 минут',
  'up-to-10-minutes': 'До 10 минут',
  'manual-review': 'После ручной проверки',
};

const DELIVERY_ESTIMATE_DESCRIPTIONS: Record<DeliveryEstimate, string> = {
  instant: 'После подтверждения оплаты',
  'up-to-3-minutes': 'До 3 минут после подтверждения оплаты',
  'up-to-10-minutes': 'До 10 минут после подтверждения оплаты',
  'manual-review': 'После оплаты и ручной проверки заказа',
};

export function getFulfillmentTypeLabel(type: FulfillmentType): string {
  return FULFILLMENT_TYPE_LABELS[type];
}

export function getFulfillmentChannelLabel(channel: FulfillmentChannel): string {
  return FULFILLMENT_CHANNEL_LABELS[channel];
}

export function getDeliveryEstimateLabel(estimate: DeliveryEstimate): string {
  return DELIVERY_ESTIMATE_LABELS[estimate];
}

export function getDeliveryEstimateDescription(estimate: DeliveryEstimate): string {
  return DELIVERY_ESTIMATE_DESCRIPTIONS[estimate];
}

export function getLegacyFulfillment(
  productType: unknown,
  deliverySpeed: unknown,
  deliveryTimeText: unknown,
): ProductFulfillment {
  const text = typeof deliveryTimeText === 'string' ? deliveryTimeText.toLocaleLowerCase('ru-RU') : '';
  const estimate: DeliveryEstimate = text.includes('3 минут')
    ? 'up-to-3-minutes'
    : text.includes('10 минут')
      ? 'up-to-10-minutes'
      : deliverySpeed === 'manual' || text.includes('ручн')
        ? 'manual-review'
        : 'instant';

  return productType === 'top-up'
    ? { type: 'account-top-up', channel: 'target-account', estimate }
    : { type: 'activation-code', channel: 'protected-order-page', estimate };
}
