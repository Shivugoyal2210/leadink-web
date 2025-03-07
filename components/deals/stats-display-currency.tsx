"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Order } from "@/utils/supabase/types";
import { useCurrency } from "@/contexts/currency-context";
import { useEffect, useState } from "react";

interface StatsDisplayProps {
  deals: Order[];
}

export function StatsDisplay({ deals }: StatsDisplayProps) {
  // Handle client-side rendering
  const [mounted, setMounted] = useState(false);
  const { formatCurrency } = useCurrency();

  // Wait until component is mounted
  useEffect(() => {
    setMounted(true);
  }, []);

  // Calculate totals
  const totals = deals.reduce(
    (acc, deal) => {
      // Net Amount (amount_in)
      acc.netAmount += deal.amount_in || 0;

      // Amount Received
      acc.amountReceived += deal.amount_recieved || 0;

      // Total Value
      acc.totalValue += deal.total_value || 0;

      return acc;
    },
    { netAmount: 0, amountReceived: 0, totalValue: 0 }
  );

  // Format for display based on mounted state
  const formatAmount = (amount: number) => {
    if (!mounted) {
      // Default USD formatting for server-side rendering
      return `$ ${amount.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    }
    return formatCurrency(amount);
  };

  return (
    <div className="grid grid-cols-3 gap-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col">
            <span className="text-sm font-medium text-muted-foreground">
              Net Amount
            </span>
            <span className="text-2xl font-bold">
              {formatAmount(totals.netAmount)}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col">
            <span className="text-sm font-medium text-muted-foreground">
              Amount Received
            </span>
            <span className="text-2xl font-bold">
              {formatAmount(totals.amountReceived)}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col">
            <span className="text-sm font-medium text-muted-foreground">
              Total Value
            </span>
            <span className="text-2xl font-bold">
              {formatAmount(totals.totalValue)}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
