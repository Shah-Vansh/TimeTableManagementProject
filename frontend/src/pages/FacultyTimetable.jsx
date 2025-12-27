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
  Info
} from "lucide-react";
import api from "../configs/api";

export default function FacultyTimetable() {
  const { facultyId } = useParams();
  const navigate = useNavigate();
  
  const [faculty, setFaculty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeDay, setActiveDay] = useState("Monday");
  const [viewMode, setViewMode] = useState("weekly");
  
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const dayKeys = {
    "Monday": "mon",
    "Tuesday": "tue",
    "Wednesday": "wed",
    "Thursday": "thu",
    "Friday": "fri",
    "Saturday": "sat"
  };
  
  const timeSlots = [
    { label: "8:00 - 9:00", slot: "Time Slot 1", index: 0 },
    { label: "9:00 - 10:00", slot: "Time Slot 2", index: 1 },
    { label: "10:00 - 11:00", slot: "Time Slot 3", index: 2 },
    { label: "11:00 - 12:00", slot: "Time Slot 4", index: 3 },
    { label: "12:00 - 1:00", slot: "Time Slot 5", index: 4 },
  ];

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
      } else {
        setError(response.data.error || "Failed to fetch faculty timetable");
      }
    } catch (err) {
      console.error("Error fetching faculty timetable:", err);
      setError(err.response?.data?.error || "Failed to load timetable");
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
     🔹 GET CLASS INFO FOR PERIOD
  ======================= */
  const getClassInfo = (day, slotIndex) => {
    if (!faculty?.timetable) return null;
    
    const dayKey = dayKeys[day];
    const daySchedule = faculty.timetable[dayKey];
    
    if (!daySchedule || slotIndex >= daySchedule.length) return null;
    
    const period = daySchedule[slotIndex];
    
    if (period === 'free') return null;
    
    // Parse period format: "CE_3_D1" -> Branch: CE, Sem: 3, Division: D1
    const parts = period.split('-');
    if (parts.length >= 3) {
      return {
        branch: parts[0],
        sem: parts[2],
        division: parts[1],
        full: period
      };
    }
    
    return {
      branch: period,
      sem: '',
      division: '',
      full: period
    };
  };

  /* =======================
     🔹 GET PERIOD STATUS
  ======================= */
  const getPeriodStatus = (day, slotIndex) => {
    const classInfo = getClassInfo(day, slotIndex);
    return classInfo ? "teaching" : "free";
  };

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
          
          // Extract division (e.g., "CE_3_D1" -> "D1")
          const parts = period.split('_');
          if (parts.length >= 3) {
            uniqueDivisions.add(parts[2]);
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
      weeklyHours: totalLectures // Assuming 1 hour per lecture
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
    
    daysArray.forEach(dayKey => {
      const daySchedule = faculty.timetable[dayKey] || [];
      daySchedule.forEach((period, index) => {
        if (period !== 'free') {
          const parts = period.split('-');
          assignments.push({
            day: dayNames[dayKey],
            timeSlot: `Time Slot ${index + 1}`,
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 flex items-center justify-center">
        <div className="max-w-md mx-auto p-6">
          <div className="bg-white rounded-2xl p-6 border border-red-200 shadow-sm">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 text-center mb-2">Unable to Load Timetable</h2>
            <p className="text-gray-600 text-center mb-6">{error}</p>
            <div className="flex flex-col gap-3">
              <button
                onClick={fetchFacultyTimetable}
                className="px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-5 h-5" />
                Try Again
              </button>
              <button
                onClick={() => navigate("/faculties")}
                className="px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 p-4 md:p-6">
      {/* Decorative Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-purple-100 to-transparent rounded-full opacity-20"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-blue-100 to-transparent rounded-full opacity-10"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Breadcrumb */}
        <div className="mb-6">
          <div className="flex items-center text-sm text-gray-600 mb-4">
            <Link to="/dashboard" className="hover:text-gray-800 cursor-pointer">
              Dashboard
            </Link>
            <ChevronRight className="w-4 h-4 mx-2" />
            <Link to="/faculties" className="hover:text-gray-800 cursor-pointer">
              Faculties
            </Link>
            <ChevronRight className="w-4 h-4 mx-2" />
            <span className="font-medium text-blue-600">
              {faculty?.name || "Faculty Timetable"}
            </span>
          </div>
        </div>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <button
                onClick={() => navigate("/faculties")}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {faculty?.name}
                </h1>
                <p className="text-gray-600 mt-1">
                  Faculty ID: <span className="font-mono font-medium">{faculty?.id}</span>
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              Print
            </button>
            <button
              onClick={handleDownload}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download
            </button>
            <button
              onClick={() => {
                window.location.href = `mailto:${faculty?.id.toLowerCase()}@college.edu`;
              }}
              className="p-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              title="Send Email"
            >
              <Mail className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Lectures</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {statistics.totalLectures}
                </p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <Building className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Unique Divisions</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {statistics.uniqueDivisions}
                </p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <Users className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Teaching Days</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {statistics.daysTeaching}
                </p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <Calendar className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Weekly Hours</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {statistics.weeklyHours}
                </p>
              </div>
              <div className="p-3 bg-amber-50 rounded-lg">
                <Clock className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm mb-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Weekly Timetable</h2>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 mr-2">View:</span>
              <button
                onClick={() => setViewMode("weekly")}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  viewMode === "weekly"
                    ? "bg-blue-100 text-blue-700 border border-blue-200"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <Grid className="inline-block w-4 h-4 mr-2" />
                Weekly
              </button>
              <button
                onClick={() => setViewMode("detailed")}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  viewMode === "detailed"
                    ? "bg-blue-100 text-blue-700 border border-blue-200"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <BarChart3 className="inline-block w-4 h-4 mr-2" />
                Detailed
              </button>
            </div>
          </div>
        </div>

        {/* Weekly Timetable View */}
        {viewMode === "weekly" && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-8">
            {/* Days Navigation */}
            <div className="grid grid-cols-6 border-b border-gray-200">
              {days.map((day) => {
                const dayKey = dayKeys[day];
                const daySchedule = faculty?.timetable?.[dayKey] || [];
                const lectureCount = daySchedule.filter(p => p !== 'free').length;
                
                return (
                  <button
                    key={day}
                    onClick={() => setActiveDay(day)}
                    className={`p-4 text-center transition-colors ${
                      activeDay === day
                        ? "bg-blue-50 border-b-2 border-blue-500"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    <div className="font-medium text-gray-900">{day.substring(0, 3)}</div>
                    <div className="text-xs text-gray-600 mt-1">
                      {lectureCount} lecture{lectureCount !== 1 ? "s" : ""}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Timetable Grid */}
            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Time</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Status</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Class Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {timeSlots.map((slot) => {
                      const classInfo = getClassInfo(activeDay, slot.index);
                      const status = getPeriodStatus(activeDay, slot.index);
                      const isFree = status === "free";
                      
                      return (
                        <tr key={slot.slot} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-4 px-4">
                            <div className="font-medium text-gray-900">{slot.label}</div>
                            <div className="text-xs text-gray-500">{slot.slot}</div>
                          </td>
                          <td className="py-4 px-4">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                              isFree
                                ? "bg-green-100 text-green-800"
                                : "bg-blue-100 text-blue-800"
                            }`}>
                              {isFree ? "Free" : "Teaching"}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            {classInfo ? (
                              <div>
                                <div className="font-medium text-gray-900">
                                  {classInfo.branch} - {classInfo.sem} - {classInfo.division}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                  Full: {classInfo.full}
                                </div>
                              </div>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Detailed Assignments View */}
        {viewMode === "detailed" && allAssignments.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-8">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Detailed Class Assignments</h2>
              <p className="text-gray-600 text-sm mt-1">
                All classes where {faculty?.name} is assigned
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-3 px-6 text-sm font-medium text-gray-700">Day</th>
                    <th className="text-left py-3 px-6 text-sm font-medium text-gray-700">Time</th>
                    <th className="text-left py-3 px-6 text-sm font-medium text-gray-700">Branch</th>
                    <th className="text-left py-3 px-6 text-sm font-medium text-gray-700">Semester</th>
                    <th className="text-left py-3 px-6 text-sm font-medium text-gray-700">Division</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {allAssignments.map((assignment, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="font-medium text-gray-900">{assignment.day}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <div>
                            <div className="text-gray-700">{assignment.timeSlot}</div>
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
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {assignment.sem}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          {assignment.division}
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
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-8 p-12 text-center">
            <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Lectures Assigned</h3>
            <p className="text-gray-600">
              This faculty member has no lectures assigned in their timetable.
            </p>
          </div>
        )}

        {/* Legend and Notes */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                <Info className="w-5 h-5" />
                Timetable Legend
              </h3>
              <ul className="space-y-2 text-blue-800 text-sm">
                <li className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-100 border border-green-300 rounded-full"></div>
                  <span><strong>Free Period</strong> - No teaching assignment</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-100 border border-blue-300 rounded-full"></div>
                  <span><strong>Teaching Period</strong> - Assigned class</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-purple-100 border border-purple-300 rounded-full"></div>
                  <span><strong>Class Format</strong> - Branch_Semester_Division (e.g., CE_3_D1)</span>
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                <Clock4 className="w-5 h-5" />
                Quick Actions
              </h3>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-white text-blue-700 rounded-lg text-sm font-medium border border-blue-200 hover:bg-blue-50 transition-colors"
                >
                  Print Timetable
                </button>
                <button
                  onClick={handleDownload}
                  className="px-3 py-1.5 bg-white text-blue-700 rounded-lg text-sm font-medium border border-blue-200 hover:bg-blue-50 transition-colors"
                >
                  Download Schedule
                </button>
                <button
                  onClick={() => navigate("/faculties")}
                  className="px-3 py-1.5 bg-white text-gray-700 rounded-lg text-sm font-medium border border-gray-300 hover:bg-gray-50 transition-colors"
                >
                  Back to List
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}