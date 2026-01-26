import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Zap,
  Plus,
  Trash2,
  Save,
  RefreshCw,
  Users,
  Building,
  Clock,
  Calendar,
  BookOpen,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  Loader2,
  Info,
  FolderPlus,
  FileText,
  Grid,
  Layers,
  PenTool,
  DoorOpen,
  BookMarked,
  Hash,
  User,
  Search,
  X,
  Check,
  Eye,
  EyeOff,
  Download,
  Printer,
  BarChart3,
  Compass,
  Notebook,
  ClipboardList,
  Highlighter,
  StickyNote,
  TrendingUp,
  Activity,
  Book,
  Bookmark,
} from "lucide-react";
import api from "../configs/api";
import Alert from "../components/Alert";

export default function AutoBranchTimetable() {
  const navigate = useNavigate();

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const timeSlots = [
    { label: "Lecture 1", value: "Time Slot 1" },
    { label: "Lecture 2", value: "Time Slot 2" },
    { label: "Lecture 3", value: "Time Slot 3" },
    { label: "Lecture 4", value: "Time Slot 4" },
  ];

  const branchOptions = ["CSE", "CSE(AIML)", "DS", "IT"];
  const divisionOptions = ["D1", "D2", "D3", "D4", "D5", "D6"];
  const subjectTypeOptions = ["theory", "practical"];
  const roomTypeOptions = ["Classroom", "Lab"];
  
  // Default room options
  const defaultRooms = [
    "101", "102", "103", "104", "105", "106",
    "201", "202", "203", "204", "205", "206",
    "301", "302", "303", "304", "305", "306",
    "Lab 1", "Lab 2", "Lab 3", "Lab 4", "Auditorium"
  ];

  /* =======================
            STATE
  ======================= */
  const [sem, setSem] = useState(1);
  const [branch, setBranch] = useState("CSE");
  const [divisions, setDivisions] = useState([]);
  const [sharedRooms, setSharedRooms] = useState(["101", "102", "201", "202", "Lab 1", "Lab 2"]);
  const [lecturesPerDay, setLecturesPerDay] = useState(4);
  const [maxFreeLectures, setMaxFreeLectures] = useState(6);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedResults, setGeneratedResults] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [facultyList, setFacultyList] = useState([]);
  const [isLoadingFaculty, setIsLoadingFaculty] = useState(false);
  const [subjectOptions, setSubjectOptions] = useState([
    "Mathematics", "Physics", "Chemistry", "Programming", "Database", 
    "Networks", "AI/ML", "Web Development", "Software Engineering", 
    "Data Structures", "Algorithms", "Operating Systems"
  ]);
  const [availableRooms, setAvailableRooms] = useState(defaultRooms);
  const [newRoom, setNewRoom] = useState("");
  const [alert, setAlert] = useState(null);
  const [viewMode, setViewMode] = useState("form"); // 'form' or 'results'
  const [statistics, setStatistics] = useState(null);
  const [existingDivisions, setExistingDivisions] = useState([]);
  const [isLoadingExisting, setIsLoadingExisting] = useState(false);

  const token = localStorage.getItem("token");

  // Show alert message
  const showAlert = (main, info, type) => {
    setAlert({ main, info, type });
    setTimeout(() => setAlert(null), 5000);
  };

  /* =======================
   FETCH FACULTY LIST
  ======================= */
  const fetchFacultyList = async () => {
    setIsLoadingFaculty(true);
    try {
      const response = await api.get("/api/faculties", {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.data.success) {
        const faculties = response.data.faculties || [];
        const formattedFaculties = faculties.map(faculty => ({
          id: faculty.id || faculty._id,
          name: faculty.name || "Unknown Faculty",
          displayLabel: `${faculty.name} (${faculty.id || faculty._id})`
        }));
        setFacultyList(formattedFaculties);
      }
    } catch (error) {
      console.error("Error fetching faculty:", error);
      showAlert("Failed to fetch faculty", "Using sample data", "warning");
      // Fallback sample data
      setFacultyList([
        { id: "FAC001", name: "Dr. Rajesh Kumar", displayLabel: "Dr. Rajesh Kumar (FAC001)" },
        { id: "FAC002", name: "Prof. Anita Sharma", displayLabel: "Prof. Anita Sharma (FAC002)" },
        { id: "FAC003", name: "Dr. Vikram Singh", displayLabel: "Dr. Vikram Singh (FAC003)" },
        { id: "FAC004", name: "Prof. Meena Patel", displayLabel: "Prof. Meena Patel (FAC004)" },
      ]);
    } finally {
      setIsLoadingFaculty(false);
    }
  };

  /* =======================
   FETCH EXISTING DIVISIONS
  ======================= */
  const fetchExistingDivisions = async () => {
    if (!branch || !sem) return;
    
    setIsLoadingExisting(true);
    try {
      const response = await api.get("/api/timetable/branch-divisions", {
        params: { branch, sem }
      });
      
      if (response.data.success) {
        setExistingDivisions(response.data.divisions || []);
        
        // If we have existing divisions, pre-fill the form
        if (response.data.divisions.length > 0) {
          showAlert(
            "Found existing divisions",
            `${response.data.divisions.length} divisions found for ${branch} - Semester ${sem}`,
            "info"
          );
        }
      }
    } catch (error) {
      console.error("Error fetching existing divisions:", error);
    } finally {
      setIsLoadingExisting(false);
    }
  };

  /* =======================
   ADD NEW DIVISION
  ======================= */
  const addNewDivision = () => {
    const newDivision = {
      class_name: `D${divisions.length + 1}`,
      subjects: [
        {
          subject_name: "Mathematics",
          weekly_hours: 4,
          subject_type: "theory",
          faculty_id: facultyList[0]?.id || "FAC001"
        }
      ],
      rooms: []
    };
    setDivisions([...divisions, newDivision]);
  };

  /* =======================
   REMOVE DIVISION
  ======================= */
  const removeDivision = (index) => {
    const newDivisions = [...divisions];
    newDivisions.splice(index, 1);
    setDivisions(newDivisions);
  };

  /* =======================
   UPDATE DIVISION FIELD
  ======================= */
  const updateDivisionField = (index, field, value) => {
    const newDivisions = [...divisions];
    if (field === "class_name") {
      newDivisions[index][field] = value;
    }
    setDivisions(newDivisions);
  };

  /* =======================
   ADD SUBJECT TO DIVISION
  ======================= */
  const addSubjectToDivision = (divisionIndex) => {
    const newDivisions = [...divisions];
    newDivisions[divisionIndex].subjects.push({
      subject_name: "New Subject",
      weekly_hours: 3,
      subject_type: "theory",
      faculty_id: facultyList[0]?.id || "FAC001"
    });
    setDivisions(newDivisions);
  };

  /* =======================
   REMOVE SUBJECT FROM DIVISION
  ======================= */
  const removeSubjectFromDivision = (divisionIndex, subjectIndex) => {
    const newDivisions = [...divisions];
    newDivisions[divisionIndex].subjects.splice(subjectIndex, 1);
    setDivisions(newDivisions);
  };

  /* =======================
   UPDATE SUBJECT FIELD
  ======================= */
  const updateSubjectField = (divisionIndex, subjectIndex, field, value) => {
    const newDivisions = [...divisions];
    newDivisions[divisionIndex].subjects[subjectIndex][field] = value;
    setDivisions(newDivisions);
  };

  /* =======================
   ADD NEW ROOM TO SHARED
  ======================= */
  const addNewRoomToShared = () => {
    if (newRoom.trim() && !sharedRooms.includes(newRoom.trim())) {
      setSharedRooms([...sharedRooms, newRoom.trim()]);
      setNewRoom("");
    }
  };

  /* =======================
   REMOVE SHARED ROOM
  ======================= */
  const removeSharedRoom = (index) => {
    const newRooms = [...sharedRooms];
    newRooms.splice(index, 1);
    setSharedRooms(newRooms);
  };

  /* =======================
   LOAD EXISTING DIVISION
  ======================= */
  const loadExistingDivision = (division) => {
    // Check if division already exists in our list
    const exists = divisions.some(d => d.class_name === division.class_name);
    if (exists) {
      showAlert("Division already loaded", `${division.class_name} is already in the list`, "warning");
      return;
    }

    // Add division with default subjects
    const newDivision = {
      class_name: division.class_name,
      subjects: [
        {
          subject_name: "Mathematics",
          weekly_hours: 4,
          subject_type: "theory",
          faculty_id: facultyList[0]?.id || "FAC001"
        },
        {
          subject_name: "Programming",
          weekly_hours: 3,
          subject_type: "practical",
          faculty_id: facultyList[1]?.id || "FAC002"
        }
      ],
      rooms: []
    };
    setDivisions([...divisions, newDivision]);
    
    showAlert("Division loaded", `${division.class_name} added to generation list`, "success");
  };

  /* =======================
   VALIDATE INPUTS
  ======================= */
  const validateInputs = () => {
    if (!branch || !sem) {
      showAlert("Missing information", "Please select branch and semester", "error");
      return false;
    }

    if (divisions.length === 0) {
      showAlert("No divisions", "Please add at least one division", "error");
      return false;
    }

    for (const division of divisions) {
      if (!division.class_name || division.class_name.trim() === "") {
        showAlert("Invalid division name", `Division ${division.class_name} has no name`, "error");
        return false;
      }

      if (division.subjects.length === 0) {
        showAlert("No subjects", `Division ${division.class_name} has no subjects`, "error");
        return false;
      }

      for (const subject of division.subjects) {
        if (!subject.subject_name || subject.subject_name.trim() === "") {
          showAlert("Invalid subject", `Subject in ${division.class_name} has no name`, "error");
          return false;
        }

        if (!subject.weekly_hours || subject.weekly_hours < 1) {
          showAlert("Invalid hours", `Subject ${subject.subject_name} has invalid weekly hours`, "error");
          return false;
        }

        if (!subject.faculty_id || subject.faculty_id.trim() === "") {
          showAlert("Missing faculty", `Subject ${subject.subject_name} has no faculty assigned`, "error");
          return false;
        }
      }
    }

    if (sharedRooms.length === 0) {
      showAlert("No rooms", "Please add at least one shared room", "error");
      return false;
    }

    return true;
  };

  /* =======================
   GENERATE TIMETABLES
  ======================= */
  const handleGenerateTimetables = async () => {
    if (!validateInputs()) return;

    setIsGenerating(true);
    setGeneratedResults(null);
    setShowResults(false);

    try {
      const payload = {
        branch,
        sem: parseInt(sem),
        divisions: divisions.map(div => ({
          class_name: div.class_name,
          subjects: div.subjects.map(sub => ({
            subject_name: sub.subject_name,
            weekly_hours: parseInt(sub.weekly_hours),
            subject_type: sub.subject_type,
            faculty_id: sub.faculty_id
          })),
          rooms: div.rooms || []
        })),
        shared_rooms: sharedRooms,
        lectures_per_day: parseInt(lecturesPerDay),
        max_valid_free_lectures: parseInt(maxFreeLectures)
      };

      console.log("Generating with payload:", payload);

      const response = await api.post("/api/timetable/auto-generate-branch", payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        setGeneratedResults(response.data);
        setShowResults(true);
        setViewMode("results");
        
        // Calculate statistics
        const stats = {
          totalDivisions: response.data.total_divisions,
          totalLectures: 0,
          totalFreeLectures: 0,
          facultyUpdated: response.data.faculty_updated?.length || 0,
          divisions: {}
        };

        Object.entries(response.data.divisions || {}).forEach(([divName, data]) => {
          stats.divisions[divName] = {
            totalLectures: data.stats?.total_lectures || 0,
            freeLectures: data.stats?.free_lectures || 0,
            subjectAllocation: data.stats?.subject_allocation || {}
          };
          stats.totalLectures += data.stats?.total_lectures || 0;
          stats.totalFreeLectures += data.stats?.free_lectures || 0;
        });

        setStatistics(stats);

        showAlert(
          "Timetables Generated Successfully",
          `Generated ${response.data.total_divisions} division timetables with ${stats.facultyUpdated} faculty updated`,
          "success"
        );
      } else {
        if (response.data.errors && response.data.errors.length > 0) {
          showAlert(
            "Generation Failed",
            response.data.errors.join(", "),
            "error"
          );
        } else {
          showAlert("Generation Failed", "Unknown error occurred", "error");
        }
        
        // Still show partial results if available
        if (response.data.partial_results) {
          setGeneratedResults({
            success: false,
            divisions: response.data.partial_results,
            warnings: response.data.warnings || []
          });
          setShowResults(true);
          setViewMode("results");
        }
      }
    } catch (error) {
      console.error("Error generating timetables:", error);
      const message = error.response?.data?.error || error.message || "Failed to generate timetables";
      showAlert("Generation Failed", message, "error");
    } finally {
      setIsGenerating(false);
    }
  };

  /* =======================
   SAVE GENERATED TIMETABLES
  ======================= */
  const handleSaveGeneratedTimetables = async () => {
    if (!generatedResults || !generatedResults.divisions) {
      showAlert("No data", "No generated timetables to save", "error");
      return;
    }

    setIsLoading(true);
    try {
      const savePromises = Object.entries(generatedResults.divisions).map(async ([divisionName, data]) => {
        const timetable = data.timetable;
        
        // Convert timetable format if needed
        const formattedSchedule = {};
        Object.entries(timetable).forEach(([dayKey, slots]) => {
          const dayName = dayKey.charAt(0).toUpperCase() + dayKey.slice(1); // Convert "mon" to "Mon"
          const fullDayName = days.find(d => d.toLowerCase().startsWith(dayKey)) || dayKey;
          
          formattedSchedule[fullDayName] = {};
          slots.forEach((slot, index) => {
            if (slot !== "free") {
              // Parse the slot string to get faculty, subject, room
              const parts = slot.split('-');
              const faculty = parts.length > 0 ? parts[parts.length - 4] : "unknown";
              const subject = parts.length > 3 ? parts[parts.length - 3] : "unknown";
              const room = parts.length > 2 ? parts[parts.length - 1] : "unknown";
              
              formattedSchedule[fullDayName][`Time Slot ${index + 1}`] = {
                faculty,
                subject,
                room
              };
            } else {
              formattedSchedule[fullDayName][`Time Slot ${index + 1}`] = {
                faculty: "free",
                subject: "",
                room: ""
              };
            }
          });
        });

        const formData = new FormData();
        formData.append("sem", sem);
        formData.append("branch", branch);
        formData.append("class", divisionName);
        formData.append("schedule", JSON.stringify(formattedSchedule));

        return api.post("/api/timetable/fullsave", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        });
      });

      const results = await Promise.all(savePromises);
      console.log("Saved all timetables:", results);
      
      showAlert(
        "Timetables Saved Successfully",
        `Saved ${results.length} division timetables to database`,
        "success"
      );

      // Navigate to preview page
      navigate("/timetable/preview", {
        state: { sem, branch }
      });

    } catch (error) {
      console.error("Error saving timetables:", error);
      const message = error.response?.data?.error || error.message || "Failed to save timetables";
      showAlert("Save Failed", message, "error");
    } finally {
      setIsLoading(false);
    }
  };

  /* =======================
   RESET FORM
  ======================= */
  const resetForm = () => {
    setDivisions([]);
    setSharedRooms(["101", "102", "201", "202", "Lab 1", "Lab 2"]);
    setLecturesPerDay(4);
    setMaxFreeLectures(6);
    setGeneratedResults(null);
    setShowResults(false);
    setViewMode("form");
    setStatistics(null);
  };

  /* =======================
   INITIAL LOAD
  ======================= */
  useEffect(() => {
    fetchFacultyList();
  }, []);

  useEffect(() => {
    if (branch && sem) {
      fetchExistingDivisions();
    }
  }, [branch, sem]);

  /* =======================
   RENDER TIMETABLE PREVIEW
  ======================= */
  const renderTimetablePreview = (divisionName, timetable) => {
    return (
      <div className="bg-white rounded-xl border border-indigo-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-indigo-200 bg-gradient-to-r from-indigo-50 to-indigo-100">
          <h3 className="font-bold text-lg text-gray-900">{divisionName}</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-3 text-left text-xs font-medium text-gray-700">Time</th>
                {days.map(day => (
                  <th key={day} className="p-3 text-left text-xs font-medium text-gray-700">
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {timeSlots.map((slot, slotIndex) => (
                <tr key={slot.value} className="hover:bg-indigo-50/50">
                  <td className="p-3 text-sm font-medium text-gray-900">{slot.label}</td>
                  {days.map(day => {
                    const dayKey = day.toLowerCase().substring(0, 3);
                    const slotValue = timetable[dayKey]?.[slotIndex] || "free";
                    
                    if (slotValue === "free") {
                      return (
                        <td key={day} className="p-3">
                          <div className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-600 text-center">
                            Free
                          </div>
                        </td>
                      );
                    }
                    
                    // Parse the slot string
                    const parts = slotValue.split('-');
                    const faculty = parts.length > 0 ? parts[parts.length - 4] : "Unknown";
                    const subject = parts.length > 3 ? parts[parts.length - 3] : "Unknown";
                    const room = parts.length > 2 ? parts[parts.length - 1] : "Unknown";
                    
                    return (
                      <td key={day} className="p-3">
                        <div className="space-y-1">
                          <div className="px-2 py-1 bg-indigo-50 rounded text-xs font-medium text-indigo-700">
                            {faculty}
                          </div>
                          <div className="px-2 py-1 bg-teal-50 rounded text-xs text-teal-700">
                            {subject}
                          </div>
                          <div className="px-2 py-1 bg-amber-50 rounded text-xs text-amber-700">
                            Room: {room}
                          </div>
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
    );
  };

  /* =======================
        RENDER
  ======================= */
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-violet-50 p-4 md:p-6">
      {/* Alert Component */}
      {alert && (
        <Alert
          main={alert.main}
          info={alert.info}
          type={alert.type}
          onClose={() => setAlert(null)}
        />
      )}

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Breadcrumb */}
        <div className="mb-6">
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
              <Zap className="w-4 h-4" />
              Auto Generate
            </span>
          </div>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Branch Timetable Auto-Generator
            </h1>
            <p className="text-gray-600">
              Automatically generate optimized timetables for multiple divisions simultaneously
            </p>
          </div>
          <div className="p-3 bg-white rounded-xl border border-indigo-200 shadow-sm">
            <Zap className="w-6 h-6 text-indigo-600" />
          </div>
        </div>

        {/* View Toggle */}
        <div className="mb-6">
          <div className="flex bg-gradient-to-r from-indigo-100 to-indigo-50 rounded-lg p-1 border border-indigo-200 w-fit">
            <button
              onClick={() => setViewMode("form")}
              className={`px-4 py-2 rounded-md flex items-center gap-2 transition-all ${
                viewMode === "form"
                  ? "bg-white shadow-sm text-indigo-600 border border-indigo-200"
                  : "text-indigo-700 hover:text-indigo-900 hover:bg-indigo-50/50"
              }`}
            >
              <FileText className="w-4 h-4" />
              Configuration
            </button>
            <button
              onClick={() => setViewMode("results")}
              disabled={!showResults}
              className={`px-4 py-2 rounded-md flex items-center gap-2 transition-all ${
                viewMode === "results"
                  ? "bg-white shadow-sm text-indigo-600 border border-indigo-200"
                  : "text-indigo-700 hover:text-indigo-900 hover:bg-indigo-50/50"
              } ${!showResults ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <BarChart3 className="w-4 h-4" />
              Results
            </button>
          </div>
        </div>

        {/* Configuration Form */}
        {viewMode === "form" && (
          <div className="space-y-6">
            {/* Basic Configuration */}
            <div className="bg-white rounded-2xl p-6 border border-indigo-200 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-gradient-to-br from-indigo-100 to-indigo-50 rounded-lg border border-indigo-200">
                  <Compass className="w-5 h-5 text-indigo-600" />
                </div>
                <h2 className="text-lg font-bold text-indigo-900">
                  Basic Configuration
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                {/* Branch */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Building className="w-4 h-4 text-indigo-600" />
                    Branch
                  </label>
                  <select
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    className="w-full px-4 py-3 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    {branchOptions.map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>

                {/* Semester */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-violet-600" />
                    Semester
                  </label>
                  <select
                    value={sem}
                    onChange={(e) => setSem(Number(e.target.value))}
                    className="w-full px-4 py-3 border border-violet-200 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                      <option key={s} value={s}>Semester {s}</option>
                    ))}
                  </select>
                </div>

                {/* Existing Divisions */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <FolderPlus className="w-4 h-4 text-emerald-600" />
                    Existing Divisions
                  </label>
                  <div className="relative">
                    <select
                      onChange={(e) => {
                        const division = existingDivisions.find(d => d.class_id === e.target.value);
                        if (division) loadExistingDivision(division);
                        e.target.value = "";
                      }}
                      disabled={isLoadingExisting || existingDivisions.length === 0}
                      className="w-full px-4 py-3 border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:opacity-50"
                    >
                      <option value="">Load existing division...</option>
                      {existingDivisions.map(div => (
                        <option key={div.class_id} value={div.class_id}>
                          {div.class_name} ({div.faculty_count} faculty)
                        </option>
                      ))}
                    </select>
                    {isLoadingExisting && (
                      <Loader2 className="absolute right-3 top-3.5 w-4 h-4 animate-spin text-emerald-600" />
                    )}
                  </div>
                  {existingDivisions.length > 0 && (
                    <p className="text-xs text-gray-500 mt-2">
                      {existingDivisions.length} divisions found
                    </p>
                  )}
                </div>
              </div>

              {/* Generation Settings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-rose-600" />
                    Lectures per Day
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="8"
                    value={lecturesPerDay}
                    onChange={(e) => setLecturesPerDay(e.target.value)}
                    className="w-full px-4 py-3 border border-rose-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                  />
                  <p className="text-xs text-gray-500 mt-2">Maximum lectures per day for each division</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-amber-600" />
                    Max Free Lectures
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="24"
                    value={maxFreeLectures}
                    onChange={(e) => setMaxFreeLectures(e.target.value)}
                    className="w-full px-4 py-3 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  />
                  <p className="text-xs text-gray-500 mt-2">Maximum allowed free slots per division</p>
                </div>
              </div>
            </div>

            {/* Shared Rooms Configuration */}
            <div className="bg-white rounded-2xl p-6 border border-indigo-200 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-gradient-to-br from-violet-100 to-violet-50 rounded-lg border border-violet-200">
                  <DoorOpen className="w-5 h-5 text-violet-600" />
                </div>
                <h2 className="text-lg font-bold text-violet-900">
                  Shared Rooms Configuration
                </h2>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Available Rooms (shared across all divisions)
                </label>
                <div className="flex flex-wrap gap-2 mb-4">
                  {sharedRooms.map((room, index) => (
                    <div key={index} className="flex items-center gap-2 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-200">
                      <span className="text-sm font-medium text-indigo-700">{room}</span>
                      <button
                        onClick={() => removeSharedRoom(index)}
                        className="text-indigo-500 hover:text-indigo-700"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newRoom}
                    onChange={(e) => setNewRoom(e.target.value)}
                    placeholder="Enter new room (e.g., Lab 5)"
                    className="flex-1 px-4 py-2 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <button
                    onClick={addNewRoomToShared}
                    disabled={!newRoom.trim()}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Add Room
                  </button>
                </div>
              </div>
            </div>

            {/* Divisions Configuration */}
            <div className="bg-white rounded-2xl p-6 border border-indigo-200 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-teal-100 to-teal-50 rounded-lg border border-teal-200">
                    <Users className="w-5 h-5 text-teal-600" />
                  </div>
                  <h2 className="text-lg font-bold text-teal-900">
                    Divisions Configuration ({divisions.length})
                  </h2>
                </div>
                <button
                  onClick={addNewDivision}
                  className="px-4 py-2 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition-colors flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Division
                </button>
              </div>

              {divisions.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-2">No divisions added yet</p>
                  <p className="text-gray-500 text-sm">Click "Add Division" to start configuring</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {divisions.map((division, divIndex) => (
                    <div key={divIndex} className="border border-gray-200 rounded-lg overflow-hidden">
                      <div className="p-4 bg-gradient-to-r from-teal-50 to-teal-100 border-b border-teal-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-white rounded-lg border border-teal-200">
                              <Notebook className="w-5 h-5 text-teal-600" />
                            </div>
                            <div>
                              <input
                                type="text"
                                value={division.class_name}
                                onChange={(e) => updateDivisionField(divIndex, "class_name", e.target.value)}
                                className="text-lg font-bold bg-transparent border-b border-teal-300 focus:border-teal-500 focus:outline-none"
                              />
                              <p className="text-sm text-teal-700 mt-1">
                                {division.subjects.length} subject(s) configured
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => removeDivision(divIndex)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>

                      <div className="p-4 bg-white">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-medium text-gray-900">Subjects</h3>
                          <button
                            onClick={() => addSubjectToDivision(divIndex)}
                            className="px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-lg text-sm font-medium hover:bg-indigo-200 transition-colors flex items-center gap-2"
                          >
                            <Plus className="w-3 h-3" />
                            Add Subject
                          </button>
                        </div>

                        {division.subjects.length === 0 ? (
                          <div className="text-center py-6 border-2 border-dashed border-gray-300 rounded-lg">
                            <BookOpen className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                            <p className="text-gray-500 text-sm">No subjects added</p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {division.subjects.map((subject, subIndex) => (
                              <div key={subIndex} className="border border-gray-200 rounded-lg p-4">
                                <div className="flex items-center justify-between mb-4">
                                  <h4 className="font-medium text-gray-900">Subject {subIndex + 1}</h4>
                                  <button
                                    onClick={() => removeSubjectFromDivision(divIndex, subIndex)}
                                    className="p-1 text-gray-400 hover:text-red-500"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                  {/* Subject Name */}
                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                      Subject Name
                                    </label>
                                    <select
                                      value={subject.subject_name}
                                      onChange={(e) => updateSubjectField(divIndex, subIndex, "subject_name", e.target.value)}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    >
                                      <option value="">Select Subject</option>
                                      {subjectOptions.map(sub => (
                                        <option key={sub} value={sub}>{sub}</option>
                                      ))}
                                    </select>
                                  </div>

                                  {/* Weekly Hours */}
                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                      Weekly Hours
                                    </label>
                                    <input
                                      type="number"
                                      min="1"
                                      max="10"
                                      value={subject.weekly_hours}
                                      onChange={(e) => updateSubjectField(divIndex, subIndex, "weekly_hours", e.target.value)}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                  </div>

                                  {/* Subject Type */}
                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                      Subject Type
                                    </label>
                                    <select
                                      value={subject.subject_type}
                                      onChange={(e) => updateSubjectField(divIndex, subIndex, "subject_type", e.target.value)}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    >
                                      {subjectTypeOptions.map(type => (
                                        <option key={type} value={type}>{type}</option>
                                      ))}
                                    </select>
                                  </div>

                                  {/* Faculty */}
                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                      Faculty
                                    </label>
                                    <select
                                      value={subject.faculty_id}
                                      onChange={(e) => updateSubjectField(divIndex, subIndex, "faculty_id", e.target.value)}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    >
                                      <option value="">Select Faculty</option>
                                      {facultyList.map(faculty => (
                                        <option key={faculty.id} value={faculty.id}>
                                          {faculty.displayLabel}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-4">
              <button
                onClick={handleGenerateTimetables}
                disabled={isGenerating || divisions.length === 0}
                className={`px-8 py-3 rounded-lg font-bold flex items-center gap-2 transition-all duration-300 ${
                  isGenerating || divisions.length === 0
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-indigo-600 to-indigo-700 text-white hover:from-indigo-700 hover:to-indigo-800 shadow-sm hover:shadow-md"
                }`}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5" />
                    Generate Timetables
                  </>
                )}
              </button>

              <button
                onClick={resetForm}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Reset Form
              </button>
            </div>
          </div>
        )}

        {/* Results View */}
        {viewMode === "results" && generatedResults && (
          <div className="space-y-6">
            {/* Results Header */}
            <div className="bg-white rounded-2xl p-6 border border-indigo-200 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-emerald-100 to-emerald-50 rounded-lg border border-emerald-200">
                    <BarChart3 className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-emerald-900">
                      Generation Results
                    </h2>
                    <p className="text-emerald-700 text-sm mt-1">
                      {generatedResults.success ? "Successfully generated" : "Partially generated"} timetables
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setViewMode("form")}
                    className="px-4 py-2 border border-indigo-300 text-indigo-700 rounded-lg font-medium hover:bg-indigo-50 transition-colors"
                  >
                    Back to Form
                  </button>
                  <button
                    onClick={handleSaveGeneratedTimetables}
                    disabled={isLoading || !generatedResults.success}
                    className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 ${
                      isLoading || !generatedResults.success
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-gradient-to-r from-emerald-600 to-emerald-700 text-white hover:from-emerald-700 hover:to-emerald-800"
                    }`}
                  >
                    <Save className="w-4 h-4" />
                    Save All to Database
                  </button>
                </div>
              </div>

              {/* Statistics */}
              {statistics && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-4 rounded-lg border border-indigo-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-indigo-700">Total Divisions</p>
                        <p className="text-2xl font-bold text-indigo-900 mt-1">
                          {statistics.totalDivisions}
                        </p>
                      </div>
                      <Users className="w-8 h-8 text-indigo-600 opacity-60" />
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-teal-50 to-teal-100 p-4 rounded-lg border border-teal-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-teal-700">Total Lectures</p>
                        <p className="text-2xl font-bold text-teal-900 mt-1">
                          {statistics.totalLectures}
                        </p>
                      </div>
                      <Clock className="w-8 h-8 text-teal-600 opacity-60" />
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-4 rounded-lg border border-amber-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-amber-700">Free Lectures</p>
                        <p className="text-2xl font-bold text-amber-900 mt-1">
                          {statistics.totalFreeLectures}
                        </p>
                      </div>
                      <Activity className="w-8 h-8 text-amber-600 opacity-60" />
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-violet-50 to-violet-100 p-4 rounded-lg border border-violet-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-violet-700">Faculty Updated</p>
                        <p className="text-2xl font-bold text-violet-900 mt-1">
                          {statistics.facultyUpdated}
                        </p>
                      </div>
                      <PenTool className="w-8 h-8 text-violet-600 opacity-60" />
                    </div>
                  </div>
                </div>
              )}

              {/* Warnings and Errors */}
              {generatedResults.warnings && generatedResults.warnings.length > 0 && (
                <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-amber-800">Warnings</p>
                      <ul className="text-amber-700 text-sm mt-1 space-y-1">
                        {generatedResults.warnings.map((warning, index) => (
                          <li key={index}>• {warning}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Generated Timetables */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-blue-100 to-blue-50 rounded-lg border border-blue-200">
                  <Grid className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="text-lg font-bold text-blue-900">
                  Generated Timetables
                </h3>
              </div>

              {Object.entries(generatedResults.divisions || {}).map(([divisionName, data]) => (
                <div key={divisionName} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-lg text-gray-900">
                      {divisionName}
                      <span className="ml-3 text-sm font-normal text-gray-600">
                        {data.stats?.total_lectures || 0} lectures • {data.stats?.free_lectures || 0} free slots
                      </span>
                    </h4>
                    {data.stats?.subject_allocation && (
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(data.stats.subject_allocation).map(([subject, hours]) => (
                          <span key={subject} className="px-2 py-1 bg-teal-100 text-teal-700 text-xs rounded border border-teal-200">
                            {subject}: {hours}h
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  {renderTimetablePreview(divisionName, data.timetable)}
                </div>
              ))}
            </div>

            {/* Action Buttons at Bottom */}
            <div className="flex items-center gap-4 pt-6 border-t border-gray-200">
              <button
                onClick={handleSaveGeneratedTimetables}
                disabled={isLoading || !generatedResults.success}
                className={`px-6 py-3 rounded-lg font-medium flex items-center gap-2 ${
                  isLoading || !generatedResults.success
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-emerald-600 to-emerald-700 text-white hover:from-emerald-700 hover:to-emerald-800"
                }`}
              >
                <Save className="w-4 h-4" />
                Save All to Database
              </button>
              <button
                onClick={resetForm}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Generate New
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}