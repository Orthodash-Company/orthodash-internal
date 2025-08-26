'use client'

import { ChartLine, User, LogOut, History } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ReportsManager } from "./ReportsManager";

export function SimpleHeader() {
  const { user, logoutMutation } = useAuth();

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <header className="fixed top-4 left-4 right-4 z-50">
      <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <a href="/" className="flex-shrink-0 flex items-center hover:opacity-80 transition-all duration-200 group">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-xl mr-3 shadow-lg group-hover:shadow-xl transition-shadow">
                  <ChartLine className="text-white" size={24} />
                </div>
                <h1 className="text-xl font-bold text-white">
                  ORTHODASH
                </h1>
              </a>
            </div>
            
            <div className="flex items-center space-x-3">
              {user && (
                <>
                  <ReportsManager 
                    trigger={
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-white/70 hover:text-white hover:bg-white/10 backdrop-blur-sm transition-all duration-200 rounded-xl"
                      >
                        <History className="h-4 w-4" />
                        <span className="hidden sm:inline ml-2 font-medium">Report History</span>
                      </Button>
                    } 
                  />
                </>
              )}
              
              {user && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="flex items-center gap-2 hover:bg-white/10 backdrop-blur-sm transition-all duration-200 rounded-xl"
                    >
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                        <User className="h-4 w-4 text-white" />
                      </div>
                      <span className="hidden sm:inline text-sm font-medium text-white/70">
                        {user.email}
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent 
                    align="end" 
                    className="w-64 backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl rounded-xl"
                  >
                    <DropdownMenuLabel className="font-semibold text-white">
                      My Account
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-white/20" />
                    <DropdownMenuItem className="text-sm text-white/70 cursor-default">
                      {user.email}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-white/20" />
                    <DropdownMenuItem 
                      className="text-red-400 cursor-pointer hover:bg-red-500/20 transition-colors"
                      onClick={handleLogout}
                      disabled={logoutMutation.isPending}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      {logoutMutation.isPending ? 'Logging out...' : 'Logout'}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}