/**
 * Zod schemas for runtime API response validation
 * These schemas ensure API responses match expected types
 */

import { z } from 'zod';
import type {
  Product,
  Order,
  OrderTimelineEvent,
  ProductCategory,
  ProductType,
  DeliverySpeed,
  OrderStatus,
  GameCategory,
  ProductTypeEntity,
  Seller,
  Review,
} from './index';

/**
 * Denomination schema
 */
export const DenominationSchema = z.object({
  id: z.string(),
  amount: z.number(),
  currency: z.string(),
  price: z.number(),
  discount: z.number().optional(),
  bonus: z.string().optional(),
});

/**
 * Product schema
 */
export const ProductSchema: z.ZodType<Product> = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  category: z.enum(['games', 'wallet', 'services', 'subscriptions']) as z.ZodType<ProductCategory>,
  type: z.enum(['top-up', 'voucher', 'gift-card']) as z.ZodType<ProductType>,
  logo: z.string(),
  description: z.string(),
  regions: z.array(z.string()).optional(),
  servers: z.array(z.string()).optional(),
  denominations: z.array(DenominationSchema),
  deliverySpeed: z.enum(['instant', 'fast', 'manual']) as z.ZodType<DeliverySpeed>,
  deliveryTimeText: z.string(),
  instructions: z.string().optional(),
  warnings: z.array(z.string()).optional(),
  popular: z.boolean().optional(),
  features: z.array(z.string()).optional(),
  faq: z.array(z.object({
    question: z.string(),
    answer: z.string(),
  })).optional(),
  gameCategoryId: z.string().optional(),
  productTypeId: z.string().optional(),
  sellerId: z.string().optional(),
  rating: z.number().min(0).max(5).optional(),
  reviewsCount: z.number().int().nonnegative().optional(),
});

export const GameCategorySchema: z.ZodType<GameCategory> = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  icon: z.string(),
});

export const ProductTypeEntitySchema: z.ZodType<ProductTypeEntity> = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  icon: z.string(),
});

export const SellerSchema: z.ZodType<Seller> = z.object({
  id: z.string(),
  nickname: z.string(),
  avatar: z.string(),
  rating: z.number(),
  reviewsCount: z.number(),
  salesCount: z.number(),
});

export const ReviewSchema: z.ZodType<Review> = z.object({
  id: z.string(),
  productId: z.string(),
  sellerId: z.string().optional(),
  orderId: z.string().optional(),
  rating: z.number(),
  text: z.string(),
  createdAt: z.string(),
});

const OrderTimelineEventSchema: z.ZodType<OrderTimelineEvent> = z.object({
  timestamp: z.string(),
  status: z.string(),
  message: z.string(),
});

/**
 * Order schema
 */
export const OrderSchema: z.ZodType<Order> = z.object({
  id: z.string(),
  productId: z.string(),
  productName: z.string(),
  amount: z.number(),
  price: z.number(),
  commission: z.number(),
  total: z.number(),
  email: z.string().email(),
  accountId: z.string().optional(),
  region: z.string().optional(),
  server: z.string().optional(),
  status: z.enum(['pending', 'success', 'failed', 'manual_review']) as z.ZodType<OrderStatus>,
  statusText: z.string(),
  paymentMethod: z.enum(['card', 'sbp']),
  createdAt: z.string(),
  updatedAt: z.string(),
  timeline: z.array(OrderTimelineEventSchema),
  failureReason: z.string().optional(),
  voucherCode: z.string().optional(),
  provider: z.string().optional(),
  note: z.string().optional(),
  escrowStatus: z.enum(['PAID', 'IN_ESCROW', 'DELIVERED', 'DISPUTE', 'RELEASED']).optional(),
  sellerId: z.string().optional(),
});

/**
 * Products array schema
 */
export const ProductsArraySchema = z.array(ProductSchema);

/**
 * Orders array schema
 */
export const OrdersArraySchema = z.array(OrderSchema);

/**
 * Get products response schema
 */
export const GetProductsResponseSchema = z.object({
  products: ProductsArraySchema,
  total: z.number().optional(),
});

/**
 * Get order response schema
 */
export const GetOrderResponseSchema = z.object({
  order: OrderSchema,
});

/**
 * Create order response schema
 */
export const CreateOrderResponseSchema = z.object({
  order: OrderSchema,
  paymentUrl: z.string().optional(),
  paymentId: z.string().optional(),
});
