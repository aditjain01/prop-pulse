import { z } from "zod";

import { components } from ".";


export type Property = components["schemas"]["Property"];
export type PropertyCreate = components["schemas"]["PropertyCreate"];
export type PropertyUpdate = components["schemas"]["PropertyUpdate"];
export type PropertyPublic = components["schemas"]["PropertyPublic"];

export type Purchase = components["schemas"]["Purchase"];
export type PurchaseCreate = components["schemas"]["PurchaseCreate"];
export type PurchaseUpdate = components["schemas"]["PurchaseUpdate"];
export type PurchasePublic = components["schemas"]["PurchasePublic"];

export type Loan = components["schemas"]["Loan"];
export type LoanCreate = components["schemas"]["LoanCreate"];
export type LoanUpdate = components["schemas"]["LoanUpdate"];
export type LoanPublic = components["schemas"]["LoanPublic"];

export type PaymentSource = components["schemas"]["PaymentSource"];
export type PaymentSourceCreate = components["schemas"]["PaymentSourceCreate"];
export type PaymentSourceUpdate = components["schemas"]["PaymentSourceUpdate"];

export type Invoice = components["schemas"]["Invoice"];
export type InvoiceCreate = components["schemas"]["InvoiceCreate"];
export type InvoiceUpdate = components["schemas"]["InvoiceUpdate"];
export type InvoicePublic = components["schemas"]["InvoicePublic"];

export type Payment = components["schemas"]["Payment"];
export type PaymentCreate = components["schemas"]["PaymentCreate"];
export type PaymentUpdate = components["schemas"]["PaymentUpdate"];
export type PaymentPublic = components["schemas"]["PaymentPublic"];

export type LoanRepayment = components["schemas"]["LoanRepayment"];
export type LoanRepaymentCreate = components["schemas"]["LoanRepaymentCreate"];
export type LoanRepaymentUpdate = components["schemas"]["LoanRepaymentUpdate"];
export type LoanRepaymentPublic = components["schemas"]["LoanRepaymentPublic"];


