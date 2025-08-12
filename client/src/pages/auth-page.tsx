import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, TrendingUp } from "lucide-react";

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  const [loginData, setLoginData] = useState({ username: "", password: "" });
  const [registerData, setRegisterData] = useState({ username: "", password: "" });

  // Redirect if already logged in
  if (user) {
    return <Redirect to="/" />;
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate(loginData);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    registerMutation.mutate(registerData);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left side - Auth Forms */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          {/* Logo */}
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <TrendingUp className="h-8 w-8 text-blue-600 mr-2" />
              <h1 className="text-2xl font-bold text-gray-900">ORTHODASH</h1>
            </div>
            <p className="text-gray-600">Analytics dashboard for orthodontic practices</p>
          </div>

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <Card>
                <CardHeader>
                  <CardTitle>Login</CardTitle>
                  <CardDescription>
                    Enter your credentials to access your dashboard
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email">Email</Label>
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="orthodash@teamorthodontics.com"
                        value={loginData.username}
                        onChange={(e) => setLoginData(prev => ({ ...prev, username: e.target.value }))}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="login-password">Password</Label>
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="OrthoDash2025!"
                        value={loginData.password}
                        onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                        required
                      />
                    </div>
                    
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={loginMutation.isPending}
                    >
                      {loginMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Logging in...
                        </>
                      ) : (
                        "Login"
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="register">
              <Card>
                <CardHeader>
                  <CardTitle>Register</CardTitle>
                  <CardDescription>
                    Create a new account for your practice
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="register-email">Email</Label>
                      <Input
                        id="register-email"
                        type="email"
                        placeholder="your-name@teamorthodontics.com"
                        value={registerData.username}
                        onChange={(e) => setRegisterData(prev => ({ ...prev, username: e.target.value }))}
                        required
                      />
                      <p className="text-xs text-gray-500">Only @teamorthodontics.com emails are allowed</p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="register-password">Password</Label>
                      <Input
                        id="register-password"
                        type="password"
                        value={registerData.password}
                        onChange={(e) => setRegisterData(prev => ({ ...prev, password: e.target.value }))}
                        required
                      />
                    </div>
                    
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={registerMutation.isPending}
                    >
                      {registerMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Registering...
                        </>
                      ) : (
                        "Register"
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Right side - Hero */}
      <div className="hidden lg:flex lg:flex-1 bg-blue-600 text-white p-8 items-center justify-center">
        <div className="max-w-lg text-center space-y-6">
          <TrendingUp className="h-16 w-16 mx-auto opacity-90" />
          <div className="space-y-4">
            <h2 className="text-3xl font-bold">Orthodontic Analytics Made Simple</h2>
            <p className="text-blue-100 text-lg">
              Track patient acquisition costs, analyze referral sources, and optimize your practice performance with comprehensive data insights.
            </p>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-blue-700 rounded-lg p-4">
                <h3 className="font-semibold mb-2">Cost Analysis</h3>
                <p className="text-blue-200">Monitor acquisition costs across all referral channels</p>
              </div>
              <div className="bg-blue-700 rounded-lg p-4">
                <h3 className="font-semibold mb-2">Performance Metrics</h3>
                <p className="text-blue-200">Compare periods and track conversion rates</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}