'use client'

import { ChartLine, User, LogOut, History, List } from "lucide-react";
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
import { SessionHistoryManager } from "./SessionHistoryManager";

interface SimpleHeaderProps {
  onRestoreSession?: (session: any) => void;
  onPreviewSession?: (session: any) => void;
  onDownloadSession?: (session: any) => void;
  onShareSession?: (session: any) => void;
}

export function SimpleHeader({ 
  onRestoreSession,
  onPreviewSession,
  onDownloadSession,
  onShareSession
}: SimpleHeaderProps = {}) {
  const { user, logoutMutation } = useAuth();

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <header className="fixed top-4 left-4 right-4 z-50">
      <div className="backdrop-blur-xl bg-white/90 border border-[#1C1F4F]/20 rounded-2xl shadow-xl mx-auto max-w-[600px]">
        <div className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4">
          <div className="flex items-center justify-between min-w-0">
            {/* Logo on the left */}
            <div className="flex items-center flex-shrink-0">
              <a href="/" className="flex items-center hover:opacity-80 transition-all duration-200 group">
                <div className="bg-[#1C1F4F] p-1 sm:p-1.5 md:p-2 rounded-lg md:rounded-xl mr-1.5 sm:mr-2 md:mr-3 shadow-lg group-hover:shadow-xl transition-shadow">
                  <ChartLine className="text-white w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
                </div>
                <h1 className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-[#1C1F4F] truncate">
                  ORTHODASH
                </h1>
              </a>
            </div>
            
            {/* Buttons container on the right */}
            <div className="flex items-center space-x-0.5 sm:space-x-1 md:space-x-2 lg:space-x-3 flex-shrink-0">
              {user && (
                <>
                  <SessionHistoryManager
                    trigger={
                                               <Button
                           variant="ghost"
                           size="sm"
                           className="text-[#1C1F4F] hover:text-[#1C1F4F] hover:bg-[#1C1F4F]/10 backdrop-blur-sm transition-all duration-200 rounded-lg md:rounded-xl px-1.5 sm:px-2 md:px-3"
                         >
                           <List className="h-3 w-3 sm:h-4 sm:w-4" />
                           <span className="hidden lg:inline ml-1 sm:ml-2 text-xs sm:text-sm font-medium">Session History</span>
                         </Button>
                    }
                    onRestoreSession={onRestoreSession}
                    onPreviewSession={onPreviewSession}
                    onDownloadSession={onDownloadSession}
                    onShareSession={onShareSession}
                  />
                  <ReportsManager 
                    trigger={
                                               <Button
                           variant="ghost"
                           size="sm"
                           className="text-[#1C1F4F] hover:text-[#1C1F4F] hover:bg-[#1C1F4F]/10 backdrop-blur-sm transition-all duration-200 rounded-lg md:rounded-xl px-1.5 sm:px-2 md:px-3"
                         >
                           <History className="h-3 w-3 sm:h-4 sm:w-4" />
                           <span className="hidden lg:inline ml-1 sm:ml-2 text-xs sm:text-sm font-medium">Report History</span>
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
                             className="flex items-center hover:bg-[#1C1F4F]/10 backdrop-blur-sm transition-all duration-200 rounded-lg md:rounded-xl px-1.5 sm:px-2 md:px-3"
                           >
                             <div className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 bg-[#1C1F4F] rounded-full flex items-center justify-center">
                               <User className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-white" />
                             </div>
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