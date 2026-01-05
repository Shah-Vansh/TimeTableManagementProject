import React, { useState } from "react";
import {
  Search,
  Calendar,
  RefreshCw,
  LayoutDashboard,
  User,
  LogOut,
  SwatchBookIcon,
  Users2Icon,
  Notebook,
  BookOpen,
  PenTool,
  Compass,
  StickyNote,
  Highlighter,
  Bookmark,
  Scissors,
  Ruler,
  Palette,
  Menu,
  X
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import Alert from "./Alert";

const Navbar = () => {
  const navigate = useNavigate();
  const [alert, setAlert] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // 🔹 Mock frontend-only state
  const [user, setUser] = useState({
    name: "John Doe",
    email: "john@example.com",
  });

  const handleReplaceClick = () => {
    navigate("/replace");
  };

  const showAlert = (main, info, type) => {
    setAlert({ main, info, type });
    setTimeout(() => setAlert(null), 5000);
  };

  const logoutUser = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    showAlert("Logged out", "You have been successfully logged out", "success");
    setTimeout(() => navigate("/auth"), 1500);
  };

  return (
    <>
      {/* Alert Component */}
      {alert && (
        <Alert
          main={alert.main}
          info={alert.info}
          type={alert.type}
          onClose={() => setAlert(null)}
        />
      )}

      <nav className="sticky top-0 z-50 bg-gradient-to-r from-indigo-50 to-white shadow-sm border-b border-indigo-100 print:hidden">
        <div className="mx-4 md:mx-6">
          <div className="flex items-center justify-between max-w-7xl mx-auto py-3">
            {/* Logo */}
            <Link
              to="/dashboard"
              className="flex items-center gap-2 text-xl font-bold text-slate-800 group"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-200 to-indigo-300 rounded-lg transform rotate-6 opacity-60 group-hover:rotate-12 transition-transform duration-300"></div>
                <Notebook className="text-indigo-600 relative" size={24} />
              </div>
              <span className="hidden sm:inline font-bold bg-gradient-to-r from-indigo-700 to-indigo-800 bg-clip-text text-transparent">
                StudyPlanner
              </span>
              <span className="hidden sm:inline text-xs font-semibold px-2 py-1 rounded-full text-white bg-gradient-to-r from-indigo-500 to-indigo-600 ml-2">
                v2.0
              </span>
            </Link>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-4 text-slate-700">
              {/* Search Bar */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search planners..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-white border border-indigo-200 text-gray-900 placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 w-64 transition-all shadow-sm"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-indigo-400" />
              </div>

              {/* Navigation Links */}
              <div className="flex items-center gap-1 bg-gradient-to-r from-indigo-50 to-indigo-100 rounded-xl p-1">
                <Link
                  to="/dashboard"
                  className="flex items-center gap-2 px-4 py-2 hover:bg-white rounded-lg transition-all hover:text-indigo-700 hover:shadow-sm group"
                >
                  <LayoutDashboard size={18} className="group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-medium">Dashboard</span>
                </Link>

                <button
                  onClick={handleReplaceClick}
                  className="flex items-center gap-2 px-4 py-2 hover:bg-white rounded-lg transition-all hover:text-indigo-700 hover:shadow-sm group"
                >
                  <RefreshCw size={18} className="group-hover:rotate-180 transition-transform duration-500" />
                  <span className="text-sm font-medium">Swap</span>
                </button>

                <button
                  onClick={() => navigate("/changes")}
                  className="flex items-center gap-2 px-4 py-2 hover:bg-white rounded-lg transition-all hover:text-indigo-700 hover:shadow-sm group"
                >
                  <BookOpen size={18} className="group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-medium">Changes</span>
                </button>

                <button
                  onClick={() => navigate("/faculties")}
                  className="flex items-center gap-2 px-4 py-2 hover:bg-white rounded-lg transition-all hover:text-indigo-700 hover:shadow-sm group"
                >
                  <Users2Icon size={18} className="group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-medium">Tutors</span>
                </button>
              </div>

              {/* User Profile */}
              {user ? (
                <div className="flex items-center gap-3">
                  <div
                    className="flex items-center gap-2 group cursor-pointer"
                    onClick={() => navigate("/profile")}
                  >
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-indigo-200 to-indigo-300 rounded-full opacity-0 group-hover:opacity-60 transition-opacity duration-300"></div>
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-100 to-indigo-200 flex items-center justify-center relative border border-indigo-200">
                        <PenTool size={16} className="text-indigo-600" />
                      </div>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-900">Profile</span>
                    </div>
                  </div>
                  
                  <button
                    onClick={logoutUser}
                    className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-red-600 hover:bg-gradient-to-r hover:from-red-50 hover:to-red-100 rounded-lg transition-all group"
                  >
                    <div className="relative">
                      <div className="absolute inset-0 bg-red-100 rounded-full opacity-0 group-hover:opacity-60 transition-opacity duration-300"></div>
                      <LogOut size={16} className="relative group-hover:scale-110 transition-transform" />
                    </div>
                    <span className="text-sm font-medium">Logout</span>
                  </button>
                </div>
              ) : (
                <Link
                  to="/login"
                  className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-lg text-white hover:from-indigo-700 hover:to-indigo-800 transition-all shadow-sm hover:shadow-md"
                >
                  Login
                </Link>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center gap-3">
              <button
                onClick={() => navigate("/search")}
                className="p-2 hover:bg-indigo-50 rounded-lg transition-colors"
              >
                <Search size={20} className="text-indigo-600" />
              </button>

              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 hover:bg-indigo-50 rounded-lg transition-colors"
              >
                {mobileMenuOpen ? (
                  <X size={20} className="text-indigo-600" />
                ) : (
                  <Menu size={20} className="text-indigo-600" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden bg-white border-t border-indigo-100 shadow-lg rounded-b-xl overflow-hidden animate-slideDown">
              <div className="p-4 space-y-4">
                {/* Search Bar */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search planners..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-white border border-indigo-200 text-gray-900 placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                  />
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-indigo-400" />
                </div>

                {/* Navigation Links */}
                <div className="space-y-2">
                  <Link
                    to="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-indigo-50 rounded-lg transition-all text-gray-700 hover:text-indigo-700 group"
                  >
                    <div className="p-2 bg-gradient-to-br from-indigo-100 to-indigo-50 rounded-lg">
                      <LayoutDashboard size={18} className="text-indigo-600" />
                    </div>
                    <span className="font-medium">Dashboard</span>
                  </Link>

                  <button
                    onClick={() => {
                      handleReplaceClick();
                      setMobileMenuOpen(false);
                    }}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-indigo-50 rounded-lg transition-all text-gray-700 hover:text-indigo-700 group w-full text-left"
                  >
                    <div className="p-2 bg-gradient-to-br from-indigo-100 to-indigo-50 rounded-lg">
                      <RefreshCw size={18} className="text-indigo-600" />
                    </div>
                    <span className="font-medium">Swap Sessions</span>
                  </button>

                  <button
                    onClick={() => {
                      navigate("/changes");
                      setMobileMenuOpen(false);
                    }}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-indigo-50 rounded-lg transition-all text-gray-700 hover:text-indigo-700 group w-full text-left"
                  >
                    <div className="p-2 bg-gradient-to-br from-indigo-100 to-indigo-50 rounded-lg">
                      <BookOpen size={18} className="text-indigo-600" />
                    </div>
                    <span className="font-medium">View Changes</span>
                  </button>

                  <button
                    onClick={() => {
                      navigate("/faculties");
                      setMobileMenuOpen(false);
                    }}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-indigo-50 rounded-lg transition-all text-gray-700 hover:text-indigo-700 group w-full text-left"
                  >
                    <div className="p-2 bg-gradient-to-br from-indigo-100 to-indigo-50 rounded-lg">
                      <Users2Icon size={18} className="text-indigo-600" />
                    </div>
                    <span className="font-medium">Tutors</span>
                  </button>
                </div>

                {/* User Section */}
                {user ? (
                  <div className="pt-4 border-t border-indigo-100">
                    <div className="flex items-center justify-between">
                      <div
                        className="flex items-center gap-3 group cursor-pointer"
                        onClick={() => {
                          navigate("/profile");
                          setMobileMenuOpen(false);
                        }}
                      >
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-100 to-indigo-200 flex items-center justify-center border border-indigo-200">
                          <PenTool size={18} className="text-indigo-600" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{user.name}</div>
                          <div className="text-xs text-gray-500">Profile Settings</div>
                        </div>
                      </div>
                      <button
                        onClick={logoutUser}
                        className="p-2 hover:bg-red-50 rounded-lg text-red-600 transition-colors"
                      >
                        <LogOut size={18} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="pt-4 border-t border-indigo-100">
                    <Link
                      to="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="w-full px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-lg text-white text-center hover:from-indigo-700 hover:to-indigo-800 transition-all shadow-sm"
                    >
                      Login
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Add CSS for animation */}
      <style jsx>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slideDown {
          animation: slideDown 0.3s ease-out;
        }
      `}</style>
    </>
  );
};

export default Navbar;