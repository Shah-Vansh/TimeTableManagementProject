import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Clock,
  CalendarDays,
  Users,
  BookOpen,
  Building,
  Layers,
  GraduationCap,
  Plus,
  Trash2,
  X,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  FileText,
  Hash,
  Type,
  Book,
  Upload,
  Download,
  Eye,
  ChevronRight,
  Search,
  Filter,
  SortAsc,
  Grid,
  List,
  MoreVertical,
  StickyNote,
  Highlighter,
  PenTool,
  ClipboardList,
  Notebook,
  Bookmark,
  Compass,
  BarChart3,
} from "lucide-react";
import api from "../configs/api";
import Alert from "../components/Alert";

function AutoGenerateTimetable() {
  const navigate = useNavigate();
  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(false);
  const [faculties, setFaculties] = useState([]);
  const [generatedTimetable, setGeneratedTimetable] = useState(null);
  
  // Form state
  const [branch, setBranch] = useState("");
  const [className, setClassName] = useState("");
  const [sem, setSem] = useState("");
  const [rooms, setRooms] = useState([""]);
  const [lecturesPerDay, setLecturesPerDay] = useState(4);
  const [maxFreeLectures, setMaxFreeLectures] = useState(6);
  const [subjects, setSubjects] = useState([
    {
      subject_name: "",
      weekly_hours: 3,
      subject_type: "theory",
      faculty_id: "",
    },
  ]);

  const branches = ["CSE", "CSE(AIML)", "DS", "ECE", "EEE"];
  const semesters = Array.from({ length: 8 }, (_, i) => i + 1);
  const classes = ["D1", "D2", "D3", "D4"];
  const subjectTypes = ["theory", "practical"];

  // Show alert message
  const showAlert = (main, info, type) => {
    setAlert({ main, info, type });
    setTimeout(() => setAlert(null), 5000);
  };

  // Fetch faculties for dropdown
  const fetchFaculties = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await api.get("/api/faculties", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) {
        setFaculties(res.data.faculties);
      }
    } catch (err) {
      console.error("Failed to fetch faculties:", err);
    }
  };

  useEffect(() => {
    fetchFaculties();
  }, []);

  // Handle subject field changes
  const handleSubjectChange = (index, field, value) => {
    const newSubjects = [...subjects];
    newSubjects[index][field] = value;
    
    // Auto-set subject type based on subject name
    if (field === "subject_name") {
      const lowerValue = value.toLowerCase();
      if (lowerValue.includes("lab") || lowerValue.includes("practical")) {
        newSubjects[index].subject_type = "practical";
      } else {
        newSubjects[index].subject_type = "theory";
      }
    }
    
    setSubjects(newSubjects);
  };

  // Add new subject row
  const addSubject = () => {
    setSubjects([
      ...subjects,
      {
        subject_name: "",
        weekly_hours: 3,
        subject_type: "theory",
        faculty_id: "",
      },
    ]);
  };

  // Remove subject row
  const removeSubject = (index) => {
    if (subjects.length > 1) {
      const newSubjects = subjects.filter((_, i) => i !== index);
      setSubjects(newSubjects);
    }
  };

  // Handle room input changes
  const handleRoomChange = (index, value) => {
    const newRooms = [...rooms];
    newRooms[index] = value;
    setRooms(newRooms);
  };

  const addRoom = () => {
    setRooms([...rooms, ""]);
  };

  const removeRoom = (index) => {
    if (rooms.length > 1) {
      const newRooms = rooms.filter((_, i) => i !== index);
      setRooms(newRooms);
    }
  };

  // Validate form
  const validateForm = () => {
    if (!branch || !className || !sem) {
      showAlert("Missing required fields", "Please fill in all required fields", "error");
      return false;
    }

    if (rooms.length === 0 || rooms.some(room => !room.trim())) {
      showAlert("Invalid rooms", "Please enter at least one room and ensure all rooms are filled", "error");
      return false;
    }

    for (const subject of subjects) {
      if (!subject.subject_name.trim() || !subject.faculty_id) {
        showAlert("Invalid subject", "Please fill in all subject fields and select a faculty", "error");
        return false;
      }
      if (subject.weekly_hours < 1 || subject.weekly_hours > 10) {
        showAlert("Invalid hours", "Weekly hours should be between 1 and 10", "error");
        return false;
      }
    }

    return true;
  };

  // Generate timetable
  const handleGenerate = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setGeneratedTimetable(null);

    try {
      const token = localStorage.getItem("token");
      const payload = {
        branch,
        class: className,
        sem: parseInt(sem),
        rooms: rooms.filter(room => room.trim()),
        subjects,
        lectures_per_day: lecturesPerDay,
        max_valid_free_lectures: maxFreeLectures,
      };

      const res = await api.post("/api/timetable/auto-generate", payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (res.data.success) {
        setGeneratedTimetable(res.data);
        showAlert(
          "Timetable Generated Successfully!",
          `Timetable created for ${branch} - ${className} (Sem ${sem}) with ${res.data.stats.total_lectures} lectures`,
          "success"
        );
      } else {
        showAlert("Generation Failed", res.data.errors?.join(", ") || "Unknown error", "error");
        if (res.data.partial_timetable) {
          setGeneratedTimetable(res.data);
        }
      }
    } catch (err) {
      console.error("Generation error:", err);
      const message = err.response?.data?.error || err.response?.data?.errors?.join(", ") || err.message;
      showAlert("Generation Failed", message, "error");
    } finally {
      setLoading(false);
    }
  };

  // View generated timetable
  const viewTimetable = () => {
    if (generatedTimetable) {
      navigate("/preview", {
        state: {
          timetable: generatedTimetable.class_timetable,
          branch,
          sem,
          class: className,
          stats: generatedTimetable.stats,
        },
      });
    }
  };

  // Format timetable for display
  const renderTimetablePreview = () => {
    if (!generatedTimetable?.class_timetable) return null;

    const days = ["mon", "tue", "wed", "thu", "fri", "sat"];
    const timeSlots = Array.from({ length: 8 }, (_, i) => `Time Slot ${i + 1}`);

    return (
      <div className="overflow-x-auto">
        <table className="w-full border-collapse bg-white rounded-lg border border-gray-200">
          <thead>
            <tr className="bg-gradient-to-r from-indigo-50 to-indigo-100">
              <th className="p-4 border-b border-indigo-200 text-left text-sm font-semibold text-indigo-900">
                Time Slot
              </th>
              {days.map((day) => (
                <th key={day} className="p-4 border-b border-indigo-200 text-left text-sm font-semibold text-indigo-900 capitalize">
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {timeSlots.map((slot, slotIndex) => (
              <tr key={slot} className="hover:bg-gray-50">
                <td className="p-4 border-b border-gray-100 text-sm font-medium text-gray-700 bg-gray-50">
                  {slot}
                </td>
                {days.map((day) => {
                  const lecture = generatedTimetable.class_timetable[day]?.[slotIndex];
                  const isFree = lecture === "free";
                  return (
                    <td key={`${day}-${slotIndex}`} className="p-4 border-b border-gray-100">
                      {isFree ? (
                        <span className="text-xs text-gray-400 italic">Free</span>
                      ) : (
                        <div className="space-y-1">
                          <div className="text-xs font-medium text-gray-900 line-clamp-1">
                            {lecture.split("-")[4] || "Unknown"}
                          </div>
                          <div className="text-xs text-gray-500 line-clamp-1">
                            {lecture.split("-")[5] || "Unknown"}
                          </div>
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-rose-50">
      {/* Alert Component */}
      {alert && (
        <Alert
          main={alert.main}
          info={alert.info}
          type={alert.type}
          onClose={() => setAlert(null)}
        />
      )}

      {/* Decorative Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-10 w-72 h-72 bg-gradient-to-br from-indigo-100 to-transparent rounded-full opacity-40"></div>
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-gradient-to-tr from-rose-100 to-transparent rounded-full opacity-30"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full h-64 bg-gradient-to-r from-transparent via-indigo-50/20 to-transparent"></div>
      </div>

      <div className="relative z-10 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header with Breadcrumb */}
          <div className="mb-8">
            <div className="flex items-center text-sm text-gray-500 mb-4">
              <span
                onClick={() => navigate("/")}
                className="hover:text-gray-700 cursor-pointer flex items-center gap-1"
              >
                <Bookmark className="w-3 h-3" />
                Dashboard
              </span>
              <ChevronRight className="w-4 h-4 mx-2" />
              <span className="font-medium text-indigo-600 flex items-center gap-1">
                <ClipboardList className="w-4 h-4" />
                Auto Generate Timetable
              </span>
            </div>

            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 bg-white rounded-xl shadow-sm border border-gray-100 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-100 to-transparent opacity-60"></div>
                <div className="relative">
                  <RefreshCw className="w-6 h-6 text-indigo-600" />
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Auto Generate Timetable
                </h1>
                <p className="text-gray-600 mt-1">
                  Automatically generate timetables using AI-powered scheduling
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Form */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-indigo-100/50">
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-indigo-600" />
                    Generation Parameters
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Fill in the details below to generate an optimal timetable
                  </p>
                </div>

                <div className="p-6 space-y-6">
                  {/* Basic Information */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Building className="w-4 h-4 inline mr-1" />
                        Branch *
                      </label>
                      <select
                        value={branch}
                        onChange={(e) => setBranch(e.target.value)}
                        className="w-full px-4 py-2.5 bg-white border border-gray-300 text-gray-900 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                      >
                        <option value="">Select Branch</option>
                        {branches.map((b) => (
                          <option key={b} value={b}>
                            {b}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Layers className="w-4 h-4 inline mr-1" />
                        Class *
                      </label>
                      <select
                        value={className}
                        onChange={(e) => setClassName(e.target.value)}
                        className="w-full px-4 py-2.5 bg-white border border-gray-300 text-gray-900 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                      >
                        <option value="">Select Class</option>
                        {classes.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Hash className="w-4 h-4 inline mr-1" />
                        Semester *
                      </label>
                      <select
                        value={sem}
                        onChange={(e) => setSem(e.target.value)}
                        className="w-full px-4 py-2.5 bg-white border border-gray-300 text-gray-900 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                      >
                        <option value="">Select Semester</option>
                        {semesters.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Rooms */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <label className="block text-sm font-medium text-gray-700">
                        <Building className="w-4 h-4 inline mr-1" />
                        Available Rooms *
                      </label>
                      <button
                        type="button"
                        onClick={addRoom}
                        className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                      >
                        <Plus className="w-4 h-4" />
                        Add Room
                      </button>
                    </div>
                    <div className="space-y-3">
                      {rooms.map((room, index) => (
                        <div key={index} className="flex items-center gap-3">
                          <input
                            type="text"
                            value={room}
                            onChange={(e) => handleRoomChange(index, e.target.value)}
                            placeholder="e.g., Room 101, Lab 201"
                            className="flex-1 px-4 py-2.5 bg-white border border-gray-300 text-gray-900 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                          />
                          {rooms.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeRoom(index)}
                              className="p-2.5 text-red-600 hover:bg-red-50 rounded-lg border border-red-200 hover:border-red-300 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Tip: Include both classrooms and labs (e.g., "Lab 101" for practical subjects)
                    </p>
                  </div>

                  {/* Subjects */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <label className="block text-sm font-medium text-gray-700">
                        <BookOpen className="w-4 h-4 inline mr-1" />
                        Subjects *
                      </label>
                      <button
                        type="button"
                        onClick={addSubject}
                        className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                      >
                        <Plus className="w-4 h-4" />
                        Add Subject
                      </button>
                    </div>
                    <div className="space-y-4">
                      {subjects.map((subject, index) => (
                        <div
                          key={index}
                          className="p-4 border border-gray-200 rounded-lg bg-gray-50/50 space-y-4"
                        >
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-gray-900">
                              Subject {index + 1}
                            </h4>
                            {subjects.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeSubject(index)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Subject Name *
                              </label>
                              <input
                                type="text"
                                value={subject.subject_name}
                                onChange={(e) =>
                                  handleSubjectChange(index, "subject_name", e.target.value)
                                }
                                placeholder="e.g., Data Structures, Physics Lab"
                                className="w-full px-4 py-2.5 bg-white border border-gray-300 text-gray-900 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Weekly Hours *
                              </label>
                              <select
                                value={subject.weekly_hours}
                                onChange={(e) =>
                                  handleSubjectChange(index, "weekly_hours", parseInt(e.target.value))
                                }
                                className="w-full px-4 py-2.5 bg-white border border-gray-300 text-gray-900 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                              >
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((h) => (
                                  <option key={h} value={h}>
                                    {h} hour{h !== 1 ? "s" : ""}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Subject Type
                              </label>
                              <select
                                value={subject.subject_type}
                                onChange={(e) =>
                                  handleSubjectChange(index, "subject_type", e.target.value)
                                }
                                className="w-full px-4 py-2.5 bg-white border border-gray-300 text-gray-900 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                              >
                                {subjectTypes.map((type) => (
                                  <option key={type} value={type}>
                                    {type.charAt(0).toUpperCase() + type.slice(1)}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Faculty *
                              </label>
                              <select
                                value={subject.faculty_id}
                                onChange={(e) =>
                                  handleSubjectChange(index, "faculty_id", e.target.value)
                                }
                                className="w-full px-4 py-2.5 bg-white border border-gray-300 text-gray-900 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                              >
                                <option value="">Select Faculty</option>
                                {faculties.map((faculty) => (
                                  <option key={faculty.id} value={faculty.id}>
                                    {faculty.name} ({faculty.id})
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Generation Settings */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Clock className="w-4 h-4 inline mr-1" />
                        Lectures Per Day
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="8"
                        value={lecturesPerDay}
                        onChange={(e) => setLecturesPerDay(parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                      <div className="flex justify-between mt-2">
                        <span className="text-sm text-gray-600">1</span>
                        <span className="text-sm font-medium text-indigo-600">
                          {lecturesPerDay} lectures/day
                        </span>
                        <span className="text-sm text-gray-600">8</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <AlertCircle className="w-4 h-4 inline mr-1" />
                        Max Free Lectures
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="20"
                        value={maxFreeLectures}
                        onChange={(e) => setMaxFreeLectures(parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                      <div className="flex justify-between mt-2">
                        <span className="text-sm text-gray-600">0</span>
                        <span className="text-sm font-medium text-indigo-600">
                          {maxFreeLectures} free slots
                        </span>
                        <span className="text-sm text-gray-600">20</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6 border-t border-gray-200 bg-gray-50">
                  <button
                    onClick={handleGenerate}
                    disabled={loading}
                    className={`w-full py-3 px-6 rounded-lg font-medium transition-all duration-300 flex items-center justify-center gap-2 ${
                      loading
                        ? "bg-indigo-400 cursor-not-allowed"
                        : "bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800"
                    } text-white shadow-sm hover:shadow-md`}
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        Generating Timetable...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-5 h-5" />
                        Generate Timetable
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column - Preview & Results */}
            <div className="space-y-6">
              {/* Statistics Card */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-indigo-600" />
                  Generation Stats
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Total Subjects</span>
                    <span className="font-medium text-gray-900">{subjects.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Total Weekly Hours</span>
                    <span className="font-medium text-gray-900">
                      {subjects.reduce((sum, s) => sum + s.weekly_hours, 0)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Available Rooms</span>
                    <span className="font-medium text-gray-900">{rooms.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Unique Faculties</span>
                    <span className="font-medium text-gray-900">
                      {new Set(subjects.map((s) => s.faculty_id)).size}
                    </span>
                  </div>
                  <div className="pt-4 border-t border-gray-200">
                    <div className="text-sm text-gray-500">
                      The algorithm will try to schedule all lectures while avoiding:
                    </div>
                    <ul className="mt-2 space-y-1 text-sm text-gray-600">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                        Faculty conflicts
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                        Room conflicts
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                        Practicals in classrooms
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Results Card */}
              {generatedTimetable && (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-emerald-50 to-emerald-100/50">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-emerald-600" />
                      Generation Results
                    </h3>
                  </div>
                  <div className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Status</span>
                      <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-medium rounded-full border border-emerald-200">
                        Successful
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Total Lectures</span>
                      <span className="font-medium text-gray-900">
                        {generatedTimetable.stats?.total_lectures || 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Free Slots</span>
                      <span className="font-medium text-gray-900">
                        {generatedTimetable.stats?.free_lectures || 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Faculty Updated</span>
                      <span className="font-medium text-gray-900">
                        {generatedTimetable.faculty_updated?.length || 0}
                      </span>
                    </div>

                    <div className="pt-4">
                      <button
                        onClick={viewTimetable}
                        className="w-full py-2.5 px-4 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg border border-indigo-200 transition-colors flex items-center justify-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        View Full Timetable
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Timetable Preview */}
              {generatedTimetable && (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-indigo-100/50">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      <CalendarDays className="w-5 h-5 text-indigo-600" />
                      Timetable Preview
                    </h3>
                  </div>
                  <div className="p-4">
                    {renderTimetablePreview()}
                  </div>
                </div>
              )}

              {/* Tips Card */}
              <div className="bg-gradient-to-r from-indigo-50 to-rose-50 rounded-2xl p-6 border-2 border-indigo-200">
                <h3 className="font-bold text-indigo-900 mb-4 flex items-center gap-2">
                  <Compass className="w-5 h-5 text-indigo-600" />
                  Generation Tips
                </h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-indigo-100 to-indigo-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-indigo-700">1</span>
                    </div>
                    <span className="text-sm text-indigo-700">
                      Add both classrooms and labs for optimal scheduling
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-violet-100 to-violet-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-violet-700">2</span>
                    </div>
                    <span className="text-sm text-violet-700">
                      Practical subjects are automatically scheduled in labs
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-rose-100 to-rose-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-rose-700">3</span>
                    </div>
                    <span className="text-sm text-rose-700">
                      Faculty availability is automatically checked
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AutoGenerateTimetable;