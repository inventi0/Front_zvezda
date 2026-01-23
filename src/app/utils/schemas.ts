/**
 * Zod Validation Schemas
 * Centralized validation schemas for all forms
 */

import { z } from 'zod';
import type { ProductType } from '@/app/types';

/**
 * Email validation schema
 */
export const emailSchema = z
  .string()
  .min(1, 'Email обязателен')
  .email('Email введен неверно')
  .toLowerCase()
  .trim();

/**
 * Account ID validation schema based on product type
 */
export const accountIdSchema = (productType: ProductType) => {
  const baseSchema = z
    .string()
    .min(1, 'ID аккаунта обязателен')
    .min(3, 'ID должен быть не менее 3 символов')
    .max(100, 'ID слишком длинный');

  if (productType === 'top-up') {
    return baseSchema.regex(
      /^[a-zA-Z0-9_-]+$/,
      'ID содержит недопустимые символы'
    );
  }

  return baseSchema.optional();
};

/**
 * Password validation schema
 */
export const passwordSchema = z
  .string()
  .min(1, 'Пароль обязателен')
  .min(6, 'Пароль должен быть не менее 6 символов')
  .max(100, 'Пароль слишком длинный');

/**
 * Name validation schema
 */
export const nameSchema = z
  .string()
  .min(1, 'Имя обязательно')
  .min(2, 'Имя должно быть не менее 2 символов')
  .max(100, 'Имя слишком длинное')
  .trim();

/**
 * Login form schema
 */
export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export type LoginFormData = z.infer<typeof loginSchema>;

/**
 * Register form schema
 */
export const registerSchema = z
  .object({
    name: nameSchema,
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Подтвердите пароль'),
    acceptTerms: z.boolean().refine((val) => val === true, {
      message: 'Необходимо принять условия использования',
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Пароли не совпадают',
    path: ['confirmPassword'],
  });

export type RegisterFormData = z.infer<typeof registerSchema>;

/**
 * Quick checkout form schema (Home page)
 */
export const quickCheckoutSchema = (productType: ProductType) =>
  z.object({
    email: emailSchema,
    accountId: accountIdSchema(productType),
    denominationId: z.string().min(1, 'Выберите сумму'),
  });

export type QuickCheckoutFormData = z.infer<ReturnType<typeof quickCheckoutSchema>>;

/**
 * Product checkout form schema (Product page)
 */
export const productCheckoutSchema = (productType: ProductType, hasRegions: boolean, hasServers: boolean) => {
  const baseSchema = z.object({
    email: emailSchema,
    accountId: accountIdSchema(productType),
    denominationId: z.string().min(1, 'Выберите сумму'),
    region: hasRegions ? z.string().min(1, 'Выберите регион') : z.string().optional(),
    server: hasServers ? z.string().min(1, 'Выберите сервер') : z.string().optional(),
  });

  return baseSchema;
};

export type ProductCheckoutFormData = z.infer<ReturnType<typeof productCheckoutSchema>>;

/**
 * Create order request schema (validates data before API call)
 */
export const createOrderSchema = z.object({
  productId: z.string().min(1, 'ID товара обязателен'),
  denominationId: z.string().min(1, 'ID номинала обязателен'),
  email: emailSchema,
  accountId: z.string().optional(),
  region: z.string().optional(),
  server: z.string().optional(),
  paymentMethod: z.enum(['card', 'sbp'], {
    required_error: 'Выберите способ оплаты',
  }),
});

export type CreateOrderFormData = z.infer<typeof createOrderSchema>;

/**
 * Support ticket schema
 */
export const supportTicketSchema = z.object({
  orderId: z.string().min(1, 'ID заказа обязателен'),
  subject: z.string().min(1, 'Тема обязательна').min(5, 'Тема должна быть не менее 5 символов').max(200, 'Тема слишком длинная'),
  description: z.string().min(1, 'Описание обязательно').min(10, 'Описание должно быть не менее 10 символов').max(2000, 'Описание слишком длинное'),
  type: z.enum(['payment', 'fulfillment', 'account', 'other'], {
    required_error: 'Выберите тип проблемы',
  }),
});

export type SupportTicketFormData = z.infer<typeof supportTicketSchema>;
