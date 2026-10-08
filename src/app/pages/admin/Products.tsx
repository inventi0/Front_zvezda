import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, CircleCheck, CircleOff, Search, Tags } from 'lucide-react';
import { toast } from 'sonner';
import AdminLayout from '@/app/components/AdminLayout';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent } from '@/app/components/ui/card';
import { Input } from '@/app/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Switch } from '@/app/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table';
import {
  calculateVoucherPrice,
  catalogProducts,
  createEmptyOverride,
  formatRub,
  getCatalogTotals,
  getPublicationIssues,
  getProductOffers,
  loadCatalogSettings,
  saveProductOverride,
  type PublicationState,
} from '@/app/admin/catalog';

const PAGE_SIZE = 25;

function pluralize(count: number, one: string, few: string, many: string): string {
  const mod100 = count % 100;
  const mod10 = count % 10;
  if (mod100 >= 11 && mod100 <= 14) return many;
  if (mod10 === 1) return one;
  if (mod10 >= 2 && mod10 <= 4) return few;
  return many;
}

export default function AdminProducts() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState(loadCatalogSettings);
  const [search, setSearch] = useState('');
  const [publication, setPublication] = useState<PublicationState | 'all'>('all');
  const [marker, setMarker] = useState<'all' | 'ready' | 'incomplete' | 'popular' | 'promotion' | 'configured'>('all');
  const [sort, setSort] = useState<'name' | 'stock' | 'skus'>('name');
  const [page, setPage] = useState(1);
  const totals = useMemo(getCatalogTotals, []);

  const rows = useMemo(() => catalogProducts.map((product) => {
    const override = settings.products[product.id];
    const effective = override ?? createEmptyOverride(product);
    const offers = getProductOffers(product);
    const stock = offers.reduce((sum, { voucher }) => sum + voucher.stock, 0);
    const availableSkus = offers.filter(({ voucher }) => voucher.isAvailable && voucher.stock > 0).length;
    const prices = offers.map(({ voucher }) => calculateVoucherPrice(voucher, settings.globalPricing, override).salePrice);
    const publicationIssues = getPublicationIssues(product, effective);
    return {
      product,
      override,
      effective,
      stock,
      availableSkus,
      skuCount: offers.length,
      visibleVariantCount: product.variants.filter((variant) => !effective.hiddenVariantIds.includes(variant.id)).length,
      minSalePrice: prices.length ? Math.min(...prices) : null,
      maxSalePrice: prices.length ? Math.max(...prices) : null,
      publicationIssues,
      readyToPublish: publicationIssues.length === 0,
    };
  }), [settings]);

  const filtered = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('ru-RU');
    const next = rows.filter((row) => {
      const searchable = [
        row.effective.title,
        row.product.id,
        ...row.product.categories.flatMap((category) => [category.details.categoryId, category.details.categoryName]),
        ...row.product.variants.flatMap((variant) => [variant.code, variant.label]),
      ].join(' ').toLocaleLowerCase('ru-RU');
      if (query && !searchable.includes(query)) return false;
      if (publication !== 'all' && row.effective.publication !== publication) return false;
      if (marker === 'ready' && !row.readyToPublish) return false;
      if (marker === 'incomplete' && row.readyToPublish) return false;
      if (marker === 'popular' && !row.effective.popular) return false;
      if (marker === 'promotion' && !row.effective.promotion.enabled) return false;
      if (marker === 'configured' && !row.override) return false;
      return true;
    });
    return next.sort((left, right) => {
      if (sort === 'stock') return right.stock - left.stock;
      if (sort === 'skus') return right.skuCount - left.skuCount;
      return left.effective.title.localeCompare(right.effective.title, 'ru');
    });
  }, [marker, publication, rows, search, sort]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const visible = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const publishedCount = Object.values(settings.products).filter((item) => item.publication === 'published').length;

  const togglePublication = (productId: string, published: boolean) => {
    const product = catalogProducts.find((item) => item.id === productId);
    if (!product) return;
    const current = settings.products[productId] ?? createEmptyOverride(product);
    try {
      setSettings(saveProductOverride(productId, {
        ...current,
        publication: published ? 'published' : 'unpublished',
      }));
      toast.success(published ? 'Товар опубликован на витрине' : 'Товар снят с публикации');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Не удалось изменить публикацию');
    }
  };

  const resetPage = () => setPage(1);

  return (
    <AdminLayout
      title="Каталог WATA"
      description={`${totals.supplierGroups.toLocaleString('ru-RU')} ${pluralize(totals.supplierGroups, 'группа поставщика', 'группы поставщика', 'групп поставщика')} объединены в ${totals.products.toLocaleString('ru-RU')} ${pluralize(totals.products, 'товар', 'товара', 'товаров')}. Региональные варианты и ${totals.skus.toLocaleString('ru-RU')} SKU сохранены внутри товаров.`}
      actions={<Button asChild variant="outline" size="sm"><Link to="/admin/pricing"><Tags className="mr-2 h-4 w-4" />Общие правила цен</Link></Button>}
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Товары', value: totals.products.toLocaleString('ru-RU') },
          { label: 'Варианты', value: totals.variants.toLocaleString('ru-RU') },
          { label: 'SKU поставщика', value: totals.skus.toLocaleString('ru-RU') },
          { label: 'Опубликовано', value: publishedCount.toLocaleString('ru-RU') },
        ].map((item) => (
          <Card key={item.label}>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">{item.label}</p>
              <p className="mt-1 text-2xl font-bold">{item.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-3 lg:grid-cols-[minmax(280px,1fr)_190px_190px_190px]">
        <div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(event) => { setSearch(event.target.value); resetPage(); }} placeholder="Товар, вариант или WATA ID" className="pl-9" /></div>
        <Select value={publication} onValueChange={(value) => { setPublication(value as PublicationState | 'all'); resetPage(); }}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Все статусы</SelectItem><SelectItem value="published">Опубликованные</SelectItem><SelectItem value="unpublished">Не опубликованные</SelectItem></SelectContent></Select>
        <Select value={marker} onValueChange={(value) => { setMarker(value as typeof marker); resetPage(); }}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Все товары</SelectItem><SelectItem value="ready">Заполненные</SelectItem><SelectItem value="incomplete">Не заполненные</SelectItem><SelectItem value="popular">Популярные</SelectItem><SelectItem value="promotion">Акционные</SelectItem><SelectItem value="configured">С настройками</SelectItem></SelectContent></Select>
        <Select value={sort} onValueChange={(value) => setSort(value as typeof sort)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="name">По названию</SelectItem><SelectItem value="stock">По остатку</SelectItem><SelectItem value="skus">По числу SKU</SelectItem></SelectContent></Select>
      </div>

      <Card className="mt-6 overflow-hidden">
        <div className="flex flex-col gap-2 border-b px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div><h2 className="font-bold">Товары</h2><p className="text-sm text-muted-foreground">Найдено: {filtered.length}. Исходных групп WATA: {totals.supplierGroups.toLocaleString('ru-RU')}.</p></div>
          <Badge variant="outline">Источник: GET /api/v3/vouchers/all</Badge>
        </div>
        <div className="overflow-x-auto">
          <Table className="w-full table-fixed [&_td]:px-4 [&_td]:py-3 [&_th]:px-4">
            <TableHeader><TableRow><TableHead className="w-[32%]">Товар</TableHead><TableHead className="w-[32%]">Варианты / SKU</TableHead><TableHead className="w-[20%]">Цена витрины</TableHead><TableHead className="w-[16%] text-center">Публикация</TableHead></TableRow></TableHeader>
            <TableBody>
              {visible.length === 0 ? <TableRow><TableCell colSpan={4} className="h-32 text-center text-muted-foreground">По заданным условиям товаров нет.</TableCell></TableRow> : visible.map((row) => (
                <TableRow
                  key={row.product.id}
                  role="link"
                  tabIndex={0}
                  aria-label={`Открыть настройки товара ${row.effective.title}`}
                  className="cursor-pointer focus-visible:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
                  onClick={() => navigate(`/admin/products/${row.product.id}`)}
                  onKeyDown={(event) => {
                    if (event.target !== event.currentTarget) return;
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      navigate(`/admin/products/${row.product.id}`);
                    }
                  }}
                >
                  <TableCell className="whitespace-normal"><div className="min-w-0"><div className="flex items-center gap-2"><p className="min-w-0 font-semibold leading-5">{row.effective.title}</p><span className="shrink-0" role="img" aria-label={row.readyToPublish ? 'Товар заполнен' : 'Товар не заполнен'} title={row.readyToPublish ? 'Все обязательные данные заполнены' : `Не заполнено: ${row.publicationIssues.join(', ')}`}>{row.readyToPublish ? <CircleCheck className="h-5 w-5 text-emerald-600" aria-hidden="true" /> : <CircleOff className="h-5 w-5 text-muted-foreground" aria-hidden="true" />}</span></div><p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{row.product.type} · групп WATA: {row.product.categories.length}{row.override ? ' · настроен' : ''}</p></div></TableCell>
                  <TableCell className="whitespace-normal"><p className="font-medium leading-5">{row.visibleVariantCount.toLocaleString('ru-RU')} из {row.product.variants.length.toLocaleString('ru-RU')} вариантов · {row.availableSkus.toLocaleString('ru-RU')} / {row.skuCount.toLocaleString('ru-RU')} SKU</p><p className="text-xs text-muted-foreground">остаток {row.stock.toLocaleString('ru-RU')} шт.</p></TableCell>
                  <TableCell className="whitespace-normal">{row.minSalePrice === null || row.maxSalePrice === null ? <><p className="font-medium text-muted-foreground">Нет SKU</p><p className="text-xs leading-4 text-muted-foreground">ожидается синхронизация</p></> : row.minSalePrice === row.maxSalePrice ? <><p className="font-medium leading-5">{formatRub(row.minSalePrice)}</p><p className="text-xs text-muted-foreground">для товара</p></> : <><p className="font-medium leading-5">от {formatRub(row.minSalePrice)}</p><p className="font-medium leading-5">до {formatRub(row.maxSalePrice)}</p></>}</TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center" onClick={(event) => event.stopPropagation()} onKeyDown={(event) => event.stopPropagation()}>
                      <Switch checked={row.effective.publication === 'published'} onCheckedChange={(checked) => togglePublication(row.product.id, checked)} aria-label={`Публикация товара: ${row.effective.title}`} />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="flex items-center justify-between border-t px-5 py-4"><p className="text-sm text-muted-foreground">Страница {safePage} из {pageCount}</p><div className="flex gap-2"><Button variant="outline" size="sm" disabled={safePage <= 1} onClick={() => setPage((current) => current - 1)}><ChevronLeft className="mr-1 h-4 w-4" />Назад</Button><Button variant="outline" size="sm" disabled={safePage >= pageCount} onClick={() => setPage((current) => current + 1)}>Далее<ChevronRight className="ml-1 h-4 w-4" /></Button></div></div>
      </Card>
    </AdminLayout>
  );
}
