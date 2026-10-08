import { z } from 'zod';
import rawCatalog from '@/app/data/wataCatalog.json';
import type { Denomination, Product, ProductCategory, ProductFulfillment } from '@/app/types';
import {
  CATALOG_STORAGE_KEY,
  CATALOG_UPDATED_EVENT,
  PUBLISHED_CATALOG_STORAGE_KEY,
} from '@/app/admin/catalogEvents';
import { savePublishedStorefrontProducts } from '@/app/admin/storefrontCatalog';

const WataVoucherSchema = z.object({
  id: z.string(),
  name: z.string(),
  price: z.number().nonnegative(),
  minPrice: z.number().nonnegative(),
  isAvailable: z.boolean(),
  stock: z.number().int().nonnegative(),
});

const WataCategorySchema = z.object({
  details: z.object({
    categoryId: z.string(),
    categoryName: z.string(),
    type: z.literal('VoucherCode'),
    description: z.string(),
    fields: z.array(z.unknown()),
  }),
  vouchers: z.array(WataVoucherSchema),
});

export type WataCategory = z.infer<typeof WataCategorySchema>;
export type WataVoucher = z.infer<typeof WataVoucherSchema>;
export type PublicationState = 'unpublished' | 'published';
export type PricingMode = 'supplier-minimum' | 'markup-percent' | 'fixed-markup';
export type RoundingStep = 1 | 10 | 50 | 100;
export type VariantDimension = 'market' | 'platform' | 'currency' | 'tier' | 'option' | 'default';

export interface PricingRule {
  mode: PricingMode;
  value: number;
  roundingStep: RoundingStep;
}

export interface ProductMedia {
  storefront: string;
  logo: string;
  productPage: string;
  gallery: string[];
}

export interface ProductPromotion {
  enabled: boolean;
  label: string;
  discountPercent: number;
}

export interface ProductOverride {
  productId: string;
  title: string;
  description: string;
  storefrontCategory: ProductCategory;
  publication: PublicationState;
  popular: boolean;
  popularityRank: number | null;
  promotion: ProductPromotion;
  media: ProductMedia;
  pricingRule: PricingRule | null;
  skuSalePrices: Record<string, number>;
  hiddenVariantIds: string[];
  updatedAt: string;
}

export interface CatalogVariant {
  id: string;
  dimension: VariantDimension;
  code: string;
  label: string;
  categories: WataCategory[];
  currencyCodes: string[];
}

export interface CatalogProduct {
  id: string;
  title: string;
  type: 'VoucherCode';
  categories: WataCategory[];
  variants: CatalogVariant[];
}

export interface CatalogOffer {
  product: CatalogProduct;
  variant: CatalogVariant;
  category: WataCategory;
  voucher: WataVoucher;
}

const WATA_VOUCHER_FULFILLMENT: ProductFulfillment = {
  type: 'activation-code',
  channel: 'protected-order-page',
  estimate: 'up-to-10-minutes',
};

export function getCatalogProductFulfillment(product: CatalogProduct): ProductFulfillment {
  if (product.type !== 'VoucherCode') {
    throw new Error(`Неподдерживаемый способ исполнения WATA: ${String(product.type)}`);
  }
  return { ...WATA_VOUCHER_FULFILLMENT };
}

export interface CatalogSettings {
  version: 2;
  globalPricing: PricingRule;
  globalPricingUpdatedAt?: string;
  products: Record<string, ProductOverride>;
  lastSupplierSyncAt: string;
}

export interface PriceCalculation {
  supplierPrice: number;
  supplierMinimum: number;
  regularPrice: number;
  salePrice: number;
  maximumAllowed: number;
  source: 'global' | 'product' | 'sku-manual';
  adjustedToSupplierBounds: boolean;
}

const PricingRuleSchema = z.object({
  mode: z.enum(['supplier-minimum', 'markup-percent', 'fixed-markup']),
  value: z.number().finite().nonnegative(),
  roundingStep: z.union([z.literal(1), z.literal(10), z.literal(50), z.literal(100)]),
});

const PublicationStateSchema = z.preprocess(
  (value) => value === 'draft' || value === 'hidden' ? 'unpublished' : value,
  z.enum(['unpublished', 'published']),
);

