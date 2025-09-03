'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loginMessage, setLoginMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<'info' | 'warning' | 'success'>('info');
  const router = useRouter();
  const { loginMutation, user } = useAuth();

  useEffect(() => {
    if (user) {
      router.push('/');
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setLoginMessage(null);
    
    try {
      const result = await loginMutation.mutate({ username: email, password });
      
      if (result?.success) {
        setMessageType('success');
        setLoginMessage('Welcome back! Redirecting to dashboard...');
        setTimeout(() => router.push('/'), 1500);
      } else {
        // Handle specific error cases
        const errorMessage = result?.message || 'Unable to sign in';
        
        if (errorMessage.includes('Invalid login credentials')) {
          setMessageType('warning');
          setLoginMessage('Please check your email and password. Both need to be correct.');
        } else if (errorMessage.includes('User not found')) {
          setMessageType('info');
          setLoginMessage('Creating new account for you...');
        } else {
          setMessageType('warning');
          setLoginMessage('Unable to sign in. Please try again.');
        }
      }
    } catch (error) {
      console.error('Login failed:', error);
      setMessageType('warning');
      setLoginMessage('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white border-[#1C1F4F]/20 shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-[#1C1F4F] rounded-xl flex items-center justify-center mb-4">
            <Mail className="h-6 w-6 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-[#1C1F4F]">Welcome Back</CardTitle>
          <CardDescription className="text-[#1C1F4F]/70">
            Sign in to your Orthodash account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[#1C1F4F] font-medium">
                Email
              </Label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-[#1C1F4F]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1C1F4F]/20 focus:border-[#1C1F4F] text-[#1C1F4F] placeholder-[#1C1F4F]/50"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="text-[#1C1F4F] font-medium">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 pr-12 border border-[#1C1F4F]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1C1F4F]/20 focus:border-[#1C1F4F] text-[#1C1F4F] placeholder-[#1C1F4F]/50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#1C1F4F]/50 hover:text-[#1C1F4F] transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
            
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#1C1F4F] hover:bg-[#1C1F4F]/90 text-white py-3 font-medium"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
            
            {/* Login Message Display */}
            {loginMessage && (
              <div className={`mt-4 p-3 rounded-lg border text-sm ${
                messageType === 'success' 
                  ? 'bg-green-50 border-green-200 text-green-800'
                  : messageType === 'warning'
                  ? 'bg-yellow-50 border-yellow-200 text-yellow-800'
                  : 'bg-blue-50 border-blue-200 text-blue-800'
              }`}>
                {loginMessage}
              </div>
            )}
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-[#1C1F4F]/70">
              Don't have an account?{' '}
              <a href="/signup" className="text-[#1C1F4F] hover:underline font-medium">
                Sign up
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
      
    </div>
  );
}

export const dynamic = 'force-dynamic';
