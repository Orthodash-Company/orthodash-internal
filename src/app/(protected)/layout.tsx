import { ReactNode } from 'react'
import { redirect } from 'next/navigation'

import { createServerSupabaseClient } from '@/lib/supabase-server'

const Layout = async ({ children }: { children: ReactNode }) => {

  const supabase = await createServerSupabaseClient()

  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return children
}

export default Layout
