import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
  AlertCircle,
  ArrowLeft,
  Check,
  CheckCircle2,
  Clock3,
  Info,
  Mail,
  MessageSquare,
  ShieldCheck,
  Star,
} from 'lucide-react';
import Header from '@/app/components/Header';
import Footer from '@/app/components/Footer';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/app/components/ui/accordion';
import { Alert, AlertDescription } from '@/app/components/ui/alert';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent } from '@/app/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/app/components/ui/dialog';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { ScrollArea } from '@/app/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import { cn } from '@/app/components/ui/utils';
import {
  getDeliveryEstimateDescription,
  getFulfillmentChannelLabel,
  getFulfillmentTypeLabel,
} from '@/app/domain/productFulfillment';
import {
  getCustomerOptionCopy,
  getDenominationsForOption,
  resolveProductSelection,
  toggleSelection,
} from '@/app/domain/productSelection';
import { getAccountFieldCopy, getProductPurchaseMode } from '@/app/domain/productPurchase';
import { getReviewsByProductId } from '@/app/data/mockData';
import { useProduct } from '@/app/hooks/useProducts';
import type { Denomination, Product } from '@/app/types';
import {
  calculateOrderTotal,
  computeCustomPrice,
  formatPrice,
  getCustomAmountLimits,
} from '@/app/utils/orderCalculation';
import { getProductLogo } from '@/app/utils/productAssets';
import { productCheckoutSchema } from '@/app/utils/schemas';
import { storeCheckoutData } from '@/app/utils/checkoutStorage';
import { toast } from 'sonner';

type FieldErrors = {
  accountId?: string;
  region?: string;
  server?: string;
  option?: string;
  amount?: string;
};

