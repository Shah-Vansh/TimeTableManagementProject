import React, { useState } from "react";
import {
  Search,
  Calendar,
  RefreshCw,
  LayoutDashboard,
  User,
  LogOut,
  SwatchBookIcon,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

const Navbar = () => {
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState("");

  // 🔹 Mock frontend-only state
  const [user, setUser] = useState({
    name: "John Doe",
    email: "john@example.com",
  });

  const handleReplaceClick = () => {
    navigate("/replace");
  };

  const logoutUser = () => {
    setUser(null); // frontend logout
    navigate("/login");
  };

  return (
    <nav className="sticky top-0 z-50 bg-white shadow-md">
      <div className="mx-6">
        <div className="flex items-center justify-between max-w-7xl mx-auto py-4">
          {/* Logo */}
          <Link
            to="/dashboard"
            className="flex items-center gap-2 text-2xl font-bold text-slate-800"
          >
            <Calendar className="text-blue-600" size={28} />
            <span className="hidden sm:inline">TimeTable</span>
            <span className="text-blue-600 font-light hidden sm:inline">
              Pro
            </span>
            <span className="text-xs font-semibold px-2 py-1 rounded-full text-white bg-blue-500">
              v2.0
            </span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-6 text-slate-700">
            {/* Dashboard */}
            <Link
              to="/dashboard"
              className="flex items-center gap-2 hover:text-blue-600 transition-colors"
            >
              <LayoutDashboard size={18} />
              Dashboard
              
            </Link>

            {/* Replace */}
            <button
              onClick={handleReplaceClick}
              className="flex items-center gap-2 hover:text-blue-600 transition-colors"
            >
              <RefreshCw size={18} />
              Replace
              
            </button>

            <button
              onClick={() => {
                navigate("/changes");
              }}
              className="flex items-center gap-2 hover:text-blue-600 transition-colors"
            >
              <SwatchBookIcon size={18} />
              View Changes
            </button>

            {/* User */}
            {user ? (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <User size={16} className="text-blue-600" />
                  </div>
                  <span className="text-sm font-medium">
                    {user.name.split(" ")[0]}
                  </span>
                </div>
                <button
                  onClick={logoutUser}
                  className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="px-6 py-2 bg-blue-600 rounded-lg text-white"
              >
                Login
              </Link>
            )}
          </div>

          {/* Mobile Icons */}
          <div className="md:hidden flex items-center gap-4">
            <button
              onClick={() => navigate("/search")}
              className="p-2 hover:bg-slate-100 rounded-lg"
            >
              <Search size={20} />
            </button>

            <button
              onClick={handleReplaceClick}
              className="relative p-2 hover:bg-slate-100 rounded-lg"
            >
              <RefreshCw size={20} />
              
            </button>

            {user ? (
              <button
                onClick={() => navigate("/profile")}
                className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center"
              >
                <User size={16} className="text-blue-600" />
              </button>
            ) : (
              <Link
                to="/login"
                className="px-4 py-2 bg-blue-600 rounded-lg text-white text-sm"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
