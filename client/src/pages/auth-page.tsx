import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mail, Lock, Activity, BarChart3, Users, TrendingUp } from "lucide-react";

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [registerForm, setRegisterForm] = useState({ username: "", password: "" });

  // Redirect if already logged in
  if (user) {
    return <Redirect to="/" />;
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate(loginForm);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    registerMutation.mutate(registerForm);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center p-4">
      <div className="max-w-6xl w-full grid lg:grid-cols-2 gap-8 items-center">
        
        {/* Hero Section */}
        <div className="space-y-6 lg:pr-8">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Activity className="h-8 w-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-900">ORTHODASH</h1>
            </div>
            <h2 className="text-2xl text-gray-700">
              Analytics Platform for Orthodontic Practices
            </h2>
            <p className="text-lg text-gray-600">
              Transform your practice data into actionable insights with comprehensive 
              analytics, patient acquisition tracking, and multi-period comparisons.
            </p>
          </div>

          {/* Feature highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center space-x-3 p-4 bg-white rounded-lg shadow-sm border">
              <BarChart3 className="h-8 w-8 text-blue-500" />
              <div>
                <h3 className="font-semibold text-gray-900">Multi-Period Analysis</h3>
                <p className="text-sm text-gray-600">Compare performance across unlimited time ranges</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-4 bg-white rounded-lg shadow-sm border">
              <Users className="h-8 w-8 text-green-500" />
              <div>
                <h3 className="font-semibold text-gray-900">Patient Insights</h3>
                <p className="text-sm text-gray-600">Track acquisition costs and conversion rates</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-4 bg-white rounded-lg shadow-sm border">
              <TrendingUp className="h-8 w-8 text-purple-500" />
              <div>
                <h3 className="font-semibold text-gray-900">ROI Tracking</h3>
                <p className="text-sm text-gray-600">Monitor referral source performance</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-4 bg-white rounded-lg shadow-sm border">
              <Activity className="h-8 w-8 text-[#1d1d52]" />
              <div>
                <h3 className="font-semibold text-gray-900">Real-time Data</h3>
                <p className="text-sm text-gray-600">Greyfinch API integration for live updates</p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800">
              <strong>Team Orthodontics Access:</strong> This platform is restricted to 
              @teamorthodontics.com email addresses for secure practice management.
            </p>
          </div>
        </div>

        {/* Authentication Form */}
        <div className="w-full max-w-md mx-auto lg:mx-0">
          <Card className="shadow-lg">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl text-center">Access ORTHODASH</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="login">Login</TabsTrigger>
                  <TabsTrigger value="register">Register</TabsTrigger>
                </TabsList>
                
                <TabsContent value="login">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email">Email Address</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="login-email"
                          type="email"
                          placeholder="orthodash@teamorthodontics.com"
                          value={loginForm.username}
                          onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="login-password">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="login-password"
                          type="password"
                          placeholder="Enter your password"
                          value={loginForm.password}
                          onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>
                    
                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={loginMutation.isPending}
                    >
                      {loginMutation.isPending ? "Signing In..." : "Sign In"}
                    </Button>
                  </form>
                </TabsContent>
                
                <TabsContent value="register">
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="register-email">Email Address</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="register-email"
                          type="email"
                          placeholder="your.name@teamorthodontics.com"
                          value={registerForm.username}
                          onChange={(e) => setRegisterForm({ ...registerForm, username: e.target.value })}
                          className="pl-10"
                          required
                        />
                      </div>
                      <p className="text-xs text-gray-600">
                        Must be a @teamorthodontics.com email address
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="register-password">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="register-password"
                          type="password"
                          placeholder="Create a secure password"
                          value={registerForm.password}
                          onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>
                    
                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={registerMutation.isPending}
                    >
                      {registerMutation.isPending ? "Creating Account..." : "Create Account"}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}