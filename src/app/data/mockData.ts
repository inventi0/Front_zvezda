/**
 * Mock data for the digital marketplace platform
 * All types are imported from @/app/types to avoid duplication
 */

import type {
  Product,
  Order,
  ProductCategory,
  PaymentMethod,
  AdminStats,
} from '@/app/types';

// Mock Products
export const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Steam Пополнение',
    slug: 'steam-wallet',
    category: 'games',
    type: 'top-up',
    logo: '',
    description: 'Пополнение кошелька Steam без комиссии. Мгновенное зачисление средств.',
    regions: ['RU', 'US', 'EU', 'TR'],
    denominations: [
      { id: '1-1', amount: 500, currency: 'RUB', price: 500 },
      { id: '1-2', amount: 1000, currency: 'RUB', price: 1000 },
      { id: '1-3', amount: 2000, currency: 'RUB', price: 2000 },
      { id: '1-4', amount: 5000, currency: 'RUB', price: 5000 },
    ],
    deliverySpeed: 'instant',
    deliveryTimeText: 'Моментально',
    instructions: 'Укажите ваш Steam ID. Найти его можно в профиле Steam (в URL после /id/).',
    warnings: ['Убедитесь, что ваш профиль Steam публичный', 'Регион аккаунта должен совпадать с выбранным регионом'],
    popular: true,
    features: [
      'Автоматическое зачисление за 1-3 минуты',
      'Поддержка всех регионов',
      'Без скрытых комиссий',
      'Гарантия возврата при ошибке'
    ],
    faq: [
      { question: 'Как найти мой Steam ID?', answer: 'Откройте ваш профиль Steam, скопируйте часть URL после /id/ или /profiles/' },
      { question: 'Сколько времени зачисляются средства?', answer: 'Обычно 1-3 минуты после подтверждения оплаты' },
      { question: 'Какие регионы поддерживаются?', answer: 'RU, US, EU, TR - выберите регион вашего аккаунта' }
    ]
  },
  {
    id: '2',
    name: 'Telegram Stars',
    slug: 'telegram-stars',
    category: 'services',
    type: 'top-up',
    logo: '',
    description: 'Пополнение Telegram Stars для покупки стикеров и премиум-контента.',
    denominations: [
      { id: '2-1', amount: 100, currency: 'Stars', price: 199 },
      { id: '2-2', amount: 500, currency: 'Stars', price: 899, bonus: '+50 бонусных Stars' },
      { id: '2-3', amount: 1000, currency: 'Stars', price: 1699, bonus: '+100 бонусных Stars' },
    ],
    deliverySpeed: 'instant',
    deliveryTimeText: 'До 3 минут',
    instructions: 'Укажите ваш Telegram username (без @).',
    popular: true,
    features: [
      'Мгновенное зачисление',
      'Бонусы за крупные покупки',
      'Поддержка Premium подписок',
      'Безопасные платежи'
    ],
    faq: [
      { question: 'Что такое Telegram Stars?', answer: 'Внутренняя валюта Telegram для покупки премиум-контента, стикеров и подарков' },
      { question: 'Как использовать Stars?', answer: 'Купите стикеры, премиум-контент или подарки в приложении Telegram' }
    ]
  },
  {
    id: '3',
    name: 'PlayStation Store Wallet',
    slug: 'playstation-wallet',
    category: 'games',
    type: 'gift-card',
    logo: '',
    description: 'Подарочная карта PlayStation Store. Выберите регион и номинал.',
    regions: ['RU', 'US', 'EU', 'TR'],
    denominations: [
      { id: '3-1', amount: 1000, currency: 'RUB', price: 1000 },
      { id: '3-2', amount: 2000, currency: 'RUB', price: 2000 },
      { id: '3-3', amount: 5000, currency: 'RUB', price: 5000 },
    ],
    deliverySpeed: 'fast',
    deliveryTimeText: 'До 10 минут',
    warnings: ['Регион карты должен совпадать с регионом вашего PSN аккаунта'],
    features: [
      'Доставка кода на email',
      'Все регионы PlayStation Network',
      'Покупка игр и подписок',
      'Никаких дополнительных комиссий'
    ]
  },
  {
    id: '4',
    name: 'Xbox Gift Card',
    slug: 'xbox-gift-card',
    category: 'games',
    type: 'voucher',
    logo: '',
    description: 'Подарочная карта Xbox для покупки игр и подписок.',
    regions: ['US', 'EU'],
    denominations: [
      { id: '4-1', amount: 25, currency: 'USD', price: 2500 },
      { id: '4-2', amount: 50, currency: 'USD', price: 5000 },
      { id: '4-3', amount: 100, currency: 'USD', price: 10000 },
    ],
    deliverySpeed: 'instant',
    deliveryTimeText: 'Моментально',
  },
  {
    id: '5',
    name: 'Fortnite V-Bucks',
    slug: 'fortnite-vbucks',
    category: 'games',
    type: 'top-up',
    logo: '',
    description: 'Пополнение V-Bucks для покупки скинов и пропусков в Fortnite.',
    denominations: [
      { id: '5-1', amount: 1000, currency: 'V-Bucks', price: 799 },
      { id: '5-2', amount: 2800, currency: 'V-Bucks', price: 1999 },
      { id: '5-3', amount: 5000, currency: 'V-Bucks', price: 3199 },
      { id: '5-4', amount: 13500, currency: 'V-Bucks', price: 7999 },
    ],
    deliverySpeed: 'fast',
    deliveryTimeText: 'До 10 минут',
    instructions: 'Укажите ваш Epic Games ID.',
    popular: true,
  },
  {
    id: '6',
    name: 'Genshin Impact Crystals',
    slug: 'genshin-crystals',
    category: 'games',
    type: 'top-up',
    logo: '',
    description: 'Пополнение Genesis Crystals для Genshin Impact.',
    servers: ['America', 'Europe', 'Asia', 'TW/HK/MO'],
    denominations: [
      { id: '6-1', amount: 60, currency: 'Crystals', price: 99 },
      { id: '6-2', amount: 300, currency: 'Crystals', price: 399 },
      { id: '6-3', amount: 980, currency: 'Crystals', price: 1199 },
      { id: '6-4', amount: 1980, currency: 'Crystals', price: 2299 },
      { id: '6-5', amount: 3280, currency: 'Crystals', price: 3799 },
      { id: '6-6', amount: 6480, currency: 'Crystals', price: 7299 },
    ],
    deliverySpeed: 'fast',
    deliveryTimeText: 'До 10 минут',
    instructions: 'Укажите ваш UID (можно найти в правом нижнем углу игры) и выберите сервер.',
  },
  {
    id: '7',
    name: 'Roblox Robux',
    slug: 'roblox-robux',
    category: 'games',
    type: 'top-up',
    logo: '',
    description: 'Пополнение Robux для покупки предметов и аксессуаров в Roblox.',
    denominations: [
      { id: '7-1', amount: 400, currency: 'Robux', price: 499 },
      { id: '7-2', amount: 800, currency: 'Robux', price: 999 },
      { id: '7-3', amount: 1700, currency: 'Robux', price: 1999 },
      { id: '7-4', amount: 4500, currency: 'Robux', price: 4999 },
    ],
    deliverySpeed: 'manual',
    deliveryTimeText: 'Ручная проверка',
    instructions: 'Укажите ваш Roblox username.',
    warnings: ['Обработка заказа может занять до 24 часов'],
  },
  {
    id: '8',
    name: 'Valorant Points',
    slug: 'valorant-points',
    category: 'games',
    type: 'top-up',
    logo: '',
    description: 'Пополнение VP для покупки оружия и агентов в Valorant.',
    regions: ['RU', 'EU', 'NA'],
    denominations: [
      { id: '8-1', amount: 475, currency: 'VP', price: 499 },
      { id: '8-2', amount: 1000, currency: 'VP', price: 999 },
      { id: '8-3', amount: 2050, currency: 'VP', price: 1999 },
      { id: '8-4', amount: 3650, currency: 'VP', price: 3499 },
    ],
    deliverySpeed: 'fast',
    deliveryTimeText: 'До 10 минут',
    popular: true,
  },
  {
    id: '9',
    name: 'Netflix',
    slug: 'netflix-subscription',
    category: 'subscriptions',
    type: 'voucher',
    logo: '',
    description: 'Подписка Netflix. Получите код активации на email.',
    denominations: [
      { id: '9-1', amount: 1, currency: 'месяц', price: 799 },
      { id: '9-2', amount: 3, currency: 'месяца', price: 2199 },
      { id: '9-3', amount: 6, currency: 'месяцев', price: 3999 },
      { id: '9-4', amount: 12, currency: 'месяцев', price: 7499 },
    ],
    deliverySpeed: 'fast',
    deliveryTimeText: 'До 10 минут',
  },
  {
    id: '10',
    name: 'Spotify Premium',
    slug: 'spotify-premium',
    category: 'subscriptions',
    type: 'voucher',
    logo: '',
    description: 'Подписка Spotify Premium. Слушайте музыку без рекламы.',
    denominations: [
      { id: '10-1', amount: 1, currency: 'месяц', price: 299 },
      { id: '10-2', amount: 3, currency: 'месяца', price: 799 },
      { id: '10-3', amount: 12, currency: 'месяцев', price: 2999 },
    ],
    deliverySpeed: 'instant',
    deliveryTimeText: 'Моментально',
    popular: true,
  },
  {
    id: '11',
    name: 'Google Play Gift Card',
    slug: 'google-play-card',
    category: 'wallet',
    type: 'gift-card',
    logo: '',
    description: 'Подарочная карта Google Play для покупки приложений, игр и контента.',
    regions: ['RU', 'US', 'EU'],
    denominations: [
      { id: '11-1', amount: 500, currency: 'RUB', price: 500 },
      { id: '11-2', amount: 1000, currency: 'RUB', price: 1000 },
      { id: '11-3', amount: 3000, currency: 'RUB', price: 3000 },
    ],
    deliverySpeed: 'instant',
    deliveryTimeText: 'Моментально',
  },
  {
    id: '12',
    name: 'Apple Gift Card',
    slug: 'apple-gift-card',
    category: 'wallet',
    type: 'gift-card',
    logo: '',
    description: 'Подарочная карта Apple для App Store, iTunes и других сервисов Apple.',
    regions: ['RU', 'US', 'EU'],
    denominations: [
      { id: '12-1', amount: 1000, currency: 'RUB', price: 1000 },
      { id: '12-2', amount: 3000, currency: 'RUB', price: 3000 },
      { id: '12-3', amount: 5000, currency: 'RUB', price: 5000 },
    ],
    deliverySpeed: 'fast',
    deliveryTimeText: 'До 10 минут',
  },
];

