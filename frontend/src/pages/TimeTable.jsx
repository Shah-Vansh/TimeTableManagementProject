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
  Eye,
  EyeOff,
  Grid,
  Loader2,
  ChevronDown,
  ChevronUp,
  Building,
  Info,
} from "lucide-react";
import api from "../configs/api";

export default function TimeTable() {
  const location = useLocation();
  
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  
  const timeSlots = [
    { label: "8:00 - 9:00", value: "Time Slot 1" },
    { label: "9:00 - 10:00", value: "Time Slot 2" },
    { label: "10:00 - 11:00", value: "Time Slot 3" },
    { label: "11:00 - 12:00", value: "Time Slot 4" },
    { label: "12:00 - 1:00", value: "Time Slot 5" },
  ];

  const branchOptions = ["CSE", "CSE(AIML)", "DS", "ECE", "EEE", "ME", "CE"];
  const divisionOptions = ["D1", "D2", "D3", "D4", "A1", "A2", "B1", "B2"];

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
  const [sem, setSem] = useState(location.state?.sem || 1);
  const [branch, setBranch] = useState(location.state?.branch || "CSE");
  const [selectedDivisions, setSelectedDivisions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [collapsedDivisions, setCollapsedDivisions] = useState({});
  const [collapsedDays, setCollapsedDays] = useState({});
  const [existingTimetables, setExistingTimetables] = useState({});
  const [showFreeSlots, setShowFreeSlots] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Initialize empty schedule for all divisions and days
  const initializeSchedule = (divisions) => {
    const schedule = {};
    divisions.forEach(division => {
      schedule[division] = days.reduce((dayAcc, day) => {
        dayAcc[day] = timeSlots.reduce((slotAcc, slot) => {
          slotAcc[slot.value] = "free";
          return slotAcc;
        }, {});
        return dayAcc;
      }, {});
    });
    return schedule;
  };

  const [schedule, setSchedule] = useState(() => initializeSchedule([]));

  /* =======================
     🔹 FETCH ALL CLASSES FOR BRANCH
  ======================= */
  const fetchAllClassesForBranch = async () => {
    if (!branch || !sem) return;

    setFetching(true);
    setErrorMsg("");
    
    try {
      // First, fetch all timetables to see which classes exist for this branch-semester
      const allTimetablesRes = await api.get("/api/timetable");
      const allTimetables = allTimetablesRes.data;
      
      // Filter timetables for the current branch and semester
      const branchTimetables = allTimetables.filter(
        t => t.branch === branch && t.sem === sem
      );
      
      // Extract unique classes from these timetables
      const existingClasses = [...new Set(branchTimetables.map(t => t.class))];
      
      // Update selected divisions with existing classes
      if (existingClasses.length > 0) {
        setSelectedDivisions(existingClasses);
        
        // Also fetch schedule data for each class
        const fetchPromises = existingClasses.map(async (division) => {
          try {
            const response = await api.get("/api/fetchtimetable", {
              params: {
                sem: sem,
                branch: branch,
                class: division,
              },
            });
            return { division, data: response.data.schedule, exists: true };
          } catch (error) {
            if (error.response && error.response.status === 404) {
              return { division, data: null, exists: false };
            }
            throw error;
          }
        });

        const results = await Promise.all(fetchPromises);
        
        // Update existing timetables state
        const fetchedTimetables = {};
        results.forEach(({ division, exists }) => {
          fetchedTimetables[division] = exists;
        });
        setExistingTimetables(fetchedTimetables);

        // Update schedule with fetched data
        const updatedSchedule = initializeSchedule(existingClasses);
        
        results.forEach(({ division, data, exists }) => {
          if (exists && data) {
            // Copy fetched data into the schedule
            Object.keys(data).forEach(day => {
              if (updatedSchedule[division][day]) {
                Object.keys(data[day]).forEach(timeSlot => {
                  if (updatedSchedule[division][day][timeSlot] !== undefined) {
                    updatedSchedule[division][day][timeSlot] = data[day][timeSlot];
                  }
                });
              }
            });
          }
        });

        setSchedule(updatedSchedule);
        
        // Show success message
        if (existingClasses.length > 0) {
          setErrorMsg(`Loaded ${existingClasses.length} existing classes for ${branch} - Semester ${sem}`);
          setTimeout(() => setErrorMsg(""), 3000);
        }
      } else {
        // No existing timetables for this branch-semester
        setSelectedDivisions([]);
        setSchedule(initializeSchedule([]));
        setExistingTimetables({});
      }
    } catch (error) {
      console.error("Error fetching branch classes:", error);
      setErrorMsg("Failed to fetch branch timetable data. Please try again.");
    } finally {
      setFetching(false);
      setIsInitialLoad(false);
    }
  };

  /* =======================
     🔹 FETCH TIMETABLES FOR SELECTED DIVISIONS
  ======================= */
  const fetchTimetables = async () => {
    if (selectedDivisions.length === 0) {
      setSchedule(initializeSchedule([]));
      setExistingTimetables({});
      return;
    }

    setFetching(true);
    setErrorMsg("");
    const fetchedTimetables = {};

    try {
      // Fetch timetables for each selected division
      const fetchPromises = selectedDivisions.map(async (division) => {
        try {
          const response = await api.get("/api/fetchtimetable", {
            params: {
              sem: sem,
              branch: branch,
              class: division,
            },
          });

          return { division, data: response.data.schedule, exists: true };
        } catch (error) {
          if (error.response && error.response.status === 404) {
            return { division, data: null, exists: false };
          }
          throw error;
        }
      });

      const results = await Promise.all(fetchPromises);
      
      // Process results
      results.forEach(({ division, data, exists }) => {
        fetchedTimetables[division] = exists;
      });

      setExistingTimetables(fetchedTimetables);

      // Update schedule with fetched data
      const updatedSchedule = initializeSchedule(selectedDivisions);
      
      results.forEach(({ division, data, exists }) => {
        if (exists && data) {
          // Copy fetched data into the schedule
          Object.keys(data).forEach(day => {
            if (updatedSchedule[division][day]) {
              Object.keys(data[day]).forEach(timeSlot => {
                if (updatedSchedule[division][day][timeSlot] !== undefined) {
                  updatedSchedule[division][day][timeSlot] = data[day][timeSlot];
                }
              });
            }
          });
        }
      });

      setSchedule(updatedSchedule);
      setErrorMsg("");
    } catch (error) {
      console.error("Error fetching timetables:", error);
      setErrorMsg("Failed to fetch timetables. Please try again.");
    } finally {
      setFetching(false);
    }
  };

  /* =======================
     🔹 HANDLE DIVISION SELECTION
  ======================= */
  const handleDivisionToggle = (division) => {
    setSelectedDivisions(prev => {
      const newDivisions = prev.includes(division)
        ? prev.filter(d => d !== division)
        : [...prev, division];
      
      // Update schedule with newly added divisions
      if (!prev.includes(division)) {
        setSchedule(prevSchedule => ({
          ...prevSchedule,
          [division]: days.reduce((dayAcc, day) => {
            dayAcc[day] = timeSlots.reduce((slotAcc, slot) => {
              slotAcc[slot.value] = "free";
              return slotAcc;
            }, {});
            return dayAcc;
          }, {})
        }));
      } else {
        // Remove division from schedule
        const { [division]: removed, ...newSchedule } = schedule;
        setSchedule(newSchedule);
        
        // Remove from collapsed divisions
        const newCollapsed = { ...collapsedDivisions };
        delete newCollapsed[division];
        setCollapsedDivisions(newCollapsed);
      }
      
      return newDivisions;
    });
    setSaved(false);
  };

  /* =======================
     🔹 EFFECTS
  ======================= */
  useEffect(() => {
    // On initial load, if we have branch and sem from location state, load all classes
    if (isInitialLoad && location.state?.branch && location.state?.sem) {
      fetchAllClassesForBranch();
    }
  }, []);

  useEffect(() => {
    if (!isInitialLoad && selectedDivisions.length > 0) {
      const debounceTimer = setTimeout(() => {
        fetchTimetables();
      }, 300);

      return () => clearTimeout(debounceTimer);
    } else if (!isInitialLoad) {
      setSchedule(initializeSchedule([]));
      setExistingTimetables({});
      setErrorMsg("");
    }
  }, [sem, branch, selectedDivisions]);

  /* =======================
     🔹 HANDLERS
  ======================= */
  const handleFacultyChange = (division, day, timeSlot, value) => {
    setSchedule(prev => ({
      ...prev,
      [division]: {
        ...prev[division],
        [day]: {
          ...prev[division][day],
          [timeSlot]: value
        }
      }
    }));
    setSaved(false);
    setErrorMsg("");
  };

  const toggleDivisionCollapse = (division) => {
    setCollapsedDivisions(prev => ({
      ...prev,
      [division]: !prev[division],
    }));
  };

  const toggleDayCollapse = (division, day) => {
    setCollapsedDays(prev => ({
      ...prev,
      [`${division}-${day}`]: !prev[`${division}-${day}`],
    }));
  };

  /* =======================
     🔹 SAVE TIMETABLES FOR ALL DIVISIONS
  ======================= */
  const handleSubmit = async () => {
    if (selectedDivisions.length === 0) {
      setErrorMsg("Please select at least one division");
      return;
    }

    setIsLoading(true);
    setSaved(false);

    try {
      // Create save promises for each division
      const savePromises = selectedDivisions.map(async (division) => {
        const divisionSchedule = schedule[division];
        
        const formData = new FormData();
        formData.append("sem", sem);
        formData.append("branch", branch);
        formData.append("class", division);
        formData.append("schedule", JSON.stringify(divisionSchedule));

        const endpoint = existingTimetables[division] 
          ? "/api/timetable" 
          : "/api/timetable";

        return api.post(endpoint, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      });

      // Execute all save operations in parallel
      const results = await Promise.all(savePromises);
      
      console.log("Saved all timetables:", results);
      setSaved(true);
      
      // Update existing timetables state
      const updatedExisting = { ...existingTimetables };
      selectedDivisions.forEach(division => {
        updatedExisting[division] = true;
      });
      setExistingTimetables(updatedExisting);
      
      setErrorMsg("");
    } catch (error) {
      console.error("Error saving timetables:", error);

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
          `Faculty ${data.faculty} is already assigned on ${dayMap[data.day]} (${data.time_slot}). Please choose a different faculty member.`
        );
      } else {
        setErrorMsg("Failed to save timetables. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    fetchTimetables();
    setSaved(false);
  };

  const handleClear = () => {
    if (window.confirm("Clear all faculty assignments for all selected divisions?")) {
      setSchedule(initializeSchedule(selectedDivisions));
      setSaved(false);
    }
  };

  const getFacultyStyle = (val) => {
    const faculty = facultyOptions.find((f) => f.value === val);
    return faculty || facultyOptions[0];
  };

  // Load all classes for current branch
  const handleLoadBranchClasses = () => {
    fetchAllClassesForBranch();
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
              {selectedDivisions.length > 0 ? `Edit ${branch} - Sem ${sem}` : "Create Timetables"}
            </span>
          </div>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {selectedDivisions.length > 0 
                ? `${branch} - Semester ${sem} Timetable` 
                : "Branch Timetable Management"}
            </h1>
            <p className="text-gray-600">
              {selectedDivisions.length > 0
                ? `Managing ${selectedDivisions.length} class${selectedDivisions.length !== 1 ? 'es' : ''} for ${branch}`
                : "Manage timetables for multiple classes within a branch"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white rounded-xl border border-gray-200 shadow-sm">
              <Grid className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Status Messages */}
        {errorMsg && (
          <div className={`mb-6 p-4 rounded-xl border flex items-start gap-3 ${
            errorMsg.includes("Loaded") || errorMsg.includes("No existing") || errorMsg.includes("Failed to fetch")
              ? "border-amber-200 bg-amber-50"
              : errorMsg.includes("already assigned")
              ? "border-red-200 bg-red-50"
              : "border-red-200 bg-red-50"
          }`}>
            <AlertCircle className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
              errorMsg.includes("Loaded") || errorMsg.includes("No existing") || errorMsg.includes("Failed to fetch")
                ? "text-amber-500"
                : "text-red-500"
            }`} />
            <div>
              <p className={`font-medium ${
                errorMsg.includes("Loaded") || errorMsg.includes("No existing") || errorMsg.includes("Failed to fetch")
                  ? "text-amber-800"
                  : "text-red-800"
              }`}>
                {errorMsg.includes("Loaded") 
                  ? "Information" 
                  : errorMsg.includes("already assigned")
                  ? "Schedule Conflict"
                  : "Information"}
              </p>
              <p className={`text-sm mt-1 ${
                errorMsg.includes("Loaded") || errorMsg.includes("No existing") || errorMsg.includes("Failed to fetch")
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
                Timetables Saved Successfully
              </p>
              <p className="text-emerald-600 text-sm mt-1">
                All {selectedDivisions.length} class timetables have been saved for {branch} - Semester {sem}.
              </p>
            </div>
          </div>
        )}

        {/* Configuration Panel */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Branch Configuration
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
                  onChange={(e) => {
                    setSem(Number(e.target.value));
                    setIsInitialLoad(false);
                  }}
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
                  onChange={(e) => {
                    setBranch(e.target.value);
                    setIsInitialLoad(false);
                  }}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                >
                  {branchOptions.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Load Branch Button */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Branch Actions
              </label>
              <button
                onClick={handleLoadBranchClasses}
                disabled={fetching || !branch || !sem}
                className={`w-full px-4 py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-all ${
                  fetching || !branch || !sem
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                {fetching ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <Building className="w-5 h-5" />
                    Load Branch Classes
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Division Selection */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">
                Select Classes for {branch}
              </label>
              <div className="text-sm text-gray-500">
                {selectedDivisions.length} selected
                {fetching && (
                  <Loader2 className="inline-block ml-2 w-4 h-4 animate-spin text-blue-600" />
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {divisionOptions.map((division) => {
                const isSelected = selectedDivisions.includes(division);
                const exists = existingTimetables[division];
                
                return (
                  <button
                    key={division}
                    onClick={() => handleDivisionToggle(division)}
                    className={`px-4 py-2 rounded-lg border transition-all duration-200 flex items-center gap-2 ${
                      isSelected
                        ? exists
                          ? "bg-green-100 border-green-300 text-green-800 hover:bg-green-200"
                          : "bg-blue-100 border-blue-300 text-blue-800 hover:bg-blue-200"
                        : "bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {division}
                    {isSelected && exists && (
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    )}
                  </button>
                );
              })}
            </div>
            <div className="flex flex-wrap items-center gap-4 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-100 border border-blue-300 rounded"></div>
                <span className="text-sm text-gray-600">Selected (New)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-100 border border-green-300 rounded"></div>
                <span className="text-sm text-gray-600">Selected (Existing)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-gray-100 border border-gray-300 rounded"></div>
                <span className="text-sm text-gray-600">Not Selected</span>
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
            <div className="flex flex-col gap-2">
              <button
                onClick={() => setShowFreeSlots(!showFreeSlots)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2 ${
                  showFreeSlots
                    ? "bg-blue-100 text-blue-700 border border-blue-200"
                    : "bg-gray-100 text-gray-700 border border-gray-200"
                }`}
              >
                {showFreeSlots ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                {showFreeSlots ? "Show Free Slots" : "Hide Free Slots"}
              </button>
              <div className="text-xs text-gray-500 mt-1">
                Showing {selectedDivisions.length} class{selectedDivisions.length !== 1 ? 'es' : ''}
              </div>
            </div>
          </div>
        </div>

        {/* Timetable Grid - Divisions as Main Columns */}
        {selectedDivisions.length > 0 && (
          <>
            {/* Division Columns Header */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-4">
              {selectedDivisions.map((division) => {
                const isCollapsed = collapsedDivisions[division];
                const exists = existingTimetables[division];
                
                return (
                  <div key={division} className="bg-white rounded-xl border border-gray-200 shadow-sm">
                    {/* Division Header */}
                    <div className={`p-4 border-b ${exists ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Building className={`w-5 h-5 ${exists ? 'text-green-600' : 'text-blue-600'}`} />
                          <div>
                            <h3 className="font-bold text-lg text-gray-900">{division}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              <div className={`text-xs px-2 py-1 rounded-full ${
                                exists 
                                  ? 'bg-green-100 text-green-800 border border-green-200'
                                  : 'bg-blue-100 text-blue-800 border border-blue-200'
                              }`}>
                                {exists ? 'Existing' : 'New'}
                              </div>
                              <div className="text-xs text-gray-500">
                                {Object.values(schedule[division] || {}).flatMap(day => 
                                  Object.values(day).filter(val => val !== 'free')
                                ).length} assigned slots
                              </div>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => toggleDivisionCollapse(division)}
                          className="p-1 hover:bg-white/50 rounded-lg transition-colors"
                        >
                          {isCollapsed ? (
                            <ChevronDown className="w-5 h-5 text-gray-500" />
                          ) : (
                            <ChevronUp className="w-5 h-5 text-gray-500" />
                          )}
                        </button>
                      </div>
                    </div>
                    
                    {/* Weekdays inside Division (when not collapsed) */}
                    {!isCollapsed && (
                      <div className="p-4">
                        <div className="space-y-3">
                          {days.map((day) => {
                            const dayCollapsedKey = `${division}-${day}`;
                            const isDayCollapsed = collapsedDays[dayCollapsedKey];
                            
                            // Count assigned slots for this day
                            const assignedCount = schedule[division]?.[day] 
                              ? Object.values(schedule[division][day]).filter(val => val !== 'free').length
                              : 0;
                            
                            return (
                              <div key={day} className="border border-gray-200 rounded-lg overflow-hidden">
                                {/* Day Header */}
                                <div 
                                  onClick={() => toggleDayCollapse(division, day)}
                                  className="p-3 bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors flex items-center justify-between"
                                >
                                  <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-gray-500" />
                                    <span className="font-medium text-gray-900">{day}</span>
                                    <span className="text-xs text-gray-500">
                                      ({assignedCount}/{timeSlots.length} slots)
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {isDayCollapsed ? (
                                      <ChevronDown className="w-4 h-4 text-gray-500" />
                                    ) : (
                                      <ChevronUp className="w-4 h-4 text-gray-500" />
                                    )}
                                  </div>
                                </div>
                                
                                {/* Time slots for this day (when not collapsed) */}
                                {!isDayCollapsed && (
                                  <div className="p-3 bg-white">
                                    <div className="space-y-2 max-h-96 overflow-y-auto">
                                      {timeSlots.map((slot) => {
                                        const facultyValue = schedule[division]?.[day]?.[slot.value] || 'free';
                                        const faculty = getFacultyStyle(facultyValue);
                                        const isFree = facultyValue === 'free';
                                        
                                        if (!showFreeSlots && isFree) return null;
                                        
                                        return (
                                          <div key={slot.value} className="flex items-center gap-2 p-2 border border-gray-100 rounded hover:bg-gray-50 transition-colors">
                                            <div className="w-16 text-xs text-gray-600 font-medium">{slot.label}</div>
                                            <select
                                              value={facultyValue}
                                              onChange={(e) => handleFacultyChange(division, day, slot.value, e.target.value)}
                                              className={`flex-1 px-3 py-1.5 text-sm rounded-lg border ${faculty.color} focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all`}
                                            >
                                              {facultyOptions.map((f) => (
                                                <option key={f.value} value={f.value}>
                                                  {f.label}
                                                </option>
                                              ))}
                                            </select>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    
                    {/* Collapsed View */}
                    {isCollapsed && (
                      <div className="p-4 text-center">
                        <div className="text-gray-500 text-sm py-8">
                          <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p>Click expand to view {days.length} days</p>
                          <p className="text-xs mt-1">
                            {Object.values(schedule[division] || {}).flatMap(day => 
                              Object.values(day).filter(val => val !== 'free')
                            ).length} assigned slots
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Selected Classes</p>
                    <p className="text-2xl font-bold text-gray-900 mt-2">
                      {selectedDivisions.length}
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
                    <p className="text-sm text-gray-600">Total Assigned Slots</p>
                    <p className="text-2xl font-bold text-gray-900 mt-2">
                      {selectedDivisions.reduce((total, division) => {
                        return total + Object.values(schedule[division] || {}).flatMap(day => 
                          Object.values(day).filter(val => val !== "free")
                        ).length;
                      }, 0)}
                    </p>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <Clock className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Existing Timetables</p>
                    <p className="text-2xl font-bold text-gray-900 mt-2">
                      {Object.values(existingTimetables).filter(v => v).length}
                    </p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">New Timetables</p>
                    <p className="text-2xl font-bold text-gray-900 mt-2">
                      {selectedDivisions.length - Object.values(existingTimetables).filter(v => v).length}
                    </p>
                  </div>
                  <div className="p-3 bg-amber-50 rounded-lg">
                    <AlertCircle className="w-6 h-6 text-amber-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-4 justify-center mb-12">
              <button
                onClick={handleSubmit}
                disabled={isLoading || selectedDivisions.length === 0}
                className={`px-8 py-3 rounded-lg font-medium flex items-center gap-2 transition-all duration-300 ${
                  isLoading || selectedDivisions.length === 0
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-sm hover:shadow-md"
                }`}
              >
                <Save className="w-5 h-5" />
                {isLoading
                  ? "Saving..."
                  : saved
                  ? "All Timetables Saved"
                  : `Save ${selectedDivisions.length} Timetable${selectedDivisions.length !== 1 ? 's' : ''}`}
              </button>

              <button
                onClick={handleClear}
                disabled={selectedDivisions.length === 0}
                className={`px-6 py-3 rounded-lg border font-medium flex items-center gap-2 transition-all duration-300 ${
                  selectedDivisions.length === 0
                    ? "border-gray-200 text-gray-400 cursor-not-allowed"
                    : "border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                <Trash2 className="w-5 h-5" />
                Clear All Classes
              </button>

              <button
                onClick={handleReset}
                disabled={selectedDivisions.length === 0}
                className={`px-6 py-3 rounded-lg border font-medium flex items-center gap-2 transition-all duration-300 ${
                  selectedDivisions.length === 0
                    ? "border-gray-200 text-gray-400 cursor-not-allowed"
                    : "border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                <RefreshCw className="w-5 h-5" />
                Reload Timetables
              </button>
            </div>
          </>
        )}

        {/* Quick Tips */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
          <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
            <Info className="w-5 h-5" />
            How It Works
          </h3>
          <ul className="space-y-2 text-blue-800 text-sm">
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-1.5"></div>
              <span><strong>From Dashboard</strong> - When you click "Edit" on a branch, all classes for that branch-semester will be automatically loaded.</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-1.5"></div>
              <span><strong>Create New</strong> - Select branch and semester, then click "Load Branch Classes" to see existing classes or manually select classes.</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-1.5"></div>
              <span><strong>Batch Management</strong> - All selected classes will be saved simultaneously when you click "Save Timetables".</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-1.5"></div>
              <span><strong>Collapse Views</strong> - Use chevron buttons to collapse/expand entire classes or individual days.</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}