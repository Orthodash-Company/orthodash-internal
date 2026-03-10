'use client'

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShieldAlert } from 'lucide-react';

const Page = () => {
  return (
    <div className="min-h-screen bg-[#fafafa] flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white border-[#1C1F4F]/20 shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-[#1C1F4F] rounded-xl flex items-center justify-center mb-4">
            <ShieldAlert className="h-6 w-6 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-[#1C1F4F]">Account Creation Disabled</CardTitle>
          <CardDescription className="text-[#1C1F4F]/70">
            New Orthodash accounts can no longer be created from this app.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-sm text-[#1C1F4F]/75">
            Contact an administrator if you need access to an existing practice workspace.
          </p>
          <Button asChild className="w-full bg-[#1C1F4F] hover:bg-[#1C1F4F]/90 text-white py-3 font-medium">
            <Link href="/login">Back to Sign In</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Page;
