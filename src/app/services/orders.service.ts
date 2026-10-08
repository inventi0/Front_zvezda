/**
 * Orders Service
 * Handles all order-related API calls
 * Automatically switches between mock and real API based on config
 */

import { z } from 'zod';
import { apiClient } from '@/app/api/client';
import { mockOrdersService, isMockMode } from '@/app/data/mockAdapter';
import { validateApiResponse } from '@/app/utils/apiValidation';
import {
  CreateOrderResponseSchema,
  OrderSchema,
  OrdersArraySchema,
} from '@/app/types/schemas';
import type {
  CreateOrderRequest,
  CreateOrderResponse,
  GetOrderResponse,
} from '@/app/types/api';
import type { Order } from '@/app/types';

const realOrdersService = {
  /**
   * Create a new order
   * 
   * @example
   * POST /api/orders
   * Body: {
   *   productId: "1",
   *   denominationId: "1-1",
   *   optionId: "region-eu",
   *   email: "user@example.com",
   *   accountId: "steamuser123",
   *   region: "RU",
   *   paymentMethod: "card"
   * }
   */
  async createOrder(data: CreateOrderRequest): Promise<CreateOrderResponse> {
    const response = await apiClient.post<CreateOrderResponse>('/orders', data);
    return validateApiResponse(response, CreateOrderResponseSchema, 'createOrder');
  },

  /**
   * Get order by ID
   * 
   * @example
   * GET /api/orders/ORD-2026-000123
   */
  async getOrder(orderId: string): Promise<Order> {
    const response = await apiClient.get<GetOrderResponse>(`/orders/${orderId}`);
    const validated = validateApiResponse(response, z.object({ order: OrderSchema }), `getOrder(${orderId})`);
    return validated.order;
  },

  /**
   * Get user orders
   * 
   * @example
   * GET /api/user/orders
   */
  async getUserOrders(): Promise<Order[]> {
    const response = await apiClient.get<{ orders: Order[] }>('/user/orders');
    const validated = validateApiResponse(response, z.object({ orders: OrdersArraySchema }), 'getUserOrders');
    return validated.orders;
  },
};

// Export service that switches between mock and real
export const ordersService = isMockMode() ? mockOrdersService : realOrdersService;
