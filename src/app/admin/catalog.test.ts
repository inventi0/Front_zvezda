import { afterEach, describe, expect, it } from 'vitest';
import {
  buildCatalogProducts,
  calculateVoucherPrice,
  catalogProducts,
  createEmptyOverride,
  defaultPricingRule,
  getProductOffers,
  loadCatalogSettings,
  saveGlobalPricing,
  saveProductOverride,
  type ProductOverride,
  type WataCategory,
  type WataVoucher,
} from './catalog';

afterEach(() => localStorage.removeItem('zvezda.admin.catalog.v1'));

const voucher: WataVoucher = {
  id: 'sku-1', name: 'Voucher', price: 100, minPrice: 110, isAvailable: true, stock: 5,
};
const category: WataCategory = {
  details: { categoryId: 'cat-1', categoryName: 'Category', type: 'VoucherCode', description: '', fields: [] },
  vouchers: [voucher],
};
const product = buildCatalogProducts([category])[0];

it('never prices a voucher below WATA minimum', () => {
  const result = calculateVoucherPrice(voucher, { ...defaultPricingRule, value: 0 });
  expect(result.salePrice).toBe(110);
});

it('caps invalid manual price at the documented maximum', () => {
  const override = { ...createEmptyOverride(product), skuSalePrices: { 'sku-1': 999 } };
  const result = calculateVoucherPrice(voucher, defaultPricingRule, override);
  expect(result.salePrice).toBe(220);
  expect(result.adjustedToSupplierBounds).toBe(true);
});

describe('promotion', () => {
  it('applies discount without crossing supplier minimum', () => {
    const override: ProductOverride = {
      ...createEmptyOverride(product),
      pricingRule: { mode: 'fixed-markup', value: 100, roundingStep: 1 },
      promotion: { enabled: true, label: 'Акция', discountPercent: 90 },
    };
    expect(calculateVoucherPrice(voucher, defaultPricingRule, override).salePrice).toBe(110);
  });
});

describe('catalog grouping', () => {
  const makeCategory = (categoryId: string, categoryName: string, voucherId: string): WataCategory => ({
    details: { categoryId, categoryName, type: 'VoucherCode', description: '', fields: [] },
    vouchers: [{ ...voucher, id: voucherId, name: voucherId === 'aed' ? '20 AED' : '5 USD' }],
  });

  it('groups regional supplier categories into one parent and keeps their SKUs', () => {
    const [steam] = buildCatalogProducts([
      makeCategory('151', 'Steam Wallet Code | AE', 'aed'),
      makeCategory('353', 'Steam Wallet Code | AR', 'usd'),
    ]);

    expect(steam.title).toBe('Steam Wallet Code');
    expect(steam.variants.map((variant) => variant.label)).toEqual(['AE', 'AR']);
    expect(getProductOffers(steam)).toHaveLength(2);
  });

  it('merges duplicate supplier groups for the same public variant without losing ids', () => {
    const [steam] = buildCatalogProducts([
      makeCategory('164', 'Steam Wallet Code | UK', 'uk-1'),
      makeCategory('512', 'Steam Wallet Code | UK', 'uk-2'),
    ]);

    expect(steam.variants).toHaveLength(1);
    expect(steam.variants[0].categories.map((item) => item.details.categoryId)).toEqual(['164', '512']);
  });

  it('normalizes cosmetic aliases but does not confuse a platform with a market', () => {
    const grouped = buildCatalogProducts([
      makeCategory('1', 'PlayStation Store Wallet | US', 'ps-1'),
      makeCategory('2', 'PlayStation®Store Wallet | UK', 'ps-2'),
      makeCategory('3', 'Apex Coins | Xbox', 'apex'),
    ]);
    const playstation = grouped.find((item) => item.id === 'playstation-store-wallet');
    const apex = grouped.find((item) => item.id === 'apex-coins');

    expect(playstation?.categories).toHaveLength(2);
    expect(apex?.variants[0]).toMatchObject({ dimension: 'platform', label: 'Xbox' });
  });

  it('reduces the WATA response to parent products while preserving all 3408 SKUs', () => {
    expect(catalogProducts.length).toBeLessThan(422);
    expect(catalogProducts.flatMap(getProductOffers)).toHaveLength(3408);
    const steam = catalogProducts.find((item) => item.id === 'steam-wallet-code');
    expect(steam).toMatchObject({ title: 'Steam Wallet Code' });
    expect(steam?.categories).toHaveLength(29);
    expect(steam?.variants).toHaveLength(28);
  });
});

it('falls back to safe defaults when persisted settings are malformed', () => {
  localStorage.setItem('zvezda.admin.catalog.v1', JSON.stringify({ version: 2, globalPricing: { mode: 'broken' } }));
  expect(loadCatalogSettings()).toMatchObject({
    version: 2,
    globalPricing: defaultPricingRule,
    products: {},
  });
});

it('migrates category-level settings to the parent product', () => {
  localStorage.setItem('zvezda.admin.catalog.v1', JSON.stringify({
    version: 1,
    globalPricing: defaultPricingRule,
    overrides: {
      '151': {
        categoryId: '151',
        title: 'Steam Wallet Code | AE',
        description: 'Описание',
        publication: 'draft',
        popular: true,
        popularityRank: null,
        promotion: { enabled: false, label: 'Акция', discountPercent: 0 },
        media: { storefront: '', logo: '', productPage: '', gallery: [] },
        pricingRule: null,
        skuSalePrices: {},
        updatedAt: '2026-10-03T00:00:00.000Z',
      },
    },
    lastSupplierSyncAt: '2026-10-02T00:00:00.000Z',
  }));

  const migrated = loadCatalogSettings();
  expect(migrated.version).toBe(2);
  expect(migrated.products['steam-wallet-code']).toMatchObject({
    productId: 'steam-wallet-code',
    title: 'Steam Wallet Code',
    publication: 'unpublished',
    popular: true,
  });
  expect(migrated.products['steam-wallet-code'].hiddenVariantIds).toContain('steam-wallet-code:market:uk');
});

it('persists a validated global pricing rule with an update timestamp', () => {
  const saved = saveGlobalPricing({ mode: 'fixed-markup', value: 75, roundingStep: 10 });

  expect(saved.globalPricing).toEqual({ mode: 'fixed-markup', value: 75, roundingStep: 10 });
  expect(saved.globalPricingUpdatedAt).toBeTypeOf('string');
  expect(loadCatalogSettings().globalPricing).toEqual(saved.globalPricing);
});

it('does not persist an invalid global pricing rule', () => {
  expect(() => saveGlobalPricing({ mode: 'markup-percent', value: -1, roundingStep: 1 })).toThrow();
  expect(loadCatalogSettings().globalPricing).toEqual(defaultPricingRule);
});

it('keeps unavailable variants hidden when an override is saved', () => {
  const steam = catalogProducts.find((item) => item.id === 'steam-wallet-code');
  expect(steam).toBeDefined();
  if (!steam) return;

  const unavailableVariant = steam.variants.find((variant) => (
    !variant.categories.some((item) => item.vouchers.some((itemVoucher) => itemVoucher.isAvailable && itemVoucher.stock > 0))
  ));
  expect(unavailableVariant).toBeDefined();
  if (!unavailableVariant) return;

  const saved = saveProductOverride(steam.id, {
    ...createEmptyOverride(steam),
    hiddenVariantIds: [],
  });

  expect(saved.products[steam.id].hiddenVariantIds).toContain(unavailableVariant.id);
});
