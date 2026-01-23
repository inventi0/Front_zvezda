/**
 * Order Calculation Utilities
 * Business logic for calculating order totals and commissions
 */

import type { OrderCalculation } from '@/app/types';
import { config } from '@/app/config/env';

// Источник истины комиссии — конфиг, который в реальной системе приходит с backend
const COMMISSION_PERCENT = config.gatewayCommissionPercent;

/**
 * Calculate order total with commission
 * 
 * @param basePrice - Base price of the product/denomination
 * @param commissionPercent - Commission percentage (default: 10%)
 * @returns Calculation result with base price, commission, and total
 */
export function calculateOrderTotal(
  basePrice: number,
  commissionPercent: number = COMMISSION_PERCENT
): OrderCalculation {
  const commission = Math.round(basePrice * commissionPercent);
  const total = basePrice + commission;

  return {
    basePrice,
    commission,
    commissionPercent,
    total,
  };
}

/**
 * Calculate commission from total amount
 * 
 * @param total - Total amount including commission
 * @param commissionPercent - Commission percentage (default: 10%)
 * @returns Commission amount
 */
export function calculateCommissionFromTotal(
  total: number,
  commissionPercent: number = COMMISSION_PERCENT
): number {
  // If total includes commission, extract it
  // total = basePrice * (1 + commissionPercent)
  // basePrice = total / (1 + commissionPercent)
  // commission = total - basePrice
  const basePrice = total / (1 + commissionPercent);
  return Math.round(total - basePrice);
}

/**
 * Format price for display
 * 
 * @param amount - Amount to format
 * @param currency - Currency code (default: 'RUB')
 * @returns Formatted price string
 */
export function formatPrice(amount: number, currency: string = 'RUB'): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
