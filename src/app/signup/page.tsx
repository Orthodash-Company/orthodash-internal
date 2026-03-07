'use client'

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, User } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const Page = () => {
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: ''
  });

  const router = useRouter();

  const { signUp, user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      router.replace('/');
    }
  }, [loading, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {

    e.preventDefault();
    
    setErrorMessage(null);
    setSuccessMessage(null);
    
    if (formData.password !== formData.confirmPassword) {
      setErrorMessage('Passwords do not match');
      return;
    }

    setIsLoading(true);
    
    try {
      const result = await signUp(formData.email, formData.password, {
        firstName: formData.firstName,
        lastName: formData.lastName,
      });

      if (result.session) {
        router.replace('/welcome');
        return;
      }

      setSuccessMessage('Account created. Check your email to confirm your address before signing in.');
      setFormData((prev) => ({
        ...prev,
        password: '',
        confirmPassword: '',
      }));
    } catch (error) {
      console.error('Registration failed:', error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Unable to create your account. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-[#fafafa] flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white border-[#1C1F4F]/20 shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-[#1C1F4F] rounded-xl flex items-center justify-center mb-4">
            <User className="h-6 w-6 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-[#1C1F4F]">Create Account</CardTitle>
          <CardDescription className="text-[#1C1F4F]/70">
            Join Orthodash to start analyzing your practice data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-[#1C1F4F] font-medium">
                  First Name
                </Label>
                <Input
                  id="firstName"
                  type="text"
                  placeholder="John"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-[#1C1F4F]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1C1F4F]/20 focus:border-[#1C1F4F] text-[#1C1F4F] placeholder-[#1C1F4F]/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-[#1C1F4F] font-medium">
                  Last Name
                </Label>
                <Input
                  id="lastName"
                  type="text"
                  placeholder="Doe"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-[#1C1F4F]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1C1F4F]/20 focus:border-[#1C1F4F] text-[#1C1F4F] placeholder-[#1C1F4F]/50"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[#1C1F4F] font-medium">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="john@practice.com"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                required
                className="w-full px-4 py-3 border border-[#1C1F4F]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1C1F4F]/20 focus:border-[#1C1F4F] text-[#1C1F4F] placeholder-[#1C1F4F]/50"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="text-[#1C1F4F] font-medium">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create a strong password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
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
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-[#1C1F4F] font-medium">
                Confirm Password
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  required
                  className="w-full px-4 py-3 pr-12 border border-[#1C1F4F]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1C1F4F]/20 focus:border-[#1C1F4F] text-[#1C1F4F] placeholder-[#1C1F4F]/50"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#1C1F4F]/50 hover:text-[#1C1F4F] transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
            
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#1C1F4F] hover:bg-[#1C1F4F]/90 text-white py-3 font-medium"
            >
              {isLoading ? 'Creating account...' : 'Create Account'}
            </Button>

            {successMessage && (
              <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
                {successMessage}
              </div>
            )}

            {errorMessage && (
              <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
                {errorMessage}
              </div>
            )}
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-[#1C1F4F]/70">
              Already have an account?{' '}
              <Link href="/login" className="text-[#1C1F4F] hover:underline font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default Page;
