"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDebouncedCallback } from "use-debounce";
import { Badge } from "@/components/ui/badge";

interface SearchLeadsProps {
  defaultValue?: string;
}

export function SearchLeads({ defaultValue = "" }: SearchLeadsProps) {
  const [searchTerm, setSearchTerm] = useState(defaultValue);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Set initial search term from URL params
  useEffect(() => {
    const search = searchParams.get("search");
    if (search) {
      setSearchTerm(search);
    }
  }, [searchParams]);

  // Debounce search to avoid making too many requests
  const debouncedSearch = useDebouncedCallback((value: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (value) {
      params.set("search", value);
    } else {
      params.delete("search");
    }

    router.push(`${pathname}?${params.toString()}`);
  }, 500); // 500ms debounce

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    debouncedSearch(value);
  };

  const clearSearch = () => {
    setSearchTerm("");
    const params = new URLSearchParams(searchParams.toString());
    params.delete("search");
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-2 w-full">
      <div className="relative flex-1">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search by name, address, phone..."
          className="pl-8 pr-8"
          value={searchTerm}
          onChange={handleSearch}
        />
        {searchTerm && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1 h-6 w-6 rounded-full"
            onClick={clearSearch}
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </Button>
        )}
      </div>

      {defaultValue && (
        <Badge variant="outline" className="flex gap-1 items-center">
          <span>Search: {defaultValue}</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-4 w-4 ml-1 rounded-full"
            onClick={clearSearch}
          >
            ×
          </Button>
        </Badge>
      )}
    </div>
  );
}