// Base types that match the server models
export type User = {
  id: number;
  username: string;
  email: string;
  created_at: string;
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
const propertySchema = z.object({
  name: z.string().nonempty("Name is required"),
  address: z.string().optional(),
  property_type: z.string().optional(),
  parking_details: z.string().optional(),
  amenities: z.array(z.string()).default([]),
  developer: z.string().optional(),
  rera_id: z.string().optional(),
});

export const propertyFormSchema = propertySchema.transform(data => ({
  ...data,
}));

export type PropertyFormValues = z.input<typeof propertyFormSchema>;
export const propertyUpdateSchema = propertySchema.partial().transform((data: Partial<z.infer<typeof propertySchema>>) => ({
  ...data,
}));
export type PropertyUpdateValues = z.infer<typeof propertyUpdateSchema>;

// Initialize form values
export function initializePropertyForm(property?: Property): PropertyFormValues {
  return {
    name: property?.name ?? "",
    address: property?.address ?? "",
    property_type: property?.property_type ?? "",
    parking_details: property?.parking_details ?? "",
    amenities: property?.amenities ?? [],
    developer: property?.developer ?? "",
    rera_id: property?.rera_id ?? "",
  };
}


// Purchase schemas
export const purchaseFormSchema = z.object({
  property_id: z.string().nonempty("Property is required"),
  purchase_date: z.string().transform(val => val || null),
  registration_date: z.string().transform(val => val || null),
  possession_date: z.string().transform(val => val || null),
  carpet_area: z.string().transform(val => parseFloat(val) || 0),
  exclusive_area: z.string().transform(val => parseFloat(val) || 0),
  common_area: z.string().transform(val => parseFloat(val) || 0),
  floor_number: z.string().transform(val => parseInt(val) || 0),
  purchase_rate: z.string().transform(val => parseFloat(val) || 0),
  current_rate: z.string().transform(val => parseFloat(val) || 0),
  base_cost: z.string().transform(val => parseFloat(val) || 0),
  other_charges: z.string().transform(val => parseFloat(val) || 0),
  ifms: z.string().transform(val => parseFloat(val) || 0),
  lease_rent: z.string().transform(val => parseFloat(val) || 0),
  amc: z.string().transform(val => parseFloat(val) || 0),
  gst: z.string().transform(val => parseFloat(val) || 0),
  seller: z.string().optional(),
  remarks: z.string().optional(),
});

export type PurchaseFormValues = z.input<typeof purchaseFormSchema>;
export const purchaseUpdateSchema = purchaseFormSchema.partial();
export type PurchaseUpdateValues = z.infer<typeof purchaseUpdateSchema>;

export const initializePurchaseForm = (purchase?: PurchaseCreate, propertyId?: number): PurchaseFormValues => {
  return {
    property_id: propertyId?.toString() || purchase?.property_id?.toString() || "",
    purchase_date: purchase?.purchase_date || new Date().toISOString().split('T')[0],
    registration_date: purchase?.registration_date || new Date().toISOString().split('T')[0],
    possession_date: purchase?.possession_date || "",
    carpet_area: purchase?.carpet_area?.toString() || "0",
    exclusive_area: purchase?.exclusive_area?.toString() || "0",
    common_area: purchase?.common_area?.toString() || "0",
    floor_number: purchase?.floor_number?.toString() || "0",
    purchase_rate: purchase?.purchase_rate?.toString() || "0",
    current_rate: purchase?.current_rate?.toString() || "0",
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


// Loan schemas
const loanSchema = z.object({
  purchase_id: z.string().nonempty("Purchase is required"),
  loan_number: z.string().nonempty("Loan number is required"),
  institution: z.string().nonempty("Institution is required"),
  agent: z.string().optional(),
  sanction_date: z.string().transform(val => val || null),
  sanction_amount: z.string(),
  processing_fee: z.string(),
  other_charges: z.string(),
  loan_sanction_charges: z.string(),
  interest_rate: z.string(),
  tenure_months: z.string(),
  is_active: z.boolean().default(true),
});

export const loanFormSchema = loanSchema.transform(data => ({
  ...data,
  sanction_amount: parseFloat(data.sanction_amount) || 0,
  processing_fee: parseFloat(data.processing_fee) || 0,
  other_charges: parseFloat(data.other_charges) || 0,
  loan_sanction_charges: parseFloat(data.loan_sanction_charges) || 0,
  interest_rate: parseFloat(data.interest_rate) || 0,
  tenure_months: parseInt(data.tenure_months) || 0,
}));

export type LoanFormValues = z.input<typeof loanFormSchema>;

// Update the loanUpdateSchema to ensure all fields are properly typed
export const loanUpdateSchema = z.object({
  loan_number: z.string().optional(),
  institution: z.string().optional(),
  agent: z.string().optional(),
  sanction_date: z.string().optional(),
  sanction_amount: z.number().optional(),
  processing_fee: z.number().optional(),
  other_charges: z.number().optional(),
  loan_sanction_charges: z.number().optional(),
  interest_rate: z.number().optional(),
  tenure_months: z.number().optional(),
  is_active: z.boolean().optional(),
}).transform((data: Partial<z.infer<typeof loanSchema>>) => {
  // Ensure all number fields are properly converted from strings if needed
  return {
    ...data,
    sanction_amount: data.sanction_amount?.toString(),
    processing_fee: data.processing_fee?.toString(),
    other_charges: data.other_charges?.toString(),
    loan_sanction_charges: data.loan_sanction_charges?.toString(),
    interest_rate: data.interest_rate?.toString(),
    tenure_months: data.tenure_months,
  };
});

export type LoanUpdateValues = z.infer<typeof loanUpdateSchema>;

export const initializeLoanForm = (loan?: LoanCreate, purchaseId?: number): LoanFormValues => {
  return {
    purchase_id: purchaseId?.toString() || loan?.purchase_id?.toString() || "",
    loan_number: loan?.loan_number || "",
    institution: loan?.institution || "",
    agent: loan?.agent || "",
    sanction_date: loan?.sanction_date || new Date().toISOString().split('T')[0],
    sanction_amount: loan?.sanction_amount?.toString() || "0",
    processing_fee: loan?.processing_fee?.toString() || "0",
    other_charges: loan?.other_charges?.toString() || "0",
    loan_sanction_charges: loan?.loan_sanction_charges?.toString() || "0",
    interest_rate: loan?.interest_rate?.toString() || "0",
    tenure_months: loan?.tenure_months?.toString() || "0",
    is_active: loan?.is_active ?? true,
  };
};


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
export const paymentSourceUpdateSchema = paymentSourceFormSchema.partial();
export type PaymentSourceUpdateValues = z.infer<typeof paymentSourceUpdateSchema>;
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


// Payment schemas
const paymentSchema = z.object({
  invoice_id: z.string().nonempty("Invoice is required"),
  payment_date: z.string().transform(val => val || null),
  amount: z.string(),
  source_id: z.string().nonempty("Payment source is required"),
  payment_mode: z.string(),
  transaction_reference: z.string().optional(),
  receipt_date: z.string().transform(val => val || null),
  receipt_number: z.string().optional(),
  notes: z.string().optional(),
});

export const paymentFormSchema = paymentSchema.transform(data => ({
  ...data,
  amount: parseFloat(data.amount) || 0,
}));

export type PaymentFormValues = z.input<typeof paymentFormSchema>;
export const paymentUpdateSchema = paymentSchema.partial().transform((data: Partial<z.infer<typeof paymentSchema>>) => ({
  ...data,
  amount: data.amount ? parseFloat(data.amount) : undefined,
}));
export type PaymentUpdateValues = z.infer<typeof paymentUpdateSchema>;
export const initializePaymentForm = (payment?: PaymentCreate, invoiceId?: number): PaymentFormValues => {
  return {
    invoice_id: invoiceId?.toString() || "",
    payment_date: payment?.payment_date || new Date().toISOString().split('T')[0],
    amount: payment?.amount?.toString() || "0",
    source_id: payment?.source_id?.toString() || "",
    payment_mode: payment?.payment_mode || "online",
    transaction_reference: payment?.transaction_reference || "",
    receipt_date: payment?.receipt_date || "",
    receipt_number: payment?.receipt_number || "",
    notes: payment?.notes || "",
  };
};


// Add LoanRepayment form schema
const loanRepaymentSchema = z.object({
  loan_id: z.string().nonempty("Loan is required"),
  payment_date: z.string().transform(val => val || null),
  principal_amount: z.string(),
  interest_amount: z.string(),
  other_fees: z.string(),
  penalties: z.string(),
  source_id: z.string().nonempty("Payment source is required"),
  payment_mode: z.string().nonempty("Payment mode is required"),
  transaction_reference: z.string().optional(),
  notes: z.string().optional(),
});

export const loanRepaymentFormSchema = loanRepaymentSchema.transform(data => ({
  ...data,
  principal_amount: parseFloat(data.principal_amount) || 0,
  interest_amount: parseFloat(data.interest_amount) || 0,
  other_fees: parseFloat(data.other_fees) || 0,
  penalties: parseFloat(data.penalties) || 0,
}));

export type LoanRepaymentFormValues = z.input<typeof loanRepaymentFormSchema>;
export const loanRepaymentUpdateSchema = loanRepaymentSchema.partial().transform((data: Partial<z.infer<typeof loanRepaymentSchema>>) => ({
  ...data,
  principal_amount: data.principal_amount ? parseFloat(data.principal_amount) : undefined,
  interest_amount: data.interest_amount ? parseFloat(data.interest_amount) : undefined,
  other_fees: data.other_fees ? parseFloat(data.other_fees) : undefined,
  penalties: data.penalties ? parseFloat(data.penalties) : undefined,
}));
export type LoanRepaymentUpdateValues = z.infer<typeof loanRepaymentUpdateSchema>;
export const initializeLoanRepaymentForm = (repayment?: LoanRepaymentCreate, loanId?: number): LoanRepaymentFormValues => {
  return {
    loan_id: loanId?.toString() || "",
    payment_date: repayment?.payment_date || new Date().toISOString().split('T')[0],
    principal_amount: repayment?.principal_amount?.toString() || "0",
    interest_amount: repayment?.interest_amount?.toString() || "0",
    other_fees: repayment?.other_fees?.toString() || "0",
    penalties: repayment?.penalties?.toString() || "0",
    source_id: repayment?.source_id?.toString() || "",
    payment_mode: repayment?.payment_mode || "online",
    transaction_reference: repayment?.transaction_reference || "",
    notes: repayment?.notes || "",
  };
};


// Invoice schemas
const invoiceSchema = z.object({
  purchase_id: z.string().min(1, "Property purchase is required"),
  invoice_number: z.string().min(1, "Invoice number is required"),
  invoice_date: z.string().transform(val => val || null),
  due_date: z.string().transform(val => val || null),
  amount: z.string(),
  status: z.string().min(1, "Status is required"),
  milestone: z.string().optional(),
  description: z.string().optional(),
});

export const invoiceFormSchema = invoiceSchema.transform(data => ({
  ...data,
  amount: parseFloat(data.amount) || 0,
}));

export type InvoiceFormValues = z.input<typeof invoiceFormSchema>;
export const invoiceUpdateSchema = invoiceSchema.partial().transform((data: Partial<z.infer<typeof invoiceSchema>>) => ({
  ...data,
  amount: data.amount ? parseFloat(data.amount) : undefined,
}));
export type InvoiceUpdateValues = z.infer<typeof invoiceUpdateSchema>;
export const initializeInvoiceForm = (invoice?: InvoiceCreate, purchaseId?: number): InvoiceFormValues => {
  return {
    purchase_id: invoice?.purchase_id?.toString() || purchaseId?.toString() || "",
    invoice_number: invoice?.invoice_number || "",
    invoice_date: invoice?.invoice_date ? new Date(invoice.invoice_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    due_date: invoice?.due_date ? new Date(invoice.due_date).toISOString().split('T')[0] : "",
    amount: invoice?.amount?.toString() || "0",
    status: invoice?.status || "pending",
    milestone: invoice?.milestone || "",
    description: invoice?.description || "",
  };
};


// Document schemas
export const documentFormSchema = z.object({
  entity_type: z.string().nonempty("Entity type is required"),
  entity_id: z.number().int().positive("Entity ID is required"),
  file: z.instanceof(File, { message: "File is required" }),
  metadata: z.record(z.string(), z.any()).optional(),
});
export type DocumentFormValues = z.infer<typeof documentFormSchema>;
