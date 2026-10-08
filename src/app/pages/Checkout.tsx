import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Header from '@/app/components/Header';
import Footer from '@/app/components/Footer';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent } from '@/app/components/ui/card';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Check, CreditCard, ShieldCheck, Smartphone } from 'lucide-react';
import { productsService, ordersService, paymentService } from '@/app/services';
import { calculateOrderTotal, formatPrice } from '@/app/utils/orderCalculation';
import { toast } from 'sonner';
import { logger } from '@/app/utils/logger';
import { getCheckoutData, clearCheckoutData } from '@/app/utils/checkoutStorage';
import { formatCardNumber, formatExpiry } from '@/app/utils/cardUtils';
import { cn } from '@/app/components/ui/utils';
import type { PaymentMethod } from '@/app/types';
import { resolveProductSelection } from '@/app/domain/productSelection';
import { emailSchema } from '@/app/utils/schemas';

export default function CheckoutPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const productId = searchParams.get('productId');

  const [product, setProduct] = useState<Awaited<
    ReturnType<typeof productsService.getProductById>
  > | null>(null);
  const [checkoutData, setCheckoutData] = useState<ReturnType<typeof getCheckoutData>>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get productId from URL or stored data
    const finalProductId = productId || getCheckoutData()?.productId;

    if (!finalProductId) {
      toast.error('Товар не указан');
      navigate('/');
      return;
    }

    // Load checkout data from storage
    const stored = getCheckoutData();
    if (stored) {
      setCheckoutData(stored);
      setEmail(stored.email ?? '');
    }

    let cancelled = false;
    setLoading(true);

    productsService
      .getProductById(finalProductId)
      .then((data) => {
        if (!cancelled) {
          setProduct(data);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          logger.error('Failed to fetch product in checkout', err);
          toast.error('Товар не найден');
          navigate('/');
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [productId, navigate]);

  const selectedDenom = useMemo(() => {
    if (!product || !checkoutData) return undefined;
    if (
      checkoutData.denominationId === 'custom' &&
      typeof checkoutData.customAmount === 'number' &&
      typeof checkoutData.customPrice === 'number'
    ) {
      const currency = product.denominations[0]?.currency ?? 'RUB';
      return {
        id: 'custom' as const,
        amount: checkoutData.customAmount,
        currency,
        price: checkoutData.customPrice,
      };
    }
    try {
      return resolveProductSelection(product, checkoutData.optionId, checkoutData.denominationId)
        .denomination;
    } catch {
      return undefined;
    }
  }, [product, checkoutData]);

  const { commission, total } = useMemo(() => {
    const price = selectedDenom?.price ?? 0;
    return calculateOrderTotal(price);
  }, [selectedDenom]);

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('sbp');
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  const cardValid = useMemo(() => {
    const raw = cardNumber.replace(/\D/g, '');
    if (raw.length !== 16) return false;
    if (!cardHolder.trim()) return false;
    const exp = cardExpiry.replace(/\D/g, '');
    if (exp.length !== 4) return false;
    const mm = parseInt(exp.slice(0, 2), 10);
    if (mm < 1 || mm > 12) return false;
    const cvvRaw = cardCvv.replace(/\D/g, '');
    if (cvvRaw.length !== 3) return false;
    return true;
  }, [cardNumber, cardHolder, cardExpiry, cardCvv]);

  const expiryMonthInvalid = useMemo(() => {
    const exp = cardExpiry.replace(/\D/g, '');
    if (exp.length < 2) return false;
    const mm = parseInt(exp.slice(0, 2), 10);
    return mm < 1 || mm > 12;
  }, [cardExpiry]);

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.replace(/\D/g, '').slice(0, 16);
    setCardNumber(v);
  };
  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.replace(/\D/g, '').slice(0, 4);
    setCardExpiry(v);
  };
  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.replace(/\D/g, '').slice(0, 3);
    setCardCvv(v);
  };

  const handlePayment = useCallback(async () => {
    const validatedEmail = emailSchema.safeParse(email);
    if (!validatedEmail.success) {
      const message = validatedEmail.error.errors[0]?.message ?? 'Проверьте email';
      setEmailError(message);
      toast.error(message);
      return;
    }
    if (paymentMethod === 'card' && !cardValid) {
      toast.error('Заполните все данные карты: номер, держатель, срок, CVV');
      return;
    }
    if (!product || !selectedDenom || !checkoutData) {
      toast.error('Недостаточно данных для оформления заказа');
      return;
    }

    try {
      const isCustom =
        checkoutData.denominationId === 'custom' &&
        typeof checkoutData.customAmount === 'number' &&
        typeof checkoutData.customPrice === 'number';
      const orderResponse = await ordersService.createOrder({
        productId: product.id,
        denominationId: selectedDenom.id,
        optionId: checkoutData.optionId,
        email: validatedEmail.data,
        accountId: checkoutData.accountId,
        region: checkoutData.region,
        server: checkoutData.server,
        paymentMethod,
        ...(isCustom && {
          customAmount: checkoutData.customAmount,
          customPrice: checkoutData.customPrice,
        }),
      });

      // Clear checkout data
      clearCheckoutData();

      // Initiate payment
      const returnUrl = `${window.location.origin}/order/${orderResponse.order.id}`;
      await paymentService.initiatePayment({
        orderId: orderResponse.order.id,
        paymentMethod,
        returnUrl,
      });

      // Navigate to payment processing
      navigate(`/payment-processing?orderId=${orderResponse.order.id}`);
    } catch (error) {
      logger.error('Failed to create order', error);
      const msg =
        error instanceof Error ? error.message : 'Не удалось создать заказ. Попробуйте еще раз.';
      toast.error(msg);
    }
  }, [cardValid, checkoutData, email, navigate, paymentMethod, product, selectedDenom]);

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-muted-foreground">Загрузка...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!product || !selectedDenom) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="mb-2 text-2xl font-bold">
              {product ? 'Выбранный вариант недоступен' : 'Товар не найден'}
            </h1>
            <p className="text-muted-foreground mb-4">
              {product
                ? 'Наличие или состав товара изменились. Выберите вариант и номинал заново.'
                : 'Товар не существует или был снят с публикации.'}
            </p>
            <Button onClick={() => navigate(product ? `/product/${product.slug}` : '/#catalog')}>
              {product ? 'Вернуться к товару' : 'Вернуться в каталог'}
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-1 bg-muted/20">
        <div className="container mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <p className="text-sm font-medium text-muted-foreground">Оформление заказа</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">{product.name}</h1>

          <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(360px,0.8fr)]">
            <div className="space-y-5">
              <Card>
                <CardContent className="p-5 sm:p-6">
                  <h2 className="text-xl font-bold">Детали заказа</h2>
                  <dl className="mt-4 divide-y">
                    <div className="flex items-start justify-between gap-4 py-3 first:pt-0">
                      <dt className="text-sm text-muted-foreground">Товар</dt>
                      <dd className="text-right text-sm font-semibold">{product.name}</dd>
                    </div>
                    <div className="flex items-start justify-between gap-4 py-3">
                      <dt className="text-sm text-muted-foreground">Выбрано</dt>
                      <dd className="text-right text-sm font-semibold">
                        {selectedDenom.label ||
                          `${selectedDenom.amount.toLocaleString('ru-RU')} ${selectedDenom.currency}`}
                      </dd>
                    </div>
                    {checkoutData?.optionValue ? (
                      <div className="flex items-start justify-between gap-4 py-3">
                        <dt className="text-sm text-muted-foreground">
                          {checkoutData.optionLabel || 'Вариант'}
                        </dt>
                        <dd className="text-right text-sm font-semibold">
                          {checkoutData.optionValue}
                        </dd>
                      </div>
                    ) : null}
                    {checkoutData?.region ? (
                      <div className="flex items-start justify-between gap-4 py-3">
                        <dt className="text-sm text-muted-foreground">Регион</dt>
                        <dd className="text-right text-sm font-semibold">{checkoutData.region}</dd>
                      </div>
                    ) : null}
                    {checkoutData?.server ? (
                      <div className="flex items-start justify-between gap-4 py-3">
                        <dt className="text-sm text-muted-foreground">Сервер</dt>
                        <dd className="text-right text-sm font-semibold">{checkoutData.server}</dd>
                      </div>
                    ) : null}
                    {checkoutData?.accountId ? (
                      <div className="flex items-start justify-between gap-4 py-3 last:pb-0">
                        <dt className="text-sm text-muted-foreground">
                          {product.slug === 'telegram-stars'
                            ? 'Telegram'
                            : product.slug === 'steam-wallet'
                              ? 'Steam'
                              : 'Аккаунт'}
                        </dt>
                        <dd className="break-all text-right text-sm font-semibold">
                          {checkoutData.accountId}
                        </dd>
                      </div>
                    ) : null}
                  </dl>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="space-y-5 p-5 sm:p-6">
                  <div>
                    <h2 className="text-xl font-bold">О товаре</h2>
                    <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                      {product.description}
                    </p>
                  </div>

                  {product.warnings?.length ? (
                    <div className="border-t pt-4">
                      <h3 className="text-sm font-semibold">Перед оплатой проверьте</h3>
                      <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
                        {product.warnings.map((warning) => (
                          <li key={warning} className="flex gap-2">
                            <span className="text-primary">•</span>
                            <span>{warning}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  {product.features?.length ? (
                    <div className="border-t pt-4">
                      <ul className="grid gap-2 text-sm sm:grid-cols-2">
                        {product.features.slice(0, 4).map((feature) => (
                          <li key={feature} className="flex items-start gap-2">
                            <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            </div>

            <Card className="lg:sticky lg:top-20">
              <CardContent className="space-y-5 p-5 sm:p-6">
                <fieldset>
                  <legend className="text-sm font-semibold">Способ оплаты</legend>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {[
                      { value: 'sbp' as const, label: 'СБП', icon: Smartphone },
                      { value: 'card' as const, label: 'Карта', icon: CreditCard },
                    ].map((method) => {
                      const Icon = method.icon;
                      const selected = paymentMethod === method.value;
                      return (
                        <button
                          key={method.value}
                          type="button"
                          onClick={() => setPaymentMethod(method.value)}
                          aria-pressed={selected}
                          className={cn(
                            'relative flex min-h-16 flex-col items-start justify-between rounded-xl border p-3 text-left transition-colors',
                            selected ? 'border-primary bg-primary/5' : 'hover:border-primary/40'
                          )}
                        >
                          <Icon className="h-5 w-5" />
                          <span className="mt-2 text-sm font-semibold">{method.label}</span>
                          {selected ? (
                            <span className="absolute right-2.5 top-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                              <Check className="h-3 w-3" />
                            </span>
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                </fieldset>

                <div>
                  <p className="text-3xl font-bold tracking-tight">{formatPrice(total)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatPrice(selectedDenom.price)} + комиссия {formatPrice(commission)}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="checkout-email">Email для получения заказа</Label>
                  <Input
                    id="checkout-email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => {
                      setEmail(event.target.value);
                      setEmailError('');
                    }}
                    placeholder="name@example.com"
                    aria-invalid={Boolean(emailError)}
                  />
                  {emailError ? <p className="text-xs text-destructive">{emailError}</p> : null}
                </div>

                {paymentMethod === 'card' ? (
                  <div className="space-y-3 border-t pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="card-number">Номер карты</Label>
                      <Input
                        id="card-number"
                        placeholder="1234 5678 9012 3456"
                        value={formatCardNumber(cardNumber)}
                        onChange={handleCardNumberChange}
                        inputMode="numeric"
                        autoComplete="cc-number"
                        className="font-mono"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="card-holder">Держатель карты</Label>
                      <Input
                        id="card-holder"
                        placeholder="ИМЯ ФАМИЛИЯ"
                        value={cardHolder}
                        onChange={(event) => setCardHolder(event.target.value.toUpperCase())}
                        autoComplete="cc-name"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label
                          htmlFor="card-expiry"
                          className={cn(expiryMonthInvalid && 'text-destructive')}
                        >
                          Срок
                        </Label>
                        <Input
                          id="card-expiry"
                          placeholder="MM/YY"
                          value={formatExpiry(cardExpiry)}
                          onChange={handleExpiryChange}
                          inputMode="numeric"
                          autoComplete="cc-exp"
                          className="font-mono"
                          aria-invalid={expiryMonthInvalid}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="card-cvv">CVV</Label>
                        <Input
                          id="card-cvv"
                          placeholder="123"
                          value={cardCvv}
                          onChange={handleCvvChange}
                          inputMode="numeric"
                          autoComplete="cc-csc"
                          className="font-mono"
                        />
                      </div>
                    </div>
                    {expiryMonthInvalid ? (
                      <p className="text-xs text-destructive">Месяц должен быть от 01 до 12</p>
                    ) : null}
                  </div>
                ) : null}

                <Button
                  className="w-full"
                  size="lg"
                  onClick={handlePayment}
                  disabled={!email.trim() || (paymentMethod === 'card' && !cardValid)}
                >
                  Оплатить {formatPrice(total)}
                </Button>

                <p className="text-xs leading-relaxed text-muted-foreground">
                  Нажимая «Оплатить», вы принимаете{' '}
                  <a
                    href="/legal/terms"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-foreground"
                  >
                    оферту
                  </a>
                  ,{' '}
                  <a
                    href="/legal/payment-terms"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-foreground"
                  >
                    условия оплаты
                  </a>{' '}
                  и{' '}
                  <a
                    href="/legal/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-foreground"
                  >
                    политику обработки данных
                  </a>
                  .
                </p>

                <div className="flex items-start gap-2 border-t pt-4 text-sm">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <p>
                    <span className="font-semibold">Безопасная оплата.</span> Данные заказа
                    защищены, статус будет доступен сразу после оплаты.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
