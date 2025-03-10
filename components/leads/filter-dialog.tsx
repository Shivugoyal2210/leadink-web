"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSalesUsersAction } from "@/app/actions";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SlidersHorizontal, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";

type SalesUser = {
  id: string;
  full_name: string;
  role: string;
};

type LeadStatus =
  | "all"
  | "new"
  | "quote_made"
  | "negotiation"
  | "won"
  | "lost"
  | "unqualified";

const leadStatusOptions = [
  { value: "all", label: "All Statuses" },
  { value: "new", label: "New" },
  { value: "quote_made", label: "Quote Made" },
  { value: "negotiation", label: "Negotiation" },
  { value: "won", label: "Won" },
  { value: "lost", label: "Lost" },
  { value: "unqualified", label: "Unqualified" },
];

export function FilterLeadsDialog() {
  const [open, setOpen] = useState(false);
  const [salesUsers, setSalesUsers] = useState<SalesUser[]>([]);
  const [selectedSalesPerson, setSelectedSalesPerson] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<LeadStatus>("all");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeSalesPersonFilter = searchParams.get("salesPersonId");
  const activeStatusFilter = searchParams.get("status");

  useEffect(() => {
    if (open) {
      const fetchSalesUsers = async () => {
        const users = await getSalesUsersAction();
        setSalesUsers(users);
      };

      fetchSalesUsers();
    }

    // Set the initially selected values based on the URL
    if (activeSalesPersonFilter && activeSalesPersonFilter !== "all") {
      setSelectedSalesPerson(activeSalesPersonFilter);
    } else {
      setSelectedSalesPerson("all");
    }

    if (activeStatusFilter && activeStatusFilter !== "all") {
      setSelectedStatus(activeStatusFilter as LeadStatus);
    } else {
      setSelectedStatus("all");
    }
  }, [open, activeSalesPersonFilter, activeStatusFilter]);

  const handleApplyFilter = () => {
    setIsLoading(true);

    // Create new URLSearchParams object
    const params = new URLSearchParams(searchParams.toString());

    if (selectedSalesPerson && selectedSalesPerson !== "all") {
      params.set("salesPersonId", selectedSalesPerson);
    } else {
      params.delete("salesPersonId");
    }

    if (selectedStatus && selectedStatus !== "all") {
      params.set("status", selectedStatus);
    } else {
      params.delete("status");
    }

    // Navigate with the updated search params
    router.push(`/leads?${params.toString()}`);
    setOpen(false);
    setIsLoading(false);
  };

  const handleClearFilter = () => {
    setSelectedSalesPerson("all");
    setSelectedStatus("all");
    const params = new URLSearchParams(searchParams.toString());
    params.delete("salesPersonId");
    params.delete("status");
    router.push(`/leads?${params.toString()}`);
    setOpen(false);
  };

  const getSelectedUserName = () => {
    if (!activeSalesPersonFilter || activeSalesPersonFilter === "all")
      return null;
    const user = salesUsers.find((user) => user.id === activeSalesPersonFilter);
    return user ? user.full_name : null;
  };

  const getSelectedStatusLabel = () => {
    if (!activeStatusFilter || activeStatusFilter === "all") return null;
    const status = leadStatusOptions.find(
      (option) => option.value === activeStatusFilter
    );
    return status ? status.label : null;
  };

  const handleRemoveSalesPersonFilter = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("salesPersonId");
    router.push(`/leads?${params.toString()}`);
  };

  const handleRemoveStatusFilter = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("status");
    router.push(`/leads?${params.toString()}`);
  };

  const activeFiltersCount =
    (activeSalesPersonFilter && activeSalesPersonFilter !== "all" ? 1 : 0) +
    (activeStatusFilter && activeStatusFilter !== "all" ? 1 : 0);

  return (
    <div className="flex items-center gap-2">
      {activeSalesPersonFilter && getSelectedUserName() && (
        <Badge variant="outline" className="flex gap-1 items-center">
          <span>Sales Person: {getSelectedUserName()}</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-4 w-4 ml-1 rounded-full"
            onClick={handleRemoveSalesPersonFilter}
          >
            <X className="h-3 w-3" />
          </Button>
        </Badge>
      )}

      {activeStatusFilter && getSelectedStatusLabel() && (
        <Badge variant="outline" className="flex gap-1 items-center">
          <span>Status: {getSelectedStatusLabel()}</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-4 w-4 ml-1 rounded-full"
            onClick={handleRemoveStatusFilter}
          >
            <X className="h-3 w-3" />
          </Button>
        </Badge>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filter
            {activeFiltersCount > 0 && (
              <span className="ml-1">({activeFiltersCount})</span>
            )}
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Filter Leads</DialogTitle>
          </DialogHeader>

          <Card className="border-0 shadow-none">
            <CardContent className="p-0 space-y-4">
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="sales-person">Sales Person</Label>
                  <Select
                    value={selectedSalesPerson}
                    onValueChange={setSelectedSalesPerson}
                  >
                    <SelectTrigger id="sales-person">
                      <SelectValue placeholder="Select sales person" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Sales Persons</SelectItem>
                      {salesUsers.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.full_name} ({user.role.replace("_", " ")})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lead-status">Status</Label>
                  <Select
                    value={selectedStatus}
                    onValueChange={(value) =>
                      setSelectedStatus(value as LeadStatus)
                    }
                  >
                    <SelectTrigger id="lead-status">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {leadStatusOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <DialogFooter>
            <Button variant="outline" onClick={handleClearFilter}>
              Clear
            </Button>
            <Button onClick={handleApplyFilter} disabled={isLoading}>
              Apply Filter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
