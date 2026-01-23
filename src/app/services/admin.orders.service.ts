/**
 * Admin Orders Service
 * Handles admin order management API calls
 * Automatically switches between mock and real API based on config
 */

import { apiClient } from '@/app/api/client';
import { mockAdminOrdersService, isMockMode } from '@/app/data/mockAdapter';
import type {
  GetAdminOrdersRequest,
  GetAdminOrdersResponse,
  GetAdminStatsResponse,
  UpdateOrderStatusRequest,
  UpdateOrderStatusResponse,
  RetryOrderFulfillmentResponse,
} from '@/app/types/api';
import type { Order, AdminStats } from '@/app/types';

const realAdminOrdersService = {
  /**
   * Get orders with filters and pagination
   * 
   * @example
   * GET /api/admin/orders?status=pending&page=1&limit=20
   */
  async getOrders(params?: GetAdminOrdersRequest): Promise<{
    orders: Order[];
    total: number;
    page: number;
    limit: number;
  }> {
    const queryParams = new URLSearchParams();

    if (params?.status) {
      queryParams.append('status', params.status);
    }
    if (params?.productId) {
      queryParams.append('productId', params.productId);
    }
    if (params?.dateFrom) {
      queryParams.append('dateFrom', params.dateFrom);
    }
    if (params?.dateTo) {
      queryParams.append('dateTo', params.dateTo);
    }
    if (params?.email) {
      queryParams.append('email', params.email);
    }
    if (params?.page) {
      queryParams.append('page', String(params.page));
    }
    if (params?.limit) {
      queryParams.append('limit', String(params.limit));
    }
    if (params?.sortBy) {
      queryParams.append('sortBy', params.sortBy);
    }
    if (params?.sortOrder) {
      queryParams.append('sortOrder', params.sortOrder);
    }

    const queryString = queryParams.toString();
    const path = queryString ? `/admin/orders?${queryString}` : '/admin/orders';

    return apiClient.get<GetAdminOrdersResponse>(path);
  },

  /**
   * Get order by ID (admin)
   * 
   * @example
   * GET /api/admin/orders/ORD-2026-000123
   */
  async getOrder(orderId: string): Promise<Order> {
    const response = await apiClient.get<{ order: Order }>(`/admin/orders/${orderId}`);
    return response.order;
  },

  /**
   * Update order status
   * 
   * @example
   * PUT /api/admin/orders/ORD-2026-000123/status
   * Body: {
   *   status: "success",
   *   voucherCode: "XXXX-XXXX-XXXX-XXXX",
   *   note: "Order fulfilled successfully"
   * }
   */
  async updateOrderStatus(
    orderId: string,
    data: UpdateOrderStatusRequest
  ): Promise<Order> {
    const response = await apiClient.put<UpdateOrderStatusResponse>(
      `/admin/orders/${orderId}/status`,
      data
    );
    return response.order;
  },

  /**
   * Retry order fulfillment
   * 
   * @example
   * POST /api/admin/orders/ORD-2026-000123/retry
   */
  async retryFulfillment(orderId: string): Promise<Order> {
    const response = await apiClient.post<RetryOrderFulfillmentResponse>(
      `/admin/orders/${orderId}/retry`
    );
    return response.order;
  },

  /**
   * Get admin statistics
   * 
   * @example
   * GET /api/admin/stats
   */
  async getStats(): Promise<AdminStats> {
    const response = await apiClient.get<GetAdminStatsResponse>('/admin/stats');
    return response.stats;
  },
};

// Export service that switches between mock and real
export const adminOrdersService = isMockMode() ? mockAdminOrdersService : realAdminOrdersService;
