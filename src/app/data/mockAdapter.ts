/**
 * Mock Data Adapter
 * Provides mock data when VITE_USE_MOCK_DATA=true
 * This allows seamless switching between mock and real API
 */

import { config } from '@/app/config/env';
import { mockProducts, mockOrders, getProductById, getProductBySlug, getOrderById, getMockAdminStats } from './mockData';
import { calculateOrderTotal } from '@/app/utils/orderCalculation';
import type { Product, Order, User, AuthTokens, AdminStats } from '@/app/types';
import type { GetProductsRequest, CreateOrderRequest, CreateOrderResponse, LoginRequest, LoginResponse, RegisterRequest, RegisterResponse, RefreshTokenResponse, GetAdminOrdersRequest, UpdateOrderStatusRequest } from '@/app/types/api';

/**
 * Check if mock data should be used
 */
export const isMockMode = (): boolean => {
  return config.enableMockData;
};

/**
 * Mock Products Service
 */
export const mockProductsService = {
  async getProducts(params?: GetProductsRequest): Promise<Product[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));

    let products = [...mockProducts];

    // Apply filters
    if (params?.category) {
      products = products.filter(p => p.category === params.category);
    }
    if (params?.popular) {
      products = products.filter(p => p.popular === true);
    }
    if (params?.search) {
      const searchLower = params.search.toLowerCase();
      products = products.filter(p => 
        p.name.toLowerCase().includes(searchLower) ||
        p.description.toLowerCase().includes(searchLower)
      );
    }

    return products;
  },

  async getProductBySlug(slug: string): Promise<Product> {
    await new Promise(resolve => setTimeout(resolve, 200));
    const product = getProductBySlug(slug);
    if (!product) {
      throw new Error(`Product with slug "${slug}" not found`);
    }
    return product;
  },

  async getProductById(id: string): Promise<Product> {
    await new Promise(resolve => setTimeout(resolve, 200));
    const product = getProductById(id);
    if (!product) {
      throw new Error(`Product with id "${id}" not found`);
    }
    return product;
  },
};

/**
 * Mock Orders Service
 */
export const mockOrdersService = {
  async createOrder(data: CreateOrderRequest): Promise<CreateOrderResponse> {
    await new Promise(resolve => setTimeout(resolve, 500));

    const product = getProductById(data.productId);
    if (!product) {
      throw new Error(`Product with id "${data.productId}" not found`);
    }

    const denomination = product.denominations.find(d => d.id === data.denominationId);
    if (!denomination) {
      throw new Error(`Denomination with id "${data.denominationId}" not found`);
    }

    // Calculate totals using centralized commission logic
    const basePrice = denomination.price;
    const { commission, total } = calculateOrderTotal(
      basePrice,
      config.gatewayCommissionPercent,
    );

    // Generate order ID
    const orderId = `ORD-2026-${String(mockOrders.length + 1).padStart(6, '0')}`;

    const order: Order = {
      id: orderId,
      productId: data.productId,
      productName: product.name,
      amount: denomination.amount,
      price: basePrice,
      commission,
      total,
      email: data.email,
      accountId: data.accountId,
      region: data.region,
      server: data.server,
      status: 'pending',
      statusText: 'Ожидает оплаты',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      paymentMethod: data.paymentMethod,
      timeline: [
        {
          timestamp: new Date().toISOString(),
          status: 'created',
          message: 'Заказ создан',
        },
      ],
    };

    // Store in mock orders (in real app, this would be done by backend)
    mockOrders.push(order);

    return {
      order,
      paymentUrl: `https://payment.zvezda.ru/pay/${orderId}`,
      paymentId: `PAY-${orderId}`,
    };
  },

  async getOrder(orderId: string): Promise<Order> {
    await new Promise(resolve => setTimeout(resolve, 200));
    const order = getOrderById(orderId);
    if (!order) {
      throw new Error(`Order with id "${orderId}" not found`);
    }
    return order;
  },

  /**
   * Get user orders (for Account page)
   * In mock mode, returns orders filtered by current user email
   */
  async getUserOrders(): Promise<Order[]> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // In mock mode, get current user from localStorage
    try {
      const storedUser = localStorage.getItem('auth_user');
      if (storedUser) {
        const user = JSON.parse(storedUser) as { email?: string };
        if (user.email) {
          // Return orders for this user
          return mockOrders.filter(o => o.email === user.email);
        }
      }
    } catch {
      // If can't get user, return empty array
    }
    
    // Default: return all orders (for demo purposes)
    return [...mockOrders];
  },
};

