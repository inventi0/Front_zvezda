/**
 * Order Calculation Utilities
 * Business logic for calculating order totals and commissions
 */

import type { OrderCalculation } from '@/app/types';
import type { Product } from '@/app/types';
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

/** Result of seller income calculation. */
export interface SellerIncomeResult {
  /** Amount buyer pays (basePrice + commission). */
  buyerTotal: number;
  /** Commission taken by platform. */
  commission: number;
  /** Commission as fraction (e.g. 0.1 = 10%). */
  commissionPercent: number;
  /** Amount seller receives (basePrice). "Ты получаешь X". */
  sellerIncome: number;
}

/**
 * Calculate seller income. Pure function, no backend.
 * Seller receives basePrice; platform takes commission.
 *
 * @param basePrice - Sale amount (e.g. denomination price)
 * @param commissionPercent - Commission as fraction (default from config)
 * @returns Seller income, commission, buyer total
 */
export function sellerIncomeCalculator(
  basePrice: number,
  commissionPercent: number = COMMISSION_PERCENT
): SellerIncomeResult {
  const commission = Math.round(basePrice * commissionPercent);
  const buyerTotal = basePrice + commission;

  return {
    buyerTotal,
    commission,
    commissionPercent,
    sellerIncome: basePrice,
  };
}

const CUSTOM_AMOUNT_MIN = 10;
const CUSTOM_AMOUNT_MAX = 999_999;

/** Лимиты своей суммы: от 10 ₽ до 999 999 ₽. В UI показываем только минимум. */
export function getCustomAmountLimits(_product?: Product): { min: number; max: number } {
  if (_product?.slug === 'telegram-stars' && _product.denominations.length) {
    return {
      min: Math.min(..._product.denominations.map((denomination) => denomination.amount)),
      max: CUSTOM_AMOUNT_MAX,
    };
  }

  return { min: CUSTOM_AMOUNT_MIN, max: CUSTOM_AMOUNT_MAX };
}

/** Compute a custom top-up price from the product's published offers. */
export function computeCustomPrice(amount: number, product: Product): number {
  const denoms = product.denominations;
  if (!denoms.length) return amount;

  const exactDenomination = denoms.find((denomination) => denomination.amount === amount);
  if (exactDenomination) return exactDenomination.price;

  const baseDenomination = denoms.reduce((smallest, denomination) =>
    denomination.amount < smallest.amount ? denomination : smallest
  );
  const rate = baseDenomination.price / baseDenomination.amount;
  return Math.round(amount * rate);
}
