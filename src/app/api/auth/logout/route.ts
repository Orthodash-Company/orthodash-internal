import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      return NextResponse.json({ error: "Logout failed" }, { status: 500 })
    }

    return NextResponse.json({ message: "Logged out successfully" })
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
