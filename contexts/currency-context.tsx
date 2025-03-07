"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

export type Currency = "USD" | "INR";

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  formatCurrency: (amount: number) => string;
}

const CurrencyContext = createContext<CurrencyContextType>({
  currency: "USD",
  setCurrency: () => {},
  formatCurrency: () => "",
});

export const useCurrency = () => useContext(CurrencyContext);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  // Read from localStorage if available (client-side only)
  const [currency, setCurrency] = useState<Currency>("USD");

  // On mount, load the saved preference
  useEffect(() => {
    const savedCurrency = localStorage.getItem("currency") as Currency;
    if (savedCurrency) {
      setCurrency(savedCurrency);
    }
  }, []);

  // Save to localStorage when changed
  const handleSetCurrency = (newCurrency: Currency) => {
    setCurrency(newCurrency);
    localStorage.setItem("currency", newCurrency);
  };

  // Format numbers according to currency
  const formatCurrency = (amount: number): string => {
    if (currency === "INR") {
      // Indian formatting: ₹ XX,XX,XXX.XX
      return "₹ " + formatIndianCurrency(amount);
    } else {
      // Default USD formatting: $ X,XXX.XX
      return (
        "$ " +
        amount.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
      );
    }
  };

  // Helper for Indian comma system
  const formatIndianCurrency = (num: number): string => {
    const numStr = num.toFixed(2);
    const parts = numStr.split(".");
    const integerPart = parts[0];
    const decimalPart = parts[1];

    // Add commas for thousands
    let formattedInteger = "";
    let firstGroup = true;

    // Process from right to left
    for (let i = integerPart.length - 1, count = 0; i >= 0; i--, count++) {
      if (count === 3 && firstGroup) {
        formattedInteger = "," + formattedInteger;
        firstGroup = false;
        count = 0;
      } else if (count === 2 && !firstGroup) {
        formattedInteger = "," + formattedInteger;
        count = 0;
      }

      formattedInteger = integerPart[i] + formattedInteger;
    }

    return formattedInteger + "." + decimalPart;
  };

  return (
    <CurrencyContext.Provider
      value={{ currency, setCurrency: handleSetCurrency, formatCurrency }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}
