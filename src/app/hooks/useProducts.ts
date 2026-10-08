/**
 * Products Hooks
 * React hooks for product data fetching
 */

import { useState, useEffect, useCallback } from 'react';
import { productsService } from '@/app/services';
import type { Product } from '@/app/types';
import { ApiClientError } from '@/app/api/client';
import { logger } from '@/app/utils/logger';
import { CATALOG_STORAGE_KEY, CATALOG_UPDATED_EVENT } from '@/app/admin/catalogEvents';

interface UseProductsOptions {
  category?: string;
  search?: string;
  popular?: boolean;
  enabled?: boolean;
}

interface UseProductsResult {
  products: Product[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch products list
 */
export function useProducts(options: UseProductsOptions = {}): UseProductsResult {
  const { category, search, popular, enabled = true } = options;
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    if (!enabled) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await productsService.getProducts({
        category,
        search,
        popular,
      });
      setProducts(data);
    } catch (err) {
      const message =
        err instanceof ApiClientError
          ? err.message
          : 'Не удалось загрузить товары';
      setError(message);
      logger.error('Failed to fetch products', err);
    } finally {
      setLoading(false);
    }
  }, [category, search, popular, enabled]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    const refresh = () => { void fetchProducts(); };
    const refreshFromStorage = (event: StorageEvent) => {
      if (event.key === CATALOG_STORAGE_KEY) refresh();
    };
    window.addEventListener(CATALOG_UPDATED_EVENT, refresh);
    window.addEventListener('storage', refreshFromStorage);
    return () => {
      window.removeEventListener(CATALOG_UPDATED_EVENT, refresh);
      window.removeEventListener('storage', refreshFromStorage);
    };
  }, [fetchProducts]);

  return {
    products,
    loading,
    error,
    refetch: fetchProducts,
  };
}

interface UseProductResult {
  product: Product | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch single product by slug
 */
export function useProduct(slug: string | undefined): UseProductResult {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProduct = useCallback(async () => {
    if (!slug) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await productsService.getProductBySlug(slug);
      setProduct(data);
    } catch (err) {
      const message =
        err instanceof ApiClientError
          ? err.message
          : 'Не удалось загрузить товар';
      setError(message);
      logger.error('Failed to fetch product', err);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  useEffect(() => {
    const refresh = () => { void fetchProduct(); };
    const refreshFromStorage = (event: StorageEvent) => {
      if (event.key === CATALOG_STORAGE_KEY) refresh();
    };
    window.addEventListener(CATALOG_UPDATED_EVENT, refresh);
    window.addEventListener('storage', refreshFromStorage);
    return () => {
      window.removeEventListener(CATALOG_UPDATED_EVENT, refresh);
      window.removeEventListener('storage', refreshFromStorage);
    };
  }, [fetchProduct]);

  return {
    product,
    loading,
    error,
    refetch: fetchProduct,
  };
}