const ProductContentSchema = z.object({
  title: z.string(),
  description: z.string(),
  storefrontCategory: z.enum(['games', 'wallet', 'services', 'subscriptions']).default('wallet'),
  publication: PublicationStateSchema,
  popular: z.boolean(),
  popularityRank: z.number().int().positive().nullable(),
  promotion: z.object({
    enabled: z.boolean(),
    label: z.string(),
    discountPercent: z.number().finite().min(0).max(90),
  }),
  media: z.object({
    storefront: z.string(),
    logo: z.string(),
    productPage: z.string(),
    gallery: z.array(z.string()),
  }),
  pricingRule: PricingRuleSchema.nullable(),
  skuSalePrices: z.record(z.number().finite().nonnegative()),
  hiddenVariantIds: z.array(z.string()).default([]),
  updatedAt: z.string(),
});

const ProductOverrideSchema = ProductContentSchema.extend({ productId: z.string() });
const LegacyProductOverrideSchema = ProductContentSchema.extend({ categoryId: z.string() });

const CatalogSettingsSchema = z.object({
  version: z.literal(2),
  globalPricing: PricingRuleSchema,
  globalPricingUpdatedAt: z.string().optional(),
  products: z.record(ProductOverrideSchema),
  lastSupplierSyncAt: z.string(),
});

const LegacyCatalogSettingsSchema = z.object({
  version: z.literal(1),
  globalPricing: PricingRuleSchema,
  globalPricingUpdatedAt: z.string().optional(),
  overrides: z.record(LegacyProductOverrideSchema),
  lastSupplierSyncAt: z.string(),
});

const importedCatalog = z.array(WataCategorySchema).parse(rawCatalog);

export const supplierCatalog: WataCategory[] = importedCatalog;

const FAMILY_ALIASES: Record<string, string> = {
  'playstationstore wallet': 'PlayStation Store Wallet',
  'playstation®store wallet': 'PlayStation Store Wallet',
};

const PLATFORM_LABELS: Record<string, string> = {
  xbox: 'Xbox',
  playstation: 'PlayStation',
  pc: 'PC',
  nintendo: 'Nintendo',
};

const CURRENCY_CODES = new Set([
  'AED', 'ARS', 'AUD', 'BHD', 'BRL', 'CAD', 'CHF', 'CLP', 'CNY', 'COP', 'CRC', 'CZK',
  'DKK', 'EGP', 'EUR', 'GBP', 'HKD', 'HUF', 'IDR', 'INR', 'JPY', 'KRW', 'KWD', 'MXN',
  'MYR', 'NOK', 'NZD', 'PEN', 'PHP', 'PLN', 'QAR', 'RON', 'RUB', 'SAR', 'SEK', 'SGD',
  'THB', 'TRY', 'TWD', 'USD', 'UYU', 'VND', 'ZAR',
]);

