import { users, properties, purchases, loans, payments, documents } from '@shared/schema';
import type { User, InsertUser, Property, Purchase, Loan, Payment, Document } from '@shared/schema';
import { db } from './db';
import { eq } from 'drizzle-orm';
import session from 'express-session';
import connectPg from 'connect-pg-simple';

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Property operations
  getProperties(): Promise<Property[]>;
  getProperty(id: number): Promise<Property | undefined>;
  createProperty(property: Omit<Property, 'id'>): Promise<Property>;
  updateProperty(id: number, property: Partial<Property>): Promise<Property>;
  deleteProperty(id: number): Promise<void>;

  // Purchase operations
  getPurchases(userId?: number): Promise<Purchase[]>;
  getPurchase(id: number): Promise<Purchase | undefined>;
  createPurchase(purchase: Omit<Purchase, 'id'>): Promise<Purchase>;
  updatePurchase(id: number, purchase: Partial<Purchase>): Promise<Purchase>;
  deletePurchase(id: number): Promise<void>;

  // Loan operations
  getLoans(purchaseId?: number): Promise<Loan[]>;
  getLoan(id: number): Promise<Loan | undefined>;
  createLoan(loan: Omit<Loan, 'id'>): Promise<Loan>;
  updateLoan(id: number, loan: Partial<Loan>): Promise<Loan>;
  deleteLoan(id: number): Promise<void>;

  // Payment operations
  getPayments(purchaseId?: number): Promise<Payment[]>;
  getPayment(id: number): Promise<Payment | undefined>;
  createPayment(payment: Omit<Payment, 'id'>): Promise<Payment>;
  updatePayment(id: number, payment: Partial<Payment>): Promise<Payment>;
  deletePayment(id: number): Promise<void>;

  // Document operations
  getDocuments(entityType: string, entityId: number): Promise<Document[]>;
  createDocument(document: Omit<Document, 'id'>): Promise<Document>;
  deleteDocument(id: number): Promise<void>;

  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      conObject: {
        connectionString: process.env.DATABASE_URL,
      },
      createTableIfMissing: true,
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // Property operations
  async getProperties(): Promise<Property[]> {
    return await db.select().from(properties);
  }

  async getProperty(id: number): Promise<Property | undefined> {
    const [property] = await db.select().from(properties).where(eq(properties.id, id));
    return property;
  }

  async createProperty(property: Omit<Property, 'id'>): Promise<Property> {
    const [created] = await db.insert(properties).values(property).returning();
    return created;
  }

  async updateProperty(id: number, property: Partial<Property>): Promise<Property> {
    const [updated] = await db
      .update(properties)
      .set(property)
      .where(eq(properties.id, id))
      .returning();
    return updated;
  }

  async deleteProperty(id: number): Promise<void> {
    await db.delete(properties).where(eq(properties.id, id));
  }

  // Purchase operations
  async getPurchases(userId?: number): Promise<Purchase[]> {
    let query = db.select().from(purchases);
    if (userId) {
      query = query.where(eq(purchases.user_id, userId));
    }
    return await query;
  }

  async getPurchase(id: number): Promise<Purchase | undefined> {
    const [purchase] = await db.select().from(purchases).where(eq(purchases.id, id));
    return purchase;
  }

  async createPurchase(purchase: Omit<Purchase, 'id'>): Promise<Purchase> {
    const [created] = await db.insert(purchases).values(purchase).returning();
    return created;
  }

  async updatePurchase(id: number, purchase: Partial<Purchase>): Promise<Purchase> {
    const [updated] = await db
      .update(purchases)
      .set(purchase)
      .where(eq(purchases.id, id))
      .returning();
    return updated;
  }

  async deletePurchase(id: number): Promise<void> {
    await db.delete(purchases).where(eq(purchases.id, id));
  }

  // Loan operations  
  async getLoans(purchaseId?: number): Promise<Loan[]> {
    let query = db.select().from(loans);
    if (purchaseId) {
      query = query.where(eq(loans.purchase_id, purchaseId));
    }
    return await query;
  }

  async getLoan(id: number): Promise<Loan | undefined> {
    const [loan] = await db.select().from(loans).where(eq(loans.id, id));
    return loan;
  }

  async createLoan(loan: Omit<Loan, 'id'>): Promise<Loan> {
    const [created] = await db.insert(loans).values(loan).returning();
    return created;
  }

  async updateLoan(id: number, loan: Partial<Loan>): Promise<Loan> {
    const [updated] = await db
      .update(loans)
      .set(loan)
      .where(eq(loans.id, id))
      .returning();
    return updated;
  }

  async deleteLoan(id: number): Promise<void> {
    await db.delete(loans).where(eq(loans.id, id));
  }

  // Payment operations
  async getPayments(purchaseId?: number): Promise<Payment[]> {
    let query = db.select().from(payments);
    if (purchaseId) {
      query = query.where(eq(payments.purchase_id, purchaseId));
    }
    return await query;
  }

  async getPayment(id: number): Promise<Payment | undefined> {
    const [payment] = await db.select().from(payments).where(eq(payments.id, id));
    return payment;
  }

  async createPayment(payment: Omit<Payment, 'id'>): Promise<Payment> {
    const [created] = await db.insert(payments).values(payment).returning();
    return created;
  }

  async updatePayment(id: number, payment: Partial<Payment>): Promise<Payment> {
    const [updated] = await db
      .update(payments)
      .set(payment)
      .where(eq(payments.id, id))
      .returning();
    return updated;
  }

  async deletePayment(id: number): Promise<void> {
    await db.delete(payments).where(eq(payments.id, id));
  }

  // Document operations
  async getDocuments(entityType: string, entityId: number): Promise<Document[]> {
    return await db
      .select()
      .from(documents)
      .where(eq(documents.entity_type, entityType))
      .where(eq(documents.entity_id, entityId));
  }

  async createDocument(document: Omit<Document, 'id'>): Promise<Document> {
    const [created] = await db.insert(documents).values(document).returning();
    return created;
  }

  async deleteDocument(id: number): Promise<void> {
    await db.delete(documents).where(eq(documents.id, id));
  }
}

export const storage = new DatabaseStorage();
