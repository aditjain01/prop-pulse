import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import multer from "multer";
import path from "path";
import { insertPropertySchema, insertPurchaseSchema, insertLoanSchema, insertPaymentSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  // Configure multer for file uploads
  const upload = multer({
    dest: 'uploads/',
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB limit
    }
  });

  // Middleware to check if user is authenticated
  const requireAuth = (req: any, res: any, next: any) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    next();
  };

  // Property routes
  app.get("/api/properties", requireAuth, async (req, res) => {
    const properties = await storage.getProperties();
    res.json(properties);
  });

  app.get("/api/properties/:id", requireAuth, async (req, res) => {
    const property = await storage.getProperty(parseInt(req.params.id));
    if (!property) return res.status(404).json({ message: "Property not found" });
    res.json(property);
  });

  app.post("/api/properties", requireAuth, async (req, res) => {
    const parsed = insertPropertySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.message });
    }
    const property = await storage.createProperty(parsed.data);
    res.status(201).json(property);
  });

  app.put("/api/properties/:id", requireAuth, async (req, res) => {
    const property = await storage.updateProperty(parseInt(req.params.id), req.body);
    res.json(property);
  });

  app.delete("/api/properties/:id", requireAuth, async (req, res) => {
    await storage.deleteProperty(parseInt(req.params.id));
    res.sendStatus(204);
  });

  // Purchase routes
  app.get("/api/purchases", requireAuth, async (req, res) => {
    const purchases = await storage.getPurchases(req.user?.id);
    res.json(purchases);
  });

  app.get("/api/purchases/:id", requireAuth, async (req, res) => {
    const purchase = await storage.getPurchase(parseInt(req.params.id));
    if (!purchase) return res.status(404).json({ message: "Purchase not found" });
    res.json(purchase);
  });

  app.post("/api/purchases", requireAuth, async (req, res) => {
    const parsed = insertPurchaseSchema.safeParse({ ...req.body, user_id: req.user?.id });
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.message });
    }
    const purchase = await storage.createPurchase(parsed.data);
    res.status(201).json(purchase);
  });

  // Loan routes
  app.get("/api/loans", requireAuth, async (req, res) => {
    const loans = await storage.getLoans(req.query.purchase_id ? parseInt(req.query.purchase_id as string) : undefined);
    res.json(loans);
  });

  app.post("/api/loans", requireAuth, async (req, res) => {
    const parsed = insertLoanSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.message });
    }
    const loan = await storage.createLoan(parsed.data);
    res.status(201).json(loan);
  });

  // Payment routes
  app.get("/api/payments", requireAuth, async (req, res) => {
    const payments = await storage.getPayments(req.query.purchase_id ? parseInt(req.query.purchase_id as string) : undefined);
    res.json(payments);
  });

  app.post("/api/payments", requireAuth, async (req, res) => {
    const parsed = insertPaymentSchema.safeParse({ ...req.body, user_id: req.user?.id });
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.message });
    }
    const payment = await storage.createPayment(parsed.data);
    res.status(201).json(payment);
  });

  // Document routes
  app.post("/api/documents", requireAuth, upload.single('file'), async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const document = await storage.createDocument({
      entity_type: req.body.entity_type,
      entity_id: parseInt(req.body.entity_id),
      file_path: req.file.path,
      metadata: req.body.metadata ? JSON.parse(req.body.metadata) : null,
    });

    res.status(201).json(document);
  });

  app.get("/api/documents/:entityType/:entityId", requireAuth, async (req, res) => {
    const documents = await storage.getDocuments(
      req.params.entityType,
      parseInt(req.params.entityId)
    );
    res.json(documents);
  });

  const httpServer = createServer(app);
  return httpServer;
}
