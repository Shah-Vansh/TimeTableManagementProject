import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  Calendar,
  Clock,
  Users,
  Building,
  ChevronRight,
  ChevronLeft,
  Download,
  Printer,
  Mail,
  Phone,
  GraduationCap,
  BookOpen,
  Home,
  RefreshCw,
  Loader2,
  AlertCircle,
  CheckCircle,
  Clock4,
  MapPin,
  Edit,
  ArrowLeft,
  Grid,
  BarChart3,
  Filter,
  Info,
  Bookmark,
  Notebook,
  ClipboardList,
  PenTool,
  Layers,
  TrendingUp,
  Highlighter,
  StickyNote,
  Folder,
  File,
  CalendarDays,
  Compass,
  AlertTriangle,
  Plus,
  Share2,
  Copy,
  CheckSquare,
  Square,
  EyeOff,
  Eye,
} from "lucide-react";
import api from "../configs/api";
import Alert from "../components/Alert";
import TimetableTable from "../components/TimetableTable";

export default function FacultyTimetable() {
  const { facultyId } = useParams();
  const navigate = useNavigate();
  
  const [faculty, setFaculty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [viewMode, setViewMode] = useState("weekly");
  const [showEmptySlots, setShowEmptySlots] = useState(true);
  const [alert, setAlert] = useState(null);
  
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const dayKeys = {
    "Monday": "mon",
    "Tuesday": "tue",
    "Wednesday": "wed",
    "Thursday": "thu",
    "Friday": "fri",
    "Saturday": "sat"
  };

  // Show alert message
  const showAlert = (main, info, type) => {
    setAlert({ main, info, type });
    setTimeout(() => setAlert(null), 5000);
  };

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

  /* =======================
     🔹 FETCH FACULTY TIMETABLE
  ======================= */
  const fetchFacultyTimetable = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get(`/api/faculties/${facultyId}`);
      if (response.data.success) {
        setFaculty(response.data.faculty);
        showAlert(
          "Tutor schedule loaded",
          `${response.data.faculty.name}'s teaching schedule loaded successfully`,
          "success"
        );
      } else {
        setError(response.data.error || "Failed to fetch tutor schedule");
        showAlert(
          "Failed to load schedule",
          response.data.error || "Please try again",
          "error"
        );
      }
    } catch (err) {
      console.error("Error fetching faculty timetable:", err);
      setError(err.response?.data?.error || "Failed to load schedule");
      showAlert(
        "Failed to load schedule",
        err.response?.data?.error || "Please try again",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  /* =======================
     🔹 INITIAL LOAD
  ======================= */
  useEffect(() => {
    if (facultyId) {
      fetchFacultyTimetable();
    }
  }, [facultyId]);

  /* =======================
     🔹 CALCULATE STATISTICS
  ======================= */
  const calculateStatistics = () => {
    if (!faculty?.timetable) {
      return {
        totalLectures: 0,
        uniqueDivisions: 0,
        daysTeaching: 0,
        weeklyHours: 0
      };
    }

    const timetable = faculty.timetable;
    const daysArray = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    
    let totalLectures = 0;
    const uniqueDivisions = new Set();
    const teachingDays = new Set();

    daysArray.forEach(day => {
      const daySchedule = timetable[day] || [];
      let hasTaughtToday = false;
      
      daySchedule.forEach(period => {
        if (period !== 'free') {
          totalLectures++;
          hasTaughtToday = true;
          
          const parts = period.split('-');
          if (parts.length >= 2) {
            uniqueDivisions.add(parts[1]);
          }
        }
      });
      
      if (hasTaughtToday) {
        teachingDays.add(day);
      }
    });

    return {
      totalLectures,
      uniqueDivisions: uniqueDivisions.size,
      daysTeaching: teachingDays.size,
      weeklyHours: totalLectures
    };
  };

  /* =======================
     🔹 GET ALL ASSIGNMENTS
  ======================= */
  const getAllAssignments = () => {
    if (!faculty?.timetable) return [];
    
    const assignments = [];
    const daysArray = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    const dayNames = {
      'mon': 'Monday',
      'tue': 'Tuesday',
      'wed': 'Wednesday',
      'thu': 'Thursday',
      'fri': 'Friday',
      'sat': 'Saturday'
    };
    
    const timeSlots = [
      { label: "9:00 - 10:00" },
      { label: "10:00 - 11:00" },
      { label: "11:00 - 12:00" },
      { label: "12:00 - 1:00" },
      { label: "1:00 - 2:00" },
    ];

    daysArray.forEach(dayKey => {
      const daySchedule = faculty.timetable[dayKey] || [];
      daySchedule.forEach((period, index) => {
        if (period !== 'free') {
          const parts = period.split('-');
          assignments.push({
            day: dayNames[dayKey],
            timeSlot: `Session ${index + 1}`,
            timeLabel: timeSlots[index]?.label || '',
            branch: parts[0] || period,
            sem: parts[2] || '',
            division: parts[1] || '',
            full: period
          });
        }
      });
    });
    
    return assignments;
  };

  /* =======================
     🔹 HANDLE PRINT
  ======================= */
  const handlePrint = () => {
    window.print();
  };

  /* =======================
     🔹 HANDLE DOWNLOAD
  ======================= */
  const handleDownload = () => {
    const data = {
      tutor: faculty,
      statistics: calculateStatistics(),
      assignments: getAllAssignments()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${facultyId}_teaching_schedule.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showAlert(
      "Schedule exported",
      "Tutor schedule downloaded as JSON file",
      "success"
    );
  };

  const copyAssignmentsToClipboard = async () => {
    const assignments = getAllAssignments();
    if (assignments.length === 0) {
      showAlert("No sessions found", "This tutor has no teaching sessions assigned", "error");
      return;
    }

    let content = `${faculty?.name}'s Teaching Schedule\n\n`;
    content += `Tutor ID: ${faculty?.id || faculty?._id?.substring(0, 8) || "N/A"}\n`;
    content += `Total Sessions: ${assignments.length}\n\n`;
    content += "SESSIONS:\n";
    content += "=".repeat(50) + "\n\n";
    
    assignments.forEach((assignment, index) => {
      content += `${index + 1}. ${assignment.day} - ${assignment.timeLabel}\n`;
      content += `   📚 ${assignment.branch}-${assignment.division} (${assignment.sem})\n\n`;
    });

    try {
      await navigator.clipboard.writeText(content);
      showAlert("Copied to clipboard", "Teaching schedule copied successfully", "success");
    } catch (err) {
      showAlert("Failed to copy", "Could not copy to clipboard", "error");
    }
  };

  /* =======================
     🔹 RENDER LOADING
  ======================= */
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-amber-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading tutor schedule...</p>
        </div>
      </div>
    );
  }

  /* =======================
     🔹 RENDER ERROR
  ======================= */
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-blue-50 flex items-center justify-center">
        <div className="max-w-md mx-auto p-6">
          <div className="bg-white rounded-2xl p-8 border-2 border-rose-200 shadow-sm relative overflow-hidden">
            <div className="absolute top-4 right-4">
              <AlertTriangle className="w-8 h-8 text-rose-400/40" />
            </div>
            <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 text-center mb-2">Unable to Load Schedule</h2>
            <p className="text-gray-600 text-center mb-6">{error}</p>
            <div className="flex flex-col gap-3">
              <button
                onClick={fetchFacultyTimetable}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-lg hover:from-amber-700 hover:to-amber-800 transition-all duration-300 shadow-sm hover:shadow-md group"
              >
                <RefreshCw className="w-5 h-5 group-hover:rotate-180 transition-transform" />
                Try Again
              </button>
              <button
                onClick={() => navigate("/faculties")}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-gray-100 to-gray-50 text-gray-700 rounded-lg hover:from-gray-200 hover:to-gray-100 transition-all duration-300 border border-gray-200 hover:border-gray-300"
              >
                <ChevronLeft className="w-5 h-5" />
                Back to Tutor List
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const statistics = calculateStatistics();
  const allAssignments = getAllAssignments();

  /* =======================
     🔹 RENDER MAIN CONTENT
  ======================= */
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-blue-50">
      {/* Decorative Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none print:hidden">
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
                Study Planner
              </span>
              <ChevronRight className="w-4 h-4 mx-2" />
              <span className="font-medium text-amber-600 flex items-center gap-1">
                <ClipboardList className="w-4 h-4" />
                Tutor Schedule
              </span>
            </div>
          </div>

          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 bg-white rounded-xl shadow-sm border border-gray-100 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-100 to-transparent opacity-60"></div>
                  <div className="relative">
                    <GraduationCap className="w-6 h-6 text-amber-600" />
                  </div>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    {faculty?.name}'s Teaching Schedule
                  </h1>
                  <p className="text-gray-600 mt-1">
                    Tutor ID: <span className="font-mono font-medium bg-gradient-to-r from-amber-100 to-amber-50 px-2 py-0.5 rounded border border-amber-200">{faculty?.id || faculty?._id?.substring(0, 8) || "N/A"}</span>
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 print:hidden">
              <button
                onClick={copyAssignmentsToClipboard}
                disabled={allAssignments.length === 0}
                className={`p-2.5 rounded-lg border transition-all duration-300 ${
                  allAssignments.length === 0
                    ? "bg-gradient-to-r from-gray-100 to-gray-50 text-gray-400 border-gray-200 cursor-not-allowed"
                    : "bg-gradient-to-r from-blue-100 to-blue-50 text-blue-600 border-blue-200 hover:border-blue-300 hover:from-blue-200 hover:to-blue-100"
                }`}
                title="Copy schedule"
              >
                <Copy className="w-5 h-5" />
              </button>
              <button
                onClick={handlePrint}
                className="p-2.5 rounded-lg border border-gray-200 bg-gradient-to-r from-gray-100 to-gray-50 text-gray-600 hover:from-gray-200 hover:to-gray-100 hover:border-gray-300 transition-all duration-300"
                title="Print schedule"
              >
                <Printer className="w-5 h-5" />
              </button>
              <button
                onClick={handleDownload}
                className="p-2.5 rounded-lg border border-emerald-200 bg-gradient-to-r from-emerald-100 to-emerald-50 text-emerald-600 hover:from-emerald-200 hover:to-emerald-100 hover:border-emerald-300 transition-all duration-300"
                title="Download schedule"
              >
                <Download className="w-5 h-5" />
              </button>
              {faculty?.email && (
                <button
                  onClick={() => {
                    window.location.href = `mailto:${faculty.email}`;
                  }}
                  className="p-2.5 rounded-lg border border-violet-200 bg-gradient-to-r from-violet-100 to-violet-50 text-violet-600 hover:from-violet-200 hover:to-violet-100 hover:border-violet-300 transition-all duration-300"
                  title="Send email"
                >
                  <Mail className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300 relative overflow-hidden group">
              <div className="absolute -right-6 -top-6 w-24 h-24 bg-gradient-to-br from-amber-100 to-transparent rounded-full opacity-60 group-hover:opacity-80 transition-opacity"></div>
              <div className="relative">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Teaching Sessions</p>
                    <p className="text-2xl font-bold text-gray-900 mb-2">
                      {statistics.totalLectures}
                    </p>
                    <div className="flex items-center text-xs text-amber-600">
                      <Building className="w-3 h-3 mr-1" />
                      <span>Per week</span>
                    </div>
                  </div>
                  <div className="p-3 bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl border border-amber-200">
                    <BookOpen className="w-6 h-6 text-amber-600" />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300 relative overflow-hidden group">
              <div className="absolute -right-6 -top-6 w-24 h-24 bg-gradient-to-br from-emerald-100 to-transparent rounded-full opacity-60 group-hover:opacity-80 transition-opacity"></div>
              <div className="relative">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Study Groups</p>
                    <p className="text-2xl font-bold text-gray-900 mb-2">
                      {statistics.uniqueDivisions}
                    </p>
                    <div className="flex items-center text-xs text-emerald-600">
                      <Users className="w-3 h-3 mr-1" />
                      <span>Unique groups</span>
                    </div>
                  </div>
                  <div className="p-3 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl border border-emerald-200">
                    <Folder className="w-6 h-6 text-emerald-600" />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300 relative overflow-hidden group">
              <div className="absolute -right-6 -top-6 w-24 h-24 bg-gradient-to-br from-blue-100 to-transparent rounded-full opacity-60 group-hover:opacity-80 transition-opacity"></div>
              <div className="relative">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Teaching Days</p>
                    <p className="text-2xl font-bold text-gray-900 mb-2">
                      {statistics.daysTeaching}
                    </p>
                    <div className="flex items-center text-xs text-blue-600">
                      <CalendarDays className="w-3 h-3 mr-1" />
                      <span>Days per week</span>
                    </div>
                  </div>
                  <div className="p-3 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                    <PenTool className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300 relative overflow-hidden group">
              <div className="absolute -right-6 -top-6 w-24 h-24 bg-gradient-to-br from-violet-100 to-transparent rounded-full opacity-60 group-hover:opacity-80 transition-opacity"></div>
              <div className="relative">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Weekly Hours</p>
                    <p className="text-2xl font-bold text-gray-900 mb-2">
                      {statistics.weeklyHours}
                    </p>
                    <div className="flex items-center text-xs text-violet-600">
                      <Clock className="w-3 h-3 mr-1" />
                      <span>Total hours</span>
                    </div>
                  </div>
                  <div className="p-3 bg-gradient-to-br from-violet-50 to-violet-100 rounded-xl border border-violet-200">
                    <Layers className="w-6 h-6 text-violet-600" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* View Mode Toggle */}
          <div className="bg-white rounded-2xl p-6 border-2 border-amber-200 shadow-sm mb-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Highlighter className="w-5 h-5 text-amber-600" />
                  Schedule View Options
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Choose how you want to view the teaching schedule
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 mr-2">View as:</span>
                <div className="flex bg-gradient-to-r from-gray-100 to-gray-50 rounded-lg p-1 border border-gray-200">
                  <button
                    onClick={() => setViewMode("weekly")}
                    className={`px-3 py-2 rounded-md flex items-center gap-2 transition-all ${
                      viewMode === "weekly"
                        ? "bg-gradient-to-r from-amber-100 to-amber-50 text-amber-600 border border-amber-200 shadow-sm"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    <Grid className="w-4 h-4" />
                    Weekly Grid
                  </button>
                  <button
                    onClick={() => setViewMode("detailed")}
                    className={`px-3 py-2 rounded-md flex items-center gap-2 transition-all ${
                      viewMode === "detailed"
                        ? "bg-gradient-to-r from-amber-100 to-amber-50 text-amber-600 border border-amber-200 shadow-sm"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    <BarChart3 className="w-4 h-4" />
                    Session List
                  </button>
                </div>
                <button
                  onClick={() => setShowEmptySlots(!showEmptySlots)}
                  className={`px-3 py-2 rounded-lg flex items-center gap-2 transition-all duration-300 ${
                    showEmptySlots
                      ? "bg-gradient-to-r from-amber-100 to-amber-50 text-amber-700 border-2 border-amber-200"
                      : "bg-gradient-to-r from-gray-100 to-gray-50 text-gray-700 border border-gray-200 hover:border-amber-300"
                  }`}
                >
                  {showEmptySlots ? (
                    <>
                      <EyeOff className="w-4 h-4" />
                      Hide Free Time
                    </>
                  ) : (
                    <>
                      <Eye className="w-4 h-4" />
                      Show All
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Weekly Timetable View */}
          {viewMode === "weekly" && faculty?.timetable && (
            <div className="mb-8">
              <TimetableTable
                timetable={faculty.timetable}
                showEmptySlots={showEmptySlots}
                facultyName={faculty.name}
                onToggleEmptySlots={() => setShowEmptySlots(!showEmptySlots)}
                printMode={false}
              />
            </div>
          )}

          {/* Detailed Assignments View */}
          {viewMode === "detailed" && allAssignments.length > 0 && (
            <div className="bg-white rounded-2xl border-2 border-amber-200 shadow-sm overflow-hidden mb-8">
              <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-amber-50 to-amber-100/50">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-amber-600" />
                  Teaching Session Details
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  All sessions where {faculty?.name} is assigned as tutor
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-amber-50 to-amber-100/50 border-b border-amber-200">
                    <tr>
                      <th className="text-left py-4 px-6 text-sm font-medium text-amber-800">Study Day</th>
                      <th className="text-left py-4 px-6 text-sm font-medium text-amber-800">Session Time</th>
                      <th className="text-left py-4 px-6 text-sm font-medium text-amber-800">Subject</th>
                      <th className="text-left py-4 px-6 text-sm font-medium text-amber-800">Study Group</th>
                      <th className="text-left py-4 px-6 text-sm font-medium text-amber-800">Semester</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {allAssignments.map((assignment, index) => (
                      <tr key={index} className="hover:bg-gradient-to-r hover:from-amber-50/30 hover:to-transparent transition-colors">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-gradient-to-br from-amber-100 to-amber-50 rounded-lg border border-amber-200">
                              <CalendarDays className="w-4 h-4 text-amber-600" />
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{assignment.day}</div>
                              <div className="text-xs text-gray-500">Day {index + 1}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-gradient-to-br from-blue-100 to-blue-50 rounded-lg border border-blue-200">
                              <Clock className="w-4 h-4 text-blue-600" />
                            </div>
                            <div>
                              <div className="text-gray-700 font-medium">{assignment.timeSlot}</div>
                              <div className="text-xs text-gray-500">{assignment.timeLabel}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="font-medium text-gray-900">
                            {assignment.branch}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-gradient-to-br from-emerald-100 to-emerald-50 text-emerald-800 border border-emerald-200">
                            {assignment.division}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-gradient-to-br from-violet-100 to-violet-50 text-violet-800 border border-violet-200">
                            {assignment.sem}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {viewMode === "detailed" && allAssignments.length === 0 && (
            <div className="text-center py-16 bg-gradient-to-br from-amber-50/50 to-blue-50/50 rounded-2xl border-2 border-dashed border-amber-200 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/20 to-transparent"></div>
              <div className="relative">
                <div className="inline-block p-6 bg-gradient-to-br from-amber-100 to-amber-50 rounded-2xl mb-6 border border-amber-200">
                  <BookOpen className="w-16 h-16 text-amber-500" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  No Teaching Sessions Assigned
                </h3>
                <p className="text-gray-600 mb-8 max-w-md mx-auto">
                  This tutor has no teaching sessions assigned in their schedule yet.
                </p>
              </div>
            </div>
          )}

          {/* Legend and Notes */}
          <div className="bg-gradient-to-r from-amber-50 to-blue-50 rounded-2xl p-8 border-2 border-amber-200 relative overflow-hidden">
            <div className="absolute top-4 right-4">
              <Bookmark className="w-8 h-8 text-amber-400/40" />
            </div>
            <div className="relative">
              <h3 className="font-bold text-amber-900 mb-6 flex items-center gap-3 text-lg">
                <div className="p-2 bg-gradient-to-br from-amber-100 to-amber-200 rounded-lg">
                  <Compass className="w-5 h-5 text-amber-700" />
                </div>
                Teaching Schedule Guide
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
                      View Options
                    </h4>
                  </div>
                  <p className="text-amber-700 text-sm leading-relaxed">
                    Toggle between weekly grid view and detailed list view to see all teaching sessions organized by day and time.
                  </p>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                      <span className="text-xs font-bold text-blue-700">2</span>
                    </div>
                    <h4 className="font-semibold text-blue-800">
                      Export Options
                    </h4>
                  </div>
                  <p className="text-blue-700 text-sm leading-relaxed">
                    Copy the schedule to clipboard, print it for reference, or download as JSON file for offline use.
                  </p>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-100 to-emerald-200 flex items-center justify-center">
                      <span className="text-xs font-bold text-emerald-700">3</span>
                    </div>
                    <h4 className="font-semibold text-emerald-800">
                      Quick Actions
                    </h4>
                  </div>
                  <p className="text-emerald-700 text-sm leading-relaxed">
                    Use the action buttons to email the tutor, print schedules, or navigate back to the tutor list.
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
          
          table {
            page-break-inside: auto !important;
          }
          
          tr {
            page-break-inside: avoid !important;
            page-break-after: auto !important;
          }
          
          td, th {
            border: 1px solid #d1d5db !important;
          }
        }
      `}</style>
    </div>
  );
}