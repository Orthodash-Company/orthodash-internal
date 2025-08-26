import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { apiConfigurations } from '@/shared/schema'
import { eq, and } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 })
    }

    const configs = await db.select().from(apiConfigurations).where(
      and(
        eq(apiConfigurations.userId, userId),
        eq(apiConfigurations.isActive, true)
      )
    ).orderBy(apiConfigurations.createdAt);

    return NextResponse.json({
      success: true,
      data: configs
    })
  } catch (error) {
    console.error('Error fetching API configurations:', error)
    return NextResponse.json({ error: "Failed to fetch API configurations" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, name, type, apiKey, apiSecret, accessToken, refreshToken, metadata } = body

    if (!userId || !name || !type || !apiKey) {
      return NextResponse.json({ 
        error: "userId, name, type, and apiKey are required" 
      }, { status: 400 })
    }

    const config = await db.insert(apiConfigurations).values({
      userId,
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
      data: config[0],
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
    const { id, userId, name, apiKey, apiSecret, accessToken, refreshToken, metadata, isActive } = body

    if (!id || !userId) {
      return NextResponse.json({ error: "id and userId are required" }, { status: 400 })
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
          eq(apiConfigurations.userId, userId)
        )
      )
      .returning();

    return NextResponse.json({
      success: true,
      data: config[0],
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
    const userId = searchParams.get('userId')

    if (!id || !userId) {
      return NextResponse.json({ error: "id and userId are required" }, { status: 400 })
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
          eq(apiConfigurations.userId, userId)
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
