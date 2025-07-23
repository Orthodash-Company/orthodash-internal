import { User, ChartLine, LogOut, Download, Share2, Menu, FileText, Settings } from "lucide-react";
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
  const { user, logoutMutation } = useAuth();

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <ChartLine className="text-[#1d1d52] mr-2 sm:mr-3" size={28} />
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">ORTHODASH</h1>
            </div>
            
            {/* Desktop Navigation */}
            <nav className="hidden lg:flex ml-10 space-x-8">
              <a href="#" className="text-[#1d1d52] font-medium hover:text-[#1d1d52]/80 transition-colors">
                Dashboard
              </a>
              <ReportsManager />
              <a href="#" className="text-gray-500 hover:text-[#1d1d52] transition-colors flex items-center gap-1">
                <Settings className="h-4 w-4" />
                Settings
              </a>
            </nav>
          </div>

          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center space-x-3">
            <Button variant="outline" size="sm" className="border-[#1d1d52] text-[#1d1d52] hover:bg-[#1d1d52] hover:text-white">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button variant="outline" size="sm" className="border-[#1d1d52] text-[#1d1d52] hover:bg-[#1d1d52] hover:text-white">
              <Share2 className="mr-2 h-4 w-4" />
              Share
            </Button>

            {/* Desktop User Menu */}
            {user && (
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
            {user && (
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
                    <a href="#" className="flex items-center space-x-3 text-[#1d1d52] font-medium text-lg">
                      <ChartLine className="h-5 w-5" />
                      <span>Dashboard</span>
                    </a>
                    <div className="flex items-center space-x-3 text-gray-700">
                      <FileText className="h-5 w-5" />
                      <ReportsManager />
                    </div>
                    <a href="#" className="flex items-center space-x-3 text-gray-700 hover:text-[#1d1d52]">
                      <Settings className="h-5 w-5" />
                      <span>Settings</span>
                    </a>
                  </div>
                  
                  <div className="border-t pt-6 space-y-3">
                    <Button variant="outline" className="w-full justify-start border-[#1d1d52] text-[#1d1d52]">
                      <Download className="mr-2 h-4 w-4" />
                      Export Data
                    </Button>
                    <Button variant="outline" className="w-full justify-start border-[#1d1d52] text-[#1d1d52]">
                      <Share2 className="mr-2 h-4 w-4" />
                      Share Report
                    </Button>
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
