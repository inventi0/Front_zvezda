/**
 * Create Order Hook
 * React hook for creating orders
 */

import { useState } from 'react';
import { ordersService, paymentService } from '@/app/services';
import type { CreateOrderRequest } from '@/app/types/api';
import { ApiClientError } from '@/app/api/client';

interface UseCreateOrderResult {
  createOrder: (data: CreateOrderRequest) => Promise<void>;
  initiatePayment: (orderId: string, paymentMethod: 'card' | 'sbp') => Promise<string>;
  loading: boolean;
  error: string | null;
}

/**
 * Hook to create order and initiate payment
 */
export function useCreateOrder(): UseCreateOrderResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createOrder = async (data: CreateOrderRequest): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      await ordersService.createOrder(data);
    } catch (err) {
      const message =
        err instanceof ApiClientError
          ? err.message
          : 'Не удалось создать заказ';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const initiatePayment = async (
    orderId: string,
    paymentMethod: 'card' | 'sbp'
  ): Promise<string> => {
    setLoading(true);
    setError(null);

    try {
      const returnUrl = `${window.location.origin}/order/${orderId}`;
      const response = await paymentService.initiatePayment({
        orderId,
        paymentMethod,
        returnUrl,
      });
      return response.paymentUrl;
    } catch (err) {
      const message =
        err instanceof ApiClientError
          ? err.message
          : 'Не удалось инициировать оплату';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    createOrder,
    initiatePayment,
    loading,
    error,
  };
}
