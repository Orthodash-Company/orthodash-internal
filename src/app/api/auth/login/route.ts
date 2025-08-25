import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()
    
    // Check if email ends with teamorthodontics.com
    if (!username?.endsWith("@teamorthodontics.com")) {
      return NextResponse.json({ error: "Only teamorthodontics.com email addresses are allowed" }, { status: 400 })
    }

    // For now, only allow the specific hardcoded user
    if (username !== "orthodash@teamorthodontics.com" || password !== "OrthoDash2025!") {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    // Create a session token or use Supabase auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email: username,
      password: password
    })

    if (error) {
      // If user doesn't exist, create them
      if (error.message.includes('Invalid login credentials')) {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: username,
          password: password
        })

        if (signUpError) {
          return NextResponse.json({ error: "Failed to create user" }, { status: 500 })
        }

        return NextResponse.json({ 
          user: { 
            id: signUpData.user?.id, 
            username: username 
          } 
        })
      }

      return NextResponse.json({ error: "Authentication failed" }, { status: 401 })
    }

    return NextResponse.json({ 
      user: { 
        id: data.user?.id, 
        username: username 
      } 
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
