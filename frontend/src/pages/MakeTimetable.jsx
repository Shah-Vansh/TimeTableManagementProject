import React, { useState } from "react";
import {
  Save,
  Trash2,
  RefreshCw,
  Calendar,
  GraduationCap,
  Users,
} from "lucide-react";
import api from "../configs/api";

export default function MakeTimetable() {
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
     🔹 NEW STATE
  ======================= */
  const [sem, setSem] = useState(1);
  const [className, setClassName] = useState("");

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
  const [isLoading, setIsLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleFacultyChange = (day, timeSlot, value) => {
    setSchedule((prev) => ({
      ...prev,
      [day]: { ...prev[day], [timeSlot]: value },
    }));
    setSaved(false);
  };

  /* =======================
     🔹 UPDATED SUBMIT
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
      formData.append("class", className);
      formData.append("schedule", JSON.stringify(schedule));

      const res = await api.post("/api/timetable", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      console.log("Saved timetable:", res.data);
      setSaved(true);
    } catch (error) {
      console.error("Error saving timetable:", error);
      alert("Failed to save timetable");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setSchedule(initialSchedule);
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
        <div className="mb-6">
          <h1 className="text-4xl font-bold text-gray-800 dark:text-white">
            Faculty Timetable Management
          </h1>
        </div>

        {/* =======================
            🔹 SEM + CLASS FORM
        ======================= */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
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

          <div className="relative">
            <Users className="absolute left-3 top-3 text-purple-500" />
            <input
              type="text"
              placeholder="Class (e.g. D1, A, B2)"
              value={className}
              onChange={(e) => setClassName(e.target.value)}
              className="w-full pl-10 p-3 rounded-xl border focus:ring-2 focus:ring-purple-500"
            />
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
            disabled={isLoading}
            className="px-8 py-4 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold flex items-center gap-2"
          >
            <Save />
            {saved ? "Saved" : "Save Timetable"}
          </button>

          <button
            onClick={handleClear}
            className="px-8 py-4 rounded-xl border text-red-600 flex items-center gap-2"
          >
            <Trash2 /> Clear
          </button>

          <button
            onClick={handleReset}
            className="px-8 py-4 rounded-xl border flex items-center gap-2"
          >
            <RefreshCw /> Reset
          </button>
        </div>
      </div>
    </div>
  );
}
