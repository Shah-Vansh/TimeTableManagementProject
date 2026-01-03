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
  Bookmark,
  Notebook,
  ClipboardList,
  PenTool,
  Layers,
  TrendingUp,
  BookOpen,
  Highlighter,
  StickyNote,
  Folder,
  File,
  CalendarDays,
  Compass,
  Info,
  AlertTriangle,
  Plus,
  Share2,
  Copy,
  CheckSquare,
  Square,
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
      rose: {
        bg: "bg-rose-50",
        border: "border-rose-200",
        text: "text-rose-700",
        light: "bg-gradient-to-r from-rose-100 to-rose-50",
        ribbon: "bg-gradient-to-r from-rose-400 to-rose-300",
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
     🔹 STATE
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
  const [viewMode, setViewMode] = useState("grid");
  const [expandedDivision, setExpandedDivision] = useState(null);
  const [overallStats, setOverallStats] = useState({
    totalDivisions: 0,
    loadedDivisions: 0,
    totalSlots: 0,
    assignedSlots: 0,
    freeSlots: 0,
    facultyCount: 0,
  });
  const [availableFaculty, setAvailableFaculty] = useState([]);
  const [alert, setAlert] = useState(null);
  const [copiedDivisions, setCopiedDivisions] = useState([]);

  // Show alert message
  const showAlert = (main, info, type) => {
    setAlert({ main, info, type });
    setTimeout(() => setAlert(null), 5000);
  };

  const getFacultyColor = (facultyName) => {
    const colors = [
      "bg-gradient-to-br from-amber-100 to-amber-50 text-amber-700 border border-amber-200",
      "bg-gradient-to-br from-blue-100 to-blue-50 text-blue-700 border border-blue-200",
      "bg-gradient-to-br from-emerald-100 to-emerald-50 text-emerald-700 border border-emerald-200",
      "bg-gradient-to-br from-violet-100 to-violet-50 text-violet-700 border border-violet-200",
      "bg-gradient-to-br from-rose-100 to-rose-50 text-rose-700 border border-rose-200",
      "bg-gradient-to-br from-cyan-100 to-cyan-50 text-cyan-700 border border-cyan-200",
      "bg-gradient-to-br from-orange-100 to-orange-50 text-orange-700 border border-orange-200",
      "bg-gradient-to-br from-teal-100 to-teal-50 text-teal-700 border border-teal-200",
    ];

    let hash = 0;
    for (let i = 0; i < facultyName.length; i++) {
      hash = facultyName.charCodeAt(i) + ((hash << 5) - hash);
    }

    return colors[Math.abs(hash) % colors.length];
  };

  /* =======================
   🔹 FETCH ALL DIVISIONS TIMETABLE
======================= */
  const fetchAllDivisionsTimetable = async () => {
    if (!branch.trim()) {
      showAlert("Select a study subject", "Please select a subject first", "error");
      return;
    }

    setIsLoading(true);
    setErrorMsg("");
    setSuccessMsg("");
    setAllSchedules({});
    setSelectedDivisions([]);
    setAvailableFaculty([]);
    setCopiedDivisions([]);

    try {
      const schedules = {};
      let loadedCount = 0;
      let totalAssignedSlots = 0;
      let totalFreeSlots = 0;
      const allFaculty = new Set();

      for (const division of divisions) {
        try {
          const response = await api.get("/api/fetchtimetable", {
            params: {
              sem: sem,
              branch: branch,
              class: division,
            },
          });

          const fetchedSchedule = response.data.schedule;
          const formattedSchedule = {};
          
          days.forEach((day) => {
            formattedSchedule[day] = {};
            timeSlots.forEach((slot) => {
              const faculty = fetchedSchedule[day]?.[slot.value] || "free";
              formattedSchedule[day][slot.value] = faculty;

              if (faculty !== "free") {
                allFaculty.add(faculty);
              }

              if (faculty === "free") {
                totalFreeSlots++;
              } else {
                totalAssignedSlots++;
              }
            });
          });

          schedules[division] = formattedSchedule;
          loadedCount++;
          
          // Add to selected divisions
          if (!selectedDivisions.includes(division)) {
            setSelectedDivisions((prev) => [...prev, division]);
          }
        } catch (error) {
          console.warn(`No schedule found for group ${division}:`, error);
        }
      }

      setAllSchedules(schedules);

      const facultyArray = Array.from(allFaculty).sort();
      setAvailableFaculty(facultyArray);

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
        showAlert(
          "No study plans found",
          `No study schedules found for ${branch} - Semester ${sem}`,
          "error"
        );
      } else {
        showAlert(
          "Study plans loaded",
          `${loadedCount} study group schedules loaded successfully`,
          "success"
        );
      }
    } catch (error) {
      console.error("Error fetching schedules:", error);
      showAlert(
        "Failed to load study plans",
        "Please try again later",
        "error"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSingleDivisionTimetable = async (division) => {
    try {
      const response = await api.get("/api/fetchtimetable", {
        params: {
          sem: sem,
          branch: branch,
          class: division,
        },
      });

      const fetchedSchedule = response.data.schedule;
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

      if (!selectedDivisions.includes(division)) {
        setSelectedDivisions((prev) => [...prev, division]);
      }

      updateOverallStatistics();
    } catch (error) {
      console.error(`Error fetching schedule for group ${division}:`, error);
      throw error;
    }
  };

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
     🔹 EXPORT FUNCTIONS
  ======================= */
  const exportAllToText = () => {
    if (Object.keys(allSchedules).length === 0) return;

    let content = `STUDY PLANNER - ${branch} - Semester ${sem}\n`;
    content += `Generated on: ${new Date().toLocaleString()}\n`;
    content += "=".repeat(80) + "\n\n";

    content += `OVERVIEW:\n`;
    content += `- Study Groups: ${overallStats.loadedDivisions}\n`;
    content += `- Study Sessions: ${overallStats.totalSlots}\n`;
    content += `- Scheduled: ${overallStats.assignedSlots}\n`;
    content += `- Free Time: ${overallStats.freeSlots}\n`;
    content += `- Tutors: ${overallStats.facultyCount}\n\n`;

    content += "=".repeat(80) + "\n\n";

    Object.entries(allSchedules).forEach(([division, schedule]) => {
      content += `STUDY GROUP: ${division}\n`;
      content += "-".repeat(40) + "\n";

      days.forEach((day) => {
        content += `${day.toUpperCase()}\n`;
        timeSlots.forEach((slot) => {
          const faculty = schedule[day][slot.value];
          content += `  ${slot.label}: ${
            faculty === "free" ? "Self Study" : `Tutor: ${faculty}`
          }\n`;
        });
        content += "\n";
      });

      content += "\n" + "=".repeat(80) + "\n\n";
    });

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${branch}_Sem${sem}_Study_Planner_${
      new Date().toISOString().split("T")[0]
    }.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showAlert(
      "Study planner exported",
      "All schedules downloaded as text file",
      "success"
    );
  };

  const handlePrint = () => {
    if (selectedDivisions.length === 0) {
      showAlert("No groups selected", "Please select at least one study group to print", "error");
      return;
    }
    window.print();
  };

  const copySelectedToClipboard = async () => {
    if (selectedDivisions.length === 0) {
      showAlert("No groups selected", "Please select study groups to copy", "error");
      return;
    }

    let content = `Selected Study Groups (${branch} - Semester ${sem}):\n\n`;
    selectedDivisions.forEach((division, index) => {
      content += `${index + 1}. ${division}\n`;
    });

    try {
      await navigator.clipboard.writeText(content);
      showAlert("Copied to clipboard", "Selected groups copied successfully", "success");
      
      // Visual feedback for copied divisions
      setCopiedDivisions([...selectedDivisions]);
      setTimeout(() => setCopiedDivisions([]), 2000);
    } catch (err) {
      showAlert("Failed to copy", "Could not copy to clipboard", "error");
    }
  };

  /* =======================
     🔹 TOGGLE DIVISION SELECTION
  ======================= */
  const toggleDivisionSelection = (division) => {
    if (selectedDivisions.includes(division)) {
      setSelectedDivisions((prev) => prev.filter((d) => d !== division));
    } else {
      if (!allSchedules[division]) {
        fetchSingleDivisionTimetable(division).catch(() => {
          showAlert(
            "Failed to load schedule",
            `Could not load schedule for group ${division}`,
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
     🔹 EFFECTS
  ======================= */
  useEffect(() => {
    if (branch.trim()) {
      fetchAllDivisionsTimetable();
    }
  }, [sem, branch]);

  /* =======================
     🔹 RENDER DIVISION TIMETABLE
  ======================= */
  const renderDivisionTimetable = (division, schedule) => {
    const filteredSchedule = getFilteredSchedule(schedule);
    const colors = getColorClasses("amber");
    const isCopied = copiedDivisions.includes(division);

    return (
      <div key={division} className="mb-8 last:mb-0">
        <div className={`border-2 ${isCopied ? "border-emerald-400" : colors.border} rounded-xl overflow-hidden group hover:border-amber-400 transition-all duration-300 relative`}>
          {/* Notebook Spine Effect */}
          <div className={`absolute left-0 top-0 bottom-0 w-3 ${isCopied ? "bg-gradient-to-r from-emerald-400 to-emerald-300" : colors.ribbon}`}></div>
          
          <div className="ml-3 mt-4 mr-4 mb-4 rounded-lg border border-gray-200/50 p-4 relative overflow-hidden">
            {/* Subtle notebook paper lines */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-transparent opacity-50"></div>
            
            <div className="flex items-center justify-between mb-4 relative">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-lg border ${isCopied ? "bg-gradient-to-br from-emerald-100 to-emerald-50 border-emerald-200" : "bg-gradient-to-br from-amber-100 to-amber-50 border-amber-200"}`}>
                  <Folder className={`w-5 h-5 ${isCopied ? "text-emerald-600" : "text-amber-600"}`} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">
                    Study Group {division}
                  </h3>
                  <p className="text-sm text-gray-600 flex items-center gap-1">
                    <StickyNote className="w-3 h-3" />
                    {branch} • Semester {sem}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    setExpandedDivision(
                      expandedDivision === division ? null : division
                    )
                  }
                  className={`p-2 rounded-lg border transition-all duration-300 ${
                    isCopied 
                      ? "bg-gradient-to-r from-emerald-50 to-emerald-100/50 border-emerald-200 hover:border-emerald-300"
                      : "bg-gradient-to-r from-amber-50 to-amber-100/50 border-amber-200 hover:border-amber-300"
                  }`}
                >
                  {expandedDivision === division ? (
                    <ChevronUp className="w-5 h-5 text-amber-500" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-amber-500" />
                  )}
                </button>
                <button
                  onClick={() => toggleDivisionSelection(division)}
                  className="p-2 rounded-lg border border-gray-200 hover:border-amber-300 transition-colors"
                >
                  {selectedDivisions.includes(division) ? (
                    <CheckSquare className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <Square className="w-5 h-5 text-gray-400 hover:text-amber-400" />
                  )}
                </button>
              </div>
            </div>

            <div className={`${expandedDivision === division || viewMode === "grid" ? "block" : "hidden print:block"}`}>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gradient-to-r from-amber-50 to-amber-100/50 border-b border-amber-200">
                      <th className="p-3 text-left">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-amber-600" />
                          <span className="font-medium text-gray-900">Study Time</span>
                        </div>
                      </th>
                      {days.map((day) => (
                        <th key={day} className="p-3 text-center">
                          <div className="flex flex-col items-center">
                            <span className="text-sm font-semibold text-gray-700">{day.substring(0, 3)}</span>
                            <span className="text-xs text-gray-500">{day.substring(3)}</span>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {timeSlots.map((slot) => {
                      const hasVisibleData = days.some(
                        (day) =>
                          filteredSchedule &&
                          filteredSchedule[day] &&
                          filteredSchedule[day][slot.value] !== undefined
                      );

                      if (!hasVisibleData) return null;

                      return (
                        <tr key={slot.value} className="border-b border-gray-100 last:border-0 hover:bg-gradient-to-r hover:from-amber-50/30 hover:to-transparent transition-colors">
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900">{slot.label}</span>
                            </div>
                          </td>
                          {days.map((day) => {
                            const faculty =
                              filteredSchedule && filteredSchedule[day]
                                ? filteredSchedule[day][slot.value]
                                : schedule[day][slot.value];

                            if (faculty === undefined)
                              return <td key={day}></td>;

                            const facultyColor =
                              faculty === "free"
                                ? "bg-gradient-to-br from-gray-100 to-gray-50 text-gray-500 italic border border-gray-200"
                                : getFacultyColor(faculty);

                            return (
                              <td key={day} className="p-3">
                                <div
                                  className={`px-3 py-2 rounded-lg border text-center transition-all hover:scale-[1.02] ${facultyColor}`}
                                >
                                  {faculty === "free" ? (
                                    <span className="text-sm">Self Study</span>
                                  ) : (
                                    <span className="font-medium text-sm">{faculty}</span>
                                  )}
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
      </div>
    );
  };

  /* =======================
     🔹 RENDER
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
          <div className="mb-6">
            <div className="flex items-center text-sm text-gray-500 mb-4">
              <button
                onClick={() => navigate(-1)}
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
                All Study Groups Preview
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
                    <BookOpen className="w-6 h-6 text-amber-600" />
                  </div>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    Study Planner Preview
                  </h1>
                  <p className="text-gray-600 mt-1">
                    Preview and manage study schedules across all groups like separate notebook sections
                  </p>
                </div>
              </div>
            </div>
            <div className="p-2.5 bg-gradient-to-br from-amber-100 to-amber-50 rounded-xl border border-amber-200">
              <File className="w-6 h-6 text-amber-600" />
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300 relative overflow-hidden group">
              <div className="absolute -right-6 -top-6 w-24 h-24 bg-gradient-to-br from-amber-100 to-transparent rounded-full opacity-60 group-hover:opacity-80 transition-opacity"></div>
              <div className="relative">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Study Groups</p>
                    <p className="text-2xl font-bold text-gray-900 mb-2">
                      {overallStats.loadedDivisions}
                    </p>
                    <div className="flex items-center text-xs text-amber-600">
                      <Folder className="w-3 h-3 mr-1" />
                      <span>Loaded schedules</span>
                    </div>
                  </div>
                  <div className="p-3 bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl border border-amber-200">
                    <Users className="w-6 h-6 text-amber-600" />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300 relative overflow-hidden group">
              <div className="absolute -right-6 -top-6 w-24 h-24 bg-gradient-to-br from-emerald-100 to-transparent rounded-full opacity-60 group-hover:opacity-80 transition-opacity"></div>
              <div className="relative">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Study Sessions</p>
                    <p className="text-2xl font-bold text-gray-900 mb-2">
                      {overallStats.assignedSlots}
                    </p>
                    <div className="flex items-center text-xs text-emerald-600">
                      <Calendar className="w-3 h-3 mr-1" />
                      <span>Scheduled sessions</span>
                    </div>
                  </div>
                  <div className="p-3 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl border border-emerald-200">
                    <CalendarDays className="w-6 h-6 text-emerald-600" />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300 relative overflow-hidden group">
              <div className="absolute -right-6 -top-6 w-24 h-24 bg-gradient-to-br from-blue-100 to-transparent rounded-full opacity-60 group-hover:opacity-80 transition-opacity"></div>
              <div className="relative">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Free Time</p>
                    <p className="text-2xl font-bold text-gray-900 mb-2">
                      {overallStats.freeSlots}
                    </p>
                    <div className="flex items-center text-xs text-blue-600">
                      <Clock className="w-3 h-3 mr-1" />
                      <span>Self-study hours</span>
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
                    <p className="text-sm text-gray-600 mb-1">Tutors</p>
                    <p className="text-2xl font-bold text-gray-900 mb-2">
                      {overallStats.facultyCount}
                    </p>
                    <div className="flex items-center text-xs text-violet-600">
                      <GraduationCap className="w-3 h-3 mr-1" />
                      <span>Assigned tutors</span>
                    </div>
                  </div>
                  <div className="p-3 bg-gradient-to-br from-violet-50 to-violet-100 rounded-xl border border-violet-200">
                    <Layers className="w-6 h-6 text-violet-600" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Control Panel */}
          <div className="bg-white rounded-2xl border-2 border-amber-200 shadow-sm overflow-hidden mb-8">
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-amber-50 to-amber-100/50">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Highlighter className="w-5 h-5 text-amber-600" />
                    Study Schedule Controls
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Filter and organize study schedules across multiple groups
                  </p>
                </div>
                <button
                  onClick={fetchAllDivisionsTimetable}
                  disabled={isLoading}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-lg hover:from-amber-700 hover:to-amber-800 transition-all duration-300 shadow-sm hover:shadow-md group"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin group-hover:rotate-180 transition-transform" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <Eye className="w-4 h-4 group-hover:scale-110 transition-transform" />
                      Load All Groups
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <CalendarDays className="w-4 h-4 text-amber-600" />
                    Semester
                  </label>
                  <div className="relative">
                    <GraduationCap className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-amber-500" />
                    <select
                      value={sem}
                      onChange={(e) => setSem(Number(e.target.value))}
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 text-gray-900 placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all shadow-sm"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                        <option key={s} value={s}>
                          Semester {s}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Building className="w-4 h-4 text-blue-600" />
                    Study Subject
                  </label>
                  <div className="relative">
                    <BookOpen className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-blue-500" />
                    <select
                      value={branch}
                      onChange={(e) => setBranch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 text-gray-900 placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm"
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

                <div className="flex items-end">
                  <button
                    onClick={fetchAllDivisionsTimetable}
                    disabled={isLoading}
                    className="w-full px-4 py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-lg font-medium hover:from-amber-700 hover:to-amber-800 transition-all duration-300 shadow-sm hover:shadow-md flex items-center justify-center gap-2 group"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin group-hover:rotate-180 transition-transform" />
                        Loading...
                      </>
                    ) : (
                      <>
                        <TrendingUp className="w-4 h-4 group-hover:scale-110 transition-transform" />
                        View All Schedules
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Group Selection */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Select Study Groups ({selectedDivisions.length} selected)
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={copySelectedToClipboard}
                      disabled={selectedDivisions.length === 0}
                      className={`text-sm font-medium flex items-center gap-1 transition-colors ${
                        selectedDivisions.length === 0
                          ? "text-gray-400 cursor-not-allowed"
                          : "text-blue-600 hover:text-blue-700"
                      }`}
                    >
                      <Copy className="w-3 h-3" />
                      Copy List
                    </button>
                    <button
                      onClick={selectAllDivisions}
                      className="text-sm text-amber-600 hover:text-amber-700 font-medium"
                    >
                      {selectedDivisions.length === Object.keys(allSchedules).length
                        ? "Deselect All"
                        : "Select All"}
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {divisions.map((division) => (
                    <button
                      key={division}
                      onClick={() => toggleDivisionSelection(division)}
                      disabled={!allSchedules[division]}
                      className={`px-4 py-2 rounded-lg border transition-all duration-300 flex items-center gap-2 group relative ${
                        selectedDivisions.includes(division)
                          ? "bg-gradient-to-r from-amber-600 to-amber-700 text-white border-amber-600 shadow-sm"
                          : allSchedules[division]
                          ? "bg-gradient-to-r from-gray-100 to-gray-50 text-gray-700 border-gray-300 hover:from-gray-200 hover:to-gray-100 hover:border-amber-300"
                          : "bg-gradient-to-r from-gray-50 to-gray-50/50 text-gray-400 border-gray-200 cursor-not-allowed"
                      }`}
                    >
                      <Folder className="w-3 h-3" />
                      {division}
                      {!allSchedules[division] && (
                        <span className="text-xs">(Not available)</span>
                      )}
                      {copiedDivisions.includes(division) && (
                        <div className="absolute -top-1 -right-1">
                          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></div>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-4 mb-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search by tutor, study time, or day..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 text-gray-900 placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all shadow-sm"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex bg-gradient-to-r from-gray-100 to-gray-50 rounded-lg p-1 border border-gray-200">
                    <button
                      onClick={() => setViewMode("grid")}
                      className={`px-3 py-2 rounded-md flex items-center gap-2 transition-all ${
                        viewMode === "grid"
                          ? "bg-gradient-to-r from-amber-100 to-amber-50 text-amber-600 border border-amber-200 shadow-sm"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      <Grid className="w-4 h-4" />
                      Notebook View
                    </button>
                    <button
                      onClick={() => setViewMode("list")}
                      className={`px-3 py-2 rounded-md flex items-center gap-2 transition-all ${
                        viewMode === "list"
                          ? "bg-gradient-to-r from-amber-100 to-amber-50 text-amber-600 border border-amber-200 shadow-sm"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      <List className="w-4 h-4" />
                      List View
                    </button>
                  </div>

                  <button
                    onClick={() => setShowEmptySlots(!showEmptySlots)}
                    className={`px-4 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-all duration-300 ${
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

              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="text-sm text-gray-500 flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  Showing {selectedDivisions.length} selected study groups
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={copySelectedToClipboard}
                    disabled={selectedDivisions.length === 0}
                    className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all duration-300 ${
                      selectedDivisions.length === 0
                        ? "bg-gradient-to-r from-gray-100 to-gray-50 text-gray-400 border border-gray-200 cursor-not-allowed"
                        : "bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-sm hover:shadow-md"
                    }`}
                  >
                    <Copy className="w-4 h-4" />
                    Copy Selected
                  </button>
                  <button
                    onClick={exportAllToText}
                    disabled={Object.keys(allSchedules).length === 0}
                    className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all duration-300 shadow-sm hover:shadow-md group ${
                      Object.keys(allSchedules).length === 0
                        ? "bg-gradient-to-r from-gray-100 to-gray-50 text-gray-400 border border-gray-200 cursor-not-allowed"
                        : "bg-gradient-to-r from-emerald-600 to-emerald-700 text-white hover:from-emerald-700 hover:to-emerald-800"
                    }`}
                  >
                    <FileText className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    Export All
                  </button>
                  <button
                    onClick={handlePrint}
                    disabled={selectedDivisions.length === 0}
                    className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all duration-300 shadow-sm hover:shadow-md group ${
                      selectedDivisions.length === 0
                        ? "bg-gradient-to-r from-gray-100 to-gray-50 text-gray-400 border border-gray-200 cursor-not-allowed"
                        : "bg-gradient-to-r from-amber-600 to-amber-700 text-white hover:from-amber-700 hover:to-amber-800"
                    }`}
                  >
                    <Printer className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    Print Selected
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Timetables Display */}
          {Object.keys(allSchedules).length > 0 ? (
            <div>
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

              {/* Tutor Legend */}
              <div className="mt-6 bg-white rounded-2xl p-6 border-2 border-amber-200 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                  <Highlighter className="w-4 h-4 text-amber-600" />
                  Tutor Legend ({availableFaculty.length} tutors available)
                </h3>
                <div className="flex flex-wrap gap-2">
                  <div className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gradient-to-br from-gray-100 to-gray-50 text-gray-500 italic border border-gray-200">
                    Self Study
                  </div>
                  {availableFaculty.map((faculty) => (
                    <div
                      key={faculty}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${getFacultyColor(faculty)}`}
                      title={faculty}
                    >
                      {faculty}
                    </div>
                  ))}
                  {availableFaculty.length === 0 && (
                    <div className="text-gray-500 italic text-xs">
                      No tutors assigned in loaded schedules
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-16 bg-gradient-to-br from-amber-50/50 to-blue-50/50 rounded-2xl border-2 border-dashed border-amber-200 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/20 to-transparent"></div>
              <div className="relative">
                <div className="inline-block p-6 bg-gradient-to-br from-amber-100 to-amber-50 rounded-2xl mb-6 border border-amber-200">
                  <File className="w-16 h-16 text-amber-500" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  {branch ? "No Study Schedules Found" : "Select Study Subject"}
                </h3>
                <p className="text-gray-600 mb-8 max-w-md mx-auto">
                  {branch
                    ? "Click 'Load All Groups' to view study schedules organized like notebook sections"
                    : "Choose a study subject and semester to preview schedules"}
                </p>
                {branch && (
                  <button
                    onClick={fetchAllDivisionsTimetable}
                    disabled={isLoading}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-lg hover:from-amber-700 hover:to-amber-800 transition-all duration-300 shadow-sm hover:shadow-md group"
                  >
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin group-hover:rotate-180 transition-transform" />
                    ) : (
                      <Eye className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    )}
                    Load All Study Groups
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Info Card */}
          <div className="mt-8 bg-gradient-to-r from-amber-50 to-blue-50 rounded-2xl p-8 border-2 border-amber-200 relative overflow-hidden">
            <div className="absolute top-4 right-4">
              <Bookmark className="w-8 h-8 text-amber-400/40" />
            </div>
            <div className="relative">
              <h3 className="font-bold text-amber-900 mb-6 flex items-center gap-3 text-lg">
                <div className="p-2 bg-gradient-to-br from-amber-100 to-amber-200 rounded-lg">
                  <Compass className="w-5 h-5 text-amber-700" />
                </div>
                Study Planner Guide
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
                      Load All Groups
                    </h4>
                  </div>
                  <p className="text-amber-700 text-sm leading-relaxed">
                    Click "Load All Groups" to fetch study schedules for all groups in the selected subject and semester.
                  </p>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                      <span className="text-xs font-bold text-blue-700">2</span>
                    </div>
                    <h4 className="font-semibold text-blue-800">
                      Select & Organize
                    </h4>
                  </div>
                  <p className="text-blue-700 text-sm leading-relaxed">
                    Select specific study groups to view, print, or export. Use search to filter by tutor or time.
                  </p>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-100 to-emerald-200 flex items-center justify-center">
                      <span className="text-xs font-bold text-emerald-700">3</span>
                    </div>
                    <h4 className="font-semibold text-emerald-800">
                      Export & Print
                    </h4>
                  </div>
                  <p className="text-emerald-700 text-sm leading-relaxed">
                    Export all schedules as text files or print selected groups for offline reference and sharing.
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
            size: auto;
            margin: 0.5cm;
          }

          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            background: white !important;
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

          .print\\:mb-20 {
            margin-bottom: 1.25rem !important;
          }

          .print\\:min-w-0 {
            min-width: 0 !important;
          }

          .print\\:division-break {
            page-break-before: always !important;
          }

          table {
            page-break-inside: avoid !important;
          }
        }
      `}</style>
    </div>
  );
}