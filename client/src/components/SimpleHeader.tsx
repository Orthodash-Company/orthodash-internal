import { ChartLine } from "lucide-react";

export function SimpleHeader() {
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
          <div className="text-sm text-gray-600">
            Analytics Dashboard
          </div>
        </div>
      </div>
    </header>
  );
}