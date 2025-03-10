"use client";

import { useState } from "react";
import { QuoteRequestStatus } from "@/utils/supabase/types";
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
import { startWorkingOnQuoteRequestAction } from "@/app/actions";
import { PlayCircle } from "lucide-react";
import { useRouter } from "next/navigation";

interface StartWorkingDialogProps {
  quoteRequestId: string;
  leadId: string;
  status: QuoteRequestStatus;
}

export function StartWorkingDialog({
  quoteRequestId,
  leadId,
  status,
}: StartWorkingDialogProps) {
  const [open, setOpen] = useState(false);
  const [quoteNumber, setQuoteNumber] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen) {
      setQuoteNumber("");
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const trimmedValue = quoteNumber.trim();
    if (!trimmedValue) {
      setError("Quote number is required");
      setIsSubmitting(false);
      return;
    }

    const formData = new FormData();
    formData.append("quoteRequestId", quoteRequestId);
    formData.append("leadId", leadId);
    formData.append("quoteNumber", trimmedValue);

    try {
      const result = await startWorkingOnQuoteRequestAction(formData);
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

  // Only enable the button if the quote request is pending
  const isDisabled = status !== "pending" || isSubmitting;

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
                disabled={isDisabled}
              >
                <PlayCircle className="h-4 w-4" />
                <span className="sr-only">Start working</span>
              </Button>
            </DialogTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <p>Start working on this quote request</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Start Working on Quote</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="quoteNumber">Quote Number</Label>
            <Input
              id="quoteNumber"
              type="text"
              value={quoteNumber}
              onChange={(e) => setQuoteNumber(e.target.value)}
              placeholder="Enter quote number"
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
              {isSubmitting ? "Processing..." : "Start Working"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
