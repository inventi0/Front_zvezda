import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useProducts, useProduct } from './useProducts';
import { productsService } from '@/app/services';
import type { Product } from '@/app/types';

// Mock the service
vi.mock('@/app/services', () => ({
  productsService: {
    getProducts: vi.fn(),
    getProductBySlug: vi.fn(),
  },
}));

describe('useProducts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useProducts', () => {
    it('should fetch products successfully', async () => {
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

      vi.mocked(productsService.getProducts).mockResolvedValue(mockProducts);

      const { result } = renderHook(() => useProducts());

      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.products).toEqual(mockProducts);
      expect(result.current.error).toBeNull();
    });

    it('should handle errors', async () => {
      const error = new Error('Failed to fetch');
      vi.mocked(productsService.getProducts).mockRejectedValue(error);

      const { result } = renderHook(() => useProducts());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBeTruthy();
      expect(result.current.products).toEqual([]);
    });
  });

  describe('useProduct', () => {
    it('should fetch single product by slug', async () => {
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

      vi.mocked(productsService.getProductBySlug).mockResolvedValue(mockProduct);

      const { result } = renderHook(() => useProduct('test-product'));

      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.product).toEqual(mockProduct);
      expect(result.current.error).toBeNull();
    });

    it('should not fetch if slug is undefined', () => {
      const { result } = renderHook(() => useProduct(undefined));

      expect(result.current.loading).toBe(false);
      expect(result.current.product).toBeNull();
      expect(productsService.getProductBySlug).not.toHaveBeenCalled();
    });
  });
});
