"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { FileText } from "lucide-react";
import { submitQuoteRequestAction } from "@/app/actions";

interface SubmitQuoteRequestDialogProps {
  leadId: string;
  leadStatus: string;
}

export function SubmitQuoteRequestDialog({
  leadId,
  leadStatus,
}: SubmitQuoteRequestDialogProps) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  // Determine if button should be disabled
  // Don't allow quote requests for already won/lost/unqualified leads
  const isDisabled = ["won", "lost", "unqualified"].includes(leadStatus);

  const handleSubmit = async () => {
    setError(null);
    setIsSubmitting(true);

    const formData = new FormData();
    formData.append("leadId", leadId);

    try {
      const result = await submitQuoteRequestAction(formData);
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
    <Dialog open={open} onOpenChange={setOpen}>
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
                <FileText className="h-4 w-4" />
                <span className="sr-only">Submit Quote Request</span>
              </Button>
            </DialogTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <p>Submit Quote Request</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Submit Quote Request</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <p>Are you sure you want to submit a quote request for this lead?</p>
          <p className="text-sm text-muted-foreground">
            This will create a new quote request assigned to the sales rep
            associated with this lead.
          </p>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit Quote Request"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
