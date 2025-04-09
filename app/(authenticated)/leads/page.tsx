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
import { SortLeads } from "@/components/leads/sort-leads";
import { EditLeadDialog } from "@/components/leads/edit-lead-dialog";
import { CurrencyCell } from "@/components/tables/currency-cell";
import { LeadsSkeleton } from "@/components/leads/leads-skeleton";
import { LeadsTable } from "@/components/leads/leads-table";

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
          <SortLeads />
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

  // Get the page number from URL or default to 1
  const page = typeof params.page === "string" ? parseInt(params.page, 10) : 1;
  const pageSize = 25;

  // Build the base query for counting total leads
  let countQuery = supabase.from("leads").select("*", { count: "exact" });
  let dataQuery = supabase.from("leads").select("*");

  // Only admins can see won and lost leads
  if (userRole !== "admin" && userRole !== "viewer") {
    countQuery = countQuery.not("status", "in", '("won","lost")');
    dataQuery = dataQuery.not("status", "in", '("won","lost")');
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

  // Extract sort parameters
  const sortBy = typeof params.sortBy === "string" ? params.sortBy : "status";
  const sortDir = typeof params.sortDir === "string" ? params.sortDir : "asc";

  // For sales_rep, only show leads assigned to them
  if (userRole === "sales_rep") {
    const { data: assignedLeads } = await supabase
      .from("lead_assignments")
      .select("lead_id")
      .eq("user_id", user.id);

    if (assignedLeads && assignedLeads.length > 0) {
      const leadIds = assignedLeads.map((assignment) => assignment.lead_id);
      countQuery = countQuery.in("id", leadIds);
      dataQuery = dataQuery.in("id", leadIds);
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
      countQuery = countQuery.in("id", leadIds);
      dataQuery = dataQuery.in("id", leadIds);
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
    countQuery = countQuery.eq("status", statusFilter);
    dataQuery = dataQuery.eq("status", statusFilter);
  }

  // Apply search filter if search query exists
  if (searchQuery) {
    const searchFilter = `name.ilike.%${searchQuery}%,address.ilike.%${searchQuery}%,phone_number.ilike.%${searchQuery}%,notes.ilike.%${searchQuery}%`;
    countQuery = countQuery.or(searchFilter);
    dataQuery = dataQuery.or(searchFilter);
  }

  // Get total count for pagination
  const { count } = await countQuery;
  const totalPages = Math.ceil((count || 0) / pageSize);

  // Apply pagination to data query
  const { data: leads } = await dataQuery
    .range((page - 1) * pageSize, page * pageSize - 1)
    .order(sortBy, { ascending: sortDir === "asc" })
    .order("lead_created_date", { ascending: false });

  // If no leads found
  if (!leads || leads.length === 0) {
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

  // Get all lead IDs
  const leadIds = leads.map((lead) => lead.id);

  // Fetch all assignments for these leads in a single query
  const { data: assignments } = await supabase
    .from("lead_assignments")
    .select("lead_id, user_id")
    .in("lead_id", leadIds);

  // Create a map of lead_id to user_id for quick lookup
  const assignmentMap = new Map();
  if (assignments && assignments.length > 0) {
    assignments.forEach((assignment) => {
      assignmentMap.set(assignment.lead_id, assignment.user_id);
    });
  }

  // If we're filtering by a specific sales person
  if (salesPersonFilter) {
    // Pre-assign the filtered user to all leads
    const userIds = new Set([salesPersonFilter]);

    // Fetch the user details in a single query
    const { data: users } = await supabase
      .from("users")
      .select("id, full_name")
      .in("id", Array.from(userIds));

    // Create a map of user_id to full_name
    const userMap = new Map();
    if (users && users.length > 0) {
      users.forEach((user) => {
        userMap.set(user.id, user.full_name);
      });
    }

    // Map the leads with their assignments and names
    const leadsWithAssignments = leads.map((lead) => {
      const userId = assignmentMap.get(lead.id) || salesPersonFilter;
      return {
        ...lead,
        assignedToUserId: userId,
        assignedToUserName: userMap.get(userId) || "Unknown",
      };
    });

    // If no leads found after applying filters
    if (leadsWithAssignments.length === 0) {
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
          <LeadsTable
            initialLeads={leadsWithAssignments}
            userRole={userRole}
            currentUserId={user.id}
            hasMore={page < totalPages}
            totalPages={totalPages}
          />
        </CardContent>
      </Card>
    );
  }
  // Normal case - not filtering by sales person
  else {
    // Collect unique user IDs from assignments
    const userIds = new Set();
    assignmentMap.forEach((userId) => {
      if (userId) userIds.add(userId);
    });

    // Fetch all required users in a single query
    const { data: users } = await supabase
      .from("users")
      .select("id, full_name")
      .in("id", Array.from(userIds));

    // Create a map of user_id to full_name
    const userMap = new Map();
    if (users && users.length > 0) {
      users.forEach((user) => {
        userMap.set(user.id, user.full_name);
      });
    }

    // Map the leads with their assignments and names
    const leadsWithAssignments = leads.map((lead) => {
      const userId = assignmentMap.get(lead.id);
      return {
        ...lead,
        assignedToUserId: userId || null,
        assignedToUserName: userId
          ? userMap.get(userId) || "Unknown"
          : "Unassigned",
      };
    });

    // If no leads found after applying filters
    if (leadsWithAssignments.length === 0) {
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
          <LeadsTable
            initialLeads={leadsWithAssignments}
            userRole={userRole}
            currentUserId={user.id}
            hasMore={page < totalPages}
            totalPages={totalPages}
          />
        </CardContent>
      </Card>
    );
  }
}
