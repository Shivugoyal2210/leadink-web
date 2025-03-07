import { createServerClient } from "@/utils/supabase";
import { getUserRole } from "@/utils/supabase/database";
import { UserRole } from "@/utils/supabase/types";
import { DashboardClient } from "@/components/dashboard/dashboard-client";

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
    <DashboardClient
      initialUserRole={userRole}
      initialUserId={user.id}
      initialTotalLeads={totalLeads}
      initialTotalDeals={totalDeals}
      initialTotalRevenue={totalRevenue}
      initialConversionRate={conversionRate}
    />
  );
}
