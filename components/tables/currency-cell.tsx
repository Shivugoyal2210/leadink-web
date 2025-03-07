"use client";

import { useEffect, useState } from "react";
import { useCurrency } from "@/contexts/currency-context";

interface CurrencyCellProps {
  value: number;
}

export function CurrencyCell({ value }: CurrencyCellProps) {
  const [mounted, setMounted] = useState(false);
  const { formatCurrency, currency } = useCurrency();

  // Get the currency symbol
  const currencySymbol = currency === "INR" ? "₹" : "$";

  // Wait until component is mounted
  useEffect(() => {
    setMounted(true);
  }, []);

  // Format for display based on mounted state
  const formatAmount = (amount: number) => {
    if (!mounted) {
      // Default formatting for server-side rendering
      return `${currencySymbol} ${amount.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    }
    return formatCurrency(amount);
  };

  return <>{formatAmount(value)}</>;
}
