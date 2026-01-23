/**
 * Core domain types for Звезда platform
 * These types represent the business domain and are shared across the application
 */

// ============================================================================
// PRODUCT TYPES
// ============================================================================

export type ProductType = 'top-up' | 'voucher' | 'gift-card';
export type ProductCategory = 'games' | 'wallet' | 'services' | 'subscriptions';
export type DeliverySpeed = 'instant' | 'fast' | 'manual';

export interface Product {
  id: string;
  name: string;
  slug: string;
  category: ProductCategory;
  type: ProductType;
  logo: string;
  description: string;
  regions?: string[];
  servers?: string[];
  denominations: Denomination[];
  deliverySpeed: DeliverySpeed;
  deliveryTimeText: string;
  instructions?: string;
  warnings?: string[];
  popular?: boolean;
  features?: string[];
  faq?: { question: string; answer: string }[];
}

export interface Denomination {
  id: string;
  amount: number;
  currency: string;
  price: number;
  discount?: number;
  bonus?: string;
}

// ============================================================================
// ORDER TYPES
// ============================================================================

export type OrderStatus = 'pending' | 'success' | 'failed' | 'manual_review';
export type PaymentMethod = 'card' | 'sbp';

export interface Order {
  id: string;
  productId: string;
  productName: string;
  amount: number;
  price: number;
  commission: number;
  total: number;
  email: string;
  accountId?: string;
  region?: string;
  server?: string;
  status: OrderStatus;
  statusText: string;
  createdAt: string;
  updatedAt: string;
  paymentMethod: PaymentMethod;
  voucherCode?: string;
  timeline: OrderTimelineEvent[];
  failureReason?: string;
  provider?: string;
}

export interface OrderTimelineEvent {
  timestamp: string;
  status: string;
  message: string;
}

// ============================================================================
// CALCULATION TYPES
// ============================================================================

export interface OrderCalculation {
  basePrice: number;
  commission: number;
  commissionPercent: number;
  total: number;
}

// ============================================================================
// ADMIN TYPES
// ============================================================================

export interface AdminStats {
  totalRevenue: number;
  todayRevenue: number;
  totalOrders: number;
  todayOrders: number;
  successRate: number;
  averageOrderValue: number;
  popularProducts: { productId: string; count: number; revenue: number }[];
  revenueByDay: { date: string; revenue: number; orders: number }[];
}

// ============================================================================
// SUPPORT / TICKETS
// ============================================================================

export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

export type TicketType = 'payment' | 'fulfillment' | 'account' | 'other';

export interface TicketMessage {
  id: string;
  author: 'user' | 'operator' | 'system';
  text: string;
  createdAt: string;
  internal: boolean;
}

export interface Ticket {
  id: string;
  orderId: string;
  userEmail: string;
  type: TicketType;
  subject: string;
  description: string;
  status: TicketStatus;
  createdAt: string;
  updatedAt: string;
  messages: TicketMessage[];
}

export interface AdminOrderFilters {
  status?: OrderStatus;
  productId?: string;
  dateFrom?: string;
  dateTo?: string;
  email?: string;
}

// ============================================================================
// VALIDATION TYPES
// ============================================================================

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export interface FormErrors {
  email?: string;
  accountId?: string;
  amount?: string;
  region?: string;
  server?: string;
}

// ============================================================================
// AUTH TYPES
// ============================================================================

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}
