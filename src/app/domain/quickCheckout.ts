import type { Product } from '@/app/types';

const QUICK_CHECKOUT_PRODUCT_SLUGS = ['steam-wallet', 'telegram-stars'] as const;

export function getQuickCheckoutProducts(products: Product[]): Product[] {
  return QUICK_CHECKOUT_PRODUCT_SLUGS.flatMap((slug) => {
    const product = products.find(
      (item) =>
        item.slug === slug &&
        item.type === 'top-up' &&
        !item.options?.length &&
        item.denominations.length > 0
    );

    return product ? [product] : [];
  });
}

export function supportsCustomQuickCheckoutAmount(product: Product | undefined): boolean {
  return product?.slug === 'steam-wallet' || product?.slug === 'telegram-stars';
}
