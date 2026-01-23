import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Label } from '@/app/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/app/components/ui/table';
import { ArrowLeft, TrendingUp, Percent } from 'lucide-react';
import { useProducts } from '@/app/hooks/useProducts';
import { getProductLogo } from '@/app/utils/productAssets';
import { config } from '@/app/config/env';
import { calculateOrderTotal } from '@/app/utils/orderCalculation';

export default function AdminPricing() {
  const { products, loading, error, refetch } = useProducts();
  
  const commissionPercent = useMemo(
    () => config.gatewayCommissionPercent,
    [],
  );

  const commissionPercentDisplay = Math.round(commissionPercent * 100);

  const calculateTotal = (price: number) => {
    return calculateOrderTotal(price, commissionPercent).total;
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-5">
          <div className="flex items-center gap-4">
            <Link to="/admin/dashboard">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Ценообразование</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Настройка цен и комиссий для товаров
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-7xl space-y-6">
        {/* Global Commission */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Percent className="h-5 w-5 text-primary" />
              Комиссия платёжного шлюза
            </CardTitle>
            <CardDescription>
              Комиссия задаётся платёжным шлюзом / backend и применяется ко всем заказам на платформе. 
              В админ‑панели она доступна только для просмотра.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Текущий размер комиссии</Label>
                  <div className="text-3xl font-bold text-primary">
                    {commissionPercentDisplay}%
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Значение фиксируется на стороне платёжного шлюза и/или backend‑сервиса. 
                  Фронтенд использует его только для отображения расчётов. 
                  Чтобы изменить комиссию, нужно обновить настройки на стороне платёжного провайдера.
                </p>
              </div>

              <div className="bg-muted p-4 rounded-lg space-y-2">
                <h4 className="font-semibold text-sm">Примеры расчета:</h4>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">Сумма 1000 ₽</div>
                    <div className="font-semibold">Итого: {calculateTotal(1000)} ₽</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Сумма 5000 ₽</div>
                    <div className="font-semibold">Итого: {calculateTotal(5000)} ₽</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Сумма 10000 ₽</div>
                    <div className="font-semibold">Итого: {calculateTotal(10000)} ₽</div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Product Prices */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Цены на товары
            </CardTitle>
            <CardDescription>
              Обзор цен на номиналы для каждого товара и итоговой суммы с учётом комиссии платёжного шлюза
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Загрузка товаров...</p>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <p className="text-destructive mb-4">{error}</p>
                <Button onClick={() => refetch()}>Обновить</Button>
              </div>
            ) : (
              <div className="space-y-6">
                {products.map((product) => (
                <div key={product.id} className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <img 
                        src={getProductLogo(product.slug)} 
                        alt={`${product.name} logo`}
                        className="w-10 h-10 object-contain"
                      />
                      <div>
                        <h3 className="font-semibold">{product.name}</h3>
                        <p className="text-sm text-muted-foreground">{product.category}</p>
                      </div>
                    </div>
                    {product.popular && <Badge>Популярное</Badge>}
                  </div>

                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Номинал</TableHead>
                          <TableHead>Базовая цена</TableHead>
                          <TableHead>Комиссия ({commissionPercentDisplay}%)</TableHead>
                          <TableHead>Итого к оплате</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {product.denominations.map((denom) => (
                          <TableRow key={denom.id}>
                            <TableCell>
                              <div className="font-medium">
                                {denom.amount} {denom.currency}
                              </div>
                              {denom.bonus && (
                                <Badge variant="secondary" className="text-xs mt-1">
                                  {denom.bonus}
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="font-mono">{denom.price} ₽</div>
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {Math.round(
                                denom.price * commissionPercent,
                              )}{' '}
                              ₽
                            </TableCell>
                            <TableCell className="font-semibold text-primary">
                              {calculateTotal(denom.price)} ₽
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pricing Strategy */}
        <Card>
          <CardHeader>
            <CardTitle>Стратегия ценообразования</CardTitle>
            <CardDescription>
              Рекомендации по установке цен
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">Товары с ручной обработкой</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Товары с типом доставки <Badge variant="secondary">Ручная проверка</Badge> требуют большего внимания операторов и обычно имеют более высокую комиссию на стороне платёжного шлюза.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Важно: размер комиссии по‑прежнему задаётся на стороне провайдера платежей. 
                    Здесь вы видите только результат их настроек.
                  </p>
                </div>
              </div>

              <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                <h4 className="font-semibold mb-2 text-primary">Совет</h4>
                <p className="text-sm">
                  Регулярно анализируйте конкурентов и корректируйте цены для поддержания конкурентоспособности. 
                  Средняя комиссия на рынке составляет 8-12%.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
