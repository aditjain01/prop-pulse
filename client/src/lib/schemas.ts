import { z } from "zod";

// Base types that match the server models
export type User = {
  id: number;
  username: string;
  email: string;
  created_at: string;
};

export type Property = {
  id: number;
  name: string;
  address: string;
  property_type: string;
  carpet_area: number | null;
  exclusive_area: number | null;
  common_area: number | null;
  floor_number: number | null;
  parking_details: string | null;
  amenities: string[];
  initial_rate: number;
  current_rate: number;
  developer: string | null;
  rera_id: string | null;
  super_area: number | null;
  created_at: string;
  updated_at: string;
};

export type Purchase = {
  id: number;
  property_id: number;
  user_id: number;
  purchase_date: string;
  registration_date: string | null;
  possession_date: string | null;
  base_cost: number;
  other_charges: number | null;
  ifms: number | null;
  lease_rent: number | null;
  amc: number | null;
  gst: number | null;
  property_cost: number;
  total_cost: number;
  total_sale_cost: number;
  seller: string | null;
  remarks: string | null;
  created_at: string;
  property?: Property; // For joined queries
};

export type Loan = {
  id: number;
  user_id: number | null;
  purchase_id: number;
  name: string;
  institution: string;
  agent: string | null;
  sanction_date: string;
  sanction_amount: number;
  processing_fee: number;
  other_charges: number;
  loan_sanction_charges: number;
  interest_rate: number;
  tenure_months: number;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
};

export type PaymentSource = {
  id: number;
  user_id: number;
  name: string;
  source_type: string;
  description: string | null;
  is_active: boolean;
  bank_name: string | null;
  account_number: string | null;
  ifsc_code: string | null;
  branch: string | null;
  loan_id: number | null;
  lender: string | null;
  card_number: string | null;
  card_expiry: string | null;
  wallet_provider: string | null;
  wallet_identifier: string | null;
  created_at: string;
  updated_at: string | null;
};

export type Payment = {
  id: number;
  purchase_id: number;
  user_id: number;
  payment_date: string;
  amount: number;
  payment_source_id: number;
  payment_mode: string;
  transaction_reference: string | null;
  milestone: string | null;
  invoice_date: string | null;
  invoice_number: string | null;
  invoice_amount: number | null;
  receipt_date: string | null;
  receipt_number: string | null;
  receipt_amount: number | null;
  created_at: string;
  updated_at: string | null;
  payment_source?: PaymentSource; // For joined queries
  purchase?: Purchase; // For joined queries
};

export type Document = {
  id: number;
  entity_type: string;
  entity_id: number;
  file_path: string;
  document_vector: string | null;
  metadata: Record<string, any> | null;
  created_at: string;
};

// Zod schemas for form validation

// Property schemas
export const propertyFormSchema = z.object({
  name: z.string().nonempty("Property name is required"),
  address: z.string().nonempty("Address is required"),
  property_type: z.string().nonempty("Property type is required"),
  carpet_area: z.string().optional().transform(val => val ? parseFloat(val) : null),
  exclusive_area: z.string().optional().transform(val => val ? parseFloat(val) : null),
  common_area: z.string().optional().transform(val => val ? parseFloat(val) : null),
  floor_number: z.string().optional().transform(val => val ? parseInt(val) : null),
  parking_details: z.string().optional(),
  amenities: z.array(z.string()).default([]),
  initial_rate: z.string().transform(val => parseFloat(val) || 0),
  current_rate: z.string().transform(val => parseFloat(val) || 0),
  developer: z.string().optional(),
  rera_id: z.string().optional(),
});

export type PropertyFormValues = z.infer<typeof propertyFormSchema>;

// Purchase schemas
export const purchaseFormSchema = z.object({
  property_id: z.string().nonempty("Property is required"),
  purchase_date: z.string().nonempty("Purchase date is required"),
  registration_date: z.string().optional(),
  possession_date: z.string().optional(),
  base_cost: z.string().transform(val => parseFloat(val) || 0),
  other_charges: z.string().transform(val => parseFloat(val) || 0),
  ifms: z.string().transform(val => parseFloat(val) || 0),
  lease_rent: z.string().transform(val => parseFloat(val) || 0),
  amc: z.string().transform(val => parseFloat(val) || 0),
  gst: z.string().transform(val => parseFloat(val) || 0),
  seller: z.string().optional(),
  remarks: z.string().optional(),
});

export type PurchaseFormValues = z.infer<typeof purchaseFormSchema>;

// Loan schemas
export const loanFormSchema = z.object({
  purchase_id: z.string().nonempty("Purchase is required"),
  name: z.string().nonempty("Loan name is required"),
  institution: z.string().nonempty("Institution is required"),
  agent: z.string().optional(),
  sanction_date: z.string().nonempty("Sanction date is required"),
  sanction_amount: z.number().min(1, "Amount must be greater than 0"),
  processing_fee: z.number().default(0),
  other_charges: z.number().default(0),
  loan_sanction_charges: z.number().default(0),
  interest_rate: z.number().min(0, "Interest rate must be positive"),
  tenure_months: z.number().int().min(1, "Tenure must be at least 1 month"),
  is_active: z.boolean().default(true),
});

export type LoanFormValues = z.infer<typeof loanFormSchema>;

