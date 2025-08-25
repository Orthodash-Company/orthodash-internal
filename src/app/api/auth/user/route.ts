import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    return NextResponse.json({ 
      user: { 
        id: user.id, 
        username: user.email 
      } 
    })
  } catch (error) {
    console.error('Get user error:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
