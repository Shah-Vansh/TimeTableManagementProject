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
} from "lucide-react";
import api from "../configs/api";

export default function ViewChanges() {
  const [changes, setChanges] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [groupBy, setGroupBy] = useState("date"); // "date" or "class"
  const [dateFilter, setDateFilter] = useState("all"); // "all", "today", "yesterday", "tomorrow", "specific"
  const [specificDate, setSpecificDate] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedGroup, setExpandedGroup] = useState({});
  const [allChanges, setAllChanges] = useState([]);
  const [deletingId, setDeletingId] = useState(null);

  // Grouping options
  const GROUP_OPTIONS = [
    { id: "date", label: "Group by Date", icon: CalendarIcon },
    { id: "class", label: "Group by Class", icon: Folder },
  ];

  const DATE_OPTIONS = [
    { id: "all", label: "All Dates" },
    { id: "today", label: "Today" },
    { id: "yesterday", label: "Yesterday" },
    { id: "tomorrow", label: "Tomorrow" },
    { id: "specific", label: "Specific Date" },
  ];

  const fetchChanges = async () => {
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await api.get("/api/fetch-all-changes");

      if (response.data.changes) {
        setChanges(response.data.changes);
        
        // Flatten all changes into a single array
        const flattenedChanges = flattenChanges(response.data.changes);
        setAllChanges(flattenedChanges);
        
        setSuccess(
          `Loaded ${flattenedChanges.length} temporary changes`
        );
      } else {
        setError("No changes found or invalid response format");
      }
    } catch (err) {
      console.error("Error fetching changes:", err);
      setError(err.response?.data?.error || "Failed to fetch changes");
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
      { key: "Time Slot 3", label: "11:00 AM - 12:00 PM" },
      { key: "Time Slot 4", label: "12:00 PM - 1:00 PM" },
      { key: "Time Slot 5", label: "1:00 PM - 2:00 PM" },
      { key: "Time Slot 6", label: "2:00 PM - 3:00 PM" },
      { key: "Time Slot 7", label: "3:00 PM - 4:00 PM" },
      { key: "Time Slot 8", label: "4:00 PM - 5:00 PM" },
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
    if (!window.confirm("Are you sure you want to delete this temporary change?")) {
      return;
    }

    setDeletingId(change._id || change.faculty + change.date + change.timeSlotKey);
    
    try {
      const response = await api.delete("/api/delete-temp-change", {
        data: {
          faculty_id: change.faculty,
          date: change.date,
          day: change.day.toLowerCase().substring(0, 3), // Convert "Monday" to "mon"
          lec_no: change.lec_no,
          assigned_to: change.assigned_to,
        }
      });

      if (response.data.success) {
        setSuccess("Temporary change deleted successfully!");
        
        // Remove from allChanges
        const updatedChanges = allChanges.filter(c => 
          !(c.faculty === change.faculty && 
            c.date === change.date && 
            c.timeSlotKey === change.timeSlotKey &&
            c.assigned_to === change.assigned_to)
        );
        
        setAllChanges(updatedChanges);
        
        // Also update the original changes structure
        fetchChanges();
        
        setTimeout(() => setSuccess(""), 3000);
      }
    } catch (err) {
      console.error("Error deleting change:", err);
      setError(err.response?.data?.error || "Failed to delete change");
      setTimeout(() => setError(""), 3000);
    } finally {
      setDeletingId(null);
    }
  };

  const getLecNoFromSlotKey = (slotKey) => {
    const slotMap = {
      "Time Slot 1": 0,
      "Time Slot 2": 1,
      "Time Slot 3": 2,
      "Time Slot 4": 3,
      "Time Slot 5": 4,
      "Time Slot 6": 5,
      "Time Slot 7": 6,
      "Time Slot 8": 7,
    };
    return slotMap[slotKey] || 0;
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
          case "specific":
            targetDate = specificDate;
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
      sortedDates.forEach(date => {
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
      sortedClasses.forEach(className => {
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
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const dateFormatted = date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    if (date.toDateString() === today.toDateString()) {
      return `Today - ${dateFormatted}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday - ${dateFormatted}`;
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return `Tomorrow - ${dateFormatted}`;
    } else {
      return dateFormatted;
    }
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
    setSpecificDate("");
  };

  useEffect(() => {
    fetchChanges();
  }, []);

  const groupedChanges = filterAndGroupChanges();
  const totalFilteredChanges = Object.values(groupedChanges).reduce(
    (total, group) => total + group.length,
    0
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 p-4 md:p-6">
      {/* Decorative Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-100 to-transparent rounded-full opacity-20"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-emerald-100 to-transparent rounded-full opacity-10"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Breadcrumb */}
        <div className="mb-6">
          <div className="flex items-center text-sm text-gray-600 mb-4">
            <span className="hover:text-gray-800 cursor-pointer">
              Dashboard
            </span>
            <ChevronDown className="w-4 h-4 mx-2 rotate-[-90deg]" />
            <span className="hover:text-gray-800 cursor-pointer">
              Timetable Management
            </span>
            <ChevronDown className="w-4 h-4 mx-2 rotate-[-90deg]" />
            <span className="font-medium text-indigo-600">
              View Temporary Changes
            </span>
          </div>
        </div>

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 bg-white rounded-xl shadow-sm border border-gray-100">
                <Bell className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Temporary Timetable Changes
                </h1>
                <p className="text-gray-600">
                  View and manage all temporary lecture assignments
                </p>
              </div>
            </div>
          </div>
          <div className="p-3 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl">
            <CalendarDays className="w-6 h-6 text-indigo-600" />
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-6 p-4 rounded-xl border border-red-200 bg-red-50 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-medium text-red-800">Error</p>
              <p className="text-red-600 text-sm mt-1">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 rounded-xl border border-emerald-200 bg-emerald-50 flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-medium text-emerald-800">Success</p>
              <p className="text-emerald-600 text-sm mt-1">{success}</p>
            </div>
          </div>
        )}

        {/* Stats Card */}
        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-2xl p-6 border border-indigo-200 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-indigo-700 mb-2">
                Total Temporary Changes
              </p>
              <p className="text-3xl font-bold text-indigo-900">
                {allChanges.length}
              </p>
              <p className="text-sm text-indigo-600 mt-2">
                {totalFilteredChanges} changes match current filters
              </p>
            </div>
            <div className="p-3 bg-white rounded-xl">
              <Bell className="w-6 h-6 text-indigo-600" />
            </div>
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-8">
          <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  All Temporary Changes
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  View temporary lecture assignments grouped by {groupBy === "date" ? "date" : "class"}
                </p>
              </div>
              <button
                onClick={fetchChanges}
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
              >
                {isLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                Refresh
              </button>
            </div>
          </div>

          <div className="p-6">
            {/* Controls */}
            <div className="mb-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Grouping Options */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Group Changes By
                  </label>
                  <div className="flex flex-wrap gap-3">
                    {GROUP_OPTIONS.map((option) => (
                      <button
                        key={option.id}
                        onClick={() => setGroupBy(option.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                          groupBy === option.id
                            ? "bg-indigo-600 text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        <option.icon className="w-4 h-4" />
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Date Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Filter by Date
                  </label>
                  <div className="flex flex-wrap gap-3">
                    {DATE_OPTIONS.map((option) => (
                      <button
                        key={option.id}
                        onClick={() => setDateFilter(option.id)}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                          dateFilter === option.id
                            ? "bg-blue-600 text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                  
                  {dateFilter === "specific" && (
                    <div className="mt-4">
                      <input
                        type="date"
                        value={specificDate}
                        onChange={(e) => setSpecificDate(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Search */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search Changes
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by faculty, class, date, branch, etc..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <button
                  onClick={handleClearFilters}
                  className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
                >
                  <X className="w-4 h-4" />
                  Clear Filters
                </button>
                <div className="text-sm text-gray-500">
                  Showing {totalFilteredChanges} changes
                </div>
              </div>
            </div>

            {/* Loading State */}
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-4" />
                  <p className="text-gray-600">Loading temporary changes...</p>
                </div>
              </div>
            ) : (
              /* Changes Display */
              <div className="space-y-6">
                {Object.keys(groupedChanges).length > 0 ? (
                  Object.entries(groupedChanges).map(([groupKey, groupChanges]) => {
                    const isExpanded = expandedGroup[groupKey];
                    const groupLabel = groupBy === "date" 
                      ? getDateDisplay(groupKey)
                      : getClassDisplay(groupKey);

                    return (
                      <div
                        key={groupKey}
                        className="border border-gray-200 rounded-xl overflow-hidden"
                      >
                        <button
                          onClick={() => toggleGroup(groupKey)}
                          className="w-full p-4 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 flex items-center justify-between transition-all"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-white rounded-lg">
                              {groupBy === "date" ? (
                                <Calendar className="w-4 h-4 text-indigo-600" />
                              ) : (
                                <Folder className="w-4 h-4 text-purple-600" />
                              )}
                            </div>
                            <div className="text-left">
                              <h3 className="font-semibold text-gray-900">
                                {groupLabel}
                              </h3>
                              <p className="text-sm text-gray-600">
                                {groupChanges.length} change{groupChanges.length !== 1 ? "s" : ""}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs font-medium">
                              {groupChanges.length} changes
                            </span>
                            {isExpanded ? (
                              <ChevronUp className="w-5 h-5 text-gray-500" />
                            ) : (
                              <ChevronDown className="w-5 h-5 text-gray-500" />
                            )}
                          </div>
                        </button>

                        {isExpanded && (
                          <div className="p-4 border-t border-gray-200 bg-white">
                            <div className="space-y-4">
                              {groupChanges.map((change, index) => {
                                const classInfo = parseAssignedTo(change.assigned_to);
                                const isDeleting = deletingId === (change._id || change.faculty + change.date + change.timeSlotKey);

                                return (
                                  <div
                                    key={index}
                                    className="p-4 border border-gray-200 rounded-lg hover:border-indigo-300 transition-colors"
                                  >
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                      {/* Left Column - Faculty Info */}
                                      <div className="space-y-4">
                                        <div className="flex items-center gap-3">
                                          <div className="p-2 bg-indigo-100 rounded-lg">
                                            <User className="w-4 h-4 text-indigo-600" />
                                          </div>
                                          <div>
                                            <p className="text-xs text-gray-500">Faculty ID</p>
                                            <p className="font-semibold text-gray-900">
                                              {change.faculty}
                                            </p>
                                          </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                          <div className="p-2 bg-blue-100 rounded-lg">
                                            <Calendar className="w-4 h-4 text-blue-600" />
                                          </div>
                                          <div>
                                            <p className="text-xs text-gray-500">Date</p>
                                            <p className="font-medium text-gray-900">
                                              {getDateDisplay(change.date)}
                                            </p>
                                          </div>
                                        </div>
                                      </div>

                                      {/* Middle Column - Class and Time Info */}
                                      <div className="space-y-4">
                                        <div className="flex items-center gap-3">
                                          <div className="p-2 bg-emerald-100 rounded-lg">
                                            <Folder className="w-4 h-4 text-emerald-600" />
                                          </div>
                                          <div>
                                            <p className="text-xs text-gray-500">Assigned To</p>
                                            <div className="flex items-center gap-2 mt-1">
                                              {classInfo.branch && classInfo.className ? (
                                                <>
                                                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                                                    {classInfo.branch}-{classInfo.className}
                                                  </span>
                                                  <span className="px-2 py-1 bg-emerald-100 text-emerald-800 rounded text-xs font-medium">
                                                    {classInfo.sem}
                                                  </span>
                                                </>
                                              ) : (
                                                <span className="text-gray-900">
                                                  {change.assigned_to || "N/A"}
                                                </span>
                                              )}
                                            </div>
                                          </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                          <div className="p-2 bg-amber-100 rounded-lg">
                                            <Clock className="w-4 h-4 text-amber-600" />
                                          </div>
                                          <div>
                                            <p className="text-xs text-gray-500">Time Slot</p>
                                            <p className="font-medium text-gray-900">
                                              {change.timeSlot}
                                            </p>
                                          </div>
                                        </div>
                                      </div>

                                      {/* Right Column - Actions */}
                                      <div className="flex items-start justify-end">
                                        <button
                                          onClick={() => handleDeleteChange(change)}
                                          disabled={isDeleting}
                                          className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                          {isDeleting ? (
                                            <RefreshCw className="w-4 h-4 animate-spin" />
                                          ) : (
                                            <Trash2 className="w-4 h-4" />
                                          )}
                                          Delete
                                        </button>
                                      </div>
                                    </div>

                                    {/* Additional Info */}
                                    <div className="mt-4 pt-4 border-t border-gray-100">
                                      <div className="flex items-center gap-2">
                                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                                        <p className="text-xs text-amber-700">
                                          Temporary assignment overriding regular timetable
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
                  })
                ) : (
                  /* Empty State */
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Bell className="w-8 h-8 text-indigo-600" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No Temporary Changes Found
                    </h3>
                    <p className="text-gray-600 mb-6">
                      {searchTerm || dateFilter !== "all"
                        ? "Try adjusting your filters"
                        : "All changes have been cleared or no temporary assignments exist"}
                    </p>
                    {(searchTerm || dateFilter !== "all") && (
                      <button
                        onClick={handleClearFilters}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
                      >
                        <X className="w-4 h-4" />
                        Clear Filters
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Info Card */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-white rounded-lg">
              <Info className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 mb-2">
                About Temporary Changes
              </h3>
              <p className="text-blue-800 text-sm mb-3">
                Temporary timetable changes override the regular schedule for specific dates. 
                You can view them grouped by date or by class for better organization.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-blue-700 text-sm">
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-1.5"></div>
                  <span><strong>Delete Changes:</strong> Click the delete button to remove temporary assignments</span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-1.5"></div>
                  <span><strong>Group by Date:</strong> See all changes for specific dates</span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-1.5"></div>
                  <span><strong>Group by Class:</strong> See all changes affecting specific classes</span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-1.5"></div>
                  <span>Use date filters to view today's, yesterday's, or tomorrow's changes</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}