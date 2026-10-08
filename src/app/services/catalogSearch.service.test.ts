import { beforeEach, describe, expect, it, vi } from 'vitest';
import { productsService } from '@/app/services/products.service';
import { catalogSearchService, normalizeCatalogSearchQuery } from './catalogSearch.service';
import type { Product } from '@/app/types';

vi.mock('@/app/services/products.service', () => ({
  productsService: {
    getProducts: vi.fn(),
  },
}));

const product = (id: string): Product => ({
  id,
  name: `Product ${id}`,
  slug: `product-${id}`,
  category: 'services',
  type: 'top-up',
  logo: '',
  description: '',
  denominations: [],
  fulfillment: { type: 'account-top-up', channel: 'target-account', estimate: 'instant' },
});

describe('catalogSearchService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('normalizes whitespace before sending a query to the provider', async () => {
    vi.mocked(productsService.getProducts).mockResolvedValue([product('1')]);

    expect(normalizeCatalogSearchQuery('  Steam   Wallet  ')).toBe('Steam Wallet');
    await catalogSearchService.search('  Steam   Wallet  ');

    expect(productsService.getProducts).toHaveBeenCalledWith({ search: 'Steam Wallet' });
  });

  it('does not request results for a one-character query', async () => {
    await expect(catalogSearchService.search('s')).resolves.toEqual([]);
    expect(productsService.getProducts).not.toHaveBeenCalled();
  });

  it('limits the number of rendered suggestions', async () => {
    vi.mocked(productsService.getProducts).mockResolvedValue([
      product('1'),
      product('2'),
      product('3'),
    ]);

    await expect(catalogSearchService.search('product', 2)).resolves.toHaveLength(2);
  });
});
