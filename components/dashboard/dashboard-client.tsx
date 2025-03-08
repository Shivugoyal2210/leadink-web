"use client";

import React, { useState, useEffect } from "react";
import { MonthlyOrderChart } from "@/components/dashboard/monthly-order-chart";
import { DashboardDonutChart } from "@/components/dashboard/donut-chart";
import { CashFlowChart } from "@/components/dashboard/cash-flow-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, DollarSign, Users, TrendingUp } from "lucide-react";
import { useCurrency } from "@/contexts/currency-context";

// Define interfaces for chart data
interface OrderData {
  month: string;
  "Total Value": number;
  "Amount In": number;
}

interface DonutData {
  name: string;
  value: number;
}

interface CashFlowData {
  month: string;
  "Expected Cash Flow": number;
}

// Type definitions for data from Supabase
interface SalesRep {
  id: string;
  full_name: string;
}

interface Lead {
  lead_found_through: string;
}

interface Order {
  order_date: string;
  total_value: number;
  amount_in: number;
  final_size_date?: string;
  sales_rep?: SalesRep;
  leads?: Lead;
}

interface DashboardClientProps {
  initialUserRole: string;
  initialUserId: string;
  initialTotalLeads: number;
  initialTotalDeals: number;
  initialTotalRevenue: number;
  initialConversionRate: number;
}

