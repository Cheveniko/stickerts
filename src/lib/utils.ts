import { clsx, type ClassValue } from "clsx";
import { dinero, toDecimal } from "dinero.js";
import * as dineroCurrencies from "dinero.js/currencies";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChild<T> = T extends { child?: any } ? Omit<T, "child"> : T;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChildren<T> = T extends { children?: any }
  ? Omit<T, "children">
  : T;
export type WithoutChildrenOrChild<T> = WithoutChildren<WithoutChild<T>>;
export type WithElementRef<T, U extends HTMLElement = HTMLElement> = T & {
  ref?: U | null;
};

type FormatMoneyOptions = {
  amount: number;
  currency: string;
  currencySymbol?: string | null;
  locale?: string;
};

function getDineroCurrency(currency: string) {
  const code = currency.toUpperCase() as keyof typeof dineroCurrencies;

  return dineroCurrencies[code] ?? null;
}

export function formatMoney({
  amount,
  currency,
  currencySymbol,
  locale = "es",
}: FormatMoneyOptions) {
  const currencyCode = currency.toUpperCase();
  const dineroCurrency = getDineroCurrency(currencyCode);

  const decimalAmount = Number(
    toDecimal(
      dinero({
        amount,
        currency: dineroCurrency,
      }),
    ),
  );

  const formattedAmount = new Intl.NumberFormat(locale, {
    maximumFractionDigits: dineroCurrency.exponent,
    minimumFractionDigits: 0,
  }).format(decimalAmount);

  return currencySymbol
    ? `${currencySymbol}${formattedAmount} ${currencyCode}`
    : `${formattedAmount} ${currencyCode}`;
}

export function formatCityName(cityName: string, flagEmoji?: string) {
  return flagEmoji ? `${flagEmoji} ${cityName}` : cityName;
}

export function getInitial(name: string) {
  return name.trim()[0].toUpperCase();
}
