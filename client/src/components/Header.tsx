import { Bell, User, ChartLine } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Header() {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <ChartLine className="text-primary text-2xl mr-3" size={32} />
              <h1 className="text-2xl font-bold text-gray-900">ORTHODASH</h1>
            </div>
            <nav className="ml-10 flex space-x-8">
              <a href="#" className="text-primary font-medium">Dashboard</a>
              <a href="#" className="text-gray-500 hover:text-gray-700">Reports</a>
              <a href="#" className="text-gray-500 hover:text-gray-700">Settings</a>
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm">
              <Bell className="h-4 w-4" />
            </Button>
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <User className="text-white" size={16} />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
