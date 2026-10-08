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
  GameCategory,
  ProductTypeEntity,
  Seller,
  Review,
  PlatformStats,
  SellerApplication,
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
    fulfillment: { type: 'account-top-up', channel: 'target-account', estimate: 'instant' },
    instructions: 'Укажите ваш Steam ID. Найти его можно в профиле Steam (в URL после /id/).',
    warnings: ['Убедитесь, что ваш профиль Steam публичный', 'Регион аккаунта должен совпадать с выбранным регионом'],
    popular: true,
    rating: 4.9,
    reviewsCount: 1240,
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
    fulfillment: { type: 'account-top-up', channel: 'target-account', estimate: 'up-to-3-minutes' },
    instructions: 'Укажите ваш Telegram username (без @).',
    popular: true,
    rating: 4.88,
    reviewsCount: 890,
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
    fulfillment: { type: 'activation-code', channel: 'protected-order-page', estimate: 'up-to-10-minutes' },
    warnings: ['Регион карты должен совпадать с регионом вашего PSN аккаунта'],
    features: [
      'Выдача кода на защищённой странице заказа',
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
    fulfillment: { type: 'activation-code', channel: 'protected-order-page', estimate: 'instant' },
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
    fulfillment: { type: 'account-top-up', channel: 'target-account', estimate: 'up-to-10-minutes' },
    instructions: 'Укажите ваш Epic Games ID.',
    popular: true,
    rating: 4.85,
    reviewsCount: 650,
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
    fulfillment: { type: 'account-top-up', channel: 'target-account', estimate: 'up-to-10-minutes' },
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
    fulfillment: { type: 'account-top-up', channel: 'target-account', estimate: 'manual-review' },
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
    fulfillment: { type: 'account-top-up', channel: 'target-account', estimate: 'up-to-10-minutes' },
    instructions: 'Укажите Riot ID (логин#тег). Найти: клиент Valorant → Настройки → Общие → Riot ID.',
    popular: true,
    rating: 4.82,
    reviewsCount: 420,
  },
  {
    id: '9',
    name: 'Netflix',
    slug: 'netflix-subscription',
    category: 'subscriptions',
    type: 'voucher',
    logo: '',
    description: 'Подписка Netflix. Код активации появится на защищённой странице заказа.',
    denominations: [
      { id: '9-1', amount: 1, currency: 'месяц', price: 799 },
      { id: '9-2', amount: 3, currency: 'месяца', price: 2199 },
      { id: '9-3', amount: 6, currency: 'месяцев', price: 3999 },
      { id: '9-4', amount: 12, currency: 'месяцев', price: 7499 },
    ],
    fulfillment: { type: 'activation-code', channel: 'protected-order-page', estimate: 'up-to-10-minutes' },
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
    fulfillment: { type: 'activation-code', channel: 'protected-order-page', estimate: 'instant' },
    popular: true,
    rating: 4.9,
    reviewsCount: 2100,
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
    fulfillment: { type: 'activation-code', channel: 'protected-order-page', estimate: 'instant' },
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
    fulfillment: { type: 'activation-code', channel: 'protected-order-page', estimate: 'up-to-10-minutes' },
  },
];

