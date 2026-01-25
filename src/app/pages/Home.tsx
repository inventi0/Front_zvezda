import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import kubikImage from '@/app/assets/element/kubik.svg?url';
import fonVerhImage from '@/app/assets/images/фон_верх01.png?url';
import { useNavigate } from 'react-router-dom';
import { Star, CreditCard, ClipboardList, Clock, Filter, ChevronDown } from 'lucide-react';
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
import { Tabs, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { ProductCard } from '@/app/components/ui/product-card';
import { useProducts } from '@/app/hooks/useProducts';
import type { ProductCategory } from '@/app/types';
import { quickCheckoutSchema } from '@/app/utils/schemas';
import { getProductImage, getProductLogo } from '@/app/utils/productAssets';
import { toast } from 'sonner';
import { cn } from '@/app/components/ui/utils';
import { calculateOrderTotal, getCustomAmountLimits, computeCustomPrice } from '@/app/utils/orderCalculation';
import { storeCheckoutData } from '@/app/utils/checkoutStorage';

export default function HomePage() {
  const navigate = useNavigate();
  const [selectedProduct, setSelectedProduct] = useState('1');
  const [selectedAmount, setSelectedAmount] = useState('');
  const [customAmount, setCustomAmount] = useState('');
  const [accountId, setAccountId] = useState('');
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<{ email?: string; accountId?: string; amount?: string }>({});
  const [catalogCategory, setCatalogCategory] = useState<ProductCategory | 'all'>('all');
  const [catalogSort, setCatalogSort] = useState<'popular' | 'price-asc' | 'price-desc'>('popular');
  const [balanceBtnBounce, setBalanceBtnBounce] = useState(false);
  const balanceIdleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { products: allProducts, loading: productsLoading } = useProducts();

  const resetBalanceIdle = useCallback(() => {
    setBalanceBtnBounce(false);
    if (balanceIdleTimerRef.current) {
      clearTimeout(balanceIdleTimerRef.current);
      balanceIdleTimerRef.current = null;
    }
    balanceIdleTimerRef.current = setTimeout(() => setBalanceBtnBounce(true), 3500);
  }, []);

  useEffect(() => {
    const onScroll = () => resetBalanceIdle();
    window.addEventListener('scroll', onScroll, { passive: true });
    resetBalanceIdle();
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (balanceIdleTimerRef.current) clearTimeout(balanceIdleTimerRef.current);
    };
  }, [resetBalanceIdle]);

  useEffect(() => {
    if (window.location.hash !== '#catalog') return;
    requestAnimationFrame(() => {
      document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' });
    });
  }, []);

  const { products: popularProducts } = useProducts({ popular: true });

  const product = useMemo(() => {
    const found = allProducts.find(p => p.id === selectedProduct);
    // Fallback to first product if selected not found
    if (!found && allProducts.length > 0 && !productsLoading) {
      return allProducts[0];
    }
    return found;
  }, [allProducts, selectedProduct, productsLoading]);

  const catalogCategories = useMemo(() => {
    const cats: ProductCategory[] = ['games', 'subscriptions', 'wallet', 'services'];
    return [
      { value: 'all' as const, label: 'Все товары', count: allProducts.length },
      ...cats.map((c) => ({
        value: c,
        label: c === 'games' ? 'Игры' : c === 'subscriptions' ? 'Подписки' : c === 'wallet' ? 'Подарочные карты' : 'Сервисы',
        count: allProducts.filter((p) => p.category === c).length,
      })),
    ];
  }, [allProducts]);

  const filteredCatalog = useMemo(() => {
    let list = catalogCategory === 'all'
      ? [...allProducts]
      : allProducts.filter((p) => p.category === catalogCategory);
    if (catalogSort === 'popular') {
      list = [...list].sort((a, b) => (b.popular ? 1 : 0) - (a.popular ? 1 : 0));
    } else if (catalogSort === 'price-asc') {
      list = [...list].sort((a, b) => (a.denominations[0]?.price ?? 0) - (b.denominations[0]?.price ?? 0));
    } else {
      list = [...list].sort((a, b) => (b.denominations[0]?.price ?? 0) - (a.denominations[0]?.price ?? 0));
    }
    return list;
  }, [allProducts, catalogCategory, catalogSort]);

  const handleProductChange = useCallback((value: string) => {
    setSelectedProduct(value);
    setSelectedAmount('');
    setCustomAmount('');
    setErrors((prev) => ({ ...prev, amount: undefined }));
  }, []);

  const handleAmountSelect = useCallback((value: string) => {
    setSelectedAmount(value);
    setCustomAmount('');
    setErrors((prev) => ({ ...prev, amount: undefined }));
  }, []);

  const handleCustomAmountChange = useCallback((value: string) => {
    let v = value.replace(/\D/g, '');
    const { max } = getCustomAmountLimits();
    const n = parseInt(v, 10);
    if (!Number.isNaN(n) && n > max) v = String(max);
    setCustomAmount(v);
    if (v) setSelectedAmount('');
    setErrors((prev) => ({ ...prev, amount: undefined }));
  }, []);

  const handleQuickCheckout = useCallback(() => {
    if (!product) {
      toast.error('Товар не найден');
      return;
    }

    const { min, max } = getCustomAmountLimits(product);
    const useCustom = customAmount.trim() !== '';
    const customNum = useCustom ? parseInt(customAmount.replace(/\D/g, ''), 10) : 0;
    const validCustom = useCustom && !Number.isNaN(customNum) && customNum >= min && customNum <= max;

    const schema = quickCheckoutSchema(product.type);
    const result = schema.safeParse({
      email,
      accountId: product.type === 'top-up' ? accountId : undefined,
      denominationId: validCustom ? 'custom' : selectedAmount,
    });

    if (!result.success) {
      const fieldErrors: { email?: string; accountId?: string; amount?: string } = {};
      result.error.errors.forEach((err) => {
        const pathKey = err.path[0] as string;
        if (pathKey === 'denominationId') {
          if (!(useCustom && !validCustom)) fieldErrors.amount = err.message;
        } else if (pathKey === 'email' || pathKey === 'accountId' || pathKey === 'amount') {
          fieldErrors[pathKey] = err.message;
        }
      });
      if (useCustom && !validCustom && !fieldErrors.amount) {
        if (Number.isNaN(customNum)) fieldErrors.amount = 'Введите число';
        else if (customNum < min) fieldErrors.amount = `От ${min} ₽`;
        else fieldErrors.amount = 'Сумма превышает допустимую';
      }
      setErrors(fieldErrors);
      toast.error('Пожалуйста, исправьте ошибки в форме');
      return;
    }

    if (validCustom) {
      const customPrice = computeCustomPrice(customNum, product);
      storeCheckoutData({
        productId: selectedProduct,
        denominationId: 'custom',
        email: result.data.email,
        accountId: result.data.accountId,
        customAmount: customNum,
        customPrice,
      });
    } else {
      const selectedDenom = product.denominations.find(d => d.id === selectedAmount);
      if (!selectedDenom) {
        setErrors((e) => ({ ...e, amount: 'Выберите сумму или введите свою' }));
        toast.error('Выберите сумму или введите свою');
        return;
      }
      storeCheckoutData({
        productId: selectedProduct,
        denominationId: selectedAmount,
        email: result.data.email,
        accountId: result.data.accountId,
      });
    }

    toast.success('Переход к оформлению заказа...');
    navigate(`/checkout?productId=${selectedProduct}`);
  }, [email, selectedAmount, customAmount, product, accountId, selectedProduct, navigate]);

  const { hasValidAmount, basePriceForSummary } = useMemo(() => {
    if (!product) return { hasValidAmount: false, basePriceForSummary: 0 };
    const { min, max } = getCustomAmountLimits(product);
    const denom = product.denominations.find((d) => d.id === selectedAmount);
    if (denom) return { hasValidAmount: true, basePriceForSummary: denom.price };
    const n = parseInt(customAmount.replace(/\D/g, ''), 10);
    const valid = !Number.isNaN(n) && n >= min && n <= max;
    return {
      hasValidAmount: valid,
      basePriceForSummary: valid ? computeCustomPrice(n, product) : 0,
    };
  }, [product, selectedAmount, customAmount]);

  return (
    <div className="flex flex-col min-h-screen relative bg-background">
      {/* Фон верх: от самого верха (под хедером без прогала), плавный переход внизу — без резкого белого обрыва */}
      <div
        className="absolute top-0 left-0 right-0 w-full min-h-[85vh] z-0"
        style={{
          background: `
            linear-gradient(to bottom, transparent 55%, rgba(241,243,242,0.4) 75%, #f1f3f2 85%, #ffffff 100%),
            url(${fonVerhImage}) no-repeat top center / 100% auto
          `,
          backgroundColor: '#f1f3f2',
        }}
        aria-hidden
      />
      <Header />
      <main className="flex-1 relative overflow-x-hidden min-h-screen z-10">

        {/* Hero: зелёный фон по высоте текста; кубик absolute, те же размеры, выходит за границы зелёного */}
        <div className="w-full overflow-visible relative z-10 -mt-[calc(0.5rem+3.5rem)] sm:-mt-[calc(0.5rem+4rem)] min-h-0 pt-32 sm:pt-36 md:pt-40 lg:pt-88 xl:pt-[28rem] 2xl:pt-[32rem] pb-10 sm:pb-12 lg:pb-1">
          <div className="container mx-auto max-w-7xl px-5 sm:px-8 md:px-10 lg:px-12 xl:px-16 relative overflow-visible z-10">
            {/* Зелёный блок — на адаптиве: кнопка слева (~1/3) + текст справа (~2/3); lg+: только текст, кубик absolute */}
            <div className="relative rounded-2xl overflow-hidden w-full flex bg-[#83A393] border border-border">
              {/* Адаптив: кнопка слева (чуть меньше фона, 10px отступ, 6px скругление), справа текст */}
              <div className="lg:hidden flex flex-1 flex-row min-h-0 items-stretch">
                <div className="w-1/3 min-w-[100px] max-w-[160px] shrink-0 p-2.5 flex items-stretch">
                  <button
                    type="button"
                    onClick={() => document.getElementById('quick-checkout')?.scrollIntoView({ behavior: 'smooth' })}
                    className="w-full flex items-center justify-center rounded-[6px] bg-[#274D31] text-white font-semibold text-xs sm:text-sm px-3 py-2.5 hover:bg-[#1e3d28] active:opacity-95 transition-colors"
                  >
                    Залить баланс
                  </button>
                </div>
                <div className="flex-1 flex flex-col justify-center items-start text-left px-4 sm:px-5 py-4 sm:py-5 min-w-0">
                  <h1 className="text-white font-bold leading-tight text-base sm:text-lg md:text-xl">
                    ЦИФРОВОЙ МАРКЕТПЛЕЙС<br />сервисов и внутриигровых товаров
                  </h1>
                  <p className="text-white/95 text-xs sm:text-sm md:text-base mt-1 sm:mt-2">
                    Мы уже готовы пополнить твой Steam по выгодному курсу
                  </p>
                </div>
              </div>
              {/* Десктоп: только текст справа, высота по тексту */}
              <div className="hidden lg:flex flex-1 justify-end">
                <div className="relative flex flex-col items-stretch text-right px-6 md:px-8 lg:px-10 xl:px-12 lg:pl-[38%] py-4 sm:py-5 md:py-6">
                  <h1 className="text-white font-bold leading-tight text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl 2xl:text-[2.25rem]">
                    ЦИФРОВОЙ МАРКЕТПЛЕЙС<br />сервисов и внутриигровых товаров
                  </h1>
                  <p className="text-white/95 text-xs sm:text-sm md:text-base lg:text-lg mt-1 sm:mt-2">
                    Мы уже готовы пополнить твой Steam по выгодному курсу
                  </p>
                </div>
              </div>
            </div>
            {/* Kubik: только lg+; лёгкая левитация */}
            <div className="absolute left-6 sm:left-10 md:left-14 lg:left-20 xl:left-24 top-1/2 -translate-y-1/2 hidden lg:flex items-center justify-center lg:justify-start pointer-events-none overflow-visible">
              <motion.div
                className="w-full max-w-[160px] sm:max-w-[200px] md:max-w-[260px] lg:max-w-[340px] xl:max-w-[420px]"
                animate={{ y: [0, -10, 0] }}
                transition={{
                  duration: 2.8,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              >
                <img
                  src={kubikImage}
                  alt=""
                  className="w-full h-auto object-contain"
                />
              </motion.div>
            </div>
          </div>
        </div>

        {/* Кнопка «Залить баланс» под героем — только lg+; стрелка вниз; подпрыгивает при простое */}
        <div className="hidden lg:flex container mx-auto max-w-7xl px-5 sm:px-8 md:px-10 lg:px-12 xl:px-16 justify-center -mt-2 sm:-mt-3 lg:mt-6 relative z-10">
          <motion.div
            onMouseEnter={resetBalanceIdle}
            onFocus={resetBalanceIdle}
            animate={balanceBtnBounce ? { y: [0, -6, 0] } : { y: 0 }}
            transition={
              balanceBtnBounce
                ? { duration: 0.7, repeat: Infinity, ease: 'easeOut' }
                : { duration: 0.2 }
            }
          >
            <Button
              size="lg"
              className="flex items-center gap-2"
              onClick={() => {
                document.getElementById('quick-checkout')?.scrollIntoView({ behavior: 'smooth' });
                resetBalanceIdle();
              }}
            >
              Залить баланс
              <ChevronDown className="h-5 w-5" />
            </Button>
          </motion.div>
        </div>

        {/* Секция: bento «Инструкция» слева, форма быстрого пополнения справа */}
        <section id="quick-checkout" className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12 md:pt-6 lg:pt-10 pb-0 relative z-10 scroll-mt-24">
          <div className="grid lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-10 items-start">
            {/* Слева — bento «Инструкция» (как на референсе) */}
            <div className="order-2 lg:order-1 mt-4 sm:mt-8 lg:mt-16">
              <div
                className={cn(
                  'relative grid grid-cols-2 gap-2 sm:gap-3 rounded-2xl p-2 sm:p-3 transition-resize',
                  'bg-muted/30 border border-border',
                  'min-h-[280px] sm:min-h-[320px]'
                )}
              >
                <h2 className="col-span-2 text-xl sm:text-2xl font-bold px-2 sm:px-3 pt-1 pb-1 sm:pb-2">
                  Инструкция
                </h2>
                {/* Шаг 1 — высокая левая карточка (как Real-time Analytics) */}
                <div
                  className={cn(
                    'col-span-1 row-span-2 flex flex-col rounded-xl sm:rounded-2xl p-4 sm:p-5',
                    'bg-card/95 border border-border shadow-sm',
                    'hover:border-primary/20 hover:shadow-md transition-all duration-300 ease-out'
                  )}
                >
                  <div className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl bg-primary/15 overflow-hidden mb-3 sm:mb-4">
                    {product ? (
                      <img
                        src={getProductLogo(product.slug)}
                        alt=""
                        className="h-6 w-6 sm:h-8 sm:w-8 object-contain"
                      />
                    ) : (
                      <span className="text-primary font-bold text-lg sm:text-xl">1</span>
                    )}
                  </div>
                  <h3 className="font-bold text-base sm:text-lg text-foreground mb-1.5">
                    Узнайте ID или имя аккаунта
                  </h3>
                  {(() => {
                    const isTopUp = product?.type === 'top-up';
                    const hasHint = isTopUp && !!product?.instructions;
                    const isNoId = product && !isTopUp;
                    // Параграф только если нет товара — подсказка всегда в блоке
                    if (hasHint || isNoId || (product && isTopUp)) return null;
                    return (
                      <p className="text-xs sm:text-sm text-muted-foreground leading-snug flex-1">
                        Выберите товар в форме справа — здесь появится подсказка для вашей платформы.
                      </p>
                    );
                  })()}
                  <div
                    className={cn(
                      'mt-3 sm:mt-4 min-h-12 sm:min-h-14 rounded-lg bg-muted/50 border border-dashed border-border flex items-center justify-center px-3 py-2 sm:px-4 sm:py-3 transition-resize',
                      product ? 'flex-1 min-h-0' : undefined
                    )}
                  >
                    <span className="text-[10px] sm:text-xs text-muted-foreground text-center leading-snug">
                      {product?.type === 'top-up' && product?.instructions
                        ? <>Подсказка: {product.instructions}</>
                        : product && product.type !== 'top-up'
                          ? 'ID аккаунта не требуется. Только email и номинал.'
                          : product?.type === 'top-up'
                            ? 'Подсказка: ID обычно в настройках аккаунта или в профиле игры. Укажите его в форме справа.'
                            : 'Выберите товар справа → подсказка появится здесь'}
                    </span>
                  </div>
                </div>

                {/* Шаг 2 — средняя карточка справа сверху (как Global CDN) */}
                <div
                  className={cn(
                    'rounded-xl sm:rounded-2xl p-3 sm:p-4 flex flex-col',
                    'bg-card/95 border border-border shadow-sm',
                    'hover:border-primary/20 hover:shadow-md transition-all duration-300 ease-out'
                  )}
                >
                  <div className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary mb-2">
                    <ClipboardList className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
                  </div>
                  <h3 className="font-bold text-sm sm:text-base text-foreground mb-1">
                    Заполните форму
                  </h3>
                  <p className="text-xs text-muted-foreground leading-snug">
                    {product?.type === 'top-up'
                      ? 'Укажите ID аккаунта, сумму пополнения и email.'
                      : product && (product.type === 'voucher' || product.type === 'gift-card')
                        ? 'Укажите email и выберите номинал.'
                        : 'Выберите товар справа, затем заполните форму.'}
                  </p>
                </div>

                {/* Шаг 3 — средняя карточка справа снизу (как Secure Auth) */}
                <div
                  className={cn(
                    'rounded-xl sm:rounded-2xl p-3 sm:p-4 flex flex-col',
                    'bg-card/95 border border-border shadow-sm',
                    'hover:border-primary/20 hover:shadow-md transition-all duration-300 ease-out'
                  )}
                >
                  <div className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary mb-2">
                    <CreditCard className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
                  </div>
                  <h3 className="font-bold text-sm sm:text-base text-foreground mb-1">
                    Оплатите картой или СБП
                  </h3>
                  <p className="text-xs text-muted-foreground leading-snug">
                    Мы зачислим средства на ваш баланс практически сразу.
                  </p>
                </div>

                {/* Нижняя полоска на всю ширину */}
                <div
                  className={cn(
                    'col-span-2 rounded-xl sm:rounded-2xl px-4 py-3 sm:px-5 sm:py-3.5 transition-resize',
                    'bg-card/95 border border-border',
                    'flex items-center justify-center gap-3 sm:gap-4 flex-wrap'
                  )}
                >
                  <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground">
                    <Star className="h-4 w-4 text-primary" />
                    Без регистрации
                  </span>
                  <span className="text-border">|</span>
                  <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground">
                    <Clock className="h-4 w-4 text-primary" />
                    Поддержка 24/7
                  </span>
                </div>
              </div>
            </div>

            {/* Справа — быстрое пополнение */}
            <div className="order-1 lg:order-2 mt-4 sm:mt-8 lg:mt-16">
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
                      <SelectTrigger id="product" className="ring-1 ring-primary/10">
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

                  {/* Amount Selection — плавное появление/скрытие */}
                  <div
                    className={cn(
                      "overflow-hidden transition-all duration-300 ease-out",
                      product ? "max-h-64 opacity-100 p-1" : "max-h-0 opacity-0"
                    )}
                  >
                    {product && (
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <Label htmlFor="amount">Сумма</Label>
                          <Select value={selectedAmount} onValueChange={handleAmountSelect}>
                            <SelectTrigger id="amount" className="ring-1 ring-primary/10">
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
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="customAmount">Или введите свою сумму</Label>
                          <Input
                            id="customAmount"
                            type="text"
                            inputMode="numeric"
                            placeholder={`От ${getCustomAmountLimits(product).min} ₽`}
                            value={customAmount}
                            onChange={(e) => handleCustomAmountChange(e.target.value)}
                            className="bg-muted/20 ring-1 ring-border border-border"
                            aria-invalid={!!errors.amount}
                          />
                        </div>
                        {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount}</p>}
                      </div>
                    )}
                  </div>

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
                        "bg-muted/20 ring-1 ring-border border-border",
                        product?.type !== 'top-up' && "opacity-60 cursor-not-allowed"
                      )}
                      disabled={product?.type !== 'top-up'}
                      aria-invalid={!!errors.accountId}
                    />
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
                      className="bg-muted/20 ring-1 ring-border border-border"
                      aria-invalid={!!errors.email}
                    />
                    {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                  </div>

                  {/* Price Summary (плавное появление/скрытие) */}
                  <div
                    className={cn(
                      "overflow-hidden transition-all duration-300 ease-out",
                      hasValidAmount && product
                        ? "max-h-40 opacity-100 mt-4"
                        : "max-h-0 opacity-0 mt-0",
                    )}
                  >
                    {hasValidAmount && product && basePriceForSummary > 0 && (
                      <div className="pt-4 border-t space-y-2">
                        {(() => {
                          const {
                            commission,
                            total,
                            commissionPercent,
                          } = calculateOrderTotal(basePriceForSummary);
                          return (
                            <>
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Сумма</span>
                                <span>{basePriceForSummary} ₽</span>
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
                    disabled={!hasValidAmount || !email || (product?.type === 'top-up' && !accountId)}
                  >
                    Оплатить
                  </Button>
                </div>
              </CardContent>
            </Card>
            </div>
          </div>
        </section>

        {/* Каталог — категории, фильтр, сетка товаров */}
        <section id="catalog" className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 pb-12 sm:pb-16 md:pb-20 relative z-10">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6">Каталог</h2>

          {/* Категории и сортировка */}
          <div className="mb-6 sm:mb-8 space-y-3 sm:space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:items-center sm:justify-between">
              {/* Категории — табы (десктоп) */}
              <div className="hidden md:block overflow-x-auto">
                <Tabs value={catalogCategory} onValueChange={(v) => setCatalogCategory(v as ProductCategory | 'all')}>
                  <TabsList className="grid grid-cols-5 w-full min-w-max">
                    {catalogCategories.map((cat) => (
                      <TabsTrigger key={cat.value} value={cat.value} className="text-xs sm:text-sm whitespace-nowrap">
                        {cat.label}
                        <span className="ml-1.5 text-xs text-muted-foreground">({cat.count})</span>
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
              </div>
              {/* Категории — селект (мобильный) */}
              <div className="md:hidden">
                <Select value={catalogCategory} onValueChange={(v) => setCatalogCategory(v as ProductCategory | 'all')}>
                  <SelectTrigger>
                    <SelectValue placeholder="Категория" />
                  </SelectTrigger>
                  <SelectContent>
                    {catalogCategories.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label} ({cat.count})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {/* Сортировка */}
              <Select value={catalogSort} onValueChange={(v) => setCatalogSort(v as 'popular' | 'price-asc' | 'price-desc')}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <Filter className="h-4 w-4 mr-2 shrink-0" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="popular">Популярные</SelectItem>
                  <SelectItem value="price-asc">Цена: по возрастанию</SelectItem>
                  <SelectItem value="price-desc">Цена: по убыванию</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {productsLoading ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground">Загрузка товаров...</p>
            </div>
          ) : filteredCatalog.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground mb-4">Товары не найдены</p>
              <Button variant="outline" onClick={() => { setCatalogCategory('all'); setCatalogSort('popular'); }}>
                Сбросить фильтры
              </Button>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 lg:gap-6">
              {filteredCatalog.map((p) => (
                <ProductCard
                  key={p.id}
                  id={p.id}
                  slug={p.slug}
                  name={p.name}
                  image={getProductImage(p.slug)}
                  logo={getProductLogo(p.slug)}
                  price={p.denominations[0]?.price || 0}
                  deliveryTimeText={p.deliveryTimeText}
                  deliverySpeed={p.deliverySpeed}
                  popular={p.popular}
                  enableAnimations={true}
                  rating={p.rating}
                  reviewsCount={p.reviewsCount}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}