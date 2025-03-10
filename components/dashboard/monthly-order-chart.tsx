"use client";

import React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { TrendingUp } from "lucide-react";
import { useCurrency } from "@/contexts/currency-context";

interface OrderData {
  month: string;
  "Total Value": number;
  "Amount In": number;
}

interface MonthlyOrderChartProps {
  data: OrderData[];
  selectedYear: string;
  onYearChange: (year: string) => void;
  years: string[];
}

const chartConfig = {
  "Total Value": {
    label: "Total Value",
    color: "hsl(142, 76%, 36%)", // Darker green
  },
  "Amount In": {
    label: "Amount In",
    color: "hsl(142, 69%, 58%)", // Lighter green
  },
} satisfies ChartConfig;

export function MonthlyOrderChart({
  data,
  selectedYear,
  onYearChange,
  years,
}: MonthlyOrderChartProps) {
  const { formatCurrency } = useCurrency();

  return (
    <Card className="col-span-2 flex flex-col w-full max-w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Monthly Order Value</CardTitle>
          <CardDescription>
            Total order value and amount in by month
          </CardDescription>
        </div>
        <Select value={selectedYear} onValueChange={onYearChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select Year" />
          </SelectTrigger>
          <SelectContent>
            {years.map((year) => (
              <SelectItem key={year} value={year}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="h-[20rem] w-full overflow-hidden">
        <ChartContainer config={chartConfig} className="h-full w-full">
          <ResponsiveContainer width="99%" height="100%">
            <BarChart data={data} barSize={20} margin={{ right: 10, left: 30 }}>
              <CartesianGrid
                vertical={false}
                strokeDasharray="3 3"
                opacity={0.1}
              />
              <XAxis
                dataKey="month"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                tickFormatter={(value) => value.slice(0, 3)}
                fontSize={11}
                interval="preserveStartEnd"
              />
              <YAxis
                tickFormatter={(value) =>
                  formatCurrency(value).split(" ")[0] + value.toLocaleString()
                }
                tickLine={false}
                axisLine={false}
                fontSize={11}
                width={60}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value) => formatCurrency(Number(value))}
                  />
                }
              />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar
                dataKey="Total Value"
                stackId="a"
                fill={chartConfig["Total Value"].color}
                radius={[0, 0, 4, 4]}
              />
              <Bar
                dataKey="Amount In"
                stackId="a"
                fill={chartConfig["Amount In"].color}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm mt-auto">
        <div className="flex gap-2 font-medium leading-none">
          Orders trending by month <TrendingUp className="h-4 w-4" />
        </div>
        <div className="leading-none text-muted-foreground">
          Showing total order value and amount in for {selectedYear}
        </div>
      </CardFooter>
    </Card>
  );
}
