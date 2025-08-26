import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { apiConfigurations, adSpend, vendors, revenue, apiSyncHistory } from '@/shared/schema'
import { eq, and } from 'drizzle-orm'
import { 
  ApiServiceFactory, 
  transformMetaAdSpend, 
  transformGoogleAdSpend, 
  transformQuickBooksVendors, 
  transformQuickBooksRevenue 
} from '@/lib/api-services'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { configId, locationId, period, userId, syncType = 'costs' } = body

    if (!configId || !userId || !period) {
      return NextResponse.json({ 
        error: "configId, userId, and period are required" 
      }, { status: 400 })
    }

    // Get API configuration
    const config = await db.select().from(apiConfigurations).where(
      and(
        eq(apiConfigurations.id, parseInt(configId)),
        eq(apiConfigurations.userId, userId),
        eq(apiConfigurations.isActive, true)
      )
    ).limit(1);

    if (!config.length) {
      return NextResponse.json({ 
        error: "API configuration not found or inactive" 
      }, { status: 404 })
    }

    const apiConfig = config[0];
    const service = ApiServiceFactory.createService(apiConfig);

    // Calculate date range for the period (YYYY-MM format)
    const [year, month] = period.split('-');
    const startDate = `${year}-${month}-01`;
    const endDate = new Date(parseInt(year), parseInt(month), 0).toISOString().split('T')[0];

    let syncResult = {
      success: true,
      dataCount: 0,
      totalAmount: 0,
      errorMessage: null as string | null
    };

    try {
      switch (apiConfig.type) {
        case 'meta':
          if (syncType === 'costs') {
            const metaService = service as any;
            // Get ad accounts first
            const adAccounts = await metaService.getAdAccounts();
            
            let allAdSpend: any[] = [];
            for (const account of adAccounts) {
              const accountSpend = await metaService.getAdSpend(account.id, startDate, endDate);
              allAdSpend = [...allAdSpend, ...accountSpend];
            }

            const transformedData = transformMetaAdSpend(
              allAdSpend, 
              period, 
              locationId || 0, 
              userId, 
              apiConfig.id
            );

            if (transformedData.length > 0) {
              await db.insert(adSpend).values(transformedData);
              syncResult.dataCount = transformedData.length;
              syncResult.totalAmount = transformedData.reduce((sum, item) => sum + item.spend, 0);
            }
          }
          break;

        case 'google':
          if (syncType === 'costs') {
            const googleService = service as any;
            const customers = await googleService.getCustomerAccounts();
            
            let allAdSpend: any[] = [];
            for (const customer of customers) {
              const customerSpend = await googleService.getAdSpend(customer.customerId, startDate, endDate);
              allAdSpend = [...allAdSpend, ...customerSpend];
            }

            const transformedData = transformGoogleAdSpend(
              allAdSpend, 
              period, 
              locationId || 0, 
              userId, 
              apiConfig.id
            );

            if (transformedData.length > 0) {
              await db.insert(adSpend).values(transformedData);
              syncResult.dataCount = transformedData.length;
              syncResult.totalAmount = transformedData.reduce((sum, item) => sum + item.spend, 0);
            }
          }
          break;

        case 'quickbooks':
          if (syncType === 'vendors') {
            const quickbooksService = service as any;
            const vendorsData = await quickbooksService.getVendors();
            const transformedVendors = transformQuickBooksVendors(
              vendorsData, 
              userId, 
              apiConfig.id
            );

            if (transformedVendors.length > 0) {
              await db.insert(vendors).values(transformedVendors);
              syncResult.dataCount = transformedVendors.length;
            }
          } else if (syncType === 'revenue') {
            const quickbooksService = service as any;
            const revenueData = await quickbooksService.getRevenue(startDate, endDate);
            const transformedRevenue = transformQuickBooksRevenue(
              revenueData, 
              period, 
              locationId || 0, 
              userId, 
              apiConfig.id
            );

            if (transformedRevenue.length > 0) {
              await db.insert(revenue).values(transformedRevenue);
              syncResult.dataCount = transformedRevenue.length;
              syncResult.totalAmount = transformedRevenue.reduce((sum, item) => sum + item.amount, 0);
            }
          }
          break;

        default:
          throw new Error(`Unsupported API type: ${apiConfig.type}`);
      }

      // Update last sync date
      await db.update(apiConfigurations)
        .set({ lastSyncDate: new Date() })
        .where(eq(apiConfigurations.id, apiConfig.id));

      // Record sync history
      await db.insert(apiSyncHistory).values({
        apiConfigId: apiConfig.id,
        userId,
        syncType,
        period,
        status: syncResult.success ? 'success' : 'failed',
        dataCount: syncResult.dataCount,
        totalAmount: syncResult.totalAmount,
        errorMessage: syncResult.errorMessage,
        metadata: {
          locationId,
          startDate,
          endDate
        }
      });

      return NextResponse.json({
        success: true,
        message: `Successfully synced ${syncResult.dataCount} records`,
        data: {
          count: syncResult.dataCount,
          totalAmount: syncResult.totalAmount
        }
      });

    } catch (error) {
      syncResult.success = false;
      syncResult.errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // Record failed sync
      await db.insert(apiSyncHistory).values({
        apiConfigId: apiConfig.id,
        userId,
        syncType,
        period,
        status: 'failed',
        dataCount: 0,
        totalAmount: 0,
        errorMessage: syncResult.errorMessage,
        metadata: {
          locationId,
          startDate,
          endDate,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      });

      throw error;
    }

  } catch (error) {
    console.error('Error syncing external costs:', error);
    return NextResponse.json({ 
      error: "Failed to sync external costs",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const configId = searchParams.get('configId')

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 })
    }

    let query = db.select().from(apiSyncHistory).where(eq(apiSyncHistory.userId, userId));

    if (configId) {
      query = query.where(eq(apiSyncHistory.apiConfigId, parseInt(configId)));
    }

    const history = await query.orderBy(apiSyncHistory.createdAt);

    return NextResponse.json({
      success: true,
      data: history
    });

  } catch (error) {
    console.error('Error fetching sync history:', error);
    return NextResponse.json({ 
      error: "Failed to fetch sync history" 
    }, { status: 500 })
  }
}
