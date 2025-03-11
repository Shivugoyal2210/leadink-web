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
import { Label } from "@/components/ui/label";
import { FileText } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { submitQuoteRequestAction } from "@/app/actions";
import { QuoteRequestType } from "@/utils/supabase/types";

interface SubmitQuoteRequestDialogProps {
  leadId: string;
  leadStatus: string;
}

export function SubmitQuoteRequestDialog({
  leadId,
  leadStatus,
}: SubmitQuoteRequestDialogProps) {
  const [open, setOpen] = useState(false);
  const [quoteType, setQuoteType] = useState<QuoteRequestType>("fresh");
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
    formData.append("quoteType", quoteType);

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

          <div className="space-y-2 py-2">
            <Label htmlFor="quoteType">Quote Type</Label>
            <RadioGroup
              id="quoteType"
              value={quoteType}
              onValueChange={(value: string) =>
                setQuoteType(value as QuoteRequestType)
              }
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="fresh" id="quote-fresh" />
                <Label htmlFor="quote-fresh" className="cursor-pointer">
                  Fresh
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="revisal" id="quote-revisal" />
                <Label htmlFor="quote-revisal" className="cursor-pointer">
                  Revisal
                </Label>
              </div>
            </RadioGroup>
          </div>

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
