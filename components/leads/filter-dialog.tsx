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
import { SlidersHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";

type SalesUser = {
  id: string;
  full_name: string;
  role: string;
};

export function FilterLeadsDialog() {
  const [open, setOpen] = useState(false);
  const [salesUsers, setSalesUsers] = useState<SalesUser[]>([]);
  const [selectedSalesPerson, setSelectedSalesPerson] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeFilter = searchParams.get("salesPersonId");

  useEffect(() => {
    if (open) {
      const fetchSalesUsers = async () => {
        const users = await getSalesUsersAction();
        setSalesUsers(users);
      };

      fetchSalesUsers();
    }

    // Set the initially selected value based on the URL
    if (activeFilter && activeFilter !== "all") {
      setSelectedSalesPerson(activeFilter);
    } else {
      setSelectedSalesPerson("all");
    }
  }, [open, activeFilter]);

  const handleApplyFilter = () => {
    setIsLoading(true);

    // Create new URLSearchParams object
    const params = new URLSearchParams(searchParams.toString());

    if (selectedSalesPerson && selectedSalesPerson !== "all") {
      params.set("salesPersonId", selectedSalesPerson);
    } else {
      params.delete("salesPersonId");
    }

    // Navigate with the updated search params
    router.push(`/leads?${params.toString()}`);
    setOpen(false);
    setIsLoading(false);
  };

  const handleClearFilter = () => {
    setSelectedSalesPerson("all");
    const params = new URLSearchParams(searchParams.toString());
    params.delete("salesPersonId");
    router.push(`/leads?${params.toString()}`);
    setOpen(false);
  };

  const getSelectedUserName = () => {
    if (!activeFilter) return null;
    const user = salesUsers.find((user) => user.id === activeFilter);
    return user ? user.full_name : null;
  };

  return (
    <div className="flex items-center gap-2">
      {activeFilter && getSelectedUserName() && (
        <Badge variant="outline" className="flex gap-1 items-center">
          <span>Sales Person: {getSelectedUserName()}</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-4 w-4 ml-1 rounded-full"
            onClick={handleClearFilter}
          >
            ×
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
