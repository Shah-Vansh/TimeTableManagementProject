import React, { useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  Users,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Filter,
  X,
  ChevronDown,
  ChevronUp,
  User,
  Bell,
  CalendarDays,
  Eye,
  Search,
  AlertTriangle,
  Info,
  Calendar as CalendarIcon,
  Folder,
  Trash2,
  Bookmark,
  ChevronRight,
  Notebook,
  ClipboardList,
  PenTool,
  Layers,
  TrendingUp,
  BookOpen,
  Highlighter,
  StickyNote,
  Download,
  Upload,
  Plus,
} from "lucide-react";
import api from "../configs/api";
import Alert from "../components/Alert";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export default function ViewChanges() {
  const [changes, setChanges] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [groupBy, setGroupBy] = useState("date"); // "date" or "class"
  const [dateFilter, setDateFilter] = useState("all"); // "all", "today", "yesterday", "tomorrow", "specific"
  const [specificDate, setSpecificDate] = useState(null); // Changed from string to null
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedGroup, setExpandedGroup] = useState({});
  const [allChanges, setAllChanges] = useState([]);
  const [deletingId, setDeletingId] = useState(null);
  const [alert, setAlert] = useState(null);

  // Grouping options
  const GROUP_OPTIONS = [
    { id: "date", label: "Group by Date", icon: CalendarIcon, color: "amber" },
    { id: "class", label: "Group by Class", icon: Folder, color: "blue" },
  ];

  const DATE_OPTIONS = [
    { id: "all", label: "All Dates", color: "gray" },
    { id: "today", label: "Today", color: "emerald" },
    { id: "yesterday", label: "Yesterday", color: "amber" },
    { id: "tomorrow", label: "Tomorrow", color: "blue" },
    { id: "specific", label: "Specific Date", color: "violet" },
  ];

  //token declared
  const token = localStorage.getItem("token");

  // Show alert message
  const showAlert = (main, info, type) => {
    setAlert({ main, info, type });
    setTimeout(() => setAlert(null), 5000);
  };

  const fetchChanges = async () => {
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await api.get("/api/fetch-all-changes", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.changes) {
        setChanges(response.data.changes);

        // Flatten all changes into a single array
        const flattenedChanges = flattenChanges(response.data.changes);
        setAllChanges(flattenedChanges);

        // Show success message using Alert component
        showAlert(
          "Study schedule updates loaded",
          `${flattenedChanges.length} temporary schedule updates found`,
          "success"
        );
      } else {
        showAlert(
          "No schedule updates found",
          "No temporary schedule adjustments found",
          "error"
        );
      }
    } catch (err) {
      console.error("Error fetching changes:", err);
      const message =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "Something went wrong";
      showAlert(
        "Failed to fetch schedule updates",
        message || "Please try again",
        "error"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const flattenChanges = (changesData) => {
    const flattened = [];

    if (!changesData) return flattened;

    // Days from the original structure
    const DAYS = [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];

    const TIME_SLOTS = [
      { key: "Time Slot 1", label: "9:00 AM - 10:00 AM" },
      { key: "Time Slot 2", label: "10:00 AM - 11:00 AM" },
      { key: "Time Slot 3", label: "11:45 AM - 12:45 PM" },
      { key: "Time Slot 4", label: "12:45 PM - 1:45 PM" },
      { key: "Time Slot 5", label: "2:00 PM - 3:00 PM" },
    ];

    DAYS.forEach((day) => {
      TIME_SLOTS.forEach((slot) => {
        const slotChanges = changesData[day]?.[slot.key] || [];
        slotChanges.forEach((change) => {
          flattened.push({
            ...change,
            day,
            timeSlot: slot.label,
            timeSlotKey: slot.key,
            originalDay: day,
          });
        });
      });
    });

    return flattened;
  };

  const parseAssignedTo = (assignedTo) => {
    if (!assignedTo) return { branch: "", class: "", sem: "", timeSlot: "" };

    const parts = assignedTo.split("-");
    if (parts.length < 4)
      return { branch: "", class: "", sem: "", timeSlot: "" };

    return {
      branch: parts[0],
      className: parts[1],
      sem: parts[2],
      timeSlot: parts[3],
      fullClass: `${parts[0]}-${parts[1]}-${parts[2]}`,
    };
  };

  const getDateInfo = () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return {
      today: today.toISOString().split("T")[0],
      yesterday: yesterday.toISOString().split("T")[0],
      tomorrow: tomorrow.toISOString().split("T")[0],
    };
  };

  const handleDeleteChange = async (change) => {
    if (
      !window.confirm(
        "Are you sure you want to remove this schedule adjustment?"
      )
    ) {
      return;
    }

    setDeletingId(
      change._id || change.faculty + change.date + change.timeSlotKey
    );

    try {
      const response = await api.delete("/api/delete-temp-change", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        data: {
          faculty_id: change.faculty,
          date: change.date,
          day: change.day.toLowerCase().substring(0, 3), // Convert "Monday" to "mon"
          lec_no: change.lec_no,
          assigned_to: change.assigned_to,
        },
      });

      if (response.data.success) {
        // Show success message using Alert component
        showAlert(
          "Schedule adjustment removed",
          "Temporary schedule change has been cleared",
          "success"
        );

        // Remove from allChanges
        const updatedChanges = allChanges.filter(
          (c) =>
            !(
              c.faculty === change.faculty &&
              c.date === change.date &&
              c.timeSlotKey === change.timeSlotKey &&
              c.assigned_to === change.assigned_to
            )
        );

        setAllChanges(updatedChanges);

        // Also update the original changes structure
        fetchChanges();
      }
    } catch (err) {
      console.error("Error deleting change:", err);
      const message =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "Something went wrong";
      showAlert(
        "Failed to remove adjustment",
        message || "Please try again",
        "error"
      );
    } finally {
      setDeletingId(null);
    }
  };

  const filterAndGroupChanges = () => {
    const dateInfo = getDateInfo();

    // Filter changes
    let filtered = allChanges.filter((change) => {
      // Filter by date
      if (dateFilter !== "all") {
        let targetDate;
        switch (dateFilter) {
          case "today":
            targetDate = dateInfo.today;
            break;
          case "yesterday":
            targetDate = dateInfo.yesterday;
            break;
          case "tomorrow":
            targetDate = dateInfo.tomorrow;
            break;
          // In filterAndGroupChanges function, update the specific date filtering:
          case "specific":
            if (specificDate) {
              const targetDateStr = specificDate.toISOString().split("T")[0];
              if (change.date !== targetDateStr) return false;
            } else {
              return false; // Don't show anything if no date selected
            }
            break;
          default:
            return true;
        }

        if (change.date !== targetDate) return false;
      }

      // Filter by search term
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const classInfo = parseAssignedTo(change.assigned_to);
        return (
          change.faculty.toLowerCase().includes(searchLower) ||
          change.assigned_to?.toLowerCase().includes(searchLower) ||
          change.date?.includes(searchTerm) ||
          classInfo.fullClass.toLowerCase().includes(searchLower) ||
          classInfo.branch.toLowerCase().includes(searchLower) ||
          classInfo.className.toLowerCase().includes(searchLower) ||
          classInfo.sem.toLowerCase().includes(searchLower)
        );
      }

      return true;
    });

    // Group changes
    const grouped = {};

    if (groupBy === "date") {
      // Group by date
      filtered.forEach((change) => {
        const date = change.date || "Unknown Date";
        if (!grouped[date]) {
          grouped[date] = [];
        }
        grouped[date].push(change);
      });

      // Sort dates chronologically
      const sortedDates = Object.keys(grouped).sort();
      const sortedGrouped = {};
      sortedDates.forEach((date) => {
        sortedGrouped[date] = grouped[date];
      });
      return sortedGrouped;
    } else {
      // Group by class
      filtered.forEach((change) => {
        const classInfo = parseAssignedTo(change.assigned_to);
        const classKey = classInfo.fullClass || "Unknown Class";
        if (!grouped[classKey]) {
          grouped[classKey] = [];
        }
        grouped[classKey].push(change);
      });

      // Sort classes alphabetically
      const sortedClasses = Object.keys(grouped).sort();
      const sortedGrouped = {};
      sortedClasses.forEach((className) => {
        sortedGrouped[className] = grouped[className];
      });
      return sortedGrouped;
    }
  };

  const toggleGroup = (groupId) => {
    setExpandedGroup((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  const getDateDisplay = (dateStr) => {
  if (!dateStr) return "Unknown Date";
  
  const date = new Date(dateStr);
  
  // Check if date is valid
  if (isNaN(date.getTime())) return "Invalid Date";
  
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  // Reset time part for comparison
  const resetTime = (d) => {
    const newDate = new Date(d);
    newDate.setHours(0, 0, 0, 0);
    return newDate;
  };
  
  const dateReset = resetTime(date);
  const todayReset = resetTime(today);
  const yesterdayReset = resetTime(yesterday);
  const tomorrowReset = resetTime(tomorrow);
  
  let prefix = "";
  if (dateReset.getTime() === todayReset.getTime()) {
    prefix = "Today - ";
  } else if (dateReset.getTime() === yesterdayReset.getTime()) {
    prefix = "Yesterday - ";
  } else if (dateReset.getTime() === tomorrowReset.getTime()) {
    prefix = "Tomorrow - ";
  }
  
  const dateFormatted = date.toLocaleDateString('en-GB', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  return prefix + dateFormatted;
};

  const getClassDisplay = (classStr) => {
    if (!classStr || classStr === "Unknown Class") return "Unknown Class";

    const parts = classStr.split("-");
    if (parts.length >= 3) {
      return `${parts[0]}-${parts[1]} (${parts[2]})`;
    }
    return classStr;
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setDateFilter("all");
    setSpecificDate(null); // Changed from "" to null
  };

  useEffect(() => {
    fetchChanges();
  }, []);

  const groupedChanges = filterAndGroupChanges();
  const totalFilteredChanges = Object.values(groupedChanges).reduce(
    (total, group) => total + group.length,
    0
  );

  const getColorClasses = (color) => {
    const colorMap = {
      amber: {
        bg: "bg-amber-50",
        border: "border-amber-200",
        text: "text-amber-700",
        light: "bg-gradient-to-r from-amber-100 to-amber-50",
        ribbon: "bg-gradient-to-r from-amber-400 to-amber-300",
      },
      blue: {
        bg: "bg-blue-50",
        border: "border-blue-200",
        text: "text-blue-700",
        light: "bg-gradient-to-r from-blue-100 to-blue-50",
        ribbon: "bg-gradient-to-r from-blue-400 to-blue-300",
      },
      emerald: {
        bg: "bg-emerald-50",
        border: "border-emerald-200",
        text: "text-emerald-700",
        light: "bg-gradient-to-r from-emerald-100 to-emerald-50",
        ribbon: "bg-gradient-to-r from-emerald-400 to-emerald-300",
      },
      violet: {
        bg: "bg-violet-50",
        border: "border-violet-200",
        text: "text-violet-700",
        light: "bg-gradient-to-r from-violet-100 to-violet-50",
        ribbon: "bg-gradient-to-r from-violet-400 to-violet-300",
      },
      gray: {
        bg: "bg-gray-50",
        border: "border-gray-200",
        text: "text-gray-700",
        light: "bg-gradient-to-r from-gray-100 to-gray-50",
        ribbon: "bg-gradient-to-r from-gray-400 to-gray-300",
      },
    };
    return colorMap[color] || colorMap.amber;
  };

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
          <div className="mb-6">
            <div className="flex items-center text-sm text-gray-500 mb-4">
              <button
                onClick={() => window.history.back()}
                className="hover:text-gray-700 cursor-pointer flex items-center gap-1"
              >
                <Bookmark className="w-3 h-3" />
                Dashboard
              </button>
              <ChevronRight className="w-4 h-4 mx-2" />
              <span className="hover:text-gray-700 cursor-pointer flex items-center gap-1">
                <Notebook className="w-3 h-3" />
                Study Planner
              </span>
              <ChevronRight className="w-4 h-4 mx-2" />
              <span className="font-medium text-amber-600 flex items-center gap-1">
                <ClipboardList className="w-4 h-4" />
                Schedule Updates
              </span>
            </div>
          </div>

          {/* Header */}
          <div className="flex items-start justify-between mb-8">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 bg-white rounded-xl shadow-sm border border-gray-100 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-100 to-transparent opacity-60"></div>
                  <div className="relative">
                    <Bell className="w-6 h-6 text-amber-600" />
                  </div>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    Study Schedule Updates
                  </h1>
                  <p className="text-gray-600 mt-1">
                    Manage temporary adjustments to your study group schedules
                  </p>
                </div>
              </div>
            </div>
            <div className="p-2.5 bg-gradient-to-br from-amber-100 to-amber-50 rounded-xl border border-amber-200">
              <AlertTriangle className="w-6 h-6 text-amber-600" />
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300 relative overflow-hidden group">
              <div className="absolute -right-6 -top-6 w-24 h-24 bg-gradient-to-br from-amber-100 to-transparent rounded-full opacity-60 group-hover:opacity-80 transition-opacity"></div>
              <div className="relative">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Total Updates</p>
                    <p className="text-2xl font-bold text-gray-900 mb-2">
                      {allChanges.length}
                    </p>
                    <div className="flex items-center text-xs text-amber-600">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      <span>Active adjustments</span>
                    </div>
                  </div>
                  <div className="p-3 bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl border border-amber-200">
                    <Bell className="w-6 h-6 text-amber-600" />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300 relative overflow-hidden group">
              <div className="absolute -right-6 -top-6 w-24 h-24 bg-gradient-to-br from-emerald-100 to-transparent rounded-full opacity-60 group-hover:opacity-80 transition-opacity"></div>
              <div className="relative">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Showing Now</p>
                    <p className="text-2xl font-bold text-gray-900 mb-2">
                      {totalFilteredChanges}
                    </p>
                    <div className="flex items-center text-xs text-emerald-600">
                      <Filter className="w-3 h-3 mr-1" />
                      <span>With current filters</span>
                    </div>
                  </div>
                  <div className="p-3 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl border border-emerald-200">
                    <Eye className="w-6 h-6 text-emerald-600" />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300 relative overflow-hidden group">
              <div className="absolute -right-6 -top-6 w-24 h-24 bg-gradient-to-br from-blue-100 to-transparent rounded-full opacity-60 group-hover:opacity-80 transition-opacity"></div>
              <div className="relative">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Grouped By</p>
                    <p className="text-2xl font-bold text-gray-900 mb-2 capitalize">
                      {groupBy}
                    </p>
                    <div className="flex items-center text-xs text-blue-600">
                      <Layers className="w-3 h-3 mr-1" />
                      <span>{groupBy === "date" ? "Dates" : "Classes"}</span>
                    </div>
                  </div>
                  <div className="p-3 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                    <Folder className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300 relative overflow-hidden group">
              <div className="absolute -right-6 -top-6 w-24 h-24 bg-gradient-to-br from-rose-100 to-transparent rounded-full opacity-60 group-hover:opacity-80 transition-opacity"></div>
              <div className="relative">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">
                      Recent Activity
                    </p>
                    <p className="text-2xl font-bold text-gray-900 mb-2">
                      {new Date().getDate()}
                    </p>
                    <div className="flex items-center text-xs text-rose-600">
                      <CalendarDays className="w-3 h-3 mr-1" />
                      <span>
                        {new Date().toLocaleDateString("en-US", {
                          month: "short",
                        })}
                      </span>
                    </div>
                  </div>
                  <div className="p-3 bg-gradient-to-br from-rose-50 to-rose-100 rounded-xl border border-rose-200">
                    <PenTool className="w-6 h-6 text-rose-600" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Card */}
          <div className="bg-white rounded-2xl border-2 border-amber-200 shadow-sm overflow-hidden mb-8">
            {/* Header */}
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-amber-50 to-amber-100/50">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Highlighter className="w-5 h-5 text-amber-600" />
                    Study Schedule Adjustments
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Temporary changes to your study planner organized like
                    notebook tabs
                  </p>
                </div>
                <button
                  onClick={fetchChanges}
                  disabled={isLoading}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-lg hover:from-amber-700 hover:to-amber-800 transition-all duration-300 shadow-sm hover:shadow-md group"
                >
                  {isLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin group-hover:rotate-180 transition-transform" />
                  ) : (
                    <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform" />
                  )}
                  Refresh Updates
                </button>
              </div>
            </div>

            {/* Controls Section */}
            <div className="p-6 border-b border-gray-100">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Grouping Options */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-amber-600" />
                    Organize By
                  </label>
                  <div className="flex flex-wrap gap-3">
                    {GROUP_OPTIONS.map((option) => {
                      const colors = getColorClasses(option.color);
                      const isActive = groupBy === option.id;
                      return (
                        <button
                          key={option.id}
                          onClick={() => setGroupBy(option.id)}
                          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all duration-300 ${
                            isActive
                              ? `${colors.light} text-gray-900 border-2 ${colors.border} shadow-sm`
                              : "bg-gradient-to-r from-gray-100 to-gray-50 text-gray-700 hover:from-gray-200 hover:to-gray-100 border border-gray-200"
                          }`}
                        >
                          <option.icon className="w-4 h-4" />
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Date Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                    <CalendarDays className="w-4 h-4 text-blue-600" />
                    Filter Dates
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {DATE_OPTIONS.map((option) => {
                      const colors = getColorClasses(option.color);
                      const isActive = dateFilter === option.id;
                      return (
                        <button
                          key={option.id}
                          onClick={() => setDateFilter(option.id)}
                          className={`px-4 py-2.5 rounded-lg font-medium transition-all duration-300 ${
                            isActive
                              ? `${colors.light} text-gray-900 border-2 ${colors.border} shadow-sm`
                              : "bg-gradient-to-r from-gray-100 to-gray-50 text-gray-700 hover:from-gray-200 hover:to-gray-100 border border-gray-200"
                          }`}
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>

                  {dateFilter === "specific" && (
                    <div className="mt-4">
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 z-10 pointer-events-none" />
                        <DatePicker
                          selected={specificDate}
                          onChange={(date) => setSpecificDate(date)}
                          dateFormat="dd/MM/yyyy"
                          placeholderText="Select a date"
                          className="w-full pl-10 pr-3 py-2.5 bg-white border border-gray-300 text-gray-900 placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all shadow-sm"
                          isClearable
                          clearButtonClassName="text-gray-400 hover:text-gray-600"
                          showPopperArrow={false}
                          popperPlacement="bottom-start"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Search Bar */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Search className="w-4 h-4 text-gray-400" />
                  Search Adjustments
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by tutor, study group, date, or notes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 bg-white border border-gray-300 text-gray-900 placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all shadow-sm"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <button
                  onClick={handleClearFilters}
                  className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 font-medium hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100/50 rounded-lg transition-all duration-300 group"
                >
                  <X className="w-4 h-4 group-hover:rotate-90 transition-transform" />
                  Clear All Filters
                </button>
                <div className="text-sm text-gray-500 flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  Showing {totalFilteredChanges} schedule adjustments
                </div>
              </div>
            </div>

            {/* Changes Display */}
            <div className="p-6">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="relative inline-block">
                      <div className="w-16 h-16 border-4 border-amber-200 border-t-amber-600 rounded-full animate-spin"></div>
                      <RefreshCw className="w-8 h-8 text-amber-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-spin" />
                    </div>
                    <p className="text-gray-600 mt-4">
                      Loading schedule updates...
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.keys(groupedChanges).length > 0 ? (
                    Object.entries(groupedChanges).map(
                      ([groupKey, groupChanges]) => {
                        const isExpanded = expandedGroup[groupKey];
                        const groupLabel =
                          groupBy === "date"
                            ? getDateDisplay(groupKey)
                            : getClassDisplay(groupKey);
                        const colors = getColorClasses(
                          groupBy === "date" ? "amber" : "blue"
                        );

                        return (
                          <div
                            key={groupKey}
                            className={`border-2 ${colors.border} rounded-xl overflow-hidden group hover:border-amber-400 transition-all duration-300`}
                          >
                            {/* Notebook Spine Effect */}
                            <div
                              className={`absolute left-0 top-0 bottom-0 w-3 ${colors.ribbon}`}
                            ></div>

                            {/* Group Header */}
                            <button
                              onClick={() => toggleGroup(groupKey)}
                              className="w-full p-6 bg-gradient-to-r from-gray-50 to-gray-100/50 hover:from-gray-100 hover:to-gray-200/50 flex items-center justify-between transition-all relative overflow-hidden"
                            >
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>

                              <div className="flex items-center gap-4 relative">
                                <div className="p-2.5 bg-white rounded-lg border border-gray-200 shadow-sm">
                                  {groupBy === "date" ? (
                                    <Calendar className="w-5 h-5 text-amber-600" />
                                  ) : (
                                    <Folder className="w-5 h-5 text-blue-600" />
                                  )}
                                </div>
                                <div className="text-left">
                                  <h3 className="font-semibold text-gray-900 text-lg">
                                    {groupLabel}
                                  </h3>
                                  <p className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                                    <StickyNote className="w-3 h-3" />
                                    {groupChanges.length} schedule adjustment
                                    {groupChanges.length !== 1 ? "s" : ""}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3 relative">
                                <span
                                  className={`px-3 py-1.5 ${colors.bg} ${colors.text} rounded-full text-xs font-medium border ${colors.border}`}
                                >
                                  {groupChanges.length} updates
                                </span>
                                {isExpanded ? (
                                  <ChevronUp className="w-5 h-5 text-gray-500 group-hover:text-amber-600 transition-colors" />
                                ) : (
                                  <ChevronDown className="w-5 h-5 text-gray-500 group-hover:text-amber-600 transition-colors" />
                                )}
                              </div>
                            </button>

                            {/* Expanded Content */}
                            {isExpanded && (
                              <div className="p-6 border-t border-gray-200 bg-white">
                                <div className="space-y-4">
                                  {groupChanges.map((change, index) => {
                                    const classInfo = parseAssignedTo(
                                      change.assigned_to
                                    );
                                    const isDeleting =
                                      deletingId ===
                                      (change._id ||
                                        change.faculty +
                                          change.date +
                                          change.timeSlotKey);

                                    return (
                                      <div
                                        key={index}
                                        className="p-6 border-2 border-gray-200 rounded-xl hover:border-amber-300 transition-all duration-300 relative overflow-hidden group/item"
                                      >
                                        {/* Subtle notebook lines background */}
                                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-transparent"></div>

                                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative">
                                          {/* Left Column - Tutor & Date Info */}
                                          <div className="space-y-4">
                                            <div className="flex items-center gap-3">
                                              <div className="p-2.5 bg-gradient-to-br from-amber-100 to-amber-50 rounded-lg border border-amber-200">
                                                <User className="w-4 h-4 text-amber-600" />
                                              </div>
                                              <div>
                                                <p className="text-xs text-gray-500">
                                                  Tutor ID
                                                </p>
                                                <p className="font-semibold text-gray-900">
                                                  {change.faculty}
                                                </p>
                                              </div>
                                            </div>

                                            <div className="flex items-center gap-3">
                                              <div className="p-2.5 bg-gradient-to-br from-blue-100 to-blue-50 rounded-lg border border-blue-200">
                                                <Calendar className="w-4 h-4 text-blue-600" />
                                              </div>
                                              <div>
                                                <p className="text-xs text-gray-500">
                                                  Study Date
                                                </p>
                                                <p className="font-medium text-gray-900">
                                                  {getDateDisplay(change.date)}
                                                </p>
                                              </div>
                                            </div>
                                          </div>

                                          {/* Middle Column - Study Group Info */}
                                          <div className="space-y-4">
                                            <div className="flex items-center gap-3">
                                              <div className="p-2.5 bg-gradient-to-br from-emerald-100 to-emerald-50 rounded-lg border border-emerald-200">
                                                <Folder className="w-4 h-4 text-emerald-600" />
                                              </div>
                                              <div>
                                                <p className="text-xs text-gray-500">
                                                  Study Group
                                                </p>
                                                <div className="flex items-center gap-2 mt-1">
                                                  {classInfo.branch &&
                                                  classInfo.className ? (
                                                    <>
                                                      <span className="px-3 py-1.5 bg-blue-100 text-blue-800 rounded-lg text-xs font-medium border border-blue-200">
                                                        {classInfo.branch}-
                                                        {classInfo.className}
                                                      </span>
                                                      <span className="px-3 py-1.5 bg-emerald-100 text-emerald-800 rounded-lg text-xs font-medium border border-emerald-200">
                                                        {classInfo.sem}
                                                      </span>
                                                    </>
                                                  ) : (
                                                    <span className="text-gray-900">
                                                      {change.assigned_to ||
                                                        "N/A"}
                                                    </span>
                                                  )}
                                                </div>
                                              </div>
                                            </div>

                                            <div className="flex items-center gap-3">
                                              <div className="p-2.5 bg-gradient-to-br from-violet-100 to-violet-50 rounded-lg border border-violet-200">
                                                <Clock className="w-4 h-4 text-violet-600" />
                                              </div>
                                              <div>
                                                <p className="text-xs text-gray-500">
                                                  Study Time
                                                </p>
                                                <p className="font-medium text-gray-900">
                                                  {change.timeSlot}
                                                </p>
                                              </div>
                                            </div>
                                          </div>

                                          {/* Right Column - Actions */}
                                          <div className="flex items-start justify-end">
                                            <button
                                              onClick={() =>
                                                handleDeleteChange(change)
                                              }
                                              disabled={isDeleting}
                                              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-rose-600 to-rose-700 text-white rounded-lg font-medium hover:from-rose-700 hover:to-rose-800 transition-all duration-300 shadow-sm hover:shadow-md group/delete disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                              {isDeleting ? (
                                                <RefreshCw className="w-4 h-4 animate-spin group-hover/delete:rotate-180 transition-transform" />
                                              ) : (
                                                <Trash2 className="w-4 h-4 group-hover/delete:scale-110 transition-transform" />
                                              )}
                                              Remove Update
                                            </button>
                                          </div>
                                        </div>

                                        {/* Additional Note */}
                                        <div className="mt-6 pt-6 border-t border-gray-100">
                                          <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-amber-50 to-amber-100/30 rounded-lg border border-amber-200">
                                            <AlertTriangle className="w-4 h-4 text-amber-500" />
                                            <p className="text-sm text-amber-700">
                                              Temporary schedule adjustment
                                              overriding regular study planner
                                            </p>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      }
                    )
                  ) : (
                    /* Empty State */
                    <div className="text-center py-16 bg-gradient-to-br from-amber-50/50 to-blue-50/50 rounded-2xl border-2 border-dashed border-amber-200 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/20 to-transparent"></div>
                      <div className="relative">
                        <div className="inline-block p-6 bg-gradient-to-br from-amber-100 to-amber-50 rounded-2xl mb-6 border border-amber-200">
                          <Bell className="w-16 h-16 text-amber-500" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-3">
                          No Schedule Updates Found
                        </h3>
                        <p className="text-gray-600 mb-8 max-w-md mx-auto">
                          {searchTerm || dateFilter !== "all"
                            ? "No adjustments match your current filters. Try adjusting your search criteria."
                            : "All schedule adjustments have been cleared or no temporary changes exist."}
                        </p>
                        {(searchTerm || dateFilter !== "all") && (
                          <button
                            onClick={handleClearFilters}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-lg hover:from-amber-700 hover:to-amber-800 transition-all duration-300 shadow-sm hover:shadow-md group"
                          >
                            <X className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                            Clear Filters
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Info Card */}
          <div className="bg-gradient-to-r from-amber-50 to-blue-50 rounded-2xl p-8 border-2 border-amber-200 relative overflow-hidden">
            <div className="absolute top-4 right-4">
              <Bookmark className="w-8 h-8 text-amber-400/40" />
            </div>
            <div className="relative">
              <h3 className="font-bold text-amber-900 mb-6 flex items-center gap-3 text-lg">
                <div className="p-2 bg-gradient-to-br from-amber-100 to-amber-200 rounded-lg">
                  <Info className="w-5 h-5 text-amber-700" />
                </div>
                About Schedule Updates
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center">
                      <span className="text-xs font-bold text-amber-700">
                        1
                      </span>
                    </div>
                    <h4 className="font-semibold text-amber-800">
                      Temporary Adjustments
                    </h4>
                  </div>
                  <p className="text-amber-700 text-sm leading-relaxed">
                    These are temporary changes to your study planner that
                    override the regular schedule for specific dates only.
                  </p>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                      <span className="text-xs font-bold text-blue-700">2</span>
                    </div>
                    <h4 className="font-semibold text-blue-800">
                      Organization
                    </h4>
                  </div>
                  <p className="text-blue-700 text-sm leading-relaxed">
                    Group updates by date to see all changes for specific days,
                    or by class to see all adjustments affecting a study group.
                  </p>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-rose-100 to-rose-200 flex items-center justify-center">
                      <span className="text-xs font-bold text-rose-700">3</span>
                    </div>
                    <h4 className="font-semibold text-rose-800">Removal</h4>
                  </div>
                  <p className="text-rose-700 text-sm leading-relaxed">
                    Removing an adjustment will delete it permanently and revert
                    to the original schedule. This action cannot be undone.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}