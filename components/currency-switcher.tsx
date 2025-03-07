"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Currency, useCurrency } from "@/contexts/currency-context";
import { DollarSign, IndianRupee } from "lucide-react";

export function CurrencySwitcher() {
  // Handle client-side rendering
  const [mounted, setMounted] = useState(false);
  const { currency, setCurrency } = useCurrency();

  // Wait until component is mounted to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // If not mounted yet (server rendering), show a placeholder with same size
  if (!mounted) {
    return <Button variant="ghost" size="icon" className="w-9 h-9"></Button>;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="w-9 h-9">
          {currency === "USD" ? (
            <DollarSign className="h-4 w-4" />
          ) : (
            <IndianRupee className="h-4 w-4" />
          )}
          <span className="sr-only">Toggle currency</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setCurrency("USD")}>
          <DollarSign className="mr-2 h-4 w-4" />
          <span>USD</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setCurrency("INR")}>
          <IndianRupee className="mr-2 h-4 w-4" />
          <span>INR</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
