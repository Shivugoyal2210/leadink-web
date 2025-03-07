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
      .select("order_date, total_value, amount_in")
      .gte("order_date", startDate)
      .lte("order_date", endDate);

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
        "Total Value": 0,
        "Amount In": 0,
      }));

    orders?.forEach((order) => {
      const date = new Date(order.order_date);
      const monthIndex = date.getMonth();

      monthlyData[monthIndex]["Total Value"] += Number(order.total_value) || 0;
      monthlyData[monthIndex]["Amount In"] += Number(order.amount_in) || 0;
    });

    return NextResponse.json(monthlyData);
  } catch (error) {
    console.error("Error fetching monthly orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch data" },
      { status: 500 }
    );
  }
}
