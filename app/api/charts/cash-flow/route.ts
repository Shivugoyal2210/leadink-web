import { createServerClient } from "@/utils/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const year =
      searchParams.get("year") || new Date().getFullYear().toString();

    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;

    const supabase = await createServerClient();

    const { data: orders, error } = await supabase
      .from("orders")
      .select("total_value, final_size_date")
      .gte("final_size_date", startDate)
      .lte("final_size_date", endDate)
      .not("final_size_date", "is", null);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Group by month
    const monthlyData = Array(12)
      .fill(0)
      .map((_, i) => ({
        month: new Date(2000, i, 1).toLocaleString("default", {
          month: "short",
        }),
        "Expected Cash Flow": 0,
      }));

    if (orders) {
      orders.forEach((order) => {
        if (order.final_size_date) {
          const date = new Date(order.final_size_date);
          const monthIndex = date.getMonth();

          // Calculate expected cash flow (35% of total value)
          const expectedCashFlow = Number(order.total_value) * 0.35;
          monthlyData[monthIndex]["Expected Cash Flow"] += expectedCashFlow;
        }
      });
    }

    return NextResponse.json(monthlyData);
  } catch (error) {
    console.error("Error fetching cash flow data:", error);
    return NextResponse.json(
      { error: "Failed to fetch data" },
      { status: 500 }
    );
  }
}
