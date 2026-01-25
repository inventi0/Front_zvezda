import { Link } from 'react-router-dom';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Package, ShoppingCart, Clock, AlertCircle, CheckCircle, DollarSign, MessageCircle, TrendingUp } from 'lucide-react';
import { adminOrdersService } from '@/app/services';
import { useProducts } from '@/app/hooks/useProducts';
import { logger } from '@/app/utils/logger';
import { DemoModeIndicator } from '@/app/components/DemoModeIndicator';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import type { AdminStats, Order } from '@/app/types';

export default function AdminDashboard() {
  const { products } = useProducts();
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [ordersResult, statsResult] = await Promise.all([
        adminOrdersService.getOrders(),
        adminOrdersService.getStats(),
      ]);
      setOrders(ordersResult.orders);
      setStats(statsResult);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось загрузить данные');
      logger.error('Failed to fetch admin dashboard data', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const orderStats = useMemo(() => {
    const total = orders.length;
    const success = orders.filter(o => o.status === 'success').length;
    const pending = orders.filter(o => o.status === 'pending').length;
    const failed = orders.filter(o => o.status === 'failed').length;
    const manualReview = orders.filter(o => o.status === 'manual_review').length;
    return { total, success, pending, failed, manualReview };
  }, [orders]);

  const totalOrders = orderStats.total;
  const successOrders = orderStats.success;
  const pendingOrders = orderStats.pending;
  const failedOrders = orderStats.failed;

  const statusData = useMemo(() => [
    { name: 'Успешные', value: successOrders, color: '#16a75a' },
    { name: 'В обработке', value: pendingOrders, color: '#f59e0b' },
    { name: 'Ошибки', value: failedOrders, color: '#ef4444' },
    { name: 'Проверка', value: orderStats.manualReview, color: '#6366f1' },
  ], [successOrders, pendingOrders, failedOrders, orderStats.manualReview]);

  const topProducts = useMemo(() => {
    if (!stats) return [];
    return stats.popularProducts.slice(0, 5).map(item => {
      const product = products.find(p => p.id === item.productId);
      return {
        name: product?.name || 'Unknown',
        orders: item.count,
        revenue: item.revenue,
      };
    });
  }, [stats, products]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold">Админ-панель Звезда</h1>
                <DemoModeIndicator />
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Управление платформой цифровых пополнений
              </p>
            </div>
            <Link to="/">
              <Button variant="outline">Вернуться на сайт</Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground">Загрузка данных...</p>
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
            <h2 className="text-xl font-semibold mb-2">Ошибка загрузки данных</h2>
            <p className="text-destructive mb-4">{error}</p>
            <p className="text-sm text-muted-foreground mb-4">
              Убедитесь, что mock режим включен или backend API доступен
            </p>
            <Button onClick={fetchData}>Обновить</Button>
          </div>
        ) : !stats ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground">Нет данных для отображения</p>
          </div>
        ) : (
          <>
            {/* Quick Stats */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Всего заказов
              </CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalOrders}</div>
              <p className="text-xs text-muted-foreground mt-1">
                +{stats.todayOrders} сегодня
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Общая выручка
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{(stats.totalRevenue / 1000).toFixed(1)}K ₽</div>
              <p className="text-xs text-muted-foreground mt-1">
                +{(stats.todayRevenue / 1000).toFixed(1)}K сегодня
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Успешных
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-success">{successOrders}</div>
              <p className="text-xs text-muted-foreground mt-1">{stats.successRate}% от всех</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Средний чек
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.averageOrderValue} ₽</div>
              <p className="text-xs text-muted-foreground mt-1">За заказ</p>
            </CardContent>
          </Card>
        </div>

        {/* Status Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                В обработке
              </CardTitle>
              <Clock className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-warning">{pendingOrders}</div>
              <p className="text-xs text-muted-foreground mt-1">Требуют внимания</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Ошибки
              </CardTitle>
              <AlertCircle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-destructive">{failedOrders}</div>
              <p className="text-xs text-muted-foreground mt-1">Требуют проверки</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Товаров
              </CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{products.length}</div>
              <p className="text-xs text-muted-foreground mt-1">В каталоге</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Revenue Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Выручка за последние 7 дней</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={stats.revenueByDay}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(value) => new Date(value).toLocaleDateString('ru-RU', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number | string) => [`${value} ₽`, 'Выручка']}
                    labelFormatter={(value: string) => new Date(value).toLocaleDateString('ru-RU')}
                  />
                  <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Status Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Распределение заказов по статусам</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Top Products and Recent Orders */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Top Products */}
          <Card>
            <CardHeader>
              <CardTitle>Популярные товары</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topProducts}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="orders" fill="#16a75a" name="Заказов" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Recent Orders */}
          <Card>
            <CardHeader>
              <CardTitle>Последние заказы</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {orders.slice(0, 5).map((order) => (
                  <Link 
                    key={order.id} 
                    to={`/admin/orders/${order.id}`}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div>
                      <div className="font-medium">{order.productName}</div>
                      <div className="text-sm text-muted-foreground">{order.id}</div>
                    </div>
                    <div className="text-right flex items-center gap-3">
                      <div>
                        <div className="font-mono text-sm">{order.total} ₽</div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(order.createdAt).toLocaleDateString('ru-RU')}
                        </div>
                      </div>
                      <Badge variant={
                        order.status === 'success' ? 'default' :
                        order.status === 'pending' ? 'secondary' :
                        order.status === 'failed' ? 'destructive' :
                        'outline'
                      }>
                        {order.statusText}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
              <Link to="/admin/orders">
                <Button variant="outline" className="w-full mt-4">
                  Все заказы
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Быстрые действия</CardTitle>
          </CardHeader>
          <CardContent className="grid sm:grid-cols-3 gap-3">
            <Link to="/admin/orders">
              <Button variant="outline" className="w-full justify-start">
                <ShoppingCart className="mr-2 h-4 w-4" />
                Управление заказами
              </Button>
            </Link>
            <Link to="/admin/products">
              <Button variant="outline" className="w-full justify-start">
                <Package className="mr-2 h-4 w-4" />
                Управление товарами
              </Button>
            </Link>
            <Link to="/admin/pricing">
              <Button variant="outline" className="w-full justify-start">
                <TrendingUp className="mr-2 h-4 w-4" />
                Настройка цен
              </Button>
            </Link>
            <Link to="/admin/support">
              <Button variant="outline" className="w-full justify-start">
                <MessageCircle className="mr-2 h-4 w-4" />
                Поддержка / тикеты
              </Button>
            </Link>
          </CardContent>
        </Card>
          </>
        )}
      </div>
    </div>
  );
}
