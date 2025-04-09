"use client";

import { useEffect, useState, useRef } from "react";
import { useInView } from "react-intersection-observer";
import { useSearchParams } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { EditLeadDialog } from "@/components/leads/edit-lead-dialog";
import { SubmitQuoteRequestDialog } from "@/components/leads/submit-quote-request-dialog";
import { CurrencyCell } from "@/components/tables/currency-cell";
import { Lead } from "@/utils/supabase/types";
import { getMoreLeadsAction } from "@/app/actions";

interface LeadsTableProps {
  initialLeads: Lead[];
  userRole: string;
  currentUserId: string;
  hasMore: boolean;
  totalPages: number;
}

// Function to safely format dates that might be undefined
const formatDate = (dateString: string | undefined | null) => {
  if (!dateString) return "—";
  try {
    return new Date(dateString).toLocaleDateString();
  } catch (error) {
    console.error("Error formatting date:", error);
    return "—";
  }
};

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

export function LeadsTable({
  initialLeads,
  userRole,
  currentUserId,
  hasMore: initialHasMore,
  totalPages,
}: LeadsTableProps) {
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const { ref, inView } = useInView();
  const searchParams = useSearchParams();
  const leadsMapRef = useRef(new Map<string, Lead>());

  // Update the leadsMap when initialLeads change (e.g., when filters change)
  useEffect(() => {
    const newLeadsMap = new Map<string, Lead>();
    initialLeads.forEach((lead) => newLeadsMap.set(lead.id, lead));
    leadsMapRef.current = newLeadsMap;

    setLeads(initialLeads);
    setCurrentPage(1);
    setHasMore(initialHasMore);
  }, [initialLeads, initialHasMore]);

  useEffect(() => {
    const loadMore = async () => {
      if (inView && hasMore && !isLoading) {
        setIsLoading(true);
        const nextPage = currentPage + 1;

        try {
          const moreLeads = await getMoreLeadsAction(nextPage, {
            salesPersonId: searchParams.get("salesPersonId") || undefined,
            status: searchParams.get("status") || undefined,
            search: searchParams.get("search") || undefined,
            sortBy: searchParams.get("sortBy") || undefined,
            sortDir: searchParams.get("sortDir") || undefined,
          });

          if (moreLeads && moreLeads.length > 0) {
            // Track if we have any new leads to add
            let hasNewLeads = false;

            // Update our Map with new leads, avoiding duplicates
            moreLeads.forEach((lead) => {
              if (!leadsMapRef.current.has(lead.id)) {
                leadsMapRef.current.set(lead.id, lead);
                hasNewLeads = true;
              }
            });

            if (hasNewLeads) {
              // Convert Map values to array for state update
              setLeads(Array.from(leadsMapRef.current.values()));
              setCurrentPage(nextPage);
              setHasMore(nextPage < totalPages);
            } else {
              // If we received only duplicates, we're probably at the end
              setHasMore(false);
            }
          } else {
            setHasMore(false);
          }
        } catch (error) {
          console.error("Error loading more leads:", error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadMore();
  }, [inView, hasMore, isLoading, currentPage, searchParams, totalPages]);

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Address</TableHead>
          <TableHead>Property Type</TableHead>
          <TableHead>Assigned To</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Quote Value</TableHead>
          <TableHead>Quote #</TableHead>
          <TableHead>Follow-up</TableHead>
          <TableHead className="w-[70px]">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {leads.map((lead) => (
          <TableRow key={lead.id}>
            <TableCell className="font-medium">{lead.name}</TableCell>
            <TableCell>{lead.address}</TableCell>
            <TableCell className="capitalize">{lead.property_type}</TableCell>
            <TableCell>{lead.assignedToUserName || "Unassigned"}</TableCell>
            <TableCell>
              <Badge className={getStatusBadgeColor(lead.status)}>
                {lead.status.replace("_", " ")}
              </Badge>
            </TableCell>
            <TableCell>
              <CurrencyCell value={lead.quote_value || 0} />
            </TableCell>
            <TableCell>{lead.quote_number || "—"}</TableCell>
            <TableCell>{formatDate(lead.next_follow_up_date)}</TableCell>
            <TableCell>
              <div className="flex items-center gap-1">
                {!["quote_maker"].includes(userRole) && (
                  <EditLeadDialog
                    lead={lead}
                    assignedToUserId={lead.assignedToUserId}
                    currentUserRole={userRole}
                    currentUserId={currentUserId}
                  />
                )}
                <SubmitQuoteRequestDialog
                  leadId={lead.id}
                  leadStatus={lead.status}
                />
              </div>
            </TableCell>
          </TableRow>
        ))}
        {hasMore && (
          <TableRow ref={ref}>
            <TableCell colSpan={9} className="text-center p-4">
              Loading more leads...
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
