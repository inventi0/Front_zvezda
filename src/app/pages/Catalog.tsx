import { useState, useMemo, useCallback, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Search, Filter } from 'lucide-react';
import Header from '@/app/components/Header';
import Footer from '@/app/components/Footer';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
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
import { getProductImage, getProductLogo } from '@/app/utils/productAssets';
import { debounce } from '@/app/utils/debounce';

export default function CatalogPage() {
  const { category } = useParams<{ category?: string }>();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | 'all'>(
    (category as ProductCategory) || 'all'
  );
  const [sortBy, setSortBy] = useState<'popular' | 'price-asc' | 'price-desc'>('popular');

  // Debounce search query to avoid excessive API calls
  useEffect(() => {
    const debouncedUpdate = debounce((value: string) => {
      setDebouncedSearchQuery(value);
    }, 300);

    debouncedUpdate(searchQuery);

    // Cleanup: clear debounce on unmount or when searchQuery changes
    return () => {
      // The debounce function handles its own cleanup via setTimeout
    };
  }, [searchQuery]);

  const { products: allProducts, loading, error, refetch } = useProducts({
    category: selectedCategory !== 'all' ? selectedCategory : undefined,
    search: debouncedSearchQuery.trim() || undefined,
  });

  const filteredProducts = useMemo(() => {
    let products = [...allProducts];

    // Sort products
    if (sortBy === 'popular') {
      products = products.sort((a, b) => (b.popular ? 1 : 0) - (a.popular ? 1 : 0));
    } else if (sortBy === 'price-asc') {
      products = products.sort((a, b) => 
        a.denominations[0]?.price - b.denominations[0]?.price || 0
      );
    } else if (sortBy === 'price-desc') {
      products = products.sort((a, b) => 
        b.denominations[0]?.price - a.denominations[0]?.price || 0
      );
    }

    return products;
  }, [allProducts, sortBy]);

  const categories = useMemo(() => {
    const allCategories: ProductCategory[] = ['games', 'subscriptions', 'wallet', 'services'];
    return [
      { value: 'all' as const, label: 'Все товары', count: allProducts.length },
      ...allCategories.map(cat => ({
        value: cat,
        label: cat === 'games' ? 'Игры' : 
               cat === 'subscriptions' ? 'Подписки' :
               cat === 'wallet' ? 'Подарочные карты' : 'Сервисы',
        count: allProducts.filter(p => p.category === cat).length,
      })),
    ];
  }, [allProducts]);

  const handleReload = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const handleResetFilters = useCallback(() => {
    setSearchQuery('');
    setSelectedCategory('all');
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-1">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {/* Page Header */}
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2">Каталог товаров</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Выберите товар для пополнения или покупки
            </p>
          </div>

          {/* Search and Filters */}
          <div className="mb-6 sm:mb-8 space-y-3 sm:space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Поиск товаров..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-input"
                />
              </div>
              <Select value={sortBy} onValueChange={(value: 'popular' | 'price-asc' | 'price-desc') => setSortBy(value)}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="popular">Популярные</SelectItem>
                  <SelectItem value="price-asc">Цена: по возрастанию</SelectItem>
                  <SelectItem value="price-desc">Цена: по убыванию</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Category Tabs - Desktop */}
            <div className="hidden md:block overflow-x-auto">
              <Tabs value={selectedCategory} onValueChange={(value: ProductCategory | 'all') => setSelectedCategory(value)}>
                <TabsList className="grid grid-cols-5 w-full min-w-max">
                  {categories.map((cat) => (
                    <TabsTrigger key={cat.value} value={cat.value} className="text-xs sm:text-sm whitespace-nowrap">
                      {cat.label}
                      <span className="ml-1.5 text-xs text-muted-foreground">({cat.count})</span>
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>

            {/* Category Buttons - Mobile */}
            <div className="md:hidden">
              <Select value={selectedCategory} onValueChange={(value: ProductCategory | 'all') => setSelectedCategory(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label} ({cat.count})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="text-center py-16">
              <p className="text-muted-foreground">Загрузка товаров...</p>
            </div>
          )}

          {/* Error State */}
          {!loading && error && (
            <div className="text-center py-16">
              <p className="text-destructive mb-4">{error}</p>
              <Button onClick={handleReload}>Обновить</Button>
            </div>
          )}

          {/* Products Grid */}
          {!loading && !error && filteredProducts.length > 0 && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 lg:gap-6">
              {filteredProducts.map((product) => (
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

          {/* Empty State - только когда загрузка завершена, нет ошибки и товаров нет */}
          {!loading && !error && filteredProducts.length === 0 && (
            <div className="text-center py-16">
              <Search className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">Товары не найдены</h3>
              <p className="text-muted-foreground mb-6">
                Попробуйте изменить параметры поиска или фильтры
              </p>
              <Button onClick={handleResetFilters}>
                Сбросить фильтры
              </Button>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
