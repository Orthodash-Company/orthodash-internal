import { redirect } from 'next/navigation'

export default function Auth() {
  // Redirect to a simple login page for now
  redirect('/login')
}

// Force dynamic rendering to avoid SSR issues
export const dynamic = 'force-dynamic';
