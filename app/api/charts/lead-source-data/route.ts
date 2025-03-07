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
        leads:lead_id(lead_found_through)
      `
      )
      .gte("order_date", startDate)
      .lte("order_date", endDate);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Group by lead source
    const sourceData: Record<string, number> = {};

    if (orders) {
      orders.forEach((order: any) => {
        // Handle the nested data structure safely
        let leadSource = "Unknown";

        if (order.leads && typeof order.leads === "object") {
          // Handle both array and single object cases
          if (Array.isArray(order.leads) && order.leads.length > 0) {
            leadSource = order.leads[0].lead_found_through || "Unknown";
          } else if (order.leads.lead_found_through) {
            leadSource = order.leads.lead_found_through;
          }
        }

        if (!sourceData[leadSource]) {
          sourceData[leadSource] = 0;
        }
        sourceData[leadSource] += Number(order.total_value) || 0;
      });
    }

    // Convert to format needed for DonutChart
    const donutData = Object.entries(sourceData).map(([name, value]) => ({
      name: name.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase()),
      value,
    }));

    return NextResponse.json(donutData);
  } catch (error) {
    console.error("Error fetching lead source data:", error);
    return NextResponse.json(
      { error: "Failed to fetch data" },
      { status: 500 }
    );
  }
}
