"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
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

interface FilterDealsDialogProps {
  isAdmin: boolean;
}

export function FilterDealsDialog({ isAdmin }: FilterDealsDialogProps) {
  const [open, setOpen] = useState(false);
  const [salesUsers, setSalesUsers] = useState<SalesUser[]>([]);
  const [selectedSalesPerson, setSelectedSalesPerson] = useState<string>("all");
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const activeUserFilter = searchParams.get("salesPersonId");
  const activeYearFilter = searchParams.get("year");
  const activeMonthFilter = searchParams.get("month");

  // Generate year options - current year and previous 5 years
  const getYearOptions = () => {
    const years = [];
    const currentYear = new Date().getFullYear();

    for (let i = 0; i <= 5; i++) {
      const year = currentYear - i;
      years.push({ value: year.toString(), label: year.toString() });
    }

    return years;
  };

  // Generate month options
  const getMonthOptions = () => {
    const months = [];

    for (let i = 1; i <= 12; i++) {
      const monthNum = i;
      const monthStr = String(monthNum).padStart(2, "0");
      const date = new Date(2000, i - 1, 1);
      const monthName = date.toLocaleString("default", { month: "long" });

      months.push({ value: monthStr, label: monthName });
    }

    return months;
  };

  const yearOptions = getYearOptions();
  const monthOptions = getMonthOptions();

  useEffect(() => {
    if (open && isAdmin) {
      const fetchSalesUsers = async () => {
        const users = await getSalesUsersAction();
        setSalesUsers(users);
      };

      fetchSalesUsers();
    }

    // Set the initially selected values based on URL
    if (activeUserFilter && activeUserFilter !== "all") {
      setSelectedSalesPerson(activeUserFilter);
    } else {
      setSelectedSalesPerson("all");
    }

    if (activeYearFilter && activeYearFilter !== "all") {
      setSelectedYear(activeYearFilter);
    } else {
      setSelectedYear("all");
    }

    if (activeMonthFilter && activeMonthFilter !== "all") {
      setSelectedMonth(activeMonthFilter);
    } else {
      setSelectedMonth("all");
    }
  }, [open, activeUserFilter, activeYearFilter, activeMonthFilter, isAdmin]);

  const handleApplyFilter = () => {
    setIsLoading(true);

    // Create new URLSearchParams object
    const params = new URLSearchParams(searchParams.toString());

    // Update sales person filter if admin
    if (isAdmin) {
      if (selectedSalesPerson && selectedSalesPerson !== "all") {
        params.set("salesPersonId", selectedSalesPerson);
      } else {
        params.delete("salesPersonId");
      }
    }

    // Update year filter
    if (selectedYear && selectedYear !== "all") {
      params.set("year", selectedYear);
    } else {
      params.delete("year");
    }

    // Update month filter
    if (selectedMonth && selectedMonth !== "all") {
      params.set("month", selectedMonth);
    } else {
      params.delete("month");
    }

    // Navigate with the updated search params
    router.push(`${pathname}?${params.toString()}`);
    setOpen(false);
    setIsLoading(false);
  };

  const handleClearFilter = () => {
    setSelectedSalesPerson("all");
    setSelectedYear("all");
    setSelectedMonth("all");

    const params = new URLSearchParams();
    router.push(pathname);
    setOpen(false);
  };

  const getSelectedUserName = () => {
    if (!activeUserFilter || activeUserFilter === "all") return null;
    const user = salesUsers.find((user) => user.id === activeUserFilter);
    return user ? user.full_name : null;
  };

  const getSelectedYearName = () => {
    if (!activeYearFilter || activeYearFilter === "all") return null;
    return activeYearFilter;
  };

  const getSelectedMonthName = () => {
    if (!activeMonthFilter || activeMonthFilter === "all") return null;
    const month = monthOptions.find((m) => m.value === activeMonthFilter);
    return month ? month.label : null;
  };

  return (
    <div className="flex items-center gap-2">
      {isAdmin &&
        activeUserFilter &&
        activeUserFilter !== "all" &&
        getSelectedUserName() && (
          <Badge variant="outline" className="flex gap-1 items-center">
            <span>Sales Rep: {getSelectedUserName()}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-4 w-4 ml-1 rounded-full"
              onClick={() => {
                const params = new URLSearchParams(searchParams.toString());
                params.delete("salesPersonId");
                router.push(`${pathname}?${params.toString()}`);
              }}
            >
              ×
            </Button>
          </Badge>
        )}

      {activeYearFilter && activeYearFilter !== "all" && (
        <Badge variant="outline" className="flex gap-1 items-center">
          <span>Year: {getSelectedYearName()}</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-4 w-4 ml-1 rounded-full"
            onClick={() => {
              const params = new URLSearchParams(searchParams.toString());
              params.delete("year");
              router.push(`${pathname}?${params.toString()}`);
            }}
          >
            ×
          </Button>
        </Badge>
      )}

      {activeMonthFilter && activeMonthFilter !== "all" && (
        <Badge variant="outline" className="flex gap-1 items-center">
          <span>Month: {getSelectedMonthName()}</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-4 w-4 ml-1 rounded-full"
            onClick={() => {
              const params = new URLSearchParams(searchParams.toString());
              params.delete("month");
              router.push(`${pathname}?${params.toString()}`);
            }}
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
            <DialogTitle>Filter Deals</DialogTitle>
          </DialogHeader>

          <Card className="border-0 shadow-none">
            <CardContent className="p-0 space-y-4">
              <div className="grid gap-4 py-4">
                {isAdmin && (
                  <div className="space-y-2">
                    <Label htmlFor="sales-person">Sales Rep</Label>
                    <Select
                      value={selectedSalesPerson}
                      onValueChange={setSelectedSalesPerson}
                    >
                      <SelectTrigger id="sales-person">
                        <SelectValue placeholder="Select sales rep" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Sales Reps</SelectItem>
                        {salesUsers.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.full_name} ({user.role.replace("_", " ")})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="year">Year</Label>
                  <Select value={selectedYear} onValueChange={setSelectedYear}>
                    <SelectTrigger id="year">
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Years</SelectItem>
                      {yearOptions.map((year) => (
                        <SelectItem key={year.value} value={year.value}>
                          {year.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="month">Month</Label>
                  <Select
                    value={selectedMonth}
                    onValueChange={setSelectedMonth}
                  >
                    <SelectTrigger id="month">
                      <SelectValue placeholder="Select month" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Months</SelectItem>
                      {monthOptions.map((month) => (
                        <SelectItem key={month.value} value={month.value}>
                          {month.label}
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
