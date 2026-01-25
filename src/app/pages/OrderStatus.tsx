import { useParams, Link } from 'react-router-dom';
import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { CheckCircle2, Clock, XCircle, AlertTriangle, Copy, Mail, RefreshCw, MessageCircle, Shield, Star, Send } from 'lucide-react';
import type { EscrowStatus } from '@/app/types';
import Header from '@/app/components/Header';
import Footer from '@/app/components/Footer';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Alert, AlertDescription } from '@/app/components/ui/alert';
import { Label } from '@/app/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/app/components/ui/dialog';
import { Textarea } from '@/app/components/ui/textarea';
import { toast } from 'sonner';
import { useOrder } from '@/app/hooks/useOrders';
import { logger } from '@/app/utils/logger';
import { addProductReview, hasReviewForOrder, getProductById } from '@/app/data/mockData';
import {
  getOrderSupportMessages,
  appendOrderSupportMessages,
  type OrderSupportMessage,
} from '@/app/utils/orderSupportStorage';
import { cn } from '@/app/components/ui/utils';

const MOCK_OPERATOR_REPLY = (orderId: string, email: string) =>
  `Спасибо за обращение. Мы получили ваше сообщение по заказу ${orderId} и разберёмся в ближайшее время. При необходимости ответим также на ${email}.`;

