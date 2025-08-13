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
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <a href="/" className="flex-shrink-0 flex items-center hover:opacity-80 transition-opacity">
              <ChartLine className="text-[#1d1d52] mr-2 sm:mr-3" size={28} />
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">ORTHODASH</h1>
            </a>
          </div>
          
          <div className="flex items-center space-x-4">
            {user && (
              <>
                <ReportsManager 
                  trigger={
                    <Button variant="ghost" size="sm" className="text-gray-600 hover:text-[#1d1d52] hover:bg-gray-100">
                      <History className="h-4 w-4" />
                      <span className="hidden sm:inline ml-2">Report History</span>
                    </Button>
                  } 
                />
              </>
            )}
            
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span className="hidden sm:inline text-sm">{user.username}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-sm text-gray-600">
                    {user.username}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    className="text-red-600 cursor-pointer"
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
    </header>
  );
}