function cleanText(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function canonicalFamilyTitle(value: string): string {
  const cleaned = cleanText(value);
  const normalized = cleaned.toLocaleLowerCase('en-US');
  if (/^amazon\.[a-z]{2,3} gift card$/i.test(cleaned)) return 'Amazon Gift Card';
  return FAMILY_ALIASES[normalized] ?? cleaned;
}

function toStableId(value: string): string {
  const slug = value
    .normalize('NFKD')
    .replace(/[®™]/g, '')
    .toLocaleLowerCase('en-US')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  if (!slug) throw new Error(`Не удалось сформировать идентификатор товарного семейства: ${value}`);
  return slug;
}

function splitCategoryName(categoryName: string): { familyTitle: string; qualifier: string | null } {
  const [family, ...qualifierParts] = categoryName.split('|');
  const qualifier = cleanText(qualifierParts.join('|'));
  return {
    familyTitle: canonicalFamilyTitle(family),
    qualifier: qualifier || null,
  };
}

function classifyQualifier(qualifier: string | null): Pick<CatalogVariant, 'dimension' | 'code' | 'label'> {
  if (!qualifier) return { dimension: 'default', code: 'DEFAULT', label: 'Основной вариант' };

  const cleaned = cleanText(qualifier);
  const platform = PLATFORM_LABELS[cleaned.toLocaleLowerCase('en-US')];
  if (platform) return { dimension: 'platform', code: platform.toLocaleUpperCase('en-US'), label: platform };

  const upper = cleaned.toLocaleUpperCase('en-US');
  if (CURRENCY_CODES.has(upper)) return { dimension: 'currency', code: upper, label: upper };
  if (/^TIER\s+\d+$/i.test(cleaned)) return { dimension: 'tier', code: upper.replace(/\s+/g, '-'), label: cleaned };
  if (/^[A-Z]{2}$/.test(upper) || ['EU', 'GLOB', 'MENA'].includes(upper)) {
    return { dimension: 'market', code: upper, label: upper };
  }
  return { dimension: 'option', code: upper, label: cleaned };
}

function extractCurrencies(category: WataCategory): string[] {
  const currencies = new Set<string>();
  category.vouchers.forEach((voucher) => {
    const tokens = voucher.name.toLocaleUpperCase('en-US').match(/\b[A-Z]{3}\b/g) ?? [];
    tokens.filter((token) => CURRENCY_CODES.has(token)).forEach((token) => currencies.add(token));
  });
  return [...currencies].sort();
}

export function buildCatalogProducts(categories: WataCategory[]): CatalogProduct[] {
  const products = new Map<string, CatalogProduct>();

  categories.forEach((category) => {
    const { familyTitle, qualifier } = splitCategoryName(category.details.categoryName);
    const productId = toStableId(familyTitle);
    const existing = products.get(productId);
    if (existing && existing.title.localeCompare(familyTitle, 'en', { sensitivity: 'base' }) !== 0) {
      throw new Error(`Коллизия товарных семейств: ${existing.title} и ${familyTitle}`);
    }
    const product = existing ?? {
      id: productId,
      title: familyTitle,
      type: category.details.type,
      categories: [],
      variants: [],
    } satisfies CatalogProduct;
    product.categories.push(category);

    const descriptor = classifyQualifier(qualifier);
    const variantId = `${productId}:${descriptor.dimension}:${descriptor.code.toLocaleLowerCase('en-US')}`;
    const existingVariant = product.variants.find((variant) => variant.id === variantId);
    if (existingVariant) {
      existingVariant.categories.push(category);
      existingVariant.currencyCodes = [...new Set([...existingVariant.currencyCodes, ...extractCurrencies(category)])].sort();
    } else {
      product.variants.push({
        id: variantId,
        ...descriptor,
        categories: [category],
        currencyCodes: extractCurrencies(category),
      });
    }
    products.set(productId, product);
  });

  return [...products.values()]
    .map((product) => ({
      ...product,
      categories: [...product.categories].sort((left, right) => left.details.categoryId.localeCompare(right.details.categoryId, 'en', { numeric: true })),
      variants: [...product.variants].sort((left, right) => {
        if (left.dimension === 'default' && right.dimension !== 'default') return -1;
        if (right.dimension === 'default' && left.dimension !== 'default') return 1;
        return left.label.localeCompare(right.label, 'en', { numeric: true });
      }),
    }))
    .sort((left, right) => left.title.localeCompare(right.title, 'en'));
}

export const catalogProducts = buildCatalogProducts(supplierCatalog);

const productById = new Map(catalogProducts.map((product) => [product.id, product]));
const productByCategoryId = new Map(
  catalogProducts.flatMap((product) => product.categories.map((category) => [category.details.categoryId, product] as const)),
);

export function getCatalogProduct(productId: string): CatalogProduct | undefined {
  return productById.get(productId);
}

export function getProductForCategoryId(categoryId: string): CatalogProduct | undefined {
  return productByCategoryId.get(categoryId);
}

export function getProductOffers(product: CatalogProduct): CatalogOffer[] {
  return product.variants.flatMap((variant) => variant.categories.flatMap((category) => (
    category.vouchers.map((voucher) => ({ product, variant, category, voucher }))
  )));
}

export function getVariantDimensionLabel(dimension: VariantDimension): string {
  const labels: Record<VariantDimension, string> = {
    market: 'Рынок активации',
    platform: 'Платформа',
    currency: 'Валюта',
    tier: 'Уровень',
    option: 'Вариант',
    default: 'Вариант',
  };
  return labels[dimension];
}

export function isVariantPurchasable(variant: CatalogVariant): boolean {
  return variant.categories.some((category) => (
    category.vouchers.some((voucher) => voucher.isAvailable && voucher.stock > 0)
  ));
}

export function getPublicationIssues(product: CatalogProduct, override: ProductOverride): string[] {
  const hasVisibleOffer = product.variants.some((variant) => (
    !override.hiddenVariantIds.includes(variant.id) && isVariantPurchasable(variant)
  ));

  return [
    !override.title.trim() ? 'название' : null,
    !override.description.trim() ? 'описание' : null,
    !override.media.storefront.trim() ? 'изображение витрины' : null,
    !override.media.logo.trim() ? 'логотип' : null,
    !override.media.productPage.trim() ? 'изображение страницы товара' : null,
    !hasVisibleOffer ? 'хотя бы один доступный вариант на витрине' : null,
  ].filter((issue): issue is string => issue !== null);
}

export const defaultPricingRule: PricingRule = {
  mode: 'markup-percent',
  value: 10,
  roundingStep: 1,
};

function defaultHiddenVariantIds(product: CatalogProduct): string[] {
  return product.variants
    .filter((variant) => !isVariantPurchasable(variant))
    .map((variant) => variant.id);
}

export function createEmptyOverride(product: CatalogProduct): ProductOverride {
  return {
    productId: product.id,
    title: product.title,
    description: '',
    storefrontCategory: 'wallet',
    publication: 'unpublished',
    popular: false,
    popularityRank: null,
    promotion: { enabled: false, label: 'Акция', discountPercent: 0 },
    media: { storefront: '', logo: '', productPage: '', gallery: [] },
    pricingRule: null,
    skuSalePrices: {},
    hiddenVariantIds: defaultHiddenVariantIds(product),
    updatedAt: new Date(0).toISOString(),
  };
}

function toMinor(value: number): number {
  return Math.round(value * 100);
}

function fromMinor(value: number): number {
  return value / 100;
}

function roundUpMinor(value: number, step: RoundingStep): number {
  const stepMinor = step * 100;
  return Math.ceil(value / stepMinor) * stepMinor;
}

export function calculateVoucherPrice(
  voucher: WataVoucher,
  globalRule: PricingRule,
  override?: ProductOverride,
): PriceCalculation {
  const manual = override?.skuSalePrices[voucher.id];
  const rule = override?.pricingRule ?? globalRule;
  const supplierPriceMinor = toMinor(voucher.price);
  const supplierMinimumMinor = toMinor(voucher.minPrice);
  const maximumAllowedMinor = supplierMinimumMinor * 2;
  let candidateMinor = supplierMinimumMinor;
  let source: PriceCalculation['source'] = override?.pricingRule ? 'product' : 'global';

  if (typeof manual === 'number' && Number.isFinite(manual)) {
    candidateMinor = toMinor(manual);
    source = 'sku-manual';
  } else if (rule.mode === 'markup-percent') {
    const markupBps = Math.round(rule.value * 100);
    candidateMinor = supplierPriceMinor + Math.ceil((supplierPriceMinor * markupBps) / 10_000);
  } else if (rule.mode === 'fixed-markup') {
    candidateMinor = supplierPriceMinor + toMinor(rule.value);
  }

  const boundedMinor = Math.min(maximumAllowedMinor, Math.max(supplierMinimumMinor, candidateMinor));
  const regularPriceMinor = Math.min(
    maximumAllowedMinor,
    Math.max(supplierMinimumMinor, roundUpMinor(boundedMinor, rule.roundingStep)),
  );
  const discountBps = override?.promotion.enabled
    ? Math.round(override.promotion.discountPercent * 100)
    : 0;
  const discountedMinor = Math.ceil((regularPriceMinor * (10_000 - discountBps)) / 10_000);
  const salePriceMinor = Math.max(supplierMinimumMinor, roundUpMinor(discountedMinor, rule.roundingStep));

  return {
    supplierPrice: fromMinor(supplierPriceMinor),
    supplierMinimum: fromMinor(supplierMinimumMinor),
    regularPrice: fromMinor(regularPriceMinor),
    salePrice: fromMinor(salePriceMinor),
    maximumAllowed: fromMinor(maximumAllowedMinor),
    source,
    adjustedToSupplierBounds:
      candidateMinor < supplierMinimumMinor
      || candidateMinor > maximumAllowedMinor
      || (salePriceMinor === supplierMinimumMinor && discountedMinor < supplierMinimumMinor),
  };
}

function extractDenominationAmount(name: string): number {
  const match = name.match(/(?:^|\s)(\d+(?:[.,]\d+)?)(?=\s|$)/);
  if (!match) return 1;
  const value = Number(match[1].replace(',', '.'));
  return Number.isFinite(value) && value > 0 ? value : 1;
}

function toStorefrontDenomination(
  voucher: WataVoucher,
  variant: CatalogVariant,
  override: ProductOverride,
  globalPricing: PricingRule,
  supplierCategoryId: string,
): Denomination {
  const price = calculateVoucherPrice(voucher, globalPricing, override);
  return {
    id: `wata:${supplierCategoryId}:${voucher.id}`,
    amount: extractDenominationAmount(voucher.name),
    currency: variant.currencyCodes[0] ?? '',
    price: price.salePrice,
    label: voucher.name,
    optionId: variant.id,
    ...(override.promotion.enabled && override.promotion.discountPercent > 0
      ? { discount: override.promotion.discountPercent }
      : {}),
  };
}

function buildPublishedStorefrontProducts(settings: CatalogSettings): Product[] {
  return catalogProducts.flatMap((product) => {
    const override = settings.products[product.id];
    if (!override || override.publication !== 'published') return [];
    if (getPublicationIssues(product, override).length > 0) return [];

    const variants = product.variants.filter((variant) => (
      !override.hiddenVariantIds.includes(variant.id) && isVariantPurchasable(variant)
    ));
    if (!variants.length) return [];
    const visibleVariantIds = new Set(variants.map((variant) => variant.id));
    const denominations = getProductOffers(product)
      .filter(({ variant, voucher }) => (
        visibleVariantIds.has(variant.id) && voucher.isAvailable && voucher.stock > 0
      ))
      .map(({ voucher, variant, category }) => (
        toStorefrontDenomination(voucher, variant, override, settings.globalPricing, category.details.categoryId)
      ))
      .sort((left, right) => (
        (left.optionId ?? '').localeCompare(right.optionId ?? '', 'ru')
        || left.amount - right.amount
        || (left.label ?? '').localeCompare(right.label ?? '', 'ru')
      ));
    if (!denominations.length) return [];

    const dimensions = new Set(variants.map((variant) => variant.dimension));
    const optionLabel = dimensions.size === 1
      ? getVariantDimensionLabel(variants[0].dimension)
      : 'Вариант';

    return [{
      id: `wata:${product.id}`,
      name: override.title,
      slug: `wata-${product.id}`,
      category: override.storefrontCategory,
      type: 'voucher',
      logo: override.media.logo,
      image: override.media.storefront,
      productPageImage: override.media.productPage,
      gallery: override.media.gallery,
      description: override.description,
      denominations,
      fulfillment: getCatalogProductFulfillment(product),
      popular: override.popular,
      optionLabel,
      options: variants.map((variant) => ({
        id: variant.id,
        label: variant.label,
        description: variant.currencyCodes.length ? variant.currencyCodes.join(', ') : undefined,
      })),
    } satisfies Product];
  });
}

function initialSettings(): CatalogSettings {
  return {
    version: 2,
    globalPricing: defaultPricingRule,
    products: {},
    lastSupplierSyncAt: '2026-10-02T00:00:00.000Z',
  };
}

function migrateLegacySettings(legacy: z.infer<typeof LegacyCatalogSettingsSchema>): CatalogSettings {
  const products: Record<string, ProductOverride> = {};

  Object.values(legacy.overrides).forEach((legacyOverride) => {
    const product = getProductForCategoryId(legacyOverride.categoryId);
    if (!product) return;
    const sourceCategory = product.categories.find((category) => category.details.categoryId === legacyOverride.categoryId);
    const migrated: ProductOverride = {
      ...legacyOverride,
      productId: product.id,
      title: sourceCategory && legacyOverride.title === sourceCategory.details.categoryName
        ? product.title
        : legacyOverride.title,
      hiddenVariantIds: [...new Set([
        ...legacyOverride.hiddenVariantIds,
        ...defaultHiddenVariantIds(product),
      ])],
    };
    const existing = products[product.id];
    if (!existing) {
      products[product.id] = migrated;
      return;
    }
    const migratedIsNewer = migrated.updatedAt >= existing.updatedAt;
    const latest = migratedIsNewer ? migrated : existing;
    products[product.id] = {
      ...latest,
      skuSalePrices: migratedIsNewer
        ? { ...existing.skuSalePrices, ...migrated.skuSalePrices }
        : { ...migrated.skuSalePrices, ...existing.skuSalePrices },
    };
  });

  return {
    version: 2,
    globalPricing: legacy.globalPricing,
    ...(legacy.globalPricingUpdatedAt ? { globalPricingUpdatedAt: legacy.globalPricingUpdatedAt } : {}),
    products,
    lastSupplierSyncAt: legacy.lastSupplierSyncAt,
  };
}

function ensurePublishedSnapshot(settings: CatalogSettings): void {
  if (localStorage.getItem(PUBLISHED_CATALOG_STORAGE_KEY) !== null) return;

  try {
    savePublishedStorefrontProducts(buildPublishedStorefrontProducts(settings));
  } catch {
    // Loading admin settings must remain possible even if browser storage is full.
  }
}

export function loadCatalogSettings(): CatalogSettings {
  try {
    const stored = localStorage.getItem(CATALOG_STORAGE_KEY);
    if (!stored) return initialSettings();
    const value: unknown = JSON.parse(stored);
    const parsed = CatalogSettingsSchema.safeParse(value);
    if (parsed.success) {
      ensurePublishedSnapshot(parsed.data);
      return parsed.data;
    }

    const legacy = LegacyCatalogSettingsSchema.safeParse(value);
    if (!legacy.success) return initialSettings();
    const migrated = migrateLegacySettings(legacy.data);
    localStorage.setItem(CATALOG_STORAGE_KEY, JSON.stringify(migrated));
    ensurePublishedSnapshot(migrated);
    return migrated;
  } catch {
    return initialSettings();
  }
}

export function saveCatalogSettings(settings: CatalogSettings): void {
  const previousSettings = localStorage.getItem(CATALOG_STORAGE_KEY);
  const previousPublishedProducts = localStorage.getItem(PUBLISHED_CATALOG_STORAGE_KEY);

  try {
    const validated = CatalogSettingsSchema.parse(settings);
    const publishedProducts = buildPublishedStorefrontProducts(validated);

    localStorage.setItem(CATALOG_STORAGE_KEY, JSON.stringify(validated));
    savePublishedStorefrontProducts(publishedProducts);
    window.dispatchEvent(new Event(CATALOG_UPDATED_EVENT));
  } catch (error) {
    try {
      if (previousSettings === null) localStorage.removeItem(CATALOG_STORAGE_KEY);
      else localStorage.setItem(CATALOG_STORAGE_KEY, previousSettings);

      if (previousPublishedProducts === null) localStorage.removeItem(PUBLISHED_CATALOG_STORAGE_KEY);
      else localStorage.setItem(PUBLISHED_CATALOG_STORAGE_KEY, previousPublishedProducts);
    } catch {
      // Best-effort rollback: the original storage error remains the actionable failure.
    }
    throw new Error('Не удалось сохранить настройки каталога в браузере', { cause: error });
  }
}

export function saveProductOverride(productId: string, override: ProductOverride): CatalogSettings {
  const settings = loadCatalogSettings();
  const product = getCatalogProduct(productId);
  if (!product) throw new Error('Товар не найден в каталоге поставщика');
  const validated = ProductOverrideSchema.parse({
    ...override,
    productId,
    hiddenVariantIds: [...new Set([...override.hiddenVariantIds, ...defaultHiddenVariantIds(product)])],
    updatedAt: new Date().toISOString(),
  });
  if (validated.publication === 'published') {
    const issues = getPublicationIssues(product, validated);
    if (issues.length) throw new Error(`Для публикации заполните: ${issues.join(', ')}`);
  }
  const next = {
    ...settings,
    products: {
      ...settings.products,
      [productId]: validated,
    },
  };
  saveCatalogSettings(next);
  return next;
}

export function resetProductOverride(productId: string): CatalogSettings {
  const settings = loadCatalogSettings();
  const remaining = { ...settings.products };
  delete remaining[productId];
  const next = { ...settings, products: remaining };
  saveCatalogSettings(next);
  return next;
}

export function saveGlobalPricing(globalPricing: PricingRule): CatalogSettings {
  const validatedRule = PricingRuleSchema.parse(globalPricing);
  const next = {
    ...loadCatalogSettings(),
    globalPricing: validatedRule,
    globalPricingUpdatedAt: new Date().toISOString(),
  };
  saveCatalogSettings(next);
  return next;
}

export function formatRub(value: number): string {
  return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 2 }).format(value);
}

export function getCatalogTotals() {
  return catalogProducts.reduce((totals, product) => {
    totals.products += 1;
    totals.supplierGroups += product.categories.length;
    totals.variants += product.variants.length;
    getProductOffers(product).forEach(({ voucher }) => {
      totals.skus += 1;
      totals.stock += voucher.stock;
    });
    return totals;
  }, { products: 0, supplierGroups: 0, variants: 0, skus: 0, stock: 0 });
}