/**
 * Mock Payment Service
 */
export const mockPaymentService = {
  async initiatePayment(data: { orderId: string; paymentMethod: 'card' | 'sbp'; returnUrl: string }) {
    await new Promise(resolve => setTimeout(resolve, 300));
    return {
      paymentId: `PAY-${data.orderId}`,
      paymentUrl: `https://payment.zvezda.ru/pay/${data.orderId}`,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 minutes
    };
  },

  async checkPaymentStatus(paymentId: string) {
    await new Promise(resolve => setTimeout(resolve, 200));
    // In mock mode, simulate pending status
    return {
      status: 'pending' as const,
      orderId: paymentId.replace('PAY-', ''),
    };
  },
};

/**
 * Mock Auth Service
 */
const mockUsers: User[] = [
  {
    id: '1',
    email: 'admin@zvezda.ru',
    name: 'Администратор',
    role: 'admin',
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    email: 'user@example.com',
    name: 'Пользователь',
    role: 'user',
    createdAt: new Date().toISOString(),
  },
];

export const mockAuthService = {
  async login(data: LoginRequest): Promise<LoginResponse> {
    await new Promise(resolve => setTimeout(resolve, 500));

    // Mock validation
    if (data.email === 'admin@zvezda.ru' && data.password === 'admin123') {
      const user = mockUsers[0];
      const tokens: AuthTokens = {
        accessToken: `mock-access-token-${user.id}`,
        refreshToken: `mock-refresh-token-${user.id}`,
        expiresIn: 3600,
      };
      return { user, tokens };
    }

    if (data.email === 'user@example.com' && data.password === 'user123') {
      const user = mockUsers[1];
      const tokens: AuthTokens = {
        accessToken: `mock-access-token-${user.id}`,
        refreshToken: `mock-refresh-token-${user.id}`,
        expiresIn: 3600,
      };
      return { user, tokens };
    }

    throw new Error('Неверный email или пароль');
  },

  async register(data: RegisterRequest): Promise<RegisterResponse> {
    await new Promise(resolve => setTimeout(resolve, 500));

    if (data.password !== data.confirmPassword) {
      throw new Error('Пароли не совпадают');
    }

    if (data.password.length < 6) {
      throw new Error('Пароль должен быть не менее 6 символов');
    }

    const newUser: User = {
      id: String(mockUsers.length + 1),
      email: data.email,
      name: data.name,
      role: 'user',
      createdAt: new Date().toISOString(),
    };

    mockUsers.push(newUser);

    const tokens: AuthTokens = {
      accessToken: `mock-access-token-${newUser.id}`,
      refreshToken: `mock-refresh-token-${newUser.id}`,
      expiresIn: 3600,
    };

    return { user: newUser, tokens };
  },

  async refreshToken(refreshToken: string): Promise<RefreshTokenResponse> {
    await new Promise(resolve => setTimeout(resolve, 200));

    // Extract user ID from token (in real app, backend would validate)
    const userId = refreshToken.replace('mock-refresh-token-', '');
    const user = mockUsers.find(u => u.id === userId);

    if (!user) {
      throw new Error('Invalid refresh token');
    }

    const tokens: AuthTokens = {
      accessToken: `mock-access-token-${user.id}`,
      refreshToken: `mock-refresh-token-${user.id}`,
      expiresIn: 3600,
    };

    return { tokens };
  },

  async logout(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 100));
  },

  async getCurrentUser(): Promise<User> {
    await new Promise(resolve => setTimeout(resolve, 200));
    // In mock mode, return admin user
    return mockUsers[0];
  },
};

