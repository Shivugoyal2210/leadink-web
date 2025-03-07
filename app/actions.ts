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

  if (
    !name ||
    !address ||
    !propertyType ||
    !phoneNumber ||
    !leadFoundThrough ||
    !assignedToUserId
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
      status: "new", // Default status for new leads
      notes,
    })
    .select()
    .single();

  if (leadError) {
    console.error("Error creating lead:", leadError);
    return { error: leadError.message };
  }

  // Create lead assignment
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

  // Extract lead data from form
  const leadId = formData.get("leadId") as string;
  const name = formData.get("name") as string;
  const address = formData.get("address") as string;
  const propertyType = formData.get("propertyType") as string;
  const company = formData.get("company") as string;
  const architectName = formData.get("architectName") as string;
  const phoneNumber = formData.get("phoneNumber") as string;
  const leadFoundThrough = formData.get("leadFoundThrough") as string;
  const notes = formData.get("notes") as string;
  const assignedToUserId = formData.get("assignedToUserId") as string;
  let status = formData.get("status") as string;
  const currentStatus = formData.get("currentStatus") as string;
  const quoteValueStr = formData.get("quoteValue") as string;

  // Parse quote value (default to 0 if empty)
  const quoteValue = quoteValueStr ? parseFloat(quoteValueStr) : 0;

  if (
    !leadId ||
    !name ||
    !address ||
    !propertyType ||
    !phoneNumber ||
    !leadFoundThrough ||
    !assignedToUserId ||
    !status
  ) {
    return { error: "Missing required fields" };
  }

  // Only allow admin users to set status to won or lost
  if (
    userRole !== "admin" &&
    (status === "won" || status === "lost") &&
    currentStatus !== status
  ) {
    return { error: "Only administrators can mark leads as won or lost" };
  }

  // Prepare update data
  const updateData = {
    name,
    address,
    property_type: propertyType,
    company: company || null,
    architect_name: architectName || null,
    phone_number: phoneNumber,
    lead_found_through: leadFoundThrough,
    status,
    notes,
    quote_value: quoteValue,
  };

  console.log("Updating lead with data:", { leadId, ...updateData });

  // Update lead
  const { error: leadError } = await supabase
    .from("leads")
    .update(updateData)
    .eq("id", leadId);

  if (leadError) {
    console.error("Error updating lead:", leadError);
    return { error: leadError.message };
  }

  // Check if assignment has changed
  const { data: currentAssignment } = await supabase
    .from("lead_assignments")
    .select("user_id")
    .eq("lead_id", leadId)
    .single();

  // Only allow admins and lead_assigners to change assignments
  if (
    currentAssignment &&
    currentAssignment.user_id !== assignedToUserId &&
    userRole !== "admin" &&
    userRole !== "lead_assigner"
  ) {
    return {
      error:
        "Only administrators and lead assigners can change lead assignments",
      leadId,
    };
  }

  // If assignment changed, update it
  if (currentAssignment && currentAssignment.user_id !== assignedToUserId) {
    // Delete current assignment
    await supabase.from("lead_assignments").delete().eq("lead_id", leadId);

    // Create new assignment
    const { error: assignmentError } = await supabase
      .from("lead_assignments")
      .insert({
        lead_id: leadId,
        user_id: assignedToUserId,
      });

    if (assignmentError) {
      console.error("Error updating lead assignment:", assignmentError);
      return { error: assignmentError.message };
    }
  }

  return { success: true, leadId };
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