export default function OrderStatusPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const [supportMessages, setSupportMessages] = useState<OrderSupportMessage[]>([]);
  const [supportInput, setSupportInput] = useState('');
  const [operatorTyping, setOperatorTyping] = useState(false);
  const supportScrollRef = useRef<HTMLDivElement>(null);
  const [reviewLeft, setReviewLeft] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);

  const { order, loading: orderLoading, error: orderError, refetch } = useOrder(orderId);

  const alreadyHasReview = useMemo(
    () => (order?.id ? hasReviewForOrder(order.id) : false),
    [order?.id]
  );
  const canLeaveReview = order?.status === 'success' && !alreadyHasReview && !reviewLeft;

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

  useEffect(() => {
    if (orderId) setSupportMessages(getOrderSupportMessages(orderId));
  }, [orderId]);

  useEffect(() => {
    if (!supportScrollRef.current) return;
    supportScrollRef.current.scrollTop = supportScrollRef.current.scrollHeight;
  }, [supportMessages, operatorTyping]);

  const escrowLabel: Record<EscrowStatus, string> = {
    PAID: 'Оплачено',
    IN_ESCROW: 'Средства удержаны (эскроу)',
    DELIVERED: 'Доставлено',
    DISPUTE: 'Спор',
    RELEASED: 'Средства переведены',
  };

  const handleSendSupport = useCallback(() => {
    if (!order || !orderId || !supportInput.trim()) return;

    const userMsg: OrderSupportMessage = {
      id: `u-${orderId}-${Date.now()}`,
      author: 'user',
      text: supportInput.trim(),
      createdAt: new Date().toISOString(),
    };
    setSupportInput('');
    setSupportMessages((prev) => {
      const next = [...prev, userMsg];
      appendOrderSupportMessages(orderId, [userMsg]);
      return next;
    });
    setOperatorTyping(true);
    logger.info('Order support message sent', { orderId, msgId: userMsg.id });

    setTimeout(() => {
      const operatorMsg: OrderSupportMessage = {
        id: `o-${orderId}-${Date.now()}`,
        author: 'operator',
        text: MOCK_OPERATOR_REPLY(order.id, order.email),
        createdAt: new Date().toISOString(),
      };
      setSupportMessages((prev) => {
        const next = [...prev, operatorMsg];
        appendOrderSupportMessages(orderId, [operatorMsg]);
        return next;
      });
      setOperatorTyping(false);
      toast.success('Ответ поддержки добавлен в переписку.');
    }, 1500);
  }, [order, orderId, supportInput]);

  const handleSubmitReview = useCallback(() => {
    if (!order || reviewRating < 1 || reviewRating > 5 || !reviewText.trim()) {
      toast.error('Укажите оценку от 1 до 5 и текст отзыва.');
      return;
    }
    addProductReview({
      productId: order.productId,
      orderId: order.id,
      rating: reviewRating,
      text: reviewText.trim(),
    });
    setReviewLeft(true);
    setReviewDialogOpen(false);
    setReviewRating(0);
    setReviewText('');
    toast.success('Спасибо! Ваш отзыв сохранён и привязан к товару.');
  }, [order, reviewRating, reviewText]);

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
            <p className="text-muted-foreground mb-4">{orderError ?? 'Заказ не существует или был удален'}</p>
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

              {/* Оставить отзыв */}
              {canLeaveReview && (
                <Card className="mb-6 border-primary/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Star className="h-5 w-5 text-warning" />
                      Оставить отзыв о товаре
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Расскажите о покупке — отзыв будет закреплён за {order.productName}.
                    </p>
                  </CardHeader>
                  <CardContent>
                    <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="w-full sm:w-auto">
                          <Star className="h-4 w-4 mr-2" />
                          Написать отзыв
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>Отзыв о {order.productName}</DialogTitle>
                          <DialogDescription>
                            Оценка и комментарий помогут другим покупателям.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 pt-2">
                          <div>
                            <Label>Оценка (1–5)</Label>
                            <div className="flex gap-1 mt-2">
                              {[1, 2, 3, 4, 5].map((i) => (
                                <button
                                  key={i}
                                  type="button"
                                  onClick={() => setReviewRating(i)}
                                  className="p-2 rounded-lg border border-border hover:bg-muted transition-colors"
                                >
                                  <Star
                                    className={`h-6 w-6 ${
                                      i <= reviewRating ? 'fill-warning text-warning' : 'text-muted-foreground'
                                    }`}
                                  />
                                </button>
                              ))}
                            </div>
                          </div>
                          <div>
                            <Label htmlFor="review-text">Текст отзыва</Label>
                            <Textarea
                              id="review-text"
                              value={reviewText}
                              onChange={(e) => setReviewText(e.target.value)}
                              placeholder="Опишите ваш опыт покупки..."
                              className="mt-2 min-h-[100px] resize-y"
                            />
                          </div>
                          <div className="flex gap-2 justify-end">
                            <Button variant="outline" onClick={() => setReviewDialogOpen(false)}>
                              Отмена
                            </Button>
                            <Button
                              onClick={handleSubmitReview}
                              disabled={reviewRating < 1 || reviewRating > 5 || !reviewText.trim()}
                            >
                              Отправить отзыв
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </CardContent>
                </Card>
              )}
              {(reviewLeft || alreadyHasReview) && order.status === 'success' && (
                <Alert className="mb-6">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  <AlertDescription>
                    Спасибо! Ваш отзыв сохранён и привязан к товару.{' '}
                    {(() => {
                      const p = getProductById(order.productId);
                      return p ? (
                        <Link to={`/product/${p.slug}`} className="text-primary underline underline-offset-2">
                          Посмотреть отзывы о {order.productName}
                        </Link>
                      ) : null;
                    })()}
                  </AlertDescription>
                </Alert>
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

          {/* Failed Status — по спекам: покупатель не видит failureReason, только нейтральное «Не выполнен» */}
          {order.status === 'failed' && (
            <div className="mb-8">
              <div className="flex items-center justify-center mb-6">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-destructive/20">
                  <XCircle className="h-12 w-12 text-destructive" />
                </div>
              </div>
              <h1 className="text-3xl font-bold text-center mb-2">Заказ не выполнен</h1>
              <p className="text-center text-muted-foreground mb-6">
                Оплата прошла, но выполнение не удалось. Поддержка уже в курсе и свяжется с вами.
              </p>

              <Alert variant="destructive" className="mb-6">
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  Не удалось выполнить пополнение. Наша служба поддержки свяжется с вами для решения вопроса.
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
                        document.getElementById('support-textarea')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
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

          {/* Переписка с поддержкой по заказу */}
          {canCreateTicket && (
            <Card className="mt-6" id="support-textarea">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  Переписка с поддержкой по заказу {order.id}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Опишите проблему и отправьте сообщение. История переписки сохраняется здесь;
                  когда оператор ответит, его сообщения появятся в этом окне.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div
                  ref={supportScrollRef}
                  className="min-h-[140px] max-h-[320px] overflow-y-auto rounded-lg border border-border bg-muted/30 p-4 space-y-3"
                  role="log"
                  aria-live="polite"
                >
                  {supportMessages.length === 0 && !operatorTyping && (
                    <p className="text-sm text-muted-foreground text-center py-6">
                      Пока нет сообщений. Напишите ниже — оператор ответит, и переписка появится здесь.
                    </p>
                  )}
                  {supportMessages.map((m) => (
                    <div
                      key={m.id}
                      className={cn(
                        'flex',
                        m.author === 'user' ? 'justify-end' : 'justify-start'
                      )}
                    >
                      <div
                        className={cn(
                          'max-w-[85%] rounded-2xl px-4 py-2.5 text-sm',
                          m.author === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-foreground'
                        )}
                      >
                        <p className="whitespace-pre-wrap break-words">{m.text}</p>
                        <p
                          className={cn(
                            'mt-1 text-xs',
                            m.author === 'user'
                              ? 'text-primary-foreground/80'
                              : 'text-muted-foreground'
                          )}
                        >
                          {m.author === 'user' ? 'Вы' : 'Поддержка'} ·{' '}
                          {new Date(m.createdAt).toLocaleString('ru-RU', {
                            day: '2-digit',
                            month: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                  {operatorTyping && (
                    <div className="flex justify-start">
                      <div className="rounded-2xl bg-muted px-4 py-2.5 text-sm text-muted-foreground">
                        Оператор печатает…
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex gap-2 items-end">
                  <Textarea
                    placeholder="Например: Оплата прошла, но пополнение не зачислилось. Указал правильный ID аккаунта."
                    value={supportInput}
                    onChange={(e) => setSupportInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendSupport();
                      }
                    }}
                    disabled={operatorTyping}
                    className="min-h-[44px] max-h-32 resize-y flex-1"
                    rows={2}
                  />
                  <Button
                    size="icon"
                    onClick={handleSendSupport}
                    disabled={!supportInput.trim() || operatorTyping}
                    aria-label="Отправить в поддержку"
                    className="shrink-0 h-11 w-11"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Переписка привязана к заказу <span className="font-mono">{order.id}</span>.
                  Ответы оператора также могут быть продублированы на{' '}
                  <span className="font-mono">{order.email}</span>.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Escrow status (when present) */}
          {order.escrowStatus && (
            <Card className="mt-6 border-primary/30 bg-primary/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  Статус эскроу
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant="secondary" className="text-sm">
                  {escrowLabel[order.escrowStatus]}
                </Badge>
                <p className="text-sm text-muted-foreground mt-2">
                  {order.escrowStatus === 'IN_ESCROW' && 'Деньги удержаны до подтверждения получения товара.'}
                  {order.escrowStatus === 'RELEASED' && 'Средства переведены после завершения заказа.'}
                  {order.escrowStatus === 'DISPUTE' && 'Открыт спор. Поддержка свяжется с вами.'}
                  {order.escrowStatus === 'PAID' && 'Оплата получена, ожидается обработка.'}
                  {order.escrowStatus === 'DELIVERED' && 'Товар доставлен.'}
                </p>
              </CardContent>
            </Card>
          )}

          <div className="grid md:grid-cols-2 gap-6 sm:gap-8 mt-10 min-w-0">
            {/* Order Info */}
            <Card className="min-w-0 overflow-hidden">
              <CardHeader>
                <CardTitle>Информация о заказе</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-3">
                  <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 items-start">
                    <dt className="text-muted-foreground shrink-0">Номер заказа</dt>
                    <dd className="font-mono text-sm min-w-0 break-words text-right">{order.id}</dd>
                  </div>
                  <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 items-start">
                    <dt className="text-muted-foreground shrink-0">Товар</dt>
                    <dd className="font-medium text-sm min-w-0 break-words text-right">{order.productName}</dd>
                  </div>
                  <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 items-center">
                    <dt className="text-muted-foreground shrink-0">Статус</dt>
                    <dd className="min-w-0 flex justify-end">
                      <Badge variant={
                        order.status === 'success' ? 'default' :
                        order.status === 'pending' ? 'secondary' :
                        order.status === 'failed' ? 'destructive' :
                        'outline'
                      }>
                        {order.statusText}
                      </Badge>
                    </dd>
                  </div>
                  <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 items-start">
                    <dt className="text-muted-foreground shrink-0">Метод оплаты</dt>
                    <dd className="text-sm min-w-0 break-words text-right">{order.paymentMethod}</dd>
                  </div>
                  <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 items-start">
                    <dt className="text-muted-foreground shrink-0">Email</dt>
                    <dd className="text-sm min-w-0 break-words text-right">{order.email}</dd>
                  </div>
                  {order.accountId && (
                    <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 items-start">
                      <dt className="text-muted-foreground shrink-0">ID аккаунта</dt>
                      <dd className="font-mono text-sm min-w-0 break-words text-right">{order.accountId}</dd>
                    </div>
                  )}
                </dl>
              </CardContent>
            </Card>

            {/* Timeline */}
            <Card className="min-w-0 overflow-hidden">
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