export function DashboardClient({
  initialUserRole,
  initialUserId,
  initialTotalLeads,
  initialTotalDeals,
  initialTotalRevenue,
  initialConversionRate,
}: DashboardClientProps) {
  const { formatCurrency } = useCurrency();
  const [userRole] = useState<string>(initialUserRole);
  const [salesPeople, setSalesPeople] = useState<any[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>(
    new Date().getFullYear().toString()
  );
  const [selectedSalesPersonId, setSelectedSalesPersonId] =
    useState<string>("");
  const [selectedMonth, setSelectedMonth] = useState<string>(
    `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`
  );

  // Stats data
  const [totalLeads] = useState(initialTotalLeads);
  const [totalDeals] = useState(initialTotalDeals);
  const [totalRevenue] = useState(initialTotalRevenue);
  const [conversionRate] = useState(initialConversionRate);

  // Chart data
  const [monthlyOrdersData, setMonthlyOrdersData] = useState<OrderData[]>([]);
  const [salesPersonDonutData, setSalesPersonDonutData] = useState<DonutData[]>(
    []
  );
  const [leadSourceDonutData, setLeadSourceDonutData] = useState<DonutData[]>(
    []
  );
  const [cashFlowData, setCashFlowData] = useState<CashFlowData[]>([]);

  // Years for dropdown
  const years = Array.from({ length: 5 }, (_, i) =>
    (new Date().getFullYear() - 2 + i).toString()
  );

  // Months for dropdown
  const months = Array.from({ length: 12 }, (_, i) => {
    const monthNum = i + 1;
    const monthStr = String(monthNum).padStart(2, "0");
    const date = new Date(2000, i, 1);
    return {
      value: `${selectedYear}-${monthStr}`,
      label: date.toLocaleString("default", { month: "long" }),
    };
  });

  useEffect(() => {
    const fetchSalesPeople = async () => {
      try {
        const response = await fetch("/api/users/sales-people");
        if (response.ok) {
          const data = await response.json();
          setSalesPeople(data);
          if (!selectedSalesPersonId && data.length > 0) {
            setSelectedSalesPersonId(data[0].id);
          }
        }
      } catch (error) {
        console.error("Error fetching sales people:", error);
      }
    };

    fetchSalesPeople();
  }, []);

  // Fetch monthly order data when year changes
  useEffect(() => {
    const fetchMonthlyOrderData = async () => {
      try {
        const response = await fetch(
          `/api/charts/monthly-orders?year=${selectedYear}`
        );
        if (response.ok) {
          const data = await response.json();
          setMonthlyOrdersData(data);
        }
      } catch (error) {
        console.error("Error fetching monthly order data:", error);

        // Fallback to empty data structure
        const fallbackData: OrderData[] = Array(12)
          .fill(0)
          .map((_, i) => ({
            month: new Date(2000, i, 1).toLocaleString("default", {
              month: "short",
            }),
            "Total Value": 0,
            "Amount In": 0,
          }));

        setMonthlyOrdersData(fallbackData);
      }
    };

    fetchMonthlyOrderData();
  }, [selectedYear]);

  // Fetch sales person donut data when month changes
  useEffect(() => {
    const fetchSalesPersonData = async () => {
      try {
        const response = await fetch(
          `/api/charts/sales-person-data?month=${selectedMonth}`
        );
        if (response.ok) {
          const data = await response.json();
          setSalesPersonDonutData(data);
        }
      } catch (error) {
        console.error("Error fetching sales person data:", error);
        setSalesPersonDonutData([]);
      }
    };

    fetchSalesPersonData();
  }, [selectedMonth]);

  // Fetch lead source donut data when month changes
  useEffect(() => {
    const fetchLeadSourceData = async () => {
      try {
        const response = await fetch(
          `/api/charts/lead-source-data?month=${selectedMonth}`
        );
        if (response.ok) {
          const data = await response.json();
          setLeadSourceDonutData(data);
        }
      } catch (error) {
        console.error("Error fetching lead source data:", error);
        setLeadSourceDonutData([]);
      }
    };

    fetchLeadSourceData();
  }, [selectedMonth]);

  // Fetch expected cash flow data
  useEffect(() => {
    const fetchCashFlowData = async () => {
      try {
        const response = await fetch(
          `/api/charts/cash-flow?year=${selectedYear}`
        );
        if (response.ok) {
          const data = await response.json();
          setCashFlowData(data);
        }
      } catch (error) {
        console.error("Error fetching cash flow data:", error);

        // Fallback to empty data structure
        const fallbackData: CashFlowData[] = Array(12)
          .fill(0)
          .map((_, i) => ({
            month: new Date(2000, i, 1).toLocaleString("default", {
              month: "short",
            }),
            "Expected Cash Flow": 0,
          }));

        setCashFlowData(fallbackData);
      }
    };

    fetchCashFlowData();
  }, [selectedYear]);

  return (
    <div className="w-full space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
      <p className="text-muted-foreground">
        Welcome to your LeadInk dashboard. Here's an overview of your business.
      </p>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalLeads}</div>
            <p className="text-xs text-muted-foreground">
              All leads in the system
            </p>
          </CardContent>
        </Card>

        {["admin", "sales_manager", "sales_rep", "viewer"].includes(
          userRole
        ) && (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Deals
                </CardTitle>
                <BarChart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalDeals}</div>
                <p className="text-xs text-muted-foreground">
                  {userRole === "sales_rep"
                    ? "Your deals"
                    : "All deals in the system"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Revenue
                </CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(totalRevenue)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {userRole === "sales_rep"
                    ? "Your revenue"
                    : "All revenue generated"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Conversion Rate
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {conversionRate.toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Leads converted to deals
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Chart 1: Monthly Order Value Stacked Chart */}
        <MonthlyOrderChart
          data={monthlyOrdersData}
          selectedYear={selectedYear}
          onYearChange={setSelectedYear}
          years={years}
        />

        {/* Chart 2 & 3: Donut Charts */}
        <DashboardDonutChart
          data={salesPersonDonutData}
          title="Order Value by Sales Person"
          description="Distribution of order value by sales person"
          selectedMonth={selectedMonth}
          months={months}
          onMonthChange={setSelectedMonth}
          selectedYear={selectedYear}
          colors={["blue", "indigo", "violet", "cyan", "pink"]}
        />

        <DashboardDonutChart
          data={leadSourceDonutData}
          title="Order Value by Lead Source"
          description="Distribution of order value by lead source"
          selectedMonth={selectedMonth}
          months={months}
          onMonthChange={setSelectedMonth}
          selectedYear={selectedYear}
          colors={["emerald", "violet", "amber", "rose", "blue"]}
        />

        {/* Chart 4: Expected Cash Flow Bar Chart */}
        <CashFlowChart
          data={cashFlowData}
          selectedYear={selectedYear}
          onYearChange={setSelectedYear}
          years={years}
        />
      </div>
    </div>
  );
}
