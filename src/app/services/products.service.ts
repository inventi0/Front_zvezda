/**
 * Products Service
 * Handles all product-related API calls
 * Automatically switches between mock and real API based on config
 */

import { apiClient } from '@/app/api/client';
import { mockProductsService, isMockMode } from '@/app/data/mockAdapter';
import { z } from 'zod';
import { validateApiResponse } from '@/app/utils/apiValidation';
import {
  GetProductsResponseSchema,
  ProductSchema,
} from '@/app/types/schemas';
import type {
  GetProductsRequest,
  GetProductsResponse,
  GetProductBySlugResponse,
} from '@/app/types/api';
import type { Product } from '@/app/types';

const realProductsService = {
  /**
   * Get all products with optional filters
   * 
   * @example
   * GET /api/products?category=games&popular=true
   */
  async getProducts(params?: GetProductsRequest): Promise<Product[]> {
    const queryParams = new URLSearchParams();
    
    if (params?.category) {
      queryParams.append('category', params.category);
    }
    if (params?.search) {
      queryParams.append('search', params.search);
    }
    if (params?.popular !== undefined) {
      queryParams.append('popular', String(params.popular));
    }

    const queryString = queryParams.toString();
    const path = queryString ? `/products?${queryString}` : '/products';

    const response = await apiClient.get<GetProductsResponse>(path);
    const validated = validateApiResponse(response, GetProductsResponseSchema, 'getProducts');
    return validated.products;
  },

  /**
   * Get product by slug
   * 
   * @example
   * GET /api/products/steam-wallet
   */
  async getProductBySlug(slug: string): Promise<Product> {
    const response = await apiClient.get<GetProductBySlugResponse>(`/products/${slug}`);
    const validated = validateApiResponse(response, z.object({ product: ProductSchema }), `getProductBySlug(${slug})`);
    return validated.product;
  },

  /**
   * Get product by ID
   * 
   * @example
   * GET /api/products/by-id/123
   */
  async getProductById(id: string): Promise<Product> {
    const response = await apiClient.get<GetProductBySlugResponse>(`/products/by-id/${id}`);
    const validated = validateApiResponse(response, z.object({ product: ProductSchema }), `getProductById(${id})`);
    return validated.product;
  },
};

// Export service that switches between mock and real
export const productsService = isMockMode() ? mockProductsService : realProductsService;
