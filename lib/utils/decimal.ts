function decimalParts(value: string): { whole: bigint; scale: number } {
  if (!/^\d+(?:\.\d+)?$/.test(value)) {
    throw new Error(`Invalid decimal amount: ${value}`);
  }
  const [wholePart, fraction = ""] = value.split(".");
  return {
    whole: BigInt(`${wholePart}${fraction}`),
    scale: fraction.length,
  };
}

function atScale(value: string, scale: number) {
  const parts = decimalParts(value);
  return parts.whole * BigInt(10) ** BigInt(scale - parts.scale);
}

function fromScaled(value: bigint, scale: number) {
  const divisor = BigInt(10) ** BigInt(scale);
  const whole = value / divisor;
  const fraction = (value % divisor).toString().padStart(scale, "0").replace(/0+$/, "");
  return fraction ? `${whole}.${fraction}` : whole.toString();
}

export function formatDecimalAmount(value: string) {
  if (!/^-?\d+(?:\.\d+)?$/.test(value)) {
    throw new Error(`Invalid decimal amount: ${value}`);
  }
  const isNegative = value.startsWith("-");
  const [wholePart, fraction = ""] = (isNegative ? value.slice(1) : value).split(".");
  const whole = wholePart.replace(/^0+(?=\d)/, "");
  const groupedWhole = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const trimmedFraction = fraction.replace(/0+$/, "");
  const amount = trimmedFraction ? `${groupedWhole}.${trimmedFraction}` : groupedWhole;
  return isNegative ? `-${amount}` : amount;
}

export function sumDecimalStrings(values: string[]) {
  const scale = values.reduce((max, value) => Math.max(max, decimalParts(value).scale), 0);
  const total = values.reduce((sum, value) => sum + atScale(value, scale), BigInt(0));
  return fromScaled(total, scale);
}

export function subtractDecimalStrings(left: string, right: string) {
  const scale = Math.max(decimalParts(left).scale, decimalParts(right).scale);
  const result = atScale(left, scale) - atScale(right, scale);
  return fromScaled(result < BigInt(0) ? BigInt(0) : result, scale);
}

export function getProgressPercent(received: string, target: string) {
  const scale = Math.max(decimalParts(received).scale, decimalParts(target).scale);
  const receivedValue = atScale(received, scale);
  const targetValue = atScale(target, scale);
  if (targetValue <= BigInt(0)) return 0;
  if (receivedValue >= targetValue) return 100;
  return Number((receivedValue * BigInt(100)) / targetValue);
}
