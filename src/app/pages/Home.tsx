import { useState, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Zap, Shield, Clock, ArrowRight, Star, CheckCircle, CreditCard, Mail, Smartphone, CheckCircle2, Sparkles } from 'lucide-react';
import Header from '@/app/components/Header';
import Footer from '@/app/components/Footer';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent } from '@/app/components/ui/card';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import { ProductCard } from '@/app/components/ui/product-card';
import { useProducts } from '@/app/hooks/useProducts';
import { quickCheckoutSchema } from '@/app/utils/schemas';
import { getProductImage, getProductLogo } from '@/app/utils/productAssets';
import { toast } from 'sonner';
import backgroundTopImage from '@/app/assets/images/фон_верх.png';
import { cn } from '@/app/components/ui/utils';
import { calculateOrderTotal } from '@/app/utils/orderCalculation';
import { storeCheckoutData } from '@/app/utils/checkoutStorage';

export default function HomePage() {
  const navigate = useNavigate();
  const [selectedProduct, setSelectedProduct] = useState('1');
  const [selectedAmount, setSelectedAmount] = useState('');
  const [accountId, setAccountId] = useState('');
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<{ email?: string; accountId?: string; amount?: string }>({});

  const { products: allProducts, loading: productsLoading } = useProducts();
  const { products: popularProducts } = useProducts({ popular: true });

  const product = useMemo(() => {
    const found = allProducts.find(p => p.id === selectedProduct);
    // Fallback to first product if selected not found
    if (!found && allProducts.length > 0 && !productsLoading) {
      return allProducts[0];
    }
    return found;
  }, [allProducts, selectedProduct, productsLoading]);

  const handleProductChange = useCallback((value: string) => {
    setSelectedProduct(value);
    // При смене товара сбрасываем сумму и ошибки, чтобы блок цены схлопывался
    setSelectedAmount('');
    setErrors((prev) => ({ ...prev, amount: undefined }));
  }, []);

  const handleQuickCheckout = useCallback(() => {
    if (!product) {
      toast.error('Товар не найден');
      return;
    }

    // Validate with zod schema
    const schema = quickCheckoutSchema(product.type);
    const result = schema.safeParse({
      email,
      accountId: product.type === 'top-up' ? accountId : undefined,
      denominationId: selectedAmount,
    });

    if (!result.success) {
      const fieldErrors: { email?: string; accountId?: string; amount?: string } = {};
      result.error.errors.forEach((err) => {
        const field = err.path[0] as keyof typeof fieldErrors;
        if (field === 'denominationId') {
          fieldErrors.amount = err.message;
        } else if (field in fieldErrors) {
          fieldErrors[field] = err.message;
        }
      });
      setErrors(fieldErrors);
      toast.error('Пожалуйста, исправьте ошибки в форме');
      return;
    }

    const selectedDenom = product.denominations.find(d => d.id === selectedAmount);
    if (!selectedDenom) {
      toast.error('Номинал не найден');
      return;
    }

    // Store checkout data securely
    storeCheckoutData({
      productId: selectedProduct,
      denominationId: selectedAmount,
      email: result.data.email,
      accountId: result.data.accountId,
    });

    toast.success('Переход к оформлению заказа...');
    navigate(`/checkout?productId=${selectedProduct}`);
  }, [email, selectedAmount, product, accountId, selectedProduct, navigate]);

  return (
    <div className="flex flex-col min-h-screen relative">
      <Header />
      
      <main className="flex-1 relative">
        {/* Top Background Image - Full Width, от самого верха без отступов */}
        <div className="w-full overflow-hidden relative -mt-[calc(1rem+4rem)] sm:-mt-[calc(1rem+4.5rem)]">
          <img 
            src={backgroundTopImage} 
            alt=""
            className="w-full h-auto object-cover"
            style={{ display: 'block' }}
          />
          {/* Text Overlay */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-3 sm:px-4 md:px-6">
            <div className="bg-black/40 backdrop-blur-sm px-3 py-3 sm:px-6 sm:py-6 md:px-12 md:py-8 rounded-lg w-[calc(100%-1.5rem)] sm:w-auto sm:max-w-[90%] md:max-w-full -mt-[100px]">
              <h2 className="font-bold text-white mb-1 drop-shadow-lg leading-tight break-words" style={{ fontSize: 'clamp(0.875rem, 3.2vw, 4.5rem)' }}>
                ЦИФРОВОЙ МАРКЕТПЛЕЙС
              </h2>
              <p className="text-white drop-shadow-md leading-tight break-words" style={{ fontSize: 'clamp(0.75rem, 1.3vw, 1.5rem)' }}>
                сервисов и внутриигровых товаров
              </p>
            </div>
          </div>
        </div>

        {/* Hero Section - Overlapping the background */}
        <section className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8 sm:pt-14 md:pt-20 lg:pt-24 pb-12 sm:pb-16 md:pb-20 lg:pb-24 relative -mt-16 sm:-mt-24 md:-mt-32 lg:-mt-40 xl:-mt-52 2xl:-mt-72" style={{ zIndex: 1 }}>
          <div className="grid lg:grid-cols-2 gap-8 sm:gap-10 md:gap-12 lg:gap-14 items-start">
            {/* Left Side - Hero Content */}
            <div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-7 leading-tight tracking-tight">
                Быстрое пополнение<br />
                <span className="text-primary">игровых валют</span>
              </h1>
              <p className="text-xl text-muted-foreground mb-10 max-w-xl">
                Пополняйте Steam, PlayStation, Xbox и другие сервисы за 1-3 минуты. 
                Без регистрации, безопасно и с прозрачной комиссией.
              </p>

              {/* Features */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5 mb-8 sm:mb-10">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Zap className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm md:text-base">Моментально</div>
                    <div className="text-xs md:text-sm text-muted-foreground">1-3 минуты</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10 text-success">
                    <Shield className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm md:text-base">Безопасно</div>
                    <div className="text-xs md:text-sm text-muted-foreground">SSL шифрование</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10 text-warning">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm md:text-base">24/7</div>
                    <div className="text-xs md:text-sm text-muted-foreground">Всегда доступно</div>
                  </div>
                </div>
              </div>

              <Link to="/catalog">
                <Button size="lg" className="group">
                  Открыть каталог
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>

            {/* Right Side - Quick Checkout Card */}
            <Card className="border-2 shadow-2xl w-full">
              <CardContent className="p-4 sm:p-6">
                <div className="mb-7">
                  <h3 className="text-2xl md:text-3xl font-bold mb-2 tracking-tight">Быстрое пополнение</h3>
                  <p className="text-sm md:text-base text-muted-foreground">
                    Выберите товар, введите данные и оплатите
                  </p>
                </div>

                <div className="space-y-5">
                  {/* Product Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="product">Выберите товар</Label>
                    <Select
                      value={selectedProduct}
                      onValueChange={handleProductChange}
                    >
                      <SelectTrigger id="product">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {popularProducts.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            <span className="flex items-center gap-2">
                              <img 
                                src={getProductLogo(p.slug)} 
                                alt={`${p.name} logo`}
                                className="w-5 h-5 object-contain"
                              />
                              {p.name}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Amount Selection */}
                  {product && (
                    <div className="space-y-2">
                      <Label htmlFor="amount">Сумма</Label>
                      <Select value={selectedAmount} onValueChange={setSelectedAmount}>
                        <SelectTrigger id="amount">
                          <SelectValue placeholder="Выберите сумму" />
                        </SelectTrigger>
                        <SelectContent>
                          {product.denominations.map((denom) => (
                            <SelectItem key={denom.id} value={denom.id}>
                              {denom.amount} {denom.currency} — {denom.price} ₽
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount}</p>}
                    </div>
                  )}

                  {/* Account ID block — всегда на месте для стабильного layout */}
                  <div className="space-y-2">
                    <Label htmlFor="accountId">
                      {product?.type === 'top-up'
                        ? product.name === 'Steam Пополнение'
                          ? 'Steam ID'
                          : product.name === 'Telegram Stars'
                            ? 'Telegram Username'
                            : 'ID аккаунта'
                        : 'Данные аккаунта'}
                    </Label>
                    <Input
                      id="accountId"
                      type="text"
                      value={accountId}
                      onChange={(e) => setAccountId(e.target.value)}
                      placeholder={
                        product?.type === 'top-up'
                          ? product.name === 'Steam Пополнение'
                            ? 'steamuser123'
                            : product.name === 'Telegram Stars'
                              ? 'username'
                              : 'Введите ID'
                          : 'Не требуется для этого товара'
                      }
                      className={cn(
                        "bg-input",
                        product?.type !== 'top-up' && "opacity-60 cursor-not-allowed"
                      )}
                      disabled={product?.type !== 'top-up'}
                      aria-invalid={!!errors.accountId}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {product?.type === 'top-up'
                        ? product.instructions || 'Укажите ваш ID аккаунта'
                        : 'Для этого типа товара ID аккаунта не требуется'}
                    </p>
                    {errors.accountId && (
                      <p className="text-red-500 text-xs mt-1">{errors.accountId}</p>
                    )}
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="text"
                      inputMode="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="bg-input"
                      aria-invalid={!!errors.email}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Для чека и статуса заказа
                    </p>
                    {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                  </div>

                  {/* Price Summary (плавное появление/скрытие) */}
                  <div
                    className={cn(
                      // Плавное разворачивание и схлопывание блока с ценой
                      "overflow-hidden transition-all duration-400 ease-in-out",
                      selectedAmount && product
                        ? "max-h-40 opacity-100 mt-4"
                        : "max-h-0 opacity-0 mt-0",
                    )}
                  >
                    {selectedAmount && product && (
                      <div className="pt-4 border-t space-y-2">
                        {(() => {
                          const denom = product.denominations.find(
                            (d) => d.id === selectedAmount,
                          );
                          const basePrice = denom?.price ?? 0;
                          const {
                            commission,
                            total,
                            commissionPercent,
                          } = calculateOrderTotal(basePrice);
                          return (
                            <>
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Сумма</span>
                                <span>{basePrice} ₽</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">
                                  Комиссия ({Math.round(commissionPercent * 100)}%)
                                </span>
                                <span>{commission} ₽</span>
                              </div>
                              <div className="flex justify-between font-bold text-lg pt-2">
                                <span>К оплате</span>
                                <span className="text-primary">{total} ₽</span>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    )}
                  </div>

                  <Button 
                    className="w-full" 
                    size="lg"
                    onClick={handleQuickCheckout}
                    disabled={!selectedAmount || !email || (product?.type === 'top-up' && !accountId)}
                  >
                    Оплатить
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* How It Works - Bento Style */}
        <section className="pt-0 pb-12 sm:pb-16 md:pb-20 lg:pt-2 lg:pb-24">
          <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-center mb-8 sm:mb-12 md:mb-16 px-2">Как это работает</h2>
            
            {/* Bento Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-6">
              {/* Step 1 - Large Card */}
              <Card className="md:col-span-2 lg:col-span-2 border-2 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-primary/5 to-primary/10">
                <CardContent className="p-6 lg:p-8 h-full flex flex-col">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/20 border-2 border-primary/30 text-primary font-bold text-3xl shadow-md">
                      1
                    </div>
                    <div>
                      <h3 className="font-bold text-2xl lg:text-3xl">Выберите товар и сумму</h3>
                      <p className="text-muted-foreground text-sm mt-1">Начните с выбора</p>
                    </div>
                  </div>
                  <div className="space-y-3 flex-1">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-muted-foreground">Выберите нужный товар из каталога или используйте быструю форму на главной</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-muted-foreground">Укажите желаемую сумму пополнения</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-muted-foreground">Введите ID аккаунта (для пополнений) и email для получения чека</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Methods - Medium Card */}
              <Card className="md:col-span-2 lg:col-span-2 border-2 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-primary/5 to-background">
                <CardContent className="p-6 lg:p-8 h-full flex flex-col">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/20 border-2 border-primary/30 text-primary font-bold text-3xl shadow-md">
                      2
                    </div>
                    <div>
                      <h3 className="font-bold text-2xl lg:text-3xl">Оплата</h3>
                      <p className="text-muted-foreground text-sm mt-1">Безопасно и быстро</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 flex-1">
                    <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-card border border-border">
                      <CreditCard className="h-8 w-8 text-primary mb-2" />
                      <p className="text-sm font-semibold text-center">Банковская карта</p>
                      <p className="text-xs text-muted-foreground text-center mt-1">Visa, Mastercard</p>
                    </div>
                    <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-card border border-border">
                      <Smartphone className="h-8 w-8 text-primary mb-2" />
                      <p className="text-sm font-semibold text-center">СБП</p>
                      <p className="text-xs text-muted-foreground text-center mt-1">Быстрый платеж</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Step 3 - Large Card */}
              <Card className="md:col-span-2 lg:col-span-2 border-2 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-primary/5 to-primary/10">
                <CardContent className="p-6 lg:p-8 h-full flex flex-col">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/20 border-2 border-primary/30 text-primary font-bold text-3xl shadow-md">
                      3
                    </div>
                    <div>
                      <h3 className="font-bold text-2xl lg:text-3xl">Получение</h3>
                      <p className="text-muted-foreground text-sm mt-1">Быстро и автоматически</p>
                    </div>
                  </div>
                  <div className="space-y-3 flex-1">
                    <div className="flex items-start gap-3">
                      <Sparkles className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-semibold">Пополнение аккаунта</p>
                        <p className="text-xs text-muted-foreground mt-1">Средства зачисляются автоматически на указанный аккаунт</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Mail className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-semibold">Код/Ваучер</p>
                        <p className="text-xs text-muted-foreground mt-1">Код отправляется на указанный email или отображается в статусе заказа</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-semibold">Уведомление</p>
                        <p className="text-xs text-muted-foreground mt-1">Вы получите подтверждение на email после выполнения заказа</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* No Registration - Small Card */}
              <Card className="border-2 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-primary/5 to-background">
                <CardContent className="p-6 h-full flex flex-col items-center justify-center text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/20 border-2 border-primary/30 mb-4">
                    <Star className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="font-bold text-xl mb-2">Без регистрации</h3>
                  <p className="text-sm text-muted-foreground">Покупайте сразу</p>
                  <p className="text-xs text-muted-foreground mt-2">Только email</p>
                </CardContent>
              </Card>

              {/* Support - Small Card */}
              <Card className="border-2 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-background to-card">
                <CardContent className="p-6 h-full flex flex-col items-center justify-center text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/20 border-2 border-primary/30 mb-4">
                    <Clock className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="font-bold text-xl mb-2">24/7</h3>
                  <p className="text-sm text-muted-foreground">Поддержка</p>
                  <p className="text-xs text-muted-foreground mt-2">Всегда на связи</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Popular Products */}
        <section className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-20">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 sm:mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold">Популярные товары</h2>
            <Link to="/catalog" className="w-full sm:w-auto">
              <Button variant="outline" className="w-full sm:w-auto">
                Все товары
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
          {productsLoading ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground">Загрузка товаров...</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-6">
              {popularProducts.map((product) => (
              <ProductCard
                key={product.id}
                id={product.id}
                slug={product.slug}
                name={product.name}
                image={getProductImage(product.slug)}
                logo={getProductLogo(product.slug)}
                price={product.denominations[0]?.price || 0}
                deliveryTimeText={product.deliveryTimeText}
                deliverySpeed={product.deliverySpeed}
                popular={product.popular}
                enableAnimations={true}
              />
              ))}
            </div>
          )}
        </section>

        {/* Trust Section */}
        <section className="bg-card border-y border-border py-12 sm:py-16 md:py-20">
          <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto">
              <h2 className="text-2xl sm:text-3xl font-bold mb-4 px-2">Нам доверяют</h2>
              <p className="text-muted-foreground mb-6 sm:mb-8 px-4">
                Более 10,000 успешных заказов. Средний рейтинг 4.9/5.0
              </p>
              <div className="grid sm:grid-cols-3 gap-6 sm:gap-8 px-4">
                <div>
                  <div className="text-4xl font-bold text-primary mb-2">10K+</div>
                  <div className="text-sm text-muted-foreground">Успешных заказов</div>
                </div>
                <div>
                  <div className="text-4xl font-bold text-primary mb-2">4.9/5.0</div>
                  <div className="text-sm text-muted-foreground">Средний рейтинг</div>
                </div>
                <div>
                  <div className="text-4xl font-bold text-primary mb-2">1-3 мин</div>
                  <div className="text-sm text-muted-foreground">Среднее время исполнения</div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}