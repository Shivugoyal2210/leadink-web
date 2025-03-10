"use server";

import { encodedRedirect } from "@/utils/utils";
import { createClient } from "@/utils/supabase/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export const signUpAction = async (formData: FormData) => {
  const email = formData.get("email")?.toString();
  const password = formData.get("password")?.toString();
  const supabase = await createClient();
  const origin = (await headers()).get("origin");

  if (!email || !password) {
    return encodedRedirect(
      "error",
      "/sign-up",
      "Email and password are required"
    );
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    console.error(error.code + " " + error.message);
    return encodedRedirect("error", "/sign-up", error.message);
  } else {
    return encodedRedirect(
      "success",
      "/sign-up",
      "Thanks for signing up! Please check your email for a verification link."
    );
  }
};

export const signInAction = async (formData: FormData) => {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return encodedRedirect("error", "/sign-in", error.message);
  }

  return redirect("/dashboard");
};

export const forgotPasswordAction = async (formData: FormData) => {
  const email = formData.get("email")?.toString();
  const supabase = await createClient();
  const origin = (await headers()).get("origin");
  const callbackUrl = formData.get("callbackUrl")?.toString();

  if (!email) {
    return encodedRedirect("error", "/forgot-password", "Email is required");
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?redirect_to=/protected/reset-password`,
  });

  if (error) {
    console.error(error.message);
    return encodedRedirect(
      "error",
      "/forgot-password",
      "Could not reset password"
    );
  }

  if (callbackUrl) {
    return redirect(callbackUrl);
  }

  return encodedRedirect(
    "success",
    "/forgot-password",
    "Check your email for a link to reset your password."
  );
};

export const resetPasswordAction = async (formData: FormData) => {
  const supabase = await createClient();

  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!password || !confirmPassword) {
    encodedRedirect(
      "error",
      "/protected/reset-password",
      "Password and confirm password are required"
    );
  }

  if (password !== confirmPassword) {
    encodedRedirect(
      "error",
      "/protected/reset-password",
      "Passwords do not match"
    );
  }

  const { error } = await supabase.auth.updateUser({
    password: password,
  });

  if (error) {
    encodedRedirect(
      "error",
      "/protected/reset-password",
      "Password update failed"
    );
  }

  encodedRedirect("success", "/protected/reset-password", "Password updated");
};

export const signOutAction = async () => {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return redirect("/sign-in");
};

export const getSalesUsersAction = async () => {
  const supabase = await createClient();

  // Get all users with role sales_rep or sales_manager
  const { data: salesUsers, error } = await supabase
    .from("users")
    .select("id, full_name, role")
    .in("role", ["sales_rep", "sales_manager"]);

  if (error) {
    console.error("Error fetching sales users:", error);
    return [];
  }

  return salesUsers;
};

export const addLeadAction = async (formData: FormData) => {
  const supabase = await createClient();

  // Extract lead data from form
  const name = formData.get("name") as string;
  const address = formData.get("address") as string;
  const propertyType = formData.get("propertyType") as string;
  const company = formData.get("company") as string;
  const architectName = formData.get("architectName") as string;
  const phoneNumber = formData.get("phoneNumber") as string;
  const leadFoundThrough = formData.get("leadFoundThrough") as string;
  const notes = formData.get("notes") as string;
  const assignedToUserId = formData.get("assignedToUserId") as string;
  const status = (formData.get("status") as string) || "new"; // Get status from form or default to "new"
  const quoteNumber = formData.get("quoteNumber") as string;

  // Check if this is an unqualified lead (which might not have assignment)
  const isUnqualified = status === "unqualified";

  if (
    !name ||
    !address ||
    !propertyType ||
    !phoneNumber ||
    !leadFoundThrough ||
    (!assignedToUserId && !isUnqualified) // Assignment is only required for non-unqualified leads
  ) {
    return { error: "Missing required fields" };
  }

  // Insert new lead
  const { data: lead, error: leadError } = await supabase
    .from("leads")
    .insert({
      name,
      address,
      property_type: propertyType,
      company: company || null,
      architect_name: architectName || null,
      phone_number: phoneNumber,
      lead_found_through: leadFoundThrough,
      status, // Use the status from form data
      notes,
      quote_number: quoteNumber || null,
    })
    .select()
    .single();

  if (leadError) {
    console.error("Error creating lead:", leadError);
    return { error: leadError.message };
  }

  // Create lead assignment only if we have an assignedToUserId
  if (assignedToUserId) {
    const { error: assignmentError } = await supabase
      .from("lead_assignments")
      .insert({
        lead_id: lead.id,
        user_id: assignedToUserId,
      });

    if (assignmentError) {
      console.error("Error assigning lead:", assignmentError);
      return { error: assignmentError.message };
    }
  }

  return { success: true, leadId: lead.id };
};

export const getLeadAssignmentsAction = async (salesPersonId: string) => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("lead_assignments")
    .select("lead_id")
    .eq("user_id", salesPersonId);

  if (error) {
    console.error("Error fetching lead assignments:", error);
    return [];
  }

  return data || [];
};

export const updateLeadAction = async (
  formData: FormData,
  userId: string,
  userRole: string
) => {
  const supabase = await createClient();

  const leadId = formData.get("leadId") as string;
  const name = formData.get("name") as string;
  const address = formData.get("address") as string;
  const propertyType = formData.get("propertyType") as string;
  const company = formData.get("company") as string;
  const architectName = formData.get("architectName") as string;
  const phoneNumber = formData.get("phoneNumber") as string;
  const leadFoundThrough = formData.get("leadFoundThrough") as string;
  const status = formData.get("status") as string;
  const currentStatus = formData.get("currentStatus") as string;
  const notes = formData.get("notes") as string;
  const assignedToUserId = formData.get("assignedToUserId") as string;
  const quoteValue = formData.get("quoteValue") as string;
  const quoteNumber = formData.get("quoteNumber") as string;

  if (
    !leadId ||
    !name ||
    !address ||
    !propertyType ||
    !phoneNumber ||
    !leadFoundThrough ||
    !status ||
    !assignedToUserId
  ) {
    return { error: "Missing required fields" };
  }

  // Check if user has permission to change to won or lost
  const canChangeToWonLost =
    userRole === "admin" || userRole === "manager" || userRole === "viewer";

  if (
    (status === "won" || status === "lost") &&
    currentStatus !== "won" &&
    currentStatus !== "lost" &&
    !canChangeToWonLost
  ) {
    return {
      error: "You don't have permission to mark leads as won or lost",
    };
  }

  // Update lead data
  const { error: updateError } = await supabase
    .from("leads")
    .update({
      name,
      address,
      property_type: propertyType,
      company: company || null,
      architect_name: architectName || null,
      phone_number: phoneNumber,
      lead_found_through: leadFoundThrough,
      status,
      notes,
      quote_value: quoteValue ? parseFloat(quoteValue) : null,
      quote_number: quoteNumber || null,
    })
    .eq("id", leadId);

  if (updateError) {
    console.error("Error updating lead:", updateError);
    return { error: updateError.message };
  }

  // Update assignment if it has changed
  const { data: currentAssignment } = await supabase
    .from("lead_assignments")
    .select("user_id")
    .eq("lead_id", leadId)
    .single();

  if (!currentAssignment || currentAssignment.user_id !== assignedToUserId) {
    // Delete existing assignment
    if (currentAssignment) {
      await supabase.from("lead_assignments").delete().eq("lead_id", leadId);
    }

    // Create new assignment
    const { error: assignmentError } = await supabase
      .from("lead_assignments")
      .insert({
        lead_id: leadId,
        user_id: assignedToUserId,
      });

    if (assignmentError) {
      console.error("Error reassigning lead:", assignmentError);
      return { error: assignmentError.message };
    }
  }

  return { success: true };
};

export const getLeadAssignedUserAction = async (leadId: string) => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("lead_assignments")
    .select("user_id")
    .eq("lead_id", leadId)
    .single();

  if (error) {
    console.error("Error fetching lead assignment:", error);
    return null;
  }

  return data.user_id;
};

export const updateDealAction = async (formData: FormData) => {
  const supabase = await createClient();

  // Extract deal data from form
  const orderId = formData.get("orderId") as string;
  const amountIn = parseFloat(formData.get("amountIn") as string);
  const taxAmount = parseFloat(formData.get("taxAmount") as string);
  const middlemanCut = parseFloat(formData.get("middlemanCut") as string);
  const status = formData.get("status") as string;
  const notes = formData.get("notes") as string;
  const amountReceived = parseFloat(formData.get("amountReceived") as string);
  const finalSizeDate = formData.get("finalSizeDate") as string;
  const orderDate = formData.get("orderDate") as string;

  if (!orderId) {
    return { error: "Missing order ID" };
  }

  // Prepare update data
  const updates: Record<string, any> = {};

  if (!isNaN(amountIn)) updates.amount_in = amountIn;
  if (!isNaN(taxAmount)) updates.tax_amount = taxAmount;
  if (!isNaN(middlemanCut)) updates.middleman_cut = middlemanCut;
  if (status) updates.status = status;
  if (notes) updates.notes = notes;
  if (!isNaN(amountReceived)) updates.amount_recieved = amountReceived;
  // Add finalSizeDate to updates if provided, or set to null if cleared
  if (finalSizeDate !== null) {
    updates.final_size_date = finalSizeDate || null;
  }
  // Add orderDate to updates if provided, or set to null if cleared
  if (orderDate !== null) {
    updates.order_date = orderDate || null;
  }

  // Note: total_value is not included in updates as it's calculated by the database

  console.log("Updating deal with data:", { orderId, ...updates });

  // Update deal
  try {
    const { data, error } = await supabase
      .from("orders")
      .update(updates)
      .eq("id", orderId)
      .select();

    if (error) {
      console.error("Error updating deal:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error: any) {
    console.error("Exception updating deal:", error);
    return { success: false, error: error.message || String(error) };
  }
};

export const completeQuoteRequestAction = async (formData: FormData) => {
  const quoteRequestId = formData.get("quoteRequestId") as string;
  const quoteValueStr = formData.get("quoteValue") as string;
  const leadId = formData.get("leadId") as string;

  // Parse quote value (default to 0 if empty)
  const quoteValue = quoteValueStr ? parseFloat(quoteValueStr) : 0;

  if (!quoteRequestId || !quoteValue || quoteValue <= 0 || !leadId) {
    return {
      error:
        "Quote request ID, lead ID, and a positive quote value are required",
    };
  }

  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "User not authenticated" };
  }

  try {
    // Start a transaction to update both quote request and lead
    const { error: quoteRequestError } = await supabase
      .from("quote_requests")
      .update({
        status: "completed",
        quote_value: quoteValue,
        quoted_at: new Date().toISOString(),
        quote_maker_id: user.id,
      })
      .eq("id", quoteRequestId);

    if (quoteRequestError) {
      console.error("Error updating quote request:", quoteRequestError);
      return { error: quoteRequestError.message };
    }

    // Update the lead with the quote value and change status to quote_made
    const { error: leadError } = await supabase
      .from("leads")
      .update({
        quote_value: quoteValue,
        status: "quote_made",
      })
      .eq("id", leadId);

    if (leadError) {
      console.error("Error updating lead:", leadError);
      return { error: leadError.message };
    }

    return { success: true };
  } catch (err) {
    console.error("Unexpected error in completeQuoteRequestAction:", err);
    return { error: "An unexpected error occurred" };
  }
};

export const startWorkingOnQuoteRequestAction = async (formData: FormData) => {
  const quoteRequestId = formData.get("quoteRequestId") as string;

  if (!quoteRequestId) {
    return { error: "Quote request ID is required" };
  }

  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "User not authenticated" };
  }

  // Update the quote request
  const { error } = await supabase
    .from("quote_requests")
    .update({
      status: "active",
      quote_maker_id: user.id,
    })
    .eq("id", quoteRequestId);

  if (error) {
    return { error: error.message };
  }

  return { success: true };
};
