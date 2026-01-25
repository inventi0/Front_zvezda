import { useState, useMemo, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Input } from '@/app/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/app/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import { ArrowLeft, Search } from 'lucide-react';
import { useProducts } from '@/app/hooks/useProducts';
import { getProductLogo } from '@/app/utils/productAssets';
import { toast } from 'sonner';
import type { ProductCategory } from '@/app/types';

export default function AdminProducts() {
  const { products: allProducts, loading, error, refetch } = useProducts();
  const [popularFlags, setPopularFlags] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<ProductCategory | 'all'>('all');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearchQuery(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const filteredProducts = useMemo(() => {
    let products = [...allProducts];
    if (categoryFilter !== 'all') products = products.filter(p => p.category === categoryFilter);
    if (debouncedSearchQuery) {
      const q = debouncedSearchQuery.toLowerCase();
      products = products.filter(
        p => p.name.toLowerCase().includes(q) || (p.description ?? '').toLowerCase().includes(q)
      );
    }
    return products;
  }, [allProducts, categoryFilter, debouncedSearchQuery]);

  const handleTogglePopular = useCallback((productId: string) => {
    setPopularFlags(prev => ({ ...prev, [productId]: !prev[productId] }));
    toast.success('Статус товара обновлен');
  }, []);

  const getProductPopularStatus = (product: (typeof allProducts)[0]) =>
    popularFlags[product.id] !== undefined ? popularFlags[product.id] : (product.popular ?? false);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/admin/dashboard">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Каталог товаров</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Список товаров синхронизируется с платёжным шлюзом. Редактирование и удаление
                  позиций выполняется на стороне провайдера и недоступно из админ‑панели.
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Поиск товаров..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v as ProductCategory | 'all')}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все категории</SelectItem>
                  <SelectItem value="games">Игры</SelectItem>
                  <SelectItem value="subscriptions">Подписки</SelectItem>
                  <SelectItem value="wallet">Подарочные карты</SelectItem>
                  <SelectItem value="services">Сервисы</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Товары ({filteredProducts.length})</CardTitle>
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
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Товар</TableHead>
                      <TableHead>Категория</TableHead>
                      <TableHead>Тип</TableHead>
                      <TableHead>Цены</TableHead>
                      <TableHead>Статус</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          Товары не найдены
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredProducts.map((product) => {
                        const isPopular = getProductPopularStatus(product);
                        return (
                          <TableRow key={product.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <img
                                  src={getProductLogo(product.slug)}
                                  alt={`${product.name} logo`}
                                  className="w-8 h-8 object-contain"
                                />
                                <div>
                                  <div className="font-medium">{product.name}</div>
                                  <div className="text-sm text-muted-foreground line-clamp-1">
                                    {product.description}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {product.category === 'games' ? 'Игры' :
                                  product.category === 'subscriptions' ? 'Подписки' :
                                    product.category === 'wallet' ? 'Карты' : 'Сервисы'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">
                                {product.type === 'top-up' ? 'Пополнение' :
                                  product.type === 'voucher' ? 'Ваучер' : 'Gift Card'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm">
                              от {product.denominations[0]?.price ?? 0} ₽
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleTogglePopular(product.id)}
                              >
                                {isPopular ? (
                                  <Badge>Популярное</Badge>
                                ) : (
                                  <Badge variant="outline">Обычное</Badge>
                                )}
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
