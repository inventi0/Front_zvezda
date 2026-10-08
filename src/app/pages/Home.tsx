import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import kubikImage from '@/app/assets/element/kubik.svg?url';
import fonVerhImage from '@/app/assets/images/фон_верх01.png?url';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, Filter } from 'lucide-react';
import Header from '@/app/components/Header';
import Footer from '@/app/components/Footer';
import { Button } from '@/app/components/ui/button';
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
import {
  getQuickCheckoutProducts,
  supportsCustomQuickCheckoutAmount,
} from '@/app/domain/quickCheckout';
import { useProducts } from '@/app/hooks/useProducts';
import type { ProductCategory } from '@/app/types';
import { quickCheckoutSchema } from '@/app/utils/schemas';
import { getProductImage, getProductLogo } from '@/app/utils/productAssets';
import { toast } from 'sonner';
import { cn } from '@/app/components/ui/utils';
import {
  calculateOrderTotal,
  computeCustomPrice,
  formatPrice,
  getCustomAmountLimits,
} from '@/app/utils/orderCalculation';
import { storeCheckoutData } from '@/app/utils/checkoutStorage';

export default function HomePage() {
  const navigate = useNavigate();
  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedAmount, setSelectedAmount] = useState('');
  const [customAmount, setCustomAmount] = useState('');
  const [accountId, setAccountId] = useState('');
  const [errors, setErrors] = useState<{ accountId?: string; amount?: string }>({});
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

  const quickCheckoutProducts = useMemo(() => getQuickCheckoutProducts(allProducts), [allProducts]);

  const product = useMemo(() => {
    return quickCheckoutProducts.find((item) => item.id === selectedProduct);
  }, [quickCheckoutProducts, selectedProduct]);
  const allowCustomAmount = supportsCustomQuickCheckoutAmount(product);

  useEffect(() => {
    if (productsLoading) return;

    const selectedIsAvailable = quickCheckoutProducts.some((item) => item.id === selectedProduct);
    if (selectedIsAvailable) return;

    setSelectedProduct(quickCheckoutProducts[0]?.id ?? '');
    setSelectedAmount('');
    setCustomAmount('');
    setAccountId('');
    setErrors({});
  }, [productsLoading, quickCheckoutProducts, selectedProduct]);

  const catalogCategories = useMemo(() => {
    const cats: ProductCategory[] = ['games', 'subscriptions', 'wallet', 'services'];
    return [
      { value: 'all' as const, label: 'Все товары', count: allProducts.length },
      ...cats.map((c) => ({
        value: c,
        label:
          c === 'games'
            ? 'Игры'
            : c === 'subscriptions'
              ? 'Подписки'
              : c === 'wallet'
                ? 'Подарочные карты'
                : 'Сервисы',
        count: allProducts.filter((p) => p.category === c).length,
      })),
    ];
  }, [allProducts]);

  const filteredCatalog = useMemo(() => {
    const minimumPrice = (item: (typeof allProducts)[number]) =>
      item.denominations.length
        ? Math.min(...item.denominations.map((denomination) => denomination.price))
        : 0;
    let list =
      catalogCategory === 'all'
        ? [...allProducts]
        : allProducts.filter((p) => p.category === catalogCategory);
    if (catalogSort === 'popular') {
      list = [...list].sort((a, b) => (b.popular ? 1 : 0) - (a.popular ? 1 : 0));
    } else if (catalogSort === 'price-asc') {
      list = [...list].sort((a, b) => minimumPrice(a) - minimumPrice(b));
    } else {
      list = [...list].sort((a, b) => minimumPrice(b) - minimumPrice(a));
    }
    return list;
  }, [allProducts, catalogCategory, catalogSort]);

  const handleProductChange = useCallback(
    (value: string) => {
      if (value === selectedProduct) return;
      setSelectedProduct(value);
      setSelectedAmount('');
      setCustomAmount('');
      setAccountId('');
      setErrors((prev) => ({ ...prev, accountId: undefined, amount: undefined }));
    },
    [selectedProduct]
  );

  const handleAmountSelect = useCallback((value: string) => {
    setSelectedAmount((current) => (current === value ? '' : value));
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
    const useCustom = allowCustomAmount && customAmount.trim() !== '';
    const customNum = useCustom ? parseInt(customAmount.replace(/\D/g, ''), 10) : 0;
    const validCustom =
      useCustom && !Number.isNaN(customNum) && customNum >= min && customNum <= max;

    const schema = quickCheckoutSchema(product.type, false);
    const result = schema.safeParse({
      accountId: product.type === 'top-up' ? accountId : undefined,
      denominationId: validCustom ? 'custom' : selectedAmount,
    });

    if (!result.success) {
      const fieldErrors: { accountId?: string; amount?: string } = {};
      result.error.errors.forEach((err) => {
        const pathKey = err.path[0] as string;
        if (pathKey === 'denominationId') {
          if (!(useCustom && !validCustom)) fieldErrors.amount = err.message;
        } else if (pathKey === 'accountId' || pathKey === 'amount') {
          fieldErrors[pathKey] = err.message;
        }
      });
      if (useCustom && !validCustom && !fieldErrors.amount) {
        if (Number.isNaN(customNum)) fieldErrors.amount = 'Введите число';
        else if (customNum < min) {
          fieldErrors.amount = product.slug === 'telegram-stars' ? `От ${min} ★` : `От ${min} ₽`;
        } else fieldErrors.amount = 'Сумма превышает допустимую';
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
        accountId: result.data.accountId,
        customAmount: customNum,
        customPrice,
      });
    } else {
      const selectedDenom = product.denominations.find((d) => d.id === selectedAmount);
      if (!selectedDenom) {
        setErrors((e) => ({ ...e, amount: 'Выберите сумму или введите свою' }));
        toast.error('Выберите сумму или введите свою');
        return;
      }
      storeCheckoutData({
        productId: selectedProduct,
        denominationId: selectedAmount,
        accountId: result.data.accountId,
      });
    }

    toast.success('Переход к оформлению заказа...');
    navigate(`/checkout?productId=${selectedProduct}`);
  }, [
    accountId,
    allowCustomAmount,
    customAmount,
    navigate,
    product,
    selectedAmount,
    selectedProduct,
  ]);

  const { hasValidAmount, basePriceForSummary } = useMemo(() => {
    if (!product) return { hasValidAmount: false, basePriceForSummary: 0 };
    const { min, max } = getCustomAmountLimits(product);
    const denom = product.denominations.find((d) => d.id === selectedAmount);
    if (denom) return { hasValidAmount: true, basePriceForSummary: denom.price };
    const n = allowCustomAmount ? parseInt(customAmount.replace(/\D/g, ''), 10) : Number.NaN;
    const valid = !Number.isNaN(n) && n >= min && n <= max;
    return {
      hasValidAmount: valid,
      basePriceForSummary: valid ? computeCustomPrice(n, product) : 0,
    };
  }, [allowCustomAmount, customAmount, product, selectedAmount]);

  const quickCheckoutTotal = useMemo(
    () =>
      hasValidAmount && basePriceForSummary > 0
        ? calculateOrderTotal(basePriceForSummary).total
        : 0,
    [basePriceForSummary, hasValidAmount]
  );

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
        <div className="relative z-10 -mt-16 min-h-0 w-full overflow-visible pb-10 pt-32 sm:pb-12 sm:pt-36 md:pt-40 lg:pb-1 lg:pt-88 xl:pt-[28rem] 2xl:pt-[32rem]">
          <div className="container mx-auto max-w-7xl px-5 sm:px-8 md:px-10 lg:px-12 xl:px-16 relative overflow-visible z-10">
            {/* Зелёный блок — на адаптиве: кнопка слева (~1/3) + текст справа (~2/3); lg+: только текст, кубик absolute */}
            <div className="relative rounded-2xl overflow-hidden w-full flex bg-[#83A393] border border-border">
              {/* Адаптив: кнопка слева (чуть меньше фона, 10px отступ, 6px скругление), справа текст */}
              <div className="lg:hidden flex flex-1 flex-row min-h-0 items-stretch">
                <div className="w-1/3 min-w-[100px] max-w-[160px] shrink-0 p-2.5 flex items-stretch">
                  <button
                    type="button"
                    onClick={() =>
                      document
                        .getElementById('quick-checkout')
                        ?.scrollIntoView({ behavior: 'smooth' })
                    }
                    className="w-full flex items-center justify-center rounded-[6px] bg-[#274D31] text-white font-semibold text-xs sm:text-sm px-3 py-2.5 hover:bg-[#1e3d28] active:opacity-95 transition-colors"
                  >
                    Залить баланс
                  </button>
                </div>
                <div className="flex-1 flex flex-col justify-center items-start text-left px-4 sm:px-5 py-4 sm:py-5 min-w-0">
                  <h1 className="text-white font-bold leading-tight text-base sm:text-lg md:text-xl">
                    ЦИФРОВОЙ МАРКЕТПЛЕЙС
                    <br />
                    сервисов и внутриигровых товаров
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
                    ЦИФРОВОЙ МАРКЕТПЛЕЙС
                    <br />
                    сервисов и внутриигровых товаров
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
                <img src={kubikImage} alt="" className="w-full h-auto object-contain" />
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

        {/* Компактное быстрое пополнение: только поддерживаемые прямые услуги */}
        <section
          id="quick-checkout"
          className="container relative z-10 mx-auto max-w-7xl scroll-mt-24 px-4 pb-0 pt-8 sm:px-6 sm:pt-10 lg:px-8"
        >
          <div className="rounded-2xl border bg-card p-4 shadow-sm sm:p-5">
            <p className="text-sm text-muted-foreground">Пополнение сервисов</p>

            <div
              className="mt-1 flex gap-5 overflow-x-auto border-b"
              role="tablist"
              aria-label="Сервис пополнения"
            >
              {quickCheckoutProducts.map((item) => {
                const selected = selectedProduct === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    onClick={() => handleProductChange(item.id)}
                    className={cn(
                      'relative flex min-h-10 shrink-0 items-center gap-2 border-b-2 px-0.5 py-2 text-base font-semibold transition-colors',
                      selected
                        ? 'border-foreground text-foreground'
                        : 'border-transparent text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <img
                      src={item.logo || getProductLogo(item.slug)}
                      alt=""
                      className="h-5 w-5 shrink-0 object-contain"
                    />
                    <span>{item.slug === 'steam-wallet' ? 'Steam' : 'Telegram Stars'}</span>
                  </button>
                );
              })}
            </div>

            {productsLoading ? (
              <p className="py-6 text-sm text-muted-foreground">
                Загрузка доступных способов пополнения...
              </p>
            ) : product ? (
              <div className="grid gap-4 pt-4 lg:grid-cols-[minmax(250px,0.9fr)_minmax(310px,1.2fr)_minmax(220px,0.75fr)] lg:items-start">
                <fieldset className="min-w-0">
                  <legend className="h-5 text-sm font-medium leading-5">
                    {allowCustomAmount ? 'Сумма пополнения' : 'Количество звёзд'}
                  </legend>

                  {allowCustomAmount ? (
                    <div className="relative mt-2">
                      <Input
                        id="quick-custom-amount"
                        type="text"
                        inputMode="numeric"
                        placeholder={
                          product.slug === 'telegram-stars'
                            ? `Количество от ${getCustomAmountLimits(product).min}`
                            : `Своя сумма от ${getCustomAmountLimits(product).min}`
                        }
                        value={customAmount}
                        onChange={(event) => handleCustomAmountChange(event.target.value)}
                        className="h-11 bg-muted/40 pr-10"
                        aria-invalid={Boolean(errors.amount)}
                      />
                      <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted-foreground">
                        {product.slug === 'telegram-stars' ? '★' : '₽'}
                      </span>
                    </div>
                  ) : null}

                  <div className="mt-3 flex flex-wrap gap-2">
                    {product.denominations.map((denomination) => {
                      const selected = selectedAmount === denomination.id;
                      return (
                        <button
                          key={denomination.id}
                          type="button"
                          aria-pressed={selected}
                          onClick={() => handleAmountSelect(denomination.id)}
                          className={cn(
                            'min-h-9 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
                            selected
                              ? 'border-primary bg-primary text-primary-foreground'
                              : 'bg-background hover:border-primary/40 hover:bg-muted/40'
                          )}
                        >
                          {denomination.currency === 'Stars'
                            ? `${denomination.amount.toLocaleString('ru-RU')} ★`
                            : formatPrice(denomination.amount)}
                        </button>
                      );
                    })}
                  </div>
                  {errors.amount ? (
                    <p className="mt-2 text-xs text-destructive">{errors.amount}</p>
                  ) : null}
                </fieldset>

                <div className="min-w-0">
                  <Label htmlFor="quick-account-id" className="h-5 leading-5">
                    {product.slug === 'telegram-stars'
                      ? 'Имя пользователя Telegram'
                      : 'Steam ID или имя аккаунта'}
                  </Label>
                  <Input
                    id="quick-account-id"
                    value={accountId}
                    onChange={(event) => {
                      setAccountId(event.target.value);
                      setErrors((current) => ({ ...current, accountId: undefined }));
                    }}
                    placeholder={product.slug === 'telegram-stars' ? 'username' : 'steamuser123'}
                    className="mt-2 h-11 bg-muted/40"
                    aria-invalid={Boolean(errors.accountId)}
                  />
                  <p className="mt-2 text-xs text-muted-foreground">
                    {product.slug === 'telegram-stars'
                      ? 'Укажите username без символа @.'
                      : 'Данные можно проверить в профиле Steam.'}
                  </p>
                  {errors.accountId ? (
                    <p className="mt-2 text-xs text-destructive">{errors.accountId}</p>
                  ) : null}
                </div>

                <div className="lg:pt-7">
                  <Button
                    className="h-11 w-full"
                    onClick={handleQuickCheckout}
                    disabled={!hasValidAmount || !accountId}
                  >
                    {hasValidAmount
                      ? `К оформлению · ${formatPrice(quickCheckoutTotal)}`
                      : 'Выберите сумму'}
                  </Button>
                </div>
              </div>
            ) : (
              <p className="py-6 text-sm text-muted-foreground">
                Сейчас быстрое пополнение временно недоступно.
              </p>
            )}
          </div>
        </section>

        {/* Каталог — категории, фильтр, сетка товаров */}
        <section
          id="catalog"
          className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 pb-12 sm:pb-16 md:pb-20 relative z-10"
        >
          <h2 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6">Каталог</h2>

          {/* Категории и сортировка */}
          <div className="mb-6 sm:mb-8 space-y-3 sm:space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:items-center sm:justify-between">
              {/* Категории — табы (десктоп) */}
              <div className="hidden md:block overflow-x-auto">
                <Tabs
                  value={catalogCategory}
                  onValueChange={(v) => setCatalogCategory(v as ProductCategory | 'all')}
                >
                  <TabsList className="grid grid-cols-5 w-full min-w-max">
                    {catalogCategories.map((cat) => (
                      <TabsTrigger
                        key={cat.value}
                        value={cat.value}
                        className="text-xs sm:text-sm whitespace-nowrap"
                      >
                        {cat.label}
                        <span className="ml-1.5 text-xs text-muted-foreground">({cat.count})</span>
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
              </div>
              {/* Категории — селект (мобильный) */}
              <div className="md:hidden">
                <Select
                  value={catalogCategory}
                  onValueChange={(v) => setCatalogCategory(v as ProductCategory | 'all')}
                >
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
              <Select
                value={catalogSort}
                onValueChange={(v) => setCatalogSort(v as 'popular' | 'price-asc' | 'price-desc')}
              >
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
              <Button
                variant="outline"
                onClick={() => {
                  setCatalogCategory('all');
                  setCatalogSort('popular');
                }}
              >
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
                  image={p.image || getProductImage(p.slug)}
                  logo={p.logo || getProductLogo(p.slug)}
                  price={
                    p.denominations.length
                      ? Math.min(...p.denominations.map((item) => item.price))
                      : 0
                  }
                  fulfillment={p.fulfillment}
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
