import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { runReportForBusiness } from "./reports";
import { insertBusinessSchema } from "@shared/schema";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  app.get("/api/businesses", async (req, res) => {
    try {
      const businesses = await storage.listBusinesses();
      res.json(businesses);
    } catch (error) {
      console.error("Error listing businesses:", error);
      res.status(500).json({ error: "Failed to list businesses" });
    }
  });

  app.post("/api/businesses", async (req, res) => {
    try {
      const validationResult = insertBusinessSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: "Validation failed", 
          details: validationResult.error.flatten() 
        });
      }

      const business = await storage.addBusiness(validationResult.data);
      res.status(201).json(business);
    } catch (error) {
      console.error("Error creating business:", error);
      res.status(500).json({ error: "Failed to create business" });
    }
  });

  app.get("/api/businesses/:id", async (req, res) => {
    try {
      const business = await storage.getBusiness(req.params.id);
      
      if (!business) {
        return res.status(404).json({ error: "Business not found" });
      }

      res.json(business);
    } catch (error) {
      console.error("Error getting business:", error);
      res.status(500).json({ error: "Failed to get business" });
    }
  });

  app.delete("/api/businesses/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteBusiness(req.params.id);
      
      if (!deleted) {
        return res.status(404).json({ error: "Business not found" });
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting business:", error);
      res.status(500).json({ error: "Failed to delete business" });
    }
  });

  app.post("/api/run-report/:id", async (req, res) => {
    try {
      const businessId = req.params.id;
      
      const business = await storage.getBusiness(businessId);
      if (!business) {
        return res.status(404).json({ error: "Business not found" });
      }

      const report = await runReportForBusiness(businessId);
      res.json(report);
    } catch (error) {
      console.error("Error generating report:", error);
      res.status(500).json({ error: "Failed to generate report" });
    }
  });

  app.get("/api/reports/business/:businessId", async (req, res) => {
    try {
      const reports = await storage.getReportsByBusinessId(req.params.businessId);
      res.json(reports);
    } catch (error) {
      console.error("Error getting reports:", error);
      res.status(500).json({ error: "Failed to get reports" });
    }
  });

  app.get("/api/reports", async (req, res) => {
    try {
      const reports = await storage.listAllReports();
      res.json(reports);
    } catch (error) {
      console.error("Error listing reports:", error);
      res.status(500).json({ error: "Failed to list reports" });
    }
  });

  app.get("/api/reports/:id", async (req, res) => {
    try {
      const report = await storage.getReport(req.params.id);
      
      if (!report) {
        return res.status(404).json({ error: "Report not found" });
      }

      res.json(report);
    } catch (error) {
      console.error("Error getting report:", error);
      res.status(500).json({ error: "Failed to get report" });
    }
  });

  return httpServer;
}
