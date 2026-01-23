/**
 * Orders Hooks
 * React hooks for order data fetching and management
 */

import { useState, useEffect, useCallback } from 'react';
import { ordersService } from '@/app/services';
import type { Order } from '@/app/types';
import { ApiClientError } from '@/app/api/client';
import { logger } from '@/app/utils/logger';

interface UseOrderResult {
  order: Order | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch order by ID
 */
export function useOrder(orderId: string | undefined): UseOrderResult {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrder = useCallback(async () => {
    if (!orderId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await ordersService.getOrder(orderId);
      setOrder(data);
    } catch (err) {
      const message =
        err instanceof ApiClientError
          ? err.message
          : 'Не удалось загрузить заказ';
      setError(message);
      logger.error('Failed to fetch order', err);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  return {
    order,
    loading,
    error,
    refetch: fetchOrder,
  };
}

/**
 * Hook to poll order status (for pending orders)
 */
export function useOrderPolling(
  orderId: string | undefined,
  enabled: boolean = true,
  interval: number = 5000
): UseOrderResult {
  const { order, loading, error, refetch } = useOrder(orderId);

  useEffect(() => {
    if (!enabled || !orderId || order?.status !== 'pending') {
      return;
    }

    const pollInterval = setInterval(() => {
      refetch();
    }, interval);

    return () => clearInterval(pollInterval);
  }, [enabled, orderId, order?.status, interval, refetch]);

  return { order, loading, error, refetch };
}
