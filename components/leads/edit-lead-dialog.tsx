"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSalesUsersAction, updateLeadAction } from "@/app/actions";
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
import { Lead } from "@/utils/supabase/types";
import { useCurrency } from "@/contexts/currency-context";

// Define form schema with Zod
const formSchema = z.object({
  leadId: z.string().min(1),
  name: z.string().min(1, "Name is required"),
  address: z.string().min(1, "Address is required"),
  propertyType: z.enum(["residential", "commercial"]),
  company: z.string().optional(),
  architectName: z.string().optional(),
  phoneNumber: z.string().min(1, "Phone number is required"),
  leadFoundThrough: z.enum(["scanner", "ads", "social_media", "organic"]),
  status: z.enum(["new", "quote_made", "negotiation", "won", "lost"]),
  currentStatus: z.enum(["new", "quote_made", "negotiation", "won", "lost"]),
  notes: z.string().optional(),
  assignedToUserId: z.string().min(1, "Assignment is required"),
  quoteValue: z.string().optional(),
});

type SalesUser = {
  id: string;
  full_name: string;
  role: string;
};

interface EditLeadDialogProps {
  lead: Lead;
  assignedToUserId: string;
  currentUserRole: string;
  currentUserId: string;
}

export function EditLeadDialog({
  lead,
  assignedToUserId,
  currentUserRole,
  currentUserId,
}: EditLeadDialogProps) {
  const [open, setOpen] = useState(false);
  const [salesUsers, setSalesUsers] = useState<SalesUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { currency } = useCurrency();

  // Get the currency symbol
  const currencySymbol = currency === "INR" ? "₹" : "$";

  // Initialize form with lead data
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      leadId: lead.id,
      name: lead.name,
      address: lead.address,
      propertyType: lead.property_type,
      company: lead.company || "",
      architectName: lead.architect_name || "",
      phoneNumber: lead.phone_number,
      leadFoundThrough: lead.lead_found_through,
      status: lead.status,
      currentStatus: lead.status,
      notes: lead.notes || "",
      assignedToUserId: assignedToUserId,
      quoteValue: lead.quote_value ? lead.quote_value.toString() : "",
    },
  });

  // Fetch sales users when dialog opens
  useEffect(() => {
    if (open) {
      const fetchSalesUsers = async () => {
        const users = await getSalesUsersAction();
        setSalesUsers(users);
      };

      fetchSalesUsers();
    }
  }, [open]);

  // Handle form submission
  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);

    const formData = new FormData();
    Object.entries(values).forEach(([key, value]) => {
      if (value !== undefined) formData.append(key, String(value));
    });

    try {
      const result = await updateLeadAction(
        formData,
        currentUserId,
        currentUserRole
      );

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Lead updated successfully");
        setOpen(false);
        router.refresh(); // Refresh the page to show the updated lead
      }
    } catch (error) {
      toast.error("Failed to update lead");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }

  // Determine if user can change to won/lost status
  const canChangeToWonLost = currentUserRole === "admin";

  // Determine if user can change assignments
  const canChangeAssignment =
    currentUserRole === "admin" ||
    currentUserRole === "lead_assigner" ||
    currentUserRole === "quote_maker";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Edit2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Lead</DialogTitle>
          <DialogDescription>
            Update lead information and assignment.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <Card className="border-0 shadow-none">
              <CardContent className="p-0 space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Full name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Input placeholder="Complete address" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="propertyType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Property Type</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select property type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="residential">
                                Residential
                              </SelectItem>
                              <SelectItem value="commercial">
                                Commercial
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="phoneNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl>
                            <Input placeholder="Phone number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="company"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="Company name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="architectName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Architect Name (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="Architect name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="leadFoundThrough"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Lead Source</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select lead source" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="scanner">Scanner</SelectItem>
                              <SelectItem value="ads">Ads</SelectItem>
                              <SelectItem value="social_media">
                                Social Media
                              </SelectItem>
                              <SelectItem value="organic">Organic</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="quoteValue"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Quote Value ({currencySymbol})</FormLabel>
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
                              <SelectItem value="new">New</SelectItem>
                              <SelectItem value="quote_made">
                                Quote Made
                              </SelectItem>
                              <SelectItem value="negotiation">
                                Negotiation
                              </SelectItem>
                              <SelectItem
                                value="won"
                                disabled={
                                  !canChangeToWonLost && field.value !== "won"
                                }
                              >
                                Won{" "}
                                {!canChangeToWonLost &&
                                  field.value !== "won" &&
                                  "(Admin only)"}
                              </SelectItem>
                              <SelectItem
                                value="lost"
                                disabled={
                                  !canChangeToWonLost && field.value !== "lost"
                                }
                              >
                                Lost{" "}
                                {!canChangeToWonLost &&
                                  field.value !== "lost" &&
                                  "(Admin only)"}
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="assignedToUserId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Assign To
                            {!canChangeAssignment && (
                              <span className="text-muted-foreground text-xs ml-1">
                                (Only admins and lead assigners can change)
                              </span>
                            )}
                          </FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            disabled={!canChangeAssignment}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select sales person" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {salesUsers.map((user) => (
                                <SelectItem key={user.id} value={user.id}>
                                  {user.full_name} (
                                  {user.role.replace("_", " ")})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Any additional notes about the lead"
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
                {isLoading ? "Updating..." : "Update Lead"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
