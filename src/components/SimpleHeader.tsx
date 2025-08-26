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
      <div className="backdrop-blur-xl bg-white/90 border border-[#1C1F4F]/20 rounded-2xl shadow-xl">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <a href="/" className="flex-shrink-0 flex items-center hover:opacity-80 transition-all duration-200 group">
                <div className="bg-[#1C1F4F] p-2 rounded-xl mr-3 shadow-lg group-hover:shadow-xl transition-shadow">
                  <ChartLine className="text-white" size={24} />
                </div>
                <h1 className="text-xl font-bold text-[#1C1F4F]">
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
                        className="text-[#1C1F4F] hover:text-[#1C1F4F] hover:bg-[#1C1F4F]/10 backdrop-blur-sm transition-all duration-200 rounded-xl"
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
                      className="flex items-center gap-2 hover:bg-[#1C1F4F]/10 backdrop-blur-sm transition-all duration-200 rounded-xl"
                    >
                      <div className="w-8 h-8 bg-[#1C1F4F] rounded-full flex items-center justify-center">
                        <User className="h-4 w-4 text-white" />
                      </div>
                      <span className="hidden sm:inline text-sm font-medium text-[#1C1F4F]">
                        {user.email}
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent 
                    align="end" 
                    className="w-64 backdrop-blur-xl bg-white/95 border border-[#1C1F4F]/20 shadow-2xl rounded-xl"
                  >
                    <DropdownMenuLabel className="font-semibold text-[#1C1F4F]">
                      My Account
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-[#1C1F4F]/20" />
                    <DropdownMenuItem className="text-sm text-[#1C1F4F] cursor-default">
                      {user.email}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-[#1C1F4F]/20" />
                    <DropdownMenuItem 
                      className="text-red-600 cursor-pointer hover:bg-red-50/50 transition-colors"
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