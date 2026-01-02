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
} from "lucide-react";
import api from "../configs/api";

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
    "D8",
    "D9",
    "D10",
    "D11",
    "D12",
  ];

  const branchColors = {
    CSE: "bg-blue-100 text-blue-700 border-blue-200",
    "CSE(AIML)": "bg-purple-100 text-purple-700 border-purple-200",
    DS: "bg-emerald-100 text-emerald-700 border-emerald-200",
    ECE: "bg-red-100 text-red-700 border-red-200",
    EEE: "bg-indigo-100 text-indigo-700 border-indigo-200",
    ME: "bg-orange-100 text-orange-700 border-orange-200",
    CE: "bg-teal-100 text-teal-700 border-teal-200",
  };

  const facultyColors = {
    free: "bg-gray-100 text-gray-700 border-gray-200",
    ABC: "bg-blue-50 text-blue-700 border-blue-200",
    DEF: "bg-purple-50 text-purple-700 border-purple-200",
    XYZ: "bg-amber-50 text-amber-700 border-amber-200",
    PQR: "bg-red-50 text-red-700 border-red-200",
    LMN: "bg-indigo-50 text-indigo-700 border-indigo-200",
    JKL: "bg-pink-50 text-pink-700 border-pink-200",
    GHI: "bg-cyan-50 text-cyan-700 border-cyan-200",
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

  /* =======================
     🔹 FETCH ALL DIVISIONS TIMETABLE
  ======================= */
  // const fetchAllDivisionsTimetable = async () => {
  //   if (!branch.trim()) {
  //     setErrorMsg("Please select a branch first");
  //     return;
  //   }

  //   setIsLoading(true);
  //   setErrorMsg("");
  //   setSuccessMsg("");
  //   setAllSchedules({});
  //   setSelectedDivisions([]);

  //   try {
  //     const schedules = {};
  //     let loadedCount = 0;
  //     let totalAssignedSlots = 0;
  //     let totalFreeSlots = 0;
  //     const allFaculty = new Set();

  //     // Fetch timetable for each division
  //     for (const division of divisions) {
  //       try {
  //         const response = await api.get("/api/fetchtimetable", {
  //           params: {
  //             sem: sem,
  //             branch: branch,
  //             class: division,
  //           },
  //         });

  //         const fetchedSchedule = response.data.schedule;

  //         // Convert schedule to our format
  //         const formattedSchedule = {};
  //         days.forEach((day) => {
  //           formattedSchedule[day] = {};
  //           timeSlots.forEach((slot) => {
  //             formattedSchedule[day][slot.value] =
  //               fetchedSchedule[day]?.[slot.value] || "free";

  //             // Collect statistics
  //             const faculty = formattedSchedule[day][slot.value];
  //             if (faculty === "free") {
  //               totalFreeSlots++;
  //             } else {
  //               totalAssignedSlots++;
  //               allFaculty.add(faculty);
  //             }
  //           });
  //         });

  //         schedules[division] = formattedSchedule;
  //         loadedCount++;

  //         // Select this division by default
  //         setSelectedDivisions((prev) => [...prev, division]);
  //       } catch (error) {
  //         console.warn(`No timetable found for ${division}:`, error);
  //         // Continue with other divisions
  //       }
  //     }

  //     setAllSchedules(schedules);

  //     // Calculate overall statistics
  //     const totalSlots = loadedCount * days.length * timeSlots.length;
  //     setOverallStats({
  //       totalDivisions: divisions.length,
  //       loadedDivisions: loadedCount,
  //       totalSlots,
  //       assignedSlots: totalAssignedSlots,
  //       freeSlots: totalFreeSlots,
  //       facultyCount: allFaculty.size,
  //     });

  //     if (loadedCount === 0) {
  //       setErrorMsg(`No timetables found for ${branch} - Semester ${sem}`);
  //     } else {
  //       setSuccessMsg(
  //         `Loaded ${loadedCount} division timetables for ${branch} - Semester ${sem}`
  //       );
  //       setTimeout(() => setSuccessMsg(""), 3000);
  //     }
  //   } catch (error) {
  //     console.error("Error fetching timetables:", error);
  //     setErrorMsg("Failed to load timetables. Please try again.");
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  /* =======================
     🔹 FETCH SINGLE DIVISION TIMETABLE
  ======================= */
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
      throw error;
    }
  };

  /* =======================
   🔹 UPDATE OVERALL STATISTICS
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
   🔹 FETCH ALL DIVISIONS TIMETABLE
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
          const response = await api.get("/api/fetchtimetable", {
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
      setErrorMsg("Failed to load timetables. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  /* =======================
     🔹 EXPORT FUNCTIONS
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

  const exportToPDF = () => {
    setSuccessMsg("PDF export feature coming soon!");
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  const handlePrint = () => {
    window.print();
  };

  // Generate a consistent color for any faculty name
  const getFacultyColor = (facultyName) => {
    const colors = [
      "bg-blue-50 text-blue-700 border-blue-200",
      "bg-purple-50 text-purple-700 border-purple-200",
      "bg-amber-50 text-amber-700 border-amber-200",
      "bg-red-50 text-red-700 border-red-200",
      "bg-indigo-50 text-indigo-700 border-indigo-200",
      "bg-pink-50 text-pink-700 border-pink-200",
      "bg-cyan-50 text-cyan-700 border-cyan-200",
      "bg-emerald-50 text-emerald-700 border-emerald-200",
      "bg-orange-50 text-orange-700 border-orange-200",
      "bg-teal-50 text-teal-700 border-teal-200",
      "bg-violet-50 text-violet-700 border-violet-200",
      "bg-rose-50 text-rose-700 border-rose-200",
    ];

    // Generate a consistent index from the faculty name
    let hash = 0;
    for (let i = 0; i < facultyName.length; i++) {
      hash = facultyName.charCodeAt(i) + ((hash << 5) - hash);
    }

    return colors[Math.abs(hash) % colors.length];
  };

  /* =======================
     🔹 TOGGLE DIVISION SELECTION
  ======================= */
  const toggleDivisionSelection = (division) => {
    if (selectedDivisions.includes(division)) {
      setSelectedDivisions((prev) => prev.filter((d) => d !== division));
    } else {
      // If timetable doesn't exist, fetch it
      if (!allSchedules[division]) {
        fetchSingleDivisionTimetable(division).catch(() => {
          setErrorMsg(`Failed to load timetable for ${division}`);
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
     🔹 FILTERED SCHEDULE
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
     🔹 INITIAL LOAD
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

    return (
      <div key={division} className="mb-8 last:mb-0">
        {/* Division Header */}
        <div className="flex items-center justify-between mb-4 print:mb-2 pt-5">
          <div className="flex items-center gap-3">
            <div
              className={`px-4 py-2 rounded-lg ${
                branchColors[branch] || "bg-gray-100"
              } print:px-2 print:py-1`}
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
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors print:hidden"
            >
              {expandedDivision === division ? (
                <ChevronUp className="w-5 h-5 text-gray-500" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-500" />
              )}
            </button>
          </div>

          <div className="print:hidden">
            <input
              type="checkbox"
              checked={selectedDivisions.includes(division)}
              onChange={() => toggleDivisionSelection(division)}
              className="w-4 h-4 text-blue-600 rounded"
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
                          <Clock className="w-4 h-4 text-gray-500 print:hidden" />
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
                        className="hover:bg-gray-50 transition-colors print:hover:bg-white print:border-b print:border-gray-300"
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
     🔹 RENDER
  ======================= */
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 p-4 md:p-6 print:p-0">
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
        {/* Header - Hidden in Print */}
        <div className="print:hidden mb-6">
          <div className="flex items-center text-sm text-gray-600 mb-4">
            <button
              onClick={() => navigate(-1)}
              className="hover:text-gray-800 cursor-pointer flex items-center gap-1"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <ChevronRight className="w-4 h-4 mx-2" />
            <span className="font-medium text-blue-600">
              Preview All Timetables
            </span>
          </div>
        </div>

        {/* Main Header - Hidden in Print */}
        <div className="print:hidden flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              All Divisions Timetable
            </h1>
            <p className="text-gray-600">
              View, print, and export timetables for all divisions
            </p>
          </div>
          <div className="p-3 bg-white rounded-xl border border-gray-200 shadow-sm">
            <Grid className="w-6 h-6 text-blue-600" />
          </div>
        </div>

        {/* Messages - Hidden in Print */}
        {errorMsg && (
          <div className="print:hidden mb-6 p-4 rounded-xl border border-red-200 bg-red-50 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-red-800">Error</p>
              <p className="text-red-600 text-sm mt-1">{errorMsg}</p>
            </div>
          </div>
        )}

        {successMsg && (
          <div className="print:hidden mb-6 p-4 rounded-xl border border-emerald-200 bg-emerald-50 flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-emerald-800">Success</p>
              <p className="text-emerald-600 text-sm mt-1">{successMsg}</p>
            </div>
          </div>
        )}

        {/* Control Panel - Hidden in Print */}
        <div className="print:hidden bg-white rounded-2xl p-6 border border-gray-200 shadow-sm mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Select Branch & Semester
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* Semester */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Semester
              </label>
              <div className="relative">
                <GraduationCap className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-blue-500" />
                <select
                  value={sem}
                  onChange={(e) => setSem(Number(e.target.value))}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
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
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
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
                className={`w-full px-4 py-3 rounded-lg font-medium transition-all duration-300 flex items-center justify-center gap-2 ${
                  isLoading
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-blue-700"
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
                className="text-sm text-blue-600 hover:text-blue-700"
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
                      ? "bg-blue-600 text-white border-blue-600"
                      : allSchedules[division]
                      ? "bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200"
                      : "bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed"
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
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by faculty, time, or day..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`px-3 py-2 rounded-md flex items-center gap-2 ${
                    viewMode === "grid"
                      ? "bg-white shadow-sm text-blue-600"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <Grid className="w-4 h-4" />
                  Grid
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`px-3 py-2 rounded-md flex items-center gap-2 ${
                    viewMode === "list"
                      ? "bg-white shadow-sm text-blue-600"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <List className="w-4 h-4" />
                  List
                </button>
              </div>

              <button
                onClick={() => setShowEmptySlots(!showEmptySlots)}
                className={`px-4 py-3 rounded-lg font-medium flex items-center gap-2 transition-all ${
                  showEmptySlots
                    ? "bg-blue-100 text-blue-700 border border-blue-200"
                    : "bg-gray-100 text-gray-700 border border-gray-200"
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
                className={`px-4 py-3 rounded-lg font-medium flex items-center gap-2 transition-all ${
                  Object.keys(allSchedules).length === 0
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-emerald-600 text-white hover:bg-emerald-700"
                }`}
              >
                <FileText className="w-4 h-4" />
                Export All
              </button>

              <button
                onClick={handlePrint}
                disabled={selectedDivisions.length === 0}
                className={`px-4 py-3 rounded-lg font-medium flex items-center gap-2 transition-all ${
                  selectedDivisions.length === 0
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                <Printer className="w-4 h-4" />
                Print Selected
              </button>
            </div>
          </div>
        </div>

        {/* Print Header - Only visible when printing */}
        {/* <div className="hidden print:block print:p-4 print:mb-4 print:border-b print:border-gray-300">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">
              Timetables - {branch} - Semester {sem}
            </h1>
            <p className="text-gray-600 mb-2">
              Divisions: {selectedDivisions.join(", ")}
            </p>
            <p className="text-sm text-gray-500">
              Generated on: {new Date().toLocaleString()}
            </p>
          </div>
        </div> */}

        {/* Statistics Cards - Hidden in Print */}
        {Object.keys(allSchedules).length > 0 && (
          <div className="print:hidden grid grid-cols-1 md:grid-cols-6 gap-6 mb-8">
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Divisions</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">
                    {overallStats.totalDivisions}
                  </p>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Loaded Divisions</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">
                    {overallStats.loadedDivisions}
                  </p>
                </div>
                <div className="p-3 bg-emerald-50 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-emerald-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Assigned Slots</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">
                    {overallStats.assignedSlots}
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
                  <p className="text-sm text-gray-600">Free Slots</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">
                    {overallStats.freeSlots}
                  </p>
                </div>
                <div className="p-3 bg-amber-50 rounded-lg">
                  <Clock className="w-6 h-6 text-amber-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Slots</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">
                    {overallStats.totalSlots}
                  </p>
                </div>
                <div className="p-3 bg-indigo-50 rounded-lg">
                  <Grid className="w-6 h-6 text-indigo-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Faculty Count</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">
                    {overallStats.facultyCount}
                  </p>
                </div>
                <div className="p-3 bg-cyan-50 rounded-lg">
                  <GraduationCap className="w-6 h-6 text-cyan-600" />
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

            {/* Faculty Legend - Hidden in Print */}
            {/* Faculty Legend - Hidden in Print */}
            <div className="print:hidden mt-6 bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">
                Faculty Legend ({availableFaculty.length} faculty found)
              </h3>
              <div className="flex flex-wrap gap-2">
                {/* Always show Free Slot first */}
                <div
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium ${facultyColors.free} border`}
                >
                  Free Slot
                </div>

                {/* Show only available faculty */}
                {availableFaculty.map((faculty) => (
                  <div
                    key={faculty}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium ${getFacultyColor(
                      faculty
                    )} border`}
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
          </div>
        ) : (
          /* Empty State */
          <div className="text-center py-12 print:hidden">
            <Grid className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {branch ? "No Timetables Loaded" : "Select a Branch"}
            </h3>
            <p className="text-gray-600">
              {branch
                ? "Click 'Load All Divisions' to view timetables for all divisions"
                : "Choose branch and semester to preview timetables"}
            </p>
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
