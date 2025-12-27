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
  UserPlus,
  X,
  Search,
  Check,
  Plus,
  User,
  Hash,
} from "lucide-react";
import api from "../configs/api";
import Alert from "../components/Alert";

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
    { label: "Lecture 1", value: "Time Slot 1" },
    { label: "Lecture 2", value: "Time Slot 2" },
    { label: "Lecture 3", value: "Time Slot 3" },
    { label: "Lecture 4", value: "Time Slot 4" },
    { label: "Lecture 5", value: "Time Slot 5" },
  ];

  const branchOptions = ["CSE", "CSE(AIML)", "DS", "IT"];
  const divisionOptions = [
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

  // Default faculty options - will be overridden by fetched data
  const baseFacultyOptions = [
    {
      value: "free",
      label: "Free",
      color: "border-emerald-200 bg-emerald-50 text-emerald-700",
      bgColor: "bg-emerald-50",
      textColor: "text-emerald-700",
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
  const [facultyOptions, setFacultyOptions] = useState(baseFacultyOptions);
  const [classFacultyMap, setClassFacultyMap] = useState({}); // Map of class -> allowed faculty

  // Faculty management states
  const [showFacultyModal, setShowFacultyModal] = useState(false);
  const [allAvailableFaculties, setAllAvailableFaculties] = useState([]);
  const [selectedFacultiesToAdd, setSelectedFacultiesToAdd] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoadingAllFaculties, setIsLoadingAllFaculties] = useState(false);

  // New faculty creation states
  const [showCreateFaculty, setShowCreateFaculty] = useState(false);
  const [newFacultyId, setNewFacultyId] = useState("");
  const [newFacultyName, setNewFacultyName] = useState("");
  const [isCreatingFaculty, setIsCreatingFaculty] = useState(false);
  const [createFacultyError, setCreateFacultyError] = useState("");

  // Delete modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [divisionToDelete, setDivisionToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Alert state
  const [alert, setAlert] = useState(null);

  // Faculty color mapping for consistent styling
  const facultyColors = [
    "border-blue-200 bg-blue-50 text-blue-700",
    "border-purple-200 bg-purple-50 text-purple-700",
    "border-amber-200 bg-amber-50 text-amber-700",
    "border-red-200 bg-red-50 text-red-700",
    "border-indigo-200 bg-indigo-50 text-indigo-700",
    "border-pink-200 bg-pink-50 text-pink-700",
    "border-cyan-200 bg-cyan-50 text-cyan-700",
    "border-green-200 bg-green-50 text-green-700",
    "border-yellow-200 bg-yellow-50 text-yellow-700",
    "border-orange-200 bg-orange-50 text-orange-700",
    "border-teal-200 bg-teal-50 text-teal-700",
    "border-rose-200 bg-rose-50 text-rose-700",
    "border-violet-200 bg-violet-50 text-violet-700",
    "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700",
    "border-sky-200 bg-sky-50 text-sky-700",
  ];

  // Show alert message
  const showAlert = (main, info, type) => {
    setAlert({ main, info, type });
    setTimeout(() => setAlert(null), 5000);
  };

  // Initialize empty schedule for all divisions and days
  const initializeSchedule = (divisions) => {
    const schedule = {};
    divisions.forEach((division) => {
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
     🔹 FETCH ALL FACULTIES FROM DATABASE
  ======================= */
  const fetchAllFaculties = async () => {
    setIsLoadingAllFaculties(true);
    try {
      const response = await api.get("/api/faculties");
      if (response.data.success) {
        const faculties = response.data.faculties || [];

        // Format faculties for display in modal
        const formattedFaculties = faculties.map((faculty, index) => {
          // Use faculty.id as both id and facultyId since your API returns them as the same
          const facultyId = faculty.id || faculty._id || `faculty-${index}`;
          const facultyName = faculty.name || "Unknown Faculty";

          return {
            id: facultyId, // Use the same ID
            facultyId: facultyId, // Same as id
            name: facultyName,
            displayLabel: `${facultyName} (${facultyId})`,
            colorIndex: index % facultyColors.length,
          };
        });

        setAllAvailableFaculties(formattedFaculties);
        return formattedFaculties;
      } else {
        throw new Error("Failed to fetch faculties");
      }
    } catch (error) {
      console.error("Error fetching all faculties:", error);
      showAlert(
        "Failed to fetch faculties",
        "Using sample faculty data instead",
        "error"
      );

      // Fallback to sample data for demo
      const sampleFaculties = [
        {
          id: "FAC001",
          facultyId: "FAC001",
          name: "Dr. Rajesh Kumar",
          displayLabel: "Dr. Rajesh Kumar (FAC001)",
          colorIndex: 0,
        },
        {
          id: "FAC002",
          facultyId: "FAC002",
          name: "Prof. Anita Sharma",
          displayLabel: "Prof. Anita Sharma (FAC002)",
          colorIndex: 1,
        },
        {
          id: "FAC003",
          facultyId: "FAC003",
          name: "Dr. Vikram Singh",
          displayLabel: "Dr. Vikram Singh (FAC003)",
          colorIndex: 2,
        },
        {
          id: "FAC004",
          facultyId: "FAC004",
          name: "Prof. Meena Patel",
          displayLabel: "Prof. Meena Patel (FAC004)",
          colorIndex: 3,
        },
        {
          id: "FAC005",
          facultyId: "FAC005",
          name: "Dr. Sanjay Gupta",
          displayLabel: "Dr. Sanjay Gupta (FAC005)",
          colorIndex: 4,
        },
        {
          id: "FAC006",
          facultyId: "FAC006",
          name: "Dr. Priya Nair",
          displayLabel: "Dr. Priya Nair (FAC006)",
          colorIndex: 5,
        },
        {
          id: "FAC007",
          facultyId: "FAC007",
          name: "Prof. Ramesh Iyer",
          displayLabel: "Prof. Ramesh Iyer (FAC007)",
          colorIndex: 6,
        },
        {
          id: "FAC008",
          facultyId: "FAC008",
          name: "Dr. Kavita Reddy",
          displayLabel: "Dr. Kavita Reddy (FAC008)",
          colorIndex: 7,
        },
      ];
      setAllAvailableFaculties(sampleFaculties);
      return sampleFaculties;
    } finally {
      setIsLoadingAllFaculties(false);
    }
  };

  /* =======================
     🔹 CREATE NEW FACULTY
  ======================= */
  const handleCreateNewFaculty = async () => {
    // Validate inputs
    if (!newFacultyId.trim()) {
      setCreateFacultyError("Faculty ID is required");
      return;
    }

    if (!newFacultyName.trim()) {
      setCreateFacultyError("Faculty Name is required");
      return;
    }

    // Check if faculty ID already exists
    const facultyExists = allAvailableFaculties.some(
      (faculty) =>
        faculty.facultyId.toLowerCase() === newFacultyId.trim().toLowerCase() ||
        faculty.id.toLowerCase() === newFacultyId.trim().toLowerCase()
    );

    if (facultyExists) {
      setCreateFacultyError("A faculty with this ID already exists");
      return;
    }

    setIsCreatingFaculty(true);
    setCreateFacultyError("");

    try {
      // Create faculty in backend
      const response = await api.post("/api/faculties", {
        id: newFacultyId.trim(),
        name: newFacultyName.trim(),
      });

      if (response.data.success) {
        // Create new faculty object
        const newFaculty = {
          id: newFacultyId.trim(),
          facultyId: newFacultyId.trim(),
          name: newFacultyName.trim(),
          displayLabel: `${newFacultyName.trim()} (${newFacultyId.trim()})`,
          colorIndex: allAvailableFaculties.length % facultyColors.length,
        };

        // Update all available faculties list
        const updatedFaculties = [...allAvailableFaculties, newFaculty];
        setAllAvailableFaculties(updatedFaculties);

        // Also select the new faculty automatically
        setSelectedFacultiesToAdd((prev) => [...prev, newFaculty]);

        // Reset form
        setNewFacultyId("");
        setNewFacultyName("");
        setShowCreateFaculty(false);

        // Show success message using Alert component
        setCreateFacultyError("");
        showAlert(
          "Faculty created successfully",
          `"${newFacultyName}" has been created and selected for addition`,
          "success"
        );
      } else {
        throw new Error(response.data.message || "Failed to create faculty");
      }
    } catch (error) {
      console.error("Error creating faculty:", error);
      showAlert(
        "Failed to create faculty",
        error.response?.data?.message || "Please try again",
        "error"
      );
    } finally {
      setIsCreatingFaculty(false);
    }
  };

  /* =======================
     🔹 FETCH ALLOWED FACULTY FOR EACH CLASS
  ======================= */
  const fetchAllowedFacultyForClasses = async (classes) => {
    if (!classes || classes.length === 0) return {};

    try {
      const facultyMap = {};

      // Fetch faculty data for each class
      const fetchPromises = classes.map(async (className) => {
        try {
          const response = await api.get("/api/classwise-faculty", {
            params: {
              sem: sem,
              branch: branch,
              class: className,
            },
          });

          return {
            class: className,
            faculty: response.data.allowed_faculty || [],
            success: true,
          };
        } catch (error) {
          console.warn(`No faculty data found for class ${className}:`, error);
          return {
            class: className,
            faculty: [],
            success: false,
          };
        }
      });

      const results = await Promise.all(fetchPromises);

      // Build faculty map
      results.forEach((result) => {
        if (result.success && result.faculty.length > 0) {
          facultyMap[result.class] = result.faculty;
        } else {
          facultyMap[result.class] = [];
        }
      });

      // Update faculty options based on all unique faculty from all classes
      const allFaculty = new Set();
      Object.values(facultyMap).forEach((facultyList) => {
        facultyList.forEach((faculty) => allFaculty.add(faculty));
      });

      // Convert faculty codes to options with colors
      const uniqueFaculty = Array.from(allFaculty);
      const newFacultyOptions = [
        ...baseFacultyOptions,
        ...uniqueFaculty.map((facultyId, index) => {
          // Find faculty details from all available faculties
          const facultyDetails = allAvailableFaculties.find(
            (f) => f.facultyId === facultyId || f.id === facultyId
          );

          const facultyName = facultyDetails?.name || "";

          return {
            value: facultyId,
            label: facultyName ? `${facultyId} (${facultyName})` : facultyId,
            name: facultyName,
            color: facultyColors[index % facultyColors.length],
            bgColor: facultyColors[index % facultyColors.length]
              .split(" ")
              .slice(2, 4)
              .join(" "),
            textColor: facultyColors[index % facultyColors.length]
              .split(" ")
              .slice(4, 5)
              .join(" "),
          };
        }),
      ];

      setFacultyOptions(newFacultyOptions);
      setClassFacultyMap(facultyMap);

      return facultyMap;
    } catch (error) {
      console.error("Error fetching allowed faculty:", error);
      return {};
    }
  };

  /* =======================
     🔹 FETCH ALL CLASSES FOR BRANCH
  ======================= */
  const fetchAllClassesForBranch = async () => {
    if (!branch || !sem) return;

    setFetching(true);
    setErrorMsg("");

    try {
      // Fetch all available faculties first
      await fetchAllFaculties();

      // Then fetch all timetables to see which classes exist for this branch-semester
      const allTimetablesRes = await api.get("/api/timetable");
      const allTimetables = allTimetablesRes.data;

      // Filter timetables for the current branch and semester
      const branchTimetables = allTimetables.filter(
        (t) => t.branch === branch && t.sem === sem
      );

      // Extract unique classes from these timetables
      const existingClasses = [
        ...new Set(branchTimetables.map((t) => t.class)),
      ];

      // Update selected divisions with existing classes
      if (existingClasses.length > 0) {
        setSelectedDivisions(existingClasses);

        // Fetch allowed faculty for these classes
        const facultyMap = await fetchAllowedFacultyForClasses(existingClasses);

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
            Object.keys(data).forEach((day) => {
              if (updatedSchedule[division][day]) {
                Object.keys(data[day]).forEach((timeSlot) => {
                  if (updatedSchedule[division][day][timeSlot] !== undefined) {
                    updatedSchedule[division][day][timeSlot] =
                      data[day][timeSlot];
                  }
                });
              }
            });
          }
        });

        setSchedule(updatedSchedule);

        // Show success message using Alert component
        if (existingClasses.length > 0) {
          showAlert(
            "Branch classes loaded",
            `${existingClasses.length} existing classes loaded for ${branch} - Semester ${sem}`,
            "success"
          );
        }
      } else {
        // No existing timetables for this branch-semester
        setSelectedDivisions([]);
        setSchedule(initializeSchedule([]));
        setExistingTimetables({});
      }
    } catch (error) {
      console.error("Error fetching branch classes:", error);
      showAlert(
        "Failed to fetch branch timetable data",
        "Please try again later",
        "error"
      );
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

    try {
      // First, fetch allowed faculty for the selected classes
      await fetchAllowedFacultyForClasses(selectedDivisions);

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
      const fetchedTimetables = {};
      results.forEach(({ division, exists }) => {
        fetchedTimetables[division] = exists;
      });

      setExistingTimetables(fetchedTimetables);

      // Update schedule with fetched data
      const updatedSchedule = initializeSchedule(selectedDivisions);

      results.forEach(({ division, data, exists }) => {
        if (exists && data) {
          // Copy fetched data into the schedule
          Object.keys(data).forEach((day) => {
            if (updatedSchedule[division][day]) {
              Object.keys(data[day]).forEach((timeSlot) => {
                if (updatedSchedule[division][day][timeSlot] !== undefined) {
                  updatedSchedule[division][day][timeSlot] =
                    data[day][timeSlot];
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
      showAlert("Failed to fetch timetables", "Please try again", "error");
    } finally {
      setFetching(false);
    }
  };

  /* =======================
     🔹 ADD FACULTIES TO LEGEND AND DROPDOWNS
  ======================= */
  const handleAddFaculties = () => {
    if (selectedFacultiesToAdd.length === 0) return;

    // 1️⃣ Add to Faculty Legend
    const updatedFacultyOptions = [...facultyOptions];

    selectedFacultiesToAdd.forEach((faculty, idx) => {
      const exists = updatedFacultyOptions.some(
        (f) => f.value === faculty.facultyId || f.value === faculty.id
      );

      if (!exists) {
        const color =
          facultyColors[
            (updatedFacultyOptions.length - 1) % facultyColors.length
          ];
        const parts = color.split(" ");

        updatedFacultyOptions.push({
          value: faculty.facultyId || faculty.id, // Use facultyId or id
          label: `${faculty.name} (${faculty.facultyId || faculty.id})`,
          name: faculty.name,
          color,
          bgColor: parts[2] + " " + (parts[3] || ""),
          textColor: parts[4] || parts[3],
        });
      }
    });

    setFacultyOptions(updatedFacultyOptions);

    // 2️⃣ 🔥 ALSO add to classFacultyMap for selected divisions
    setClassFacultyMap((prev) => {
      const updated = { ...prev };

      selectedDivisions.forEach((division) => {
        const existing = updated[division] || [];

        selectedFacultiesToAdd.forEach((faculty) => {
          const facultyId = faculty.facultyId || faculty.id;
          if (facultyId && !existing.includes(facultyId)) {
            existing.push(facultyId);
          }
        });

        updated[division] = [...existing];
      });

      return updated;
    });

    // 3️⃣ Reset modal
    setSelectedFacultiesToAdd([]);
    setShowFacultyModal(false);
    setSearchQuery("");

    // Show success message using Alert component
    showAlert(
      "Faculty added successfully",
      `${selectedFacultiesToAdd.length} faculty added to legend and all class dropdowns`,
      "success"
    );
  };

  /* =======================
     🔹 HANDLE DIVISION SELECTION
  ======================= */
  const handleDivisionToggle = (division) => {
    setSelectedDivisions((prev) => {
      const newDivisions = prev.includes(division)
        ? prev.filter((d) => d !== division)
        : [...prev, division];

      // Update schedule with newly added divisions
      if (!prev.includes(division)) {
        setSchedule((prevSchedule) => ({
          ...prevSchedule,
          [division]: days.reduce((dayAcc, day) => {
            dayAcc[day] = timeSlots.reduce((slotAcc, slot) => {
              slotAcc[slot.value] = "free";
              return slotAcc;
            }, {});
            return dayAcc;
          }, {}),
        }));

        // Fetch faculty for the newly added class
        fetchAllowedFacultyForClasses([division]);
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
     🔹 DELETE TIMETABLE FOR A CLASS
  ======================= */
  const handleDeleteTimetable = async () => {
    if (!divisionToDelete) return;

    setIsDeleting(true);
    try {
      const formData = new FormData();
      formData.append("sem", sem);
      formData.append("branch", branch);
      formData.append("class", divisionToDelete);

      const response = await api.delete("/api/timetable", {
        data: formData,
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.status === 200) {
        // Remove division from selected divisions
        setSelectedDivisions((prev) =>
          prev.filter((d) => d !== divisionToDelete)
        );

        // Remove from schedule
        const { [divisionToDelete]: removed, ...newSchedule } = schedule;
        setSchedule(newSchedule);

        // Remove from existing timetables
        const newExisting = { ...existingTimetables };
        delete newExisting[divisionToDelete];
        setExistingTimetables(newExisting);

        // Remove from collapsed divisions
        const newCollapsed = { ...collapsedDivisions };
        delete newCollapsed[divisionToDelete];
        setCollapsedDivisions(newCollapsed);

        // Show success message
        showAlert(
          "Timetable deleted successfully",
          `Class ${divisionToDelete} timetable has been deleted`,
          "success"
        );
      }
    } catch (error) {
      console.error("Error deleting timetable:", error);
      showAlert(
        "Failed to delete timetable",
        error.response?.data?.error || "Please try again",
        "error"
      );
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
      setDivisionToDelete(null);
    }
  };

  /* =======================
     🔹 CHECK IF CLASS HAS ALL FREE LECTURES
  ======================= */
  const hasAllFreeLectures = (division) => {
    if (!schedule[division]) return true;

    for (const day of days) {
      for (const slot of timeSlots) {
        const facultyValue = schedule[division][day]?.[slot.value];
        if (facultyValue && facultyValue !== "free") {
          return false;
        }
      }
    }
    return true;
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

  // Fetch all faculties when modal opens
  useEffect(() => {
    if (showFacultyModal && allAvailableFaculties.length === 0) {
      fetchAllFaculties();
    }
  }, [showFacultyModal]);

  /* =======================
     🔹 HANDLERS
  ======================= */
  const handleFacultyChange = (division, day, timeSlot, value) => {
    setSchedule((prev) => ({
      ...prev,
      [division]: {
        ...prev[division],
        [day]: {
          ...prev[division][day],
          [timeSlot]: value,
        },
      },
    }));
    setSaved(false);
    setErrorMsg("");
  };

  const toggleDivisionCollapse = (division) => {
    setCollapsedDivisions((prev) => ({
      ...prev,
      [division]: !prev[division],
    }));
  };

  const toggleDayCollapse = (division, day) => {
    setCollapsedDays((prev) => ({
      ...prev,
      [`${division}-${day}`]: !prev[`${division}-${day}`],
    }));
  };

  const toggleFacultySelection = (faculty) => {
    setSelectedFacultiesToAdd((prev) => {
      const isSelected = prev.some((f) => f.id === faculty.id);
      if (isSelected) {
        return prev.filter((f) => f.id !== faculty.id);
      } else {
        return [...prev, faculty];
      }
    });
  };

  const filteredFaculties = allAvailableFaculties.filter(
    (faculty) =>
      faculty.displayLabel.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (faculty.facultyId &&
        faculty.facultyId.toLowerCase().includes(searchQuery.toLowerCase())) ||
      faculty.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  /* =======================
     🔹 SAVE TIMETABLES FOR ALL DIVISIONS
  ======================= */
  const handleSubmit = async () => {
    if (selectedDivisions.length === 0) {
      showAlert(
        "No classes selected",
        "Please select at least one division",
        "error"
      );
      return;
    }

    // Check if any class has all free lectures
    const emptyClasses = [];
    selectedDivisions.forEach((division) => {
      if (hasAllFreeLectures(division)) {
        emptyClasses.push(division);
      }
    });

    if (emptyClasses.length > 0) {
      showAlert(
        "Empty timetables detected",
        `Class${emptyClasses.length > 1 ? "es" : ""} ${emptyClasses.join(
          ", "
        )} ${
          emptyClasses.length > 1 ? "have" : "has"
        } no faculty assigned. Please assign at least one faculty or delete/deselect the class${
          emptyClasses.length > 1 ? "es" : ""
        }.`,
        "error"
      );
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
      selectedDivisions.forEach((division) => {
        updatedExisting[division] = true;
      });
      setExistingTimetables(updatedExisting);

      setErrorMsg("");

      // Show success message using Alert component
      showAlert(
        "Timetables saved successfully",
        `All ${selectedDivisions.length} class timetables have been saved for ${branch} - Semester ${sem}`,
        "success"
      );
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

        showAlert(
          "Schedule conflict",
          `Faculty ${data.faculty} is already assigned on ${
            dayMap[data.day]
          } (${data.time_slot}). Please choose a different faculty member.`,
          "error"
        );
      } else {
        showAlert("Failed to save timetables", "Please try again", "error");
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
    if (
      window.confirm(
        "Clear all faculty assignments for all selected divisions?"
      )
    ) {
      setSchedule(initializeSchedule(selectedDivisions));
      setSaved(false);
    }
  };

  const getFacultyStyle = (val) => {
    const faculty = facultyOptions.find((f) => f.value === val);
    return faculty || facultyOptions[0];
  };

  // Get faculty options for a specific class
  const getFacultyOptionsForClass = (division) => {
    // Return ALL faculty options from the legend, not just class-specific ones
    return facultyOptions;
  };

  // Load all classes for current branch
  const handleLoadBranchClasses = () => {
    fetchAllClassesForBranch();
  };

  // Reset new faculty form
  const resetNewFacultyForm = () => {
    setNewFacultyId("");
    setNewFacultyName("");
    setCreateFacultyError("");
    setShowCreateFaculty(false);
  };

  // Open delete confirmation modal
  const openDeleteModal = (division, e) => {
    e.stopPropagation(); // Prevent division toggle
    setDivisionToDelete(division);
    setShowDeleteModal(true);
  };

  /* =======================
     🔹 RENDER
  ======================= */
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 p-4 md:p-6">
      {/* Alert Component */}
      {alert && (
        <Alert
          main={alert.main}
          info={alert.info}
          type={alert.type}
          onClose={() => setAlert(null)}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">
                  Delete Timetable
                </h2>
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDivisionToDelete(null);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="flex items-center justify-center mb-6">
                <div className="p-3 bg-red-50 rounded-full">
                  <Trash2 className="w-8 h-8 text-red-600" />
                </div>
              </div>
              <h3 className="text-lg font-medium text-gray-900 text-center mb-2">
                Delete {divisionToDelete} Timetable?
              </h3>
              <p className="text-gray-600 text-center mb-6">
                This will permanently delete the timetable for {branch} -
                Semester {sem}, Class {divisionToDelete}. All faculty
                assignments will be removed from faculty timetables.
              </p>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-red-800 font-medium">Warning</p>
                    <p className="text-red-700 text-sm mt-1">
                      This action cannot be undone. Please make sure you want to
                      proceed.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDivisionToDelete(null);
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteTimetable}
                  disabled={isDeleting}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                    isDeleting
                      ? "bg-red-400 text-white cursor-not-allowed"
                      : "bg-red-600 text-white hover:bg-red-700"
                  }`}
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Delete Timetable
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Faculty Management Modal */}
      {showFacultyModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Add Faculty Members
                  </h2>
                  <p className="text-gray-600 text-sm mt-1">
                    Select faculties to add to your timetable dropdowns or
                    create new faculty
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowFacultyModal(false);
                    setSelectedFacultiesToAdd([]);
                    setSearchQuery("");
                    resetNewFacultyForm();
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Search Bar */}
              <div className="mt-4 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search faculties by name or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Selected Count */}
              <div className="mt-3 flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  {selectedFacultiesToAdd.length} faculty selected
                </span>
                <span className="text-sm text-gray-600">
                  {filteredFaculties.length} available
                </span>
              </div>
            </div>

            {/* Create New Faculty Form */}
            {showCreateFaculty ? (
              <div className="p-6 border-b border-gray-200 bg-blue-50">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-900">
                    Create New Faculty
                  </h3>
                  <button
                    onClick={resetNewFacultyForm}
                    className="p-1 hover:bg-blue-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-600" />
                  </button>
                </div>

                {createFacultyError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-700 text-sm">{createFacultyError}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <div className="flex items-center gap-2">
                        <Hash className="w-4 h-4" />
                        Faculty ID
                      </div>
                    </label>
                    <input
                      type="text"
                      value={newFacultyId}
                      onChange={(e) => setNewFacultyId(e.target.value)}
                      placeholder="e.g., FAC009"
                      className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      Unique identifier for the faculty
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Faculty Name
                      </div>
                    </label>
                    <input
                      type="text"
                      value={newFacultyName}
                      onChange={(e) => setNewFacultyName(e.target.value)}
                      placeholder="e.g., Dr. Sunil Verma"
                      className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      Full name of the faculty member
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={resetNewFacultyForm}
                    className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateNewFaculty}
                    disabled={
                      isCreatingFaculty ||
                      !newFacultyId.trim() ||
                      !newFacultyName.trim()
                    }
                    className={`px-4 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                      isCreatingFaculty ||
                      !newFacultyId.trim() ||
                      !newFacultyName.trim()
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-blue-600 text-white hover:bg-blue-700"
                    }`}
                  >
                    {isCreatingFaculty ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        Create Faculty
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 border-b border-gray-200">
                <button
                  onClick={() => setShowCreateFaculty(true)}
                  className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 transition-all flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Create New Faculty
                </button>
              </div>
            )}

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6">
              {isLoadingAllFaculties ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-4" />
                  <p className="text-gray-600">Loading all faculties...</p>
                </div>
              ) : filteredFaculties.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No faculties found</p>
                  {searchQuery && (
                    <p className="text-gray-500 text-sm mt-1">
                      Try a different search term
                    </p>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {filteredFaculties.map((faculty) => {
                    const isSelected = selectedFacultiesToAdd.some(
                      (f) => f.id === faculty.id
                    );
                    const isAlreadyInOptions = facultyOptions.some(
                      (option) =>
                        option.value === faculty.facultyId ||
                        option.value === faculty.id
                    );

                    return (
                      <div
                        key={faculty.id}
                        onClick={() =>
                          !isAlreadyInOptions && toggleFacultySelection(faculty)
                        }
                        className={`p-4 rounded-xl border cursor-pointer transition-all ${
                          isAlreadyInOptions
                            ? "border-gray-200 bg-gray-50 opacity-75 cursor-not-allowed"
                            : isSelected
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`w-5 h-5 rounded-full border flex items-center justify-center mt-0.5 flex-shrink-0 ${
                              isAlreadyInOptions
                                ? "border-gray-300 bg-gray-200"
                                : isSelected
                                ? "border-blue-500 bg-blue-500"
                                : "border-gray-300"
                            }`}
                          >
                            {isAlreadyInOptions ? (
                              <Check className="w-3 h-3 text-gray-500" />
                            ) : isSelected ? (
                              <Check className="w-3 h-3 text-white" />
                            ) : null}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <div>
                                <h3 className="font-medium text-gray-900 truncate">
                                  {faculty.name}
                                </h3>
                                <p className="text-sm text-gray-600 mt-1">
                                  ID: {faculty.facultyId || faculty.id}
                                </p>
                              </div>
                              {isAlreadyInOptions && (
                                <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded whitespace-nowrap">
                                  Already added
                                </span>
                              )}
                            </div>
                            {isAlreadyInOptions && (
                              <p className="text-xs text-gray-500 mt-2">
                                This faculty is already available in dropdowns
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">
                    Selected: {selectedFacultiesToAdd.length} faculty
                  </p>
                  {selectedFacultiesToAdd.length > 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      Selected faculty will be added to all class dropdowns
                    </p>
                  )}
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowFacultyModal(false);
                      setSelectedFacultiesToAdd([]);
                      setSearchQuery("");
                      resetNewFacultyForm();
                    }}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddFaculties}
                    disabled={selectedFacultiesToAdd.length === 0}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      selectedFacultiesToAdd.length === 0
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-blue-600 text-white hover:bg-blue-700"
                    }`}
                  >
                    Add Selected Faculty
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Breadcrumb */}
        <div className="mb-6">
          <div className="flex items-center text-sm text-gray-600 mb-4">
            <span className="hover:text-gray-800 cursor-pointer">
              Dashboard
            </span>
            <ChevronRight className="w-4 h-4 mx-2" />
            <span className="hover:text-gray-800 cursor-pointer">
              Timetable Management
            </span>
            <ChevronRight className="w-4 h-4 mx-2" />
            <span className="font-medium text-blue-600">
              {selectedDivisions.length > 0
                ? `Edit ${branch} - Sem ${sem}`
                : "Create Timetables"}
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
                ? `Managing ${selectedDivisions.length} class${
                    selectedDivisions.length !== 1 ? "es" : ""
                  } for ${branch}`
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
          <div
            className={`mb-6 p-4 rounded-xl border flex items-start gap-3 ${
              errorMsg.includes("Loaded") ||
              errorMsg.includes("Added") ||
              errorMsg.includes("created successfully") ||
              errorMsg.includes("Failed to fetch")
                ? "border-blue-200 bg-blue-50"
                : errorMsg.includes("already assigned")
                ? "border-red-200 bg-red-50"
                : "border-red-200 bg-red-50"
            }`}
          >
            <AlertCircle
              className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                errorMsg.includes("Loaded") ||
                errorMsg.includes("Added") ||
                errorMsg.includes("created successfully") ||
                errorMsg.includes("Failed to fetch")
                  ? "text-blue-500"
                  : "text-red-500"
              }`}
            />
            <div>
              <p
                className={`font-medium ${
                  errorMsg.includes("Loaded") ||
                  errorMsg.includes("Added") ||
                  errorMsg.includes("created successfully") ||
                  errorMsg.includes("Failed to fetch")
                    ? "text-blue-800"
                    : "text-red-800"
                }`}
              >
                {errorMsg.includes("Added") ||
                errorMsg.includes("created successfully")
                  ? "Success"
                  : errorMsg.includes("already assigned")
                  ? "Schedule Conflict"
                  : "Information"}
              </p>
              <p
                className={`text-sm mt-1 ${
                  errorMsg.includes("Loaded") ||
                  errorMsg.includes("Added") ||
                  errorMsg.includes("created successfully") ||
                  errorMsg.includes("Failed to fetch")
                    ? "text-blue-600"
                    : "text-red-600"
                }`}
              >
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
                All {selectedDivisions.length} class timetables have been saved
                for {branch} - Semester {sem}.
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
                    <option key={b} value={b}>
                      {b}
                    </option>
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
                const allowedFaculty = classFacultyMap[division] || [];

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
                    title={`Allowed faculty: ${
                      allowedFaculty.length > 0
                        ? allowedFaculty.join(", ")
                        : "None assigned"
                    }`}
                  >
                    {division}
                    {isSelected && exists && (
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    )}
                    {allowedFaculty.length > 0 && (
                      <span className="text-xs bg-gray-200 px-1.5 py-0.5 rounded">
                        {allowedFaculty.length}
                      </span>
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
                <span className="text-sm text-gray-600">
                  Selected (Existing)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-gray-100 border border-gray-300 rounded"></div>
                <span className="text-sm text-gray-600">Not Selected</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-purple-100 border border-purple-300 rounded"></div>
                <span className="text-sm text-gray-600">
                  Has Allowed Faculty
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Legend & Controls */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm flex-1">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700">
                Faculty Legend
              </h3>
              <button
                onClick={() => setShowFacultyModal(true)}
                className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-medium flex items-center gap-2 hover:bg-blue-100 transition-colors"
              >
                <UserPlus className="w-3 h-3" />
                Add Faculty
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {facultyOptions.map((faculty) => {
                // Skip formatting for "free" option
                if (faculty.value === "free") {
                  return (
                    <div
                      key={faculty.value}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium ${faculty.color} border`}
                    >
                      {faculty.label}
                      {faculty.name !== "" && ` (${faculty.name})`}
                    </div>
                  );
                }

                // For faculty entries, use the stored name if available
                const facultyId = faculty.value;
                const facultyName = faculty.name || "";

                return (
                  <div
                    key={faculty.value}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium ${faculty.color} border`}
                    title={`${facultyId}${
                      facultyName ? ` (${facultyName})` : ""
                    }`}
                  >
                    {facultyName ? `${facultyId} (${facultyName})` : facultyId}
                  </div>
                );
              })}
            </div>
            <div className="text-xs text-gray-500 mt-3">
              Note: Each class only shows faculty assigned to it from the
              classwise_faculty collection.
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              View Options
            </h3>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => setShowFreeSlots(!showFreeSlots)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2 ${
                  showFreeSlots
                    ? "bg-blue-100 text-blue-700 border border-blue-200"
                    : "bg-gray-100 text-gray-700 border border-gray-200"
                }`}
              >
                {showFreeSlots ? (
                  <Eye className="w-3 h-3" />
                ) : (
                  <EyeOff className="w-3 h-3" />
                )}
                {showFreeSlots ? "Show Free Slots" : "Hide Free Slots"}
              </button>
              <div className="text-xs text-gray-500 mt-1">
                Showing {selectedDivisions.length} class
                {selectedDivisions.length !== 1 ? "es" : ""}
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
                const allowedFaculty = classFacultyMap[division] || [];
                const isEmpty = hasAllFreeLectures(division);

                return (
                  <div
                    key={division}
                    className="bg-white rounded-xl border border-gray-200 shadow-sm relative"
                  >
                    {/* Empty Warning Badge */}
                    {isEmpty && exists && (
                      <div className="absolute -top-2 -right-2">
                        <div className="bg-red-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          Empty
                        </div>
                      </div>
                    )}

                    {/* Division Header */}
                    <div
                      className={`p-4 border-b ${
                        exists
                          ? "bg-green-50 border-green-200"
                          : "bg-blue-50 border-blue-200"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Building
                            className={`w-5 h-5 ${
                              exists ? "text-green-600" : "text-blue-600"
                            }`}
                          />
                          <div>
                            <h3 className="font-bold text-lg text-gray-900">
                              {division}
                            </h3>
                            <div className="flex items-center gap-2 mt-1">
                              <div
                                className={`text-xs px-2 py-1 rounded-full ${
                                  exists
                                    ? "bg-green-100 text-green-800 border border-green-200"
                                    : "bg-blue-100 text-blue-800 border border-blue-200"
                                }`}
                              >
                                {exists ? "Existing" : "New"}
                              </div>
                              <div className="text-xs text-gray-500">
                                {
                                  Object.values(
                                    schedule[division] || {}
                                  ).flatMap((day) =>
                                    Object.values(day).filter(
                                      (val) => val !== "free"
                                    )
                                  ).length
                                }{" "}
                                assigned slots
                              </div>
                              {allowedFaculty.length > 0 && (
                                <div className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                                  {allowedFaculty.length} faculty
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {/* Delete Button - Only for existing timetables */}
                          {exists && (
                            <button
                              onClick={(e) => openDeleteModal(division, e)}
                              className="p-1.5 hover:bg-red-50 text-red-500 hover:text-red-600 rounded-lg transition-colors"
                              title="Delete timetable"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
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
                    </div>

                    {/* Weekdays inside Division (when not collapsed) */}
                    {!isCollapsed && (
                      <div className="p-4">
                        <div className="space-y-3">
                          {days.map((day) => {
                            const dayCollapsedKey = `${division}-${day}`;
                            const isDayCollapsed =
                              collapsedDays[dayCollapsedKey];

                            // Count assigned slots for this day
                            const assignedCount = schedule[division]?.[day]
                              ? Object.values(schedule[division][day]).filter(
                                  (val) => val !== "free"
                                ).length
                              : 0;

                            return (
                              <div
                                key={day}
                                className="border border-gray-200 rounded-lg overflow-hidden"
                              >
                                {/* Day Header */}
                                <div
                                  onClick={() =>
                                    toggleDayCollapse(division, day)
                                  }
                                  className="p-3 bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors flex items-center justify-between"
                                >
                                  <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-gray-500" />
                                    <span className="font-medium text-gray-900">
                                      {day}
                                    </span>
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
                                        const facultyValue =
                                          schedule[division]?.[day]?.[
                                            slot.value
                                          ] || "free";
                                        const faculty =
                                          getFacultyStyle(facultyValue);
                                        const isFree = facultyValue === "free";
                                        const classFacultyOptions =
                                          getFacultyOptionsForClass(division);

                                        if (!showFreeSlots && isFree)
                                          return null;

                                        return (
                                          <div
                                            key={slot.value}
                                            className="flex items-center gap-2 p-2 border border-gray-100 rounded hover:bg-gray-50 transition-colors"
                                          >
                                            <div className="w-16 text-xs text-gray-600 font-medium">
                                              {slot.label}
                                            </div>
                                            <select
                                              value={facultyValue}
                                              onChange={(e) =>
                                                handleFacultyChange(
                                                  division,
                                                  day,
                                                  slot.value,
                                                  e.target.value
                                                )
                                              }
                                              className={`flex-1 px-3 py-1.5 text-sm rounded-lg border ${faculty.color} focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all`}
                                            >
                                              {classFacultyOptions.map((f) => {
                                                // For "free" option, keep as is
                                                if (f.value === "free") {
                                                  return (
                                                    <option
                                                      key={f.value}
                                                      value={f.value}
                                                    >
                                                      {f.label}
                                                    </option>
                                                  );
                                                }

                                                // For faculty entries, show ID (and name if available)
                                                const facultyId = f.value;
                                                const facultyName =
                                                  f.name || "";

                                                return (
                                                  <option
                                                    key={f.value}
                                                    value={f.value}
                                                  >
                                                    {facultyId}
                                                  </option>
                                                );
                                              })}
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
                            {
                              Object.values(schedule[division] || {}).flatMap(
                                (day) =>
                                  Object.values(day).filter(
                                    (val) => val !== "free"
                                  )
                              ).length
                            }{" "}
                            assigned slots
                          </p>
                          {allowedFaculty.length > 0 && (
                            <p className="text-xs mt-2">
                              Allowed faculty: {allowedFaculty.length}
                            </p>
                          )}
                          {isEmpty && exists && (
                            <p className="text-xs mt-2 text-red-600">
                              ⚠️ No faculty assigned
                            </p>
                          )}
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
                    <p className="text-sm text-gray-600">
                      Total Assigned Slots
                    </p>
                    <p className="text-2xl font-bold text-gray-900 mt-2">
                      {selectedDivisions.reduce((total, division) => {
                        return (
                          total +
                          Object.values(schedule[division] || {}).flatMap(
                            (day) =>
                              Object.values(day).filter((val) => val !== "free")
                          ).length
                        );
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
                    <p className="text-sm text-gray-600">Available Faculty</p>
                    <p className="text-2xl font-bold text-gray-900 mt-2">
                      {facultyOptions.length - 1} {/* Subtract "free" option */}
                    </p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg">
                    <GraduationCap className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Empty Timetables</p>
                    <p className="text-2xl font-bold text-gray-900 mt-2">
                      {
                        selectedDivisions.filter((division) =>
                          hasAllFreeLectures(division)
                        ).length
                      }
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
                  : `Save ${selectedDivisions.length} Timetable${
                      selectedDivisions.length !== 1 ? "s" : ""
                    }`}
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
              <span>
                <strong>Delete Timetable</strong> - Click the trash icon on
                existing class cards to permanently delete that timetable. This
                removes all faculty assignments for that class.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-1.5"></div>
              <span>
                <strong>Empty Timetable Validation</strong> - Classes with all
                free slots cannot be saved. Assign at least one faculty or
                delete the class.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-1.5"></div>
              <span>
                <strong>Faculty Management</strong> - Use the "Add Faculty"
                button to add faculty members from the database to your dropdown
                options.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-1.5"></div>
              <span>
                <strong>Create New Faculty</strong> - Click "Create New Faculty"
                in the modal to add a new faculty member by entering their ID
                and Name.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-1.5"></div>
              <span>
                <strong>Class-Specific Faculty</strong> - Each class dropdown
                only shows faculty assigned to that specific class in
                classwise_faculty collection.
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}