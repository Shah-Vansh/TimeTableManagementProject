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
  MapPin,
  BookCheck,
  UserCheck,
  Zap,
  Plus,
  Trash2,
  Save,
  RefreshCw,
  DoorOpen,
  FolderPlus,
  Hash,
  User,
  X,
  Check,
} from "lucide-react";
import api from "../configs/api";
import Alert from "../components/Alert";

export default function PreviewFullTimetable() {
  const location = useLocation();
  const navigate = useNavigate();

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  
  const timeSlots = [
    { label: "9:00 - 10:00", value: "Time Slot 1" },
    { label: "10:00 - 11:00", value: "Time Slot 2" },
    { label: "11:45 - 12:45", value: "Time Slot 3" },
    { label: "12:45 - 01:45", value: "Time Slot 4" },
    { label: "02:00 - 03:00", value: "Time Slot 5" },
  ];

  const divisions = ["D1", "D2", "D3", "D4", "D5", "D6", "D7", "D8", "D9", "D10", "D11", "D12"];

  const branchColors = {
    CSE: "bg-gradient-to-r from-blue-100 to-blue-50 text-blue-700 border-blue-200",
    "CSE(AIML)": "bg-gradient-to-r from-purple-100 to-purple-50 text-purple-700 border-purple-200",
    DS: "bg-gradient-to-r from-emerald-100 to-emerald-50 text-emerald-700 border-emerald-200",
    ECE: "bg-gradient-to-r from-rose-100 to-rose-50 text-rose-700 border-rose-200",
    EEE: "bg-gradient-to-r from-indigo-100 to-indigo-50 text-indigo-700 border-indigo-200",
    ME: "bg-gradient-to-r from-violet-100 to-violet-50 text-violet-700 border-violet-200",
    CE: "bg-gradient-to-r from-teal-100 to-teal-50 text-teal-700 border-teal-200",
  };

  // Enhanced color mapping for subjects
  const subjectColors = [
    "bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 border-blue-200",
    "bg-gradient-to-r from-purple-50 to-purple-100 text-purple-700 border-purple-200",
    "bg-gradient-to-r from-emerald-50 to-emerald-100 text-emerald-700 border-emerald-200",
    "bg-gradient-to-r from-rose-50 to-rose-100 text-rose-700 border-rose-200",
    "bg-gradient-to-r from-indigo-50 to-indigo-100 text-indigo-700 border-indigo-200",
    "bg-gradient-to-r from-amber-50 to-amber-100 text-amber-700 border-amber-200",
    "bg-gradient-to-r from-cyan-50 to-cyan-100 text-cyan-700 border-cyan-200",
    "bg-gradient-to-r from-lime-50 to-lime-100 text-lime-700 border-lime-200",
    "bg-gradient-to-r from-pink-50 to-pink-100 text-pink-700 border-pink-200",
    "bg-gradient-to-r from-orange-50 to-orange-100 text-orange-700 border-orange-200",
  ];

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
  const [viewMode, setViewMode] = useState("grid");
  const [expandedDivision, setExpandedDivision] = useState(null);
  const [overallStats, setOverallStats] = useState({
    totalDivisions: 0,
    loadedDivisions: 0,
    totalSlots: 0,
    assignedSlots: 0,
    freeSlots: 0,
    facultyCount: 0,
    subjectCount: 0,
    roomsUsed: 0,
  });
  const [availableFaculty, setAvailableFaculty] = useState([]);
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [alert, setAlert] = useState(null);

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
    const allSubjects = new Set();
    const allRooms = new Set();

    Object.values(allSchedules).forEach((schedule) => {
      days.forEach((day) => {
        timeSlots.forEach((slot) => {
          const slotData = schedule[day][slot.value];
          if (slotData && slotData.faculty !== "free") {
            totalAssignedSlots++;
            allFaculty.add(slotData.faculty);
            if (slotData.subject) allSubjects.add(slotData.subject);
            if (slotData.room) allRooms.add(slotData.room);
          } else {
            totalFreeSlots++;
          }
        });
      });
    });

    const totalSlots = Object.keys(allSchedules).length * days.length * timeSlots.length;

    setAvailableFaculty(Array.from(allFaculty).sort());
    setAvailableSubjects(Array.from(allSubjects).sort());
    setAvailableRooms(Array.from(allRooms).sort());
    
    setOverallStats((prev) => ({
      ...prev,
      totalDivisions: divisions.length,
      loadedDivisions: Object.keys(allSchedules).length,
      totalSlots,
      assignedSlots: totalAssignedSlots,
      freeSlots: totalFreeSlots,
      facultyCount: allFaculty.size,
      subjectCount: allSubjects.size,
      roomsUsed: allRooms.size,
    }));
  };

  /* =======================
    GET SUBJECT COLOR
  ======================= */
  const getSubjectColor = (subject) => {
    if (!subject || subject === "") return "bg-gradient-to-r from-gray-50 to-gray-100 text-gray-500 border-gray-200";
    
    let hash = 0;
    for (let i = 0; i < subject.length; i++) {
      hash = subject.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return subjectColors[Math.abs(hash) % subjectColors.length];
  };

  /* =======================
    GET FACULTY COLOR
  ======================= */
  const getFacultyColor = (facultyName) => {
    if (facultyName === "free") return "bg-gradient-to-r from-gray-50 to-gray-100 text-gray-500 border-gray-200";
    
    const colors = [
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
    ];

    let hash = 0;
    for (let i = 0; i < facultyName.length; i++) {
      hash = facultyName.charCodeAt(i) + ((hash << 5) - hash);
    }

    return colors[Math.abs(hash) % colors.length];
  };

  /* =======================
   FETCH ALL DIVISIONS FULL TIMETABLE
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
    setAvailableFaculty([]);
    setAvailableSubjects([]);
    setAvailableRooms([]);

    try {
      const schedules = {};
      let loadedCount = 0;
      
      for (const division of divisions) {
        try {
          const response = await api.get("/api/timetable/fetchfulltimetable", {
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

          const formattedSchedule = {};
          days.forEach((day) => {
            formattedSchedule[day] = {};
            timeSlots.forEach((slot) => {
              const slotData = fetchedSchedule[day]?.[slot.value];
              if (slotData) {
                formattedSchedule[day][slot.value] = slotData;
              } else {
                formattedSchedule[day][slot.value] = {
                  faculty: "free",
                  subject: "",
                  room: "",
                  faculty_id: ""
                };
              }
            });
          });

          schedules[division] = formattedSchedule;
          loadedCount++;

          setSelectedDivisions((prev) => [...prev, division]);
        } catch (error) {
          console.warn(`No timetable found for ${division}:`, error);
          showAlert(
            `No timetable found for ${division}`,
            error.response?.data?.error || "Division not found",
            "warning"
          );
        }
      }

      setAllSchedules(schedules);

      if (loadedCount === 0) {
        setErrorMsg(`No timetables found for ${branch} - Semester ${sem}`);
      } else {
        setSuccessMsg(
          `Loaded ${loadedCount} division timetables for ${branch} - Semester ${sem}`
        );
        setTimeout(() => setSuccessMsg(""), 3000);
        updateOverallStatistics();
      }
    } catch (error) {
      console.error("Error fetching timetables:", error);
      showAlert(
        "Error fetching timetables",
        error.response?.data?.error || "Network error",
        "error"
      );
      setErrorMsg("Failed to load timetables. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  /* =======================
      EXPORT FUNCTIONS
  ======================= */
  const exportAllToText = () => {
    if (Object.keys(allSchedules).length === 0) return;

    let content = `COMPLETE TIMETABLE - ${branch} - Semester ${sem}\n`;
    content += `Generated on: ${new Date().toLocaleString()}\n`;
    content += "=".repeat(100) + "\n\n";

    content += `OVERALL STATISTICS:\n`;
    content += `- Total Divisions: ${overallStats.totalDivisions}\n`;
    content += `- Loaded Divisions: ${overallStats.loadedDivisions}\n`;
    content += `- Total Slots: ${overallStats.totalSlots}\n`;
    content += `- Assigned Slots: ${overallStats.assignedSlots}\n`;
    content += `- Free Slots: ${overallStats.freeSlots}\n`;
    content += `- Unique Faculty: ${overallStats.facultyCount}\n`;
    content += `- Subjects: ${overallStats.subjectCount}\n`;
    content += `- Rooms Used: ${overallStats.roomsUsed}\n\n`;

    content += "=".repeat(100) + "\n\n";

    Object.entries(allSchedules).forEach(([division, schedule]) => {
      content += `DIVISION: ${division}\n`;
      content += "-".repeat(50) + "\n";

      days.forEach((day) => {
        content += `${day.toUpperCase()}\n`;
        timeSlots.forEach((slot) => {
          const slotData = schedule[day][slot.value];
          if (slotData.faculty === "free") {
            content += `  ${slot.label}: FREE\n`;
          } else {
            content += `  ${slot.label}: ${slotData.faculty} | ${slotData.subject} | Room: ${slotData.room || 'N/A'}\n`;
          }
        });
        content += "\n";
      });

      content += "\n" + "=".repeat(100) + "\n\n";
    });

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${branch}_Sem${sem}_Complete_Timetable_${new Date().toISOString().split("T")[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setSuccessMsg("Complete timetables exported as text file");
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  const handlePrint = () => {
    window.print();
  };

  /* =======================
     TOGGLE DIVISION SELECTION
  ======================= */
  const toggleDivisionSelection = (division) => {
    if (selectedDivisions.includes(division)) {
      setSelectedDivisions((prev) => prev.filter((d) => d !== division));
    } else {
      if (allSchedules[division]) {
        setSelectedDivisions((prev) => [...prev, division]);
      } else {
        showAlert(
          "Timetable not loaded",
          `Timetable for ${division} is not available. Please load all divisions first.`,
          "warning"
        );
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
        const slotData = schedule[day][slot.value];
        if (showEmptySlots || slotData.faculty !== "free") {
          if (searchQuery) {
            const query = searchQuery.toLowerCase();
            const searchStr = `
              ${slotData.faculty || ""}
              ${slotData.subject || ""}
              ${slotData.room || ""}
              ${slot.label}
              ${day}
            `.toLowerCase();
            
            if (searchStr.includes(query)) {
              filtered[day][slot.value] = slotData;
            }
          } else {
            filtered[day][slot.value] = slotData;
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
   RENDER SLOT CONTENT
  ======================= */
  const renderSlotContent = (slotData) => {
    if (!slotData || slotData.faculty === "free") {
      return (
        <div className="text-center">
          <span className="text-gray-500 italic text-xs">Free Slot</span>
        </div>
      );
    }

    return (
      <div className="space-y-1">
        {/* Faculty Name */}
        <div className={`px-2 py-1 rounded text-xs font-semibold ${getFacultyColor(slotData.faculty)}`}>
          {slotData.faculty}
        </div>
        
        {/* Subject */}
        {slotData.subject && (
          <div className={`px-2 py-1 rounded text-xs ${getSubjectColor(slotData.subject)}`}>
            {slotData.subject}
          </div>
        )}
        
        {/* Room */}
        {slotData.room && (
          <div className="px-2 py-1 bg-amber-50 rounded text-xs text-amber-700">
            Room: {slotData.room}
          </div>
        )}
      </div>
    );
  };

  /* =======================
   RENDER DIVISION TIMETABLE (AutoBranchTimetable style with print support)
  ======================= */
  const renderDivisionTimetable = (division, schedule) => {
    const filteredSchedule = getFilteredSchedule(schedule);

    return (
      <div key={division} className="mb-8 last:mb-0 print:mb-4">
        {/* Division Header */}
        <div className="flex items-center justify-between mb-4 print:mb-2 pt-5">
          <div className="flex items-center gap-3">
            <div
              className={`px-4 py-2 rounded-lg ${
                branchColors[branch] ||
                "bg-gradient-to-r from-gray-50 to-gray-100"
              } print:px-2 print:py-1 border print:border-gray-300`}
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

        {/* Timetable Table */}
        <div
          className={`${
            expandedDivision === division || viewMode === "grid"
              ? "block"
              : "hidden print:block"
          }`}
        >
          <div className="bg-white rounded-xl border border-indigo-200 shadow-sm overflow-hidden print:rounded-none print:shadow-none print:mb-20 print:border-0">
            <div className="overflow-x-auto print:overflow-visible">
              <table className="w-full print:min-w-full print:border-collapse">
                <thead className="bg-gray-50 print:bg-gray-100">
                  <tr className="print:border print:border-gray-300">
                    <th className="p-3 text-left text-xs font-medium text-gray-700 print:p-2 print:text-xs print:font-semibold print:text-gray-700 print:border print:border-gray-300 print:min-w-0 print:w-24">
                      <div className="flex items-center gap-2 print:block print:text-center">
                        <Clock className="w-4 h-4 text-indigo-500 print:hidden" />
                        <span className="font-medium text-gray-900 print:text-xs">
                          Time
                        </span>
                      </div>
                    </th>
                    {days.map((day) => (
                      <th
                        key={day}
                        className="p-3 text-left text-xs font-medium text-gray-700 print:p-2 print:text-xs print:font-semibold print:text-gray-700 print:border print:border-gray-300 print:min-w-0"
                      >
                        <div className="print:text-center">
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
                        <td className="p-3 text-sm font-medium text-gray-900 print:p-2 print:text-xs print:border print:border-gray-300 print:bg-gray-50">
                          <div className="flex items-center gap-2 print:block print:text-center">
                            <span className="font-medium text-gray-900 print:text-xs print:font-normal">
                              {slot.label}
                            </span>
                          </div>
                        </td>
                        {days.map((day) => {
                          const slotData =
                            filteredSchedule && filteredSchedule[day]
                              ? filteredSchedule[day][slot.value]
                              : schedule[day][slot.value];

                          if (slotData === undefined)
                            return (
                              <td
                                key={day}
                                className="p-3 print:p-2 print:border print:border-gray-300"
                              ></td>
                            );

                          return (
                            <td
                              key={day}
                              className="p-3 print:p-2 print:border print:border-gray-300"
                            >
                              <div className="px-3 py-2 rounded-lg border transition-all print:p-1 print:rounded-sm bg-white print:border-0 print:text-xs">
                                {renderSlotContent(slotData)}
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
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-violet-50 p-4 md:p-6 print:p-0">
      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          @page {
            size: landscape;
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

          .print\\:mb-20 {
            margin-bottom: 5rem !important;
          }

          table {
            page-break-inside: avoid !important;
          }

          .division-break {
            page-break-before: always !important;
          }
        }
      `}</style>

      {/* Decorative Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none print:hidden">
        <div className="absolute top-20 right-10 w-72 h-72 bg-gradient-to-br from-indigo-100 to-transparent rounded-full opacity-40"></div>
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-gradient-to-tr from-violet-100 to-transparent rounded-full opacity-30"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto print:max-w-none">
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
              onClick={() => navigate("/timetable")}
              className="hover:text-gray-700 cursor-pointer flex items-center gap-1"
            >
              <Notebook className="w-3 h-3" />
              Timetable
            </button>
            <ChevronRight className="w-4 h-4 mx-2" />
            <span className="font-medium text-indigo-600 flex items-center gap-1">
              <ClipboardList className="w-4 h-4" />
              Complete Timetable View
            </span>
          </div>
        </div>

        {/* Header */}
        <div className="print:hidden flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Complete Timetable View
            </h1>
            <p className="text-gray-600">
              View complete timetable with faculty, subject, and room details
            </p>
          </div>
          <div className="p-3 bg-white rounded-xl border border-indigo-200 shadow-sm">
            <Grid className="w-6 h-6 text-indigo-600" />
          </div>
        </div>

        {/* View Toggle */}
        <div className="print:hidden mb-6">
          <div className="flex bg-gradient-to-r from-indigo-100 to-indigo-50 rounded-lg p-1 border border-indigo-200 w-fit">
            <button
              onClick={() => setViewMode("grid")}
              className={`px-4 py-2 rounded-md flex items-center gap-2 transition-all ${
                viewMode === "grid"
                  ? "bg-white shadow-sm text-indigo-600 border border-indigo-200"
                  : "text-indigo-700 hover:text-indigo-900 hover:bg-indigo-50/50"
              }`}
            >
              <Grid className="w-4 h-4" />
              Grid View
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`px-4 py-2 rounded-md flex items-center gap-2 transition-all ${
                viewMode === "list"
                  ? "bg-white shadow-sm text-indigo-600 border border-indigo-200"
                  : "text-indigo-700 hover:text-indigo-900 hover:bg-indigo-50/50"
              }`}
            >
              <List className="w-4 h-4" />
              List View
            </button>
          </div>
        </div>

        {/* Control Panel */}
        <div className="print:hidden bg-white rounded-2xl p-6 border border-indigo-200 shadow-sm mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-gradient-to-br from-indigo-100 to-indigo-50 rounded-lg border border-indigo-200">
              <Compass className="w-5 h-5 text-indigo-600" />
            </div>
            <h2 className="text-lg font-bold text-indigo-900">
              Load Timetables
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* Semester */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-indigo-600" />
                Semester
              </label>
              <select
                value={sem}
                onChange={(e) => setSem(Number(e.target.value))}
                className="w-full px-4 py-3 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                  <option key={s} value={s}>
                    Semester {s}
                  </option>
                ))}
              </select>
            </div>

            {/* Branch */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Building className="w-4 h-4 text-emerald-600" />
                Branch
              </label>
              <select
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                className="w-full px-4 py-3 border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
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

            {/* Load Button */}
            <div className="flex items-end">
              <button
                onClick={fetchAllDivisionsTimetable}
                disabled={isLoading}
                className={`w-full px-4 py-3 rounded-lg font-medium transition-all duration-300 flex items-center justify-center gap-2 ${
                  isLoading
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-indigo-600 to-indigo-700 text-white hover:from-indigo-700 hover:to-indigo-800 shadow-sm hover:shadow-md"
                }`}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <Eye className="w-5 h-5" />
                    Load Complete Timetables
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Division Selection */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
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
                  className={`px-4 py-2 rounded-lg border transition-all flex items-center gap-2 ${
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
                  placeholder="Search by faculty, subject, room..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowEmptySlots(!showEmptySlots)}
                className={`px-4 py-3 rounded-lg font-medium flex items-center gap-2 ${
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
                className={`px-4 py-3 rounded-lg font-medium flex items-center gap-2 ${
                  Object.keys(allSchedules).length === 0
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-emerald-600 to-emerald-700 text-white hover:from-emerald-700 hover:to-emerald-800"
                }`}
              >
                <FileText className="w-4 h-4" />
                Export All
              </button>

              <button
                onClick={handlePrint}
                disabled={selectedDivisions.length === 0}
                className={`px-4 py-3 rounded-lg font-medium flex items-center gap-2 ${
                  selectedDivisions.length === 0
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-indigo-600 to-indigo-700 text-white hover:from-indigo-700 hover:to-indigo-800"
                }`}
              >
                <Printer className="w-4 h-4" />
                Print Selected
              </button>
            </div>
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

        {/* Enhanced Statistics Cards (AutoBranchTimetable style) */}
        {Object.keys(allSchedules).length > 0 && (
          <div className="print:hidden bg-white rounded-2xl p-6 border border-indigo-200 shadow-sm mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-gradient-to-br from-emerald-100 to-emerald-50 rounded-lg border border-emerald-200">
                <BarChart3 className="w-5 h-5 text-emerald-600" />
              </div>
              <h2 className="text-lg font-bold text-emerald-900">
                Overall Statistics
              </h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-4 rounded-lg border border-indigo-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-indigo-700">Total Divisions</p>
                    <p className="text-2xl font-bold text-indigo-900 mt-1">
                      {overallStats.totalDivisions}
                    </p>
                  </div>
                  <Users className="w-8 h-8 text-indigo-600 opacity-60" />
                </div>
              </div>

              <div className="bg-gradient-to-br from-teal-50 to-teal-100 p-4 rounded-lg border border-teal-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-teal-700">Loaded Divisions</p>
                    <p className="text-2xl font-bold text-teal-900 mt-1">
                      {overallStats.loadedDivisions}
                    </p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-teal-600 opacity-60" />
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-purple-700">Faculty</p>
                    <p className="text-2xl font-bold text-purple-900 mt-1">
                      {overallStats.facultyCount}
                    </p>
                  </div>
                  <UserCheck className="w-8 h-8 text-purple-600 opacity-60" />
                </div>
              </div>

              <div className="bg-gradient-to-br from-rose-50 to-rose-100 p-4 rounded-lg border border-rose-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-rose-700">Subjects</p>
                    <p className="text-2xl font-bold text-rose-900 mt-1">
                      {overallStats.subjectCount}
                    </p>
                  </div>
                  <BookCheck className="w-8 h-8 text-rose-600 opacity-60" />
                </div>
              </div>

              <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-4 rounded-lg border border-amber-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-amber-700">Rooms Used</p>
                    <p className="text-2xl font-bold text-amber-900 mt-1">
                      {overallStats.roomsUsed}
                    </p>
                  </div>
                  <MapPin className="w-8 h-8 text-amber-600 opacity-60" />
                </div>
              </div>

              <div className="bg-gradient-to-br from-violet-50 to-violet-100 p-4 rounded-lg border border-violet-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-violet-700">Assigned Slots</p>
                    <p className="text-2xl font-bold text-violet-900 mt-1">
                      {overallStats.assignedSlots}
                    </p>
                  </div>
                  <Calendar className="w-8 h-8 text-violet-600 opacity-60" />
                </div>
              </div>

              <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-700">Free Slots</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {overallStats.freeSlots}
                    </p>
                  </div>
                  <Clock className="w-8 h-8 text-gray-600 opacity-60" />
                </div>
              </div>

              <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 p-4 rounded-lg border border-cyan-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-cyan-700">Total Slots</p>
                    <p className="text-2xl font-bold text-cyan-900 mt-1">
                      {overallStats.totalSlots}
                    </p>
                  </div>
                  <Grid className="w-8 h-8 text-cyan-600 opacity-60" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Generated Timetables (AutoBranchTimetable style) */}
        {Object.keys(allSchedules).length > 0 ? (
          <div className="space-y-6">
            <div className="print:hidden flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-100 to-blue-50 rounded-lg border border-blue-200">
                <Grid className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="text-lg font-bold text-blue-900">
                Loaded Timetables ({selectedDivisions.length} selected)
              </h3>
            </div>

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

            {/* Legend Section */}
            <div className="print:hidden mt-8 space-y-6">
              {/* Faculty Legend */}
              <div className="bg-white rounded-2xl p-6 border border-indigo-200 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-gradient-to-br from-indigo-100 to-indigo-50 rounded-lg border border-indigo-200">
                    <UserCheck className="w-5 h-5 text-indigo-600" />
                  </div>
                  <h3 className="text-lg font-bold text-indigo-900">
                    Faculty Legend ({availableFaculty.length} faculty)
                  </h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {availableFaculty.map((faculty) => (
                    <div
                      key={faculty}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium ${getFacultyColor(
                        faculty
                      )} border`}
                    >
                      {faculty}
                    </div>
                  ))}
                </div>
              </div>

              {/* Subject Legend */}
              <div className="bg-white rounded-2xl p-6 border border-emerald-200 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-gradient-to-br from-emerald-100 to-emerald-50 rounded-lg border border-emerald-200">
                    <BookCheck className="w-5 h-5 text-emerald-600" />
                  </div>
                  <h3 className="text-lg font-bold text-emerald-900">
                    Subject Legend ({availableSubjects.length} subjects)
                  </h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {availableSubjects.map((subject) => (
                    <div
                      key={subject}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium ${getSubjectColor(
                        subject
                      )} border`}
                    >
                      {subject}
                    </div>
                  ))}
                </div>
              </div>

              {/* Room Legend */}
              <div className="bg-white rounded-2xl p-6 border border-amber-200 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-gradient-to-br from-amber-100 to-amber-50 rounded-lg border border-amber-200">
                    <MapPin className="w-5 h-5 text-amber-600" />
                  </div>
                  <h3 className="text-lg font-bold text-amber-900">
                    Room Legend ({availableRooms.length} rooms)
                  </h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {availableRooms.map((room) => (
                    <div
                      key={room}
                      className="px-3 py-1.5 rounded-lg text-sm font-medium bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 border border-gray-200"
                    >
                      Room {room}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Action Buttons at Bottom */}
            <div className="print:hidden flex items-center gap-4 pt-6 border-t border-gray-200">
              <button
                onClick={exportAllToText}
                disabled={Object.keys(allSchedules).length === 0}
                className={`px-6 py-3 rounded-lg font-medium flex items-center gap-2 ${
                  Object.keys(allSchedules).length === 0
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-emerald-600 to-emerald-700 text-white hover:from-emerald-700 hover:to-emerald-800"
                }`}
              >
                <FileText className="w-4 h-4" />
                Export All to Text
              </button>
              <button
                onClick={handlePrint}
                disabled={selectedDivisions.length === 0}
                className={`px-6 py-3 rounded-lg font-medium flex items-center gap-2 ${
                  selectedDivisions.length === 0
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-indigo-600 to-indigo-700 text-white hover:from-indigo-700 hover:to-indigo-800"
                }`}
              >
                <Printer className="w-4 h-4" />
                Print Selected
              </button>
            </div>
          </div>
        ) : (
          /* Empty State */
          <div className="print:hidden text-center py-12 bg-white rounded-2xl border-2 border-dashed border-indigo-200">
            <div className="inline-block p-6 bg-gradient-to-br from-indigo-100 to-indigo-50 rounded-2xl mb-6 border border-indigo-200">
              <BookCheck className="w-16 h-16 text-indigo-500" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              {branch ? "No Timetables Loaded" : "Select a Branch"}
            </h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              {branch
                ? "Click 'Load Complete Timetables' to view detailed timetables with faculty, subject, and room information for all divisions."
                : "Choose branch and semester to preview complete timetables with detailed information"}
            </p>
            <button
              onClick={fetchAllDivisionsTimetable}
              disabled={!branch.trim()}
              className={`inline-flex items-center px-6 py-3 rounded-lg font-medium ${
                !branch.trim()
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-indigo-600 to-indigo-700 text-white hover:from-indigo-700 hover:to-indigo-800"
              }`}
            >
              <Loader2 className="w-5 h-5 mr-2" />
              Load Complete Timetables
            </button>
          </div>
        )}

        {/* Print Footer */}
        <div className="hidden print:block print:mt-8 print:pt-4 print:border-t print:border-gray-300 print:text-center print:text-xs print:text-gray-500">
          <p>
            Complete Timetable - {branch} - Semester {sem} - Generated by Timetable Management System
          </p>
          <p>Printed on {new Date().toLocaleDateString()} • Contains faculty, subject, and room details</p>
        </div>
      </div>
    </div>
  );
}