// Payment source schemas
export const paymentSourceFormSchema = z.object({
  name: z.string().nonempty("Name is required"),
  source_type: z.string().nonempty("Source type is required"),
  description: z.string().optional(),
  is_active: z.boolean().default(true),
  
  // Conditional fields based on source_type
  bank_name: z.string().optional(),
  account_number: z.string().optional(),
  ifsc_code: z.string().optional(),
  branch: z.string().optional(),
  
  loan_id: z.string().optional(),
  lender: z.string().optional(),
  
  card_number: z.string().optional(),
  card_expiry: z.string().optional(),
  
  wallet_provider: z.string().optional(),
  wallet_identifier: z.string().optional(),
});

export type PaymentSourceFormValues = z.infer<typeof paymentSourceFormSchema>;

// Payment schemas
export const paymentFormSchema = z.object({
  purchase_id: z.string().nonempty("Purchase is required"),
  payment_date: z.string().nonempty("Payment date is required"),
  amount: z.number().min(1, "Amount must be greater than 0"),
  payment_source_id: z.string().nonempty("Payment source is required"),
  payment_mode: z.string().nonempty("Payment mode is required"),
  transaction_reference: z.string().optional(),
  milestone: z.string().optional(),
  
  // Invoice details
  invoice_date: z.string().optional(),
  invoice_number: z.string().optional(),
  invoice_amount: z.number().optional(),
  
  // Receipt details
  receipt_date: z.string().optional(),
  receipt_number: z.string().optional(),
  receipt_amount: z.number().optional(),
});

export type PaymentFormValues = z.infer<typeof paymentFormSchema>;

// Document schemas
export const documentFormSchema = z.object({
  entity_type: z.string().nonempty("Entity type is required"),
  entity_id: z.number().int().positive("Entity ID is required"),
  file: z.instanceof(File, { message: "File is required" }),
  metadata: z.record(z.string(), z.any()).optional(),
});

export type DocumentFormValues = z.infer<typeof documentFormSchema>;

// Helper functions for form initialization
export const initializePropertyForm = (property?: Property): PropertyFormValues => {
  return {
    name: property?.name || "",
    address: property?.address || "",
    property_type: property?.property_type || "",
    carpet_area: property?.carpet_area?.toString() || "",
    exclusive_area: property?.exclusive_area?.toString() || "",
    common_area: property?.common_area?.toString() || "",
    floor_number: property?.floor_number?.toString() || "",
    parking_details: property?.parking_details || "",
    amenities: property?.amenities || [],
    initial_rate: property?.initial_rate?.toString() || "0",
    current_rate: property?.current_rate?.toString() || "0",
    developer: property?.developer || "",
    rera_id: property?.rera_id || "",
  };
};

export const initializePurchaseForm = (purchase?: Purchase): PurchaseFormValues => {
  return {
    property_id: purchase?.property_id?.toString() || "",
    purchase_date: purchase?.purchase_date || new Date().toISOString().split('T')[0],
    registration_date: purchase?.registration_date || "",
    possession_date: purchase?.possession_date || "",
    base_cost: purchase?.base_cost?.toString() || "0",
    other_charges: purchase?.other_charges?.toString() || "0",
    ifms: purchase?.ifms?.toString() || "0",
    lease_rent: purchase?.lease_rent?.toString() || "0",
    amc: purchase?.amc?.toString() || "0",
    gst: purchase?.gst?.toString() || "0",
    seller: purchase?.seller || "",
    remarks: purchase?.remarks || "",
  };
};

export const initializeLoanForm = (loan?: Loan, purchaseId?: number): LoanFormValues => {
  return {
    purchase_id: loan?.purchase_id?.toString() || purchaseId?.toString() || "",
    name: loan?.name || "",
    institution: loan?.institution || "",
    agent: loan?.agent || "",
    sanction_date: loan?.sanction_date || new Date().toISOString().split('T')[0],
    sanction_amount: loan?.sanction_amount || 0,
    processing_fee: loan?.processing_fee || 0,
    other_charges: loan?.other_charges || 0,
    loan_sanction_charges: loan?.loan_sanction_charges || 0,
    interest_rate: loan?.interest_rate || 0,
    tenure_months: loan?.tenure_months || 0,
    is_active: loan?.is_active ?? true,
  };
};

export const initializePaymentSourceForm = (source?: PaymentSource): PaymentSourceFormValues => {
  return {
    name: source?.name || "",
    source_type: source?.source_type || "",
    description: source?.description || "",
    is_active: source?.is_active ?? true,
    bank_name: source?.bank_name || "",
    account_number: source?.account_number || "",
    ifsc_code: source?.ifsc_code || "",
    branch: source?.branch || "",
    loan_id: source?.loan_id?.toString() || "",
    lender: source?.lender || "",
    card_number: source?.card_number || "",
    card_expiry: source?.card_expiry || "",
    wallet_provider: source?.wallet_provider || "",
    wallet_identifier: source?.wallet_identifier || "",
  };
};

export const initializePaymentForm = (payment?: Payment, purchaseId?: number): PaymentFormValues => {
  return {
    purchase_id: payment?.purchase_id?.toString() || purchaseId?.toString() || "",
    payment_date: payment?.payment_date || new Date().toISOString().split('T')[0],
    amount: payment?.amount || 0,
    payment_source_id: payment?.payment_source_id?.toString() || "",
    payment_mode: payment?.payment_mode || "online",
    transaction_reference: payment?.transaction_reference || "",
    milestone: payment?.milestone || "",
    invoice_date: payment?.invoice_date || "",
    invoice_number: payment?.invoice_number || "",
    invoice_amount: payment?.invoice_amount || 0,
    receipt_date: payment?.receipt_date || "",
    receipt_number: payment?.receipt_number || "",
    receipt_amount: payment?.receipt_amount || 0,
  };
}; 