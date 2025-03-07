"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { startWorkingOnQuoteRequestAction } from "@/app/actions";
import { PlayCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { QuoteRequestStatus } from "@/utils/supabase/types";

interface StartWorkingButtonProps {
  quoteRequestId: string;
  status: QuoteRequestStatus;
}

export function StartWorkingButton({
  quoteRequestId,
  status,
}: StartWorkingButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleClick = async () => {
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("quoteRequestId", quoteRequestId);

      const result = await startWorkingOnQuoteRequestAction(formData);

      if (result.error) {
        console.error(result.error);
      } else {
        router.refresh();
      }
    } catch (err) {
      console.error("Error starting work on quote request:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Only enable the button if the quote request is pending
  const isDisabled = status !== "pending" || isLoading;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={handleClick}
            disabled={isDisabled}
          >
            <PlayCircle className="h-4 w-4" />
            <span className="sr-only">Start working</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Start working on this quote request</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
