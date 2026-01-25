/**
 * Хранилище переписки с поддержкой по заказу.
 * Ключ: orderId. Сохраняем в sessionStorage.
 */

export interface OrderSupportMessage {
  id: string;
  author: 'user' | 'operator';
  text: string;
  createdAt: string;
}

const PREFIX = 'zvezda_order_support_';

export function getOrderSupportMessages(orderId: string): OrderSupportMessage[] {
  try {
    const raw = sessionStorage.getItem(PREFIX + orderId);
    if (!raw) return [];
    const data = JSON.parse(raw) as { messages: OrderSupportMessage[] };
    return Array.isArray(data.messages) ? data.messages : [];
  } catch {
    return [];
  }
}

export function appendOrderSupportMessages(
  orderId: string,
  messages: OrderSupportMessage[]
): void {
  const prev = getOrderSupportMessages(orderId);
  const next = [...prev, ...messages];
  try {
    sessionStorage.setItem(
      PREFIX + orderId,
      JSON.stringify({ messages: next, updatedAt: new Date().toISOString() })
    );
  } catch {
    /* ignore storage errors */
  }
}
