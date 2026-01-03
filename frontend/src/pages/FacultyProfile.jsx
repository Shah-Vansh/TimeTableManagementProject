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
  Notebook,
  Bookmark,
  ClipboardList,
  PenTool,
  GraduationCap,
  BarChart3,
  Shield,
  Bell,
  Key,
  FileText,
  CalendarDays,
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
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-rose-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-amber-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading faculty profile...</p>
        </div>
      </div>
    );
  }

  if (!faculty) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-rose-50 flex items-center justify-center">
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
            className="px-6 py-3 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700 transition-colors flex items-center gap-2 mx-auto"
          >
            <ArrowLeft className="w-4 h-4" />
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
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-rose-50 p-4 md:p-6 print:p-0">
      {/* Decorative Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none print:hidden">
        <div className="absolute top-20 right-10 w-72 h-72 bg-gradient-to-br from-amber-100 to-transparent rounded-full opacity-40"></div>
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-gradient-to-tr from-rose-100 to-transparent rounded-full opacity-30"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full h-64 bg-gradient-to-r from-transparent via-amber-50/20 to-transparent"></div>
        <div className="absolute top-40 left-20 w-24 h-24 border-4 border-amber-200/40 border-dashed rounded-lg rotate-12"></div>
        <div className="absolute bottom-40 right-20 w-16 h-16 border-2 border-rose-200/40 border-dotted rounded-full"></div>
      </div>

      {/* Alert Component */}
      {alert && (
        <Alert
          main={alert.main}
          info={alert.info}
          type={alert.type}
          onClose={() => setAlert(null)}
        />
      )}

      <div className="relative z-10 max-w-7xl mx-auto print:max-w-none">
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
            <button
              onClick={() => navigate("/dashboard")}
              className="hover:text-gray-700 cursor-pointer flex items-center gap-1"
            >
              <Notebook className="w-3 h-3" />
              Academic
            </button>
            <ChevronRight className="w-4 h-4 mx-2" />
            <span className="font-medium text-amber-600 flex items-center gap-1">
              <ClipboardList className="w-4 h-4" />
              {faculty.name}'s Profile
            </span>
          </div>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-8 print:mb-4 print:pt-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 bg-white rounded-xl shadow-sm border border-gray-100 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-100 to-transparent opacity-60"></div>
                <div className="relative">
                  <User className="w-6 h-6 text-amber-600" />
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2 print:text-2xl">
                  Faculty Profile
                </h1>
                <p className="text-gray-600 print:text-sm">
                  {faculty.isAdmin ? "Administrator" : "Faculty Member"} • ID:{" "}
                  {faculty._id?.substring(0, 8) || "N/A"}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 print:hidden">
            <div className="p-3 bg-white rounded-xl border border-gray-200 shadow-sm">
              <User className="w-6 h-6 text-amber-600" />
            </div>
          </div>
        </div>

        {/* Profile Overview Card */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm mb-8 print:rounded-none print:border-0 print:shadow-none print:p-0">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Profile Info */}
            <div className="flex-1">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 bg-gradient-to-br from-amber-500 to-amber-600 rounded-full flex items-center justify-center">
                    <span className="text-2xl font-bold text-white">
                      {faculty.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {faculty.name}
                    </h2>
                    <div className="flex items-center gap-2 mt-2">
                      <div
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          faculty.isAdmin
                            ? "bg-gradient-to-r from-purple-100 to-purple-200 text-purple-700 border border-purple-200"
                            : "bg-gradient-to-r from-amber-100 to-amber-200 text-amber-700 border border-amber-200"
                        }`}
                      >
                        {faculty.isAdmin ? "Administrator" : "Faculty Member"}
                      </div>
                      <div className="text-sm text-gray-500">
                        ID: {faculty._id?.substring(0, 8) || "N/A"}
                      </div>
                    </div>

                    {/* Telegram Chat ID Display */}
                    {faculty.telegram_chat_id ? (
                      <div className="flex items-center gap-2 mt-2">
                        <MessageSquare className="w-4 h-4 text-emerald-600" />
                        <span className="text-sm text-gray-700">
                          Telegram: {faculty.telegram_chat_id}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 mt-2">
                        <MessageSquare className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-500">
                          Telegram Chat ID not set
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 print:hidden">
                  <button
                    onClick={() => fetchFacultyData(false)}
                    disabled={isRefreshing}
                    className="p-2 hover:bg-amber-50 rounded-lg transition-colors border border-amber-200"
                    title="Refresh"
                  >
                    <RefreshCw
                      className={`w-5 h-5 text-amber-600 ${
                        isRefreshing ? "animate-spin" : ""
                      }`}
                    />
                  </button>
                  <button
                    onClick={() => setIsEditingTelegram(!isEditingTelegram)}
                    className="p-2 hover:bg-emerald-50 rounded-lg transition-colors border border-emerald-200"
                    title={
                      isEditingTelegram
                        ? "Cancel Telegram Update"
                        : "Update Telegram"
                    }
                  >
                    {isEditingTelegram ? (
                      <X className="w-5 h-5 text-gray-600" />
                    ) : (
                      <MessageSquare className="w-5 h-5 text-emerald-600" />
                    )}
                  </button>
                  <button
                    onClick={() => setIsEditingPassword(!isEditingPassword)}
                    className="p-2 hover:bg-amber-50 rounded-lg transition-colors border border-amber-200"
                    title={
                      isEditingPassword
                        ? "Cancel Password Change"
                        : "Change Password"
                    }
                  >
                    {isEditingPassword ? (
                      <X className="w-5 h-5 text-gray-600" />
                    ) : (
                      <Lock className="w-5 h-5 text-amber-600" />
                    )}
                  </button>
                  <button
                    onClick={handleLogout}
                    className="p-2 hover:bg-rose-50 rounded-lg transition-colors border border-rose-200"
                    title="Logout"
                  >
                    <LogOut className="w-5 h-5 text-rose-600" />
                  </button>
                </div>
              </div>

              {/* Telegram Chat ID Update Form */}
              {isEditingTelegram && (
                <div className="mb-6 p-4 bg-gradient-to-r from-emerald-50 to-emerald-100 rounded-lg border border-emerald-200 print:hidden">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-emerald-600" />
                    Update Telegram Chat ID
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Telegram Chat ID
                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        placeholder="Enter your Telegram Chat ID (e.g., 123456789)"
                      />
                      <div className="mt-2 space-y-1">
                        <p className="text-xs text-gray-600">
                          <span className="font-medium">
                            How to get your Chat ID:
                          </span>
                        </p>
                        <ol className="text-xs text-gray-600 ml-4 list-decimal space-y-1">
                          <li>
                            Click this link:
                            <a
                              href="https://t.me/sister_saira_bot?start=123"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ml-1 text-amber-600 hover:text-amber-800 hover:underline font-medium"
                            >
                              https://t.me/sister_saira_bot?start
                            </a>
                          </li>
                          <li>
                            Send{" "}
                            <code className="bg-gray-100 px-1 rounded border border-gray-200">
                              /start
                            </code>{" "}
                            command to the bot
                          </li>
                          <li>Copy the Chat ID provided by the bot</li>
                          <li>Paste it in the field above</li>
                        </ol>
                        <p className="text-xs text-gray-500 mt-2">
                          You'll receive timetable notifications and updates
                          directly on Telegram
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 pt-2">
                      <button
                        onClick={handleUpdateTelegram}
                        disabled={isSaving}
                        className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-lg font-medium hover:from-emerald-700 hover:to-emerald-800 transition-all duration-300 flex items-center gap-2 shadow-sm hover:shadow-md"
                      >
                        {isSaving ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4" />
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
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors shadow-sm hover:shadow"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Password Change Form */}
              {isEditingPassword && (
                <div className="mb-6 p-4 bg-gradient-to-r from-amber-50 to-amber-100 rounded-lg border border-amber-200 print:hidden">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Lock className="w-5 h-5 text-amber-600" />
                    Change Password
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Current Password
                      </label>
                      <input
                        type={showPassword ? "text" : "password"}
                        value={passwordForm.currentPassword}
                        onChange={(e) =>
                          setPasswordForm((prev) => ({
                            ...prev,
                            currentPassword: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                        placeholder="Enter current password"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        New Password
                      </label>
                      <input
                        type={showPassword ? "text" : "password"}
                        value={passwordForm.newPassword}
                        onChange={(e) =>
                          setPasswordForm((prev) => ({
                            ...prev,
                            newPassword: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                        placeholder="Enter new password (min 6 characters)"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Confirm New Password
                      </label>
                      <input
                        type={showPassword ? "text" : "password"}
                        value={passwordForm.confirmPassword}
                        onChange={(e) =>
                          setPasswordForm((prev) => ({
                            ...prev,
                            confirmPassword: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                        placeholder="Confirm new password"
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setShowPassword(!showPassword)}
                        className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800"
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                        {showPassword ? "Hide" : "Show"} passwords
                      </button>
                    </div>
                    <div className="flex items-center gap-3 pt-2">
                      <button
                        onClick={handleChangePassword}
                        disabled={isSaving}
                        className="px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-lg font-medium hover:from-amber-700 hover:to-amber-800 transition-all duration-300 shadow-sm hover:shadow-md flex items-center gap-2"
                      >
                        {isSaving ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4" />
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
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors shadow-sm hover:shadow"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Statistics Sidebar */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 print:hidden">
                <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-4 border border-amber-200 relative overflow-hidden group hover:shadow-md transition-shadow duration-300">
                  <div className="absolute -right-6 -top-6 w-24 h-24 bg-gradient-to-br from-amber-100 to-transparent rounded-full opacity-60 group-hover:opacity-80 transition-opacity"></div>
                  <div className="relative">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-amber-800">Total Lectures</p>
                      <BookOpen className="w-5 h-5 text-amber-600" />
                    </div>
                    <p className="text-2xl font-bold text-amber-900">
                      {stats.totalLectures}
                    </p>
                    <p className="text-xs text-amber-700 mt-1">
                      {stats.totalLectures} teaching hours per week
                    </p>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-4 border border-emerald-200 relative overflow-hidden group hover:shadow-md transition-shadow duration-300">
                  <div className="absolute -right-6 -top-6 w-24 h-24 bg-gradient-to-br from-emerald-100 to-transparent rounded-full opacity-60 group-hover:opacity-80 transition-opacity"></div>
                  <div className="relative">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-emerald-800">Teaching Days</p>
                      <CalendarDays className="w-5 h-5 text-emerald-600" />
                    </div>
                    <p className="text-2xl font-bold text-emerald-900">
                      {stats.daysPerWeek}/6
                    </p>
                    <p className="text-xs text-emerald-700 mt-1">
                      {stats.daysPerWeek === 6
                        ? "Full week"
                        : `${6 - stats.daysPerWeek} free days`}
                    </p>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-rose-50 to-rose-100 rounded-xl p-4 border border-rose-200 relative overflow-hidden group hover:shadow-md transition-shadow duration-300">
                  <div className="absolute -right-6 -top-6 w-24 h-24 bg-gradient-to-br from-rose-100 to-transparent rounded-full opacity-60 group-hover:opacity-80 transition-opacity"></div>
                  <div className="relative">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-rose-800">Branches Teaching</p>
                      <GraduationCap className="w-5 h-5 text-rose-600" />
                    </div>
                    <p className="text-2xl font-bold text-rose-900">
                      {stats.classesAssigned.size}
                    </p>
                    <p className="text-xs text-rose-700 mt-1">
                      {stats.subjectsAssigned.size} subjects/semesters
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Timetable Section - Using Reusable Component */}
          <div className="mt-8 print:mt-0">
            <div className="flex items-center justify-between mb-6 print:hidden">
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  Weekly Timetable
                </h2>
                <p className="text-gray-600">
                  Academic Year: {new Date().getFullYear()}-
                  {new Date().getFullYear() + 1}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={printTimetable}
                  className="px-3 py-1.5 bg-gradient-to-r from-amber-100 to-amber-50 text-amber-700 rounded-lg text-sm font-medium flex items-center gap-2 hover:from-amber-200 hover:to-amber-100 transition-all duration-300 shadow-sm hover:shadow border border-amber-200"
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
        </div>

        {/* Quick Actions (Non-Print) */}
        <div className="print:hidden">
          <div className="bg-gradient-to-r from-amber-50 to-rose-50 rounded-2xl p-6 border-2 border-amber-200 mb-8 relative overflow-hidden">
            <div className="absolute top-4 right-4">
              <PenTool className="w-8 h-8 text-amber-400/40" />
            </div>
            <h3 className="font-semibold text-amber-900 mb-4 flex items-center gap-2">
              <div className="p-2 bg-gradient-to-br from-amber-100 to-amber-200 rounded-lg">
                <BarChart3 className="w-5 h-5 text-amber-700" />
              </div>
              Quick Actions
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => setIsEditingTelegram(true)}
                className="bg-white border border-emerald-200 rounded-lg p-4 text-left hover:bg-emerald-50 transition-colors shadow-sm hover:shadow-md group"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-lg border border-emerald-200">
                    <MessageSquare className="w-5 h-5 text-emerald-600" />
                  </div>
                  <h4 className="font-medium text-gray-900">Update Telegram</h4>
                </div>
                <p className="text-sm text-gray-600">
                  Set your Telegram Chat ID for notifications
                </p>
              </button>

              <button
                onClick={() => setIsEditingPassword(true)}
                className="bg-white border border-amber-200 rounded-lg p-4 text-left hover:bg-amber-50 transition-colors shadow-sm hover:shadow-md group"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-gradient-to-br from-amber-100 to-amber-200 rounded-lg border border-amber-200">
                    <Lock className="w-5 h-5 text-amber-600" />
                  </div>
                  <h4 className="font-medium text-gray-900">Change Password</h4>
                </div>
                <p className="text-sm text-gray-600">
                  Update your account password
                </p>
              </button>

              <button
                onClick={exportTimetable}
                className="bg-white border border-amber-200 rounded-lg p-4 text-left hover:bg-amber-50 transition-colors shadow-sm hover:shadow-md group"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-gradient-to-br from-amber-100 to-amber-200 rounded-lg border border-amber-200">
                    <Download className="w-5 h-5 text-amber-600" />
                  </div>
                  <h4 className="font-medium text-gray-900">
                    Export Timetable
                  </h4>
                </div>
                <p className="text-sm text-gray-600">
                  Download your timetable as a text file
                </p>
              </button>
            </div>
          </div>

          {/* Guide Section */}
          <div className="bg-gradient-to-r from-amber-50 to-rose-50 rounded-2xl p-8 border-2 border-amber-200 relative overflow-hidden print:hidden">
            <div className="absolute top-4 right-4">
              <Bookmark className="w-8 h-8 text-amber-400/40" />
            </div>
            <div className="relative">
              <h3 className="font-bold text-amber-900 mb-6 flex items-center gap-3 text-lg">
                <div className="p-2 bg-gradient-to-br from-amber-100 to-amber-200 rounded-lg">
                  <Shield className="w-5 h-5 text-amber-700" />
                </div>
                Profile Management Guide
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center border border-amber-200">
                      <span className="text-xs font-bold text-amber-700">
                        1
                      </span>
                    </div>
                    <h4 className="font-semibold text-amber-800">
                      Telegram Setup
                    </h4>
                  </div>
                  <p className="text-amber-700 text-sm leading-relaxed">
                    Set up your Telegram Chat ID to receive real-time
                    notifications about timetable changes and important updates
                    directly on your phone.
                  </p>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-rose-100 to-rose-200 flex items-center justify-center border border-rose-200">
                      <span className="text-xs font-bold text-rose-700">2</span>
                    </div>
                    <h4 className="font-semibold text-rose-800">
                      Password Security
                    </h4>
                  </div>
                  <p className="text-rose-700 text-sm leading-relaxed">
                    Regularly update your password with a strong combination of
                    letters, numbers, and symbols to keep your account secure.
                  </p>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-100 to-emerald-200 flex items-center justify-center border border-emerald-200">
                      <span className="text-xs font-bold text-emerald-700">
                        3
                      </span>
                    </div>
                    <h4 className="font-semibold text-emerald-800">
                      Export & Print
                    </h4>
                  </div>
                  <p className="text-emerald-700 text-sm leading-relaxed">
                    Export your timetable as a text file or print it directly
                    from the browser for offline reference or sharing with
                    colleagues.
                  </p>
                </div>
              </div>
            </div>
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
  );
}