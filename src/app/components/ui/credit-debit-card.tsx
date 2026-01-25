import * as React from "react";
import { cn } from "./utils";
import type { CardType } from "@/app/utils/cardUtils";
import { getCardType, formatCardDisplay, formatExpiryDisplay } from "@/app/utils/cardUtils";
import { CreditCard } from "lucide-react";

export interface FlippableCreditCardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onFlip"> {
  cardholderName: string;
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  /** Controlled flip (e.g. when CVV focused). */
  flipped?: boolean;
  /** Callback when user toggles flip (click or hover). */
  onFlippedChange?: (flipped: boolean) => void;
  /** Card type override; otherwise derived from cardNumber. */
  cardType?: CardType;
}

function CardLogo({ type, className }: { type: CardType; className?: string }) {
  if (type === "visa") {
    return (
      <svg className={cn("h-8 w-12", className)} viewBox="0 0 48 16" fill="none" aria-hidden>
        <text x="0" y="12" fill="currentColor" fontSize="12" fontWeight="bold" fontFamily="system-ui,sans-serif">
          VISA
        </text>
      </svg>
    );
  }
  if (type === "mastercard") {
    return (
      <svg className={cn("h-8 w-14", className)} viewBox="0 0 28 18" aria-hidden>
        <circle cx="10" cy="9" r="7" fill="#eb001b" />
        <circle cx="18" cy="9" r="7" fill="#f79e1b" />
      </svg>
    );
  }
  if (type === "mir") {
    return (
      <svg className={cn("h-8 w-12", className)} viewBox="0 0 48 16" fill="none" aria-hidden>
        <text x="0" y="12" fill="currentColor" fontSize="11" fontWeight="bold" fontFamily="system-ui,sans-serif">
          МИР
        </text>
      </svg>
    );
  }
  if (type === "maestro") {
    return (
      <svg className={cn("h-8 w-14", className)} viewBox="0 0 48 16" fill="none" aria-hidden>
        <text x="0" y="12" fill="currentColor" fontSize="10" fontWeight="bold" fontFamily="system-ui,sans-serif">
          Maestro
        </text>
      </svg>
    );
  }
  return <CreditCard className={cn("h-9 w-9", className)} aria-hidden />;
}

const FlippableCreditCard = React.forwardRef<HTMLDivElement, FlippableCreditCardProps>(
  (
    {
      className,
      cardholderName,
      cardNumber,
      expiryDate,
      cvv,
      flipped: controlledFlipped,
      onFlippedChange,
      cardType: cardTypeProp,
      ...props
    },
    ref
  ) => {
    const [hoverFlipped, setHoverFlipped] = React.useState(false);
    const type = cardTypeProp ?? getCardType(cardNumber);
    const showBack = hoverFlipped || (controlledFlipped ?? false);

    const handleClick = () => {
      if (onFlippedChange) onFlippedChange(!(controlledFlipped ?? false));
    };

    return (
      <div
        className={cn("group h-40 w-64 [perspective:1000px]", className)}
        ref={ref}
        role="button"
        tabIndex={0}
        onClick={handleClick}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleClick();
          }
        }}
        onMouseEnter={() => setHoverFlipped(true)}
        onMouseLeave={() => setHoverFlipped(false)}
        aria-label="Перевернуть карту"
        {...props}
      >
        <div
          className={cn(
            "relative h-full w-full rounded-xl shadow-xl transition-transform duration-500 [transform-style:preserve-3d]",
            showBack && "[transform:rotateY(180deg)]"
          )}
        >
          {/* Front */}
          <div className="absolute inset-0 rounded-xl border border-border bg-gradient-to-br from-neutral-800 to-neutral-900 text-white [backface-visibility:hidden]">
            <div className="relative flex h-full flex-col justify-between p-4">
              <div className="flex items-start justify-between">
                <CardLogo type={type} className="text-white" />
                <p className="font-mono text-[10px] font-bold tracking-widest opacity-90">
                  {type === "mir" ? "МИР" : type === "visa" ? "VISA" : type === "mastercard" ? "MASTERCARD" : type === "maestro" ? "MAESTRO" : "CARD"}
                </p>
              </div>
              <div className="text-center font-mono text-sm tracking-[0.2em]">
                {formatCardDisplay(cardNumber)}
              </div>
              <div className="flex items-end justify-between">
                <div className="text-left">
                  <p className="text-[10px] font-semibold uppercase opacity-70">Держатель</p>
                  <p className="font-mono text-xs font-medium truncate max-w-[100px]">
                    {cardholderName || "ИМЯ ФАМИЛИЯ"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-semibold uppercase opacity-70">Срок</p>
                  <p className="font-mono text-xs font-medium">{formatExpiryDisplay(expiryDate)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Back */}
          <div className="absolute inset-0 rounded-xl border border-border bg-gradient-to-br from-neutral-800 to-neutral-900 text-white [backface-visibility:hidden] [transform:rotateY(180deg)]">
            <div className="flex h-full flex-col">
              <div className="mt-6 h-10 w-full bg-neutral-950" />
              <div className="mx-4 mt-4 flex justify-end">
                <div className="flex h-8 w-full max-w-[200px] items-center justify-end rounded bg-neutral-200/20 pr-3">
                  <p className="font-mono text-sm text-white">{cvv || "•••"}</p>
                </div>
              </div>
              <p className="self-end pr-4 text-[10px] font-semibold uppercase opacity-70">CVV</p>
              <div className="mt-auto flex justify-end p-4">
                <CardLogo type={type} className="text-white/80" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
);
FlippableCreditCard.displayName = "FlippableCreditCard";

export { FlippableCreditCard };
