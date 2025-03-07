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
import { PlusCircle, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { AddLeadDialog } from "@/components/leads/add-lead-dialog";
import { FilterLeadsDialog } from "@/components/leads/filter-dialog";

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
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

  // Safely extract the sales person filter value
  const salesPersonFilter =
    typeof searchParams.salesPersonId === "string" &&
    searchParams.salesPersonId !== "all"
      ? searchParams.salesPersonId
      : null;

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
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold tracking-tight">Leads</h1>
            <div className="flex items-center gap-3">
              <FilterLeadsDialog />
              <AddLeadDialog />
            </div>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>No Leads Found</CardTitle>
              <CardDescription>
                You don't have any leads assigned to you yet.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
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
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold tracking-tight">Leads</h1>
            <div className="flex items-center gap-3">
              <FilterLeadsDialog />
              <AddLeadDialog />
            </div>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>No Leads Found</CardTitle>
              <CardDescription>
                No leads are assigned to the selected sales person.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      );
    }
  }

  const { data: leads } = await query;

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
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    }
  };

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
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input type="search" placeholder="Search leads..." className="pl-8" />
        </div>
      </div>

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
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leads && leads.length > 0 ? (
                leads.map((lead: Lead) => (
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
                      $
                      {lead.quote_value
                        ? lead.quote_value.toLocaleString()
                        : "0"}
                    </TableCell>
                    <TableCell>
                      {lead.lead_created_date
                        ? new Date(lead.lead_created_date).toLocaleDateString()
                        : "N/A"}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center py-6 text-muted-foreground"
                  >
                    No leads found
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
