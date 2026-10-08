import type { Product } from '@/app/types';
import { supportsCustomQuickCheckoutAmount } from '@/app/domain/quickCheckout';

export type ProductPurchaseMode = 'custom-top-up' | 'configured-offer' | 'fixed-offer';

export interface AccountFieldCopy {
  label: string;
  placeholder: string;
  helpTitle: string;
}

export function getProductPurchaseMode(product: Product): ProductPurchaseMode {
  if (product.options?.length) return 'configured-offer';
  if (product.type === 'top-up' && supportsCustomQuickCheckoutAmount(product)) {
    return 'custom-top-up';
  }
  return 'fixed-offer';
}

export function getAccountFieldCopy(product: Product): AccountFieldCopy {
  if (product.slug === 'steam-wallet') {
    return {
      label: 'Steam ID или имя аккаунта',
      placeholder: 'steamuser123',
      helpTitle: 'Как найти данные аккаунта Steam?',
    };
  }

  if (product.slug === 'telegram-stars') {
    return {
      label: 'Имя пользователя Telegram',
      placeholder: 'username',
      helpTitle: 'Где найти имя пользователя Telegram?',
    };
  }

  return {
    label: 'ID или имя аккаунта',
    placeholder: 'Введите данные аккаунта',
    helpTitle: 'Где найти данные аккаунта?',
  };
}
