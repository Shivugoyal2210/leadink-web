import { createServerClient } from "@/utils/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const month =
      searchParams.get("month") ||
      `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;

    const [year, monthNum] = month.split("-");
    const startDate = `${year}-${monthNum}-01`;

    // Calculate end date (last day of month)
    const endDay = new Date(Number(year), Number(monthNum), 0).getDate();
    const endDate = `${year}-${monthNum}-${endDay}`;

    const supabase = await createServerClient();

    const { data: orders, error } = await supabase
      .from("orders")
      .select(
        `
        total_value,
        sales_rep:sales_rep_id(id, full_name)
      `
      )
      .gte("order_date", startDate)
      .lte("order_date", endDate);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Group by sales person
    const salesData: Record<string, number> = {};

    if (orders) {
      orders.forEach((order: any) => {
        // Handle the nested data structure safely
        let salesPersonName = "Unknown";

        if (order.sales_rep && typeof order.sales_rep === "object") {
          // Handle both array and single object cases
          if (Array.isArray(order.sales_rep) && order.sales_rep.length > 0) {
            salesPersonName = order.sales_rep[0].full_name || "Unknown";
          } else if (order.sales_rep.full_name) {
            salesPersonName = order.sales_rep.full_name;
          }
        }

        if (!salesData[salesPersonName]) {
          salesData[salesPersonName] = 0;
        }
        salesData[salesPersonName] += Number(order.total_value) || 0;
      });
    }

    // Convert to format needed for DonutChart
    const donutData = Object.entries(salesData).map(([name, value]) => ({
      name,
      value,
    }));

    return NextResponse.json(donutData);
  } catch (error) {
    console.error("Error fetching sales person data:", error);
    return NextResponse.json(
      { error: "Failed to fetch data" },
      { status: 500 }
    );
  }
}
