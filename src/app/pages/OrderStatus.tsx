import { useParams, Link } from 'react-router-dom';
import { useState, useMemo, useCallback } from 'react';
import { CheckCircle2, Clock, XCircle, AlertTriangle, Copy, Mail, RefreshCw, MessageCircle } from 'lucide-react';
import Header from '@/app/components/Header';
import Footer from '@/app/components/Footer';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Alert, AlertDescription } from '@/app/components/ui/alert';
import { toast } from 'sonner';
import { useOrder } from '@/app/hooks/useOrders';
import { logger } from '@/app/utils/logger';
import type { Ticket } from '@/app/types';

export default function OrderStatusPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const [supportText, setSupportText] = useState('');
  const [ticketCreated, setTicketCreated] = useState(false);

  const { order, loading: orderLoading, error: orderError, refetch } = useOrder(orderId);

  // All hooks must be called before any early returns
  const copyVoucherCode = useCallback(() => {
    if (order?.voucherCode) {
      navigator.clipboard.writeText(order.voucherCode).catch(() => {
        toast.error('Не удалось скопировать код');
      });
      toast.success('Код скопирован в буфер обмена');
    }
  }, [order]);

  const canCreateTicket = useMemo(
    () => order?.status === 'failed' || order?.status === 'manual_review' || order?.status === 'pending',
    [order]
  );

  const handleCreateTicket = useCallback(() => {
    if (!order || !supportText.trim()) return;

    // В реальном приложении здесь будет вызов API создания тикета.
    const ticket: Ticket = {
      id: `T-${order.id}`,
      orderId: order.id,
      userEmail: order.email,
      type:
        order.status === 'failed'
          ? 'fulfillment'
          : order.status === 'manual_review'
          ? 'payment'
          : 'other',
      subject: `Проблема с заказом ${order.id}`,
      description: supportText.trim(),
      status: 'open',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [
        {
          id: `MSG-${order.id}-1`,
          author: 'user',
          text: supportText.trim(),
          createdAt: new Date().toISOString(),
          internal: false,
        },
      ],
    };

    // В реальном приложении здесь будет вызов API создания тикета
    logger.info('Ticket created', { ticketId: ticket.id, orderId: ticket.orderId });

    setTicketCreated(true);
    setSupportText('');
    toast.success('Обращение в поддержку создано. Оператор свяжется с вами по email.');
  }, [order, supportText]);

  // Early returns after all hooks
  if (orderLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-muted-foreground">Загрузка заказа...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!order || orderError) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">Заказ не найден</h1>
            <p className="text-muted-foreground mb-4">{orderError?.message || 'Заказ не существует или был удален'}</p>
            <Link to="/">
              <Button>Вернуться на главную</Button>
            </Link>
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
        <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {/* Success Status */}
          {order.status === 'success' && (
            <div className="mb-8">
              <div className="flex items-center justify-center mb-6">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-success/20">
                  <CheckCircle2 className="h-12 w-12 text-success" />
                </div>
              </div>
              <h1 className="text-3xl font-bold text-center mb-2">Заказ выполнен!</h1>
              <p className="text-center text-muted-foreground mb-6">
                Ваше пополнение успешно выполнено
              </p>

              {order.voucherCode && (
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle>Ваш код активации</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between bg-muted p-4 rounded-lg mb-4">
                      <code className="text-xl font-mono">{order.voucherCode}</code>
                      <Button variant="ghost" size="sm" onClick={copyVoucherCode}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <Alert>
                      <AlertDescription>
                        Код также отправлен на email:{' '}
                        <span className="font-mono">{order.email}</span>
                      </AlertDescription>
                    </Alert>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Pending Status */}
          {order.status === 'pending' && (
            <div className="mb-8">
              <div className="flex items-center justify-center mb-6">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-warning/20">
                  <Clock className="h-12 w-12 text-warning animate-pulse" />
                </div>
              </div>
              <h1 className="text-3xl font-bold text-center mb-2">Заказ в обработке</h1>
              <p className="text-center text-muted-foreground mb-6">
                Выполняем заказ... Обычно занимает до 3 минут
              </p>

              <Alert className="mb-6">
                <Clock className="h-4 w-4" />
                <AlertDescription>
                  Страница автоматически обновится после завершения обработки. 
                  Вы также получите уведомление на email.
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* Failed Status */}
          {order.status === 'failed' && (
            <div className="mb-8">
              <div className="flex items-center justify-center mb-6">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-destructive/20">
                  <XCircle className="h-12 w-12 text-destructive" />
                </div>
              </div>
              <h1 className="text-3xl font-bold text-center mb-2">Ошибка выполнения</h1>
              <p className="text-center text-muted-foreground mb-6">
                Оплата прошла, но выполнение не удалось. Поддержка уже в курсе.
              </p>

              <Alert variant="destructive" className="mb-6">
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  {order.failureReason || 'Не удалось выполнить пополнение. Проверьте правильность введенных данных.'}
                </AlertDescription>
              </Alert>

              <Card className="mb-6">
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4">Что делать дальше?</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Наша служба поддержки уже уведомлена о проблеме</li>
                    <li>• Мы свяжемся с вами в течение 24 часов для решения вопроса</li>
                    <li>• Если проблема в неверных данных, мы поможем оформить новый заказ или вернем средства</li>
                  </ul>
                  <div className="mt-4">
                    <a href={`mailto:support@zvezda.ru?subject=Проблема с заказом ${order.id}`}>
                      <Button variant="outline" className="w-full mb-3">
                        <Mail className="mr-2 h-4 w-4" />
                        Написать на email
                      </Button>
                    </a>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() =>
                        document
                          .getElementById('support-textarea')
                          ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                      }
                    >
                      <MessageCircle className="mr-2 h-4 w-4" />
                      Оставить обращение через форму
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Manual Review Status */}
          {order.status === 'manual_review' && (
            <div className="mb-8">
              <div className="flex items-center justify-center mb-6">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-warning/20">
                  <AlertTriangle className="h-12 w-12 text-warning" />
                </div>
              </div>
              <h1 className="text-3xl font-bold text-center mb-2">Ручная проверка</h1>
              <p className="text-center text-muted-foreground mb-6">
                Ваш заказ отправлен на ручную проверку
              </p>

              <Alert className="mb-6">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Заказ требует дополнительной проверки нашей службой безопасности. 
                  Это стандартная процедура для некоторых типов заказов. 
                  Обработка может занять до 24 часов.
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* Support form for ticket creation */}
          {canCreateTicket && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Написать в поддержку по этому заказу</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Опишите, что именно пошло не так. На основе этого обращения будет создан тикет,
                  привязанный к заказу <span className="font-mono text-xs">{order.id}</span>.
                </p>
                <textarea
                  id="support-textarea"
                  className="w-full min-h-[120px] rounded-lg border border-border bg-input-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-ring resize-y"
                  placeholder="Например: Оплата прошла, но пополнение не зачислилось. Указал правильный ID аккаунта, проверьте, пожалуйста."
                  value={supportText}
                  onChange={(e) => setSupportText(e.target.value)}
                  maxLength={1000}
                />
                {ticketCreated && (
                  <Alert>
                    <AlertDescription>
                      Обращение по этому заказу уже создано. Повторное сообщение можно будет
                      добавить после синхронизации с оператором.
                    </AlertDescription>
                  </Alert>
                )}
                <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                  <p className="text-[11px] text-muted-foreground">
                    Текст обращения будет виден только операторам поддержки. Ответ придёт на ваш
                    email: <span className="font-mono">{order.email}</span>.
                  </p>
                  <Button
                    size="sm"
                    className="sm:w-auto w-full"
                    onClick={handleCreateTicket}
                    disabled={!supportText.trim() || ticketCreated}
                  >
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Отправить в поддержку
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
            {/* Order Info */}
            <Card>
              <CardHeader>
                <CardTitle>Информация о заказе</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Номер заказа</span>
                  <span className="font-mono">{order.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Товар</span>
                  <span className="font-medium">{order.productName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Статус</span>
                  <Badge variant={
                    order.status === 'success' ? 'default' :
                    order.status === 'pending' ? 'secondary' :
                    order.status === 'failed' ? 'destructive' :
                    'outline'
                  }>
                    {order.statusText}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Метод оплаты</span>
                  <span>{order.paymentMethod}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email</span>
                  <span className="text-sm">{order.email}</span>
                </div>
                {order.accountId && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">ID аккаунта</span>
                    <span className="font-mono text-sm">{order.accountId}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Timeline */}
            <Card>
              <CardHeader>
                <CardTitle>История заказа</CardTitle>
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
          </div>

          {/* Actions */}
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/">
              <Button variant="outline" size="lg">
                Вернуться на главную
              </Button>
            </Link>
            <Link to="/account">
              <Button variant="outline" size="lg">
                Мои заказы
              </Button>
            </Link>
            {order.status === 'pending' && (
              <Button size="lg" variant="ghost" onClick={() => refetch()}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Обновить статус
              </Button>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
