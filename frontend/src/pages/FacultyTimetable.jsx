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
  Notebook,
  Bookmark,
  ClipboardList,
  PenTool,
  Compass,
  Layers,
  TrendingUp,
  Activity,
  Highlighter,
  StickyNote,
  CalendarDays,
  Book,
} from "lucide-react";
import api from "../configs/api";
import TimetableTable from "../components/TimetableTable";

export default function FacultyTimetable() {
  const { facultyId } = useParams();
  const navigate = useNavigate();
  
  const [faculty, setFaculty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [viewMode, setViewMode] = useState("weekly");
  const [showEmptySlots, setShowEmptySlots] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const dayKeys = {
    "Monday": "mon",
    "Tuesday": "tue",
    "Wednesday": "wed",
    "Thursday": "thu",
    "Friday": "fri",
    "Saturday": "sat"
  };
  
  /* =======================
     🔹 FETCH FACULTY TIMETABLE
  ======================= */
  const fetchFacultyTimetable = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    else setIsRefreshing(true);
    setError("");
    try {
      const response = await api.get(`/api/faculties/${facultyId}`,{
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.data.success) {
        setFaculty(response.data.faculty);
      } else {
        setError(response.data.error || "Failed to fetch faculty timetable");
      }
    } catch (err) {
      console.error("Error fetching faculty timetable:", err);
      setError(err.response?.data?.error || "Failed to load timetable");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  // token declared
  const token = localStorage.getItem("token");
  
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
            timeSlot: `Lecture ${index + 1}`,
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
      faculty: faculty,
      statistics: calculateStatistics()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${facultyId}_timetable.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  /* =======================
     🔹 RENDER LOADING
  ======================= */
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-rose-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-amber-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading faculty timetable...</p>
        </div>
      </div>
    );
  }

  /* =======================
     🔹 RENDER ERROR
  ======================= */
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-rose-50 flex items-center justify-center">
        <div className="max-w-md mx-auto p-6">
          <div className="bg-white rounded-2xl p-6 border border-rose-200 shadow-sm">
            <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 text-center mb-2">Unable to Load Timetable</h2>
            <p className="text-gray-600 text-center mb-6">{error}</p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => fetchFacultyTimetable()}
                className="px-4 py-3 bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-lg font-medium hover:from-amber-700 hover:to-amber-800 transition-all duration-300 flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
              >
                <RefreshCw className="w-5 h-5" />
                Try Again
              </button>
              <button
                onClick={() => navigate("/faculties")}
                className="px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-amber-50 transition-colors flex items-center justify-center gap-2 shadow-sm hover:shadow"
              >
                <ChevronLeft className="w-5 h-5" />
                Back to Faculty List
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
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-rose-50 p-4 md:p-6 print:p-0">
      {/* Decorative Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none print:hidden">
        <div className="absolute top-20 right-10 w-72 h-72 bg-gradient-to-br from-amber-100 to-transparent rounded-full opacity-40"></div>
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-gradient-to-tr from-rose-100 to-transparent rounded-full opacity-30"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full h-64 bg-gradient-to-r from-transparent via-amber-50/20 to-transparent"></div>
        <div className="absolute top-40 left-20 w-24 h-24 border-4 border-amber-200/40 border-dashed rounded-lg rotate-12"></div>
        <div className="absolute bottom-40 right-20 w-16 h-16 border-2 border-rose-200/40 border-dotted rounded-full"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto print:max-w-none">
        {/* Breadcrumb */}
        <div className="print:hidden mb-6">
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
              onClick={() => navigate("/faculties")}
              className="hover:text-gray-700 cursor-pointer flex items-center gap-1"
            >
              <Notebook className="w-3 h-3" />
              Faculties
            </button>
            <ChevronRight className="w-4 h-4 mx-2" />
            <span className="font-medium text-amber-600 flex items-center gap-1">
              <ClipboardList className="w-4 h-4" />
              {faculty?.name || "Faculty Timetable"}
            </span>
          </div>
        </div>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 print:mb-4 print:pt-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <button
                onClick={() => navigate("/faculties")}
                className="p-2 hover:bg-amber-50 rounded-lg transition-colors print:hidden border border-amber-200"
              >
                <ArrowLeft className="w-5 h-5 text-amber-600" />
              </button>
              <div className="flex items-center gap-4">
                <div className="p-2.5 bg-white rounded-xl shadow-sm border border-gray-100 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-100 to-transparent opacity-60"></div>
                  <div className="relative">
                    <BookOpen className="w-6 h-6 text-amber-600" />
                  </div>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 print:text-2xl">
                    {faculty?.name}'s Timetable
                  </h1>
                  <p className="text-gray-600 mt-1 print:text-sm flex items-center gap-2">
                    <PenTool className="w-4 h-4 text-amber-500" />
                    Faculty ID: <span className="font-mono font-medium ml-1">{faculty?.id || faculty?._id?.substring(0, 8) || "N/A"}</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 print:hidden">
            <button
              onClick={() => fetchFacultyTimetable(false)}
              disabled={isRefreshing}
              className="p-2 hover:bg-amber-50 rounded-lg transition-colors border border-amber-200"
              title="Refresh"
            >
              <RefreshCw className={`w-5 h-5 text-amber-600 ${isRefreshing ? "animate-spin" : ""}`} />
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-2 border border-amber-200 text-amber-700 rounded-lg font-medium hover:bg-amber-50 transition-colors flex items-center gap-2 shadow-sm hover:shadow"
            >
              <Printer className="w-4 h-4" />
              Print
            </button>
            <button
              onClick={handleDownload}
              className="px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-lg font-medium hover:from-amber-700 hover:to-amber-800 transition-all duration-300 flex items-center gap-2 shadow-sm hover:shadow-md"
            >
              <Download className="w-4 h-4" />
              Download
            </button>
            {faculty?.email && (
              <button
                onClick={() => {
                  window.location.href = `mailto:${faculty.email}`;
                }}
                className="p-2 border border-rose-200 text-rose-700 rounded-lg hover:bg-rose-50 transition-colors"
                title="Send Email"
              >
                <Mail className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="print:hidden grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 border border-amber-200 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow duration-300">
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-gradient-to-br from-amber-100 to-transparent rounded-full opacity-60 group-hover:opacity-80 transition-opacity"></div>
            <div className="relative">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 flex items-center gap-1">
                    <Highlighter className="w-3 h-3" />
                    Total Lectures
                  </p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">
                    {statistics.totalLectures}
                  </p>
                </div>
                <div className="p-3 bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg border border-amber-200">
                  <Building className="w-6 h-6 text-amber-600" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-emerald-200 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow duration-300">
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-gradient-to-br from-emerald-100 to-transparent rounded-full opacity-60 group-hover:opacity-80 transition-opacity"></div>
            <div className="relative">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 flex items-center gap-1">
                    <Layers className="w-3 h-3" />
                    Unique Divisions
                  </p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">
                    {statistics.uniqueDivisions}
                  </p>
                </div>
                <div className="p-3 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg border border-emerald-200">
                  <Users className="w-6 h-6 text-emerald-600" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-purple-200 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow duration-300">
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-gradient-to-br from-purple-100 to-transparent rounded-full opacity-60 group-hover:opacity-80 transition-opacity"></div>
            <div className="relative">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 flex items-center gap-1">
                    <CalendarDays className="w-3 h-3" />
                    Teaching Days
                  </p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">
                    {statistics.daysTeaching}
                  </p>
                </div>
                <div className="p-3 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200">
                  <Calendar className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-rose-200 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow duration-300">
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-gradient-to-br from-rose-100 to-transparent rounded-full opacity-60 group-hover:opacity-80 transition-opacity"></div>
            <div className="relative">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 flex items-center gap-1">
                    <StickyNote className="w-3 h-3" />
                    Weekly Hours
                  </p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">
                    {statistics.weeklyHours}
                  </p>
                </div>
                <div className="p-3 bg-gradient-to-br from-rose-50 to-rose-100 rounded-lg border border-rose-200">
                  <Clock className="w-6 h-6 text-rose-600" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="print:hidden bg-white rounded-xl p-4 border border-amber-200 shadow-sm mb-6 relative overflow-hidden">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-gradient-to-br from-amber-100 to-transparent rounded-full opacity-40"></div>
          <div className="relative flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <div className="p-1.5 bg-gradient-to-br from-amber-100 to-amber-200 rounded-lg">
                  <Compass className="w-4 h-4 text-amber-700" />
                </div>
                Timetable View
              </h2>
              <p className="text-gray-600 text-sm mt-1">
                {viewMode === "weekly" ? "Weekly grid view of all assignments" : "Detailed list of all class assignments"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 mr-2">View:</span>
              <div className="flex bg-gradient-to-r from-amber-100 to-amber-50 rounded-lg p-1 border border-amber-200">
                <button
                  onClick={() => setViewMode("weekly")}
                  className={`px-3 py-1.5 rounded-md flex items-center gap-2 transition-all ${
                    viewMode === "weekly"
                      ? "bg-white shadow-sm text-amber-600 border border-amber-200"
                      : "text-amber-700 hover:text-amber-900 hover:bg-amber-50/50"
                  }`}
                >
                  <Grid className="w-4 h-4" />
                  Weekly Table
                </button>
                <button
                  onClick={() => setViewMode("detailed")}
                  className={`px-3 py-1.5 rounded-md flex items-center gap-2 transition-all ${
                    viewMode === "detailed"
                      ? "bg-white shadow-sm text-amber-600 border border-amber-200"
                      : "text-amber-700 hover:text-amber-900 hover:bg-amber-50/50"
                  }`}
                >
                  <BarChart3 className="w-4 h-4" />
                  Detailed List
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Weekly Timetable View */}
        {viewMode === "weekly" && faculty?.timetable && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4 print:hidden">
              <h3 className="text-lg font-semibold text-gray-900">Weekly Schedule</h3>
              <button
                onClick={() => setShowEmptySlots(!showEmptySlots)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-all shadow-sm hover:shadow ${
                  showEmptySlots
                    ? "bg-gradient-to-r from-amber-100 to-amber-50 text-amber-700 border border-amber-200"
                    : "bg-gradient-to-r from-rose-100 to-rose-50 text-rose-700 border border-rose-200"
                }`}
              >
                {showEmptySlots ? (
                  <>
                    <AlertCircle className="w-4 h-4" />
                    Hide Free Slots
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Show All Slots
                  </>
                )}
              </button>
            </div>
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
          <div className="bg-white rounded-2xl border border-amber-200 shadow-sm overflow-hidden mb-8">
            <div className="p-6 border-b border-amber-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-amber-100 to-amber-200 rounded-lg">
                  <Layers className="w-5 h-5 text-amber-700" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Detailed Class Assignments</h2>
                  <p className="text-gray-600 text-sm mt-1">
                    All classes where {faculty?.name} is assigned - Organized by day and time
                  </p>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-amber-50 to-amber-100 border-b border-amber-200">
                  <tr>
                    <th className="text-left py-3 px-6 text-sm font-medium text-amber-800 uppercase tracking-wider">
                      <div className="flex items-center gap-2">
                        <CalendarDays className="w-4 h-4" />
                        Day
                      </div>
                    </th>
                    <th className="text-left py-3 px-6 text-sm font-medium text-amber-800 uppercase tracking-wider">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Time
                      </div>
                    </th>
                    <th className="text-left py-3 px-6 text-sm font-medium text-amber-800 uppercase tracking-wider">
                      <div className="flex items-center gap-2">
                        <Building className="w-4 h-4" />
                        Branch
                      </div>
                    </th>
                    <th className="text-left py-3 px-6 text-sm font-medium text-amber-800 uppercase tracking-wider">
                      <div className="flex items-center gap-2">
                        <Layers className="w-4 h-4" />
                        Division
                      </div>
                    </th>
                    <th className="text-left py-3 px-6 text-sm font-medium text-amber-800 uppercase tracking-wider">
                      <div className="flex items-center gap-2">
                        <GraduationCap className="w-4 h-4" />
                        Semester
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-100">
                  {allAssignments.map((assignment, index) => (
                    <tr key={index} className="hover:bg-amber-50/50 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-gradient-to-br from-amber-100 to-amber-50 rounded-lg border border-amber-200">
                            <Calendar className="w-4 h-4 text-amber-600" />
                          </div>
                          <span className="font-medium text-gray-900">{assignment.day}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-gradient-to-br from-emerald-100 to-emerald-50 rounded-lg border border-emerald-200">
                            <Clock className="w-4 h-4 text-emerald-600" />
                          </div>
                          <div>
                            <div className="text-gray-700 font-medium">{assignment.timeSlot}</div>
                            <div className="text-xs text-gray-500">{assignment.timeLabel}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-gradient-to-r from-amber-100 to-amber-50 text-amber-700 border border-amber-200">
                          {assignment.branch}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-gradient-to-r from-emerald-100 to-emerald-50 text-emerald-700 border border-emerald-200">
                          Division {assignment.division}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-gradient-to-r from-purple-100 to-purple-50 text-purple-700 border border-purple-200">
                          Semester {assignment.sem || "N/A"}
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
          <div className="bg-white rounded-2xl border-2 border-dashed border-amber-200 shadow-sm overflow-hidden mb-8 p-12 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-50/50 to-transparent"></div>
            <div className="relative">
              <div className="inline-block p-6 bg-gradient-to-br from-amber-100 to-amber-50 rounded-2xl mb-6 border border-amber-200">
                <BookOpen className="w-16 h-16 text-amber-500" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Lectures Assigned</h3>
              <p className="text-gray-600">
                This faculty member has no lectures assigned in their timetable.
              </p>
            </div>
          </div>
        )}

        {/* Legend and Notes */}
        <div className="print:hidden bg-gradient-to-r from-amber-50 to-rose-50 rounded-2xl p-8 border-2 border-amber-200 relative overflow-hidden">
          <div className="absolute top-4 right-4">
            <Book className="w-8 h-8 text-amber-400/40" />
          </div>
          <div className="relative">
            <h3 className="font-bold text-amber-900 mb-6 flex items-center gap-3 text-lg">
              <div className="p-2 bg-gradient-to-br from-amber-100 to-amber-200 rounded-lg">
                <Compass className="w-5 h-5 text-amber-700" />
              </div>
              Timetable Guide
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-amber-800 mb-3 flex items-center gap-2">
                    <Info className="w-5 h-5" />
                    Timetable Legend
                  </h4>
                  <ul className="space-y-3 text-amber-700">
                    <li className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-gradient-to-r from-gray-100 to-gray-200 border border-gray-300"></div>
                      <span className="text-sm"><strong>Free Period</strong> - No teaching assignment</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-gradient-to-r from-amber-100 to-amber-200 border border-amber-300"></div>
                      <span className="text-sm"><strong>Colored Cells</strong> - Different branches have different colors</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-gradient-to-r from-purple-100 to-purple-200 border border-purple-300"></div>
                      <span className="text-sm"><strong>Class Format</strong> - Branch-Division-Semester</span>
                    </li>
                  </ul>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-rose-800 mb-3 flex items-center gap-2">
                    <Clock4 className="w-5 h-5" />
                    Quick Actions
                  </h4>
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => window.print()}
                      className="px-4 py-2 bg-gradient-to-r from-amber-100 to-amber-50 text-amber-700 rounded-lg text-sm font-medium border border-amber-200 hover:from-amber-200 hover:to-amber-100 transition-all duration-300 shadow-sm hover:shadow"
                    >
                      Print Timetable
                    </button>
                    <button
                      onClick={handleDownload}
                      className="px-4 py-2 bg-gradient-to-r from-emerald-100 to-emerald-50 text-emerald-700 rounded-lg text-sm font-medium border border-emerald-200 hover:from-emerald-200 hover:to-emerald-100 transition-all duration-300 shadow-sm hover:shadow"
                    >
                      Download Schedule
                    </button>
                    <button
                      onClick={() => navigate("/faculties")}
                      className="px-4 py-2 bg-gradient-to-r from-gray-100 to-gray-50 text-gray-700 rounded-lg text-sm font-medium border border-gray-300 hover:from-gray-200 hover:to-gray-100 transition-all duration-300 shadow-sm hover:shadow"
                    >
                      Back to List
                    </button>
                  </div>
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