import { Card, CardContent } from "@/components/ui/card";
import { Order } from "@/utils/supabase/types";

interface StatsDisplayProps {
  deals: Order[];
}

export function StatsDisplay({ deals }: StatsDisplayProps) {
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

  return (
    <div className="grid grid-cols-3 gap-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col">
            <span className="text-sm font-medium text-muted-foreground">
              Net Amount
            </span>
            <span className="text-2xl font-bold">
              ${totals.netAmount.toLocaleString()}
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
              ${totals.amountReceived.toLocaleString()}
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
              ${totals.totalValue.toLocaleString()}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
