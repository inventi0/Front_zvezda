import { cn } from './utils';

/** Градиентный фон: бледно‑зелёный верх → белый низ. Зафиксирован в самом верху (fixed). */
export function GradientBackground({
  className,
  /** Фиксированный на viewport — заливает весь экран, в т.ч. область за хедером. */
  fixed = false,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { fixed?: boolean }) {
  return (
    <div
      aria-hidden
      className={cn(
        'z-0 w-full',
        fixed ? 'fixed inset-0 top-0' : 'absolute inset-0 min-h-full',
        className
      )}
      style={{
        background:
          'linear-gradient(to bottom, #b8d4c8 0%, #d4e6df 25%, #e8f2ee 50%, #f4f9f7 75%, #ffffff 100%)',
      }}
      {...props}
    />
  );
}
