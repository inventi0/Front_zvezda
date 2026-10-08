/**
 * Core domain types for Звезда platform
 * These types represent the business domain and are shared across the application
 */

// ============================================================================
// PRODUCT TYPES
// ============================================================================

export type ProductType = 'top-up' | 'voucher' | 'gift-card';
export type ProductCategory = 'games' | 'wallet' | 'services' | 'subscriptions';
export type FulfillmentType = 'activation-code' | 'account-top-up';
export type FulfillmentChannel = 'protected-order-page' | 'target-account';
export type DeliveryEstimate = 'instant' | 'up-to-3-minutes' | 'up-to-10-minutes' | 'manual-review';

export interface ProductFulfillment {
  type: FulfillmentType;
  channel: FulfillmentChannel;
  estimate: DeliveryEstimate;
}

/** Category layer: Game/Platform (e.g. Steam, Fortnite). Optional; existing products work without it. */
export interface GameCategory {
  id: string;
  slug: string;
  title: string;
  icon: string;
}

/** Product type entity (Top-Up, Voucher, Gift Card) with id/slug/title/icon. Optional layer. */
export interface ProductTypeEntity {
  id: string;
  slug: string;
  title: string;
  icon: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  category: ProductCategory;
  type: ProductType;
  logo: string;
  image?: string;
  productPageImage?: string;
  gallery?: string[];
  description: string;
  regions?: string[];
  servers?: string[];
  denominations: Denomination[];
  fulfillment: ProductFulfillment;
  instructions?: string;
  warnings?: string[];
  popular?: boolean;
  features?: string[];
  faq?: { question: string; answer: string }[];
  /** Optional: link to GameCategory. New products may use it. */
  gameCategoryId?: string;
  /** Optional: link to ProductTypeEntity. New products may use it. */
  productTypeId?: string;
  /** Optional: aggregate rating 0–5. Trust layer. */
  rating?: number;
  /** Optional: number of reviews. Trust layer. */
  reviewsCount?: number;
  optionLabel?: string;
  options?: ProductOption[];
  /** Optional: seller id when product is from seller catalog. */
  sellerId?: string;
}

export interface ProductOption {
  id: string;
  label: string;
  description?: string;
}

export interface Denomination {
  id: string;
  amount: number;
  currency: string;
  price: number;
  label?: string;
  optionId?: string;
  discount?: number;
  bonus?: string;
}

// ============================================================================
// ORDER TYPES
// ============================================================================

export type OrderStatus = 'pending' | 'success' | 'failed' | 'manual_review';

/** Escrow sub-state for order. Frontend-ready for future backend. */
export type EscrowStatus = 'PAID' | 'IN_ESCROW' | 'DELIVERED' | 'DISPUTE' | 'RELEASED';

export type PaymentMethod = 'card' | 'sbp';

export interface Order {
  id: string;
  productId: string;
  productName: string;
  denominationId?: string;
  denominationLabel?: string;
  optionId?: string;
  optionLabel?: string;
  optionValue?: string;
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
  /** Optional: escrow state. Shown on OrderStatus when present. */
  escrowStatus?: EscrowStatus;
  /** Optional: seller id when order is from seller product. Shown in admin order detail. */
  sellerId?: string;
  /** Optional: admin note (e.g. from status update). */
  note?: string;
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
// TRUST / SELLER TYPES
// ============================================================================

export interface Seller {
  id: string;
  nickname: string;
  avatar: string;
  rating: number;
  reviewsCount: number;
  salesCount: number;
}

export interface Review {
  id: string;
  /** Product this review is for. */
  productId: string;
  /** Optional: seller for seller-level reviews. */
  sellerId?: string;
  /** Optional: order Id when review left after purchase. */
  orderId?: string;
  rating: number;
  text: string;
  createdAt: string;
}

export interface PlatformStats {
  totalOrders: number;
  successRate: number;
  averageDeliveryMinutes: number;
  activeSellers: number;
  totalReviews: number;
  averageRating: number;
}

// ============================================================================
// AUTH TYPES
// ============================================================================

export type UserRole = 'user' | 'admin' | 'seller' | 'support';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: string;
}

/** Заявка на продавца (онбординг). */
export interface SellerApplication {
  id: string;
  email: string;
  name: string;
  description?: string;
  acceptedRules: boolean;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}