// Mock Orders
export const mockOrders: Order[] = [
  {
    id: 'WG-2026-000123',
    productId: '1',
    productName: 'Steam Пополнение',
    amount: 1000,
    price: 1000,
    commission: 100,
    total: 1100,
    email: 'user@example.com',
    accountId: 'steamuser123',
    region: 'RU',
    status: 'success',
    statusText: 'Выполнен',
    createdAt: '2026-01-19T10:30:00Z',
    updatedAt: '2026-01-19T10:32:45Z',
    paymentMethod: 'card' as PaymentMethod,
    timeline: [
      { timestamp: '2026-01-19T10:30:00Z', status: 'created', message: 'Заказ создан' },
      { timestamp: '2026-01-19T10:30:15Z', status: 'paid', message: 'Оплата получена' },
      { timestamp: '2026-01-19T10:30:45Z', status: 'fulfilling', message: 'Выполняется пополнение' },
      { timestamp: '2026-01-19T10:32:45Z', status: 'completed', message: 'Пополнение выполнено' },
    ],
  },
  {
    id: 'WG-2026-000124',
    productId: '2',
    productName: 'Telegram Stars',
    amount: 500,
    price: 899,
    commission: 90,
    total: 989,
    email: 'user@example.com',
    accountId: 'telegramuser',
    status: 'pending',
    statusText: 'В обработке',
    createdAt: '2026-01-19T11:15:00Z',
    updatedAt: '2026-01-19T11:15:30Z',
    paymentMethod: 'sbp' as PaymentMethod,
    timeline: [
      { timestamp: '2026-01-19T11:15:00Z', status: 'created', message: 'Заказ создан' },
      { timestamp: '2026-01-19T11:15:15Z', status: 'paid', message: 'Оплата получена' },
      { timestamp: '2026-01-19T11:15:30Z', status: 'fulfilling', message: 'Выполняется пополнение' },
    ],
  },
  {
    id: 'WG-2026-000125',
    productId: '5',
    productName: 'Fortnite V-Bucks',
    amount: 1000,
    price: 799,
    commission: 80,
    total: 879,
    email: 'user@example.com',
    accountId: 'epicuser123',
    status: 'failed',
    statusText: 'Ошибка выполнения',
    createdAt: '2026-01-19T09:00:00Z',
    updatedAt: '2026-01-19T09:05:00Z',
    paymentMethod: 'card' as PaymentMethod,
    failureReason: 'Не удалось найти аккаунт Epic Games с указанным ID. Проверьте правильность введенных данных.',
    timeline: [
      { timestamp: '2026-01-19T09:00:00Z', status: 'created', message: 'Заказ создан' },
      { timestamp: '2026-01-19T09:00:15Z', status: 'paid', message: 'Оплата получена' },
      { timestamp: '2026-01-19T09:00:45Z', status: 'fulfilling', message: 'Выполняется пополнение' },
      { timestamp: '2026-01-19T09:05:00Z', status: 'failed', message: 'Ошибка выполнения' },
    ],
  },
  {
    id: 'WG-2026-000126',
    productId: '7',
    productName: 'Roblox Robux',
    amount: 800,
    price: 999,
    commission: 100,
    total: 1099,
    email: 'user@example.com',
    accountId: 'robloxuser',
    status: 'manual_review',
    statusText: 'Ручная проверка',
    createdAt: '2026-01-19T08:30:00Z',
    updatedAt: '2026-01-19T08:30:30Z',
    paymentMethod: 'card' as PaymentMethod,
    timeline: [
      { timestamp: '2026-01-19T08:30:00Z', status: 'created', message: 'Заказ создан' },
      { timestamp: '2026-01-19T08:30:15Z', status: 'paid', message: 'Оплата получена' },
      { timestamp: '2026-01-19T08:30:30Z', status: 'manual_review', message: 'Заказ отправлен на ручную проверку' },
    ],
  },
];

