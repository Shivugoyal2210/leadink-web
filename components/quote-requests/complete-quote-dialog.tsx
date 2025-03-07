"use client";

import { useState } from "react";
import { QuoteRequest } from "@/utils/supabase/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { completeQuoteRequestAction } from "@/app/actions";
import { Check } from "lucide-react";
import { useRouter } from "next/navigation";

interface CompleteQuoteDialogProps {
  quoteRequest: QuoteRequest;
}

export function CompleteQuoteDialog({
  quoteRequest,
}: CompleteQuoteDialogProps) {
  const [open, setOpen] = useState(false);
  const [quoteValue, setQuoteValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen) {
      setQuoteValue(
        quoteRequest.quote_value > 0 ? quoteRequest.quote_value.toString() : ""
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const trimmedValue = quoteValue.trim();
    if (!trimmedValue) {
      setError("Quote value is required");
      setIsSubmitting(false);
      return;
    }

    const numericValue = parseFloat(trimmedValue);
    if (isNaN(numericValue)) {
      setError("Please enter a valid number for the quote value");
      setIsSubmitting(false);
      return;
    }

    if (numericValue <= 0) {
      setError("Quote value must be greater than zero");
      setIsSubmitting(false);
      return;
    }

    const formData = new FormData();
    formData.append("quoteRequestId", quoteRequest.id);
    formData.append("quoteValue", numericValue.toString());
    formData.append("leadId", quoteRequest.lead_id);

    try {
      const result = await completeQuoteRequestAction(formData);
      if (result.error) {
        setError(result.error);
      } else {
        setOpen(false);
        router.refresh();
      }
    } catch (err) {
      setError("An unexpected error occurred");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={quoteRequest.status === "completed"}
              >
                <Check className="h-4 w-4" />
                <span className="sr-only">Complete quote</span>
              </Button>
            </DialogTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <p>Complete this quote with a final value</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Complete Quote Request</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="quoteValue">Quote Value</Label>
            <Input
              id="quoteValue"
              type="number"
              step="0.01"
              min="0.01"
              value={quoteValue}
              onChange={(e) => setQuoteValue(e.target.value)}
              placeholder="Enter quote value"
              className="w-full"
              required
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Complete Quote"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
