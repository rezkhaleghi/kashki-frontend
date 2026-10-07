import {
  formatDecimalAmount,
  getProgressPercent,
  subtractDecimalStrings,
} from "@/lib/utils/decimal";

export function WishProgress({
  received,
  target,
  currency,
}: {
  received: string | null;
  target: string;
  currency: string;
}) {
  const current = received ?? "0";
  const progress = getProgressPercent(current, target);
  const remaining = subtractDecimalStrings(target, current);
  const formattedCurrent = formatDecimalAmount(current);
  const formattedTarget = formatDecimalAmount(target);
  const formattedRemaining = formatDecimalAmount(remaining);

  return (
    <div className="mt-3 w-full max-w-sm">
      <div className="flex flex-wrap justify-between gap-2 text-sm">
        <p className="font-medium text-slate-800">{formattedCurrent} / {formattedTarget} {currency}</p>
        <p className="text-slate-500">{formattedRemaining} {currency} remaining</p>
      </div>
      <div
        role="progressbar"
        aria-label="Wish funding progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progress}
        className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"
      >
        <div className="h-full rounded-full bg-violet-600 transition-[width]" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}