export const getProductById = (id: string): Product | undefined => {
  return mockProducts.find(p => p.id === id);
};

export const getProductBySlug = (slug: string): Product | undefined => {
  return mockProducts.find(p => p.slug === slug);
};

export const getOrderById = (id: string): Order | undefined => {
  return mockOrders.find(o => o.id === id);
};

export const getProductsByCategory = (category: ProductCategory): Product[] => {
  return mockProducts.filter(p => p.category === category);
};

export const getPopularProducts = (): Product[] => {
  return mockProducts.filter(p => p.popular);
};

// Generate mock admin stats
export const getMockAdminStats = (): AdminStats => {
  const totalRevenue = mockOrders.reduce((sum, order) => sum + order.total, 0);
  const totalOrders = mockOrders.length;
  const successOrders = mockOrders.filter(o => o.status === 'success').length;
  const successRate = Math.round((successOrders / totalOrders) * 100);
  const averageOrderValue = Math.round(totalRevenue / totalOrders);

  // Calculate popular products
  const productCounts = mockOrders.reduce((acc, order) => {
    if (!acc[order.productId]) {
      acc[order.productId] = { count: 0, revenue: 0 };
    }
    acc[order.productId].count++;
    acc[order.productId].revenue += order.total;
    return acc;
  }, {} as Record<string, { count: number; revenue: number }>);

  const popularProducts = Object.entries(productCounts)
    .map(([productId, data]) => ({ productId, ...data }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Generate revenue by day (last 7 days)
  const revenueByDay = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    const dateStr = date.toISOString().split('T')[0];
    return {
      date: dateStr,
      revenue: Math.round(Math.random() * 50000 + 10000),
      orders: Math.round(Math.random() * 20 + 5),
    };
  });

  return {
    totalRevenue,
    todayRevenue: Math.round(Math.random() * 15000 + 5000),
    totalOrders,
    todayOrders: Math.round(Math.random() * 10 + 3),
    successRate,
    averageOrderValue,
    popularProducts,
    revenueByDay,
  };
};
