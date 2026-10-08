import { type ClipboardEvent, useMemo, useState } from 'react';
import type { ProductCategory } from '@/app/types';
import { Link, Navigate, useParams } from 'react-router-dom';
import { ArrowLeft, ExternalLink, ImageIcon, Plus, RotateCcw, Save, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import AdminLayout from '@/app/components/AdminLayout';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Switch } from '@/app/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Textarea } from '@/app/components/ui/textarea';
import {
  calculateVoucherPrice,
  createEmptyOverride,
  formatRub,
  getCatalogProduct,
  getCatalogProductFulfillment,
  getPublicationIssues,
  getProductOffers,
  getVariantDimensionLabel,
  isVariantPurchasable,
  loadCatalogSettings,
  resetProductOverride,
  saveProductOverride,
  type PricingMode,
  type ProductMedia,
  type ProductOverride,
  type RoundingStep,
} from '@/app/admin/catalog';
import {
  getDeliveryEstimateDescription,
  getFulfillmentChannelLabel,
  getFulfillmentTypeLabel,
} from '@/app/domain/productFulfillment';

const SKU_PAGE_SIZE = 30;

type MediaKey = Exclude<keyof ProductMedia, 'gallery'>;

function SupplierIds({ ids }: { ids: string[] }) {
  const visibleIds = ids.slice(0, 2);
  const hiddenCount = ids.length - visibleIds.length;

  return (
    <div className="flex flex-wrap gap-1" title={ids.join(', ')}>
      {visibleIds.map((id) => <Badge key={id} variant="secondary">{id}</Badge>)}
      {hiddenCount > 0 ? <Badge variant="outline">+{hiddenCount}</Badge> : null}
    </div>
  );
}

