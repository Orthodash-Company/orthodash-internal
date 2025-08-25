import { User, ChartLine, LogOut, Menu, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { ReportsManager } from "./ReportsManager";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Header() {
  // Authentication temporarily disabled for testing

  const handleLogout = () => {
    console.log('Logout functionality disabled');
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <a href="/" className="flex-shrink-0 flex items-center hover:opacity-80 transition-opacity">
              <ChartLine className="text-[#1d1d52] mr-2 sm:mr-3" size={28} />
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">ORTHODASH</h1>
            </a>
          </div>

          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center space-x-3">
            {/* Reports History */}
            <ReportsManager 
              trigger={
                <Button variant="ghost" size="sm" className="text-gray-600 hover:text-[#1d1d52] hover:bg-gray-100">
                  <History className="h-4 w-4" />
                </Button>
              } 
            />

            {/* Desktop User Menu */}
            {true && ( {/* Show user menu always for testing */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="flex items-center space-x-2 hover:bg-gray-100">
                    <div className="w-8 h-8 bg-[#1d1d52] rounded-full flex items-center justify-center">
                      <User className="text-white" size={16} />
                    </div>
                    <span className="text-sm font-medium text-gray-900 hidden xl:block">
                      orthodash@teamorthodontics.com
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium text-gray-900">
                      orthodash@teamorthodontics.com
                    </p>
                    <p className="text-xs text-gray-500">
                      Team Orthodontics
                    </p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={handleLogout}
                    className="text-red-600 focus:text-red-600 cursor-pointer"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Mobile Menu */}
          <div className="lg:hidden flex items-center space-x-2">
            {/* Mobile User Avatar */}
            {true && ( {/* Show user menu always for testing */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="p-2">
                    <div className="w-7 h-7 bg-[#1d1d52] rounded-full flex items-center justify-center">
                      <User className="text-white" size={14} />
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium text-gray-900">
                      orthodash@teamorthodontics.com
                    </p>
                    <p className="text-xs text-gray-500">
                      Team Orthodontics
                    </p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={handleLogout}
                    className="text-red-600 focus:text-red-600 cursor-pointer"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Mobile Menu Sheet */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="p-2">
                  <Menu className="h-5 w-5 text-gray-600" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80">
                <div className="flex flex-col space-y-6 mt-6">
                  <div className="space-y-4">
                    <a href="/" className="flex items-center space-x-3 text-[#1d1d52] font-medium text-lg">
                      <ChartLine className="h-5 w-5" />
                      <span>Dashboard</span>
                    </a>
                    <ReportsManager 
                      trigger={
                        <button className="flex items-center space-x-3 text-gray-700 hover:text-[#1d1d52] w-full text-left">
                          <History className="h-5 w-5" />
                          <span>Reports History</span>
                        </button>
                      } 
                    />
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
