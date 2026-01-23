/**
 * API Request/Response types
 * These types define the contract between frontend and backend
 */

import type { Product, Order, OrderStatus, AdminStats, AdminOrderFilters } from './index';

// ============================================================================
// COMMON API TYPES
// ============================================================================

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// ============================================================================
// PRODUCTS API
// ============================================================================

export interface GetProductsRequest {
  category?: string;
  search?: string;
  popular?: boolean;
}

export interface GetProductsResponse {
  products: Product[];
}

export interface GetProductBySlugResponse {
  product: Product;
}

// ============================================================================
// ORDERS API
// ============================================================================

export interface CreateOrderRequest {
  productId: string;
  denominationId: string;
  email: string;
  accountId?: string;
  region?: string;
  server?: string;
  paymentMethod: 'card' | 'sbp';
}

export interface CreateOrderResponse {
  order: Order;
  paymentUrl?: string;
  paymentId?: string;
}

export interface GetOrderResponse {
  order: Order;
}

export interface UpdateOrderStatusRequest {
  status: OrderStatus;
  failureReason?: string;
  voucherCode?: string;
  note?: string;
}

export interface UpdateOrderStatusResponse {
  order: Order;
}

// ============================================================================
// PAYMENT API
// ============================================================================

export interface InitiatePaymentRequest {
  orderId: string;
  paymentMethod: 'card' | 'sbp';
  returnUrl: string;
}

export interface InitiatePaymentResponse {
  paymentId: string;
  paymentUrl: string;
  expiresAt: string;
}

export interface CheckPaymentStatusResponse {
  status: 'pending' | 'success' | 'failed';
  orderId: string;
}

// ============================================================================
// ADMIN API
// ============================================================================

export interface GetAdminOrdersRequest extends AdminOrderFilters {
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'total' | 'status';
  sortOrder?: 'asc' | 'desc';
}

export interface GetAdminOrdersResponse {
  orders: Order[];
  total: number;
  page: number;
  limit: number;
}

export interface GetAdminStatsResponse {
  stats: AdminStats;
}

export interface RetryOrderFulfillmentRequest {
  orderId: string;
}

export interface RetryOrderFulfillmentResponse {
  order: Order;
}

// ============================================================================
// AUTH API
// ============================================================================

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface LoginResponse {
  user: User;
  tokens: AuthTokens;
}

export interface RegisterResponse {
  user: User;
  tokens: AuthTokens;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  tokens: AuthTokens;
}
