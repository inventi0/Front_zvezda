import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useOrder } from './useOrders';
import { ordersService } from '@/app/services';
import type { Order } from '@/app/types';

// Mock the service
vi.mock('@/app/services', () => ({
  ordersService: {
    getOrder: vi.fn(),
  },
}));

describe('useOrder', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch order successfully', async () => {
    const mockOrder: Order = {
      id: 'ORD-123',
      productId: '1',
      productName: 'Test Product',
      amount: 1000,
      price: 1000,
      commission: 100,
      total: 1100,
      email: 'test@example.com',
      status: 'pending',
      statusText: 'В обработке',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      paymentMethod: 'card',
      timeline: [],
    };

    vi.mocked(ordersService.getOrder).mockResolvedValue(mockOrder);

    const { result } = renderHook(() => useOrder('ORD-123'));

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.order).toEqual(mockOrder);
    expect(result.current.error).toBeNull();
  });

  it('should handle errors', async () => {
    const error = new Error('Order not found');
    vi.mocked(ordersService.getOrder).mockRejectedValue(error);

    const { result } = renderHook(() => useOrder('ORD-123'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBeTruthy();
    expect(result.current.order).toBeNull();
  });

  it('should not fetch if orderId is undefined', () => {
    const { result } = renderHook(() => useOrder(undefined));

    expect(result.current.loading).toBe(false);
    expect(result.current.order).toBeNull();
    expect(ordersService.getOrder).not.toHaveBeenCalled();
  });
});
