'use client'

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { TrendingUp } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center space-y-6">
        <div className="flex items-center justify-center mb-8">
          <TrendingUp className="h-12 w-12 text-blue-600 mr-3" />
          <h1 className="text-3xl font-bold text-gray-900">ORTHODASH</h1>
        </div>
        
        <div className="space-y-4">
          <h2 className="text-6xl font-bold text-gray-400">404</h2>
          <h3 className="text-2xl font-semibold text-gray-800">Page Not Found</h3>
          <p className="text-gray-600 max-w-md mx-auto">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>
        
        <div className="space-y-4">
          <Link href="/">
            <Button className="bg-blue-600 hover:bg-blue-700">
              Go to Dashboard
            </Button>
          </Link>
          <div>
            <Link href="/auth">
              <Button variant="outline">
                Login
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}