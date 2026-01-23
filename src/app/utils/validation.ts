/**
 * Validation Utilities
 * Business logic for form validation
 */

import type { ValidationResult, FormErrors } from '@/app/types';
import type { ProductType } from '@/app/types';

/**
 * Validate email address
 */
export function validateEmail(email: string): ValidationResult {
  if (!email) {
    return { valid: false, error: 'Email обязателен' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { valid: false, error: 'Email введен неверно' };
  }

  return { valid: true };
}

/**
 * Validate account ID based on product type
 */
export function validateAccountId(
  accountId: string,
  productType: ProductType
): ValidationResult {
  if (!accountId) {
    return { valid: false, error: 'ID аккаунта обязателен' };
  }

  // Minimum length check
  if (accountId.length < 3) {
    return { valid: false, error: 'Проверьте формат ID' };
  }

  // Type-specific validation
  switch (productType) {
    case 'top-up':
      // Steam ID, Telegram username, etc. - alphanumeric and some special chars
      if (!/^[a-zA-Z0-9_-]+$/.test(accountId)) {
        return { valid: false, error: 'ID содержит недопустимые символы' };
      }
      break;

    case 'voucher':
    case 'gift-card':
      // For vouchers/gift cards, account ID might not be required
      // But if provided, validate it
      break;
  }

  return { valid: true };
}

/**
 * Validate order form data
 */
export function validateOrderForm(data: {
  email: string;
  accountId?: string;
  amount?: string;
  productType?: ProductType;
}): FormErrors {
  const errors: FormErrors = {};

  // Validate email
  const emailValidation = validateEmail(data.email);
  if (!emailValidation.valid) {
    errors.email = emailValidation.error;
  }

  // Validate account ID if required
  if (data.productType === 'top-up' && data.accountId !== undefined) {
    const accountIdValidation = validateAccountId(data.accountId, data.productType);
    if (!accountIdValidation.valid) {
      errors.accountId = accountIdValidation.error;
    }
  }

  // Validate amount
  if (!data.amount) {
    errors.amount = 'Выберите сумму';
  }

  return errors;
}

/**
 * Check if form has errors
 */
export function hasFormErrors(errors: FormErrors): boolean {
  return Object.keys(errors).length > 0;
}
