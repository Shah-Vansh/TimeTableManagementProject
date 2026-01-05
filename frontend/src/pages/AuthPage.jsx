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
  Bookmark,
  Notebook,
  BookOpen,
  Highlighter,
  PenTool,
  Layers,
  TrendingUp,
  File,
  ClipboardList,
  StickyNote,
  Folder,
  Calendar,
  Clock,
  GraduationCap,
  Building,
  Compass,
  Info,
  AlertTriangle,
  Plus,
} from "lucide-react";
import api from "../configs/api";

// Reuse your existing Alert component
const Alert = ({ main, info, type, onClose }) => {
  const getColorClasses = () => {
    const colorMap = {
      success: {
        bg: "bg-gradient-to-r from-emerald-50 to-emerald-100/50",
        border: "border-2 border-emerald-200",
        iconBg: "bg-gradient-to-br from-emerald-100 to-emerald-200",
        iconColor: "text-emerald-600",
        textMain: "text-emerald-800",
        textInfo: "text-emerald-700",
        button: "text-emerald-400 hover:text-emerald-600",
        shadow: "shadow-emerald-100/50",
        accent: "from-emerald-300 to-emerald-400",
        badge: "bg-emerald-100 text-emerald-800 border-emerald-200",
      },
      error: {
        bg: "bg-gradient-to-r from-rose-50 to-rose-100/50",
        border: "border-2 border-rose-200",
        iconBg: "bg-gradient-to-br from-rose-100 to-rose-200",
        iconColor: "text-rose-600",
        textMain: "text-rose-800",
        textInfo: "text-rose-700",
        button: "text-rose-400 hover:text-rose-600",
        shadow: "shadow-rose-100/50",
        accent: "from-rose-300 to-rose-400",
        badge: "bg-rose-100 text-rose-800 border-rose-200",
      },
      warning: {
        bg: "bg-gradient-to-r from-indigo-50 to-indigo-100/50",
        border: "border-2 border-indigo-200",
        iconBg: "bg-gradient-to-br from-indigo-100 to-indigo-200",
        iconColor: "text-indigo-600",
        textMain: "text-indigo-800",
        textInfo: "text-indigo-700",
        button: "text-indigo-400 hover:text-indigo-600",
        shadow: "shadow-indigo-100/50",
        accent: "from-indigo-300 to-indigo-400",
        badge: "bg-indigo-100 text-indigo-800 border-indigo-200",
      },
    };
    return colorMap[type] || colorMap.success;
  };

  const colors = getColorClasses();

  return (
    <div className={`fixed top-6 left-1/2 -translate-x-1/2 ${colors.bg} ${colors.border} rounded-xl ${colors.shadow} inline-flex items-start gap-3 p-4 text-sm z-50 min-w-[320px] max-w-md transform transition-all duration-300 animate-slideInDown`}>
      <style>{`
        @keyframes slideInDown {
          from {
            opacity: 0;
            transform: translate(-50%, -20px);
          }
          to {
            opacity: 1;
            transform: translate(-50%, 0);
          }
        }
        .animate-slideInDown {
          animation: slideInDown 0.3s ease-out;
        }
      `}</style>

      <div className={`flex-shrink-0 p-2.5 ${colors.iconBg} rounded-lg border ${colors.border}`}>
        {type === "success" ? (
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className={colors.iconColor}>
            <path d="M17.5 9.25V10a8.5 8.5 0 1 1-5-7.77M17.5 3.5 10 11.5l-2.5-2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        ) : (
          <AlertCircle className={`w-5 h-5 ${colors.iconColor}`} />
        )}
      </div>

      <div className="flex-1">
        <h3 className={`font-semibold ${colors.textMain} mb-1`}>
          {main}
        </h3>
        <p className={`text-sm ${colors.textInfo}`}>
          {info}
        </p>
      </div>

      <button
        onClick={onClose}
        className={`cursor-pointer flex-shrink-0 p-1 hover:bg-white/50 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 ${colors.button}`}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M12.485 3.515a.5.5 0 0 0-.707 0L8 7.293 4.222 3.515a.5.5 0 1 0-.707.707L7.293 8l-3.778 3.778a.5.5 0 1 0 .707.707L8 8.707l3.778 3.778a.5.5 0 0 0 .707-.707L8.707 8l3.778-3.778a.5.5 0 0 0 0-.707Z" fill="currentColor" fillOpacity=".7"/>
        </svg>
      </button>
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
    type: "success",
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
            name: formData.name,
          };

      const response = await api.post(endpoint, payload);
      const data = response.data;

      showAlertMessage(
        isLogin ? "Welcome Back! ✨" : "Account Created! 🎉",
        data.message ||
          (isLogin
            ? "Welcome to Study Planner Organizer"
            : "Your tutor account has been created successfully"),
        "success"
      );

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 2000);
    } catch (error) {
      console.error("Auth error:", error);

      const message = error.response?.data?.message || "Please try again";
      showAlertMessage(
        isLogin ? "Login Failed" : "Registration Failed",
        message,
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
    const colors = [
      "bg-gradient-to-r from-rose-500 to-rose-600",
      "bg-gradient-to-r from-indigo-500 to-indigo-600",
      "bg-gradient-to-r from-yellow-500 to-yellow-600",
      "bg-gradient-to-r from-blue-500 to-blue-600",
      "bg-gradient-to-r from-emerald-500 to-emerald-600",
    ];

    return {
      strength,
      label: labels[strength],
      color: colors[strength],
    };
  };

  const passwordStrength = getPasswordStrength(formData.password);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50">
      {/* Decorative Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-10 w-72 h-72 bg-gradient-to-br from-indigo-100 to-transparent rounded-full opacity-40"></div>
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-gradient-to-tr from-blue-100 to-transparent rounded-full opacity-30"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full h-64 bg-gradient-to-r from-transparent via-indigo-50/20 to-transparent"></div>

        {/* Stationery Elements */}
        <div className="absolute top-40 left-20 w-24 h-24 border-4 border-indigo-200/40 border-dashed rounded-lg rotate-12"></div>
        <div className="absolute bottom-40 right-20 w-16 h-16 border-2 border-blue-200/40 border-dotted rounded-full"></div>
        <div className="absolute top-60 right-40 w-8 h-32 bg-gradient-to-b from-emerald-200/30 to-transparent transform rotate-45"></div>
      </div>

      {showAlert && (
        <Alert
          main={alertData.main}
          info={alertData.info}
          type={alertData.type}
          onClose={hideAlert}
        />
      )}

      <div className="relative z-10 min-h-screen flex flex-col md:flex-row">
        {/* Left Panel - Brand & Features */}
        <div className="md:w-1/2 p-8 md:p-12 lg:p-20 flex flex-col justify-between bg-gradient-to-br from-indigo-600 to-indigo-700 text-white">
          <div>
            {/* Breadcrumb */}
            <div className="mb-8">
              <div className="flex items-center text-sm text-indigo-100/80 mb-4">
                <span className="hover:text-white cursor-pointer flex items-center gap-1">
                  <Bookmark className="w-3 h-3" />
                  Study Planner Organizer
                </span>
                <ChevronRight className="w-4 h-4 mx-2 text-indigo-200/60" />
                <span className="font-medium text-indigo-100">
                  {isLogin ? "Tutor Login" : "Create Tutor Account"}
                </span>
              </div>
            </div>

            {/* Hero Section */}
            <div className="mb-12">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl border border-indigo-300/30 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/10 to-transparent"></div>
                  <BookOpen className="w-8 h-8 relative z-10" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold mb-2">Study Planner Portal</h1>
                  <p className="text-indigo-100/90 text-lg">
                    Manage your teaching schedule like a professional organizer
                  </p>
                </div>
              </div>

              <div className="inline-flex items-center px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm mb-8 border border-indigo-300/30">
                <Zap className="w-4 h-4 mr-2" />
                Trusted by 500+ tutors & educational institutions
              </div>
            </div>

            {/* Features */}
            <div className="space-y-8">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-white/20 rounded-lg mt-1 border border-indigo-300/30">
                  <CalendarDays className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">
                    Schedule Management
                  </h3>
                  <p className="text-indigo-100/90">
                    Organize your teaching schedule across multiple study groups
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-2 bg-white/20 rounded-lg mt-1 border border-indigo-300/30">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">
                    Study Group Coordination
                  </h3>
                  <p className="text-indigo-100/90">
                    Manage multiple study groups like separate notebook sections
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-2 bg-white/20 rounded-lg mt-1 border border-indigo-300/30">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">
                    Secure & Organized
                  </h3>
                  <p className="text-indigo-100/90">
                    Your teaching data is protected and perfectly organized
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-12 pt-8 border-t border-indigo-500/30">
            <p className="text-indigo-100/80 text-sm">
              © 2024 Study Planner Organizer. All rights reserved.
            </p>
          </div>
        </div>

        {/* Right Panel - Auth Form */}
        <div className="md:w-1/2 p-8 md:p-12 lg:p-20 flex items-center justify-center">
          <div className="w-full max-w-md">
            {/* Form Header */}
            <div className="text-center mb-10">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl shadow-lg mb-6 border border-indigo-300 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/10 to-transparent"></div>
                <Lock className="w-8 h-8 text-white relative z-10" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-3">
                {isLogin ? "Welcome Back, Tutor! 👋" : "Join Study Planner ✨"}
              </h2>
              <p className="text-gray-600">
                {isLogin
                  ? "Sign in to organize your teaching schedule"
                  : "Create your tutor account to start organizing"}
              </p>
            </div>

            {/* Auth Form */}
            <div className="space-y-6">
              {/* Name Field (for registration only) */}
              {!isLogin && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <User className="w-4 h-4 text-indigo-600" />
                    Full Name
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Enter your full name"
                      className={`w-full px-4 py-3 pl-11 bg-white border border-gray-300 text-gray-900 placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-sm ${
                        formErrors.name
                          ? "border-rose-300 focus:ring-rose-500 focus:border-rose-500"
                          : ""
                      }`}
                    />
                    <User className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                  </div>
                  {formErrors.name && (
                    <p className="mt-2 text-sm text-rose-600 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {formErrors.name}
                    </p>
                  )}
                </div>
              )}

              {/* Username Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <User className="w-4 h-4 text-indigo-600" />
                  Username
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="Enter your username"
                    className={`w-full px-4 py-3 pl-11 bg-white border border-gray-300 text-gray-900 placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-sm ${
                      formErrors.username
                        ? "border-rose-300 focus:ring-rose-500 focus:border-rose-500"
                        : ""
                    }`}
                  />
                  <User className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                </div>
                {formErrors.username && (
                  <p className="mt-2 text-sm text-rose-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {formErrors.username}
                  </p>
                )}
              </div>

              {/* Password Field */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Lock className="w-4 h-4 text-indigo-600" />
                    Password
                  </label>
                  {!isLogin && formData.password && (
                    <span className={`text-xs font-medium px-2 py-1 rounded-full text-white ${passwordStrength.color}`}>
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
                    placeholder={
                      isLogin
                        ? "Enter your password"
                        : "Create a strong password"
                    }
                    className={`w-full px-4 py-3 pl-11 pr-11 bg-white border border-gray-300 text-gray-900 placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-sm ${
                      formErrors.password
                        ? "border-rose-300 focus:ring-rose-500 focus:border-rose-500"
                        : ""
                    }`}
                  />
                  <Lock className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3.5 text-gray-400 hover:text-indigo-600 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                {formErrors.password && (
                  <p className="mt-2 text-sm text-rose-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {formErrors.password}
                  </p>
                )}

                {/* Password Strength Indicator */}
                {!isLogin && formData.password && (
                  <div className="mt-3">
                    <div className="flex gap-1 mb-1">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div
                          key={i}
                          className={`h-1 flex-1 rounded-full ${
                            i <= passwordStrength.strength
                              ? passwordStrength.color.split(' ')[0]
                              : "bg-gray-200"
                          }`}
                        />
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <div className="flex items-center gap-1">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            formData.password.length >= 6
                              ? "bg-emerald-500"
                              : "bg-gray-300"
                          }`}
                        />
                        <span className="text-xs text-gray-600">
                          6+ characters
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            /[A-Z]/.test(formData.password)
                              ? "bg-emerald-500"
                              : "bg-gray-300"
                          }`}
                        />
                        <span className="text-xs text-gray-600">Uppercase</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            /[0-9]/.test(formData.password)
                              ? "bg-emerald-500"
                              : "bg-gray-300"
                          }`}
                        />
                        <span className="text-xs text-gray-600">Number</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            /[^A-Za-z0-9]/.test(formData.password)
                              ? "bg-emerald-500"
                              : "bg-gray-300"
                          }`}
                        />
                        <span className="text-xs text-gray-600">
                          Special character
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password Field */}
              {!isLogin && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Lock className="w-4 h-4 text-indigo-600" />
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Confirm your password"
                      className={`w-full px-4 py-3 pl-11 pr-11 bg-white border border-gray-300 text-gray-900 placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-sm ${
                        formErrors.confirmPassword
                          ? "border-rose-300 focus:ring-rose-500 focus:border-rose-500"
                          : ""
                      }`}
                    />
                    <Lock className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-3 top-3.5 text-gray-400 hover:text-indigo-600 transition-colors"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  {formErrors.confirmPassword && (
                    <p className="mt-2 text-sm text-rose-600 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {formErrors.confirmPassword}
                    </p>
                  )}
                </div>
              )}

              {/* Submit Button */}
              <button
                onClick={handleSubmit}
                disabled={isLoading}
                className={`w-full py-3 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-all duration-300 shadow-sm hover:shadow-md group ${
                  isLoading
                    ? "bg-gradient-to-r from-indigo-100 to-indigo-50 text-indigo-400 cursor-not-allowed border border-indigo-200"
                    : "bg-gradient-to-r from-indigo-600 to-indigo-700 text-white hover:from-indigo-700 hover:to-indigo-800"
                }`}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin group-hover:rotate-180 transition-transform" />
                    {isLogin ? "Signing In..." : "Creating Account..."}
                  </>
                ) : (
                  <>
                    {isLogin ? "Sign In to Organizer" : "Create Tutor Account"}
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>

              {/* Toggle Mode */}
              <div className="text-center pt-4">
                <p className="text-gray-600">
                  {isLogin
                    ? "New to Study Planner?"
                    : "Already have an account?"}
                  <button
                    type="button"
                    onClick={handleToggleMode}
                    className="ml-2 text-indigo-600 hover:text-indigo-800 font-semibold transition-colors hover:underline"
                  >
                    {isLogin ? "Create an account" : "Sign in here"}
                  </button>
                </p>
              </div>

              {/* Terms */}
              {!isLogin && (
                <p className="text-xs text-gray-500 text-center">
                  By creating an account, you agree to our Terms of Service and
                  Privacy Policy
                </p>
              )}
            </div>

            {/* Demo Credentials */}
            <div className="mt-8 p-4 bg-gradient-to-r from-indigo-50 to-indigo-100/50 rounded-xl border-2 border-indigo-200">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 bg-gradient-to-br from-indigo-100 to-indigo-200 rounded-lg border border-indigo-300">
                  <Shield className="w-4 h-4 text-indigo-600" />
                </div>
                <p className="text-sm font-medium text-indigo-900">
                  Demo Credentials
                </p>
              </div>
              <div className="space-y-2 text-xs text-indigo-800/90">
                <p className="flex items-center gap-1">
                  <span className="font-medium">Username:</span> 
                  <span className="font-mono bg-white/50 px-2 py-0.5 rounded border border-indigo-300">ABC</span>
                </p>
                <p className="flex items-center gap-1">
                  <span className="font-medium">Password:</span>
                  <span className="font-mono bg-white/50 px-2 py-0.5 rounded border border-indigo-300">ojqR@b7Z3qg4</span>
                </p>
              </div>
              <div className="mt-3 pt-3 border-t border-indigo-300/50">
                <p className="text-xs text-indigo-700/80">
                  Use these credentials to explore the Study Planner Organizer
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}