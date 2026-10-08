import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowRight, Save, ShieldCheck, Undo2 } from 'lucide-react';
import { toast } from 'sonner';
import AdminLayout from '@/app/components/AdminLayout';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table';
import {
  calculateVoucherPrice,
  formatRub,
  getProductForCategoryId,
  loadCatalogSettings,
  saveGlobalPricing,
  supplierCatalog,
  type PricingMode,
  type PricingRule,
  type RoundingStep,
} from '@/app/admin/catalog';

interface PricingDraft {
  mode: PricingMode;
  value: string;
  roundingStep: RoundingStep;
}

const toDraft = (rule: PricingRule): PricingDraft => ({
  mode: rule.mode,
  value: String(rule.value),
  roundingStep: rule.roundingStep,
});

const rulesEqual = (left: PricingRule, right: PricingRule) => (
  left.mode === right.mode
  && left.value === right.value
  && left.roundingStep === right.roundingStep
);

export default function AdminPricing() {
  const [settings, setSettings] = useState(loadCatalogSettings);
  const [draft, setDraft] = useState<PricingDraft>(() => toDraft(settings.globalPricing));

  const parsedValue = Number(draft.value.replace(',', '.'));
  const valueError = draft.mode !== 'supplier-minimum' && (
    draft.value.trim() === '' || !Number.isFinite(parsedValue) || parsedValue < 0
  )
    ? 'Введите число не меньше нуля'
    : null;
  const draftRule = useMemo<PricingRule | null>(() => {
    if (valueError) return null;
    return {
      mode: draft.mode,
      value: draft.mode === 'supplier-minimum' ? 0 : parsedValue,
      roundingStep: draft.roundingStep,
    };
  }, [draft.mode, draft.roundingStep, parsedValue, valueError]);
  const previewRule = draftRule ?? settings.globalPricing;
  const isDirty = draftRule
    ? !rulesEqual(draftRule, settings.globalPricing)
    : true;

  const overrideCount = Object.values(settings.products).filter((item) => item.pricingRule !== null).length;
  const manualSkuCount = Object.values(settings.products).reduce(
    (total, item) => total + Object.keys(item.skuSalePrices).length,
    0,
  );

  const globalSkuRows = useMemo(() => supplierCatalog.flatMap((category) => {
    const product = getProductForCategoryId(category.details.categoryId);
    const override = product ? settings.products[product.id] : undefined;
    if (override?.pricingRule) return [];
    return category.vouchers
      .filter((voucher) => typeof override?.skuSalePrices[voucher.id] !== 'number')
      .map((voucher) => ({
        voucher,
        categoryName: category.details.categoryName,
        override,
      }));
  }), [settings.products]);

  const impact = useMemo(() => {
    let changedCount = 0;
    let adjustedCount = 0;
    let differenceTotal = 0;

    globalSkuRows.forEach(({ voucher, override }) => {
      const current = calculateVoucherPrice(voucher, settings.globalPricing, override);
      const next = calculateVoucherPrice(voucher, previewRule, override);
      if (current.salePrice !== next.salePrice) changedCount += 1;
      if (next.adjustedToSupplierBounds) adjustedCount += 1;
      differenceTotal += next.salePrice - next.supplierPrice;
    });

    return {
      affectedCount: globalSkuRows.length,
      changedCount,
      adjustedCount,
      averageDifference: globalSkuRows.length > 0 ? differenceTotal / globalSkuRows.length : 0,
    };
  }, [globalSkuRows, previewRule, settings.globalPricing]);

  const samples = useMemo(() => globalSkuRows.slice(0, 8), [globalSkuRows]);

  const save = () => {
    if (!draftRule) {
      toast.error(valueError ?? 'Проверьте параметры правила');
      return;
    }

    try {
      const next = saveGlobalPricing(draftRule);
      setSettings(next);
      setDraft(toDraft(next.globalPricing));
      toast.success('Глобальное правило применено к каталогу');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Не удалось сохранить правило цены');
    }
  };

  const reset = () => {
    setDraft(toDraft(settings.globalPricing));
    toast.info('Несохранённые изменения отменены');
  };

  const actions = (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={reset}
        disabled={!isDirty}
        aria-label="Отменить изменения"
        className="h-9 w-9 px-0 sm:w-auto sm:px-3"
      >
        <Undo2 className="h-4 w-4 sm:mr-2" />
        <span className="hidden sm:inline">Отменить</span>
      </Button>
      <Button
        size="sm"
        onClick={save}
        disabled={!isDirty || Boolean(valueError)}
        aria-label="Применить правило"
        className="h-9 w-9 px-0 sm:w-auto sm:px-3"
      >
        <Save className="h-4 w-4 sm:mr-2" />
        <span className="hidden sm:inline">Применить</span>
      </Button>
    </div>
  );

  return (
    <AdminLayout
      title="Ценообразование"
      description="Глобальное правило каталога с живым предпросмотром и безопасными ограничениями поставщика."
      actions={actions}
    >
      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Под глобальным правилом', value: impact.affectedCount.toLocaleString('ru-RU'), note: 'SKU без переопределений' },
          { label: 'Изменится после сохранения', value: draftRule ? impact.changedCount.toLocaleString('ru-RU') : '—', note: 'по сравнению с текущим правилом' },
          { label: 'Ограничено WATA', value: draftRule ? impact.adjustedCount.toLocaleString('ru-RU') : '—', note: 'цена приведена к диапазону' },
          { label: 'Средняя разница к закупке', value: draftRule ? formatRub(impact.averageDifference) : '—', note: 'до комиссий и расходов' },
        ].map((item) => (
          <Card key={item.label} className="gap-0">
            <CardContent className="p-4">
              <p className="text-xs font-medium text-muted-foreground">{item.label}</p>
              <p className="mt-1 text-2xl font-bold">{item.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{item.note}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(330px,.85fr)]">
        <Card className="min-w-0">
          <CardHeader className="gap-2">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <CardTitle>Глобальное правило</CardTitle>
              <Badge variant={isDirty ? 'secondary' : 'outline'}>
                {isDirty ? 'Есть несохранённые изменения' : 'Правило сохранено'}
              </Badge>
            </div>
            <CardDescription>
              Предпросмотр обновляется сразу. Каталог начнёт использовать новое правило только после нажатия «Применить».
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Стратегия</Label>
                <Select
                  value={draft.mode}
                  onValueChange={(value) => setDraft((current) => ({ ...current, mode: value as PricingMode }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="supplier-minimum">MIN WATA</SelectItem>
                    <SelectItem value="markup-percent">Наценка %</SelectItem>
                    <SelectItem value="fixed-markup">Фикс ₽</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="global-value">
                  {draft.mode === 'markup-percent' ? 'Наценка, %' : draft.mode === 'fixed-markup' ? 'Наценка, ₽' : 'Значение'}
                </Label>
                <Input
                  id="global-value"
                  type="text"
                  inputMode="decimal"
                  disabled={draft.mode === 'supplier-minimum'}
                  value={draft.mode === 'supplier-minimum' ? 'Не требуется' : draft.value}
                  aria-invalid={Boolean(valueError)}
                  onChange={(event) => setDraft((current) => ({ ...current, value: event.target.value }))}
                />
                {valueError && <p className="text-xs text-destructive">{valueError}</p>}
              </div>
              <div className="space-y-2">
                <Label>Округление вверх</Label>
                <Select
                  value={String(draft.roundingStep)}
                  onValueChange={(value) => setDraft((current) => ({ ...current, roundingStep: Number(value) as RoundingStep }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">До 1 ₽</SelectItem>
                    <SelectItem value="10">До 10 ₽</SelectItem>
                    <SelectItem value="50">До 50 ₽</SelectItem>
                    <SelectItem value="100">До 100 ₽</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-950">
              <div className="flex gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />
                <div>
                  <p className="font-semibold">Ограничения применяются автоматически</p>
                  <p className="mt-1 leading-6">
                    Итоговая цена VoucherCode не опускается ниже minPrice и не превышает minPrice × 2. Если правило выходит за диапазон, расчёт явно отмечается как скорректированный.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
              <p className="text-xs text-muted-foreground">
                {settings.globalPricingUpdatedAt
                  ? `Последнее применение: ${new Date(settings.globalPricingUpdatedAt).toLocaleString('ru-RU')}`
                  : 'Используется исходное правило проекта'}
              </p>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button className="w-full sm:w-auto" variant="outline" onClick={reset} disabled={!isDirty}>Отменить</Button>
                <Button className="w-full sm:w-auto" onClick={save} disabled={!isDirty || Boolean(valueError)}>Применить правило</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>Приоритет правил</CardTitle>
            <CardDescription>Более точная настройка всегда перекрывает общую.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              ['1', 'Ручная цена SKU', `${manualSkuCount} настроено`],
              ['2', 'Правило товара', `${overrideCount} настроено`],
              ['3', 'Глобальное правило', `${impact.affectedCount.toLocaleString('ru-RU')} SKU`],
            ].map(([step, title, description]) => (
              <div key={step} className="flex gap-3 rounded-xl border p-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">{step}</span>
                <div>
                  <p className="font-semibold">{title}</p>
                  <p className="text-xs text-muted-foreground">{description}</p>
                </div>
              </div>
            ))}
            <Button asChild variant="outline" className="w-full">
              <Link to="/admin/products">Настроить отдельные товары <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6 overflow-hidden">
        <CardHeader>
          <CardTitle>Предпросмотр изменений</CardTitle>
          <CardDescription>
            Примеры SKU, которые используют глобальное правило. Текущая цена остаётся неизменной до сохранения.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table className="min-w-[820px] [&_td]:px-5 [&_td]:py-3 [&_th]:px-5">
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Закупка / пределы</TableHead>
                <TableHead>Текущая цена</TableHead>
                <TableHead>После изменения</TableHead>
                <TableHead>Разница</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {samples.map(({ voucher, categoryName, override }) => {
                const current = calculateVoucherPrice(voucher, settings.globalPricing, override);
                const next = calculateVoucherPrice(voucher, previewRule, override);
                const difference = next.salePrice - current.salePrice;
                return (
                  <TableRow key={voucher.id}>
                    <TableCell>
                      <p className="font-medium">{voucher.name}</p>
                      <p className="max-w-64 truncate text-xs text-muted-foreground">{categoryName} · ID {voucher.id}</p>
                    </TableCell>
                    <TableCell>
                      <p>{formatRub(next.supplierPrice)}</p>
                      <p className="text-xs text-muted-foreground">{formatRub(next.supplierMinimum)} — {formatRub(next.maximumAllowed)}</p>
                    </TableCell>
                    <TableCell>{formatRub(current.salePrice)}</TableCell>
                    <TableCell>
                      <p className="font-semibold text-primary">{draftRule ? formatRub(next.salePrice) : '—'}</p>
                      {draftRule && next.adjustedToSupplierBounds && (
                        <Badge variant="outline" className="mt-1 text-amber-700">
                          <AlertTriangle className="mr-1 h-3 w-3" />Скорректировано
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className={difference > 0 ? 'text-emerald-700' : difference < 0 ? 'text-destructive' : 'text-muted-foreground'}>
                      {draftRule ? `${difference > 0 ? '+' : ''}${formatRub(difference)}` : '—'}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
