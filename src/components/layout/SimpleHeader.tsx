'use client'

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChartLine, User, LogOut } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export function SimpleHeader() {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { user, signOut } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await signOut();
      router.replace('/login');
      router.refresh();
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <header className="fixed top-4 left-4 right-4 z-50">
      <div className="backdrop-blur-xl bg-white/90 border border-[#1C1F4F]/20 rounded-2xl shadow-sm mx-auto max-w-[600px]">
        <div className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4">
          <div className="flex items-center justify-between min-w-0">
            {/* Logo */}
            <div className="flex items-center flex-shrink-0">
              <Link href="/" className="flex items-center hover:opacity-80 transition-all duration-200 group">
                <div className="bg-[#1C1F4F] p-1 sm:p-1.5 md:p-2 rounded-lg md:rounded-xl mr-1.5 sm:mr-2 md:mr-3 shadow-lg group-hover:shadow-xl transition-shadow">
                  <ChartLine className="text-white w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
                </div>
                <h1 className="text-sm sm:text-base md:text-lg font-bold text-[#1C1F4F] tracking-[0.12em] truncate">
                  ORTHODASH
                </h1>
              </Link>
            </div>

            {/* User menu */}
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
                    disabled={isLoggingOut}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    {isLoggingOut ? 'Logging out...' : 'Logout'}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
