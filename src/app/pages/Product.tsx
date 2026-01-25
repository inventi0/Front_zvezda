import { useState, useMemo, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Info, AlertCircle, CheckCircle2, Star, MessageSquare } from 'lucide-react';
import Header from '@/app/components/Header';
import Footer from '@/app/components/Footer';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Badge } from '@/app/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/app/components/ui/dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/app/components/ui/accordion';
import { Alert, AlertDescription } from '@/app/components/ui/alert';
import { useProduct } from '@/app/hooks/useProducts';
import { productCheckoutSchema } from '@/app/utils/schemas';
import { calculateOrderTotal } from '@/app/utils/orderCalculation';
import { getProductLogo } from '@/app/utils/productAssets';
import { toast } from 'sonner';
import { storeCheckoutData } from '@/app/utils/checkoutStorage';
import { getReviewsByProductId } from '@/app/data/mockData';
import { ScrollArea } from '@/app/components/ui/scroll-area';

export default function ProductPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { product, loading, error } = useProduct(slug);

  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedServer, setSelectedServer] = useState('');
  const [selectedAmount, setSelectedAmount] = useState('');
  const [accountId, setAccountId] = useState('');
  const [email, setEmail] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; accountId?: string; region?: string; server?: string; amount?: string }>({});

  // All hooks must be called before any early returns
  const selectedDenom = useMemo(
    () => product?.denominations.find(d => d.id === selectedAmount),
    [product, selectedAmount]
  );

  const { commission, total, basePrice: price } = useMemo(() => {
    const basePrice = selectedDenom?.price || 0;
    const calc = calculateOrderTotal(basePrice);
    return { ...calc, basePrice };
  }, [selectedDenom]);

  const productReviews = useMemo(
    () => (product ? getReviewsByProductId(product.id) : []),
    [product]
  );

  const handleCheckout = useCallback(() => {
    if (!product) return;

    // Validate with zod schema
    const schema = productCheckoutSchema(
      product.type,
      !!product.regions && product.regions.length > 0,
      !!product.servers && product.servers.length > 0
    );
    
    const result = schema.safeParse({
      email,
      accountId: product.type === 'top-up' ? accountId : undefined,
      denominationId: selectedAmount,
      region: selectedRegion || undefined,
      server: selectedServer || undefined,
    });

    if (!result.success) {
      const newFieldErrors: typeof fieldErrors = {};
      result.error.errors.forEach((err) => {
        const field = err.path[0] as keyof typeof fieldErrors;
        if (field === 'denominationId') {
          newFieldErrors.amount = err.message;
        } else if (field in fieldErrors) {
          newFieldErrors[field] = err.message;
        }
      });
      setFieldErrors(newFieldErrors);
      
      const errorMessages = result.error.errors.map(e => e.message);
      toast.error(errorMessages.join('. '));
      return;
    }

    // Store checkout data securely
    storeCheckoutData({
      productId: product.id,
      denominationId: result.data.denominationId,
      email: result.data.email,
      accountId: result.data.accountId,
      region: result.data.region,
      server: result.data.server,
    });

    toast.success('Переход к оформлению...');
    navigate(`/checkout?productId=${product.id}`);
  // fieldErrors used only for type/key check; omit from deps to avoid loop with setFieldErrors
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product, selectedAmount, email, accountId, selectedRegion, selectedServer, navigate]);

  // Early returns after all hooks
  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-muted-foreground">Загрузка товара...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">Товар не найден</h1>
            <p className="text-muted-foreground mb-4">{error || 'Товар не существует'}</p>
            <Link to="/#catalog">
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
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {/* Breadcrumb */}
          <Link to="/#catalog" className="inline-flex items-center text-xs sm:text-sm text-muted-foreground hover:text-foreground mb-4 sm:mb-6">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Назад на главную
          </Link>

          <div className="grid lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Left Column - Product Info */}
            <div className="lg:col-span-2">
              <div className="mb-6">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-16 h-16 flex items-center justify-center bg-muted rounded-lg overflow-hidden">
                    <img 
                      src={getProductLogo(product.slug)} 
                      alt={`${product.name} logo`}
                      className="w-12 h-12 object-contain"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h1 className="text-3xl font-bold">{product.name}</h1>
                      {product.popular && (
                        <Badge>Популярное</Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary">{product.deliveryTimeText}</Badge>
                      <Dialog>
                        <DialogTrigger asChild>
                          <button
                            type="button"
                            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <Star className="h-4 w-4 fill-warning text-warning" />
                            {(product.rating != null || productReviews.length > 0) && (
                              <span className="font-medium text-foreground">
                                {(
                                  product.rating ??
                                  (productReviews.length > 0
                                    ? productReviews.reduce((s, r) => s + r.rating, 0) / productReviews.length
                                    : 0)
                                ).toFixed(1)}
                              </span>
                            )}
                            <span>({productReviews.length})</span>
                            <MessageSquare className="h-4 w-4" />
                            <span>Посмотреть отзывы</span>
                          </button>
                        </DialogTrigger>
                        <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
                          <DialogHeader>
                            <DialogTitle>Отзывы о {product.name}</DialogTitle>
                            <DialogDescription>
                              {productReviews.length === 0
                                ? 'Пока нет отзывов.'
                                : `${productReviews.length} отзывов`}
                            </DialogDescription>
                          </DialogHeader>
                          <ScrollArea className="flex-1 min-h-0 pr-4">
                            <div className="space-y-4">
                              {productReviews.length === 0 ? (
                                <p className="text-sm text-muted-foreground py-4">
                                  Станьте первым, кто оставит отзыв после покупки.
                                </p>
                              ) : (
                                productReviews.map((r) => (
                                  <div
                                    key={r.id}
                                    className="rounded-xl border border-border bg-muted/30 p-4 space-y-1"
                                  >
                                    <div className="flex items-center gap-2">
                                      <div className="flex gap-0.5">
                                        {[1, 2, 3, 4, 5].map((i) => (
                                          <Star
                                            key={i}
                                            className={`h-4 w-4 ${
                                              i <= r.rating ? 'fill-warning text-warning' : 'text-muted-foreground/40'
                                            }`}
                                          />
                                        ))}
                                      </div>
                                      <span className="text-xs text-muted-foreground">
                                        {new Date(r.createdAt).toLocaleDateString('ru-RU', {
                                          day: 'numeric',
                                          month: 'long',
                                          year: 'numeric',
                                        })}
                                      </span>
                                    </div>
                                    <p className="text-sm">{r.text}</p>
                                  </div>
                                ))
                              )}
                            </div>
                          </ScrollArea>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </div>
                <p className="text-muted-foreground">{product.description}</p>
              </div>

              {/* Warnings */}
              {product.warnings && product.warnings.length > 0 && (
                <Alert className="mb-6">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <ul className="list-disc pl-4 space-y-1">
                      {product.warnings.map((warning, i) => (
                        <li key={i}>{warning}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {/* Instructions */}
              {product.instructions && (
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="text-lg">Инструкция</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{product.instructions}</p>
                  </CardContent>
                </Card>
              )}

              {/* Features */}
              {product.features && product.features.length > 0 && (
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="text-lg">Преимущества</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {product.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <CheckCircle2 className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* FAQ */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Часто задаваемые вопросы</CardTitle>
                </CardHeader>
                <CardContent>
                  {product.faq && product.faq.length > 0 ? (
                    <Accordion type="single" collapsible className="w-full">
                      {product.faq.map((item, i) => (
                        <AccordionItem key={i} value={`item-${i}`}>
                          <AccordionTrigger className="text-sm font-semibold text-left">
                            {item.question}
                          </AccordionTrigger>
                          <AccordionContent className="text-sm text-muted-foreground">
                            {item.answer}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold mb-1">Как быстро поступит пополнение?</h4>
                        <p className="text-sm text-muted-foreground">
                          Обычно {product.deliveryTimeText.toLowerCase()}. В редких случаях может занять до 24 часов.
                        </p>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-1">Можно ли вернуть заказ?</h4>
                        <p className="text-sm text-muted-foreground">
                          Возврат возможен только до момента начала исполнения заказа.
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Checkout Form */}
            <div>
              <Card className="sticky top-20">
                <CardHeader>
                  <CardTitle>Оформление заказа</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Region Selection */}
                  {product.regions && product.regions.length > 0 && (
                    <div className="space-y-2">
                      <Label htmlFor="region">Регион *</Label>
                      <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                        <SelectTrigger id="region">
                          <SelectValue placeholder="Выберите регион" />
                        </SelectTrigger>
                        <SelectContent>
                          {product.regions.map((region) => (
                            <SelectItem key={region} value={region}>{region}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground mt-1">
                        Регион должен совпадать с регионом вашего аккаунта
                      </p>
                      {fieldErrors.region && (
                        <p className="text-xs text-red-500 mt-1">
                          {fieldErrors.region}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Server Selection */}
                  {product.servers && product.servers.length > 0 && (
                    <div className="space-y-2">
                      <Label htmlFor="server">Сервер *</Label>
                      <Select value={selectedServer} onValueChange={setSelectedServer}>
                        <SelectTrigger id="server">
                          <SelectValue placeholder="Выберите сервер" />
                        </SelectTrigger>
                        <SelectContent>
                          {product.servers.map((server) => (
                            <SelectItem key={server} value={server}>{server}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {fieldErrors.server && (
                        <p className="text-xs text-red-500 mt-1">
                          {fieldErrors.server}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Amount Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="amount">Номинал *</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {product.denominations.map((denom) => (
                        <Button
                          key={denom.id}
                          variant={selectedAmount === denom.id ? 'default' : 'outline'}
                          className="h-auto py-3 px-4 flex flex-col items-start"
                          onClick={() => setSelectedAmount(denom.id)}
                        >
                          <span className="font-semibold">{denom.amount} {denom.currency}</span>
                          <span className="text-xs opacity-80">{denom.price} ₽</span>
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Account ID */}
                  {product.type === 'top-up' && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="accountId">ID аккаунта *</Label>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-auto p-0 text-xs text-primary">
                              <Info className="h-3 w-3 mr-1" />
                              Где найти?
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Как найти ID аккаунта?</DialogTitle>
                              <DialogDescription>
                                {product.instructions || 'Инструкция по поиску ID аккаунта для данного продукта.'}
                              </DialogDescription>
                            </DialogHeader>
                          </DialogContent>
                        </Dialog>
                      </div>
                      <Input
                        id="accountId"
                        type="text"
                        value={accountId}
                        onChange={(e) => setAccountId(e.target.value)}
                        placeholder="Введите ID"
                        className="bg-muted/20 ring-1 ring-border border-border"
                      />
                      {fieldErrors.accountId && (
                        <p className="text-xs text-red-500 mt-1">
                          {fieldErrors.accountId}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Email */}
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="text"
                      inputMode="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="bg-muted/20 ring-1 ring-border border-border"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Для чека и статуса заказа
                    </p>
                      {fieldErrors.email && (
                        <p className="text-xs text-red-500 mt-1">
                          {fieldErrors.email}
                        </p>
                      )}
                  </div>

                  {/* Price Summary */}
                  {selectedAmount && (
                    <div className="pt-4 border-t space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Сумма</span>
                        <span>{price} ₽</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Комиссия (10%)</span>
                        <span>{commission} ₽</span>
                      </div>
                      <div className="flex justify-between font-bold text-lg pt-2">
                        <span>К оплате</span>
                        <span className="text-primary">{total} ₽</span>
                      </div>
                    </div>
                  )}

                  <Button 
                    className="w-full" 
                    size="lg"
                    onClick={handleCheckout}
                    disabled={
                      !selectedAmount || 
                      !email || 
                      (product.type === 'top-up' && !accountId) ||
                      (product.regions && !selectedRegion) ||
                      (product.servers && !selectedServer)
                    }
                  >
                    Перейти к оплате
                  </Button>
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