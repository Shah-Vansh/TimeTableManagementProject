import React, { useState, useEffect } from "react";
import {
  Save,
  Trash2,
  RefreshCw,
  GraduationCap,
  Users,
  Calendar,
  Loader2,
} from "lucide-react";
import api from "../configs/api";

export default function EditTimetable() {
  const days = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  const timeSlots = [
    "Time Slot 1",
    "Time Slot 2",
    "Time Slot 3",
    "Time Slot 4",
  ];

  const additionalSlots = [
    "Time Slot 5",
    "Time Slot 6",
    "Time Slot 7",
    "Time Slot 8",
  ];

  const allTimeSlots = [...timeSlots, ...additionalSlots];

  /* =======================
     🔹 STATE
  ======================= */
  const [sem, setSem] = useState(1);
  const [branch, setBranch] = useState("CSE");
  const [className, setClassName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [initialLoad, setInitialLoad] = useState(false);

  const facultyOptions = [
    {
      value: "free",
      label: "Free",
      color: "text-green-600 bg-green-50 border-green-200",
    },
    {
      value: "ABC",
      label: "ABC",
      color: "text-blue-600 bg-blue-50 border-blue-200",
    },
    {
      value: "DEF",
      label: "DEF",
      color: "text-purple-600 bg-purple-50 border-purple-200",
    },
    {
      value: "XYZ",
      label: "XYZ",
      color: "text-amber-600 bg-amber-50 border-amber-200",
    },
    {
      value: "PQR",
      label: "PQR",
      color: "text-red-600 bg-red-50 border-red-200",
    },
    {
      value: "LMN",
      label: "LMN",
      color: "text-indigo-600 bg-indigo-50 border-indigo-200",
    },
    {
      value: "JKL",
      label: "JKL",
      color: "text-pink-600 bg-pink-50 border-pink-200",
    },
    {
      value: "GHI",
      label: "GHI",
      color: "text-cyan-600 bg-cyan-50 border-cyan-200",
    },
  ];

  const initialSchedule = days.reduce((acc, day) => {
    acc[day] = allTimeSlots.reduce((t, slot) => {
      t[slot] = "free";
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
      Object.keys(fetchedSchedule).forEach(day => {
        Object.keys(fetchedSchedule[day]).forEach(timeSlot => {
          if (updatedSchedule[day] && updatedSchedule[day][timeSlot] !== undefined) {
            updatedSchedule[day][timeSlot] = fetchedSchedule[day][timeSlot];
          }
        });
      });

      setSchedule(updatedSchedule);
      setInitialLoad(true);
    } catch (error) {
      console.error("Error fetching timetable:", error);
      
      if (error.response && error.response.status === 404) {
        // If no timetable exists, reset to initial
        setSchedule(initialSchedule);
        setInitialLoad(true);
      } else {
        setErrorMsg("❌ Failed to fetch timetable. Please try again.");
      }
    } finally {
      setFetching(false);
    }
  };

  /* =======================
     🔹 FETCH ON PARAMS CHANGE
  ======================= */
  useEffect(() => {
    if (className.trim()) {
      const debounceTimer = setTimeout(() => {
        fetchTimetable();
      }, 500); // Debounce to avoid too many requests

      return () => clearTimeout(debounceTimer);
    }
  }, [sem, branch, className]);

  const handleFacultyChange = (day, timeSlot, value) => {
    setSchedule((prev) => ({
      ...prev,
      [day]: { ...prev[day], [timeSlot]: value },
    }));
    setSaved(false);
  };

  /* =======================
     🔹 SUBMIT
  ======================= */
  const handleSubmit = async () => {
    if (!className.trim()) {
      alert("Class name is required");
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

      const res = await api.post("/api/timetable", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      console.log("Saved timetable:", res.data);
      setSaved(true);
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
          `❌ Faculty ${data.faculty} is already assigned on ${
            dayMap[data.day]
          } (${data.time_slot})`
        );
      } else {
        setErrorMsg("❌ Failed to save timetable. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    if (initialLoad) {
      fetchTimetable(); // Reset to fetched values
    } else {
      setSchedule(initialSchedule); // Reset to empty if nothing fetched
    }
    setSaved(false);
  };

  const handleClear = () => {
    if (window.confirm("Clear all selections?")) {
      setSchedule(initialSchedule);
      setSaved(false);
    }
  };

  const getFacultyColor = (val) =>
    facultyOptions.find((f) => f.value === val)?.color || "";

  return (
    <div className="min-h-screen p-6 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto">
        {/* =======================
            🔹 HEADER
        ======================= */}
        <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-6">
          Edit Timetable
        </h1>

        {/* =======================
            🔹 Error
        ======================= */}
        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl border border-red-300 bg-red-50 text-red-700 font-semibold">
            {errorMsg}
          </div>
        )}

        {/* =======================
            🔹 SEM + BRANCH + CLASS
        ======================= */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Semester */}
          <div className="relative">
            <GraduationCap className="absolute left-3 top-3 text-blue-500" />
            <select
              value={sem}
              onChange={(e) => setSem(Number(e.target.value))}
              className="w-full pl-10 p-3 rounded-xl border focus:ring-2 focus:ring-blue-500"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                <option key={s} value={s}>
                  Semester {s}
                </option>
              ))}
            </select>
          </div>

          {/* Branch */}
          <div className="relative">
            <Calendar className="absolute left-3 top-3 text-green-500" />
            <select
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              className="w-full pl-10 p-3 rounded-xl border focus:ring-2 focus:ring-green-500"
            >
              <option value="CSE">CSE</option>
              <option value="CSE(AIML)">CSE (AIML)</option>
              <option value="DS">DS</option>
            </select>
          </div>

          {/* Class */}
          <div className="relative">
            <Users className="absolute left-3 top-3 text-purple-500" />
            <div className="flex items-center">
              <input
                type="text"
                placeholder="Class (e.g. D1, A, B2)"
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                className="w-full pl-10 p-3 rounded-xl border focus:ring-2 focus:ring-purple-500"
              />
              {fetching && (
                <Loader2 className="ml-2 animate-spin text-purple-500" />
              )}
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Timetable will auto-fetch when class name is entered
            </p>
          </div>
        </div>

        {/* =======================
            🔹 TIMETABLE
        ======================= */}
        <div className="overflow-x-auto bg-white rounded-xl shadow">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
              <tr>
                <th className="p-4">Time</th>
                {days.map((d) => (
                  <th key={d} className="p-4">
                    {d}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {allTimeSlots.map((slot) => (
                <tr key={slot} className="border-b">
                  <td className="p-4 font-semibold">{slot}</td>
                  {days.map((day) => (
                    <td key={day} className="p-2">
                      <select
                        value={schedule[day][slot]}
                        onChange={(e) =>
                          handleFacultyChange(day, slot, e.target.value)
                        }
                        className={`w-full p-2 rounded-lg border ${getFacultyColor(
                          schedule[day][slot]
                        )}`}
                      >
                        {facultyOptions.map((f) => (
                          <option key={f.value} value={f.value}>
                            {f.label}
                          </option>
                        ))}
                      </select>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* =======================
            🔹 ACTIONS
        ======================= */}
        <div className="flex flex-wrap gap-4 justify-center mt-8">
          <button
            onClick={handleSubmit}
            disabled={isLoading || !className.trim()}
            className="px-8 py-4 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save />
                {saved ? "Saved" : "Save Timetable"}
              </>
            )}
          </button>

          <button
            onClick={handleClear}
            className="px-8 py-4 rounded-xl border text-red-600 flex items-center gap-2"
          >
            <Trash2 /> Clear All
          </button>

          <button
            onClick={handleReset}
            disabled={!className.trim()}
            className="px-8 py-4 rounded-xl border flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw /> Reset to Original
          </button>
        </div>
      </div>
    </div>
  );
}