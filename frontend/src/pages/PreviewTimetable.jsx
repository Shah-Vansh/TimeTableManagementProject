import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Printer,
  Download,
  ArrowLeft,
  Calendar,
  Clock,
  Users,
  GraduationCap,
  Building,
  Search,
  ChevronRight,
  Eye,
  EyeOff,
  Filter,
  CheckCircle,
  AlertCircle,
  Loader2,
  FileText,
  Grid,
  List,
  ChevronDown,
  ChevronUp,
  Notebook,
  Bookmark,
  ClipboardList,
  PenTool,
  BarChart3,
  Layers,
  Compass,
  BookOpen,
  Highlighter,
  StickyNote,
  CalendarDays,
  TrendingUp,
  Activity,
  Book,
} from "lucide-react";
import api from "../configs/api";
import Alert from "../components/Alert";

export default function PreviewTimetable() {
  const location = useLocation();
  const navigate = useNavigate();

  const days = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const timeSlots = [
    { label: "9:00 - 10:00", value: "Time Slot 1" },
    { label: "10:00 - 11:00", value: "Time Slot 2" },
    { label: "11:45 - 12:45", value: "Time Slot 3" },
    { label: "12:45 - 01:45", value: "Time Slot 4" },
    { label: "02:00 - 03:00", value: "Time Slot 5" },
  ];

  const divisions = [
    "D1",
    "D2",
    "D3",
    "D4",
    "D5",
    "D6",
    "D7",
    "D8",
    "D9",
    "D10",
    "D11",
    "D12",
  ];

  const branchColors = {
    CSE: "bg-gradient-to-r from-blue-100 to-blue-50 text-blue-700 border-blue-200",
    "CSE(AIML)":
      "bg-gradient-to-r from-purple-100 to-purple-50 text-purple-700 border-purple-200",
    DS: "bg-gradient-to-r from-emerald-100 to-emerald-50 text-emerald-700 border-emerald-200",
    ECE: "bg-gradient-to-r from-rose-100 to-rose-50 text-rose-700 border-rose-200",
    EEE: "bg-gradient-to-r from-indigo-100 to-indigo-50 text-indigo-700 border-indigo-200",
    ME: "bg-gradient-to-r from-violet-100 to-violet-50 text-violet-700 border-violet-200",
    CE: "bg-gradient-to-r from-teal-100 to-teal-50 text-teal-700 border-teal-200",
  };

  const facultyColors = {
    free: "bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 border-gray-200",
    ABC: "bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 border-blue-200",
    DEF: "bg-gradient-to-r from-purple-50 to-purple-100 text-purple-700 border-purple-200",
    XYZ: "bg-gradient-to-r from-indigo-50 to-indigo-100 text-indigo-700 border-indigo-200",
    PQR: "bg-gradient-to-r from-rose-50 to-rose-100 text-rose-700 border-rose-200",
    LMN: "bg-gradient-to-r from-indigo-50 to-indigo-100 text-indigo-700 border-indigo-200",
    JKL: "bg-gradient-to-r from-pink-50 to-pink-100 text-pink-700 border-pink-200",
    GHI: "bg-gradient-to-r from-cyan-50 to-cyan-100 text-cyan-700 border-cyan-200",
  };

  /* =======================
            STATE
  ======================= */
  const [sem, setSem] = useState(location.state?.sem || 1);
  const [branch, setBranch] = useState(location.state?.branch || "CSE");
  const [selectedDivisions, setSelectedDivisions] = useState([]);
  const [allSchedules, setAllSchedules] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [showEmptySlots, setShowEmptySlots] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("grid"); // 'grid' or 'list'
  const [expandedDivision, setExpandedDivision] = useState(null);
  const [overallStats, setOverallStats] = useState({
    totalDivisions: 0,
    loadedDivisions: 0,
    totalSlots: 0,
    assignedSlots: 0,
    freeSlots: 0,
    facultyCount: 0,
  });
  // Add this state variable
  const [availableFaculty, setAvailableFaculty] = useState([]);
  const [alert, setAlert] = useState(null);

  // Token declare
  const token = localStorage.getItem("token");
  const showAlert = (main, info, type) => {
    setAlert({ main, info, type });
    setTimeout(() => setAlert(null), 5000);
  };

  /* =======================
    UPDATE OVERALL STATISTICS
======================= */
  const updateOverallStatistics = () => {
    let totalAssignedSlots = 0;
    let totalFreeSlots = 0;
    const allFaculty = new Set();

    Object.values(allSchedules).forEach((schedule) => {
      days.forEach((day) => {
        timeSlots.forEach((slot) => {
          const faculty = schedule[day][slot.value];
          if (faculty === "free") {
            totalFreeSlots++;
          } else {
            totalAssignedSlots++;
            allFaculty.add(faculty);
          }
        });
      });
    });

    const totalSlots =
      Object.keys(allSchedules).length * days.length * timeSlots.length;

    // Convert Set to array and sort alphabetically
    const facultyArray = Array.from(allFaculty).sort();

    setAvailableFaculty(facultyArray);
    setOverallStats((prev) => ({
      ...prev,
      loadedDivisions: Object.keys(allSchedules).length,
      totalSlots,
      assignedSlots: totalAssignedSlots,
      freeSlots: totalFreeSlots,
      facultyCount: allFaculty.size,
    }));
  };

  /* =======================
   FETCH ALL DIVISIONS TIMETABLE
======================= */
  const fetchAllDivisionsTimetable = async () => {
    if (!branch.trim()) {
      setErrorMsg("Please select a branch first");
      return;
    }

    setIsLoading(true);
    setErrorMsg("");
    setSuccessMsg("");
    setAllSchedules({});
    setSelectedDivisions([]);
    setAvailableFaculty([]); // Reset faculty list

    try {
      const schedules = {};
      let loadedCount = 0;
      let totalAssignedSlots = 0;
      let totalFreeSlots = 0;
      const allFaculty = new Set();

      // Fetch timetable for each division
      for (const division of divisions) {
        try {
          const response = await api.get("/api/timetable/fetchtimetable", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            params: {
              sem: sem,
              branch: branch,
              class: division,
            },
          });

          const fetchedSchedule = response.data.schedule;

          // Convert schedule to our format
          const formattedSchedule = {};
          days.forEach((day) => {
            formattedSchedule[day] = {};
            timeSlots.forEach((slot) => {
              const faculty = fetchedSchedule[day]?.[slot.value] || "free";
              formattedSchedule[day][slot.value] = faculty;

              // Collect faculty names
              if (faculty !== "free") {
                allFaculty.add(faculty);
              }

              // Collect statistics
              if (faculty === "free") {
                totalFreeSlots++;
              } else {
                totalAssignedSlots++;
              }
            });
          });

          schedules[division] = formattedSchedule;
          loadedCount++;

          // Select this division by default
          setSelectedDivisions((prev) => [...prev, division]);
        } catch (error) {
          console.warn(`No timetable found for ${division}:`, error);
          const message =
            error.response?.data?.message ||
            error.response?.data?.error ||
            error.message ||
            "Something went wrong";
          showAlert(`No timetable found for ${division}:`, message, "error");
          // Continue with other divisions
        }
      }

      setAllSchedules(schedules);

      // Update available faculty list
      const facultyArray = Array.from(allFaculty).sort();
      setAvailableFaculty(facultyArray);

      // Calculate overall statistics
      const totalSlots = loadedCount * days.length * timeSlots.length;
      setOverallStats({
        totalDivisions: divisions.length,
        loadedDivisions: loadedCount,
        totalSlots,
        assignedSlots: totalAssignedSlots,
        freeSlots: totalFreeSlots,
        facultyCount: allFaculty.size,
      });

      if (loadedCount === 0) {
        setErrorMsg(`No timetables found for ${branch} - Semester ${sem}`);
      } else {
        setSuccessMsg(
          `Loaded ${loadedCount} division timetables for ${branch} - Semester ${sem}`
        );
        setTimeout(() => setSuccessMsg(""), 3000);
      }
    } catch (error) {
      console.error("Error fetching timetables:", error);
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Something went wrong";
      showAlert("Error fetching timetables", message, "error");
      setErrorMsg("Failed to load timetables. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  /* =======================
   FETCH SINGLE DIVISION TIMETABLE
======================= */
  const fetchSingleDivisionTimetable = async (division) => {
    try {
      const response = await api.get("/api/timetable/fetchtimetable", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          sem: sem,
          branch: branch,
          class: division,
        },
      });

      const fetchedSchedule = response.data.schedule;

      // Convert schedule to our format
      const formattedSchedule = {};
      days.forEach((day) => {
        formattedSchedule[day] = {};
        timeSlots.forEach((slot) => {
          formattedSchedule[day][slot.value] =
            fetchedSchedule[day]?.[slot.value] || "free";
        });
      });

      setAllSchedules((prev) => ({
        ...prev,
        [division]: formattedSchedule,
      }));

      // Add to selected divisions if not already
      if (!selectedDivisions.includes(division)) {
        setSelectedDivisions((prev) => [...prev, division]);
      }

      // Update statistics
      updateOverallStatistics();
    } catch (error) {
      console.error(`Error fetching timetable for ${division}:`, error);
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Something went wrong";
      showAlert(`Error fetching timetable for ${division}:`, message, "error");
      throw error;
    }
  };

  /* =======================
      EXPORT FUNCTIONS
  ======================= */
  const exportAllToText = () => {
    if (Object.keys(allSchedules).length === 0) return;

    let content = `TIMETABLE SUMMARY - ${branch} - Semester ${sem}\n`;
    content += `Generated on: ${new Date().toLocaleString()}\n`;
    content += "=".repeat(80) + "\n\n";

    content += `OVERALL STATISTICS:\n`;
    content += `- Total Divisions: ${overallStats.totalDivisions}\n`;
    content += `- Loaded Divisions: ${overallStats.loadedDivisions}\n`;
    content += `- Total Slots: ${overallStats.totalSlots}\n`;
    content += `- Assigned Slots: ${overallStats.assignedSlots}\n`;
    content += `- Free Slots: ${overallStats.freeSlots}\n`;
    content += `- Unique Faculty: ${overallStats.facultyCount}\n\n`;

    content += "=".repeat(80) + "\n\n";

    // Export each division's timetable
    Object.entries(allSchedules).forEach(([division, schedule]) => {
      content += `DIVISION: ${division}\n`;
      content += "-".repeat(40) + "\n";

      days.forEach((day) => {
        content += `${day.toUpperCase()}\n`;
        timeSlots.forEach((slot) => {
          const faculty = schedule[day][slot.value];
          content += `  ${slot.label}: ${
            faculty === "free" ? "Free Slot" : faculty
          }\n`;
        });
        content += "\n";
      });

      content += "\n" + "=".repeat(80) + "\n\n";
    });

    // Create and download file
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${branch}_Sem${sem}_All_Divisions_Timetable_${
      new Date().toISOString().split("T")[0]
    }.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setSuccessMsg("All timetables exported as text file");
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  const handlePrint = () => {
    window.print();
  };

  // Generate a consistent color for any faculty name
  const getFacultyColor = (facultyName) => {
    const colors = [
      // Cool → Warm → Cool → Warm (no neighbors similar)
      "bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 border-blue-200",
      "bg-gradient-to-r from-rose-50 to-rose-100 text-rose-700 border-rose-200",

      "bg-gradient-to-r from-teal-50 to-teal-100 text-teal-700 border-teal-200",
      "bg-gradient-to-r from-amber-50 to-amber-100 text-amber-700 border-amber-200",

      "bg-gradient-to-r from-indigo-50 to-indigo-100 text-indigo-700 border-indigo-200",
      "bg-gradient-to-r from-pink-50 to-pink-100 text-pink-700 border-pink-200",

      "bg-gradient-to-r from-cyan-50 to-cyan-100 text-cyan-700 border-cyan-200",
      "bg-gradient-to-r from-orange-50 to-orange-100 text-orange-700 border-orange-200",

      "bg-gradient-to-r from-violet-50 to-violet-100 text-violet-700 border-violet-200",
      "bg-gradient-to-r from-emerald-50 to-emerald-100 text-emerald-700 border-emerald-200",

      "bg-gradient-to-r from-purple-50 to-purple-100 text-purple-700 border-purple-200",
      "bg-gradient-to-r from-lime-50 to-lime-100 text-lime-700 border-lime-200",
    ];

    // Generate a consistent index from the faculty name
    let hash = 0;
    for (let i = 0; i < facultyName.length; i++) {
      hash = facultyName.charCodeAt(i) + ((hash << 5) - hash);
    }

    return colors[Math.abs(hash) % colors.length];
  };

  /* =======================
     TOGGLE DIVISION SELECTION
  ======================= */
  const toggleDivisionSelection = (division) => {
    if (selectedDivisions.includes(division)) {
      setSelectedDivisions((prev) => prev.filter((d) => d !== division));
    } else {
      // If timetable doesn't exist, fetch it
      if (!allSchedules[division]) {
        fetchSingleDivisionTimetable(division).catch(() => {
          setErrorMsg(`Failed to load timetable for ${division}`);
          const message =
            error.response?.data?.message ||
            error.response?.data?.error ||
            error.message ||
            "Something went wrong";
          showAlert(
            `Failed to load timetable for ${division}`,
            message,
            "error"
          );
        });
      } else {
        setSelectedDivisions((prev) => [...prev, division]);
      }
    }
  };

  const selectAllDivisions = () => {
    const allAvailableDivisions = Object.keys(allSchedules);
    if (selectedDivisions.length === allAvailableDivisions.length) {
      setSelectedDivisions([]);
    } else {
      setSelectedDivisions(allAvailableDivisions);
    }
  };

  /* =======================
      FILTERED SCHEDULE
  ======================= */
  const getFilteredSchedule = (schedule) => {
    if (!schedule) return null;

    const filtered = {};
    days.forEach((day) => {
      filtered[day] = {};
      timeSlots.forEach((slot) => {
        const faculty = schedule[day][slot.value];
        if (showEmptySlots || faculty !== "free") {
          if (searchQuery) {
            const query = searchQuery.toLowerCase();
            if (
              faculty.toLowerCase().includes(query) ||
              slot.label.toLowerCase().includes(query) ||
              day.toLowerCase().includes(query)
            ) {
              filtered[day][slot.value] = faculty;
            }
          } else {
            filtered[day][slot.value] = faculty;
          }
        }
      });
    });

    return filtered;
  };

  /* =======================
       INITIAL LOAD
  ======================= */
  useEffect(() => {
    if (branch.trim()) {
      fetchAllDivisionsTimetable();
    }
  }, [sem, branch]);

  /* =======================
   RENDER DIVISION TIMETABLE
  ======================= */
  const renderDivisionTimetable = (division, schedule) => {
    const filteredSchedule = getFilteredSchedule(schedule);

    return (
      <div key={division} className="mb-8 last:mb-0">
        {/* Alert Component */}
        {alert && (
          <Alert
            main={alert.main}
            info={alert.info}
            type={alert.type}
            onClose={() => setAlert(null)}
          />
        )}

        {/* Division Header */}
        <div className="flex items-center justify-between mb-4 print:mb-2 pt-5">
          <div className="flex items-center gap-3">
            <div
              className={`px-4 py-2 rounded-lg ${
                branchColors[branch] ||
                "bg-gradient-to-r from-gray-50 to-gray-100"
              } print:px-2 print:py-1 border`}
            >
              <h3 className="font-bold text-lg print:text-sm">
                Division {division}
              </h3>
            </div>
            <button
              onClick={() =>
                setExpandedDivision(
                  expandedDivision === division ? null : division
                )
              }
              className="p-2 hover:bg-indigo-50 rounded-lg transition-colors print:hidden border border-indigo-200"
            >
              {expandedDivision === division ? (
                <ChevronUp className="w-5 h-5 text-indigo-600" />
              ) : (
                <ChevronDown className="w-5 h-5 text-indigo-600" />
              )}
            </button>
          </div>

          <div className="print:hidden">
            <input
              type="checkbox"
              checked={selectedDivisions.includes(division)}
              onChange={() => toggleDivisionSelection(division)}
              className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Timetable Table - Always visible in print, toggleable in screen */}
        <div
          className={`${
            expandedDivision === division || viewMode === "grid"
              ? "block"
              : "hidden print:block"
          }`}
        >
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden print:rounded-none print:shadow-none print:mb-20">
            <div className="overflow-x-auto print:overflow-visible">
              <table className="w-full print:min-w-full print:border-collapse">
                <thead className="print:border print:border-gray-300">
                  <tr className="print:bg-gray-100">
                    <th className="print:p-2 print:text-xs print:font-semibold print:text-gray-700 print:border print:border-gray-300 print:min-w-0 print:w-24">
                      <div className="p-3 print:p-2 print:text-center">
                        <div className="flex items-center gap-2 print:block">
                          <Clock className="w-4 h-4 text-indigo-500 print:hidden" />
                          <span className="font-medium text-gray-900 print:text-xs">
                            Time
                          </span>
                        </div>
                      </div>
                    </th>
                    {days.map((day) => (
                      <th
                        key={day}
                        className="print:p-2 print:text-xs print:font-semibold print:text-gray-700 print:border print:border-gray-300 print:min-w-0"
                      >
                        <div className="p-3 print:p-2 print:text-center">
                          <span className="text-sm font-semibold text-gray-700 print:text-xs">
                            {day}
                          </span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 print:divide-y-0">
                  {timeSlots.map((slot) => {
                    const hasVisibleData = days.some(
                      (day) =>
                        filteredSchedule &&
                        filteredSchedule[day] &&
                        filteredSchedule[day][slot.value] !== undefined
                    );

                    if (!hasVisibleData) return null;

                    return (
                      <tr
                        key={slot.value}
                        className="hover:bg-indigo-50/50 transition-colors print:hover:bg-white print:border-b print:border-gray-300"
                      >
                        <td className="print:p-2 print:text-xs print:border print:border-gray-300 print:bg-gray-50">
                          <div className="p-3 print:p-2">
                            <div className="flex items-center gap-2 print:block print:text-center">
                              <span className="font-medium text-gray-900 print:text-xs print:font-normal">
                                {slot.label}
                              </span>
                            </div>
                          </div>
                        </td>
                        {days.map((day) => {
                          const faculty =
                            filteredSchedule && filteredSchedule[day]
                              ? filteredSchedule[day][slot.value]
                              : schedule[day][slot.value];

                          if (faculty === undefined)
                            return (
                              <td
                                key={day}
                                className="print:p-2 print:border print:border-gray-300"
                              ></td>
                            );

                          const facultyColor =
                            faculty === "free"
                              ? facultyColors.free
                              : getFacultyColor(faculty);

                          return (
                            <td
                              key={day}
                              className="print:p-2 print:border print:border-gray-300"
                            >
                              <div className="p-3 print:p-2">
                                <div
                                  className={`px-3 py-2 rounded-lg border text-center transition-all print:p-1 print:rounded-sm ${facultyColor} print:border-0 print:text-xs`}
                                >
                                  {faculty === "free" ? (
                                    <span className="text-gray-500 italic">
                                      Free
                                    </span>
                                  ) : (
                                    <span className="font-medium">
                                      {faculty}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  };

  /* =======================
            RENDER
  ======================= */
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-rose-50 p-4 md:p-6 print:p-0">
      {/* Decorative Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none print:hidden">
        <div className="absolute top-20 right-10 w-72 h-72 bg-gradient-to-br from-indigo-100 to-transparent rounded-full opacity-40"></div>
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-gradient-to-tr from-rose-100 to-transparent rounded-full opacity-30"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full h-64 bg-gradient-to-r from-transparent via-indigo-50/20 to-transparent"></div>
        <div className="absolute top-40 left-20 w-24 h-24 border-4 border-indigo-200/40 border-dashed rounded-lg rotate-12"></div>
        <div className="absolute bottom-40 right-20 w-16 h-16 border-2 border-rose-200/40 border-dotted rounded-full"></div>
        <div className="absolute top-60 right-40 w-8 h-32 bg-gradient-to-b from-emerald-200/30 to-transparent transform rotate-45"></div>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          @page {
            size: auto;
            margin: 0.5cm;
          }

          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .print\\:hidden {
            display: none !important;
          }

          .print\\:block {
            display: block !important;
          }

          .print\\:border {
            border: 1px solid #e5e7eb !important;
          }

          .print\\:text-sm {
            font-size: 10pt !important;
          }

          .print\\:text-xs {
            font-size: 8pt !important;
          }

          .print\\:p-2 {
            padding: 0.25rem !important;
          }

          .print\\:p-4 {
            padding: 0.5rem !important;
          }

          .print\\:mb-2 {
            margin-bottom: 0.25rem !important;
          }

          .print\\:min-w-0 {
            min-width: 0 !important;
          }

          table {
            page-break-inside: avoid !important;
          }

          .division-break {
            page-break-before: always !important;
          }
        }
      `}</style>

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
              onClick={() => navigate("/dashboard")}
              className="hover:text-gray-700 cursor-pointer flex items-center gap-1"
            >
              <Notebook className="w-3 h-3" />
              Academic
            </button>
            <ChevronRight className="w-4 h-4 mx-2" />
            <span className="font-medium text-indigo-600 flex items-center gap-1">
              <ClipboardList className="w-4 h-4" />
              Preview All Timetables
            </span>
          </div>
        </div>

        {/* Main Header */}
        <div className="print:hidden flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 bg-white rounded-xl shadow-sm border border-gray-100 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-100 to-transparent opacity-60"></div>
                <div className="relative">
                  <BarChart3 className="w-6 h-6 text-indigo-600" />
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  All Divisions Timetable Preview
                </h1>
                <p className="text-gray-600">
                  View, print, and export timetables for all divisions in a
                  unified view
                </p>
              </div>
            </div>
          </div>
          <div className="p-3 bg-white rounded-xl border border-gray-200 shadow-sm">
            <Grid className="w-6 h-6 text-indigo-600" />
          </div>
        </div>

        {/* Messages */}
        {errorMsg && (
          <div className="print:hidden mb-6 p-4 rounded-xl border border-rose-200 bg-rose-50 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-rose-800">Error</p>
              <p className="text-rose-600 text-sm mt-1">{errorMsg}</p>
            </div>
          </div>
        )}

        {successMsg && (
          <div className="print:hidden mb-6 p-4 rounded-xl border border-emerald-200 bg-emerald-50 flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-500 mt=0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-emerald-800">Success</p>
              <p className="text-emerald-600 text-sm mt-1">{successMsg}</p>
            </div>
          </div>
        )}

        {/* Control Panel */}
        <div className="print:hidden bg-white rounded-2xl p-6 border border-gray-200 shadow-sm mb-8 relative overflow-hidden">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-gradient-to-br from-indigo-100 to-transparent rounded-full opacity-60"></div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <div className="p-2 bg-gradient-to-br from-indigo-100 to-indigo-200 rounded-lg">
              <Compass className="w-5 h-5 text-indigo-700" />
            </div>
            Select Branch & Semester
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* Semester */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Semester
              </label>
              <div className="relative">
                <GraduationCap className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-indigo-500" />
                <select
                  value={sem}
                  onChange={(e) => setSem(Number(e.target.value))}
                  className="w-full pl-10 pr-4 py-3 bg-gradient-to-r from-indigo-50 to-indigo-100 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                    <option key={s} value={s}>
                      Semester {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Branch */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Branch
              </label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-emerald-500" />
                <select
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gradient-to-r from-emerald-50 to-emerald-100 border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                >
                  {["CSE", "CSE(AIML)", "DS", "ECE", "EEE", "ME", "CE"].map(
                    (b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    )
                  )}
                </select>
              </div>
            </div>

            {/* Load Button */}
            <div className="flex items-end">
              <button
                onClick={fetchAllDivisionsTimetable}
                disabled={isLoading}
                className={`w-full px-4 py-3 rounded-lg font-medium transition-all duration-300 flex items-center justify-center gap-2 shadow-sm hover:shadow-md ${
                  isLoading
                    ? "bg-gradient-to-r from-gray-100 to-gray-200 text-gray-400 cursor-not-allowed border border-gray-200"
                    : "bg-gradient-to-r from-indigo-600 to-indigo-700 text-white hover:from-indigo-700 hover:to-indigo-800 border border-indigo-600"
                }`}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4" />
                    Load All Divisions
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Division Selection */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">
                Select Divisions ({selectedDivisions.length} selected)
              </label>
              <button
                onClick={selectAllDivisions}
                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
              >
                {selectedDivisions.length === Object.keys(allSchedules).length
                  ? "Deselect All"
                  : "Select All"}
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {divisions.map((division) => (
                <button
                  key={division}
                  onClick={() => toggleDivisionSelection(division)}
                  disabled={!allSchedules[division]}
                  className={`px-4 py-2 rounded-lg border transition-all flex items-center gap-2 shadow-sm hover:shadow ${
                    selectedDivisions.includes(division)
                      ? "bg-gradient-to-r from-indigo-600 to-indigo-700 text-white border-indigo-600"
                      : allSchedules[division]
                      ? "bg-gradient-to-r from-indigo-50 to-indigo-100 text-indigo-700 border-indigo-200 hover:from-indigo-100 hover:to-indigo-200"
                      : "bg-gradient-to-r from-gray-50 to-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                  }`}
                >
                  {division}
                  {!allSchedules[division] && (
                    <span className="text-xs">(Not found)</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-indigo-400" />
                <input
                  type="text"
                  placeholder="Search by faculty, time, or day..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gradient-to-r from-indigo-50 to-indigo-100 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder-indigo-400/70"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex bg-gradient-to-r from-indigo-100 to-indigo-50 rounded-lg p-1 border border-indigo-200">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`px-3 py-2 rounded-md flex items-center gap-2 transition-all ${
                    viewMode === "grid"
                      ? "bg-white shadow-sm text-indigo-600 border border-indigo-200"
                      : "text-indigo-700 hover:text-indigo-900 hover:bg-indigo-50/50"
                  }`}
                >
                  <Grid className="w-4 h-4" />
                  Grid
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`px-3 py-2 rounded-md flex items-center gap-2 transition-all ${
                    viewMode === "list"
                      ? "bg-white shadow-sm text-indigo-600 border border-indigo-200"
                      : "text-indigo-700 hover:text-indigo-900 hover:bg-indigo-50/50"
                  }`}
                >
                  <List className="w-4 h-4" />
                  List
                </button>
              </div>

              <button
                onClick={() => setShowEmptySlots(!showEmptySlots)}
                className={`px-4 py-3 rounded-lg font-medium flex items-center gap-2 transition-all shadow-sm hover:shadow ${
                  showEmptySlots
                    ? "bg-gradient-to-r from-indigo-100 to-indigo-50 text-indigo-700 border border-indigo-200"
                    : "bg-gradient-to-r from-rose-100 to-rose-50 text-rose-700 border border-rose-200"
                }`}
              >
                {showEmptySlots ? (
                  <>
                    <EyeOff className="w-4 h-4" />
                    Hide Free Slots
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4" />
                    Show All Slots
                  </>
                )}
              </button>

              <button
                onClick={exportAllToText}
                disabled={Object.keys(allSchedules).length === 0}
                className={`px-4 py-3 rounded-lg font-medium flex items-center gap-2 transition-all shadow-sm hover:shadow-md ${
                  Object.keys(allSchedules).length === 0
                    ? "bg-gradient-to-r from-gray-100 to-gray-200 text-gray-400 cursor-not-allowed border border-gray-200"
                    : "bg-gradient-to-r from-emerald-600 to-emerald-700 text-white hover:from-emerald-700 hover:to-emerald-800 border border-emerald-600"
                }`}
              >
                <FileText className="w-4 h-4" />
                Export All
              </button>

              <button
                onClick={handlePrint}
                disabled={selectedDivisions.length === 0}
                className={`px-4 py-3 rounded-lg font-medium flex items-center gap-2 transition-all shadow-sm hover:shadow-md ${
                  selectedDivisions.length === 0
                    ? "bg-gradient-to-r from-gray-100 to-gray-200 text-gray-400 cursor-not-allowed border border-gray-200"
                    : "bg-gradient-to-r from-indigo-600 to-indigo-700 text-white hover:from-indigo-700 hover:to-indigo-800 border border-indigo-600"
                }`}
              >
                <Printer className="w-4 h-4" />
                Print Selected
              </button>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        {Object.keys(allSchedules).length > 0 && (
          <div className="print:hidden grid grid-cols-1 md:grid-cols-6 gap-6 mb-8">
            <div className="bg-white rounded-xl p-6 border border-indigo-200 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow duration-300">
              <div className="absolute -right-6 -top-6 w-24 h-24 bg-gradient-to-br from-indigo-100 to-transparent rounded-full opacity-60 group-hover:opacity-80 transition-opacity"></div>
              <div className="relative">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 flex items-center gap-1">
                      <Highlighter className="w-3 h-3" />
                      Total Divisions
                    </p>
                    <p className="text-2xl font-bold text-gray-900 mt-2">
                      {overallStats.totalDivisions}
                    </p>
                  </div>
                  <div className="p-3 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg border border-indigo-200">
                    <Users className="w-6 h-6 text-indigo-600" />
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
                      <Bookmark className="w-3 h-3" />
                      Loaded Divisions
                    </p>
                    <p className="text-2xl font-bold text-gray-900 mt-2">
                      {overallStats.loadedDivisions}
                    </p>
                  </div>
                  <div className="p-3 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg border border-emerald-200">
                    <CheckCircle className="w-6 h-6 text-emerald-600" />
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
                      Assigned Slots
                    </p>
                    <p className="text-2xl font-bold text-gray-900 mt-2">
                      {overallStats.assignedSlots}
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
                      Free Slots
                    </p>
                    <p className="text-2xl font-bold text-gray-900 mt-2">
                      {overallStats.freeSlots}
                    </p>
                  </div>
                  <div className="p-3 bg-gradient-to-br from-rose-50 to-rose-100 rounded-lg border border-rose-200">
                    <Clock className="w-6 h-6 text-rose-600" />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 border border-violet-200 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow duration-300">
              <div className="absolute -right-6 -top-6 w-24 h-24 bg-gradient-to-br from-violet-100 to-transparent rounded-full opacity-60 group-hover:opacity-80 transition-opacity"></div>
              <div className="relative">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 flex items-center gap-1">
                      <Layers className="w-3 h-3" />
                      Total Slots
                    </p>
                    <p className="text-2xl font-bold text-gray-900 mt-2">
                      {overallStats.totalSlots}
                    </p>
                  </div>
                  <div className="p-3 bg-gradient-to-br from-violet-50 to-violet-100 rounded-lg border border-violet-200">
                    <Grid className="w-6 h-6 text-violet-600" />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 border border-cyan-200 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow duration-300">
              <div className="absolute -right-6 -top-6 w-24 h-24 bg-gradient-to-br from-cyan-100 to-transparent rounded-full opacity-60 group-hover:opacity-80 transition-opacity"></div>
              <div className="relative">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 flex items-center gap-1">
                      <PenTool className="w-3 h-3" />
                      Faculty Count
                    </p>
                    <p className="text-2xl font-bold text-gray-900 mt-2">
                      {overallStats.facultyCount}
                    </p>
                  </div>
                  <div className="p-3 bg-gradient-to-br from-cyan-50 to-cyan-100 rounded-lg border border-cyan-200">
                    <GraduationCap className="w-6 h-6 text-cyan-600" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Timetables Display */}
        {Object.keys(allSchedules).length > 0 ? (
          <div>
            {/* Render only selected divisions */}
            {selectedDivisions
              .filter((division) => allSchedules[division])
              .map((division, index) => (
                <div
                  key={division}
                  className={index > 0 ? "print:division-break" : ""}
                >
                  {renderDivisionTimetable(division, allSchedules[division])}
                </div>
              ))}

            {/* Faculty Legend */}
            <div className="print:hidden mt-6 bg-white rounded-xl p-4 border border-indigo-200 shadow-sm relative overflow-hidden">
              <div className="absolute -right-6 -top-6 w-24 h-24 bg-gradient-to-br from-indigo-100 to-transparent rounded-full opacity-40"></div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-600" />
                Faculty Legend ({availableFaculty.length} faculty found)
              </h3>
              <div className="flex flex-wrap gap-2">
                {/* Always show Free Slot first */}
                <div
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium ${facultyColors.free} border shadow-sm`}
                >
                  Free Slot
                </div>

                {/* Show only available faculty */}
                {availableFaculty.map((faculty) => (
                  <div
                    key={faculty}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium ${getFacultyColor(
                      faculty
                    )} border shadow-sm`}
                    title={faculty}
                  >
                    {faculty}
                  </div>
                ))}

                {/* Show message if no faculty found */}
                {availableFaculty.length === 0 && (
                  <div className="text-gray-500 italic text-xs">
                    No faculty assignments found in loaded timetables
                  </div>
                )}
              </div>
            </div>

            {/* Guide Section */}
            <div className="print:hidden mt-8 bg-gradient-to-r from-indigo-50 to-rose-50 rounded-2xl p-8 border-2 border-indigo-200 relative overflow-hidden">
              <div className="absolute top-4 right-4">
                <Book className="w-8 h-8 text-indigo-400/40" />
              </div>
              <div className="relative">
                <h3 className="font-bold text-indigo-900 mb-6 flex items-center gap-3 text-lg">
                  <div className="p-2 bg-gradient-to-br from-indigo-100 to-indigo-200 rounded-lg">
                    <Compass className="w-5 h-5 text-indigo-700" />
                  </div>
                  Preview Guide
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-100 to-indigo-200 flex items-center justify-center border border-indigo-200">
                        <span className="text-xs font-bold text-indigo-700">
                          1
                        </span>
                      </div>
                      <h4 className="font-semibold text-indigo-800">
                        Division Selection
                      </h4>
                    </div>
                    <p className="text-indigo-700 text-sm leading-relaxed">
                      Click on division checkboxes to select or deselect which
                      timetables to display. Use "Select All" to quickly choose
                      all loaded divisions.
                    </p>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-rose-100 to-rose-200 flex items-center justify-center border border-rose-200">
                        <span className="text-xs font-bold text-rose-700">
                          2
                        </span>
                      </div>
                      <h4 className="font-semibold text-rose-800">
                        View Options
                      </h4>
                    </div>
                    <p className="text-rose-700 text-sm leading-relaxed">
                      Toggle between Grid and List views. Use the search filter
                      to find specific faculty or time slots across all selected
                      divisions.
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
                      Export all selected timetables as a text file or print
                      them directly. Each division's timetable will start on a
                      new page when printing.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Empty State */
          <div className="print:hidden text-center py-12 bg-white rounded-2xl border-2 border-dashed border-indigo-200 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 to-transparent"></div>
            <div className="relative">
              <div className="inline-block p-6 bg-gradient-to-br from-indigo-100 to-indigo-50 rounded-2xl mb-6 border border-indigo-200">
                <Grid className="w-16 h-16 text-indigo-500" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                {branch ? "No Timetables Loaded" : "Select a Branch"}
              </h3>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                {branch
                  ? "Click 'Load All Divisions' to view timetables for all divisions. Each division will be displayed in a notebook-style format."
                  : "Choose branch and semester to preview timetables in a unified view"}
              </p>
              <button
                onClick={fetchAllDivisionsTimetable}
                disabled={!branch.trim()}
                className={`inline-flex items-center px-6 py-3 rounded-lg font-medium transition-all duration-300 shadow-sm hover:shadow-md ${
                  !branch.trim()
                    ? "bg-gradient-to-r from-gray-100 to-gray-200 text-gray-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-indigo-600 to-indigo-700 text-white hover:from-indigo-700 hover:to-indigo-800"
                }`}
              >
                <Loader2 className="w-5 h-5 mr-2" />
                Load All Divisions
              </button>
            </div>
          </div>
        )}

        {/* Print Footer - Only visible when printing */}
        <div className="hidden print:block print:mt-8 print:pt-4 print:border-t print:border-gray-300 print:text-center print:text-xs print:text-gray-500">
          <p>
            This timetable was generated automatically by Timetable Management
            System
          </p>
          <p>Page {new Date().toLocaleDateString()} • For official use only</p>
        </div>
      </div>
    </div>
  );
}
