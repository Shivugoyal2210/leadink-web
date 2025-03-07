"use client";

import * as React from "react";
import { TrendingUp } from "lucide-react";
import { Label, Pie, PieChart, ResponsiveContainer, Legend } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCurrency } from "@/contexts/currency-context";

interface DonutData {
  name: string;
  value: number;
}

interface DonutChartProps {
  data: DonutData[];
  title: string;
  description: string;
  selectedMonth: string;
  months: { value: string; label: string }[];
  onMonthChange: (month: string) => void;
  selectedYear: string;
  colors?: string[];
}

// Custom legend renderer to show clearer names and values
const CustomLegend = (props: any) => {
  const { payload } = props;
  const { formatCurrency } = useCurrency();

  if (!payload || payload.length === 0) return null;

  return (
    <div className="flex flex-col justify-start gap-3">
      {payload.map((entry: any, index: number) => (
        <div key={`legend-item-${index}`} className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-sm font-medium">
            {entry.value} ({formatCurrency(entry.payload.value)})
          </span>
        </div>
      ))}
    </div>
  );
};

export function DashboardDonutChart({
  data,
  title,
  description,
  selectedMonth,
  months,
  onMonthChange,
  selectedYear,
  colors = [
    "hsl(var(--chart-1))",
    "hsl(var(--chart-2))",
    "hsl(var(--chart-3))",
    "hsl(var(--chart-4))",
    "hsl(var(--chart-5))",
  ],
}: DonutChartProps) {
  const { formatCurrency } = useCurrency();

  // Transform data for recharts
  const chartData = React.useMemo(() => {
    return data.map((item, index) => ({
      ...item,
      fill: colors[index % colors.length],
    }));
  }, [data, colors]);

  // Calculate total value
  const totalValue = React.useMemo(() => {
    return data.reduce((acc, curr) => acc + curr.value, 0);
  }, [data]);

  // Create chart config
  const chartConfig = React.useMemo(() => {
    const config: ChartConfig = {
      value: {
        label: "Value",
      },
    };

    data.forEach((item, index) => {
      config[item.name] = {
        label: item.name,
        color: colors[index % colors.length],
      };
    });

    return config;
  }, [data, colors]);

  return (
    <Card className="flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>{title}</CardTitle>
        </div>
        <Select value={selectedMonth} onValueChange={onMonthChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select Month" />
          </SelectTrigger>
          <SelectContent>
            {months.map((month) => (
              <SelectItem key={month.value} value={month.value}>
                {month.label} {selectedYear}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="flex-1 h-96">
        <div className="flex flex-row h-full w-full">
          <ChartContainer config={chartConfig} className="w-3/5 h-full mr-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      formatter={(value) => formatCurrency(Number(value))}
                      hideLabel
                    />
                  }
                />
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={65}
                  outerRadius={90}
                  strokeWidth={5}
                  paddingAngle={2}
                  cx="50%"
                  cy="50%"
                >
                  <Label
                    content={({ viewBox }) => {
                      if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                        return (
                          <text
                            x={viewBox.cx}
                            y={viewBox.cy}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            className="text-center"
                          >
                            <tspan
                              x={viewBox.cx}
                              y={(viewBox.cy || 0) - 8}
                              className="fill-foreground text-xl font-bold"
                            >
                              {formatCurrency(totalValue)}
                            </tspan>
                            <tspan
                              x={viewBox.cx}
                              y={(viewBox.cy || 0) + 12}
                              className="fill-muted-foreground text-xs"
                            >
                              Total
                            </tspan>
                          </text>
                        );
                      }
                      return null;
                    }}
                  />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>

          <div className="w-2/5 flex items-center">
            <CustomLegend
              payload={chartData.map((item, index) => ({
                value: item.name,
                color: item.fill,
                payload: item,
              }))}
            />
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        <div className="flex items-center gap-2 font-medium leading-none">
          Distribution by category <TrendingUp className="h-4 w-4" />
        </div>
        <div className="leading-none text-muted-foreground">
          Showing data for{" "}
          {months.find((m) => m.value === selectedMonth)?.label} {selectedYear}
        </div>
      </CardFooter>
    </Card>
  );
}
