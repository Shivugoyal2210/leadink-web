import { createServerClient } from "@/utils/supabase";
import { getDeals, getUserRole } from "@/utils/supabase/database";
import { Order, UserRole } from "@/utils/supabase/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PlusCircle, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { redirect } from "next/navigation";
import { FilterDealsDialog } from "@/components/deals/filter-dialog";
import { StatsDisplay } from "@/components/deals/stats-display-currency";
import { EditDealDialog } from "@/components/deals/edit-deal-dialog";
import { CurrencyCell } from "@/components/tables/currency-cell";

export default async function DealsPage({
  searchParams,
}: {
  searchParams: Promise<any>;
}) {
  // Cast searchParams to a usable type
  const params = (await searchParams) as {
    [key: string]: string | string[] | undefined;
  };

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

  // Check if user has access to deals page
  if (!["admin", "sales_manager", "sales_rep", "viewer"].includes(userRole)) {
    redirect("/dashboard");
  }

  const isAdmin = userRole === "admin";

  // Fetch deals based on role and filters
  let query = supabase.from("orders").select(`
    *,
    leads:lead_id (
      name,
      address,
      property_type
    ),
    sales_rep:sales_rep_id (
      id,
      full_name
    )
  `);

  // Extract filters from search params
  const salesPersonFilter =
    typeof params.salesPersonId === "string" && params.salesPersonId !== "all"
      ? params.salesPersonId
      : undefined;

  const yearFilter =
    typeof params.year === "string" && params.year !== "all"
      ? params.year
      : undefined;

  const monthFilter =
    typeof params.month === "string" && params.month !== "all"
      ? params.month
      : undefined;

  const filters = {
    salesPersonId: salesPersonFilter,
    year: yearFilter,
    month: monthFilter,
  };

  // Fetch deals based on role and filters
  const {
    success,
    data: deals,
    error,
  } = await getDeals(user.id, userRole, filters);

  if (!success) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Deals</h1>
        <Card>
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>
              {error ? String(error) : "There was an error fetching deals."}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Function to get badge color based on order status
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "active":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Deals</h1>
        <Button className="flex items-center gap-2">
          <PlusCircle className="h-4 w-4" />
          Add Deal
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input type="search" placeholder="Search deals..." className="pl-8" />
        </div>
        <FilterDealsDialog isAdmin={isAdmin} />
      </div>

      <StatsDisplay deals={deals || []} />

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lead</TableHead>
                <TableHead>Sales Rep</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Tax</TableHead>
                <TableHead>Middleman Cut</TableHead>
                <TableHead>Total Value</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                {isAdmin && <TableHead className="w-[70px]">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {deals && deals.length > 0 ? (
                deals.map((deal: Order) => (
                  <TableRow key={deal.id}>
                    <TableCell className="font-medium">
                      {deal.leads?.name || "Unknown Lead"}
                    </TableCell>
                    <TableCell>
                      {deal.sales_rep?.full_name || "Unknown"}
                    </TableCell>
                    <TableCell>
                      <CurrencyCell value={deal.amount_in || 0} />
                    </TableCell>
                    <TableCell>
                      <CurrencyCell value={deal.tax_amount || 0} />
                    </TableCell>
                    <TableCell>
                      <CurrencyCell value={deal.middleman_cut || 0} />
                    </TableCell>
                    <TableCell className="font-semibold">
                      <CurrencyCell value={deal.total_value || 0} />
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusBadgeColor(deal.status)}>
                        {deal.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {deal.order_date
                        ? new Date(deal.order_date).toLocaleDateString()
                        : "N/A"}
                    </TableCell>
                    {isAdmin && (
                      <TableCell>
                        <EditDealDialog deal={deal} />
                      </TableCell>
                    )}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={isAdmin ? 9 : 8}
                    className="text-center py-6 text-muted-foreground"
                  >
                    No deals found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
