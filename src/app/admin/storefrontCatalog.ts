import { z } from 'zod';
import type { Product } from '@/app/types';
import { ProductSchema } from '@/app/types/schemas';
import { CATALOG_STORAGE_KEY, PUBLISHED_CATALOG_STORAGE_KEY } from '@/app/admin/catalogEvents';

const PublishedProductsSchema = z.array(ProductSchema);
const MediaSettingsSchema = z.object({
  products: z.record(z.object({
    media: z.object({
      storefront: z.string(),
      logo: z.string(),
      productPage: z.string(),
      gallery: z.array(z.string()),
    }),
  }).passthrough()),
}).passthrough();

export function getPublishedStorefrontProducts(): Product[] {
  try {
    const raw = localStorage.getItem(PUBLISHED_CATALOG_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    const result = PublishedProductsSchema.safeParse(parsed);
    if (!result.success) return [];

    const settingsRaw = localStorage.getItem(CATALOG_STORAGE_KEY);
    const settings = settingsRaw ? MediaSettingsSchema.safeParse(JSON.parse(settingsRaw)) : null;
    if (!settings?.success) return result.data;

    return result.data.map((product) => {
      const productId = product.id.startsWith('wata:') ? product.id.slice(5) : '';
      const media = settings.data.products[productId]?.media;
      return media ? {
        ...product,
        logo: media.logo,
        image: media.storefront,
        productPageImage: media.productPage,
        gallery: media.gallery,
      } : product;
    });
  } catch {
    return [];
  }
}

export function savePublishedStorefrontProducts(products: Product[]): void {
  const validated = PublishedProductsSchema.parse(products);
  const withoutDuplicatedMedia = validated.map((product) => ({
    ...product,
    logo: '',
    image: undefined,
    productPageImage: undefined,
    gallery: undefined,
  }));
  localStorage.setItem(PUBLISHED_CATALOG_STORAGE_KEY, JSON.stringify(withoutDuplicatedMedia));
}

export function getPublishedStorefrontProductById(id: string): Product | undefined {
  return getPublishedStorefrontProducts().find((product) => product.id === id);
}

export function getPublishedStorefrontProductBySlug(slug: string): Product | undefined {
  return getPublishedStorefrontProducts().find((product) => product.slug === slug);
}
