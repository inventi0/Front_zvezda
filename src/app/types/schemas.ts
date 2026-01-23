/**
 * Zod schemas for runtime API response validation
 * These schemas ensure API responses match expected types
 */

import { z } from 'zod';
import type { Product, Order, ProductCategory, ProductType, DeliverySpeed, OrderStatus } from './index';

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
  failureReason: z.string().optional(),
  voucherCode: z.string().optional(),
  note: z.string().optional(),
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
