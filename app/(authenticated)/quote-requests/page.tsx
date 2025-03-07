import { createServerClient } from "@/utils/supabase";
import { getUserRole } from "@/utils/supabase/database";
import { QuoteRequest, UserRole } from "@/utils/supabase/types";
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
import { CompleteQuoteDialog } from "@/components/quote-requests/complete-quote-dialog";
import { StartWorkingButton } from "@/components/quote-requests/start-working-button";
import { SearchQuoteRequests } from "@/components/quote-requests/search-quote-requests";
import { CurrencyCell } from "@/components/tables/currency-cell";
import { redirect } from "next/navigation";

export default async function QuoteRequestsPage({
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

  // Only allow access to quote makers and admins
  if (userRole !== "quote_maker" && userRole !== "admin") {
    redirect("/dashboard");
  }

  // Extract search query
  const searchQuery =
    typeof params.search === "string" ? params.search.trim() : "";

  // Fetch quote requests
  let query = supabase.from("quote_requests").select(`
      *,
      leads!inner (
        name,
        address,
        property_type
      ),
      users!quote_requests_sales_rep_id_fkey (
        full_name
      )
    `);

  // If quote maker, only show assigned or unassigned quote requests
  if (userRole === "quote_maker") {
    query = query.or(`quote_maker_id.is.null,quote_maker_id.eq.${user.id}`);
  }

  // Apply search filter if search query exists
  if (searchQuery) {
    query = query.or(
      `leads.name.ilike.%${searchQuery}%,leads.address.ilike.%${searchQuery}%`
    );
  }

  // Order by status (pending first, then active, then completed)
  // and by requested_at (newest first)
  const { data: quoteRequests, error } = await query
    .order("status", { ascending: true })
    .order("requested_at", { ascending: false });

  if (error) {
    console.error("Error fetching quote requests:", error);
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Quote Requests</h1>
        <Card>
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>
              Failed to load quote requests: {error.message}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Process the quote requests to ensure proper types and format
  const processedQuoteRequests =
    quoteRequests?.map((request: any) => ({
      ...request,
      // Ensure quote_value is a number
      quote_value:
        typeof request.quote_value === "number" ? request.quote_value : 0,
    })) || [];

  // Calculate quote request counts
  const pendingCount =
    processedQuoteRequests.filter((qr) => qr.status === "pending").length || 0;
  const activeCount =
    processedQuoteRequests.filter((qr) => qr.status === "active").length || 0;
  const completedCount =
    processedQuoteRequests.filter((qr) => qr.status === "completed").length ||
    0;

  // Function to get badge color based on quote request status
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
      <h1 className="text-3xl font-bold tracking-tight">Quote Requests</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">Pending</CardTitle>
            <CardDescription>Quotes waiting to be processed</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{pendingCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">Active</CardTitle>
            <CardDescription>Quotes being worked on</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{activeCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">Completed</CardTitle>
            <CardDescription>Quotes successfully processed</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{completedCount}</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-2">
        <SearchQuoteRequests defaultValue={searchQuery} />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lead</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Property Type</TableHead>
                <TableHead>Sales Rep</TableHead>
                <TableHead>Requested At</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Quote Value</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {processedQuoteRequests && processedQuoteRequests.length > 0 ? (
                processedQuoteRequests.map((request: any) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium">
                      {request.leads.name}
                    </TableCell>
                    <TableCell>{request.leads.address}</TableCell>
                    <TableCell className="capitalize">
                      {request.leads.property_type}
                    </TableCell>
                    <TableCell>
                      {request.users ? request.users.full_name : "N/A"}
                    </TableCell>
                    <TableCell>
                      {new Date(request.requested_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusBadgeColor(request.status)}>
                        {request.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <CurrencyCell value={request.quote_value || 0} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <StartWorkingButton
                          quoteRequestId={request.id}
                          status={request.status}
                        />
                        <CompleteQuoteDialog
                          quoteRequest={{
                            id: request.id,
                            lead_id: request.lead_id,
                            sales_rep_id: request.sales_rep_id,
                            quote_maker_id: request.quote_maker_id,
                            requested_at: request.requested_at,
                            quoted_at: request.quoted_at,
                            status: request.status,
                            quote_value: request.quote_value || 0,
                          }}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center">
                    No quote requests found
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
