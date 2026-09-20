import { cn } from "@/lib/cn";
import { formatMoney, type Currency } from "@/lib/money";

const SIZES = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-2xl",
  xl: "text-3xl sm:text-4xl",
} as const;

// Monospace, tabular, left-to-right amount: "4 500 MRU" or "3 200,00 ₽".
export function MoneyAmount({
  value,
  currency,
  intl,
  size = "md",
  className,
}: {
  value: number;
  currency: Currency;
  intl: string;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  return (
    <span dir="ltr" className={cn("money", SIZES[size], className)}>
      {formatMoney(value, currency, intl)}
    </span>
  );
}
