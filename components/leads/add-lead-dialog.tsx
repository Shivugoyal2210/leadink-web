"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { addLeadAction, getSalesUsersAction } from "@/app/actions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { toast } from "sonner";

// Define form schema with Zod
const formSchema = z
  .object({
    name: z.string().min(1, "Name is required"),
    address: z.string().min(1, "Address is required"),
    propertyType: z.enum(["residential", "commercial"]),
    company: z.string().optional(),
    architectName: z.string().optional(),
    phoneNumber: z.string().min(1, "Phone number is required"),
    leadFoundThrough: z.enum([
      "scanner",
      "sunny",
      "social_media",
      "word_of_mouth",
      "social_media_ads",
      "architect",
    ]),
    notes: z.string().optional(),
    isUnqualified: z.boolean().default(false),
    assignedToUserId: z.string().optional(),
    quoteNumber: z.string().optional(),
  })
  .refine(
    (data) => {
      // If lead is not unqualified, assignedToUserId is required
      if (!data.isUnqualified && !data.assignedToUserId) {
        return false;
      }
      return true;
    },
    {
      message: "Assignment is required for qualified leads",
      path: ["assignedToUserId"],
    }
  );

type SalesUser = {
  id: string;
  full_name: string;
  role: string;
};

export function AddLeadDialog() {
  const [open, setOpen] = useState(false);
  const [salesUsers, setSalesUsers] = useState<SalesUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Initialize form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      address: "",
      propertyType: "residential",
      company: "",
      architectName: "",
      phoneNumber: "",
      leadFoundThrough: "scanner",
      notes: "",
      isUnqualified: false,
      assignedToUserId: "",
      quoteNumber: "",
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
    // Add all form values to formData except isUnqualified which we'll handle separately
    Object.entries(values).forEach(([key, value]) => {
      if (key !== "isUnqualified" && value !== undefined) {
        formData.append(key, value.toString());
      }
    });

    // Set the lead status based on isUnqualified
    formData.append("status", values.isUnqualified ? "unqualified" : "new");

    try {
      const result = await addLeadAction(formData);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Lead added successfully");
        setOpen(false);
        form.reset();
        router.refresh(); // Refresh the page to show the new lead
      }
    } catch (error) {
      toast.error("Failed to add lead");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <PlusCircle className="h-4 w-4" />
          Add Lead
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Lead</DialogTitle>
          <DialogDescription>
            Create a new lead and assign it to a sales representative.
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

                  <FormField
                    control={form.control}
                    name="quoteNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quote Number (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Quote number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

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
                              <SelectValue placeholder="How was the lead found?" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="scanner">Scanner</SelectItem>
                            <SelectItem value="sunny">Sunny</SelectItem>
                            <SelectItem value="social_media">
                              Social Media
                            </SelectItem>
                            <SelectItem value="word_of_mouth">
                              Word of Mouth
                            </SelectItem>
                            <SelectItem value="social_media_ads">
                              Social Media Ads
                            </SelectItem>
                            <SelectItem value="architect">Architect</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="isUnqualified"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Mark as Unqualified Lead</FormLabel>
                          <FormDescription>
                            This lead will be tagged as unqualified instead of
                            new
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="assignedToUserId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Assign To</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          disabled={form.watch("isUnqualified")}
                        >
                          <FormControl>
                            <SelectTrigger
                              className={
                                form.watch("isUnqualified") ? "opacity-50" : ""
                              }
                            >
                              <SelectValue placeholder="Select sales person" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {salesUsers.map((user) => (
                              <SelectItem key={user.id} value={user.id}>
                                {user.full_name} ({user.role.replace("_", " ")})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

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
                {isLoading ? "Adding..." : "Add Lead"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
