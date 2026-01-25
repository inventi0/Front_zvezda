import { Link, useNavigate } from 'react-router-dom';
import Header from '@/app/components/Header';
import Footer from '@/app/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { Package, MessageCircle, User, LogOut } from 'lucide-react';
import type { Order, Ticket } from '@/app/types';
import { useState, useEffect, useCallback } from 'react';
import { ordersService } from '@/app/services';
import { logger } from '@/app/utils/logger';
import { useAuth } from '@/app/hooks/useAuth';
import { useSupportChat } from '@/app/contexts/SupportChatContext';

const ROLE_LABEL: Record<string, string> = {
  admin: 'Админ',
  support: 'Поддержка',
  user: 'Покупатель',
};

export default function AccountPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const { openChat } = useSupportChat();
  const [userOrders, setUserOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // В реальной системе тикеты будут приходить из API и фильтроваться по пользователю.
  const [tickets] = useState<Ticket[]>([]);

  const fetchUserOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      // Используем getUserOrders из сервиса (работает с mock и real API)
      const orders = await ordersService.getUserOrders();
      setUserOrders(orders);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Не удалось загрузить заказы';
      setError(message);
      logger.error('Failed to fetch user orders', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) fetchUserOrders();
    else setLoading(false);
  }, [isAuthenticated, fetchUserOrders]);

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1">
          <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8 sm:py-10 md:py-12">
            <Card>
              <CardContent className="p-12 text-center">
                <User className="h-14 w-14 mx-auto mb-4 text-muted-foreground" />
                <h2 className="text-xl font-semibold mb-2">Вы не вошли в аккаунт</h2>
                <p className="text-muted-foreground mb-6">
                  Войдите, чтобы видеть заказы и управлять профилем.
                </p>
                <Link to="/auth">
                  <Button className="gap-2">
                    Войти
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-1">
        <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8 sm:py-10 md:py-12 space-y-6 sm:space-y-8 md:space-y-10">
          {/* Профиль: кто вошёл + Выйти */}
          {user && (
            <Card>
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                      <User className="h-5 w-5 text-muted-foreground" />
                    </span>
                    <div>
                      <p className="font-semibold">{user.name || user.email}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                      <Badge variant="secondary" className="mt-1">
                        {ROLE_LABEL[user.role] ?? user.role}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <Button
                      variant="outline"
                      className="gap-2 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                      onClick={async () => {
                        await logout();
                        navigate('/');
                      }}
                    >
                      <LogOut className="h-4 w-4" />
                      Выйти
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">Мои заказы</h1>
            <p className="text-xs sm:text-sm text-muted-foreground mb-4 sm:mb-6">
              Здесь вы видите все оформленные заказы и можете обратиться в поддержку по каждому из них.
            </p>
          </div>

          {loading ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground">Загрузка заказов...</p>
            </div>
          ) : error ? (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-destructive mb-4">{error}</p>
                <Button onClick={fetchUserOrders}>Обновить</Button>
              </CardContent>
            </Card>
          ) : userOrders.length > 0 ? (
            <div className="space-y-3 sm:space-y-4">
              {userOrders.map((order) => (
                <Card key={order.id}>
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <h3 className="font-semibold text-base sm:text-lg break-words">{order.productName}</h3>
                          <Badge variant={
                            order.status === 'success' ? 'default' :
                            order.status === 'pending' ? 'secondary' :
                            order.status === 'failed' ? 'destructive' :
                            'outline'
                          }>
                            {order.statusText}
                          </Badge>
                        </div>
                        <div className="text-xs sm:text-sm text-muted-foreground space-y-1">
                          <p className="break-all">
                            Номер заказа:{' '}
                            <span className="font-mono">{order.id}</span>
                          </p>
                          <p>Сумма: {order.total} ₽</p>
                          <p>Дата: {new Date(order.createdAt).toLocaleString('ru-RU')}</p>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                        <Link to={`/order/${order.id}`} className="w-full sm:w-auto">
                          <Button variant="outline" className="w-full sm:w-auto">
                            Подробнее
                          </Button>
                        </Link>
                        <Link
                          to={`/order/${order.id}?support=true`}
                          className="w-full sm:w-auto"
                        >
                          <Button variant="ghost" className="w-full sm:w-auto">
                            <MessageCircle className="h-4 w-4 mr-2" />
                            <span className="hidden sm:inline">Есть проблема с заказом</span>
                            <span className="sm:hidden">Проблема</span>
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">У вас пока нет заказов</h3>
                <p className="text-muted-foreground mb-6">
                  Начните с выбора товара в каталоге
                </p>
                <Link to="/#catalog">
                  <Button>Перейти в каталог</Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* История обращений */}
          <div>
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h2 className="text-xl sm:text-2xl font-semibold">Обращения в поддержку</h2>
            </div>
            {tickets.length === 0 ? (
              <Card>
                <CardContent className="p-6 space-y-4">
                  <p className="text-sm text-muted-foreground">
                    У вас пока нет обращений в поддержку. Если возникнет проблема с заказом,
                    создайте тикет из карточки заказа или со страницы статуса — или напишите в чат.
                  </p>
                  <Button variant="outline" onClick={openChat}>
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Написать в чат
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Мои тикеты</CardTitle>
                </CardHeader>
                <CardContent />
              </Card>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
