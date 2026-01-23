import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Header from '@/app/components/Header';
import Footer from '@/app/components/Footer';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Checkbox } from '@/app/components/ui/checkbox';
import { Label } from '@/app/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/app/components/ui/radio-group';
import { CreditCard, Smartphone } from 'lucide-react';
import { productsService, ordersService, paymentService } from '@/app/services';
import { calculateOrderTotal } from '@/app/utils/orderCalculation';
import { toast } from 'sonner';
import { logger } from '@/app/utils/logger';
import { getCheckoutData, clearCheckoutData } from '@/app/utils/checkoutStorage';
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

  const selectedDenom = useMemo(
    () => product?.denominations.find(d => d.id === checkoutData?.denominationId),
    [product, checkoutData?.denominationId]
  );

  const { commission, total } = useMemo(() => {
    const price = selectedDenom?.price || 0;
    return calculateOrderTotal(price);
  }, [selectedDenom]);

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const handlePayment = useCallback(async () => {
    if (!agreedToTerms) {
      toast.error('Пожалуйста, примите условия оферты');
      return;
    }

    if (!product || !selectedDenom || !checkoutData) {
      toast.error('Недостаточно данных для оформления заказа');
      return;
    }

    try {
      // Create order via API
      const orderResponse = await ordersService.createOrder({
        productId: product.id,
        denominationId: selectedDenom.id,
        email: checkoutData.email,
        accountId: checkoutData.accountId,
        region: checkoutData.region,
        server: checkoutData.server,
        paymentMethod,
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
      toast.error('Не удалось создать заказ. Попробуйте еще раз.');
    }
  }, [agreedToTerms, navigate, product, selectedDenom, checkoutData, paymentMethod]);

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

              {/* Terms */}
              <div className="flex items-start gap-2">
                <Checkbox 
                  id="terms" 
                  checked={agreedToTerms}
                  onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
                />
                <Label htmlFor="terms" className="text-sm leading-relaxed cursor-pointer">
                  Я принимаю условия{' '}
                  <a href="/legal/terms" target="_blank" className="text-primary hover:underline">
                    оферты
                  </a>
                  ,{' '}
                  <a href="/legal/privacy" target="_blank" className="text-primary hover:underline">
                    политики конфиденциальности
                  </a>
                  {' '}и{' '}
                  <a href="/legal/payment-terms" target="_blank" className="text-primary hover:underline">
                    условий оплаты
                  </a>
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
                    disabled={!agreedToTerms}
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
