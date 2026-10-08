import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Loader2, Search, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/app/components/ui/input';
import { Button } from '@/app/components/ui/button';
import { catalogSearchService } from '@/app/services/catalogSearch.service';
import type { Product } from '@/app/types';
import { getProductLogo } from '@/app/utils/productAssets';
import { formatPrice } from '@/app/utils/orderCalculation';
import { cn } from '@/app/components/ui/utils';

interface CatalogSearchProps {
  autoFocus?: boolean;
  mobile?: boolean;
  onNavigate?: () => void;
}

function getMinimumProductPrice(product: Product): number | undefined {
  const prices = product.denominations
    .map((denomination) => denomination.price)
    .filter((price) => Number.isFinite(price) && price > 0);
  return prices.length ? Math.min(...prices) : undefined;
}

export default function CatalogSearch({
  autoFocus = false,
  mobile = false,
  onNavigate,
}: CatalogSearchProps) {
  const navigate = useNavigate();
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchFailed, setSearchFailed] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const normalizedQuery = query.trim().replace(/\s+/g, ' ');
  const canSearch = normalizedQuery.length >= 2;
  const activeResultId = activeIndex >= 0 ? `${listId}-option-${activeIndex}` : undefined;

  useEffect(() => {
    if (!canSearch) {
      setResults([]);
      setLoading(false);
      setSearchFailed(false);
      setActiveIndex(-1);
      return;
    }

    let active = true;
    setLoading(true);
    setSearchFailed(false);
    setResults([]);
    setActiveIndex(-1);
    const timer = window.setTimeout(() => {
      void catalogSearchService
        .search(normalizedQuery)
        .then((products) => {
          if (!active) return;
          setResults(products);
          setActiveIndex(products.length ? 0 : -1);
        })
        .catch(() => {
          if (!active) return;
          setResults([]);
          setSearchFailed(true);
          setActiveIndex(-1);
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }, 220);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [canSearch, normalizedQuery]);

  useEffect(() => {
    if (mobile) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [mobile]);

  const statusText = useMemo(() => {
    if (!canSearch) return 'Введите не менее двух символов';
    if (loading) return 'Ищем товары…';
    if (searchFailed) return 'Не удалось выполнить поиск';
    if (!results.length) return 'Ничего не нашли';
    return '';
  }, [canSearch, loading, results.length, searchFailed]);

  const openProduct = (product: Product) => {
    setOpen(false);
    setQuery('');
    onNavigate?.();
    navigate(`/product/${product.slug}`);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      setOpen(false);
      return;
    }
    if (!results.length) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((current) => (current + 1) % results.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((current) => (current <= 0 ? results.length - 1 : current - 1));
    } else if (event.key === 'Enter' && activeIndex >= 0) {
      event.preventDefault();
      openProduct(results[activeIndex]);
    }
  };

  const showPanel = mobile || (open && query.length > 0);

  return (
    <div ref={rootRef} className="relative w-full">
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          autoFocus={autoFocus}
          type="search"
          role="combobox"
          aria-label="Поиск товаров"
          aria-autocomplete="list"
          aria-expanded={showPanel && canSearch}
          aria-controls={listId}
          aria-activedescendant={activeResultId}
          value={query}
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Найти товар"
          className="h-10 rounded-xl border-transparent bg-muted/70 pl-10 pr-10 focus-visible:border-primary md:h-11"
        />
        {loading ? (
          <Loader2 className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        ) : query ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Очистить поиск"
            onClick={() => {
              setQuery('');
              setResults([]);
            }}
            className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2 rounded-full"
          >
            <X className="h-4 w-4" />
          </Button>
        ) : null}
      </div>

      {showPanel ? (
        <div
          id={listId}
          role="listbox"
          aria-label="Результаты поиска"
          className={cn(
            'overflow-hidden bg-popover text-popover-foreground',
            mobile
              ? 'mt-3 rounded-xl border'
              : 'absolute inset-x-0 top-full z-50 mt-2 rounded-xl border shadow-lg'
          )}
        >
          {statusText ? (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">{statusText}</p>
          ) : (
            <div className="max-h-[min(420px,60vh)] overflow-y-auto p-1.5">
              {results.map((product, index) => {
                const minimumPrice = getMinimumProductPrice(product);
                return (
                  <button
                    key={product.id}
                    id={`${listId}-option-${index}`}
                    type="button"
                    role="option"
                    aria-selected={activeIndex === index}
                    onMouseEnter={() => setActiveIndex(index)}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => openProduct(product)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors',
                      activeIndex === index ? 'bg-muted' : 'hover:bg-muted/60'
                    )}
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-background p-1.5">
                      <img
                        src={product.logo || getProductLogo(product.slug)}
                        alt=""
                        className="h-full w-full object-contain"
                      />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">{product.name}</span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {product.type === 'top-up'
                          ? 'Пополнение'
                          : product.type === 'gift-card'
                            ? 'Подарочная карта'
                            : 'Цифровой код'}
                      </span>
                    </span>
                    {minimumPrice != null ? (
                      <span className="shrink-0 text-sm font-semibold text-primary">
                        от {formatPrice(minimumPrice)}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
