import { createClient } from "./server";
import { UserRole, LeadStatus, OrderStatus } from "./types";

/**
 * Get the role of a user by their ID
 */
export async function getUserRole(userId: string): Promise<UserRole | null> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("users")
      .select("role")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Error fetching user role:", error);
      return null;
    }

    return (data?.role as UserRole) || null;
  } catch (error) {
    console.error("Error in getUserRole:", error);
    return null;
  }
}

/**
 * Add a new deal (order) to the database
 */
export async function addDeal({
  leadId,
  salesRepId,
  amountIn,
  taxAmount,
  middlemanCut,
  notes,
}: {
  leadId: string;
  salesRepId: string;
  amountIn: number;
  taxAmount: number;
  middlemanCut: number;
  notes?: string;
}) {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("orders")
      .insert({
        lead_id: leadId,
        sales_rep_id: salesRepId,
        amount_in: amountIn,
        tax_amount: taxAmount,
        middleman_cut: middlemanCut,
        notes,
        status: "pending",
      })
      .select()
      .single();

    if (error) {
      console.error("Error adding deal:", error);
      return { success: false, error };
    }

    // Update the lead status to 'won'
    await supabase.from("leads").update({ status: "won" }).eq("id", leadId);

    return { success: true, data };
  } catch (error) {
    console.error("Error in addDeal:", error);
    return { success: false, error };
  }
}

/**
 * Update an existing deal
 */
export async function updateDeal({
  orderId,
  amountIn,
  taxAmount,
  middlemanCut,
  status,
  notes,
  amountReceived,
}: {
  orderId: string;
  amountIn?: number;
  taxAmount?: number;
  middlemanCut?: number;
  status?: OrderStatus;
  notes?: string;
  amountReceived?: number;
}) {
  try {
    const supabase = await createClient();

    const updates: Record<string, any> = {};

    if (amountIn !== undefined) updates.amount_in = amountIn;
    if (taxAmount !== undefined) updates.tax_amount = taxAmount;
    if (middlemanCut !== undefined) updates.middleman_cut = middlemanCut;
    if (status !== undefined) updates.status = status;
    if (notes !== undefined) updates.notes = notes;
    if (amountReceived !== undefined) updates.amount_recieved = amountReceived;
    console.log(updates);
    const { data, error } = await supabase
      .from("orders")
      .update(updates)
      .eq("id", orderId)
      .select()
      .single();

    if (error) {
      console.error("Error updating deal:", error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error in updateDeal:", error);
    return { success: false, error };
  }
}

/**
 * Get all deals based on user role and ID, with optional filters
 */
export async function getDeals(
  userId: string,
  userRole: UserRole,
  filters?: { salesPersonId?: string; year?: string; month?: string }
) {
  try {
    const supabase = await createClient();

    // Different queries based on user role
    let query = supabase.from("orders").select(`
      *,
      leads:lead_id(*),
      sales_rep:sales_rep_id(id, full_name)
    `);

    // Filter deals based on user role
    if (userRole === "sales_rep") {
      // Sales reps can only see their own deals
      query = query.eq("sales_rep_id", userId);
    } else if (userRole === "sales_manager") {
      // Sales managers can see all deals
      // No additional filtering needed
    } else if (userRole === "admin") {
      // Admins can see all deals and can filter by sales rep
      if (filters?.salesPersonId) {
        query = query.eq("sales_rep_id", filters.salesPersonId);
      }
    } else if (userRole === "viewer") {
      // Viewers can see all deals (read-only access)
      // No additional filtering needed
    } else {
      // Other roles have limited or no access to deals
      return { success: false, error: "Insufficient permissions" };
    }

    // Apply date filters if provided
    if (filters?.year || filters?.month) {
      // If both year and month are provided, filter by specific month in that year
      if (
        filters?.year &&
        filters?.year !== "all" &&
        filters?.month &&
        filters?.month !== "all"
      ) {
        const year = filters.year;
        const monthNum = filters.month;

        // Calculate start and end dates for the specific month and year
        const startDate = `${year}-${monthNum}-01`;

        // Calculate the last day of the month
        const endDay = new Date(Number(year), Number(monthNum), 0).getDate();
        const endDate = `${year}-${monthNum}-${endDay}`;

        // Filter orders by date range
        query = query.gte("order_date", startDate).lte("order_date", endDate);
      }
      // If only year is provided, filter by entire year
      else if (filters?.year && filters?.year !== "all") {
        const year = filters.year;

        // Filter for the entire year
        const startDate = `${year}-01-01`;
        const endDate = `${year}-12-31`;

        query = query.gte("order_date", startDate).lte("order_date", endDate);
      }
      // If only month is provided, filter by that month across all years
      else if (filters?.month && filters?.month !== "all") {
        const monthNum = filters.month;

        // Filter by month pattern across all years
        query = query.ilike("order_date", `%-${monthNum}-%`);
      }
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching deals:", error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error in getDeals:", error);
    return { success: false, error };
  }
}

/**
 * Get a single deal by ID
 */
export async function getDealById(
  orderId: string,
  userId: string,
  userRole: UserRole
) {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("orders")
      .select(
        `
        *,
        leads:lead_id(*),
        sales_rep:sales_rep_id(id, full_name)
      `
      )
      .eq("id", orderId)
      .single();

    if (error) {
      console.error("Error fetching deal:", error);
      return { success: false, error };
    }

    // Check permissions based on role
    if (userRole === "sales_rep" && data.sales_rep_id !== userId) {
      return { success: false, error: "Insufficient permissions" };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error in getDealById:", error);
    return { success: false, error };
  }
}
