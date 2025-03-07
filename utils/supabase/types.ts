/**
 * User role enum type from the database
 */
export type UserRole =
  | "admin"
  | "sales_manager"
  | "sales_rep"
  | "lead_assigner"
  | "quote_maker";

/**
 * Lead status enum type from the database
 */
export type LeadStatus = "new" | "quote_made" | "negotiation" | "won" | "lost";

/**
 * Order status enum type from the database
 */
export type OrderStatus = "pending" | "active" | "completed";

/**
 * Property type enum from the database
 */
export type PropertyType = "residential" | "commercial";

/**
 * Lead found through enum type from the database
 */
export type LeadFoundThrough = "scanner" | "ads" | "social_media" | "organic";

/**
 * Quote request status enum type from the database
 */
export type QuoteRequestStatus = "pending" | "active" | "completed";

/**
 * User interface
 */
export interface User {
  id: string;
  full_name: string;
  role: UserRole;
}

/**
 * Lead interface
 */
export interface Lead {
  id: string;
  name: string;
  address: string;
  property_type: PropertyType;
  company?: string;
  architect_name?: string;
  phone_number: string;
  quote_value: number;
  status: LeadStatus;
  next_follow_up_date?: string;
  notes?: string;
  lead_created_date: string;
  lead_found_through: LeadFoundThrough;
}

/**
 * Order (Deal) interface
 */
export interface Order {
  id: string;
  lead_id: string;
  sales_rep_id: string;
  amount_in: number;
  tax_amount: number;
  middleman_cut: number;
  total_value: number; // Computed field
  order_date: string;
  status: OrderStatus;
  notes?: string;
  amount_recieved: number;
  final_size_date?: string; // Added field for final size date
  // Joined fields
  leads?: Lead;
  sales_rep?: {
    id: string;
    full_name: string;
  };
}

/**
 * Quote Request interface
 */
export interface QuoteRequest {
  id: string;
  lead_id: string;
  sales_rep_id: string;
  quote_maker_id?: string;
  requested_at: string;
  quoted_at?: string;
  status: QuoteRequestStatus;
  quote_value: number;
}
