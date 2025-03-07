"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

interface SearchQuoteRequestsProps {
  defaultValue?: string;
}

export function SearchQuoteRequests({
  defaultValue = "",
}: SearchQuoteRequestsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchValue, setSearchValue] = useState(defaultValue);

  useEffect(() => {
    const search = searchParams.get("search") || "";
    setSearchValue(search);
  }, [searchParams]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Create new URL with search parameter
    const params = new URLSearchParams(searchParams);

    if (searchValue) {
      params.set("search", searchValue);
    } else {
      params.delete("search");
    }

    router.push(`/quote-requests?${params.toString()}`);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-full max-w-sm items-center space-x-2"
    >
      <Input
        type="text"
        placeholder="Search by lead name or address..."
        value={searchValue}
        onChange={(e) => setSearchValue(e.target.value)}
        className="flex-1"
      />
      <Button type="submit" size="icon" variant="ghost">
        <Search className="h-4 w-4" />
        <span className="sr-only">Search</span>
      </Button>
    </form>
  );
}