/**
 * Mock Admin Orders Service
 */
export const mockAdminOrdersService = {
  async getOrders(params?: GetAdminOrdersRequest): Promise<{
    orders: Order[];
    total: number;
    page: number;
    limit: number;
  }> {
    await new Promise(resolve => setTimeout(resolve, 300));

    let filteredOrders = [...mockOrders];

    // Apply filters
    if (params?.status) {
      filteredOrders = filteredOrders.filter(o => o.status === params.status);
    }
    if (params?.productId) {
      filteredOrders = filteredOrders.filter(o => o.productId === params.productId);
    }
    if (params?.email) {
      filteredOrders = filteredOrders.filter(o => 
        o.email.toLowerCase().includes(params.email!.toLowerCase())
      );
    }
    if (params?.dateFrom) {
      const dateFrom = new Date(params.dateFrom);
      filteredOrders = filteredOrders.filter(o => new Date(o.createdAt) >= dateFrom);
    }
    if (params?.dateTo) {
      const dateTo = new Date(params.dateTo);
      filteredOrders = filteredOrders.filter(o => new Date(o.createdAt) <= dateTo);
    }

    // Sort
    const sortBy = params?.sortBy || 'createdAt';
    const sortOrder = params?.sortOrder || 'desc';
    filteredOrders.sort((a, b) => {
      let aVal: string | number;
      let bVal: string | number;

      if (sortBy === 'createdAt') {
        aVal = new Date(a.createdAt).getTime();
        bVal = new Date(b.createdAt).getTime();
      } else if (sortBy === 'total') {
        aVal = a.total;
        bVal = b.total;
      } else {
        aVal = a.status;
        bVal = b.status;
      }

      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    // Pagination
    const page = params?.page || 1;
    const limit = params?.limit || 20;
    const start = (page - 1) * limit;
    const end = start + limit;
    const paginatedOrders = filteredOrders.slice(start, end);

    return {
      orders: paginatedOrders,
      total: filteredOrders.length,
      page,
      limit,
    };
  },

  async getOrder(orderId: string): Promise<Order> {
    await new Promise(resolve => setTimeout(resolve, 200));
    const order = getOrderById(orderId);
    if (!order) {
      throw new Error(`Order with id "${orderId}" not found`);
    }
    return order;
  },

  async updateOrderStatus(orderId: string, data: UpdateOrderStatusRequest): Promise<Order> {
    await new Promise(resolve => setTimeout(resolve, 300));
    const order = getOrderById(orderId);
    if (!order) {
      throw new Error(`Order with id "${orderId}" not found`);
    }

    // Update order in mock data
    order.status = data.status;
    order.statusText = 
      data.status === 'success' ? 'Выполнен' :
      data.status === 'pending' ? 'В обработке' :
      data.status === 'failed' ? 'Ошибка выполнения' :
      'Ручная проверка';
    order.updatedAt = new Date().toISOString();
    
    if (data.voucherCode) {
      order.voucherCode = data.voucherCode;
    }

    return order;
  },

  async retryFulfillment(orderId: string): Promise<Order> {
    await new Promise(resolve => setTimeout(resolve, 500));
    const order = getOrderById(orderId);
    if (!order) {
      throw new Error(`Order with id "${orderId}" not found`);
    }

    // Simulate retry - change status to pending
    order.status = 'pending';
    order.statusText = 'В обработке';
    order.updatedAt = new Date().toISOString();

    return order;
  },

  async getStats(): Promise<AdminStats> {
    await new Promise(resolve => setTimeout(resolve, 200));
    return getMockAdminStats();
  },
};