// Mock Orders
export const mockOrders: Order[] = [
  {
    id: 'ORD-2026-000123',
    productId: '1',
    productName: 'Steam Пополнение',
    amount: 1000,
    price: 1000,
    commission: 100,
    total: 1100,
    email: 'user@example.com',
    accountId: 'steamuser123',
    region: 'RU',
    sellerId: 'seller-1',
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
    id: 'ORD-2026-000124',
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
    id: 'ORD-2026-000125',
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
    id: 'ORD-2026-000126',
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
  {
    id: 'ORD-2026-000127',
    productId: '1',
    productName: 'Steam Пополнение',
    amount: 1000,
    price: 1000,
    commission: 100,
    total: 1100,
    email: 'buyer@example.com',
    accountId: 'steamid456',
    region: 'RU',
    sellerId: 'seller-1',
    status: 'pending',
    statusText: 'В обработке',
    createdAt: '2026-01-20T12:00:00Z',
    updatedAt: '2026-01-20T12:01:00Z',
    paymentMethod: 'sbp' as PaymentMethod,
    escrowStatus: 'IN_ESCROW',
    timeline: [
      { timestamp: '2026-01-20T12:00:00Z', status: 'created', message: 'Заказ создан' },
      { timestamp: '2026-01-20T12:00:30Z', status: 'paid', message: 'Оплата получена' },
      { timestamp: '2026-01-20T12:01:00Z', status: 'in_escrow', message: 'Средства удержаны (эскроу)' },
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

// ---------------------------------------------------------------------------
// Seller / Trust layer (GameCategory, ProductType, Sellers, Reviews, Stats)
// ---------------------------------------------------------------------------

export const mockGameCategories: GameCategory[] = [
  { id: 'gc-1', slug: 'steam', title: 'Steam', icon: 'steam' },
  { id: 'gc-2', slug: 'epic', title: 'Epic Games', icon: 'fortnite' },
  { id: 'gc-3', slug: 'riot', title: 'Riot Games', icon: 'valorant' },
  { id: 'gc-4', slug: 'ps', title: 'PlayStation', icon: 'playstation' },
  { id: 'gc-5', slug: 'xbox', title: 'Xbox', icon: 'xbox' },
  { id: 'gc-6', slug: 'mobile', title: 'Мобильные', icon: 'google' },
  { id: 'gc-7', slug: 'subs', title: 'Подписки', icon: 'netflix' },
];

export const mockProductTypeEntities: ProductTypeEntity[] = [
  { id: 'pt-1', slug: 'top-up', title: 'Пополнение', icon: 'top-up' },
  { id: 'pt-2', slug: 'voucher', title: 'Ваучеры и ключи', icon: 'voucher' },
  { id: 'pt-3', slug: 'gift-card', title: 'Подарочные карты', icon: 'gift-card' },
];

export const mockSellers: Seller[] = [
  { id: 's1', nickname: 'GameStock', avatar: '', rating: 4.92, reviewsCount: 1240, salesCount: 5820 },
  { id: 's2', nickname: 'TopUpPro', avatar: '', rating: 4.88, reviewsCount: 890, salesCount: 4100 },
  { id: 's3', nickname: 'KeysWorld', avatar: '', rating: 4.85, reviewsCount: 650, salesCount: 2900 },
  { id: 's4', nickname: 'WalletPlus', avatar: '', rating: 4.79, reviewsCount: 420, salesCount: 1800 },
  { id: 's5', nickname: 'QuickSell', avatar: '', rating: 4.75, reviewsCount: 310, salesCount: 1200 },
];

/** Product reviews. Each review is tied to a product (and optionally an order). */
export const mockReviews: Review[] = [
  { id: 'r1', productId: '1', rating: 5, text: 'Быстро и честно. Рекомендую.', createdAt: '2026-01-20T10:00:00Z' },
  { id: 'r2', productId: '1', rating: 5, text: 'Всё пришло за пару минут. Steam пополнился мгновенно.', createdAt: '2026-01-19T14:30:00Z' },
  { id: 'r3', productId: '1', rating: 4, text: 'Норм, один раз задержали на час, но всё ок.', createdAt: '2026-01-18T09:15:00Z' },
  { id: 'r4', productId: '2', rating: 5, text: 'Telegram Stars пришли сразу. Удобно.', createdAt: '2026-01-20T11:00:00Z' },
  { id: 'r5', productId: '2', rating: 5, text: 'Отлично, без проблем.', createdAt: '2026-01-19T16:00:00Z' },
  { id: 'r6', productId: '5', rating: 5, text: 'V-Bucks зачислились за 5 минут. Супер!', createdAt: '2026-01-19T12:00:00Z' },
  { id: 'r7', productId: '5', rating: 4, text: 'Всё ок, только долго ждал ответа поддержки.', createdAt: '2026-01-18T18:00:00Z' },
  { id: 'r8', productId: '8', rating: 5, text: 'Valorant VP пришли быстро. Рекомендую.', createdAt: '2026-01-20T09:00:00Z' },
  { id: 'r9', productId: '10', rating: 5, text: 'Spotify — код пришёл на почту сразу.', createdAt: '2026-01-19T20:00:00Z' },
];

export function getReviewsByProductId(productId: string): Review[] {
  return mockReviews.filter((r) => r.productId === productId).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

let _reviewIdCounter = 10;
export function addProductReview(params: {
  productId: string;
  orderId?: string;
  rating: number;
  text: string;
}): Review {
  const id = `r${++_reviewIdCounter}`;
  const review: Review = {
    id,
    productId: params.productId,
    orderId: params.orderId,
    rating: params.rating,
    text: params.text.trim(),
    createdAt: new Date().toISOString(),
  };
  mockReviews.push(review);
  return review;
}

/** Check if a review was already left for this order (mock: by orderId). */
export function hasReviewForOrder(orderId: string): boolean {
  return mockReviews.some((r) => r.orderId === orderId);
}

export const mockPlatformStats: PlatformStats = {
  totalOrders: 48_200,
  successRate: 98,
  averageDeliveryMinutes: 4,
  activeSellers: 320,
  totalReviews: 12_400,
  averageRating: 4.9,
};

export const getTopSellers = (limit = 5): Seller[] => mockSellers.slice(0, limit);
export const getPlatformStats = (): PlatformStats => mockPlatformStats;
export const getGameCategories = (): GameCategory[] => mockGameCategories;
export const getProductTypeEntities = (): ProductTypeEntity[] => mockProductTypeEntities;

/** Заявки на продавца (mock). */
export const mockSellerApplications: SellerApplication[] = [];

let _sellerAppId = 1;
export function createSellerApplication(data: {
  email: string;
  name: string;
  description?: string;
  acceptedRules: boolean;
}): SellerApplication {
  const app: SellerApplication = {
    id: `sa-${String(_sellerAppId++).padStart(4, '0')}`,
    email: data.email.toLowerCase().trim(),
    name: data.name.trim(),
    description: data.description?.trim(),
    acceptedRules: data.acceptedRules,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
  mockSellerApplications.push(app);
  return app;
}

/** Товары продавца (mock). В MVP — отдельный массив; productId нужен для связи с заказами. */
export const mockSellerProducts: Product[] = [];

/** Заказы по товарам продавца: productId входит в список id товаров продавца. */
export function getOrdersBySeller(sellerId: string): Order[] {
  const productIds = new Set(mockSellerProducts.filter((p) => p.sellerId === sellerId).map((p) => p.id));
  return mockOrders.filter((o) => productIds.has(o.productId));
}

/** Баланс продавца (mock). */
export function getSellerBalance(_sellerId: string): { inEscrow: number; available: number } {
  return { inEscrow: 0, available: 0 };
}

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
