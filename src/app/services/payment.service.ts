/**
 * Payment Service
 * Handles payment-related API calls
 * Automatically switches between mock and real API based on config
 */

import { apiClient } from '@/app/api/client';
import { mockPaymentService, isMockMode } from '@/app/data/mockAdapter';
import type {
  InitiatePaymentRequest,
  InitiatePaymentResponse,
  CheckPaymentStatusResponse,
} from '@/app/types/api';

const realPaymentService = {
  /**
   * Initiate payment for an order
   * 
   * @example
   * POST /api/payment/initiate
   * Body: {
   *   orderId: "ORD-2026-000123",
   *   paymentMethod: "card",
   *   returnUrl: "https://zvezda.ru/order/ORD-2026-000123"
   * }
   */
  async initiatePayment(data: InitiatePaymentRequest): Promise<InitiatePaymentResponse> {
    return apiClient.post<InitiatePaymentResponse>('/payment/initiate', data);
  },

  /**
   * Check payment status
   * 
   * @example
   * GET /api/payment/status?paymentId=PAY-123
   */
  async checkPaymentStatus(paymentId: string): Promise<CheckPaymentStatusResponse> {
    return apiClient.get<CheckPaymentStatusResponse>(
      `/payment/status?paymentId=${paymentId}`
    );
  },
};

// Export service that switches between mock and real
export const paymentService = isMockMode() ? mockPaymentService : realPaymentService;
