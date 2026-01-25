import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Header from '@/app/components/Header';
import Footer from '@/app/components/Footer';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Checkbox } from '@/app/components/ui/checkbox';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/app/components/ui/radio-group';
import { FlippableCreditCard } from '@/app/components/ui/credit-debit-card';
import { CreditCard, Smartphone } from 'lucide-react';
import { productsService, ordersService, paymentService } from '@/app/services';
import { calculateOrderTotal } from '@/app/utils/orderCalculation';
import { toast } from 'sonner';
import { logger } from '@/app/utils/logger';
import { getCheckoutData, clearCheckoutData } from '@/app/utils/checkoutStorage';
import { formatCardNumber, formatExpiry } from '@/app/utils/cardUtils';
import { cn } from '@/app/components/ui/utils';
import type { PaymentMethod } from '@/app/types';

export default function CheckoutPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const productId = searchParams.get('productId');

  const [product, setProduct] = useState<Awaited<ReturnType<typeof productsService.getProductById>> | null>(null);
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
    }

    let cancelled = false;
    setLoading(true);

    productsService.getProductById(finalProductId)
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
    if (checkoutData.denominationId === 'custom' && typeof checkoutData.customAmount === 'number' && typeof checkoutData.customPrice === 'number') {
      const currency = product.denominations[0]?.currency ?? 'RUB';
      return { id: 'custom' as const, amount: checkoutData.customAmount, currency, price: checkoutData.customPrice };
    }
    return product.denominations.find(d => d.id === checkoutData.denominationId);
  }, [product, checkoutData]);

  const { commission, total } = useMemo(() => {
    const price = selectedDenom?.price ?? 0;
    return calculateOrderTotal(price);
  }, [selectedDenom]);

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [cardFlipped, setCardFlipped] = useState(false);
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
    if (!agreedToTerms) {
      toast.error('Пожалуйста, примите условия оферты');
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
      const isCustom = checkoutData.denominationId === 'custom' && typeof checkoutData.customAmount === 'number' && typeof checkoutData.customPrice === 'number';
      const orderResponse = await ordersService.createOrder({
        productId: product.id,
        denominationId: selectedDenom.id,
        email: checkoutData.email,
        accountId: checkoutData.accountId,
        region: checkoutData.region,
        server: checkoutData.server,
        paymentMethod,
        ...(isCustom && { customAmount: checkoutData.customAmount, customPrice: checkoutData.customPrice }),
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
      const msg = error instanceof Error ? error.message : 'Не удалось создать заказ. Попробуйте еще раз.';
      toast.error(msg);
    }
  }, [agreedToTerms, navigate, product, selectedDenom, checkoutData, paymentMethod, cardValid]);

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
            <p className="text-muted-foreground mb-4">Товар не найден</p>
            <Button onClick={() => navigate('/')}>Вернуться на главную</Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-1">
        <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8">Оформление заказа</h1>

          <div className="grid lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Order Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Детали заказа</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Товар</span>
                    <span className="font-medium">{product.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Сумма</span>
                    <span className="font-medium">{selectedDenom.amount} {selectedDenom.currency}</span>
                  </div>
                  {checkoutData?.region && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Регион</span>
                      <span className="font-medium">{checkoutData.region}</span>
                    </div>
                  )}
                  {checkoutData?.server && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Сервер</span>
                      <span className="font-medium">{checkoutData.server}</span>
                    </div>
                  )}
                  {checkoutData?.accountId && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">ID аккаунта</span>
                      <span className="font-medium">{checkoutData.accountId}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Email</span>
                    <span className="font-medium">{checkoutData?.email || 'Не указан'}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Method */}
              <Card>
                <CardHeader>
                  <CardTitle>Способ оплаты</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                    <div className="flex items-center space-x-3 rounded-lg border p-4 cursor-pointer hover:border-primary">
                      <RadioGroupItem value="card" id="card" />
                      <Label htmlFor="card" className="flex-1 cursor-pointer">
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-5 w-5" />
                          <div>
                            <div className="font-medium">Банковская карта</div>
                            <div className="text-xs text-muted-foreground">Visa, Mastercard, МИР</div>
                          </div>
                        </div>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-3 rounded-lg border p-4 cursor-pointer hover:border-primary mt-3">
                      <RadioGroupItem value="sbp" id="sbp" />
                      <Label htmlFor="sbp" className="flex-1 cursor-pointer">
                        <div className="flex items-center gap-2">
                          <Smartphone className="h-5 w-5" />
                          <div>
                            <div className="font-medium">СБП</div>
                            <div className="text-xs text-muted-foreground">Система быстрых платежей</div>
                          </div>
                        </div>
                      </Label>
                    </div>
                  </RadioGroup>
                </CardContent>
              </Card>

              {paymentMethod === 'card' && (
                <Card>
                  <CardHeader>
                    <CardTitle>Данные карты</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      Введите данные на лицевой стороне. Карта перевернётся для CVV. Наведите или нажмите на карту, чтобы проверить ввод.
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex flex-col sm:flex-row gap-6 sm:gap-8">
                      <div className="flex justify-center sm:block">
                        <FlippableCreditCard
                          cardholderName={cardHolder}
                          cardNumber={cardNumber}
                          expiryDate={cardExpiry}
                          cvv={cardCvv}
                          flipped={cardFlipped}
                          onFlippedChange={setCardFlipped}
                        />
                      </div>
                      <div className="flex-1 space-y-5">
                        <div className="flex flex-col gap-2">
                          <Label htmlFor="card-number" className="text-muted-foreground">Номер карты</Label>
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
                        <div className="flex flex-col gap-2">
                          <Label htmlFor="card-holder" className="text-muted-foreground">Держатель карты</Label>
                          <Input
                            id="card-holder"
                            placeholder="ИМЯ ФАМИЛИЯ"
                            value={cardHolder}
                            onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
                            autoComplete="cc-name"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex flex-col gap-2">
                            <Label htmlFor="card-expiry" className={cn("whitespace-nowrap text-muted-foreground", expiryMonthInvalid && "text-destructive")}>
                              Срок (MM/YY)
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
                              aria-describedby={expiryMonthInvalid ? "card-expiry-error" : undefined}
                            />
                            {expiryMonthInvalid && (
                              <p id="card-expiry-error" className="text-sm text-destructive" role="alert">
                                Месяц должен быть от 01 до 12
                              </p>
                            )}
                          </div>
                          <div className="flex flex-col gap-2">
                            <Label htmlFor="card-cvv" className="text-muted-foreground">CVV</Label>
                            <Input
                              id="card-cvv"
                              placeholder="123"
                              value={cardCvv}
                              onChange={handleCvvChange}
                              onFocus={() => setCardFlipped(true)}
                              onBlur={() => setCardFlipped(false)}
                              inputMode="numeric"
                              autoComplete="cc-csc"
                              className="font-mono"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Terms */}
              <div className="flex items-start gap-3">
                <Checkbox 
                  id="terms" 
                  checked={agreedToTerms}
                  onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
                  className="mt-0.5 shrink-0"
                />
                <Label
                  htmlFor="terms"
                  className="flex-1 min-w-0 text-sm leading-relaxed cursor-pointer font-normal [&>span]:inline"
                >
                  <span>
                    Я принимаю{' '}
                    <a href="/legal/terms" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      условия оферты
                    </a>
                    ,{' '}
                    <a href="/legal/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      политику конфиденциальности
                    </a>
                    {' '}и{' '}
                    <a href="/legal/payment-terms" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      условия оплаты
                    </a>
                  </span>
                </Label>
              </div>
            </div>

            {/* Price Summary */}
            <div>
              <Card className="lg:sticky lg:top-20">
                <CardHeader>
                  <CardTitle>Итого</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Стоимость</span>
                      <span>{selectedDenom.price} ₽</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        Комиссия ({Math.round(calculateOrderTotal(selectedDenom.price).commissionPercent * 100)}%)
                      </span>
                      <span>{commission} ₽</span>
                    </div>
                    <div className="flex justify-between font-bold text-xl pt-2 border-t">
                      <span>К оплате</span>
                      <span className="text-primary">{total} ₽</span>
                    </div>
                  </div>

                  <Button 
                    className="w-full" 
                    size="lg"
                    onClick={handlePayment}
                    disabled={!agreedToTerms || (paymentMethod === 'card' && !cardValid)}
                  >
                    Перейти к оплате
                  </Button>

                  <p className="text-xs text-center text-muted-foreground">
                    Нажимая кнопку, вы будете перенаправлены на страницу платежной системы
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