function ProductGallery({ product }: { product: Product }) {
  const fallbackLogo = product.logo || getProductLogo(product.slug);
  const media = useMemo(
    () =>
      Array.from(
        new Set(
          [product.productPageImage, ...(product.gallery ?? [])].filter((item): item is string =>
            Boolean(item)
          )
        )
      ),
    [product.gallery, product.productPageImage]
  );
  const visibleMedia = useMemo(
    () => (media.length ? media : [fallbackLogo]),
    [fallbackLogo, media]
  );
  const [activeImage, setActiveImage] = useState(visibleMedia[0]);

  useEffect(() => {
    setActiveImage(visibleMedia[0]);
  }, [visibleMedia]);

  const usesFallbackLogo = media.length === 0;

  return (
    <div className="min-w-0 space-y-3">
      <div className="flex aspect-[4/3] items-center justify-center overflow-hidden rounded-2xl border bg-muted/40">
        <img
          src={activeImage}
          alt={product.name}
          className={cn(
            'block h-full w-full',
            usesFallbackLogo ? 'object-contain p-10 sm:p-14' : 'object-cover'
          )}
          onError={(event) => {
            if (event.currentTarget.src !== fallbackLogo) event.currentTarget.src = fallbackLogo;
          }}
        />
      </div>
      {visibleMedia.length > 1 ? (
        <div className="grid grid-cols-5 gap-2" aria-label="Изображения товара">
          {visibleMedia.map((source, index) => (
            <button
              key={`${source}-${index}`}
              type="button"
              onClick={() => setActiveImage(source)}
              aria-label={`Показать изображение ${index + 1}`}
              aria-pressed={activeImage === source}
              className={cn(
                'aspect-[4/3] overflow-hidden rounded-lg border bg-muted/40 transition-colors',
                activeImage === source
                  ? 'border-primary ring-1 ring-primary'
                  : 'hover:border-foreground/30'
              )}
            >
              <img src={source} alt="" className="h-full w-full object-contain p-1.5" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function getDenominationTitle(denomination: Denomination): string {
  if (denomination.label) return denomination.label;
  return `${denomination.amount.toLocaleString('ru-RU')} ${denomination.currency}`.trim();
}

export default function ProductPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { product, loading, error } = useProduct(slug);
  const prefersReducedMotion = useReducedMotion();

  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedServer, setSelectedServer] = useState('');
  const [selectedOption, setSelectedOption] = useState('');
  const [selectedAmount, setSelectedAmount] = useState('');
  const [customAmount, setCustomAmount] = useState('');
  const [accountId, setAccountId] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const effectiveOptionId = selectedOption;
  const availableDenominations = useMemo(
    () => (product ? getDenominationsForOption(product, effectiveOptionId || undefined) : []),
    [effectiveOptionId, product]
  );
  const purchaseMode = useMemo(
    () => (product ? getProductPurchaseMode(product) : 'fixed-offer'),
    [product]
  );
  const accountFieldCopy = useMemo(
    () => (product ? getAccountFieldCopy(product) : null),
    [product]
  );
  const customAmountNumber = useMemo(() => {
    if (!product || purchaseMode !== 'custom-top-up' || !customAmount.trim()) return undefined;
    const value = Number.parseInt(customAmount.replace(/\D/g, ''), 10);
    const { min, max } = getCustomAmountLimits(product);
    return Number.isNaN(value) || value < min || value > max ? undefined : value;
  }, [customAmount, product, purchaseMode]);
  const selectedDenomination = useMemo(() => {
    const fixedDenomination = availableDenominations.find(
      (denomination) => denomination.id === selectedAmount
    );
    if (fixedDenomination) return fixedDenomination;
    if (!product || customAmountNumber == null) return undefined;

    return {
      id: 'custom',
      amount: customAmountNumber,
      currency: product.denominations[0]?.currency ?? 'RUB',
      price: computeCustomPrice(customAmountNumber, product),
    } satisfies Denomination;
  }, [availableDenominations, customAmountNumber, product, selectedAmount]);
  const selectedOptionDetails = useMemo(
    () => product?.options?.find((option) => option.id === effectiveOptionId),
    [effectiveOptionId, product]
  );
  const optionCounts = useMemo(() => {
    if (!product?.options) return new Map<string, number>();
    return new Map(
      product.options.map((option) => [
        option.id,
        getDenominationsForOption(product, option.id).length,
      ])
    );
  }, [product]);
  const customerOptionCopy = useMemo(
    () => getCustomerOptionCopy(product?.optionLabel),
    [product?.optionLabel]
  );

  useEffect(() => {
    if (
      selectedAmount &&
      !availableDenominations.some((denomination) => denomination.id === selectedAmount)
    ) {
      setSelectedAmount('');
    }
  }, [availableDenominations, selectedAmount]);

  const orderCalculation = useMemo(
    () => calculateOrderTotal(selectedDenomination?.price ?? 0),
    [selectedDenomination]
  );
  const productReviews = useMemo(
    () => (product ? getReviewsByProductId(product.id) : []),
    [product]
  );
  const displayedRating =
    product?.rating ??
    (productReviews.length
      ? productReviews.reduce((sum, review) => sum + review.rating, 0) / productReviews.length
      : undefined);

  const clearFieldError = useCallback((field: keyof FieldErrors) => {
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
  }, []);

  const handleOptionChange = useCallback((optionId: string) => {
    setSelectedOption((current) => toggleSelection(current, optionId));
    setSelectedAmount('');
    setCustomAmount('');
    setFieldErrors((current) => ({ ...current, option: undefined, amount: undefined }));
  }, []);

  const handleCustomAmountChange = useCallback(
    (value: string) => {
      if (!product) return;
      const { max } = getCustomAmountLimits(product);
      const digits = value.replace(/\D/g, '');
      const numericValue = Number.parseInt(digits, 10);
      setCustomAmount(!Number.isNaN(numericValue) && numericValue > max ? String(max) : digits);
      if (digits) setSelectedAmount('');
      clearFieldError('amount');
    },
    [clearFieldError, product]
  );

  const handleCheckout = useCallback(() => {
    if (!product) return;

    if (purchaseMode === 'custom-top-up' && customAmount && customAmountNumber == null) {
      const { min } = getCustomAmountLimits(product);
      const unit = product.slug === 'telegram-stars' ? '★' : '₽';
      const message = `Минимальное значение — ${min} ${unit}`;
      setFieldErrors((current) => ({ ...current, amount: message }));
      toast.error(message);
      return;
    }

    const schema = productCheckoutSchema(
      product.type,
      Boolean(product.regions?.length),
      Boolean(product.servers?.length),
      Boolean(product.options?.length),
      false
    );
    const result = schema.safeParse({
      accountId: product.type === 'top-up' ? accountId : undefined,
      denominationId: selectedDenomination?.id ?? '',
      region: selectedRegion || undefined,
      server: selectedServer || undefined,
      optionId: effectiveOptionId || undefined,
    });

    if (!result.success) {
      const nextErrors: FieldErrors = {};
      result.error.errors.forEach((validationError) => {
        const field = String(validationError.path[0]);
        if (field === 'denominationId') nextErrors.amount = validationError.message;
        else if (field === 'optionId') nextErrors.option = validationError.message;
        else if (field === 'accountId' || field === 'region' || field === 'server') {
          nextErrors[field] = validationError.message;
        }
      });
      setFieldErrors(nextErrors);
      toast.error(result.error.errors.map((validationError) => validationError.message).join('. '));
      return;
    }

    const isCustomAmount = result.data.denominationId === 'custom';
    if (!isCustomAmount) {
      try {
        resolveProductSelection(product, result.data.optionId, result.data.denominationId);
      } catch (selectionError) {
        const message =
          selectionError instanceof Error
            ? selectionError.message
            : 'Выбранная комбинация недоступна';
        setFieldErrors((current) => ({ ...current, amount: message }));
        toast.error(message);
        return;
      }
    }

    storeCheckoutData({
      productId: product.id,
      denominationId: result.data.denominationId,
      accountId: result.data.accountId,
      region: result.data.region,
      server: result.data.server,
      optionId: result.data.optionId,
      optionLabel: customerOptionCopy.label,
      optionValue: selectedOptionDetails?.label,
      ...(isCustomAmount && customAmountNumber != null && selectedDenomination
        ? { customAmount: customAmountNumber, customPrice: selectedDenomination.price }
        : {}),
    });
    navigate(`/checkout?productId=${product.id}`);
  }, [
    accountId,
    customAmount,
    customAmountNumber,
    customerOptionCopy.label,
    effectiveOptionId,
    navigate,
    product,
    purchaseMode,
    selectedDenomination,
    selectedOptionDetails,
    selectedRegion,
    selectedServer,
  ]);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex flex-1 items-center justify-center">
          <p className="text-muted-foreground">Загрузка товара...</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <h1 className="mb-4 text-4xl font-bold">Товар не найден</h1>
            <p className="mb-4 text-muted-foreground">{error || 'Товар не существует'}</p>
            <Button asChild>
              <Link to="/#catalog">Вернуться в каталог</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const hasOptions = Boolean(product.options?.length);
  const isCustomTopUp = purchaseMode === 'custom-top-up';
  const amountUnit = product.slug === 'telegram-stars' ? '★' : '₽';
  const purchaseTitle = isCustomTopUp
    ? product.slug === 'telegram-stars'
      ? 'Купить Telegram Stars'
      : 'Пополнить Steam'
    : hasOptions
      ? 'Выберите подходящий вариант'
      : 'Выберите номинал';
  const noAvailableOffers = hasOptions
    ? Boolean(effectiveOptionId) && availableDenominations.length === 0
    : availableDenominations.length === 0;

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <Link
            to="/#catalog"
            className="mb-5 inline-flex items-center text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Каталог
          </Link>

          <div className="mb-6 flex items-start gap-4 sm:mb-8">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-muted/30 p-2 sm:h-20 sm:w-20">
              <img
                src={product.logo || getProductLogo(product.slug)}
                alt=""
                className="block h-full w-full object-contain"
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <Badge variant="secondary">
                  {getFulfillmentTypeLabel(product.fulfillment.type)}
                </Badge>
                {product.popular ? <Badge>Популярное</Badge> : null}
              </div>
              <h1 className="max-w-4xl text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
                {product.name}
              </h1>
              <Dialog>
                <DialogTrigger asChild>
                  <button
                    type="button"
                    className="mt-2 flex w-fit items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <Star className="h-4 w-4 fill-warning text-warning" />
                    {displayedRating != null ? (
                      <span className="font-medium text-foreground">
                        {displayedRating.toFixed(1)}
                      </span>
                    ) : null}
                    <span>
                      {productReviews.length
                        ? `${productReviews.length} отзывов`
                        : 'Пока нет отзывов'}
                    </span>
                    <MessageSquare className="h-4 w-4" />
                  </button>
                </DialogTrigger>
                <DialogContent className="flex max-h-[80vh] max-w-lg flex-col">
                  <DialogHeader>
                    <DialogTitle>Отзывы о {product.name}</DialogTitle>
                    <DialogDescription>
                      {productReviews.length
                        ? `${productReviews.length} отзывов покупателей`
                        : 'Пока нет отзывов.'}
                    </DialogDescription>
                  </DialogHeader>
                  <ScrollArea className="min-h-0 flex-1 pr-4">
                    <div className="space-y-4">
                      {productReviews.length ? (
                        productReviews.map((review) => (
                          <div
                            key={review.id}
                            className="space-y-1 rounded-xl border bg-muted/30 p-4"
                          >
                            <div className="flex items-center gap-2">
                              <div className="flex gap-0.5">
                                {[1, 2, 3, 4, 5].map((value) => (
                                  <Star
                                    key={value}
                                    className={cn(
                                      'h-4 w-4',
                                      value <= review.rating
                                        ? 'fill-warning text-warning'
                                        : 'text-muted-foreground/40'
                                    )}
                                  />
                                ))}
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {new Date(review.createdAt).toLocaleDateString('ru-RU')}
                              </span>
                            </div>
                            <p className="text-sm">{review.text}</p>
                          </div>
                        ))
                      ) : (
                        <p className="py-4 text-sm text-muted-foreground">
                          Отзыв можно оставить после выполненного заказа.
                        </p>
                      )}
                    </div>
                  </ScrollArea>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(440px,1.1fr)] lg:gap-10">
            <div className="min-w-0 space-y-7">
              <ProductGallery product={product} />

              <dl className="grid gap-4 border-y py-5 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                <div className="flex gap-3">
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <div>
                    <dt className="text-sm font-semibold">Формат</dt>
                    <dd className="text-sm text-muted-foreground">
                      {getFulfillmentTypeLabel(product.fulfillment.type)}
                    </dd>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <div>
                    <dt className="text-sm font-semibold">Срок</dt>
                    <dd className="text-sm text-muted-foreground">
                      {getDeliveryEstimateDescription(product.fulfillment.estimate)}
                    </dd>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Mail className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <div>
                    <dt className="text-sm font-semibold">Получение</dt>
                    <dd className="text-sm text-muted-foreground">
                      {getFulfillmentChannelLabel(product.fulfillment.channel)}
                    </dd>
                  </div>
                </div>
              </dl>

              <section>
                <h2 className="text-2xl font-bold">О товаре</h2>
                <p className="mt-3 whitespace-pre-line leading-relaxed text-muted-foreground">
                  {product.description}
                </p>
              </section>

              {product.warnings?.length ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <ul className="list-disc space-y-1 pl-4">
                      {product.warnings.map((warning) => (
                        <li key={warning}>{warning}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              ) : null}

              {product.features?.length ? (
                <section className="border-t pt-6">
                  <h2 className="text-lg font-bold">Что важно</h2>
                  <ul className="mt-3 space-y-2.5">
                    {product.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2.5 text-sm">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              {product.instructions ? (
                <section className="border-t pt-6">
                  <h2 className="text-lg font-bold">Как использовать</h2>
                  <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                    {product.instructions}
                  </p>
                </section>
              ) : null}

              <section className="border-t pt-6">
                <h2 className="text-lg font-bold">Частые вопросы</h2>
                {product.faq?.length ? (
                  <Accordion type="single" collapsible className="mt-2 w-full">
                    {product.faq.map((item, index) => (
                      <AccordionItem key={item.question} value={`item-${index}`}>
                        <AccordionTrigger className="text-left text-sm font-semibold">
                          {item.question}
                        </AccordionTrigger>
                        <AccordionContent className="text-sm text-muted-foreground">
                          {item.answer}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                ) : (
                  <div className="mt-3 space-y-4">
                    <div>
                      <h3 className="text-sm font-semibold">
                        {product.type === 'top-up'
                          ? 'Когда поступит пополнение?'
                          : 'Когда станет доступен код?'}
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {getDeliveryEstimateDescription(product.fulfillment.estimate)}. Точный
                        статус отображается на странице заказа.
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold">Можно ли вернуть заказ?</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Возврат возможен только до момента начала исполнения заказа.
                      </p>
                    </div>
                  </div>
                )}
              </section>
            </div>

            <Card className="self-start shadow-sm">
              <CardContent className="space-y-5 p-5 sm:p-6">
                <div>
                  <h2 className="text-xl font-bold">{purchaseTitle}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {isCustomTopUp
                      ? 'Укажите количество и аккаунт для зачисления.'
                      : hasOptions
                        ? 'Так мы покажем только подходящие предложения.'
                        : 'Код будет выдан на странице заказа после оплаты.'}
                  </p>
                </div>
                {hasOptions ? (
                  <fieldset className="space-y-2.5">
                    <legend className="text-sm font-semibold">{customerOptionCopy.question}</legend>
                    <div className="flex flex-wrap gap-2">
                      {product.options?.map((option) => {
                        const count = optionCounts.get(option.id) ?? 0;
                        const selected = effectiveOptionId === option.id;
                        return (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => handleOptionChange(option.id)}
                            disabled={count === 0}
                            aria-pressed={selected}
                            className={cn(
                              'inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors',
                              selected
                                ? 'border-primary bg-primary text-primary-foreground'
                                : 'hover:border-foreground/30',
                              count === 0 && 'cursor-not-allowed bg-muted/50 opacity-50'
                            )}
                          >
                            {selected ? <Check className="h-3.5 w-3.5" /> : null}
                            <span className="font-semibold">{option.label}</span>
                            {option.description ? (
                              <span
                                className={cn(
                                  'text-xs',
                                  selected ? 'text-primary-foreground/75' : 'text-muted-foreground'
                                )}
                              >
                                {option.description}
                              </span>
                            ) : null}
                          </button>
                        );
                      })}
                    </div>
                    {fieldErrors.option ? (
                      <p className="text-xs text-destructive">{fieldErrors.option}</p>
                    ) : null}
                  </fieldset>
                ) : null}

                <AnimatePresence initial={false}>
                  {!hasOptions || effectiveOptionId ? (
                    <motion.div
                      key="amount-selector"
                      initial={
                        prefersReducedMotion || !hasOptions ? false : { height: 0, opacity: 0 }
                      }
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={
                        prefersReducedMotion || !hasOptions ? undefined : { height: 0, opacity: 0 }
                      }
                      transition={{
                        duration: prefersReducedMotion ? 0 : 0.24,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                      className="overflow-hidden"
                    >
                      <fieldset className="space-y-2.5">
                        <legend className="text-sm font-semibold">
                          {isCustomTopUp
                            ? product.slug === 'telegram-stars'
                              ? 'Количество звёзд'
                              : 'Сумма пополнения'
                            : 'Доступные номиналы'}
                        </legend>
                        {noAvailableOffers ? (
                          <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                              Для этого варианта сейчас нет доступных предложений.
                            </AlertDescription>
                          </Alert>
                        ) : (
                          <div className="space-y-2.5">
                            {isCustomTopUp ? (
                              <div className="relative">
                                <Input
                                  id="product-custom-amount"
                                  type="text"
                                  inputMode="numeric"
                                  value={customAmount}
                                  onChange={(event) => handleCustomAmountChange(event.target.value)}
                                  placeholder={
                                    product.slug === 'telegram-stars'
                                      ? `От ${getCustomAmountLimits(product).min} звёзд`
                                      : `От ${getCustomAmountLimits(product).min} рублей`
                                  }
                                  className="h-12 bg-muted/40 pr-12 text-base"
                                  aria-invalid={Boolean(fieldErrors.amount)}
                                />
                                <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center font-medium text-muted-foreground">
                                  {amountUnit}
                                </span>
                              </div>
                            ) : null}

                            <div className="flex flex-wrap gap-2">
                              {availableDenominations.map((denomination) => {
                                const selected = selectedAmount === denomination.id;
                                return (
                                  <button
                                    key={denomination.id}
                                    type="button"
                                    onClick={() => {
                                      setSelectedAmount((current) =>
                                        toggleSelection(current, denomination.id)
                                      );
                                      setCustomAmount('');
                                      clearFieldError('amount');
                                    }}
                                    aria-pressed={selected}
                                    className={cn(
                                      'inline-flex min-h-10 items-center gap-1.5 rounded-xl border px-3 py-2 text-left text-sm font-semibold transition-colors',
                                      selected
                                        ? 'border-primary bg-primary text-primary-foreground'
                                        : 'bg-muted/35 hover:border-primary/40 hover:bg-muted/60'
                                    )}
                                  >
                                    {selected ? <Check className="h-3.5 w-3.5 shrink-0" /> : null}
                                    <span>
                                      {isCustomTopUp
                                        ? denomination.currency === 'Stars'
                                          ? `${denomination.amount.toLocaleString('ru-RU')} ★`
                                          : formatPrice(denomination.amount)
                                        : getDenominationTitle(denomination)}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                        {fieldErrors.amount ? (
                          <p className="text-xs text-destructive">{fieldErrors.amount}</p>
                        ) : null}
                      </fieldset>
                    </motion.div>
                  ) : null}
                </AnimatePresence>

                {product.type === 'top-up' && accountFieldCopy ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <Label htmlFor="accountId">{accountFieldCopy.label} *</Label>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-auto p-0 text-xs text-primary"
                          >
                            <Info className="mr-1 h-3 w-3" />
                            Где найти?
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>{accountFieldCopy.helpTitle}</DialogTitle>
                            <DialogDescription>
                              {product.instructions ||
                                'Откройте профиль сервиса и скопируйте ID аккаунта.'}
                            </DialogDescription>
                          </DialogHeader>
                        </DialogContent>
                      </Dialog>
                    </div>
                    <Input
                      id="accountId"
                      value={accountId}
                      onChange={(event) => {
                        setAccountId(event.target.value);
                        clearFieldError('accountId');
                      }}
                      placeholder={accountFieldCopy.placeholder}
                      className="h-12 bg-muted/40"
                    />
                    {fieldErrors.accountId ? (
                      <p className="text-xs text-destructive">{fieldErrors.accountId}</p>
                    ) : null}
                  </div>
                ) : null}

                {product.regions?.length ? (
                  <div className="space-y-2">
                    <Label htmlFor="region">Где зарегистрирован аккаунт?</Label>
                    <Select
                      value={selectedRegion}
                      onValueChange={(value) => {
                        setSelectedRegion(value);
                        clearFieldError('region');
                      }}
                    >
                      <SelectTrigger id="region">
                        <SelectValue placeholder="Выберите страну или регион" />
                      </SelectTrigger>
                      <SelectContent>
                        {product.regions.map((region) => (
                          <SelectItem key={region} value={region}>
                            {region}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Выбор должен совпадать с данными аккаунта.
                    </p>
                    {fieldErrors.region ? (
                      <p className="text-xs text-destructive">{fieldErrors.region}</p>
                    ) : null}
                  </div>
                ) : null}

                {product.servers?.length ? (
                  <div className="space-y-2">
                    <Label htmlFor="server">На каком сервере играете?</Label>
                    <Select
                      value={selectedServer}
                      onValueChange={(value) => {
                        setSelectedServer(value);
                        clearFieldError('server');
                      }}
                    >
                      <SelectTrigger id="server">
                        <SelectValue placeholder="Выберите сервер" />
                      </SelectTrigger>
                      <SelectContent>
                        {product.servers.map((server) => (
                          <SelectItem key={server} value={server}>
                            {server}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {fieldErrors.server ? (
                      <p className="text-xs text-destructive">{fieldErrors.server}</p>
                    ) : null}
                  </div>
                ) : null}

                <div className="space-y-2 border-t pt-5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Стоимость</span>
                    <span>
                      {selectedDenomination ? formatPrice(orderCalculation.basePrice) : '—'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      Комиссия ({Math.round(orderCalculation.commissionPercent * 100)}%)
                    </span>
                    <span>
                      {selectedDenomination ? formatPrice(orderCalculation.commission) : '—'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-1 text-lg font-bold">
                    <span>К оплате</span>
                    <span className="text-primary">
                      {selectedDenomination ? formatPrice(orderCalculation.total) : '—'}
                    </span>
                  </div>
                </div>

                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleCheckout}
                  disabled={
                    !selectedDenomination ||
                    (product.type === 'top-up' && !accountId) ||
                    (hasOptions && !effectiveOptionId) ||
                    (Boolean(product.regions?.length) && !selectedRegion) ||
                    (Boolean(product.servers?.length) && !selectedServer)
                  }
                >
                  {selectedDenomination
                    ? `К оформлению · ${formatPrice(orderCalculation.total)}`
                    : isCustomTopUp
                      ? 'Укажите количество'
                      : 'Выберите номинал'}
                </Button>
                <p className="text-center text-xs text-muted-foreground">
                  Оплата выполняется на защищённой странице.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
