import { pgTable, text, serial, integer, decimal, timestamp, jsonb, boolean, date } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from 'drizzle-orm';

// Users table and schemas
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull(),
  created_at: timestamp("created_at").defaultNow(),
});

// Properties table and schemas
export const properties = pgTable("properties", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  address: text("address").notNull(),
  property_type: text("property_type").notNull(), // apartment, villa, plot, etc.
  carpet_area: decimal("carpet_area"),
  super_area: decimal("super_area"),
  builder_area: decimal("builder_area"),
  floor_number: integer("floor_number"),
  parking_details: text("parking_details"),
  amenities: text("amenities").array(),
  initial_rate: decimal("initial_rate").notNull(),
  current_price: decimal("current_price").notNull(),
  status: text("status").notNull().default('available'),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// Purchases table and schemas
export const purchases = pgTable("purchases", {
  id: serial("id").primaryKey(),
  property_id: integer("property_id").references(() => properties.id).notNull(),
  user_id: integer("user_id").references(() => users.id).notNull(),
  purchase_date: date("purchase_date").notNull(),
  registration_date: date("registration_date"),
  possession_date: date("possession_date"),
  final_purchase_price: decimal("final_purchase_price").notNull(),
  cost_breakdown: jsonb("cost_breakdown").notNull(),
  seller_info: text("seller_info"),
  remarks: text("remarks"),
  created_at: timestamp("created_at").defaultNow(),
});

// Loans table and schemas
export const loans = pgTable("loans", {
  id: serial("id").primaryKey(),
  purchase_id: integer("purchase_id").references(() => purchases.id).notNull(),
  bank_name: text("bank_name").notNull(),
  disbursement_date: date("disbursement_date").notNull(),
  interest_rate: decimal("interest_rate").notNull(),
  loan_amount: decimal("loan_amount").notNull(),
  emi_amount: decimal("emi_amount").notNull(),
  tenure_months: integer("tenure_months").notNull(),
  prepayment_charges: decimal("prepayment_charges"),
  created_at: timestamp("created_at").defaultNow(),
});

// Payments table and schemas
export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  purchase_id: integer("purchase_id").references(() => purchases.id).notNull(),
  user_id: integer("user_id").references(() => users.id).notNull(),
  payment_date: date("payment_date").notNull(),
  amount: decimal("amount").notNull(),
  source: text("source").notNull(), // Direct or Loan
  payment_mode: text("payment_mode").notNull(), // cash/check/online
  transaction_reference: text("transaction_reference"),
  milestone: text("milestone").notNull(),
  created_at: timestamp("created_at").defaultNow(),
});

// Documents table and schemas
export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  entity_type: text("entity_type").notNull(), // property or purchase
  entity_id: integer("entity_id").notNull(),
  file_path: text("file_path").notNull(),
  document_vector: text("document_vector"),
  metadata: jsonb("metadata"),
  created_at: timestamp("created_at").defaultNow(),
});

// Relations
export const propertiesRelations = relations(properties, ({ many }) => ({
  purchases: many(purchases),
  documents: many(documents),
}));

export const purchasesRelations = relations(purchases, ({ one, many }) => ({
  property: one(properties, {
    fields: [purchases.property_id],
    references: [properties.id],
  }),
  loans: many(loans),
  payments: many(payments),
  documents: many(documents),
  user: one(users, {
    fields: [purchases.user_id],
    references: [users.id],
  }),
}));

// Insert and Select Types
export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);

export const insertPropertySchema = createInsertSchema(properties);
export const selectPropertySchema = createSelectSchema(properties);

export const insertPurchaseSchema = createInsertSchema(purchases);
export const selectPurchaseSchema = createSelectSchema(purchases);

export const insertLoanSchema = createInsertSchema(loans);
export const selectLoanSchema = createSelectSchema(loans);

export const insertPaymentSchema = createInsertSchema(payments);
export const selectPaymentSchema = createSelectSchema(payments);

export const insertDocumentSchema = createInsertSchema(documents);
export const selectDocumentSchema = createSelectSchema(documents);

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export type Property = typeof properties.$inferSelect;
export type InsertProperty = typeof properties.$inferInsert;

export type Purchase = typeof purchases.$inferSelect;
export type InsertPurchase = typeof purchases.$inferInsert;

export type Loan = typeof loans.$inferSelect;
export type InsertLoan = typeof loans.$inferInsert;

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = typeof payments.$inferInsert;

export type Document = typeof documents.$inferSelect;
export type InsertDocument = typeof documents.$inferInsert;
