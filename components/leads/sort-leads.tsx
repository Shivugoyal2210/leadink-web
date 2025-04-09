"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowUpDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

export function SortLeads() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Get the current sort parameters from the URL
  const sortBy = searchParams.get("sortBy") || "status"; // Default sort by status
  const sortDir = searchParams.get("sortDir") || "asc"; // Default sort direction ascending

  const getSortLabel = () => {
    if (sortBy === "next_follow_up_date") {
      return "Follow-up Date";
    } else if (sortBy === "lead_created_date") {
      return "Created Date";
    } else {
      return "Status";
    }
  };

  const handleSortChange = (newSortBy: string) => {
    const params = new URLSearchParams(searchParams.toString());

    // If clicking on the same sort field, toggle direction
    if (newSortBy === sortBy) {
      params.set("sortDir", sortDir === "asc" ? "desc" : "asc");
    } else {
      // Otherwise, set the new sort field and default to ascending
      params.set("sortBy", newSortBy);
      params.set("sortDir", "asc");
    }

    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <ArrowUpDown className="h-4 w-4" />
            Sort: {getSortLabel()} ({sortDir === "asc" ? "A-Z" : "Z-A"})
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => handleSortChange("status")}>
            Status {sortBy === "status" && (sortDir === "asc" ? "↑" : "↓")}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => handleSortChange("next_follow_up_date")}
          >
            Follow-up Date{" "}
            {sortBy === "next_follow_up_date" &&
              (sortDir === "asc" ? "↑" : "↓")}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => handleSortChange("lead_created_date")}
          >
            Created Date{" "}
            {sortBy === "lead_created_date" && (sortDir === "asc" ? "↑" : "↓")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
