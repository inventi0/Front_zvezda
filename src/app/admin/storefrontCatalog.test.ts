import { afterEach, expect, it, vi } from 'vitest';
import {
  catalogProducts,
  createEmptyOverride,
  loadCatalogSettings,
  saveProductOverride,
} from '@/app/admin/catalog';
import { getPublishedStorefrontProducts } from '@/app/admin/storefrontCatalog';

afterEach(() => {
  localStorage.removeItem('zvezda.admin.catalog.v1');
  localStorage.removeItem('zvezda.storefront.catalog.v1');
});

function getSteamProduct() {
  const product = catalogProducts.find((item) => item.id === 'steam-wallet-code');
  if (!product) throw new Error('Steam fixture is missing');
  return product;
}

it('rejects publication when required storefront content is missing', () => {
  const product = getSteamProduct();
  expect(() => saveProductOverride(product.id, {
    ...createEmptyOverride(product),
    publication: 'published',
  })).toThrow('Для публикации заполните');
  expect(getPublishedStorefrontProducts()).toEqual([]);
});

it('projects a validated published parent product to the storefront', () => {
  const product = getSteamProduct();
  saveProductOverride(product.id, {
    ...createEmptyOverride(product),
    title: 'Steam Wallet Code',
    description: 'Цифровой код Steam с выбором рынка активации.',
    publication: 'published',
    popular: true,
    media: {
      storefront: 'https://cdn.example.com/steam-card.webp',
      logo: 'https://cdn.example.com/steam-logo.svg',
      productPage: 'https://cdn.example.com/steam-product.webp',
      gallery: [],
    },
  });

  const storefrontProduct = getPublishedStorefrontProducts().find((item) => item.id === `wata:${product.id}`);
  expect(storefrontProduct).toMatchObject({
    name: 'Steam Wallet Code',
    slug: 'wata-steam-wallet-code',
    type: 'voucher',
    popular: true,
    optionLabel: 'Рынок активации',
    image: 'https://cdn.example.com/steam-card.webp',
    fulfillment: {
      type: 'activation-code',
      channel: 'protected-order-page',
      estimate: 'up-to-10-minutes',
    },
  });
  expect(storefrontProduct?.options?.length).toBeGreaterThan(1);
  expect(storefrontProduct?.denominations.length).toBeGreaterThan(0);
  expect(storefrontProduct?.denominations.every((item) => item.optionId && item.price > 0)).toBe(true);
});

it('removes a product from the storefront after publication is disabled', () => {
  const product = getSteamProduct();
  const configured = {
    ...createEmptyOverride(product),
    title: 'Steam Wallet Code',
    description: 'Цифровой код Steam.',
    publication: 'published' as const,
    media: {
      storefront: 'https://cdn.example.com/steam-card.webp',
      logo: 'https://cdn.example.com/steam-logo.svg',
      productPage: 'https://cdn.example.com/steam-product.webp',
      gallery: [],
    },
  };
  saveProductOverride(product.id, configured);
  expect(getPublishedStorefrontProducts()).toHaveLength(1);

  saveProductOverride(product.id, { ...configured, publication: 'unpublished' });
  expect(getPublishedStorefrontProducts()).toEqual([]);
});

it('rolls back admin settings if the public snapshot cannot be saved', () => {
  const product = getSteamProduct();
  const configured = {
    ...createEmptyOverride(product),
    title: 'Steam Wallet Code',
    description: 'Цифровой код Steam.',
    publication: 'published' as const,
    media: {
      storefront: 'https://cdn.example.com/steam-card.webp',
      logo: 'https://cdn.example.com/steam-logo.svg',
      productPage: 'https://cdn.example.com/steam-product.webp',
      gallery: [],
    },
  };
  saveProductOverride(product.id, configured);

  const originalSetItem = Storage.prototype.setItem;
  const setItem = vi.spyOn(Storage.prototype, 'setItem');
  let rejectedSnapshot = false;
  setItem.mockImplementation(function setItemWithSnapshotFailure(this: Storage, key, value) {
    if (key === 'zvezda.storefront.catalog.v1' && !rejectedSnapshot) {
      rejectedSnapshot = true;
      throw new DOMException('Storage quota exceeded', 'QuotaExceededError');
    }
    return originalSetItem.call(this, key, value);
  });

  expect(() => saveProductOverride(product.id, { ...configured, title: 'Несохранённое название' }))
    .toThrow('Не удалось сохранить настройки каталога');

  setItem.mockRestore();
  expect(loadCatalogSettings().products[product.id]?.title).toBe('Steam Wallet Code');
  expect(getPublishedStorefrontProducts()[0]?.name).toBe('Steam Wallet Code');
});
