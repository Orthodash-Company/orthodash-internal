import { Bell, User, ChartLine, LogOut, Download, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { ReportsManager } from "./ReportsManager";
import { PDFExporter } from "./PDFExporter";
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
    <header className="bg-[#1d1d52] shadow-sm border-b border-gray-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <ChartLine className="text-primary text-2xl mr-3" size={32} />
              <h1 className="text-2xl font-bold text-white">ORTHODASH</h1>
            </div>
            <nav className="ml-10 flex space-x-8">
              <a href="#" className="text-white font-medium">Dashboard</a>
              <ReportsManager />
              <a href="#" className="text-gray-300 hover:text-white">Settings</a>
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button variant="outline" size="sm">
              <Share2 className="mr-2 h-4 w-4" />
              Share
            </Button>

            {/* User Menu */}
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                      <User className="text-white" size={16} />
                    </div>
                    <span className="text-sm font-medium text-white">{user.username}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium text-gray-900">
                      {user.username}
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
        </div>
      </div>
    </header>
  );
}
