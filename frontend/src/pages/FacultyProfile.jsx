import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  User,
  Clock,
  Calendar,
  Mail,
  Edit2,
  Save,
  X,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  Loader2,
  LogOut,
  Download,
  Printer,
  Lock,
  RefreshCw,
  ArrowLeft,
  Users,
  BookOpen,
  Eye,
  EyeOff,
  MessageSquare,
  Shield,
  Bell,
  Key,
  Bookmark,
  ClipboardList,
  GraduationCap,
  Notebook,
  CalendarDays,
  TrendingUp,
  FileText,
} from "lucide-react";
import api from "../configs/api";
import Alert from "../components/Alert";
import TimetableTable from "../components/TimetableTable";

export default function FacultyProfile() {
  const { facultyId } = useParams();
  const navigate = useNavigate();

  /* =======================
     🔹 STATE
  ======================= */
  const [faculty, setFaculty] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [isEditingTelegram, setIsEditingTelegram] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [alert, setAlert] = useState(null);
  const [showEmptySlots, setShowEmptySlots] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Telegram form state
  const [telegramForm, setTelegramForm] = useState({
    chatId: "",
  });

  // Statistics state
  const [stats, setStats] = useState({
    totalLectures: 0,
    daysPerWeek: 0,
    classesAssigned: new Set(),
    subjectsAssigned: new Set(),
  });

  /* =======================
     🔹 UTILITIES
  ======================= */
  const showAlert = (main, info, type) => {
    setAlert({ main, info, type });
    setTimeout(() => setAlert(null), 5000);
  };

  /* =======================
     🔹 FETCH FACULTY DATA
  ======================= */
  const fetchFacultyData = async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    else setIsRefreshing(true);
    const token = localStorage.getItem("token");
    try {
      const response = await api.get(`/api/user/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        const facultyData = response.data.faculty;
        setFaculty(facultyData);
        setTelegramForm({ chatId: facultyData.telegram_chat_id || "" });
        calculateStatistics(facultyData.timetable || {});
      } else {
        showAlert("Faculty not found", response.data.error, "error");
        navigate("/dashboard");
      }
    } catch (error) {
      console.error("Error fetching faculty data:", error);
      showAlert(
        "Failed to load profile",
        error.response?.data?.error || "Please try again",
        "error"
      );
      navigate("/dashboard");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  /* =======================
     🔹 CALCULATE STATISTICS
  ======================= */
  const calculateStatistics = (timetable) => {
    let totalLectures = 0;
    const classesAssigned = new Set();
    const subjectsAssigned = new Set();
    const daysWithLectures = new Set();

    const days = ["mon", "tue", "wed", "thu", "fri", "sat"];
    days.forEach((day) => {
      const daySchedule = timetable[day] || [];
      const hasLectures = daySchedule.some((lecture) => lecture !== "free");

      if (hasLectures) {
        daysWithLectures.add(day);

        daySchedule.forEach((lecture) => {
          if (lecture !== "free") {
            totalLectures++;

            const parts = lecture.split("-");
            if (parts.length >= 2) {
              classesAssigned.add(parts[0]);
              subjectsAssigned.add(parts[1]);
            }
          }
        });
      }
    });

    setStats({
      totalLectures,
      daysPerWeek: daysWithLectures.size,
      classesAssigned,
      subjectsAssigned,
    });
  };

  /* =======================
     🔹 HANDLE PASSWORD CHANGE
  ======================= */
  const handleChangePassword = async () => {
    const { currentPassword, newPassword, confirmPassword } = passwordForm;

    if (!currentPassword || !newPassword || !confirmPassword) {
      showAlert(
        "All fields required",
        "Please fill in all password fields",
        "error"
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      showAlert(
        "Passwords don't match",
        "New password and confirm password must match",
        "error"
      );
      return;
    }

    if (newPassword.length < 6) {
      showAlert(
        "Weak password",
        "Password must be at least 6 characters long",
        "error"
      );
      return;
    }

    setIsSaving(true);
    try {
      const token = localStorage.getItem("token");
      const response = await api.put(
        `/api/user/profile`,
        {
          old_password: currentPassword,
          new_password: newPassword,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        setPasswordForm({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
        setIsEditingPassword(false);
        showAlert(
          "Password updated",
          "Your password has been changed successfully",
          "success"
        );
      } else {
        throw new Error(response.data.error || "Failed to update password");
      }
    } catch (error) {
      console.error("Error changing password:", error);
      showAlert(
        "Failed to change password",
        error.response?.data?.error || "Please check your current password",
        "error"
      );
    } finally {
      setIsSaving(false);
    }
  };

  /* =======================
     🔹 HANDLE TELEGRAM CHAT ID UPDATE
  ======================= */
  const handleUpdateTelegram = async () => {
    const { chatId } = telegramForm;

    if (!chatId.trim()) {
      showAlert(
        "Chat ID required",
        "Please enter your Telegram Chat ID",
        "error"
      );
      return;
    }

    // Validate chat ID format (numeric)
    if (!/^-?\d+$/.test(chatId.trim())) {
      showAlert("Invalid format", "Telegram Chat ID must be a number", "error");
      return;
    }

    setIsSaving(true);
    try {
      const token = localStorage.getItem("token");
      const response = await api.put(
        `/api/user/profile`,
        {
          telegram_chat_id: chatId.trim(),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        setFaculty((prev) => ({
          ...prev,
          telegram_chat_id: chatId.trim(),
        }));
        showAlert(
          "Telegram Chat ID updated",
          "Your chat ID has been saved successfully",
          "success"
        );
        setIsEditingTelegram(false);
      } else {
        throw new Error(
          response.data.error || "Failed to update Telegram Chat ID"
        );
      }
    } catch (error) {
      console.error("Error updating Telegram Chat ID:", error);
      showAlert(
        "Update failed",
        error.response?.data?.error || "Please try again",
        "error"
      );
    } finally {
      setIsSaving(false);
    }
  };

  /* =======================
     🔹 HANDLE LOGOUT
  ======================= */
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    showAlert("Logged out", "You have been successfully logged out", "success");
    setTimeout(() => navigate("/auth"), 1500);
  };

  /* =======================
     🔹 EXPORT FUNCTIONS
  ======================= */
  const exportTimetable = () => {
    if (!faculty) return;

    let content = `FACULTY TIMETABLE\n`;
    content += `================\n`;
    content += `Name: ${faculty.name}\n`;
    content += `Faculty ID: ${faculty._id?.substring(0, 8) || "N/A"}\n`;
    content += `Telegram Chat ID: ${faculty.telegram_chat_id || "Not set"}\n`;
    content += `Academic Year: ${new Date().getFullYear()}-${
      new Date().getFullYear() + 1
    }\n`;
    content += `Generated on: ${new Date().toLocaleString()}\n\n`;

    // Header
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    content += `Time        | ${days
      .map((day) => day.padEnd(15))
      .join("| ")}\n`;
    content += `------------|${days
      .map(() => "-----------------")
      .join("|")}\n`;

    // Rows
    const timeSlots = [
      { time: "9:00 - 10:00" },
      { time: "10:00 - 11:00" },
      { time: "11:00 - 12:00" },
      { time: "12:00 - 1:00" },
      { time: "1:00 - 2:00" },
    ];

    timeSlots.forEach((slot, timeIndex) => {
      content += `${slot.time.padEnd(11)} | `;

      days.forEach((day) => {
        const lecture =
          faculty.timetable[day.toLowerCase()]?.[timeIndex] || "free";
        let displayText = lecture === "free" ? "Free" : lecture;
        displayText =
          displayText.length > 15
            ? displayText.substring(0, 12) + "..."
            : displayText;
        content += `${displayText.padEnd(15)} | `;
      });

      content += "\n";
    });

    content += `\n\nSUMMARY:\n`;
    content += `Total Lectures: ${stats.totalLectures}\n`;
    content += `Teaching Days: ${stats.daysPerWeek}/6\n`;
    content += `Branches Teaching: ${stats.classesAssigned.size}\n`;
    content += `Subjects/Semesters: ${stats.subjectsAssigned.size}\n`;

    // Create and download file
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `timetable_${faculty.name.replace(/\s+/g, "_")}_${
      new Date().toISOString().split("T")[0]
    }.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showAlert("Timetable exported", "Downloaded as text file", "success");
  };

  const printTimetable = () => {
    window.print();
  };

  /* =======================
     🔹 EFFECTS
  ======================= */
  useEffect(() => {
    fetchFacultyData();
  }, [facultyId]);

  /* =======================
     🔹 RENDER LOADING
  ======================= */
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-amber-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading faculty profile...</p>
        </div>
      </div>
    );
  }

  if (!faculty) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-rose-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Faculty Not Found
          </h1>
          <p className="text-gray-600 mb-6">
            The faculty profile you're looking for doesn't exist.
          </p>
          <button
            onClick={() => navigate("/dashboard")}
            className="px-6 py-3 bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-lg font-medium hover:from-amber-700 hover:to-amber-800 transition-all duration-300 shadow-sm hover:shadow-md flex items-center gap-2 mx-auto group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  /* =======================
     🔹 RENDER PROFILE
  ======================= */
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-blue-50">
      {/* Decorative Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-10 w-72 h-72 bg-gradient-to-br from-amber-100 to-transparent rounded-full opacity-40"></div>
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-gradient-to-tr from-blue-100 to-transparent rounded-full opacity-30"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full h-64 bg-gradient-to-r from-transparent via-amber-50/20 to-transparent"></div>

        {/* Stationery Elements */}
        <div className="absolute top-40 left-20 w-24 h-24 border-4 border-amber-200/40 border-dashed rounded-lg rotate-12"></div>
        <div className="absolute bottom-40 right-20 w-16 h-16 border-2 border-blue-200/40 border-dotted rounded-full"></div>
        <div className="absolute top-60 right-40 w-8 h-32 bg-gradient-to-b from-emerald-200/30 to-transparent transform rotate-45"></div>
      </div>

      <div className="relative z-10 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Alert Component */}
          {alert && (
            <Alert
              main={alert.main}
              info={alert.info}
              type={alert.type}
              onClose={() => setAlert(null)}
            />
          )}

          {/* Breadcrumb */}
          <div className="mb-6 print:hidden">
            <div className="flex items-center text-sm text-gray-500 mb-4">
              <button
                onClick={() => navigate("/dashboard")}
                className="hover:text-gray-700 cursor-pointer flex items-center gap-1"
              >
                <Bookmark className="w-3 h-3" />
                Dashboard
              </button>
              <ChevronRight className="w-4 h-4 mx-2" />
              <span className="hover:text-gray-700 cursor-pointer flex items-center gap-1">
                <Notebook className="w-3 h-3" />
                Faculty
              </span>
              <ChevronRight className="w-4 h-4 mx-2" />
              <span className="font-medium text-amber-600 flex items-center gap-1">
                <ClipboardList className="w-4 h-4" />
                My Profile
              </span>
            </div>
          </div>

          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 bg-white rounded-xl shadow-sm border border-gray-100 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-100 to-transparent opacity-60"></div>
                  <div className="relative">
                    <User className="w-6 h-6 text-amber-600" />
                  </div>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    Academic Profile
                  </h1>
                  <p className="text-gray-600 mt-1">
                    Manage your teaching schedule, notifications, and account
                    settings
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Profile Info */}
            <div className="lg:col-span-1 space-y-6">
              {/* Profile Card */}
              <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                <div className="flex flex-col items-center mb-6">
                  <div className="w-24 h-24 bg-gradient-to-br from-amber-500 to-amber-600 rounded-full flex items-center justify-center mb-4 relative">
                    <span className="text-3xl font-bold text-white">
                      {faculty.name.charAt(0)}
                    </span>
                    <div className="absolute -bottom-2 right-2 p-1.5 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full border-2 border-white">
                      <Shield className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {faculty.name}
                  </h2>
                  <div className="flex items-center gap-2 mt-2">
                    <div
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        faculty.isAdmin
                          ? "bg-gradient-to-r from-purple-100 to-purple-50 text-purple-700 border border-purple-200"
                          : "bg-gradient-to-r from-blue-100 to-blue-50 text-blue-700 border border-blue-200"
                      }`}
                    >
                      {faculty.isAdmin ? "Administrator" : "Faculty Member"}
                    </div>
                    <div className="text-sm text-gray-500">
                      ID: {faculty._id?.substring(0, 8) || "N/A"}
                    </div>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-amber-50 to-amber-100/30 rounded-lg border border-amber-200/50">
                    <div className="p-2 bg-gradient-to-br from-amber-100 to-amber-200 rounded-lg">
                      <Mail className="w-4 h-4 text-amber-700" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="font-medium text-gray-900">
                        {faculty.email || "Not set"}
                      </p>
                    </div>
                  </div>

                  <div
                    className={`flex items-center gap-3 p-3 rounded-lg border ${
                      faculty.telegram_chat_id
                        ? "bg-gradient-to-r from-emerald-50 to-emerald-100/30 border-emerald-200/50"
                        : "bg-gradient-to-r from-rose-50 to-rose-100/30 border-rose-200/50"
                    }`}
                  >
                    <div
                      className={`p-2 rounded-lg ${
                        faculty.telegram_chat_id
                          ? "bg-gradient-to-br from-emerald-100 to-emerald-200"
                          : "bg-gradient-to-br from-rose-100 to-rose-200"
                      }`}
                    >
                      <MessageSquare
                        className={`w-4 h-4 ${
                          faculty.telegram_chat_id
                            ? "text-emerald-700"
                            : "text-rose-700"
                        }`}
                      />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Telegram</p>
                      <p className="font-medium text-gray-900">
                        {faculty.telegram_chat_id || "Not configured"}
                      </p>
                      {!faculty.telegram_chat_id && (
                        <p className="text-xs text-rose-600 mt-1">
                          Required for notifications
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-50 to-blue-100/30 rounded-lg border border-blue-200/50">
                    <div className="p-2 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg">
                      <CalendarDays className="w-4 h-4 text-blue-700" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Member Since</p>
                      <p className="font-medium text-gray-900">
                        {new Date(faculty.createdAt).toLocaleDateString(
                          "en-US",
                          {
                            month: "long",
                            year: "numeric",
                          }
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Key className="w-4 h-4 text-amber-600" />
                    Quick Actions
                  </h3>
                  <div className="space-y-2">
                    <button
                      onClick={() => setIsEditingTelegram(true)}
                      className="flex items-center justify-between w-full p-3 text-left hover:bg-gradient-to-r from-emerald-50 to-emerald-100/50 rounded-lg border border-emerald-200 hover:border-emerald-300 transition-all duration-300 group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-lg group-hover:scale-105 transition-transform">
                          <Bell className="w-4 h-4 text-emerald-700" />
                        </div>
                        <span className="font-medium text-gray-900">
                          Setup Notifications
                        </span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
                    </button>

                    <button
                      onClick={() => setIsEditingPassword(true)}
                      className="flex items-center justify-between w-full p-3 text-left hover:bg-gradient-to-r from-blue-50 to-blue-100/50 rounded-lg border border-blue-200 hover:border-blue-300 transition-all duration-300 group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg group-hover:scale-105 transition-transform">
                          <Lock className="w-4 h-4 text-blue-700" />
                        </div>
                        <span className="font-medium text-gray-900">
                          Change Password
                        </span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                    </button>

                    <button
                      onClick={handleLogout}
                      className="flex items-center justify-between w-full p-3 text-left hover:bg-gradient-to-r from-rose-50 to-rose-100/50 rounded-lg border border-rose-200 hover:border-rose-300 transition-all duration-300 group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-rose-100 to-rose-200 rounded-lg group-hover:scale-105 transition-transform">
                          <LogOut className="w-4 h-4 text-rose-700" />
                        </div>
                        <span className="font-medium text-gray-900">
                          Logout Account
                        </span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-rose-600 group-hover:translate-x-1 transition-all" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Teaching Stats */}
              <div className="bg-gradient-to-br from-amber-50 to-amber-100/30 rounded-2xl p-6 border border-amber-200 shadow-sm">
                <h3 className="font-semibold text-amber-900 mb-6 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Teaching Analytics
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-white/50 rounded-lg border border-amber-200/50">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gradient-to-br from-amber-100 to-amber-200 rounded-lg">
                        <BookOpen className="w-4 h-4 text-amber-700" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Total Lectures</p>
                        <p className="text-lg font-bold text-gray-900">
                          {stats.totalLectures}
                        </p>
                      </div>
                    </div>
                    <div className="text-xs text-amber-700 bg-amber-100 px-2 py-1 rounded-full">
                      per week
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-white/50 rounded-lg border border-amber-200/50">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-lg">
                        <Calendar className="w-4 h-4 text-emerald-700" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Teaching Days</p>
                        <p className="text-lg font-bold text-gray-900">
                          {stats.daysPerWeek}/6
                        </p>
                      </div>
                    </div>
                    <div className="text-xs text-emerald-700 bg-emerald-100 px-2 py-1 rounded-full">
                      {stats.daysPerWeek === 6
                        ? "Full week"
                        : `${6 - stats.daysPerWeek} free days`}
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-white/50 rounded-lg border border-amber-200/50">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg">
                        <GraduationCap className="w-4 h-4 text-blue-700" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Branches</p>
                        <p className="text-lg font-bold text-gray-900">
                          {stats.classesAssigned.size}
                        </p>
                      </div>
                    </div>
                    <div className="text-xs text-blue-700 bg-blue-100 px-2 py-1 rounded-full">
                      {stats.subjectsAssigned.size} subjects
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Timetable and Forms */}
            <div className="lg:col-span-2 space-y-6">
              {/* Timetable Card */}
              <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">
                      Weekly Teaching Schedule
                    </h2>
                    <p className="text-gray-600">
                      Academic Year: {new Date().getFullYear()}-
                      {new Date().getFullYear() + 1}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => fetchFacultyData(false)}
                      disabled={isRefreshing}
                      className="p-2 hover:bg-gradient-to-r from-amber-50 to-amber-100/50 rounded-lg border border-amber-200 hover:border-amber-300 transition-all duration-300"
                      title="Refresh"
                    >
                      <RefreshCw
                        className={`w-5 h-5 text-amber-600 ${
                          isRefreshing ? "animate-spin" : ""
                        }`}
                      />
                    </button>
                    <button
                      onClick={printTimetable}
                      className="px-3 py-1.5 bg-gradient-to-r from-gray-100 to-gray-50 text-gray-700 rounded-lg text-sm font-medium flex items-center gap-2 hover:from-gray-200 hover:to-gray-100 transition-all duration-300 border border-gray-200"
                    >
                      <Printer className="w-4 h-4" />
                      Print
                    </button>
                    <button
                      onClick={exportTimetable}
                      className="px-3 py-1.5 bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 hover:from-amber-700 hover:to-amber-800 transition-all duration-300 shadow-sm hover:shadow-md"
                    >
                      <Download className="w-4 h-4" />
                      Export
                    </button>
                  </div>
                </div>

                <TimetableTable
                  timetable={faculty.timetable || {}}
                  showEmptySlots={showEmptySlots}
                  facultyName={faculty.name}
                  onToggleEmptySlots={() => setShowEmptySlots(!showEmptySlots)}
                  printMode={false}
                />
              </div>

              {/* Forms Section */}
              <div className="space-y-6">
                {/* Telegram Form */}
                {isEditingTelegram && (
                  <div className="bg-gradient-to-r from-emerald-50 to-emerald-100/30 rounded-2xl p-6 border border-emerald-200 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-emerald-600" />
                        Telegram Notification Setup
                      </h3>
                      <button
                        onClick={() => setIsEditingTelegram(false)}
                        className="p-1 hover:bg-white/50 rounded-lg transition-colors"
                      >
                        <X className="w-5 h-5 text-gray-400" />
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Telegram Chat ID
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gradient-to-r from-emerald-100 to-emerald-200 text-emerald-800">
                            Required for notifications
                          </span>
                        </label>
                        <input
                          type="text"
                          value={telegramForm.chatId}
                          onChange={(e) =>
                            setTelegramForm((prev) => ({
                              ...prev,
                              chatId: e.target.value,
                            }))
                          }
                          className="w-full px-4 py-2.5 bg-white border border-gray-300 text-gray-900 placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all shadow-sm"
                          placeholder="Enter your Telegram Chat ID (e.g., 123456789)"
                        />
                        <div className="mt-3 space-y-2">
                          <p className="text-sm font-medium text-gray-700">
                            How to get your Chat ID:
                          </p>
                          <ol className="text-sm text-gray-600 ml-4 list-decimal space-y-1">
                            <li>
                              Click this link:
                              <a
                                href="https://t.me/sister_saira_bot?start=123"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="ml-1 text-emerald-600 hover:text-emerald-800 hover:underline font-medium"
                              >
                                https://t.me/sister_saira_bot?start
                              </a>
                            </li>
                            <li>
                              Send{" "}
                              <code className="bg-white px-2 py-0.5 rounded border border-emerald-200 text-emerald-700">
                                /start
                              </code>{" "}
                              command to the bot
                            </li>
                            <li>Copy the Chat ID provided by the bot</li>
                            <li>Paste it in the field above</li>
                          </ol>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 pt-4 border-t border-emerald-200/50">
                        <button
                          onClick={handleUpdateTelegram}
                          disabled={isSaving}
                          className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-lg font-medium hover:from-emerald-700 hover:to-emerald-800 transition-all duration-300 shadow-sm hover:shadow-md flex items-center gap-2 group"
                        >
                          {isSaving ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="w-4 h-4 group-hover:scale-110 transition-transform" />
                              Update Chat ID
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => {
                            setIsEditingTelegram(false);
                            setTelegramForm({
                              chatId: faculty.telegram_chat_id || "",
                            });
                          }}
                          className="px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100/50 transition-all duration-300"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Password Form */}
                {isEditingPassword && (
                  <div className="bg-gradient-to-r from-blue-50 to-blue-100/30 rounded-2xl p-6 border border-blue-200 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                        <Lock className="w-5 h-5 text-blue-600" />
                        Change Password
                      </h3>
                      <button
                        onClick={() => setIsEditingPassword(false)}
                        className="p-1 hover:bg-white/50 rounded-lg transition-colors"
                      >
                        <X className="w-5 h-5 text-gray-400" />
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Current Password
                        </label>
                        <div className="relative">
                          <input
                            type={showPassword ? "text" : "password"}
                            value={passwordForm.currentPassword}
                            onChange={(e) =>
                              setPasswordForm((prev) => ({
                                ...prev,
                                currentPassword: e.target.value,
                              }))
                            }
                            className="w-full px-4 py-2.5 bg-white border border-gray-300 text-gray-900 placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm pr-10"
                            placeholder="Enter current password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-blue-600"
                          >
                            {showPassword ? (
                              <EyeOff className="w-5 h-5" />
                            ) : (
                              <Eye className="w-5 h-5" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          New Password
                        </label>
                        <div className="relative">
                          <input
                            type={showPassword ? "text" : "password"}
                            value={passwordForm.newPassword}
                            onChange={(e) =>
                              setPasswordForm((prev) => ({
                                ...prev,
                                newPassword: e.target.value,
                              }))
                            }
                            className="w-full px-4 py-2.5 bg-white border border-gray-300 text-gray-900 placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm pr-10"
                            placeholder="Enter new password (min 6 characters)"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Confirm New Password
                        </label>
                        <div className="relative">
                          <input
                            type={showPassword ? "text" : "password"}
                            value={passwordForm.confirmPassword}
                            onChange={(e) =>
                              setPasswordForm((prev) => ({
                                ...prev,
                                confirmPassword: e.target.value,
                              }))
                            }
                            className="w-full px-4 py-2.5 bg-white border border-gray-300 text-gray-900 placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm pr-10"
                            placeholder="Confirm new password"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-blue-200/50">
                        <button
                          onClick={() => setShowPassword(!showPassword)}
                          className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 transition-colors"
                        >
                          {showPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                          {showPassword ? "Hide" : "Show"} passwords
                        </button>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={handleChangePassword}
                            disabled={isSaving}
                            className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-sm hover:shadow-md flex items-center gap-2 group"
                          >
                            {isSaving ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Updating...
                              </>
                            ) : (
                              <>
                                <Save className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                Change Password
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => {
                              setIsEditingPassword(false);
                              setPasswordForm({
                                currentPassword: "",
                                newPassword: "",
                                confirmPassword: "",
                              });
                            }}
                            className="px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100/50 transition-all duration-300"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Print Styles */}
          <style jsx global>{`
            @media print {
              @page {
                margin: 0.5in;
              }

              body {
                background: white !important;
                font-size: 12px !important;
              }

              .print\\:hidden {
                display: none !important;
              }

              .print\\:max-w-none {
                max-width: none !important;
                margin: 0 !important;
              }

              .print\\:rounded-none {
                border-radius: 0 !important;
              }

              .print\\:border-0 {
                border: 0 !important;
              }

              .print\\:shadow-none {
                box-shadow: none !important;
              }

              table {
                page-break-inside: auto !important;
              }

              tr {
                page-break-inside: avoid !important;
                page-break-after: auto !important;
              }

              td,
              th {
                border: 1px solid #d1d5db !important;
              }
            }
          `}</style>
        </div>
      </div>
    </div>
  );
}