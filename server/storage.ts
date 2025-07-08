import { 
  users, 
  locations, 
  acquisitionCosts, 
  analyticsCache,
  type User, 
  type InsertUser,
  type Location,
  type InsertLocation,
  type AcquisitionCost,
  type InsertAcquisitionCost,
  type AnalyticsCache,
  type InsertAnalyticsCache
} from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getLocations(): Promise<Location[]>;
  getLocation(id: number): Promise<Location | undefined>;
  createLocation(location: InsertLocation): Promise<Location>;
  
  getAcquisitionCosts(locationId: number | null, period: string): Promise<AcquisitionCost[]>;
  upsertAcquisitionCost(cost: InsertAcquisitionCost): Promise<AcquisitionCost>;
  
  getAnalyticsCache(locationId: number | null, startDate: string, endDate: string, dataType: string): Promise<AnalyticsCache | undefined>;
  setAnalyticsCache(cache: InsertAnalyticsCache): Promise<AnalyticsCache>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getLocations(): Promise<Location[]> {
    return await db.select().from(locations).where(eq(locations.isActive, true));
  }

  async getLocation(id: number): Promise<Location | undefined> {
    const [location] = await db.select().from(locations).where(eq(locations.id, id));
    return location || undefined;
  }

  async createLocation(insertLocation: InsertLocation): Promise<Location> {
    const [location] = await db
      .insert(locations)
      .values(insertLocation)
      .returning();
    return location;
  }

  async getAcquisitionCosts(locationId: number | null, period: string): Promise<AcquisitionCost[]> {
    const whereClause = locationId 
      ? and(eq(acquisitionCosts.locationId, locationId), eq(acquisitionCosts.period, period))
      : eq(acquisitionCosts.period, period);
    
    return await db.select().from(acquisitionCosts).where(whereClause);
  }

  async upsertAcquisitionCost(cost: InsertAcquisitionCost): Promise<AcquisitionCost> {
    const existing = await db
      .select()
      .from(acquisitionCosts)
      .where(
        and(
          eq(acquisitionCosts.locationId, cost.locationId || 0),
          eq(acquisitionCosts.referralType, cost.referralType),
          eq(acquisitionCosts.period, cost.period)
        )
      );

    if (existing.length > 0) {
      const [updated] = await db
        .update(acquisitionCosts)
        .set({ cost: cost.cost })
        .where(eq(acquisitionCosts.id, existing[0].id))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(acquisitionCosts)
        .values(cost)
        .returning();
      return created;
    }
  }

  async getAnalyticsCache(locationId: number | null, startDate: string, endDate: string, dataType: string): Promise<AnalyticsCache | undefined> {
    const whereClause = locationId 
      ? and(
          eq(analyticsCache.locationId, locationId),
          eq(analyticsCache.startDate, startDate),
          eq(analyticsCache.endDate, endDate),
          eq(analyticsCache.dataType, dataType)
        )
      : and(
          eq(analyticsCache.startDate, startDate),
          eq(analyticsCache.endDate, endDate),
          eq(analyticsCache.dataType, dataType)
        );

    const [cache] = await db.select().from(analyticsCache).where(whereClause);
    return cache || undefined;
  }

  async setAnalyticsCache(cache: InsertAnalyticsCache): Promise<AnalyticsCache> {
    const [created] = await db
      .insert(analyticsCache)
      .values(cache)
      .returning();
    return created;
  }
}

export const storage = new DatabaseStorage();
