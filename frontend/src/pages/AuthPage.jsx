import React, { useState } from "react";
import {
  Lock,
  Mail,
  User,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  Loader2,
  Shield,
  ArrowRight,
  ChevronRight,
  Zap,
  Users,
  GraduationCap,
  CalendarDays,
} from "lucide-react";
import api from "../configs/api";
import Alert from "../components/Alert";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: "",
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

  // Show alert function
  const showAlertMessage = (main, info, type = "success") => {
    setAlertData({ main, info, type });
    setShowAlert(true);
  };

  // Hide alert function
  const hideAlert = () => {
    setShowAlert(false);
    setAlertData({ main: "", info: "", type: "success" });
  };

  // Validate form
  const validateForm = () => {
    const errors = {};
    
    if (!formData.email) {
      errors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = "Email is invalid";
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
    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    setFormErrors({});
    
    try {
      const endpoint = isLogin ? "/api/login" : "/api/signup";
      const payload = isLogin 
        ? { email: formData.email, password: formData.password }
        : { 
            email: formData.email, 
            password: formData.password, 
            name: formData.name 
          };
      
      const response = await api.post(endpoint, payload);
      
      if (response.data.success) {
        showAlertMessage(
          isLogin ? "Login Successful!" : "Account Created!",
          isLogin 
            ? "Welcome back to Timetable Management System"
            : "Your account has been created successfully",
          "success"
        );
        
        // In a real app, you would:
        // 1. Store the token
        // 2. Redirect to dashboard
        // 3. Update auth context
        setTimeout(() => {
          // Redirect to dashboard or home page
          window.location.href = "/dashboard";
        }, 2000);
      } else {
        showAlertMessage(
          isLogin ? "Login Failed" : "Signup Failed",
          response.data.message || "Please try again",
          "error"
        );
      }
    } catch (error) {
      console.error("Auth error:", error);
      
      if (error.response) {
        const { status, data } = error.response;
        if (status === 401) {
          showAlertMessage(
            "Authentication Failed",
            "Invalid email or password",
            "error"
          );
        } else if (status === 409) {
          showAlertMessage(
            "Account Exists",
            "An account with this email already exists",
            "error"
          );
        } else if (status === 400) {
          showAlertMessage(
            "Validation Error",
            data.message || "Please check your input",
            "error"
          );
        } else {
          showAlertMessage(
            "Request Failed",
            "Something went wrong. Please try again.",
            "error"
          );
        }
      } else {
        showAlertMessage(
          "Network Error",
          "Unable to connect to server. Please check your connection.",
          "error"
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleMode = () => {
    setIsLogin(!isLogin);
    setFormData({
      email: "",
      password: "",
      name: "",
      confirmPassword: "",
    });
    setFormErrors({});
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  // Password strength checker
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
      {/* Decorative Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-100 to-transparent rounded-full opacity-20"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-emerald-100 to-transparent rounded-full opacity-10"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-purple-100 to-transparent rounded-full opacity-10"></div>
      </div>

      {/* Alert Component */}
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
        {/* Left Side - Brand & Features */}
        <div className="md:w-1/2 p-8 md:p-12 lg:p-20 flex flex-col justify-between bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
          <div>
            {/* Breadcrumb */}
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

            {/* Brand & Heading */}
            <div className="mb-12">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                  <CalendarDays className="w-8 h-8" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold mb-2">
                    Timetable Management
                  </h1>
                  <p className="text-blue-100 text-lg">
                    Smart scheduling for educational institutions
                  </p>
                </div>
              </div>

              <div className="inline-flex items-center px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm mb-8">
                <Zap className="w-4 h-4 mr-2" />
                Trusted by 500+ educational institutions
              </div>
            </div>

            {/* Features */}
            <div className="space-y-8">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-white/20 rounded-lg mt-1">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">
                    Faculty Management
                  </h3>
                  <p className="text-blue-100">
                    Efficiently manage faculty schedules, replacements, and availability
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-2 bg-white/20 rounded-lg mt-1">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">
                    Class Scheduling
                  </h3>
                  <p className="text-blue-100">
                    Automate timetable generation and manage class schedules
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
                    Enterprise-grade security with role-based access control
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Text */}
          <div className="mt-12 pt-8 border-t border-blue-500/30">
            <p className="text-blue-200 text-sm">
              © 2024 Timetable Management System. All rights reserved.
            </p>
          </div>
        </div>

        {/* Right Side - Auth Form */}
        <div className="md:w-1/2 p-8 md:p-12 lg:p-20 flex items-center justify-center">
          <div className="w-full max-w-md">
            <div className="text-center mb-10">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg mb-6">
                <Lock className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-3">
                {isLogin ? "Welcome Back" : "Create Account"}
              </h2>
              <p className="text-gray-600">
                {isLogin 
                  ? "Sign in to manage your institution's timetable" 
                  : "Join thousands of institutions managing their schedules efficiently"
                }
              </p>
            </div>

            {/* Auth Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
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
                  <Mail className="w-4 h-4 text-blue-500" />
                  Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="you@institution.edu"
                    className={`w-full px-4 py-3 pl-11 bg-gray-50 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                      formErrors.email 
                        ? "border-red-300 focus:ring-red-500 focus:border-red-500" 
                        : "border-gray-300"
                    }`}
                  />
                  <Mail className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                </div>
                {formErrors.email && (
                  <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {formErrors.email}
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
                
                {/* Password strength indicator */}
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

              {/* Forgot Password Link */}
              {isLogin && (
                <div className="flex justify-end">
                  <a
                    href="/forgot-password"
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
                  >
                    Forgot password?
                  </a>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
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

              {/* Toggle Mode */}
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

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Or continue with</span>
                </div>
              </div>

              {/* Social Login Options */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  <span className="text-sm font-medium">Google</span>
                </button>
                <button
                  type="button"
                  className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <svg className="w-5 h-5" fill="#000000" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                  </svg>
                  <span className="text-sm font-medium">GitHub</span>
                </button>
              </div>

              {/* Terms & Privacy */}
              {!isLogin && (
                <p className="text-xs text-gray-500 text-center">
                  By creating an account, you agree to our{" "}
                  <a href="/terms" className="text-blue-600 hover:text-blue-800">
                    Terms of Service
                  </a>{" "}
                  and{" "}
                  <a href="/privacy" className="text-blue-600 hover:text-blue-800">
                    Privacy Policy
                  </a>
                </p>
              )}
            </form>

            {/* Demo Credentials (for development only) */}
            <div className="mt-8 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 bg-blue-100 rounded-lg">
                  <Shield className="w-4 h-4 text-blue-600" />
                </div>
                <p className="text-sm font-medium text-gray-900">
                  Demo Credentials (Development)
                </p>
              </div>
              <div className="space-y-2 text-xs text-gray-600">
                <p><span className="font-medium">Email:</span> demo@institution.edu</p>
                <p><span className="font-medium">Password:</span> demo123</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add CSS for animations */}
      <style jsx>{`
        @keyframes slideIn {
          from {
            transform: translateX(-100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
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