import React, { useState } from "react";
import { RefreshCw, Calendar, Users, GraduationCap, Clock, Search, Repeat } from "lucide-react";
import api from "../configs/api";

export default function ReplaceLecture() {
  const days = [
    { value: "mon", label: "Monday" },
    { value: "tue", label: "Tuesday" },
    { value: "wed", label: "Wednesday" },
    { value: "thu", label: "Thursday" },
    { value: "fri", label: "Friday" },
    { value: "sat", label: "Saturday" },
  ];

  // Time slots starting from 9 AM to 5 PM (8 slots)
  const timeSlots = [
    { value: 0, label: "9:00 AM - 10:00 AM" },
    { value: 1, label: "10:00 AM - 11:00 AM" },
    { value: 2, label: "11:00 AM - 12:00 PM" },
    { value: 3, label: "12:00 PM - 1:00 PM" },
    { value: 4, label: "1:00 PM - 2:00 PM" },
    { value: 5, label: "2:00 PM - 3:00 PM" },
    { value: 6, label: "3:00 PM - 4:00 PM" },
    { value: 7, label: "4:00 PM - 5:00 PM" },
  ];

  /* =======================
     🔹 STATE
  ======================= */
  const [formData, setFormData] = useState({
    day: "",
    class: "",
    sem: 1,
    branch: "CSE",
    lec_no: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isRearranging, setIsRearranging] = useState(false);
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  /* =======================
     🔹 HANDLERS
  ======================= */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === "sem" ? parseInt(value) : value
    }));
    // Clear messages when form changes
    setResult(null);
    setErrorMsg("");
    setSuccessMsg("");
  };

  const handleSubmit = async (action = "replace") => {
    // Validate required fields
    if (!formData.day || !formData.class || !formData.sem || !formData.branch || formData.lec_no === "") {
      setErrorMsg("Please fill all required fields");
      return;
    }

    const isRearrange = action === "rearrange";
    setIsLoading(true);
    setIsRearranging(isRearrange);
    setResult(null);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const endpoint = isRearrange ? "/api/rearrange-lecture" : "/api/replace-lecture";
      const response = await api.post(endpoint, formData);
      
      if (response.data.success) {
        setResult(response.data);
        setSuccessMsg(
          isRearrange 
            ? `✅ Lecture successfully rearranged with ${response.data.type} method`
            : `✅ Lecture successfully assigned to ${response.data.assigned_faculty}`
        );
      } else {
        setErrorMsg(response.data.message || `Failed to ${isRearrange ? 'rearrange' : 'replace'} lecture`);
      }
    } catch (error) {
      console.error(`Error ${isRearrange ? 'rearranging' : 'replacing'} lecture:`, error);
      
      if (error.response) {
        const { status, data } = error.response;
        if (status === 404) {
          setErrorMsg(data.message || "Class not found");
        } else if (status === 409) {
          setErrorMsg(data.message || (isRearrange ? "No possible rearrangement found" : "No faculty available at this time slot"));
        } else {
          setErrorMsg(data.message || `Failed to ${isRearrange ? 'rearrange' : 'replace'} lecture`);
        }
      } else {
        setErrorMsg("Network error. Please try again.");
      }
    } finally {
      setIsLoading(false);
      setIsRearranging(false);
    }
  };

  const handleReset = () => {
    setFormData({
      day: "",
      class: "",
      sem: 1,
      branch: "CSE",
      lec_no: "",
    });
    setResult(null);
    setErrorMsg("");
    setSuccessMsg("");
  };

  return (
    <div className="min-h-screen p-6 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto">
        {/* =======================
            🔹 HEADER
        ======================= */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-2">
            Lecture Management
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Find an available faculty to replace or rearrange lecture slots (9:00 AM - 5:00 PM)
          </p>
        </div>

        {/* =======================
            🔹 MESSAGES
        ======================= */}
        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl border border-red-300 bg-red-50 text-red-700 font-semibold">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="mb-6 p-4 rounded-xl border border-green-300 bg-green-50 text-green-700 font-semibold">
            {successMsg}
          </div>
        )}

        {/* =======================
            🔹 FORM
        ======================= */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Day Selection */}
            <div className="relative">
              <Calendar className="absolute left-3 top-3 text-blue-500" />
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Day *
              </label>
              <select
                name="day"
                value={formData.day}
                onChange={handleChange}
                required
                className="w-full pl-10 p-3 rounded-xl border focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Day</option>
                {days.map((day) => (
                  <option key={day.value} value={day.value}>
                    {day.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Class Name */}
            <div className="relative">
              <Users className="absolute left-3 top-3 text-purple-500" />
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Class Name *
              </label>
              <input
                type="text"
                name="class"
                placeholder="e.g. D1, A, B2"
                value={formData.class}
                onChange={handleChange}
                required
                className="w-full pl-10 p-3 rounded-xl border focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Semester */}
            <div className="relative">
              <GraduationCap className="absolute left-3 top-3 text-green-500" />
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Semester *
              </label>
              <select
                name="sem"
                value={formData.sem}
                onChange={handleChange}
                required
                className="w-full pl-10 p-3 rounded-xl border focus:ring-2 focus:ring-green-500"
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
              <GraduationCap className="absolute left-3 top-3 text-indigo-500" />
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Branch *
              </label>
              <select
                name="branch"
                value={formData.branch}
                onChange={handleChange}
                required
                className="w-full pl-10 p-3 rounded-xl border focus:ring-2 focus:ring-indigo-500"
              >
                <option value="CSE">CSE</option>
                <option value="CSE(AIML)">CSE (AIML)</option>
                <option value="DS">Data Science</option>
                <option value="IT">IT</option>
                <option value="ECE">ECE</option>
                <option value="ME">ME</option>
              </select>
            </div>

            {/* Time Slot Selection */}
            <div className="relative md:col-span-2">
              <Clock className="absolute left-3 top-12 text-amber-500" />
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Time Slot *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {timeSlots.map((slot) => (
                  <div key={slot.value} className="flex items-center">
                    <input
                      type="radio"
                      id={`slot-${slot.value}`}
                      name="lec_no"
                      value={slot.value}
                      checked={formData.lec_no === slot.value.toString()}
                      onChange={handleChange}
                      className="hidden"
                    />
                    <label
                      htmlFor={`slot-${slot.value}`}
                      className={`flex-1 p-3 text-center rounded-lg border cursor-pointer transition-all ${
                        formData.lec_no === slot.value.toString()
                          ? "bg-blue-50 border-blue-500 text-blue-700 font-semibold"
                          : "bg-gray-50 border-gray-300 hover:bg-gray-100 dark:bg-gray-700 dark:border-gray-600"
                      }`}
                    >
                      <div className="text-sm font-medium">{slot.label.split(" - ")[0]}</div>
                      <div className="text-xs text-gray-500">to</div>
                      <div className="text-sm font-medium">{slot.label.split(" - ")[1]}</div>
                    </label>
                  </div>
                ))}
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Select the time slot you want to manage (0-based index: {formData.lec_no || "-"})
              </p>
            </div>
          </div>

          {/* =======================
              🔹 ACTION BUTTONS
          ======================= */}
          <div className="flex flex-wrap gap-4 justify-center mt-8">
            <button
              type="button"
              onClick={() => handleSubmit("replace")}
              disabled={isLoading || !formData.lec_no}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold flex items-center gap-2 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Search />
              {isLoading && !isRearranging ? "Searching..." : "Replace Lecture"}
            </button>

            <button
              type="button"
              onClick={() => handleSubmit("rearrange")}
              disabled={isLoading || !formData.lec_no}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 text-white font-semibold flex items-center gap-2 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Repeat />
              {isLoading && isRearranging ? "Rearranging..." : "Rearrange Lecture"}
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="px-6 py-3 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <RefreshCw /> Reset Form
            </button>
          </div>

          {/* Action Descriptions */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <h4 className="font-semibold text-blue-700 dark:text-blue-300 mb-2 flex items-center gap-2">
                <Search size={18} /> Replace Lecture
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Find any available faculty from allowed list to directly assign the lecture.
                This will search for faculty with free slots first.
              </p>
            </div>
            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
              <h4 className="font-semibold text-amber-700 dark:text-amber-300 mb-2 flex items-center gap-2">
                <Repeat size={18} /> Rearrange Lecture
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Try to rearrange existing lectures between allowed faculty to create space.
                This can swap lectures between faculty to make room for new assignment.
              </p>
            </div>
          </div>
        </div>

        {/* =======================
            🔹 RESULT DISPLAY
        ======================= */}
        {result && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                Assignment Result
              </h2>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                result.type === 'rearranged' 
                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200'
                  : result.type === 'direct'
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
              }`}>
                {result.type === 'rearranged' ? 'Rearranged' : 
                 result.type === 'direct' ? 'Direct Assignment' : 'Assigned'}
              </span>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Assigned Faculty</p>
                  <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                    {result.assigned_faculty}
                  </p>
                </div>
                
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
                  <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                    Successfully {result.type === 'rearranged' ? 'Rearranged' : 'Assigned'}
                  </p>
                </div>
              </div>
              
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">Message</p>
                <p className="font-medium whitespace-pre-line">{result.message}</p>
              </div>
              
              <div className="mt-4 p-4 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Assignment Details:
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Day:</span>
                    <span className="font-medium">
                      {days.find(d => d.value === formData.day)?.label || formData.day}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Class:</span>
                    <span className="font-medium">{formData.class}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Semester:</span>
                    <span className="font-medium">{formData.sem}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Branch:</span>
                    <span className="font-medium">{formData.branch}</span>
                  </div>
                  <div className="flex justify-between sm:col-span-2">
                    <span className="text-gray-600 dark:text-gray-400">Time Slot:</span>
                    <span className="font-medium">
                      {timeSlots.find(t => t.value === parseInt(formData.lec_no))?.label || 
                       `Lecture ${formData.lec_no}`}
                    </span>
                  </div>
                  <div className="flex justify-between sm:col-span-2">
                    <span className="text-gray-600 dark:text-gray-400">Method:</span>
                    <span className="font-medium">
                      {result.type === 'rearranged' 
                        ? 'Lecture Rearrangement (Swapped)' 
                        : result.type === 'direct'
                        ? 'Direct Assignment (Faculty was free)'
                        : 'Standard Replacement'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =======================
            🔹 TIME SLOT GUIDE
        ======================= */}
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-xl shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
            📋 Time Slot Index Guide
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-700">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Index
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Time Slot
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Description
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {timeSlots.map((slot, index) => (
                  <tr key={slot.value} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        {slot.value}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap font-medium">
                      {slot.label}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                      {index === 0 ? "First lecture of the day" : 
                       index === 7 ? "Last lecture of the day" : 
                       `Lecture ${slot.value + 1}`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}