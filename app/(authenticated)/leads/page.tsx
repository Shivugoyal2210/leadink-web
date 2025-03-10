import { Suspense } from "react";
import { createServerClient } from "@/utils/supabase";
import { getUserRole } from "@/utils/supabase/database";
import { Lead, UserRole } from "@/utils/supabase/types";
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
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { AddLeadDialog } from "@/components/leads/add-lead-dialog";
import { FilterLeadsDialog } from "@/components/leads/filter-dialog";
import { SearchLeads } from "@/components/leads/search-leads";
import { EditLeadDialog } from "@/components/leads/edit-lead-dialog";
import { CurrencyCell } from "@/components/tables/currency-cell";
import { LeadsSkeleton } from "@/components/leads/leads-skeleton";

export default function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<any>;
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Leads</h1>
        <div className="flex items-center gap-3">
          <FilterLeadsDialog />
          <AddLeadDialog />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <SearchLeads />
      </div>

      <Suspense fallback={<LeadsSkeleton />}>
        <LeadsContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function LeadsContent({ searchParams }: { searchParams: Promise<any> }) {
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

  // Fetch leads based on role and filters
  let query = supabase.from("leads").select("*");

  // Only admins can see won and lost leads
  if (userRole !== "admin" && userRole !== "viewer") {
    query = query.not("status", "in", '("won","lost")');
  }

  // Safely extract the sales person filter value
  const salesPersonFilter =
    typeof params.salesPersonId === "string" && params.salesPersonId !== "all"
      ? params.salesPersonId
      : null;

  // Extract status filter
  const statusFilter =
    typeof params.status === "string" && params.status !== "all"
      ? params.status
      : null;

  // Extract search query
  const searchQuery =
    typeof params.search === "string" ? params.search.trim() : "";

  // For sales_rep, only show leads assigned to them
  if (userRole === "sales_rep") {
    const { data: assignedLeads } = await supabase
      .from("lead_assignments")
      .select("lead_id")
      .eq("user_id", user.id);

    if (assignedLeads && assignedLeads.length > 0) {
      const leadIds = assignedLeads.map((assignment) => assignment.lead_id);
      query = query.in("id", leadIds);
    } else {
      // If no leads are assigned, return empty array
      return (
        <Card>
          <CardHeader>
            <CardTitle>No Leads Found</CardTitle>
            <CardDescription>
              You don't have any leads assigned to you yet.
            </CardDescription>
          </CardHeader>
        </Card>
      );
    }
  } else if (salesPersonFilter) {
    // If there's a sales person filter and the user is not a sales_rep
    const { data: assignedLeads } = await supabase
      .from("lead_assignments")
      .select("lead_id")
      .eq("user_id", salesPersonFilter);

    if (assignedLeads && assignedLeads.length > 0) {
      const leadIds = assignedLeads.map((assignment) => assignment.lead_id);
      query = query.in("id", leadIds);
    } else {
      // If no leads are assigned to the filtered sales person
      return (
        <Card>
          <CardHeader>
            <CardTitle>No Leads Found</CardTitle>
            <CardDescription>
              No leads are assigned to the selected sales person.
            </CardDescription>
          </CardHeader>
        </Card>
      );
    }
  }

  // Apply status filter if it exists
  if (statusFilter) {
    query = query.eq("status", statusFilter);
  }

  // Apply search filter if search query exists
  if (searchQuery) {
    query = query.or(
      `name.ilike.%${searchQuery}%,address.ilike.%${searchQuery}%,phone_number.ilike.%${searchQuery}%,notes.ilike.%${searchQuery}%`
    );
  }

  const { data: leads } = await query;

  // Fetch assigned users for each lead
  const leadsWithAssignments = await Promise.all(
    (leads || []).map(async (lead: Lead) => {
      const { data } = await supabase
        .from("lead_assignments")
        .select("user_id")
        .eq("lead_id", lead.id)
        .single();

      return {
        ...lead,
        assignedToUserId: data?.user_id || null,
      };
    })
  );

  // Sort leads by status (new → quote_made → negotiation → won → lost → unqualified)
  const sortOrder = {
    new: 1,
    quote_made: 2,
    negotiation: 3,
    won: 4,
    lost: 5,
    unqualified: 6,
  };

  leadsWithAssignments.sort((a, b) => {
    return sortOrder[a.status] - sortOrder[b.status];
  });

  // Function to get badge color based on lead status
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "new":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "quote_made":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "negotiation":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
      case "won":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "lost":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case "unqualified":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  // If no leads found after applying filters
  if (!leadsWithAssignments || leadsWithAssignments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Leads Found</CardTitle>
          <CardDescription>
            No leads found matching your criteria.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Address</TableHead>
              <TableHead>Property Type</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Quote Value</TableHead>
              <TableHead>Quote #</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-[70px]">
                {!["quote_maker"].includes(userRole) ? "Actions" : ""}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leadsWithAssignments.map((lead) => (
              <TableRow key={lead.id}>
                <TableCell className="font-medium">{lead.name}</TableCell>
                <TableCell>{lead.address}</TableCell>
                <TableCell className="capitalize">
                  {lead.property_type}
                </TableCell>
                <TableCell>{lead.phone_number}</TableCell>
                <TableCell>
                  <Badge className={getStatusBadgeColor(lead.status)}>
                    {lead.status.replace("_", " ")}
                  </Badge>
                </TableCell>
                <TableCell>
                  <CurrencyCell value={lead.quote_value || 0} />
                </TableCell>
                <TableCell>{lead.quote_number || "—"}</TableCell>
                <TableCell>
                  {lead.lead_created_date
                    ? new Date(lead.lead_created_date).toLocaleDateString()
                    : "N/A"}
                </TableCell>
                <TableCell>
                  {!["quote_maker"].includes(userRole) ? (
                    <EditLeadDialog
                      lead={lead}
                      assignedToUserId={lead.assignedToUserId}
                      currentUserRole={userRole}
                      currentUserId={user.id}
                    />
                  ) : null}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
