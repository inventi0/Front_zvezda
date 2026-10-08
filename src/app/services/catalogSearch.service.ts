import { productsService } from '@/app/services/products.service';
import type { Product } from '@/app/types';

export interface CatalogSearchProvider {
  search(query: string, limit?: number): Promise<Product[]>;
}

export function normalizeCatalogSearchQuery(query: string): string {
  return query.trim().replace(/\s+/g, ' ');
}

class ProductsCatalogSearchProvider implements CatalogSearchProvider {
  async search(query: string, limit = 8): Promise<Product[]> {
    const normalizedQuery = normalizeCatalogSearchQuery(query);
    if (normalizedQuery.length < 2) return [];

    const products = await productsService.getProducts({ search: normalizedQuery });
    return products.slice(0, limit);
  }
}

/**
 * Stable search boundary for the storefront. A Typesense provider can replace
 * this implementation without changing the header or its interaction model.
 */
export const catalogSearchService: CatalogSearchProvider = new ProductsCatalogSearchProvider();
