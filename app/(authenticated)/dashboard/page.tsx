import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createServerClient } from "@/utils/supabase";
import { getUserRole } from "@/utils/supabase/database";
import { UserRole } from "@/utils/supabase/types";
import { BarChart, DollarSign, Users, TrendingUp } from "lucide-react";

export default async function DashboardPage() {
  const supabase = await createServerClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // Get user role
  const userRole = (await getUserRole(user.id)) as UserRole;

  // Fetch summary data based on role
  let totalLeads = 0;
  let totalDeals = 0;
  let totalRevenue = 0;
  let conversionRate = 0;

  // Get total leads
  const { count: leadsCount } = await supabase
    .from("leads")
    .select("*", { count: "exact", head: true });

  totalLeads = leadsCount || 0;

  // Get deals data if user has access
  if (["admin", "sales_manager", "sales_rep"].includes(userRole)) {
    // For sales_rep, only count their deals
    let query = supabase.from("orders").select("*", { count: "exact" });

    if (userRole === "sales_rep") {
      query = query.eq("sales_rep_id", user.id);
    }

    const { count: dealsCount } = await query;
    totalDeals = dealsCount || 0;

    // Calculate revenue
    const { data: deals } = await supabase.from("orders").select("total_value");

    if (deals && deals.length > 0) {
      totalRevenue = deals.reduce(
        (sum, deal) => sum + (deal.total_value || 0),
        0
      );
    }

    // Calculate conversion rate
    conversionRate = totalLeads > 0 ? (totalDeals / totalLeads) * 100 : 0;
  }

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

        {["admin", "sales_manager", "sales_rep"].includes(userRole) && (
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
                  ${totalRevenue.toLocaleString()}
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
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Your recent leads and deals activity
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Activity feed will be displayed here.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
