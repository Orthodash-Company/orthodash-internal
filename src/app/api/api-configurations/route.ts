import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { apiConfigurations } from '@/shared/schema'
import { eq, and } from 'drizzle-orm'
import { requireAuthUser } from '@/lib/require-auth-user'

const redactConfig = (config: typeof apiConfigurations.$inferSelect) => ({
  id: config.id,
  userId: config.userId,
  name: config.name,
  type: config.type,
  expiresAt: config.expiresAt,
  isActive: config.isActive,
  metadata: config.metadata,
  lastSyncDate: config.lastSyncDate,
  createdAt: config.createdAt,
  updatedAt: config.updatedAt,
  apiKeyPreview: config.apiKey ? `${config.apiKey.slice(0, 4)}...${config.apiKey.slice(-4)}` : null,
  hasApiSecret: Boolean(config.apiSecret),
  hasAccessToken: Boolean(config.accessToken),
  hasRefreshToken: Boolean(config.refreshToken),
})

export async function GET(request: NextRequest) {
  try {
    const { user, unauthorizedResponse } = await requireAuthUser()
    if (!user) {
      return unauthorizedResponse
    }

    // Check if database is available
    if (!process.env.DATABASE_URL) {
      console.warn("DATABASE_URL not set, returning empty configurations");
      return NextResponse.json({
        success: true,
        data: []
      })
    }

    const configs = await db.select().from(apiConfigurations).where(
      and(
        eq(apiConfigurations.userId, user.id),
        eq(apiConfigurations.isActive, true)
      )
    ).orderBy(apiConfigurations.createdAt);

    return NextResponse.json({
      success: true,
      data: configs.map(redactConfig)
    })
  } catch (error) {
    console.error('Error fetching API configurations:', error)
    // Return empty data instead of error to prevent frontend crashes
    return NextResponse.json({
      success: true,
      data: []
    })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, type, apiKey, apiSecret, accessToken, refreshToken, metadata } = body
    const { user, unauthorizedResponse } = await requireAuthUser()

    if (!user) {
      return unauthorizedResponse
    }

    if (!name || !type || !apiKey) {
      return NextResponse.json({ 
        error: "name, type, and apiKey are required" 
      }, { status: 400 })
    }

    const config = await db.insert(apiConfigurations).values({
      userId: user.id,
      name,
      type,
      apiKey,
      apiSecret: apiSecret || null,
      accessToken: accessToken || null,
      refreshToken: refreshToken || null,
      metadata: metadata || null,
      isActive: true
    }).returning();

    return NextResponse.json({
      success: true,
      data: redactConfig(config[0]),
      message: "API configuration created successfully"
    })
  } catch (error) {
    console.error('Error creating API configuration:', error)
    return NextResponse.json({ error: "Failed to create API configuration" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, name, apiKey, apiSecret, accessToken, refreshToken, metadata, isActive } = body
    const { user, unauthorizedResponse } = await requireAuthUser()

    if (!user) {
      return unauthorizedResponse
    }

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 })
    }

    const updateData: any = {
      updatedAt: new Date()
    };

    if (name !== undefined) updateData.name = name;
    if (apiKey !== undefined) updateData.apiKey = apiKey;
    if (apiSecret !== undefined) updateData.apiSecret = apiSecret;
    if (accessToken !== undefined) updateData.accessToken = accessToken;
    if (refreshToken !== undefined) updateData.refreshToken = refreshToken;
    if (metadata !== undefined) updateData.metadata = metadata;
    if (isActive !== undefined) updateData.isActive = isActive;

    const config = await db.update(apiConfigurations)
      .set(updateData)
      .where(
        and(
          eq(apiConfigurations.id, parseInt(id)),
          eq(apiConfigurations.userId, user.id)
        )
      )
      .returning();

    return NextResponse.json({
      success: true,
      data: config[0] ? redactConfig(config[0]) : null,
      message: "API configuration updated successfully"
    })
  } catch (error) {
    console.error('Error updating API configuration:', error)
    return NextResponse.json({ error: "Failed to update API configuration" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const { user, unauthorizedResponse } = await requireAuthUser()

    if (!user) {
      return unauthorizedResponse
    }

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 })
    }

    // Soft delete by setting isActive to false
    await db.update(apiConfigurations)
      .set({
        isActive: false,
        updatedAt: new Date()
      })
      .where(
        and(
          eq(apiConfigurations.id, parseInt(id)),
          eq(apiConfigurations.userId, user.id)
        )
      );

    return NextResponse.json({
      success: true,
      message: "API configuration deleted successfully"
    })
  } catch (error) {
    console.error('Error deleting API configuration:', error)
    return NextResponse.json({ error: "Failed to delete API configuration" }, { status: 500 })
  }
}
