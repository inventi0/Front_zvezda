import { useParams, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import AdminLayout from '@/app/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Textarea } from '@/app/components/ui/textarea';
import { ArrowLeft, RefreshCw, CheckCircle, Ban } from 'lucide-react';
import { adminOrdersService } from '@/app/services';
import { logger } from '@/app/utils/logger';
import { toast } from 'sonner';
import type { Order } from '@/app/types';

export default function AdminOrderDetail() {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) return;

    const fetchOrder = async () => {
      try {
        setLoading(true);
        const fetchedOrder = await adminOrdersService.getOrder(orderId);
        setOrder(fetchedOrder);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Не удалось загрузить заказ');
        logger.error('Failed to fetch admin order', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  if (loading) {
    return (
      <AdminLayout title="Заказ" description="Загрузка данных заказа…">
        <div className="py-20 text-center">
          <p className="text-muted-foreground">Загрузка заказа...</p>
        </div>
      </AdminLayout>
    );
  }

  if (!order || error) {
    return (
      <AdminLayout title="Заказ не найден" description="Запрошенная карточка заказа недоступна.">
        <div className="py-20 text-center">
          <p className="text-muted-foreground mb-4">{error || 'Заказ не существует'}</p>
          <Button asChild><Link to="/admin/orders">Вернуться к заказам</Link></Button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title={`Заказ ${order.id}`}
      description={order.productName}
      actions={<Button asChild variant="outline" size="sm"><Link to="/admin/orders"><ArrowLeft className="mr-2 h-4 w-4" />К заказам</Link></Button>}
    >
        <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_320px]">
          {/* Main Info */}
          <div className="min-w-0 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Детали заказа</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Номер заказа</div>
                    <div className="font-mono">{order.id}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Статус</div>
                    <Badge variant={
                      order.status === 'success' ? 'default' :
                      order.status === 'pending' ? 'secondary' :
                      order.status === 'failed' ? 'destructive' :
                      'outline'
                    }>
                      {order.statusText}
                    </Badge>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Товар</div>
                    <div>{order.productName}</div>
                  </div>
                  {order.optionValue && (
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">{order.optionLabel || 'Вариант'}</div>
                      <div>{order.optionValue}</div>
                    </div>
                  )}
                  {order.denominationLabel && (
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Номинал / SKU</div>
                      <div>{order.denominationLabel}</div>
                    </div>
                  )}
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Сумма</div>
                    <div className="font-mono">{order.total} ₽</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Email</div>
                    <div className="text-sm">{order.email}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Метод оплаты</div>
                    <div>{order.paymentMethod}</div>
                  </div>
                  {order.accountId && (
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">ID аккаунта</div>
                      <div className="font-mono text-sm">{order.accountId}</div>
                    </div>
                  )}
                  {order.region && (
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Регион</div>
                      <div>{order.region}</div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Таймлайн событий</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {order.timeline.map((event, index) => (
                    <div key={index} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className={`flex h-8 w-8 items-center justify-center rounded-full text-white
                          ${event.status === 'completed' ? 'bg-success' :
                            event.status === 'failed' ? 'bg-destructive' :
                            event.status === 'manual_review' ? 'bg-warning' :
                            'bg-primary'}`}
                        >
                          {index + 1}
                        </div>
                        {index < order.timeline.length - 1 && (
                          <div className="h-full w-0.5 bg-border mt-1" />
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <div className="font-medium">{event.message}</div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(event.timestamp).toLocaleString('ru-RU')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Заметка оператора</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea 
                  placeholder="Добавьте заметку о заказе..."
                  className="min-h-[100px]"
                />
                <Button className="mt-4">Сохранить заметку</Button>
              </CardContent>
            </Card>
          </div>

          {/* Actions */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Действия</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  className="w-full px-3 text-sm"
                  onClick={() => toast.success('Заказ отправлен на повторное выполнение')}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Повторить исполнение
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full px-3 text-sm"
                  onClick={() => toast.success('Заказ отмечен как выполненный')}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Отметить выполненным
                </Button>
                <Button 
                  variant="destructive" 
                  className="w-full"
                  onClick={() => toast.error('Заказ отменен')}
                >
                  <Ban className="mr-2 h-4 w-4" />
                  Отменить заказ
                </Button>
              </CardContent>
            </Card>

            {order.status === 'failed' && order.failureReason && (
              <Card className="border-destructive">
                <CardHeader>
                  <CardTitle className="text-destructive">Причина ошибки</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{order.failureReason}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
    </AdminLayout>
  );
}
