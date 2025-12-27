import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  Save,
  Trash2,
  RefreshCw,
  GraduationCap,
  Users,
  Calendar,
  Clock,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  Plus,
  Minus,
  Grid,
  Loader2,
  Eye,
  EyeOff,
} from "lucide-react";
import api from "../configs/api";

export default function TimeTable() {
  const location = useLocation();
  const days = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  const timeSlots = [
    { label: "8:00 - 9:00", value: "Time Slot 1" },
    { label: "9:00 - 10:00", value: "Time Slot 2" },
    { label: "10:00 - 11:00", value: "Time Slot 3" },
    { label: "11:00 - 12:00", value: "Time Slot 4" },
    { label: "12:00 - 1:00", value: "Time Slot 5" },
    { label: "1:00 - 2:00", value: "Time Slot 6" },
    { label: "2:00 - 3:00", value: "Time Slot 7" },
    { label: "3:00 - 4:00", value: "Time Slot 8" },
  ];

  const branchOptions = ["CSE", "CSE(AIML)", "DS", "ECE", "EEE", "ME", "CE"];
  const classOptions = ["D1", "D2", "D3", "D4", "A1", "A2", "B1", "B2"];

  const facultyOptions = [
    {
      value: "free",
      label: "Free",
      color: "border-emerald-200 bg-emerald-50 text-emerald-700",
      bgColor: "bg-emerald-50",
      textColor: "text-emerald-700",
    },
    {
      value: "ABC",
      label: "Dr. Smith (ABC)",
      color: "border-blue-200 bg-blue-50 text-blue-700",
      bgColor: "bg-blue-50",
      textColor: "text-blue-700",
    },
    {
      value: "DEF",
      label: "Prof. Johnson (DEF)",
      color: "border-purple-200 bg-purple-50 text-purple-700",
      bgColor: "bg-purple-50",
      textColor: "text-purple-700",
    },
    {
      value: "XYZ",
      label: "Dr. Williams (XYZ)",
      color: "border-amber-200 bg-amber-50 text-amber-700",
      bgColor: "bg-amber-50",
      textColor: "text-amber-700",
    },
    {
      value: "PQR",
      label: "Prof. Brown (PQR)",
      color: "border-red-200 bg-red-50 text-red-700",
      bgColor: "bg-red-50",
      textColor: "text-red-700",
    },
    {
      value: "LMN",
      label: "Dr. Davis (LMN)",
      color: "border-indigo-200 bg-indigo-50 text-indigo-700",
      bgColor: "bg-indigo-50",
      textColor: "text-indigo-700",
    },
    {
      value: "JKL",
      label: "Dr. Wilson (JKL)",
      color: "border-pink-200 bg-pink-50 text-pink-700",
      bgColor: "bg-pink-50",
      textColor: "text-pink-700",
    },
    {
      value: "GHI",
      label: "Dr. Taylor (GHI)",
      color: "border-cyan-200 bg-cyan-50 text-cyan-700",
      bgColor: "bg-cyan-50",
      textColor: "text-cyan-700",
    },
  ];

  /* =======================
     🔹 STATE
  ======================= */
  // Initialize from location state if available
  const [sem, setSem] = useState(location.state?.sem || 1);
  const [branch, setBranch] = useState(location.state?.branch || "CSE");
  const [className, setClassName] = useState(location.state?.className || "");
  const [isLoading, setIsLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [collapsedDays, setCollapsedDays] = useState({});
  const [existingTimetable, setExistingTimetable] = useState(false);
  const [showFreeSlots, setShowFreeSlots] = useState(true);

  const initialSchedule = days.reduce((acc, day) => {
    acc[day] = timeSlots.reduce((t, slot) => {
      t[slot.value] = "free";
      return t;
    }, {});
    return acc;
  }, {});

  const [schedule, setSchedule] = useState(initialSchedule);

  /* =======================
     🔹 FETCH TIMETABLE
  ======================= */
  const fetchTimetable = async () => {
    if (!className.trim()) {
      return;
    }

    setFetching(true);
    setErrorMsg("");
    setExistingTimetable(false);

    try {
      const response = await api.get("/api/fetchtimetable", {
        params: {
          sem: sem,
          branch: branch,
          class: className,
        },
      });

      const fetchedSchedule = response.data.schedule;

      // Update schedule state with fetched data
      const updatedSchedule = { ...initialSchedule };

      // Map fetched schedule to our state structure
      Object.keys(fetchedSchedule).forEach((day) => {
        Object.keys(fetchedSchedule[day]).forEach((timeSlot) => {
          if (
            updatedSchedule[day] &&
            updatedSchedule[day][timeSlot] !== undefined
          ) {
            updatedSchedule[day][timeSlot] = fetchedSchedule[day][timeSlot];
          }
        });
      });

      setSchedule(updatedSchedule);
      setExistingTimetable(true);
      setErrorMsg("");
    } catch (error) {
      console.error("Error fetching timetable:", error);

      if (error.response && error.response.status === 404) {
        // If no timetable exists, reset to initial
        setSchedule(initialSchedule);
        setExistingTimetable(false);
        setErrorMsg("No existing timetable found. You can create a new one.");
      } else {
        setErrorMsg("Failed to fetch timetable. Please try again.");
      }
    } finally {
      setFetching(false);
    }
  };

  /* =======================
     🔹 FETCH ON PARAMS CHANGE OR LOCATION STATE
  ======================= */
  useEffect(() => {
    // If we have location state (coming from dashboard), fetch immediately
    if (location.state?.className) {
      fetchTimetable();
    }
  }, []); // Run once on mount if location state exists

  useEffect(() => {
    if (className.trim()) {
      const debounceTimer = setTimeout(() => {
        fetchTimetable();
      }, 300);

      return () => clearTimeout(debounceTimer);
    } else {
      setSchedule(initialSchedule);
      setExistingTimetable(false);
      setErrorMsg("");
    }
  }, [sem, branch, className]);

  /* =======================
     🔹 HANDLERS
  ======================= */
  const handleFacultyChange = (day, timeSlot, value) => {
    setSchedule((prev) => ({
      ...prev,
      [day]: { ...prev[day], [timeSlot]: value },
    }));
    setSaved(false);
    setErrorMsg("");
  };

  const toggleDayCollapse = (day) => {
    setCollapsedDays((prev) => ({
      ...prev,
      [day]: !prev[day],
    }));
  };

  /* =======================
     🔹 SAVE/UPDATE TIMETABLE
  ======================= */
  const handleSubmit = async () => {
    if (!className.trim()) {
      setErrorMsg("Class name is required");
      return;
    }

    setIsLoading(true);
    setSaved(false);

    try {
      const formData = new FormData();
      formData.append("sem", sem);
      formData.append("branch", branch);
      formData.append("class", className);
      formData.append("schedule", JSON.stringify(schedule));

      const endpoint = existingTimetable ? "/api/timetable" : "/api/timetable";
      const res = await api.post(endpoint, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      console.log("Saved timetable:", res.data);
      setSaved(true);
      setExistingTimetable(true);
      setErrorMsg("");
    } catch (error) {
      console.error("Error saving timetable:", error);

      if (error.response && error.response.status === 409) {
        const data = error.response.data;
        const dayMap = {
          mon: "Monday",
          tue: "Tuesday",
          wed: "Wednesday",
          thu: "Thursday",
          fri: "Friday",
          sat: "Saturday",
        };

        setErrorMsg(
          `Faculty ${data.faculty} is already assigned on ${
            dayMap[data.day]
          } (${data.time_slot}). Please choose a different faculty member.`
        );
      } else {
        setErrorMsg("Failed to save timetable. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    if (existingTimetable) {
      fetchTimetable();
    } else {
      setSchedule(initialSchedule);
    }
    setSaved(false);
  };

  const handleClear = () => {
    if (window.confirm("Clear all faculty assignments?")) {
      setSchedule(initialSchedule);
      setSaved(false);
    }
  };

  const getFacultyStyle = (val) => {
    const faculty = facultyOptions.find((f) => f.value === val);
    return faculty || facultyOptions[0];
  };

  /* =======================
     🔹 RENDER
  ======================= */
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 p-4 md:p-6">
      {/* Decorative Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-100 to-transparent rounded-full opacity-20"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-emerald-100 to-transparent rounded-full opacity-10"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Breadcrumb */}
        <div className="mb-6">
          <div className="flex items-center text-sm text-gray-600 mb-4">
            <span className="hover:text-gray-800 cursor-pointer">Dashboard</span>
            <ChevronRight className="w-4 h-4 mx-2" />
            <span className="hover:text-gray-800 cursor-pointer">Timetable Management</span>
            <ChevronRight className="w-4 h-4 mx-2" />
            <span className="font-medium text-blue-600">
              {existingTimetable ? "Edit Timetable" : "Create Timetable"}
            </span>
          </div>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {existingTimetable ? "Edit Timetable" : "Create Timetable"}
            </h1>
            <p className="text-gray-600">
              {existingTimetable
                ? "Modify existing schedules or update faculty assignments"
                : "Assign faculty members to time slots and manage weekly schedules"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
              existingTimetable
                ? "bg-green-100 text-green-800 border border-green-200"
                : "bg-blue-100 text-blue-800 border border-blue-200"
            }`}>
              {existingTimetable ? "Existing Timetable" : "New Timetable"}
            </div>
            <div className="p-3 bg-white rounded-xl border border-gray-200 shadow-sm">
              <Grid className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Status Messages */}
        {errorMsg && (
          <div className={`mb-6 p-4 rounded-xl border flex items-start gap-3 ${
            errorMsg.includes("No existing") || errorMsg.includes("Failed to fetch")
              ? "border-amber-200 bg-amber-50"
              : errorMsg.includes("already assigned")
              ? "border-red-200 bg-red-50"
              : "border-red-200 bg-red-50"
          }`}>
            <AlertCircle className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
              errorMsg.includes("No existing") || errorMsg.includes("Failed to fetch")
                ? "text-amber-500"
                : "text-red-500"
            }`} />
            <div>
              <p className={`font-medium ${
                errorMsg.includes("No existing") || errorMsg.includes("Failed to fetch")
                  ? "text-amber-800"
                  : "text-red-800"
              }`}>
                {errorMsg.includes("No existing") || errorMsg.includes("Failed to fetch")
                  ? "Information"
                  : "Schedule Conflict"}
              </p>
              <p className={`text-sm mt-1 ${
                errorMsg.includes("No existing") || errorMsg.includes("Failed to fetch")
                  ? "text-amber-600"
                  : "text-red-600"
              }`}>
                {errorMsg}
              </p>
            </div>
          </div>
        )}

        {saved && (
          <div className="mb-6 p-4 rounded-xl border border-emerald-200 bg-emerald-50 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-500" />
            <div>
              <p className="font-medium text-emerald-800">
                Timetable {existingTimetable ? "Updated" : "Saved"} Successfully
              </p>
              <p className="text-emerald-600 text-sm mt-1">
                Your schedule has been {existingTimetable ? "updated" : "saved"} and is ready for use.
              </p>
            </div>
          </div>
        )}

        {/* Configuration Panel */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {location.state?.className ? "Editing Selected Timetable" : "Select/Create Timetable"}
            </h2>
            {fetching && (
              <div className="flex items-center gap-2 text-sm text-blue-600">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading...
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                    <option key={s} value={s}>Semester {s}</option>
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
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-emerald-500" />
                <select
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                >
                  {branchOptions.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Class */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Class
              </label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-purple-500" />
                <select
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                >
                  <option value="" className="text-gray-500">Select Class</option>
                  {classOptions.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Legend & Controls */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm flex-1">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Faculty Legend</h3>
            <div className="flex flex-wrap gap-2">
              {facultyOptions.map((faculty) => (
                <div
                  key={faculty.value}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium ${faculty.color} border`}
                >
                  {faculty.label}
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">View Options</h3>
            <div className="flex gap-2">
              <button
                onClick={() => setShowFreeSlots(!showFreeSlots)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2 ${
                  showFreeSlots
                    ? "bg-blue-100 text-blue-700 border border-blue-200"
                    : "bg-gray-100 text-gray-700 border border-gray-200"
                }`}
              >
                {showFreeSlots ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                {showFreeSlots ? "Show Free" : "Hide Free"}
              </button>
            </div>
          </div>
        </div>

        {/* Timetable */}
        {className && (
          <>
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-8">
              <div className="p-4 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">Weekly Schedule</h2>
                  <div className="flex items-center gap-4">
                    <div className="text-sm text-gray-600 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>8:00 AM - 4:00 PM</span>
                    </div>
                    <div className="text-sm text-gray-500">
                      {fetching ? "Loading..." : existingTimetable ? "Editing existing timetable" : "Creating new timetable"}
                    </div>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                    <tr>
                      <th className="w-32 p-4 text-left text-sm font-semibold text-gray-700 border-r border-gray-200">
                        Time Slot
                      </th>
                      {days.map((day) => (
                        <th key={day} className="p-4 text-left">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-gray-700">{day}</span>
                            <button
                              onClick={() => toggleDayCollapse(day)}
                              className="p-1 hover:bg-gray-200 rounded-lg transition-colors"
                            >
                              {collapsedDays[day] ? (
                                <Plus className="w-4 h-4 text-gray-500" />
                              ) : (
                                <Minus className="w-4 h-4 text-gray-500" />
                              )}
                            </button>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {timeSlots.map((slot) => (
                      <tr key={slot.value} className="hover:bg-gray-50 transition-colors">
                        <td className="p-4 border-r border-gray-200">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-gray-400" />
                            <span className="font-medium text-gray-900">{slot.label}</span>
                          </div>
                        </td>
                        {days.map((day) => {
                          const faculty = getFacultyStyle(schedule[day][slot.value]);
                          const isCollapsed = collapsedDays[day];
                          const isFree = schedule[day][slot.value] === "free";

                          // Hide if collapsed and free, or if free slots are hidden
                          if ((isCollapsed && isFree) || (!showFreeSlots && isFree)) {
                            return null;
                          }

                          return (
                            <td key={day} className="p-3">
                              <div className="relative">
                                <select
                                  value={schedule[day][slot.value]}
                                  onChange={(e) =>
                                    handleFacultyChange(day, slot.value, e.target.value)
                                  }
                                  className={`w-full p-2.5 rounded-lg border transition-all focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                    faculty.color
                                  } ${isCollapsed ? 'opacity-75' : ''}`}
                                >
                                  {facultyOptions.map((f) => (
                                    <option key={f.value} value={f.value}>
                                      {f.label}
                                    </option>
                                  ))}
                                </select>
                                {!isFree && !isCollapsed && (
                                  <div className="absolute -top-2 -right-2">
                                    <div className={`w-5 h-5 rounded-full flex items-center justify-center ${faculty.bgColor}`}>
                                      <div className={`w-2 h-2 rounded-full ${faculty.textColor}`}></div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Assigned Slots</p>
                    <p className="text-2xl font-bold text-gray-900 mt-2">
                      {Object.values(schedule).flatMap(day => 
                        Object.values(day).filter(val => val !== "free")
                      ).length}
                    </p>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <Clock className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Free Slots</p>
                    <p className="text-2xl font-bold text-gray-900 mt-2">
                      {Object.values(schedule).flatMap(day => 
                        Object.values(day).filter(val => val === "free")
                      ).length}
                    </p>
                  </div>
                  <div className="p-3 bg-emerald-50 rounded-lg">
                    <Users className="w-6 h-6 text-emerald-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Slots</p>
                    <p className="text-2xl font-bold text-gray-900 mt-2">
                      {days.length * timeSlots.length}
                    </p>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <Calendar className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-4 justify-center mb-12">
              <button
                onClick={handleSubmit}
                disabled={isLoading || !className.trim()}
                className={`px-8 py-3 rounded-lg font-medium flex items-center gap-2 transition-all duration-300 ${
                  isLoading || !className.trim()
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-sm hover:shadow-md"
                }`}
              >
                <Save className="w-5 h-5" />
                {isLoading
                  ? "Saving..."
                  : saved
                  ? `${existingTimetable ? "Updated" : "Saved"} Successfully`
                  : `${existingTimetable ? "Update" : "Save"} Timetable`}
              </button>

              <button
                onClick={handleClear}
                disabled={!className.trim()}
                className={`px-6 py-3 rounded-lg border font-medium flex items-center gap-2 transition-all duration-300 ${
                  !className.trim()
                    ? "border-gray-200 text-gray-400 cursor-not-allowed"
                    : "border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                <Trash2 className="w-5 h-5" />
                Clear All
              </button>

              <button
                onClick={handleReset}
                disabled={!className.trim()}
                className={`px-6 py-3 rounded-lg border font-medium flex items-center gap-2 transition-all duration-300 ${
                  !className.trim()
                    ? "border-gray-200 text-gray-400 cursor-not-allowed"
                    : "border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                <RefreshCw className="w-5 h-5" />
                {existingTimetable ? "Reset to Original" : "Reset to Default"}
              </button>
            </div>
          </>
        )}

        {/* Quick Tips */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
          <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            How It Works
          </h3>
          <ul className="space-y-2 text-blue-800 text-sm">
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-1.5"></div>
              <span><strong>Select semester, branch, and class</strong> - The system will automatically check if a timetable exists</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-1.5"></div>
              <span><strong>If timetable exists</strong> - It will be loaded for editing. Make changes and click "Update Timetable"</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-1.5"></div>
              <span><strong>If no timetable exists</strong> - All slots will be free. Assign faculty and click "Save Timetable"</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-1.5"></div>
              <span><strong>Use view options</strong> - Collapse days or hide free slots to focus on assigned slots</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}