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
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SlidersHorizontal, X } from "lucide-react";
import { PropertyType } from "@/utils/supabase/types";

interface SalesUser {
  id: string;
  full_name: string;
  role: string;
}

const quoteTypeOptions = [
  { value: "all", label: "All Types" },
  { value: "fresh", label: "Fresh" },
  { value: "revisal", label: "Revisal" },
];

export function FilterQuoteRequestsDialog() {
  const [open, setOpen] = useState(false);
  const [salesUsers, setSalesUsers] = useState<SalesUser[]>([]);
  const [selectedSalesPerson, setSelectedSalesPerson] = useState<string>("all");
  const [selectedQuoteType, setSelectedQuoteType] = useState<string>("all");
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const activeSalesPersonFilter = searchParams.get("salesPersonId");
  const activeQuoteTypeFilter = searchParams.get("quoteType");
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
    if (open) {
      const fetchSalesUsers = async () => {
        const users = await getSalesUsersAction();
        setSalesUsers(users);
      };

      fetchSalesUsers();
    }

    // Set the initially selected values based on URL
    if (activeSalesPersonFilter && activeSalesPersonFilter !== "all") {
      setSelectedSalesPerson(activeSalesPersonFilter);
    } else {
      setSelectedSalesPerson("all");
    }

    if (activeQuoteTypeFilter && activeQuoteTypeFilter !== "all") {
      setSelectedQuoteType(activeQuoteTypeFilter);
    } else {
      setSelectedQuoteType("all");
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
  }, [
    open,
    activeSalesPersonFilter,
    activeQuoteTypeFilter,
    activeYearFilter,
    activeMonthFilter,
  ]);

  const handleApplyFilter = () => {
    setIsLoading(true);

    // Create new URLSearchParams object
    const params = new URLSearchParams(searchParams.toString());

    // Update sales person filter
    if (selectedSalesPerson && selectedSalesPerson !== "all") {
      params.set("salesPersonId", selectedSalesPerson);
    } else {
      params.delete("salesPersonId");
    }

    // Update quote type filter
    if (selectedQuoteType && selectedQuoteType !== "all") {
      params.set("quoteType", selectedQuoteType);
    } else {
      params.delete("quoteType");
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
    setSelectedQuoteType("all");
    setSelectedYear("all");
    setSelectedMonth("all");

    const params = new URLSearchParams(searchParams.toString());
    params.delete("salesPersonId");
    params.delete("quoteType");
    params.delete("year");
    params.delete("month");
    router.push(`${pathname}?${params.toString()}`);
    setOpen(false);
  };

  // Helper functions to get display names
  const getSelectedUserName = () => {
    if (!activeSalesPersonFilter || activeSalesPersonFilter === "all")
      return null;
    const user = salesUsers.find((user) => user.id === activeSalesPersonFilter);
    return user ? user.full_name : null;
  };

  const getSelectedQuoteTypeName = () => {
    if (!activeQuoteTypeFilter || activeQuoteTypeFilter === "all") return null;
    const type = quoteTypeOptions.find(
      (option) => option.value === activeQuoteTypeFilter
    );
    return type ? type.label : null;
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

  // Count active filters
  const activeFiltersCount =
    (activeSalesPersonFilter && activeSalesPersonFilter !== "all" ? 1 : 0) +
    (activeQuoteTypeFilter && activeQuoteTypeFilter !== "all" ? 1 : 0) +
    (activeYearFilter && activeYearFilter !== "all" ? 1 : 0) +
    (activeMonthFilter && activeMonthFilter !== "all" ? 1 : 0);

  return (
    <div className="flex items-center gap-2">
      {activeSalesPersonFilter && getSelectedUserName() && (
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
            <X className="h-3 w-3" />
          </Button>
        </Badge>
      )}

      {activeQuoteTypeFilter && getSelectedQuoteTypeName() && (
        <Badge variant="outline" className="flex gap-1 items-center">
          <span>Type: {getSelectedQuoteTypeName()}</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-4 w-4 ml-1 rounded-full"
            onClick={() => {
              const params = new URLSearchParams(searchParams.toString());
              params.delete("quoteType");
              router.push(`${pathname}?${params.toString()}`);
            }}
          >
            <X className="h-3 w-3" />
          </Button>
        </Badge>
      )}

      {activeYearFilter && getSelectedYearName() && (
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
            <X className="h-3 w-3" />
          </Button>
        </Badge>
      )}

      {activeMonthFilter && getSelectedMonthName() && (
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
            <DialogTitle>Filter Quote Requests</DialogTitle>
          </DialogHeader>

          <Card className="border-0 shadow-none">
            <CardContent className="p-0 space-y-4">
              <div className="grid gap-4 py-4">
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

                <div className="space-y-2">
                  <Label htmlFor="quote-type">Quote Type</Label>
                  <Select
                    value={selectedQuoteType}
                    onValueChange={setSelectedQuoteType}
                  >
                    <SelectTrigger id="quote-type">
                      <SelectValue placeholder="Select quote type" />
                    </SelectTrigger>
                    <SelectContent>
                      {quoteTypeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="year">Quote Completion Year</Label>
                  <Select value={selectedYear} onValueChange={setSelectedYear}>
                    <SelectTrigger id="year">
                      <SelectValue placeholder="Select completion year" />
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
                  <Label htmlFor="month">Quote Completion Month</Label>
                  <Select
                    value={selectedMonth}
                    onValueChange={setSelectedMonth}
                  >
                    <SelectTrigger id="month">
                      <SelectValue placeholder="Select completion month" />
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
              Clear All
            </Button>
            <Button onClick={handleApplyFilter} disabled={isLoading}>
              Apply Filters
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
