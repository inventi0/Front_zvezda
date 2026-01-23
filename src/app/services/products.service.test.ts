import { describe, it, expect, vi, beforeEach } from 'vitest';
import { productsService } from './products.service';
import { mockProductsService } from '@/app/data/mockAdapter';
import type { Product } from '@/app/types';

// Mock the adapter
vi.mock('@/app/data/mockAdapter', () => ({
  mockProductsService: {
    getProducts: vi.fn(),
    getProductBySlug: vi.fn(),
    getProductById: vi.fn(),
  },
  isMockMode: vi.fn(() => true),
}));

describe('productsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch products list', async () => {
    const mockProducts: Product[] = [
      {
        id: '1',
        name: 'Test Product',
        slug: 'test-product',
        category: 'games',
        type: 'top-up',
        logo: '',
        description: 'Test',
        denominations: [],
        deliverySpeed: 'instant',
        deliveryTimeText: 'Моментально',
      },
    ];

    vi.mocked(mockProductsService.getProducts).mockResolvedValue(mockProducts);

    const result = await productsService.getProducts();

    expect(result).toEqual(mockProducts);
    expect(mockProductsService.getProducts).toHaveBeenCalled();
  });

  it('should fetch product by slug', async () => {
    const mockProduct: Product = {
      id: '1',
      name: 'Test Product',
      slug: 'test-product',
      category: 'games',
      type: 'top-up',
      logo: '',
      description: 'Test',
      denominations: [],
      deliverySpeed: 'instant',
      deliveryTimeText: 'Моментально',
    };

    vi.mocked(mockProductsService.getProductBySlug).mockResolvedValue(mockProduct);

    const result = await productsService.getProductBySlug('test-product');

    expect(result).toEqual(mockProduct);
    expect(mockProductsService.getProductBySlug).toHaveBeenCalledWith('test-product');
  });
});
