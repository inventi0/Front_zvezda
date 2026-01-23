# Справка

## 🎯 Что нужно знать

Все сервисы автоматически переключаются между mock и real API. В development используется демо-режим с mock данными.

---

## 📡 API Endpoints

### Аутентификация

```
POST   /api/auth/login
Body: { email: string, password: string }
Response: { user: User, tokens: { accessToken: string, refreshToken: string } }

POST   /api/auth/register
Body: { name: string, email: string, password: string, confirmPassword: string }
Response: { user: User, tokens: { accessToken: string, refreshToken: string } }

POST   /api/auth/refresh
Body: { refreshToken: string }
Response: { tokens: { accessToken: string, refreshToken: string } }

POST   /api/auth/logout
Headers: { Authorization: "Bearer <accessToken>" }
```

### Товары

```
GET    /api/products?category=games&search=steam&popular=true
Response: { products: Product[], total?: number }

GET    /api/products/:slug
Response: { product: Product }

GET    /api/products/by-id/:id
Response: { product: Product }
```

### Заказы

```
POST   /api/orders
Body: {
  productId: string,
  denominationId: string,
  email: string,
  accountId?: string,
  region?: string,
  server?: string,
  paymentMethod: 'card' | 'sbp'
}
Response: {
  order: Order,
  paymentUrl?: string,
  paymentId?: string
}

GET    /api/orders/:id
Response: { order: Order }

GET    /api/user/orders
Headers: { Authorization: "Bearer <accessToken>" }
Response: { orders: Order[] }
```

### Платежи

```
POST   /api/payment
Body: { orderId: string, paymentMethod: 'card' | 'sbp', returnUrl: string }
Response: {
  paymentId: string,
  paymentUrl: string,
  expiresAt: string
}

GET    /api/payment/:id/status
Response: { status: 'pending' | 'success' | 'failed', orderId: string }
```

### Админ (требует admin прав)

```
GET    /api/admin/orders?status=pending&productId=1&email=user@example.com&dateFrom=2026-01-01&dateTo=2026-01-31&page=1&limit=20
Response: { orders: Order[], total: number, page: number, limit: number }

GET    /api/admin/orders/:id
Response: { order: Order }

PUT    /api/admin/orders/:id
Body: {
  status: 'pending' | 'success' | 'failed' | 'manual_review',
  failureReason?: string,
  voucherCode?: string,
  note?: string
}
Response: { order: Order }

POST   /api/admin/orders/:id/retry
Response: { order: Order }

GET    /api/admin/stats?dateFrom=2026-01-01&dateTo=2026-01-31
Response: {
  totalOrders: number,
  successOrders: number,
  failedOrders: number,
  totalRevenue: number,
  revenueByDate: Array<{ date: string, revenue: number }>,
  popularProducts: Array<{ productId: string, count: number }>
}
```

---

## 📋 Типы данных

### Product

```typescript
{
  id: string;
  name: string;
  slug: string;
  category: 'games' | 'wallet' | 'services' | 'subscriptions';
  type: 'top-up' | 'voucher' | 'gift-card';
  logo: string;
  description: string;
  regions?: string[];
  servers?: string[];
  denominations: Array<{
    id: string;
    amount: number;
    currency: string;
    price: number;
    discount?: number;
    bonus?: string;
  }>;
  deliverySpeed: 'instant' | 'fast' | 'manual';
  deliveryTimeText: string;
  instructions?: string;
  warnings?: string[];
  popular?: boolean;
  features?: string[];
  faq?: Array<{ question: string; answer: string }>;
}
```

### Order

```typescript
{
  id: string; // Формат: ORD-2026-000123
  productId: string;
  productName: string;
  amount: number;
  price: number;
  commission: number;
  total: number;
  email: string;
  accountId?: string;
  region?: string;
  server?: string;
  status: 'pending' | 'success' | 'failed' | 'manual_review';
  statusText: string; // "В обработке", "Выполнено", и т.д.
  paymentMethod: 'card' | 'sbp';
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
  failureReason?: string;
  voucherCode?: string;
  note?: string;
}
```

### User

```typescript
{
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  createdAt: string;
}
```

---

## 🔐 Аутентификация

### Токены

