import Link from 'next/link'
import { Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

const NotFound = () => {

  return (
    <main className="min-h-screen bg-[#fafafa] px-4 py-10">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-3xl items-center justify-center">
        <Card className="w-full border-[#1C1F4F]/10 bg-white shadow-xl">
          <CardHeader className="space-y-6 pb-4 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#1C1F4F] text-white shadow-sm">
              <span className="text-lg font-semibold tracking-[0.2em]">404</span>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium uppercase tracking-[0.3em] text-[#1C1F4F]/55">
                Page Not Found
              </p>
              <CardTitle className="text-3xl font-semibold tracking-tight text-[#1C1F4F] sm:text-4xl">
                This page is unavailable.
              </CardTitle>
              <CardDescription className="mx-auto max-w-xl text-base leading-7 text-[#1C1F4F]/70">
                The link may be outdated, or the page may have been moved. Return to the dashboard
                or go back to the previous page.
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="rounded-2xl border border-[#1C1F4F]/10 bg-[#1C1F4F]/[0.03] p-5 text-left">
              <p className="text-sm font-medium text-[#1C1F4F]">What you can do next</p>
              <p className="mt-2 text-sm leading-6 text-[#1C1F4F]/70">
                Check the URL for errors, return to the main dashboard, or use your browser&apos;s
                back button to continue where you left off.
              </p>
            </div>

            <div className="flex justify-center">
              <Button asChild className="bg-[#1C1F4F] text-white hover:bg-[#1C1F4F]/90">
                <Link href="/">
                  <Home className="mr-2 h-4 w-4" />
                  Return Home
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}

export default NotFound