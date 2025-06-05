import React from "react";
import { Home, Menu, Bell, User, Search } from "lucide-react";
import { Link } from "react-router-dom";

const VastushobhaHeader = () => {
  return (
    <header className="bg-gradient-to-r from-indigo-700 to-purple-800 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and company name */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <div className="flex-shrink-0 bg-white p-1.5 rounded-md shadow-sm">
                <Home className="h-7 w-7 text-indigo-600" />
              </div>
              <div className="ml-3">
                <h1 className="text-xl font-bold text-white">
                  <span className="text-amber-300">Akshay</span>
                </h1>
                <p className="text-xs text-indigo-200 -mt-1">Construction Solutions</p>
              </div>
            </Link>
          </div>

         
          {/* Right navigation */}
          <div className="flex items-center space-x-4">
            <button className="text-indigo-200 hover:text-white p-1 rounded-md hover:bg-indigo-600/30 transition-colors focus:outline-none focus:ring-2 focus:ring-white">
              <Bell className="h-6 w-6" />
            </button>
            <div className="flex items-center">
              <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center text-indigo-700 font-medium shadow-sm">
                VS
              </div>
              <span className="ml-2 text-sm font-medium text-white hidden md:block">Admin</span>
            </div>
            <button className="text-indigo-200 hover:text-white md:hidden p-1 rounded-md hover:bg-indigo-600/30 transition-colors focus:outline-none focus:ring-2 focus:ring-white">
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>
      
      
      {/* Mobile search - only shown on mobile */}
      <div className="p-2 bg-indigo-800 md:hidden">
        <div className="relative rounded-md shadow-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-transparent rounded-md bg-indigo-600/30 text-white placeholder-indigo-200 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent text-sm"
            placeholder="Search..."
          />
        </div>
      </div>
      
      <style jsx>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </header>
  );
};

export default VastushobhaHeader;