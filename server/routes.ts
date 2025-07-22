import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { greyfinchService } from "./services/greyfinch";
import { insertAcquisitionCostSchema, insertLocationSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get locations
  app.get("/api/locations", async (req, res) => {
    try {
      const locations = await storage.getLocations();
      res.json(locations);
    } catch (error) {
      console.error('Error fetching locations:', error);
      res.status(500).json({ error: "Failed to fetch locations" });
    }
  });

  // Create location
  app.post("/api/locations", async (req, res) => {
    try {
      const validatedData = insertLocationSchema.parse(req.body);
      const location = await storage.createLocation(validatedData);
      res.json(location);
    } catch (error) {
      console.error('Error creating location:', error);
      res.status(500).json({ error: "Failed to create location" });
    }
  });

  // Get analytics data
  app.get("/api/analytics", async (req, res) => {
    try {
      const { locationId, startDate, endDate } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({ error: "Start date and end date are required" });
      }

      const parsedLocationId = locationId ? parseInt(locationId as string) : undefined;
      
      // Check cache first
      const cacheKey = `analytics_${parsedLocationId || 'all'}_${startDate}_${endDate}`;
      const cachedData = await storage.getAnalyticsCache(
        parsedLocationId || null,
        startDate as string,
        endDate as string,
        'analytics'
      );

      if (cachedData) {
        const cacheAge = Date.now() - new Date(cachedData.createdAt!).getTime();
        const cacheExpiry = 15 * 60 * 1000; // 15 minutes
        
        if (cacheAge < cacheExpiry) {
          return res.json(JSON.parse(cachedData.data));
        }
      }

      // Get location info for Greyfinch API
      let greyfinchLocationId: string | undefined;
      if (parsedLocationId) {
        const location = await storage.getLocation(parsedLocationId);
        greyfinchLocationId = location?.greyfinchId || undefined;
      }

      // Fetch from Greyfinch API
      const analytics = await greyfinchService.getAnalytics(
        greyfinchLocationId,
        startDate as string,
        endDate as string
      );

      // Get acquisition costs
      const period = new Date(startDate as string).toISOString().slice(0, 7); // YYYY-MM format
      const costs = await storage.getAcquisitionCosts(parsedLocationId || null, period);
      
      // Calculate average acquisition cost
      const totalCost = costs.reduce((sum, cost) => sum + cost.cost, 0);
      analytics.avgAcquisitionCost = costs.length > 0 ? Math.round(totalCost / costs.length) : 0;

      // Cache the result
      await storage.setAnalyticsCache({
        locationId: parsedLocationId || null,
        startDate: startDate as string,
        endDate: endDate as string,
        dataType: 'analytics',
        data: JSON.stringify(analytics)
      });

      res.json(analytics);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      res.status(500).json({ error: "Failed to fetch analytics data" });
    }
  });

  // Get acquisition costs
  app.get("/api/acquisition-costs", async (req, res) => {
    try {
      const { locationId, period } = req.query;
      
      if (!period) {
        return res.status(400).json({ error: "Period is required" });
      }

      const parsedLocationId = locationId ? parseInt(locationId as string) : null;
      const costs = await storage.getAcquisitionCosts(parsedLocationId, period as string);
      
      res.json(costs);
    } catch (error) {
      console.error('Error fetching acquisition costs:', error);
      res.status(500).json({ error: "Failed to fetch acquisition costs" });
    }
  });

  // Update acquisition costs
  app.post("/api/acquisition-costs", async (req, res) => {
    try {
      const validatedData = insertAcquisitionCostSchema.parse(req.body);
      const cost = await storage.upsertAcquisitionCost(validatedData);
      res.json(cost);
    } catch (error) {
      console.error('Error updating acquisition cost:', error);
      res.status(500).json({ error: "Failed to update acquisition cost" });
    }
  });

  // Test Greyfinch API connection
  app.get("/api/test-greyfinch", async (req, res) => {
    try {
      // Test analytics endpoint instead of patients to avoid credential issues
      const analytics = await greyfinchService.getAnalytics();
      
      // Check if we're getting mock data vs real data
      const isMockData = analytics.avgNetProduction === 45000 && 
                        analytics.avgAcquisitionCost === 250 && 
                        analytics.noShowRate === 12;
      
      res.json({ 
        status: isMockData ? "mock" : "connected", 
        dataSource: isMockData ? "Mock data (API credentials issue)" : "Live Greyfinch API",
        message: isMockData ? 
          "Using demo data. Check API credentials for live connection." : 
          "Successfully connected to Greyfinch API" 
      });
    } catch (error) {
      console.error('Greyfinch API test failed:', error);
      res.status(500).json({ 
        status: "error", 
        message: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
