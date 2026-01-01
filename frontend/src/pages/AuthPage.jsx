import React, { useState } from "react";
import {
  Lock,
  User,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  Shield,
  ArrowRight,
  ChevronRight,
  Zap,
  Users,
  CalendarDays,
} from "lucide-react";

// Alert Component
const Alert = ({ main, info, type, onClose }) => {
  const styles = {
    success: "bg-green-50 border-green-200 text-green-800",
    error: "bg-red-50 border-red-200 text-red-800",
    warning: "bg-yellow-50 border-yellow-200 text-yellow-800",
  };

  return (
    <div className={`${styles[type]} border rounded-lg p-4 shadow-lg max-w-md`}>
      <div className="flex items-start justify-between">
        <div>
          <h4 className="font-semibold mb-1">{main}</h4>
          <p className="text-sm opacity-90">{info}</p>
        </div>
        <button
          onClick={onClose}
          className="text-current opacity-50 hover:opacity-100"
        >
          ✕
        </button>
      </div>
    </div>
  );
};

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    name: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertData, setAlertData] = useState({ 
    main: "", 
    info: "", 
    type: "success" 
  });
  const [formErrors, setFormErrors] = useState({});

  const showAlertMessage = (main, info, type = "success") => {
    setAlertData({ main, info, type });
    setShowAlert(true);
  };

  const hideAlert = () => {
    setShowAlert(false);
    setAlertData({ main: "", info: "", type: "success" });
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.username) {
      errors.username = "Username is required";
    } else if (formData.username.length < 3) {
      errors.username = "Username must be at least 3 characters";
    }
    
    if (!formData.password) {
      errors.password = "Password is required";
    } else if (formData.password.length < 6) {
      errors.password = "Password must be at least 6 characters";
    }
    
    if (!isLogin) {
      if (!formData.name) {
        errors.name = "Name is required";
      }
      
      if (!formData.confirmPassword) {
        errors.confirmPassword = "Please confirm your password";
      } else if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = "Passwords do not match";
      }
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    setFormErrors({});
    
    try {
      const endpoint = isLogin ? "/api/user/login" : "/api/user/register";
      const payload = isLogin 
        ? { username: formData.username, password: formData.password }
        : { 
            username: formData.username, 
            password: formData.password, 
            name: formData.name 
          };
      
      const response = await fetch(`http://localhost:5000${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      
      if (response.ok) {
        showAlertMessage(
          isLogin ? "Login Successful!" : "Account Created!",
          data.message || (isLogin 
            ? "Welcome back to Timetable Management System"
            : "Your account has been created successfully"),
          "success"
        );
        
        // Store token and user data
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        setTimeout(() => {
          window.location.href = "/dashboard";
        }, 2000);
      } else {
        showAlertMessage(
          isLogin ? "Login Failed" : "Registration Failed",
          data.message || "Please try again",
          "error"
        );
      }
    } catch (error) {
      console.error("Auth error:", error);
      showAlertMessage(
        "Network Error",
        "Unable to connect to server. Please check your connection.",
        "error"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleMode = () => {
    setIsLogin(!isLogin);
    setFormData({
      username: "",
      password: "",
      name: "",
      confirmPassword: "",
    });
    setFormErrors({});
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const getPasswordStrength = (password) => {
    if (!password) return { strength: 0, label: "", color: "" };
    
    let strength = 0;
    if (password.length >= 6) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    
    const labels = ["Very Weak", "Weak", "Fair", "Good", "Strong"];
    const colors = ["bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-blue-500", "bg-green-500"];
    
    return {
      strength,
      label: labels[strength],
      color: colors[strength]
    };
  };

  const passwordStrength = getPasswordStrength(formData.password);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-100 to-transparent rounded-full opacity-20"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-emerald-100 to-transparent rounded-full opacity-10"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-purple-100 to-transparent rounded-full opacity-10"></div>
      </div>

      {showAlert && (
        <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 animate-slide-in">
          <Alert
            main={alertData.main}
            info={alertData.info}
            type={alertData.type}
            onClose={hideAlert}
          />
        </div>
      )}

      <div className="relative z-10 min-h-screen flex flex-col md:flex-row">
        <div className="md:w-1/2 p-8 md:p-12 lg:p-20 flex flex-col justify-between bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
          <div>
            <div className="mb-8">
              <div className="flex items-center text-sm text-blue-200 mb-4">
                <span className="hover:text-white cursor-pointer">
                  Timetable Management System
                </span>
                <ChevronRight className="w-4 h-4 mx-2" />
                <span className="font-medium">
                  {isLogin ? "Login" : "Create Account"}
                </span>
              </div>
            </div>

            <div className="mb-12">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                  <CalendarDays className="w-8 h-8" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold mb-2">
                    Faculty Portal
                  </h1>
                  <p className="text-blue-100 text-lg">
                    Manage your schedule and availability
                  </p>
                </div>
              </div>

              <div className="inline-flex items-center px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm mb-8">
                <Zap className="w-4 h-4 mr-2" />
                Trusted by 500+ educational institutions
              </div>
            </div>

            <div className="space-y-8">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-white/20 rounded-lg mt-1">
                  <CalendarDays className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">
                    Timetable Management
                  </h3>
                  <p className="text-blue-100">
                    View and manage your weekly schedule with ease
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-2 bg-white/20 rounded-lg mt-1">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">
                    Replacement Requests
                  </h3>
                  <p className="text-blue-100">
                    Request and manage class replacements seamlessly
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-2 bg-white/20 rounded-lg mt-1">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">
                    Secure & Reliable
                  </h3>
                  <p className="text-blue-100">
                    Your data is protected with enterprise-grade security
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-blue-500/30">
            <p className="text-blue-200 text-sm">
              © 2024 Timetable Management System. All rights reserved.
            </p>
          </div>
        </div>

        <div className="md:w-1/2 p-8 md:p-12 lg:p-20 flex items-center justify-center">
          <div className="w-full max-w-md">
            <div className="text-center mb-10">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg mb-6">
                <Lock className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-3">
                {isLogin ? "Welcome Back" : "Create Faculty Account"}
              </h2>
              <p className="text-gray-600">
                {isLogin 
                  ? "Sign in to manage your timetable and schedule" 
                  : "Join your institution's timetable management system"
                }
              </p>
            </div>

            <div className="space-y-6">
              {!isLogin && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <User className="w-4 h-4 text-blue-500" />
                    Full Name
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Enter your full name"
                      className={`w-full px-4 py-3 pl-11 bg-gray-50 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                        formErrors.name 
                          ? "border-red-300 focus:ring-red-500 focus:border-red-500" 
                          : "border-gray-300"
                      }`}
                    />
                    <User className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                  </div>
                  {formErrors.name && (
                    <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {formErrors.name}
                    </p>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <User className="w-4 h-4 text-blue-500" />
                  Username
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="Enter your username"
                    className={`w-full px-4 py-3 pl-11 bg-gray-50 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                      formErrors.username 
                        ? "border-red-300 focus:ring-red-500 focus:border-red-500" 
                        : "border-gray-300"
                    }`}
                  />
                  <User className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                </div>
                {formErrors.username && (
                  <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {formErrors.username}
                  </p>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Lock className="w-4 h-4 text-blue-500" />
                    Password
                  </label>
                  {!isLogin && formData.password && (
                    <span className={`text-xs font-medium px-2 py-1 rounded ${passwordStrength.color} text-white`}>
                      {passwordStrength.label}
                    </span>
                  )}
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder={isLogin ? "Enter your password" : "Create a strong password"}
                    className={`w-full px-4 py-3 pl-11 pr-11 bg-gray-50 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                      formErrors.password 
                        ? "border-red-300 focus:ring-red-500 focus:border-red-500" 
                        : "border-gray-300"
                    }`}
                  />
                  <Lock className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                {formErrors.password && (
                  <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {formErrors.password}
                  </p>
                )}
                
                {!isLogin && formData.password && (
                  <div className="mt-3">
                    <div className="flex gap-1 mb-1">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div
                          key={i}
                          className={`h-1 flex-1 rounded-full ${
                            i <= passwordStrength.strength 
                              ? passwordStrength.color 
                              : "bg-gray-200"
                          }`}
                        />
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <div className="flex items-center gap-1">
                        <div className={`w-2 h-2 rounded-full ${formData.password.length >= 6 ? 'bg-green-500' : 'bg-gray-300'}`} />
                        <span className="text-xs text-gray-600">6+ characters</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className={`w-2 h-2 rounded-full ${/[A-Z]/.test(formData.password) ? 'bg-green-500' : 'bg-gray-300'}`} />
                        <span className="text-xs text-gray-600">Uppercase</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className={`w-2 h-2 rounded-full ${/[0-9]/.test(formData.password) ? 'bg-green-500' : 'bg-gray-300'}`} />
                        <span className="text-xs text-gray-600">Number</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className={`w-2 h-2 rounded-full ${/[^A-Za-z0-9]/.test(formData.password) ? 'bg-green-500' : 'bg-gray-300'}`} />
                        <span className="text-xs text-gray-600">Special char</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {!isLogin && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Lock className="w-4 h-4 text-blue-500" />
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Confirm your password"
                      className={`w-full px-4 py-3 pl-11 pr-11 bg-gray-50 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                        formErrors.confirmPassword 
                          ? "border-red-300 focus:ring-red-500 focus:border-red-500" 
                          : "border-gray-300"
                      }`}
                    />
                    <Lock className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  {formErrors.confirmPassword && (
                    <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {formErrors.confirmPassword}
                    </p>
                  )}
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={isLoading}
                className={`w-full py-3 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-all duration-300 ${
                  isLoading
                    ? "bg-blue-100 text-blue-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-sm hover:shadow-md"
                }`}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {isLogin ? "Signing In..." : "Creating Account..."}
                  </>
                ) : (
                  <>
                    {isLogin ? "Sign In" : "Create Account"}
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>

              <div className="text-center pt-4">
                <p className="text-gray-600">
                  {isLogin ? "Don't have an account?" : "Already have an account?"}
                  <button
                    type="button"
                    onClick={handleToggleMode}
                    className="ml-2 text-blue-600 hover:text-blue-800 font-semibold transition-colors"
                  >
                    {isLogin ? "Sign up now" : "Sign in"}
                  </button>
                </p>
              </div>

              {!isLogin && (
                <p className="text-xs text-gray-500 text-center">
                  By creating an account, you agree to our Terms of Service and Privacy Policy
                </p>
              )}
            </div>

            <div className="mt-8 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 bg-blue-100 rounded-lg">
                  <Shield className="w-4 h-4 text-blue-600" />
                </div>
                <p className="text-sm font-medium text-gray-900">
                  Demo Credentials
                </p>
              </div>
              <div className="space-y-2 text-xs text-gray-600">
                <p><span className="font-medium">Username:</span> ABC</p>
                <p><span className="font-medium">Password:</span> ojqR@b7Z3qg4</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideIn {
          from {
            transform: translate(-50%, -100%);
            opacity: 0;
          }
          to {
            transform: translate(-50%, 0);
            opacity: 1;
          }
        }

        .animate-slide-in {
          animation: slideIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}