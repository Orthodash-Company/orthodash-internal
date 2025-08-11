import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupPDFRoutes } from "./routes/pdf";
import { setupOpenAIRoutes } from "./routes/openai";
import { storage } from "./storage";
import { greyfinchService } from "./services/greyfinch";
import { generateAnalyticsSummary } from "./services/openai";
import { insertAcquisitionCostSchema, insertLocationSchema } from "@shared/schema";
import { setupAuth } from "./auth";
import { registerReportRoutes } from "./routes/reports";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication first
  setupAuth(app);
  
  // Setup additional route modules
  setupPDFRoutes(app);
  setupOpenAIRoutes(app);
  // Get locations - integrate with Greyfinch
  app.get("/api/locations", async (req, res) => {
    try {
      // First try to get locations from Greyfinch
      try {
        console.log('Attempting to fetch locations from Greyfinch...');
        const greyfinchLocations = await greyfinchService.getLocations();
        
        if (greyfinchLocations && greyfinchLocations.length > 0) {
          console.log(`Successfully fetched ${greyfinchLocations.length} locations from Greyfinch`);
          
          // Map Greyfinch location format to our format and save to local storage
          const mappedLocations = greyfinchLocations.map(loc => ({
            id: parseInt(loc.id.replace(/\D/g, '')) || Math.floor(Math.random() * 1000), // Extract number or generate
            name: loc.name,
            greyfinchId: loc.id,
            address: loc.address,
            patientCount: loc.patientCount,
            lastSyncDate: loc.lastSyncDate
          }));
          
          // Save to storage for future use
          for (const location of mappedLocations) {
            const existing = (await storage.getLocations()).find(l => l.greyfinchId === location.greyfinchId);
            if (!existing) {
              await storage.createLocation(location);
            }
          }
          
          res.json(mappedLocations);
          return;
        }
      } catch (greyfinchError) {
        console.log('Greyfinch location fetch failed, using local storage:', greyfinchError instanceof Error ? greyfinchError.message : greyfinchError);
      }
      
      // Fallback to local storage
      let locations = await storage.getLocations();
      
      // If no locations exist, create some sample ones for demonstration
      if (locations.length === 0) {
        console.log('No locations found, creating sample locations...');
        const sampleLocations = [
          {
            name: 'Main Orthodontic Center',
            greyfinchId: 'loc_001',
            address: '123 Main St, Downtown',
            patientCount: 1247
          },
          {
            name: 'Westside Dental & Orthodontics', 
            greyfinchId: 'loc_002',
            address: '456 West Ave, Westside',
            patientCount: 892
          }
        ];
        
        for (const locationData of sampleLocations) {
          await storage.createLocation(locationData);
        }
        
        locations = await storage.getLocations();
      }
      
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
      // Test locations endpoint first (simpler than analytics)
      const locations = await greyfinchService.getLocations();
      
      // If we get data (either from API or fallback), report success
      if (locations && locations.length > 0) {
        const isLiveAPI = locations[0].id?.startsWith('loc_') ? false : true;
        res.json({ 
          status: "connected", 
          dataSource: isLiveAPI ? "Live Greyfinch API" : "Development Data (Live API Unavailable)",
          message: isLiveAPI ? "Successfully connected to Greyfinch API" : "Using development data - Greyfinch API connection unavailable",
          locationCount: locations.length,
          apiCredentialsConfigured: !!(process.env.GREYFINCH_API_KEY && process.env.GREYFINCH_API_SECRET)
        });
      } else {
        throw new Error('No location data available');
      }
    } catch (error) {
      console.error('Greyfinch API test failed:', error);
      res.status(500).json({ 
        status: "error", 
        message: error instanceof Error ? error.message : "Connection failed - check API credentials" 
      });
    }
  });

  // Get Greyfinch locations
  app.get("/api/greyfinch/locations", async (req, res) => {
    try {
      const locations = await greyfinchService.getLocations();
      res.json(locations);
    } catch (error) {
      console.error("Error fetching Greyfinch locations:", error);
      res.status(500).json({ 
        error: "Failed to fetch locations from Greyfinch API",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // GraphQL Schema introspection endpoint for exploring the Greyfinch API
  app.get("/api/greyfinch/schema", async (req, res) => {
    try {
      const introspectionQuery = `
        query IntrospectionQuery {
          __schema {
            queryType { name }
            mutationType { name }
            subscriptionType { name }
            types {
              ...FullType
            }
          }
        }
        
        fragment FullType on __Type {
          kind
          name
          description
          fields(includeDeprecated: true) {
            name
            description
            args {
              ...InputValue
            }
            type {
              ...TypeRef
            }
            isDeprecated
            deprecationReason
          }
          inputFields {
            ...InputValue
          }
          interfaces {
            ...TypeRef
          }
          enumValues(includeDeprecated: true) {
            name
            description
            isDeprecated
            deprecationReason
          }
          possibleTypes {
            ...TypeRef
          }
        }
        
        fragment InputValue on __InputValue {
          name
          description
          type { ...TypeRef }
          defaultValue
        }
        
        fragment TypeRef on __Type {
          kind
          name
          ofType {
            kind
            name
            ofType {
              kind
              name
              ofType {
                kind
                name
                ofType {
                  kind
                  name
                  ofType {
                    kind
                    name
                    ofType {
                      kind
                      name
                      ofType {
                        kind
                        name
                      }
                    }
                  }
                }
              }
            }
          }
        }
      `;
      
      const schema = await greyfinchService.makeGraphQLRequest(introspectionQuery);
      res.json(schema);
    } catch (error) {
      console.error('Schema introspection failed:', error);
      res.status(500).json({ 
        error: "Failed to introspect GraphQL schema",
        message: error instanceof Error ? error.message : "Unknown error",
        suggestion: "This endpoint requires valid Greyfinch API credentials to explore the schema"
      });
    }
  });

  // Generate AI analytics summary
  app.post("/api/generate-summary", async (req, res) => {
    try {
      const { periods, periodData } = req.body;
      
      if (!periods || !periodData) {
        return res.status(400).json({ error: "Periods and period data are required" });
      }

      if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({ error: "OpenAI API key not configured" });
      }

      const summary = await generateAnalyticsSummary(periods, periodData);
      res.json(summary);
    } catch (error) {
      console.error('Error generating AI summary:', error);
      res.status(500).json({ 
        error: "Failed to generate AI summary",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Register report routes
  registerReportRoutes(app);

  const httpServer = createServer(app);
  return httpServer;
}
