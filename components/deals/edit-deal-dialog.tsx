"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateDealAction } from "@/app/actions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Edit2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { toast } from "sonner";
import { Order } from "@/utils/supabase/types";

// Define form schema with Zod
const formSchema = z.object({
  orderId: z.string().min(1),
  amountIn: z.coerce.number().min(0, "Amount must be positive"),
  taxAmount: z.coerce.number().min(0, "Tax amount must be positive"),
  middlemanCut: z.coerce.number().min(0, "Middleman cut must be positive"),
  status: z.enum(["pending", "active", "completed"]),
  notes: z.string().optional(),
  amountReceived: z.coerce.number().min(0, "Amount received must be positive"),
});

interface EditDealDialogProps {
  deal: Order;
}

export function EditDealDialog({ deal }: EditDealDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Initialize form with deal data
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      orderId: deal.id,
      amountIn: deal.amount_in,
      taxAmount: deal.tax_amount,
      middlemanCut: deal.middleman_cut,
      status: deal.status,
      notes: deal.notes || "",
      amountReceived: deal.amount_recieved || 0,
    },
  });

  // Handle form submission
  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);

    const formData = new FormData();
    Object.entries(values).forEach(([key, value]) => {
      if (value !== undefined) formData.append(key, String(value));
    });

    try {
      const result = await updateDealAction(formData);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Deal updated successfully");
        setOpen(false);
        router.refresh(); // Refresh the page to show the updated deal
      }
    } catch (error) {
      toast.error("Failed to update deal");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }

  // Calculate total value in real-time
  const calculateTotalValue = () => {
    // Ensure all values are converted to numbers
    const amountIn = Number(form.watch("amountIn")) || 0;
    const taxAmount = Number(form.watch("taxAmount")) || 0;
    const middlemanCut = Number(form.watch("middlemanCut")) || 0;

    // Add them as numbers and return the result
    return amountIn + taxAmount + middlemanCut;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Edit2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Deal</DialogTitle>
          <DialogDescription>
            Update deal information and financial details.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <Card className="border-0 shadow-none">
              <CardContent className="p-0 space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  {/* Financial Details */}
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="amountIn"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Net Amount ($)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="0.00"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="taxAmount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tax Amount ($)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="0.00"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="middlemanCut"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Middleman Cut ($)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="0.00"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="amountReceived"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Amount Received ($)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="0.00"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="active">Active</SelectItem>
                              <SelectItem value="completed">
                                Completed
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex flex-col justify-end">
                      <FormLabel>
                        Total Value ($){" "}
                        <span className="text-xs text-muted-foreground">
                          (auto-calculated)
                        </span>
                      </FormLabel>
                      <div className="h-10 flex items-center px-3 border rounded-md text-muted-foreground bg-muted/50">
                        ${calculateTotalValue().toLocaleString()}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Calculated from Net Amount + Tax + Middleman Cut
                      </p>
                    </div>
                  </div>

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Any additional notes about the deal"
                            className="min-h-[80px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            <DialogFooter>
              <Button
                variant="outline"
                type="button"
                onClick={() => setOpen(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Updating..." : "Update Deal"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