- **Access Token** — короткоживущий (15-30 минут), в заголовке `Authorization: Bearer <token>`
- **Refresh Token** — долгоживущий (7-30 дней), для обновления access token

### Headers

```
Authorization: Bearer <accessToken>
Content-Type: application/json
```

### Ошибки

```
401 Unauthorized — токен отсутствует или невалиден
403 Forbidden — недостаточно прав (для admin endpoints)
```

---

## ⚠️ Важные требования

### 1. Формат ответов

Все ответы должны соответствовать Zod схемам (см. `src/app/types/schemas.ts`). Frontend валидирует ответы в runtime.

**Обязательно:**
- Все поля из типов должны присутствовать
- Типы должны совпадать (string, number, boolean)
- Enum значения должны быть точными
- Даты в формате ISO 8601

### 2. Обработка ошибок

Формат ошибки:
```json
{
  "message": "Описание ошибки",
  "code": "ERROR_CODE",
  "details": { /* дополнительные данные */ }
}
```

Коды ошибок:
- `NETWORK_ERROR` — проблемы с сетью
- `TIMEOUT` — превышено время ожидания
- `UNAUTHORIZED` — требуется авторизация
- `FORBIDDEN` — недостаточно прав
- `NOT_FOUND` — ресурс не найден
- `VALIDATION_ERROR` — ошибка валидации
- `PAYMENT_FAILED` — ошибка платежа

### 3. Retry логика

Frontend автоматически повторяет запросы при:
- 5xx ошибках
- 429 (rate limit)
- 408 (timeout)
- Сетевых ошибках

Используется exponential backoff (3 попытки).

### 4. Таймауты

- По умолчанию: 30 секунд
- Можно переопределить через `VITE_API_TIMEOUT`

---

## 🔄 Интеграция

### Переменные окружения (Frontend)

```bash
VITE_API_URL=https://api.zvezda.ru
VITE_USE_MOCK_DATA=false  # Отключить демо-режим
```

### Переключение на реальный API

1. Установить `VITE_API_URL` в `.env`
2. Установить `VITE_USE_MOCK_DATA=false`
3. Frontend автоматически переключится на real API

---

## 📊 Рекомендации

### 1. CORS

Настроить CORS для:
- `http://localhost:5173` (development)
- Production домен

```
Access-Control-Allow-Origin: <frontend-url>
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Authorization, Content-Type
Access-Control-Allow-Credentials: true
```

### 2. Rate Limiting

Рекомендуемые лимиты:
- Публичные endpoints: 100 req/min
- Аутентификация: 10 req/min
- Админ endpoints: 200 req/min

### 3. Валидация на Backend

Frontend валидирует данные, но **backend должен валидировать все**:
- Email формат
- Account ID (для top-up товаров)
- Суммы и цены
- Статусы заказов

### 4. Webhooks (опционально)

Для обновления статусов заказов в реальном времени:
```
POST /api/webhooks/order-status
Body: { orderId: string, status: OrderStatus, ... }
```

Frontend может подписаться через WebSocket или Server-Sent Events.

### 5. Логирование

Логировать:
- Все запросы к API
- Ошибки валидации
- Изменения статусов заказов
- Платежные операции

### 6. Безопасность

- HTTPS обязательно
- Валидация всех входных данных
- Защита от SQL injection
- Защита от XSS (backend тоже должен санитизировать)
- Rate limiting
- CSRF токены (если используете cookies)

### 7. Производительность

- Кеширование товаров (TTL 5-10 минут)
- Пагинация для списков (limit: 20-50)
- Индексы в БД для частых запросов
- Оптимизация запросов к БД

---

## 🧪 Тестирование интеграции

### Проверка endpoints

1. **Аутентификация:**
   ```bash
   curl -X POST https://api.zvezda.ru/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"password123"}'
   ```

2. **Получение товаров:**
   ```bash
   curl https://api.zvezda.ru/api/products?category=games
   ```

3. **Создание заказа:**
   ```bash
   curl -X POST https://api.zvezda.ru/api/orders \
     -H "Authorization: Bearer <token>" \
     -H "Content-Type: application/json" \
     -d '{"productId":"1","denominationId":"1-1","email":"user@example.com","paymentMethod":"card"}'
   ```

### Mock данные для тестирования

См. `src/app/data/mockData.ts` — там примеры всех типов данных.