function ImageField({ label, hint, value, onChange }: { label: string; hint: string; value: string; onChange: (value: string) => void }) {
  const [failedPreview, setFailedPreview] = useState<string | null>(null);
  const isLocalImage = value.startsWith('data:image/');

  const upload = (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Выберите изображение'); return; }
    if (file.size > 750_000) { toast.error('Для локального режима файл должен быть меньше 750 КБ'); return; }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== 'string') { toast.error('Не удалось прочитать изображение'); return; }
      setFailedPreview(null);
      onChange(reader.result);
      toast.success('Изображение добавлено');
    };
    reader.onerror = () => toast.error('Не удалось прочитать изображение');
    reader.readAsDataURL(file);
  };

  const pasteImage = (event: ClipboardEvent<HTMLDivElement>) => {
    const imageItem = Array.from(event.clipboardData.items).find((item) => item.type.startsWith('image/'));
    if (!imageItem) return;
    event.preventDefault();
    upload(imageItem.getAsFile() ?? undefined);
  };

  return (
    <div className="grid gap-4 rounded-xl border p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:grid-cols-[140px_1fr]" role="group" aria-label={`${label}: загрузка изображения`} tabIndex={0} onPaste={pasteImage}>
      <div className="flex aspect-[4/3] items-center justify-center overflow-hidden rounded-lg bg-muted">
        {value && failedPreview !== value ? <img src={value} alt={`Предпросмотр: ${label}`} className="h-full w-full object-cover" onLoad={() => setFailedPreview(null)} onError={() => setFailedPreview(value)} /> : <ImageIcon className="h-7 w-7 text-muted-foreground" />}
      </div>
      <div className="min-w-0 space-y-3">
        <div><Label>{label}</Label><p className="mt-1 text-xs leading-5 text-muted-foreground">{hint}</p></div>
        {isLocalImage ? <div className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2"><p className="text-sm font-medium text-primary">Изображение добавлено</p><p className="mt-0.5 text-xs text-muted-foreground">Локальный файл готов к предпросмотру. Чтобы заменить его URL, сначала удалите файл.</p></div> : <Input value={value} onChange={(event) => { setFailedPreview(null); onChange(event.target.value); }} placeholder="https://cdn.example.com/image.webp" />}
        {value && failedPreview === value ? <p className="text-sm text-destructive">Предпросмотр недоступен. Проверьте ссылку или загрузите файл заново.</p> : null}
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" asChild><label className="cursor-pointer"><Upload className="mr-2 h-4 w-4" />Загрузить файл<input type="file" accept="image/*" className="sr-only" onChange={(event) => upload(event.target.files?.[0])} /></label></Button>
          {value ? <Button type="button" variant="ghost" size="sm" onClick={() => { setFailedPreview(null); onChange(''); }}><Trash2 className="mr-2 h-4 w-4" />Удалить</Button> : null}
        </div>
        <p className="text-xs text-muted-foreground">Можно вставить URL или изображение из буфера через Ctrl/Cmd+V, когда курсор находится в этом блоке.</p>
        {isLocalImage ? <p className="text-xs text-amber-700">Файл хранится локально в браузере. В production его нужно заменить URL из объектного хранилища.</p> : null}
      </div>
    </div>
  );
}

export default function AdminProductEditor() {
  const { productId = '' } = useParams();
  const product = getCatalogProduct(productId);
  const [settings, setSettings] = useState(loadCatalogSettings);
  const [draft, setDraft] = useState<ProductOverride | null>(() => (
    product ? settings.products[productId] ?? createEmptyOverride(product) : null
  ));
  const [galleryUrl, setGalleryUrl] = useState('');
  const [selectedVariantId, setSelectedVariantId] = useState('all');
  const [skuPage, setSkuPage] = useState(1);

  const offers = useMemo(() => product ? getProductOffers(product) : [], [product]);
  const filteredOffers = selectedVariantId === 'all'
    ? offers
    : offers.filter(({ variant }) => variant.id === selectedVariantId);
  const skuPageCount = Math.max(1, Math.ceil(filteredOffers.length / SKU_PAGE_SIZE));
  const safeSkuPage = Math.min(skuPage, skuPageCount);
  const visibleOffers = filteredOffers.slice((safeSkuPage - 1) * SKU_PAGE_SIZE, safeSkuPage * SKU_PAGE_SIZE);

  if (!product || !draft) return <Navigate to="/admin/products" replace />;

  const fulfillment = getCatalogProductFulfillment(product);
  const effectiveRule = draft.pricingRule ?? settings.globalPricing;
  const firstVoucher = offers[0]?.voucher;
  const stock = offers.reduce((sum, { voucher }) => sum + voucher.stock, 0);
  const pricePreview = firstVoucher ? calculateVoucherPrice(firstVoucher, settings.globalPricing, draft) : null;
  const pricedSkus = offers.map(({ voucher }) => calculateVoucherPrice(voucher, settings.globalPricing, draft));
  const adjustedCount = pricedSkus.filter((price) => price.adjustedToSupplierBounds).length;
  const variantRows = product.variants.map((variant) => {
    const variantOffers = offers.filter((offer) => offer.variant.id === variant.id);
    const purchasable = isVariantPurchasable(variant);
    return {
      variant,
      available: variantOffers.filter(({ voucher }) => voucher.isAvailable && voucher.stock > 0).length,
      offerCount: variantOffers.length,
      stock: variantOffers.reduce((sum, { voucher }) => sum + voucher.stock, 0),
      purchasable,
      visible: purchasable && !draft.hiddenVariantIds.includes(variant.id),
      supplierIds: variant.categories.map((category) => category.details.categoryId),
    };
  });

  const updateMedia = (key: MediaKey, value: string) => setDraft((current) => current ? ({ ...current, media: { ...current.media, [key]: value } }) : current);
  const updateRule = (patch: Partial<NonNullable<ProductOverride['pricingRule']>>) => setDraft((current) => current ? ({ ...current, pricingRule: { ...(current.pricingRule ?? settings.globalPricing), ...patch } }) : current);
  const toggleVariant = (variantId: string, visible: boolean) => setDraft((current) => {
    if (!current) return current;
    const variant = product.variants.find((item) => item.id === variantId);
    if (visible && (!variant || !isVariantPurchasable(variant))) {
      toast.error('Нельзя добавить на витрину вариант без доступного товара');
      return current;
    }
    const hiddenVariantIds = visible
      ? current.hiddenVariantIds.filter((id) => id !== variantId)
      : [...new Set([...current.hiddenVariantIds, variantId])];
    return { ...current, hiddenVariantIds };
  });

  const publicationIssues = draft.publication === 'published' ? getPublicationIssues(product, draft) : [];
  const isPublished = settings.products[productId]?.publication === 'published';
  const saveLabel = draft.publication === 'published' && !isPublished ? 'Опубликовать' : 'Сохранить';

  const save = () => {
    if (publicationIssues.length) {
      toast.error(`Для публикации заполните: ${publicationIssues.join(', ')}`);
      return;
    }
    try {
      const next = saveProductOverride(productId, draft);
      setSettings(next);
      setDraft(next.products[productId]);
      toast.success(draft.publication === 'published' ? 'Товар опубликован на витрине' : 'Настройки товара сохранены');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Не удалось сохранить настройки товара');
    }
  };

  const reset = () => {
    try {
      setSettings(resetProductOverride(productId));
      setDraft(createEmptyOverride(product));
      toast.success('Ручные настройки удалены');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Не удалось сбросить настройки товара');
    }
  };

  const addGalleryImage = () => {
    const value = galleryUrl.trim();
    if (!value) return;
    setDraft((current) => current ? ({ ...current, media: { ...current.media, gallery: [...current.media.gallery, value] } }) : current);
    setGalleryUrl('');
  };

  const uploadGalleryImages = async (files: FileList | null) => {
    if (!files?.length) return;
    const selected = Array.from(files).slice(0, Math.max(0, 8 - draft.media.gallery.length));
    if (selected.some((file) => !file.type.startsWith('image/'))) { toast.error('Выберите только изображения'); return; }
    if (selected.some((file) => file.size > 500_000)) { toast.error('Каждый файл галереи должен быть меньше 500 КБ'); return; }
    try {
      const images = await Promise.all(selected.map((file) => new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('Не удалось прочитать изображение'));
        reader.onerror = () => reject(reader.error ?? new Error('Не удалось прочитать изображение'));
        reader.readAsDataURL(file);
      })));
      setDraft((current) => current ? ({ ...current, media: { ...current.media, gallery: [...current.media.gallery, ...images].slice(0, 8) } }) : current);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Не удалось загрузить изображения');
    }
  };

  const promotionControls = (
    <section className="rounded-xl border bg-card px-4 py-3" aria-labelledby="promotion-controls-title">
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center">
        <h2 id="promotion-controls-title" className="text-sm font-semibold">Маркеры и продвижение</h2>
        <label className="flex cursor-pointer items-center gap-2 text-sm font-medium" htmlFor="popular">
          Популярное
          <Switch id="popular" checked={draft.popular} onCheckedChange={(checked) => setDraft((current) => current ? ({ ...current, popular: checked }) : current)} />
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-sm font-medium" htmlFor="promotion">
          Акция
          <Switch id="promotion" checked={draft.promotion.enabled} onCheckedChange={(enabled) => setDraft((current) => current ? ({ ...current, promotion: { ...current.promotion, enabled } }) : current)} />
        </label>
      </div>
      <div className={`mt-3 grid gap-3 ${draft.promotion.enabled ? 'sm:grid-cols-[100px_minmax(0,1fr)_100px]' : 'sm:grid-cols-[100px_minmax(0,1fr)]'}`}>
        <div className="space-y-1">
          <Label htmlFor="rank" className="text-xs text-muted-foreground">Приоритет</Label>
          <Input id="rank" className="h-8" type="number" min="1" value={draft.popularityRank ?? ''} onChange={(event) => setDraft((current) => current ? ({ ...current, popularityRank: event.target.value ? Math.max(1, Math.round(Number(event.target.value))) : null }) : current)} placeholder="1" title="Меньшее число поднимает товар выше в подборке" />
        </div>
        {draft.promotion.enabled ? <div className="space-y-1"><Label htmlFor="promotion-label" className="text-xs text-muted-foreground">Текст</Label><Input id="promotion-label" className="h-8" value={draft.promotion.label} onChange={(event) => setDraft((current) => current ? ({ ...current, promotion: { ...current.promotion, label: event.target.value } }) : current)} placeholder="Акция" /></div> : <p className="self-end pb-1 text-xs leading-5 text-muted-foreground">1 — выше остальных в подборке.</p>}
        {draft.promotion.enabled ? <div className="space-y-1"><Label htmlFor="discount" className="text-xs text-muted-foreground">Скидка, %</Label><Input id="discount" className="h-8" type="number" min="0" max="90" step="0.1" value={draft.promotion.discountPercent} onChange={(event) => setDraft((current) => current ? ({ ...current, promotion: { ...current.promotion, discountPercent: Math.min(90, Math.max(0, Number(event.target.value))) } }) : current)} /></div> : null}
      </div>
    </section>
  );

  const headerContent = (
    <div className="mt-6 space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline">{getFulfillmentTypeLabel(fulfillment.type)}</Badge>
        <Badge variant="outline">{product.categories.length} WATA ID</Badge>
        <Badge variant={draft.publication === 'published' ? 'default' : 'secondary'}>{draft.publication === 'published' ? 'Опубликован' : 'Не опубликован'}</Badge>
        {draft.popular ? <Badge className="bg-amber-500">Популярное</Badge> : null}
        {draft.promotion.enabled ? <Badge className="bg-rose-600">{draft.promotion.label || 'Акция'}</Badge> : null}
      </div>
      <TabsList className="h-auto max-w-full flex-wrap justify-start">
        <TabsTrigger value="content">Контент</TabsTrigger>
        <TabsTrigger value="media">Изображения</TabsTrigger>
        <TabsTrigger value="pricing">Цены</TabsTrigger>
        <TabsTrigger value="variants">Варианты ({product.variants.length})</TabsTrigger>
        <TabsTrigger value="skus">SKU ({offers.length})</TabsTrigger>
      </TabsList>
    </div>
  );

  return (
    <Tabs defaultValue="content" className="block">
      <AdminLayout
        title={draft.title || product.title}
        description={`${product.variants.length} вариантов · ${product.categories.length} групп WATA · ${offers.length} SKU · остаток ${stock.toLocaleString('ru-RU')}`}
        actions={<div className="flex gap-2"><Button asChild variant="outline" size="sm"><Link to="/admin/products"><ArrowLeft className="mr-2 h-4 w-4" /><span className="hidden sm:inline">К каталогу</span><span className="sm:hidden">Каталог</span></Link></Button>{isPublished ? <Button asChild variant="outline" size="sm"><Link to={`/product/wata-${product.id}`}><ExternalLink className="h-4 w-4 sm:mr-2" /><span className="sr-only sm:not-sr-only">На витрине</span></Link></Button> : null}<Button size="sm" onClick={save}><Save className="h-4 w-4 sm:mr-2" /><span className="sr-only sm:not-sr-only">{saveLabel}</span></Button></div>}
        headerAside={promotionControls}
        headerContent={headerContent}
      >
        <TabsContent value="content" className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Публикация и витрина</CardTitle><CardDescription>Контент задаётся один раз для товара. Рынки, валюты и номиналы покупатель выбирает внутри карточки.</CardDescription></CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2"><Label htmlFor="title">Название на витрине</Label><Input id="title" value={draft.title} onChange={(event) => setDraft((current) => current ? ({ ...current, title: event.target.value }) : current)} /></div>
                <div className="space-y-2"><Label htmlFor="publication">Статус публикации</Label><div className="flex h-10 items-center justify-between gap-4 rounded-md bg-muted/60 px-3"><span className="text-sm font-medium">{draft.publication === 'published' ? 'Опубликован' : 'Не опубликован'}</span><Switch id="publication" checked={draft.publication === 'published'} onCheckedChange={(checked) => setDraft((current) => current ? ({ ...current, publication: checked ? 'published' : 'unpublished' }) : current)} /></div></div>
                <div className="space-y-2"><Label>Категория витрины</Label><Select value={draft.storefrontCategory} onValueChange={(value) => setDraft((current) => current ? ({ ...current, storefrontCategory: value as ProductCategory }) : current)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="games">Игры</SelectItem><SelectItem value="subscriptions">Подписки</SelectItem><SelectItem value="wallet">Подарочные карты</SelectItem><SelectItem value="services">Сервисы</SelectItem></SelectContent></Select></div>
              </div>
              {draft.publication === 'published' && publicationIssues.length ? <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900"><p className="font-medium">До публикации осталось заполнить:</p><p className="mt-1">{publicationIssues.join(', ')}.</p></div> : null}
              <div className="space-y-2"><Label htmlFor="description">Описание товара</Label><Textarea id="description" value={draft.description} onChange={(event) => setDraft((current) => current ? ({ ...current, description: event.target.value }) : current)} className="min-h-36" placeholder="Что получает покупатель, где действует товар и какие есть ограничения" /><p className="text-xs text-muted-foreground">Не перечисляйте регионы и номиналы вручную: они формируются из вариантов поставщика.</p></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Исполнение заказа</CardTitle>
              <CardDescription>Параметры определены контрактом WATA и не зависят от категории витрины.</CardDescription>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl bg-muted/60 p-4">
                  <dt className="text-xs text-muted-foreground">Тип получения</dt>
                  <dd className="mt-1 font-medium">{getFulfillmentTypeLabel(fulfillment.type)}</dd>
                </div>
                <div className="rounded-xl bg-muted/60 p-4">
                  <dt className="text-xs text-muted-foreground">Канал выдачи</dt>
                  <dd className="mt-1 font-medium">{getFulfillmentChannelLabel(fulfillment.channel)}</dd>
                </div>
                <div className="rounded-xl bg-muted/60 p-4">
                  <dt className="text-xs text-muted-foreground">Ожидаемый срок</dt>
                  <dd className="mt-1 font-medium">{getDeliveryEstimateDescription(fulfillment.estimate)}</dd>
                </div>
              </dl>
              <p className="mt-3 text-xs text-muted-foreground">Email не является каналом выдачи кода: уведомления подключаются отдельно, а сам код раскрывается только на защищённой странице заказа.</p>
            </CardContent>
          </Card>

        </TabsContent>

        <TabsContent value="media" className="space-y-6">
          <Card><CardHeader><CardTitle>Изображения товара</CardTitle><CardDescription>Одни изображения используются для всех регионов и номиналов.</CardDescription></CardHeader><CardContent className="space-y-4"><ImageField label="Витрина" hint="Широкое изображение карточки в каталоге. Рекомендуемое соотношение 16:9." value={draft.media.storefront} onChange={(value) => updateMedia('storefront', value)} /><ImageField label="Логотип" hint="Компактный знак бренда на карточке и в селекторах." value={draft.media.logo} onChange={(value) => updateMedia('logo', value)} /><ImageField label="Страница товара" hint="Главное изображение страницы товара." value={draft.media.productPage} onChange={(value) => updateMedia('productPage', value)} /></CardContent></Card>
          <Card><CardHeader><CardTitle>Галерея страницы товара</CardTitle><CardDescription>До 8 дополнительных изображений.</CardDescription></CardHeader><CardContent><div className="flex flex-col gap-2 sm:flex-row"><Input value={galleryUrl} onChange={(event) => setGalleryUrl(event.target.value)} placeholder="URL дополнительного изображения" /><Button type="button" onClick={addGalleryImage} disabled={draft.media.gallery.length >= 8}><Plus className="mr-2 h-4 w-4" />Добавить URL</Button><Button type="button" variant="outline" asChild disabled={draft.media.gallery.length >= 8}><label className="cursor-pointer"><Upload className="mr-2 h-4 w-4" />Загрузить несколько<input type="file" accept="image/*" multiple className="sr-only" onChange={(event) => { void uploadGalleryImages(event.target.files); event.target.value = ''; }} /></label></Button></div><p className="mt-2 text-xs text-muted-foreground">Добавлено {draft.media.gallery.length} из 8.</p>{draft.media.gallery.length ? <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{draft.media.gallery.map((image, index) => <div key={`${image}-${index}`} className="overflow-hidden rounded-xl border"><div className="aspect-video bg-muted"><img src={image} alt="" className="h-full w-full object-cover" /></div><div className="flex items-center justify-between gap-3 p-3"><span className="truncate text-xs text-muted-foreground">Изображение {index + 1}</span><Button type="button" variant="ghost" size="icon" onClick={() => setDraft((current) => current ? ({ ...current, media: { ...current.media, gallery: current.media.gallery.filter((_, itemIndex) => itemIndex !== index) } }) : current)}><Trash2 className="h-4 w-4" /><span className="sr-only">Удалить изображение</span></Button></div></div>)}</div> : <div className="mt-6 rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">Дополнительных изображений пока нет.</div>}</CardContent></Card>
        </TabsContent>

        <TabsContent value="pricing" className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Правило цены товара</CardTitle><CardDescription>Применяется ко всем рынкам и SKU, кроме SKU с ручной ценой.</CardDescription></CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-center justify-between rounded-xl border p-4"><div><Label htmlFor="custom-rule">Собственное правило</Label><p className="mt-1 text-xs text-muted-foreground">Отключите, чтобы наследовать глобальную настройку.</p></div><Switch id="custom-rule" checked={draft.pricingRule !== null} onCheckedChange={(checked) => setDraft((current) => current ? ({ ...current, pricingRule: checked ? { ...settings.globalPricing } : null }) : current)} /></div>
              <div className="grid gap-4 md:grid-cols-3"><div className="space-y-2"><Label>Стратегия</Label><Select value={effectiveRule.mode} disabled={!draft.pricingRule} onValueChange={(value) => updateRule({ mode: value as PricingMode })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="supplier-minimum">MIN WATA</SelectItem><SelectItem value="markup-percent">Наценка %</SelectItem><SelectItem value="fixed-markup">Фикс ₽</SelectItem></SelectContent></Select></div><div className="space-y-2"><Label htmlFor="rule-value">Значение</Label><Input id="rule-value" type="number" min="0" step="0.1" disabled={!draft.pricingRule || effectiveRule.mode === 'supplier-minimum'} value={effectiveRule.value} onChange={(event) => updateRule({ value: Math.max(0, Number(event.target.value)) })} /></div><div className="space-y-2"><Label>Округление вверх</Label><Select value={String(effectiveRule.roundingStep)} disabled={!draft.pricingRule} onValueChange={(value) => updateRule({ roundingStep: Number(value) as RoundingStep })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="1">До 1 ₽</SelectItem><SelectItem value="10">До 10 ₽</SelectItem><SelectItem value="50">До 50 ₽</SelectItem><SelectItem value="100">До 100 ₽</SelectItem></SelectContent></Select></div></div>
              {pricePreview ? <div className="grid gap-4 rounded-xl bg-muted/60 p-4 sm:grid-cols-4"><div><p className="text-xs text-muted-foreground">Закупка</p><p className="font-semibold">{formatRub(pricePreview.supplierPrice)}</p></div><div><p className="text-xs text-muted-foreground">MIN WATA</p><p className="font-semibold">{formatRub(pricePreview.supplierMinimum)}</p></div><div><p className="text-xs text-muted-foreground">Обычная цена</p><p className="font-semibold">{formatRub(pricePreview.regularPrice)}</p></div><div><p className="text-xs text-muted-foreground">Цена сейчас</p><p className="font-semibold text-primary">{formatRub(pricePreview.salePrice)}</p></div></div> : <div className="rounded-xl border border-dashed p-5 text-sm text-muted-foreground">Поставщик пока не передал SKU.</div>}
              {adjustedCount > 0 ? <p className="text-sm text-amber-700">Для {adjustedCount} SKU расчёт скорректирован до разрешённых WATA границ.</p> : null}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="variants">
          <Card>
            <CardHeader><CardTitle>Варианты выбора</CardTitle><CardDescription>Покупатель выбирает эти параметры внутри одной карточки товара. Код рынка WATA обозначает рынок активации, а не геолокацию покупателя. Исходные WATA ID сохранены.</CardDescription></CardHeader>
            <CardContent className="p-0">
              <div className="hidden lg:block">
                <Table className="w-full table-fixed [&_td]:px-4 [&_td]:py-3 [&_th]:px-4">
                  <TableHeader><TableRow><TableHead className="w-[34%]">Вариант</TableHead><TableHead className="w-[28%]">SKU и остаток</TableHead><TableHead className="w-[24%]">Источник WATA</TableHead><TableHead className="w-[14%] text-right">Витрина</TableHead></TableRow></TableHeader>
                  <TableBody>{variantRows.map(({ variant, available, offerCount, stock: variantStock, purchasable, visible, supplierIds }) => (
                    <TableRow key={variant.id}>
                      <TableCell>
                        <p className="truncate font-semibold" title={variant.label}>{variant.label}</p>
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">{getVariantDimensionLabel(variant.dimension)} · {variant.currencyCodes.length ? variant.currencyCodes.join(', ') : 'валюта не определена'}</p>
                      </TableCell>
                      <TableCell>{purchasable ? <><p className="font-medium">{available} из {offerCount} доступно</p><p className="text-xs text-muted-foreground">Остаток {variantStock.toLocaleString('ru-RU')} шт.</p></> : <><p className="font-medium text-destructive">Нет в наличии</p><p className="text-xs text-muted-foreground">Добавление на витрину недоступно</p></>}</TableCell>
                      <TableCell><SupplierIds ids={supplierIds} /></TableCell>
                      <TableCell className="text-right"><Switch checked={visible} disabled={!purchasable} onCheckedChange={(checked) => toggleVariant(variant.id, checked)} aria-label={purchasable ? `Показывать вариант ${variant.label}` : `Вариант ${variant.label} отсутствует в наличии`} /></TableCell>
                    </TableRow>
                  ))}</TableBody>
                </Table>
              </div>
              <div className="divide-y lg:hidden">
                {variantRows.map(({ variant, available, offerCount, stock: variantStock, purchasable, visible, supplierIds }) => (
                  <div key={variant.id} className="space-y-3 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0"><p className="truncate font-semibold" title={variant.label}>{variant.label}</p><p className="mt-0.5 text-xs text-muted-foreground">{getVariantDimensionLabel(variant.dimension)} · {variant.currencyCodes.length ? variant.currencyCodes.join(', ') : 'валюта не определена'}</p></div>
                      <Switch checked={visible} disabled={!purchasable} onCheckedChange={(checked) => toggleVariant(variant.id, checked)} aria-label={purchasable ? `Показывать вариант ${variant.label}` : `Вариант ${variant.label} отсутствует в наличии`} />
                    </div>
                    {purchasable ? <div className="grid grid-cols-2 gap-3 text-sm"><div><p className="text-xs text-muted-foreground">Доступность</p><p className="font-medium">{available} из {offerCount} SKU</p></div><div><p className="text-xs text-muted-foreground">Остаток</p><p className="font-medium">{variantStock.toLocaleString('ru-RU')} шт.</p></div></div> : <div><p className="text-sm font-medium text-destructive">Нет в наличии</p><p className="text-xs text-muted-foreground">Добавление на витрину недоступно</p></div>}
                    <div><p className="mb-1.5 text-xs text-muted-foreground">Источник WATA</p><SupplierIds ids={supplierIds} /></div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="skus">
          <Card>
            <CardHeader className="gap-4 sm:flex-row sm:items-end sm:justify-between"><div><CardTitle>SKU поставщика</CardTitle><CardDescription>Ручная цена SKU имеет наивысший приоритет. Каждый SKU остаётся связан со своим вариантом и WATA ID.</CardDescription></div><div className="w-full sm:w-60"><Label className="sr-only">Фильтр по варианту</Label><Select value={selectedVariantId} onValueChange={(value) => { setSelectedVariantId(value); setSkuPage(1); }}><SelectTrigger><SelectValue placeholder="Все варианты" /></SelectTrigger><SelectContent><SelectItem value="all">Все варианты</SelectItem>{product.variants.map((variant) => <SelectItem key={variant.id} value={variant.id}>{variant.label}</SelectItem>)}</SelectContent></Select></div></CardHeader>
            <CardContent className="p-0">
              <div className="hidden xl:block">
                <Table className="w-full table-fixed [&_td]:px-4 [&_td]:py-3 [&_th]:px-4"><TableHeader><TableRow><TableHead className="w-[25%]">SKU</TableHead><TableHead className="w-[18%]">Вариант</TableHead><TableHead className="w-[17%]">Наличие</TableHead><TableHead className="w-[16%]">Цена WATA</TableHead><TableHead className="w-[24%]">Цена витрины</TableHead></TableRow></TableHeader><TableBody>{visibleOffers.map(({ voucher, variant, category }) => { const price = calculateVoucherPrice(voucher, settings.globalPricing, draft); return <TableRow key={`${category.details.categoryId}:${voucher.id}`}><TableCell><p className="truncate font-medium" title={voucher.name}>{voucher.name}</p><p className="text-xs text-muted-foreground">SKU {voucher.id} · WATA {category.details.categoryId}</p></TableCell><TableCell><p className="truncate font-medium" title={variant.label}>{variant.label}</p><p className="text-xs text-muted-foreground">{getVariantDimensionLabel(variant.dimension)}</p></TableCell><TableCell><Badge variant={voucher.isAvailable ? 'secondary' : 'destructive'}>{voucher.isAvailable ? 'Доступен' : 'Недоступен'}</Badge><p className={`mt-1 text-xs ${voucher.stock <= 0 ? 'text-destructive' : 'text-muted-foreground'}`}>{voucher.stock.toLocaleString('ru-RU')} шт.</p></TableCell><TableCell><p className="font-medium">{formatRub(voucher.price)}</p><p className="text-xs text-muted-foreground">MIN {formatRub(voucher.minPrice)}</p></TableCell><TableCell><div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3"><Input className="h-9" type="number" min={voucher.minPrice} max={voucher.minPrice * 2} step="0.01" value={draft.skuSalePrices[voucher.id] ?? ''} onChange={(event) => setDraft((current) => { if (!current) return current; const next = { ...current.skuSalePrices }; if (event.target.value) next[voucher.id] = Number(event.target.value); else delete next[voucher.id]; return { ...current, skuSalePrices: next }; })} aria-label={`Ручная цена ${voucher.name}`} placeholder="Авто" /><div className="text-right"><p className="whitespace-nowrap font-semibold text-primary">{formatRub(price.salePrice)}</p><p className="whitespace-nowrap text-xs text-muted-foreground">{price.source === 'sku-manual' ? 'ручная' : price.source === 'product' ? 'по товару' : 'глобальная'}</p></div></div></TableCell></TableRow>; })}</TableBody></Table>
              </div>
              <div className="divide-y xl:hidden">
                {visibleOffers.map(({ voucher, variant, category }) => {
                  const price = calculateVoucherPrice(voucher, settings.globalPricing, draft);
                  return (
                    <div key={`${category.details.categoryId}:${voucher.id}`} className="space-y-4 p-4">
                      <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate font-semibold" title={voucher.name}>{voucher.name}</p><p className="mt-0.5 text-xs text-muted-foreground">SKU {voucher.id} · WATA {category.details.categoryId}</p></div><Badge variant={voucher.isAvailable ? 'secondary' : 'destructive'}>{voucher.isAvailable ? 'Доступен' : 'Недоступен'}</Badge></div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-4"><div className="min-w-0"><p className="text-xs text-muted-foreground">Вариант</p><p className="truncate font-medium" title={variant.label}>{variant.label}</p></div><div><p className="text-xs text-muted-foreground">Остаток</p><p className={voucher.stock <= 0 ? 'font-medium text-destructive' : 'font-medium'}>{voucher.stock.toLocaleString('ru-RU')} шт.</p></div><div><p className="text-xs text-muted-foreground">Закупка</p><p className="font-medium">{formatRub(voucher.price)}</p></div><div><p className="text-xs text-muted-foreground">MIN WATA</p><p className="font-medium">{formatRub(voucher.minPrice)}</p></div></div>
                      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end"><div className="space-y-1.5"><Label htmlFor={`sku-price-${voucher.id}`} className="text-xs">Ручная цена</Label><Input id={`sku-price-${voucher.id}`} type="number" min={voucher.minPrice} max={voucher.minPrice * 2} step="0.01" value={draft.skuSalePrices[voucher.id] ?? ''} onChange={(event) => setDraft((current) => { if (!current) return current; const next = { ...current.skuSalePrices }; if (event.target.value) next[voucher.id] = Number(event.target.value); else delete next[voucher.id]; return { ...current, skuSalePrices: next }; })} placeholder="Рассчитать автоматически" /></div><div className="sm:min-w-32 sm:text-right"><p className="text-xs text-muted-foreground">К оплате</p><p className="font-semibold text-primary">{formatRub(price.salePrice)}</p><p className="text-xs text-muted-foreground">{price.source === 'sku-manual' ? 'ручная' : price.source === 'product' ? 'правило товара' : 'глобальное правило'}</p></div></div>
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center justify-between border-t p-4"><p className="text-sm text-muted-foreground">{filteredOffers.length} SKU · страница {safeSkuPage} из {skuPageCount}</p><div className="flex gap-2"><Button variant="outline" size="sm" disabled={safeSkuPage <= 1} onClick={() => setSkuPage((value) => value - 1)}>Назад</Button><Button variant="outline" size="sm" disabled={safeSkuPage >= skuPageCount} onClick={() => setSkuPage((value) => value + 1)}>Далее</Button></div></div>
            </CardContent>
          </Card>
        </TabsContent>
        <div className="mt-8 flex flex-col-reverse gap-3 border-t pt-6 sm:flex-row sm:items-center sm:justify-between"><Button variant="ghost" onClick={reset}><RotateCcw className="mr-2 h-4 w-4" />Сбросить настройки товара</Button><Button size="lg" onClick={save}><Save className="mr-2 h-4 w-4" />{saveLabel}</Button></div>
      </AdminLayout>
    </Tabs>
  );
}
