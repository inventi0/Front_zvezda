/**
 * Checkout Storage Utility
 * Safely stores and retrieves checkout data using sessionStorage
 * All data is validated before use
 */

import { logger } from '@/app/utils/logger';

export interface CheckoutData {
  productId: string;
  denominationId: string;
  email?: string;
  accountId?: string;
  region?: string;
  server?: string;
  optionId?: string;
  optionLabel?: string;
  optionValue?: string;
  /** При своей сумме: сумма пополнения и цена в ₽ */
  customAmount?: number;
  customPrice?: number;
}

const STORAGE_KEY = 'checkout_data';
const STORAGE_EXPIRY = 30 * 60 * 1000; // 30 minutes

/**
 * Store checkout data in sessionStorage
 */
export function storeCheckoutData(data: CheckoutData): void {
  try {
    const storageData = {
      ...data,
      timestamp: Date.now(),
    };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(storageData));
  } catch (error) {
    logger.error('Failed to store checkout data', error);
  }
}

/**
 * Retrieve and validate checkout data from sessionStorage
 */
export function getCheckoutData(): CheckoutData | null {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (!stored) return null;

    const data = JSON.parse(stored) as CheckoutData & { timestamp: number };

    // Check expiry
    if (Date.now() - data.timestamp > STORAGE_EXPIRY) {
      clearCheckoutData();
      return null;
    }

    // Validate required fields
    if (!data.productId) {
      clearCheckoutData();
      return null;
    }
    const isCustom = data.denominationId === 'custom';
    if (
      !data.denominationId ||
      (isCustom && (typeof data.customAmount !== 'number' || typeof data.customPrice !== 'number'))
    ) {
      clearCheckoutData();
      return null;
    }

    // Return only valid data
    return {
      productId: String(data.productId),
      denominationId: String(data.denominationId),
      email: data.email ? String(data.email) : undefined,
      accountId: data.accountId ? String(data.accountId) : undefined,
      region: data.region ? String(data.region) : undefined,
      server: data.server ? String(data.server) : undefined,
      optionId: data.optionId ? String(data.optionId) : undefined,
      optionLabel: data.optionLabel ? String(data.optionLabel) : undefined,
      optionValue: data.optionValue ? String(data.optionValue) : undefined,
      customAmount: isCustom ? Number(data.customAmount) : undefined,
      customPrice: isCustom ? Number(data.customPrice) : undefined,
    };
  } catch (error) {
    logger.error('Failed to retrieve checkout data', error);
    clearCheckoutData();
    return null;
  }
}

/**
 * Clear checkout data from sessionStorage
 */
export function clearCheckoutData(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    logger.error('Failed to clear checkout data', error);
  }
}
