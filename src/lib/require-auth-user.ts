import { NextResponse } from 'next/server'

import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function requireAuthUser() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      user: null,
      unauthorizedResponse: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    }
  }

  return {
    user,
    unauthorizedResponse: null,
  }
}
