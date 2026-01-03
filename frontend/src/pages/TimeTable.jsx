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
  Key,
  Copy,
  Download,
  Plus,
  User,
  Hash,
  MessageSquare,
  MoreVertical,
  Edit,
  Notebook,
  BookOpen,
  PenTool,
  Compass,
  StickyNote,
  Highlighter,
  Bookmark,
  Scissors,
  Ruler,
  Palette,
  Clipboard,
  FolderPlus,
  FileText,
  Layers,
  BookmarkCheck,
  FileCheck,
  Archive,
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
      label: "Free Period",
      color: "border-orange-200 bg-orange-50 text-orange-700",
      bgColor: "bg-orange-50",
      textColor: "text-orange-700",
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

  // Telegram Chat IDs state (array)
  const [telegramChatIds, setTelegramChatIds] = useState([]);
  const [isEditingTelegram, setIsEditingTelegram] = useState(false);
  const [isSavingTelegram, setIsSavingTelegram] = useState(false);
  const [newChatId, setNewChatId] = useState("");

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

  // Faculty credentials
  const [generatedCredentials, setGeneratedCredentials] = useState(null);
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [copiedField, setCopiedField] = useState("");

  // Token declare
  const token = localStorage.getItem("token");

  // Faculty color mapping for consistent styling
  const facultyColors = [
    "border-amber-200 bg-amber-50 text-amber-700",
    "border-rose-200 bg-rose-50 text-rose-700",
    "border-orange-200 bg-orange-50 text-orange-700",
    "border-violet-200 bg-violet-50 text-violet-700",
    "border-rose-200 bg-rose-50 text-rose-700",
    "border-cyan-200 bg-cyan-50 text-cyan-700",
    "border-pink-200 bg-pink-50 text-pink-700",
    "border-indigo-200 bg-indigo-50 text-indigo-700",
    "border-lime-200 bg-lime-50 text-lime-700",
    "border-orange-200 bg-orange-50 text-orange-700",
    "border-teal-200 bg-teal-50 text-teal-700",
    "border-sky-200 bg-sky-50 text-sky-700",
    "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700",
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
     🔹 FETCH TELEGRAM CHAT IDs FOR BRANCH
  ======================= */
  const fetchTelegramChatIds = async () => {
    try {
      const response = await api.get("/api/branch-telegram", {
        params: {
          branch: branch,
          sem: sem,
        },
      });

      if (response.data.success) {
        // Ensure we always work with an array
        const chatIds = response.data.telegram_chat_ids || [];
        setTelegramChatIds(Array.isArray(chatIds) ? chatIds : [chatIds]);
      } else {
        setTelegramChatIds([]);
      }
    } catch (error) {
      console.error("Error fetching Telegram Chat IDs:", error);
      setTelegramChatIds([]);
    }
  };

  /* =======================
     🔹 UPDATE TELEGRAM CHAT IDs FOR BRANCH
  ======================= */
  const handleUpdateTelegramChatIds = async () => {
    // Validate each chat ID
    const invalidChatIds = telegramChatIds.filter(
      (id) => id.trim() && !/^-?\d+$/.test(id.trim())
    );

    if (invalidChatIds.length > 0) {
      showAlert("Invalid format", "Telegram Chat IDs must be numbers", "error");
      return;
    }

    // Filter out empty strings and trim the rest
    const cleanedChatIds = telegramChatIds
      .map((id) => id.trim())
      .filter((id) => id !== "");

    setIsSavingTelegram(true);
    try {
      const response = await api.put("/api/branch-telegram", {
        branch: branch,
        sem: sem,
        telegram_chat_ids: cleanedChatIds,
      });

      if (response.data.success) {
        setTelegramChatIds(cleanedChatIds);
        setIsEditingTelegram(false);
        setNewChatId("");

        const message =
          cleanedChatIds.length > 0
            ? `${cleanedChatIds.length} chat ID${
                cleanedChatIds.length !== 1 ? "s" : ""
              } set for ${branch} Semester ${sem}`
            : "All Telegram Chat IDs cleared";

        showAlert("Telegram Chat IDs updated", message, "success");
      } else {
        throw new Error(
          response.data.error || "Failed to update Telegram Chat IDs"
        );
      }
    } catch (error) {
      console.error("Error updating Telegram Chat IDs:", error);
      showAlert(
        "Update failed",
        error.response?.data?.error || "Please try again",
        "error"
      );
    } finally {
      setIsSavingTelegram(false);
    }
  };

  // Add a new chat ID field
  const handleAddChatIdField = () => {
    setTelegramChatIds([...telegramChatIds, newChatId]);
    setNewChatId("");
  };

  // Remove a chat ID
  const handleRemoveChatId = (index) => {
    const updatedChatIds = telegramChatIds.filter((_, i) => i !== index);
    setTelegramChatIds(updatedChatIds);
  };

  // Update a specific chat ID
  const handleUpdateChatId = (index, value) => {
    const updatedChatIds = [...telegramChatIds];
    updatedChatIds[index] = value;
    setTelegramChatIds(updatedChatIds);
  };

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

      const response = await api.post(
        "/api/faculties",
        {
          id: newFacultyId.trim(),
          name: newFacultyName.trim(),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (response.data.success) {
        // Store credentials if provided by backend
        if (response.data.credentials) {
          const username = newFacultyId.trim(); // or newFacultyName if you want name-based
          const password = `${username}@NLJIET`; // auto-generate password

          setGeneratedCredentials({
            name: newFacultyName.trim(),
            ...response.data.credentials,
            password, // add the generated password here
          });

          // Close the create faculty form but keep the main modal open
          setShowCreateFaculty(false);
          setShowCredentialsModal(true);
        }

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

  const copyToClipboard = async (text, field) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(""), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
      showAlert("Failed to copy to clipboard", "Please try again", "error");
    }
  };

  const downloadCredentials = () => {
    if (!generatedCredentials) return;

    const content = `Faculty Login Credentials
========================

Faculty Name: ${generatedCredentials.name}
Username: ${generatedCredentials.username}
Password: ${generatedCredentials.username}

⚠️ IMPORTANT:
- Please save these credentials securely
- The password will not be shown again
- Change the password after first login

Generated on: ${new Date().toLocaleString()}
`;

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${generatedCredentials.username}_credentials.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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

      // Fetch Telegram Chat IDs for this branch
      await fetchTelegramChatIds();

      // Then fetch all timetables to see which classes exist for this branch-semester
      const allTimetablesRes = await api.get("/api/timetable", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
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
            const response = await api.get("/api/timetable/fetchtimetable", {
              headers: {
                Authorization: `Bearer ${token}`,
              },
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
            "Study sections loaded",
            `${existingClasses.length} existing study groups loaded for ${branch} - Semester ${sem}`,
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
        "Failed to fetch study planner data",
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
          const response = await api.get(
            "/api/timetable/fetchtimetable",
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
              params: {
                sem: sem,
                branch: branch,
                class: division,
              },
            },
          );

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
      showAlert("Failed to fetch study schedules", "Please try again", "error");
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
      "Tutor added successfully",
      `${selectedFacultiesToAdd.length} tutor(s) added to legend and all study group dropdowns`,
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
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
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
          "Study schedule deleted",
          `Study group ${divisionToDelete} schedule has been removed`,
          "success"
        );
      }
    } catch (error) {
      console.error("Error deleting timetable:", error);
      showAlert(
        "Failed to delete study schedule",
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

  // Fetch Telegram Chat IDs when branch or semester changes
  useEffect(() => {
    if (branch && sem) {
      fetchTelegramChatIds();
    }
  }, [branch, sem]);

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
        "No study groups selected",
        "Please select at least one study group",
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
        "Empty study schedules detected",
        `Study group${emptyClasses.length > 1 ? "s" : ""} ${emptyClasses.join(
          ", "
        )} ${
          emptyClasses.length > 1 ? "have" : "has"
        } no tutor assigned. Please assign at least one tutor or delete/deselect the study group${
          emptyClasses.length > 1 ? "s" : ""
        }.`,
        "error"
      );
      return;
    }

    setIsLoading(true);
    setSaved(false);

    try {
      // First, update Telegram Chat IDs for the branch if they're set
      if (telegramChatIds.length > 0) {
        try {
          // Filter out empty strings and trim
          const cleanedChatIds = telegramChatIds
            .map((id) => id.trim())
            .filter((id) => id !== "");

          if (cleanedChatIds.length > 0) {
            const response = await api.put("/api/branch-telegram", {
              branch: branch,
              sem: sem,
              telegram_chat_ids: cleanedChatIds,
            });

            if (!response.data.success) {
              console.warn(
                "Failed to update Telegram Chat IDs:",
                response.data.error
              );
              // Continue saving timetables even if Telegram update fails
            }
          }
        } catch (error) {
          console.warn("Error updating Telegram Chat IDs:", error);
          // Continue saving timetables even if Telegram update fails
        }
      }

      // Create save promises for each division
      const savePromises = selectedDivisions.map(async (division) => {
        const divisionSchedule = schedule[division];

        const formData = new FormData();
        formData.append("sem", sem);
        formData.append("branch", branch);
        formData.append("class", division);
        formData.append("schedule", JSON.stringify(divisionSchedule));

        // Always include Telegram Chat IDs from state if available
        const cleanedChatIds = telegramChatIds
          .map((id) => id.trim())
          .filter((id) => id !== "");

        if (cleanedChatIds.length > 0) {
          cleanedChatIds.forEach((chatId, index) => {
            formData.append(`telegram_chat_ids[${index}]`, chatId);
          });
        }

        const endpoint = "/api/timetable"; // Always use POST for create/update

        return api.post(endpoint, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        });
      });

      // Execute all save operations in parallel
      const results = await Promise.all(savePromises);

      console.log("Saved all study schedules:", results);
      setSaved(true);

      // Update existing timetables state
      const updatedExisting = { ...existingTimetables };
      selectedDivisions.forEach((division) => {
        updatedExisting[division] = true;
      });
      setExistingTimetables(updatedExisting);

      setErrorMsg("");

      // Show success message with Telegram info
      const cleanedChatIds = telegramChatIds
        .map((id) => id.trim())
        .filter((id) => id !== "");

      const telegramMessage =
        cleanedChatIds.length > 0
          ? `${cleanedChatIds.length} Telegram Chat ID${
              cleanedChatIds.length !== 1 ? "s" : ""
            } have been stored for all study groups.`
          : "No Telegram Chat IDs were included.";

      showAlert(
        "Study schedules saved successfully",
        `All ${selectedDivisions.length} study group schedules have been saved for ${branch} - Semester ${sem}. ${telegramMessage}`,
        "success"
      );
    } catch (error) {
      console.error("Error saving study schedules:", error);

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
          `Tutor ${data.faculty} is already assigned on ${dayMap[data.day]} (${
            data.time_slot
          }). Please choose a different tutor.`,
          "error"
        );
      } else {
        showAlert(
          "Failed to save study schedules",
          "Please try again",
          "error"
        );
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
        "Clear all tutor assignments for all selected study groups?"
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
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-rose-50 p-4 md:p-6">
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
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden border border-amber-200">
            <div className="p-6 border-b border-amber-100 bg-gradient-to-r from-amber-50 to-amber-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-white rounded-lg border border-amber-200">
                    <Archive className="w-5 h-5 text-amber-600" />
                  </div>
                  <h2 className="text-xl font-bold text-amber-900">
                    Delete Study Schedule
                  </h2>
                </div>
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDivisionToDelete(null);
                  }}
                  className="p-2 hover:bg-white/50 rounded-lg transition-colors border border-amber-200"
                >
                  <X className="w-5 h-5 text-amber-600" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="flex items-center justify-center mb-6">
                <div className="p-3 bg-gradient-to-br from-red-100 to-red-50 rounded-full border border-red-200">
                  <Trash2 className="w-8 h-8 text-red-600" />
                </div>
              </div>
              <h3 className="text-lg font-bold text-gray-900 text-center mb-2">
                Delete {divisionToDelete} Study Schedule?
              </h3>
              <p className="text-gray-600 text-center mb-6">
                This will permanently remove the study schedule for{" "}
                <span className="font-semibold text-amber-700">{branch}</span> -
                Semester{" "}
                <span className="font-semibold text-amber-700">{sem}</span>,
                Study Group{" "}
                <span className="font-semibold text-amber-700">
                  {divisionToDelete}
                </span>
                .
              </p>

              <div className="bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-red-800 font-bold">Important Notice</p>
                    <p className="text-red-700 text-sm mt-1">
                      All tutor assignments for this study group will be removed
                      from tutor schedules. This action cannot be undone.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 bg-amber-50">
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDivisionToDelete(null);
                  }}
                  className="px-4 py-2 border border-amber-300 text-amber-700 rounded-lg font-medium hover:bg-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteTimetable}
                  disabled={isDeleting}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                    isDeleting
                      ? "bg-red-400 text-white cursor-not-allowed"
                      : "bg-gradient-to-r from-red-600 to-rose-600 text-white hover:from-red-700 hover:to-rose-700"
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
                      Delete Schedule
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Credentials Modal */}
      {showCredentialsModal && generatedCredentials && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 z-[100]">
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl border border-amber-200">
            <div className="p-6 bg-gradient-to-r from-orange-500 to-orange-600 text-white">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <Key className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Study Access Created!</h2>
                  <p className="text-orange-100 text-sm mt-1">
                    Tutor account created successfully
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                <div className="flex gap-3">
                  <StickyNote className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-amber-900 text-sm">
                      Save These Credentials!
                    </p>
                    <p className="text-amber-700 text-sm mt-1">
                      This password will not be shown again. Please save it
                      securely or download the credentials file.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Tutor Name
                  </label>
                  <div className="px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="font-medium text-gray-900">
                      {generatedCredentials.name}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Bookmark className="w-4 h-4" />
                    Username (Login ID)
                  </label>
                  <div className="flex gap-2">
                    <div className="flex-1 px-4 py-3 bg-gray-50 rounded-lg border border-gray-200 font-mono">
                      {generatedCredentials.username}
                    </div>
                    <button
                      onClick={() =>
                        copyToClipboard(
                          generatedCredentials.username,
                          "username"
                        )
                      }
                      className="px-4 py-2 bg-rose-100 text-rose-700 rounded-lg hover:bg-rose-200 transition-colors flex items-center gap-2 border border-rose-200"
                    >
                      {copiedField === "username" ? (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          Copy
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Key className="w-4 h-4" />
                    Password
                  </label>
                  <div className="flex gap-2">
                    <div className="flex-1 px-4 py-3 bg-gray-50 rounded-lg border border-gray-200 font-mono text-sm break-all">
                      {generatedCredentials.password}
                    </div>
                    <button
                      onClick={() =>
                        copyToClipboard(
                          generatedCredentials.password,
                          "password"
                        )
                      }
                      className="px-4 py-2 bg-rose-100 text-rose-700 rounded-lg hover:bg-rose-200 transition-colors flex items-center gap-2 border border-rose-200"
                    >
                      {copiedField === "password" ? (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          Copy
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 bg-amber-50">
              <div className="flex gap-3">
                <button
                  onClick={downloadCredentials}
                  className="flex-1 px-4 py-3 bg-white border border-amber-300 text-amber-700 rounded-lg font-medium hover:bg-amber-50 transition-colors flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download as File
                </button>
                <button
                  onClick={() => {
                    setShowCredentialsModal(false);
                    setGeneratedCredentials(null);
                  }}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-orange-600 to-orange-700 text-white rounded-lg font-medium hover:from-orange-700 hover:to-orange-800 transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Faculty Management Modal */}
      {showFacultyModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[80vh] overflow-hidden flex flex-col border border-amber-200">
            {/* Modal Header */}
            <div className="p-6 border-b border-amber-100 bg-gradient-to-r from-amber-50 to-amber-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg border border-amber-200">
                    <PenTool className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-amber-900">
                      Add Study Tutors
                    </h2>
                    <p className="text-amber-700 text-sm mt-1">
                      Select tutors to add to your schedule dropdowns or create
                      new tutor
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowFacultyModal(false);
                    setSelectedFacultiesToAdd([]);
                    setSearchQuery("");
                    resetNewFacultyForm();
                  }}
                  className="p-2 hover:bg-white/50 rounded-lg transition-colors border border-amber-200"
                >
                  <X className="w-5 h-5 text-amber-600" />
                </button>
              </div>

              {/* Search Bar */}
              <div className="mt-4 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-amber-400" />
                <input
                  type="text"
                  placeholder="Search tutors by name or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                />
              </div>

              {/* Selected Count */}
              <div className="mt-3 flex items-center justify-between">
                <span className="text-sm text-amber-700">
                  {selectedFacultiesToAdd.length} tutor(s) selected
                </span>
                <span className="text-sm text-amber-700">
                  {filteredFaculties.length} available
                </span>
              </div>
            </div>

            {/* Create New Faculty Form */}
            {showCreateFaculty ? (
              <div className="p-6 border-b border-amber-100 bg-rose-50">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-lg border border-rose-200">
                      <UserPlus className="w-5 h-5 text-rose-600" />
                    </div>
                    <h3 className="font-bold text-gray-900">
                      Create New Tutor
                    </h3>
                  </div>
                  <button
                    onClick={resetNewFacultyForm}
                    className="p-1 hover:bg-rose-100 rounded-lg transition-colors"
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
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <Hash className="w-4 h-4" />
                      Tutor ID
                    </label>
                    <input
                      type="text"
                      value={newFacultyId}
                      onChange={(e) => setNewFacultyId(e.target.value)}
                      placeholder="e.g., TUT009"
                      className="w-full px-4 py-2.5 bg-white border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      Unique identifier for the tutor
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Tutor Name
                    </label>
                    <input
                      type="text"
                      value={newFacultyName}
                      onChange={(e) => setNewFacultyName(e.target.value)}
                      placeholder="e.g., Dr. Sunil Verma"
                      className="w-full px-4 py-2.5 bg-white border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      Full name of the tutor
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={resetNewFacultyForm}
                    className="px-4 py-2.5 border border-amber-300 text-amber-700 rounded-lg font-medium hover:bg-amber-50 transition-colors"
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
                        : "bg-gradient-to-r from-amber-600 to-amber-700 text-white hover:from-amber-700 hover:to-amber-800"
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
                        Create Tutor
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 border-b border-amber-100">
                <button
                  onClick={() => setShowCreateFaculty(true)}
                  className="w-full px-4 py-3 border-2 border-dashed border-amber-300 rounded-xl text-amber-600 hover:border-amber-500 hover:text-amber-700 hover:bg-amber-50 transition-all flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Create New Tutor
                </button>
              </div>
            )}

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6">
              {isLoadingAllFaculties ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-amber-600 mb-4" />
                  <p className="text-gray-600">Loading all tutors...</p>
                </div>
              ) : filteredFaculties.length === 0 ? (
                <div className="text-center py-12">
                  <PenTool className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No tutors found</p>
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
                            ? "border-amber-500 bg-amber-50"
                            : "border-amber-200 hover:border-amber-300 hover:bg-amber-50"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mt-0.5 flex-shrink-0 ${
                              isAlreadyInOptions
                                ? "border-gray-300 bg-gray-200"
                                : isSelected
                                ? "border-amber-500 bg-amber-500"
                                : "border-amber-300"
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
                                This tutor is already available in dropdowns
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
            <div className="p-6 border-t border-amber-100 bg-amber-50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">
                    Selected: {selectedFacultiesToAdd.length} tutor(s)
                  </p>
                  {selectedFacultiesToAdd.length > 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      Selected tutor(s) will be added to all study group
                      dropdowns
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
                    className="px-4 py-2 border border-amber-300 text-amber-700 rounded-lg font-medium hover:bg-amber-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddFaculties}
                    disabled={selectedFacultiesToAdd.length === 0}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      selectedFacultiesToAdd.length === 0
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-gradient-to-r from-amber-600 to-amber-700 text-white hover:from-amber-700 hover:to-amber-800"
                    }`}
                  >
                    Add Selected Tutor(s)
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
            <span className="hover:text-gray-800 cursor-pointer flex items-center gap-1">
              <Bookmark className="w-3 h-3" />
              Dashboard
            </span>
            <ChevronRight className="w-4 h-4 mx-2" />
            <span className="hover:text-gray-800 cursor-pointer flex items-center gap-1">
              <Notebook className="w-3 h-3" />
              Study Planner
            </span>
            <ChevronRight className="w-4 h-4 mx-2" />
            <span className="font-medium text-amber-600 flex items-center gap-1">
              <Clipboard className="w-4 h-4" />
              {selectedDivisions.length > 0
                ? `Edit ${branch} - Sem ${sem}`
                : "Create Study Schedules"}
            </span>
          </div>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {selectedDivisions.length > 0
                ? `${branch} - Semester ${sem} Study Planner`
                : "Study Schedule Management"}
            </h1>
            <p className="text-gray-600">
              {selectedDivisions.length > 0
                ? `Organizing ${selectedDivisions.length} study group${
                    selectedDivisions.length !== 1 ? "s" : ""
                  } for ${branch}`
                : "Manage study schedules for multiple groups within a subject"}
            </p>
          </div>
          <div className="p-3 bg-white rounded-xl border border-amber-200 shadow-sm">
            <Clipboard className="w-6 h-6 text-amber-600" />
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
                ? "border-amber-200 bg-amber-50"
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
                  ? "text-amber-500"
                  : "text-red-500"
              }`}
            />
            <div>
              <p
                className={`font-bold ${
                  errorMsg.includes("Loaded") ||
                  errorMsg.includes("Added") ||
                  errorMsg.includes("created successfully") ||
                  errorMsg.includes("Failed to fetch")
                    ? "text-amber-800"
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
                    ? "text-amber-700"
                    : "text-red-700"
                }`}
              >
                {errorMsg}
              </p>
            </div>
          </div>
        )}

        {saved && (
          <div className="mb-6 p-4 rounded-xl border border-orange-200 bg-gradient-to-r from-orange-50 to-orange-100 flex items-center gap-3">
            <div className="p-2 bg-white rounded-lg border border-orange-200">
              <FileCheck className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <p className="font-bold text-orange-800">
                Study Schedules Saved Successfully
              </p>
              <p className="text-orange-700 text-sm mt-1">
                All {selectedDivisions.length} study group schedules have been
                saved for {branch} - Semester {sem}.
              </p>
            </div>
          </div>
        )}

        {/* Configuration Panel */}
        <div className="bg-white rounded-2xl p-6 border border-amber-200 shadow-sm mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-gradient-to-br from-amber-100 to-amber-50 rounded-lg border border-amber-200">
              <Compass className="w-5 h-5 text-amber-600" />
            </div>
            <h2 className="text-lg font-bold text-amber-900">
              Study Section Configuration
            </h2>
          </div>

          {/* Telegram Chat IDs Section */}
          {branch && sem && (
            <div className="mb-6 p-4 bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl border border-orange-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg border border-orange-200">
                    <MessageSquare className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-orange-900">
                      Study Notifications
                    </h3>
                    <p className="text-orange-700 text-sm">
                      Set up Telegram for schedule updates
                    </p>
                  </div>
                </div>
                {!isEditingTelegram ? (
                  <button
                    onClick={() => setIsEditingTelegram(true)}
                    className="px-3 py-1.5 bg-orange-100 text-orange-700 rounded-lg text-xs font-bold hover:bg-orange-200 transition-colors flex items-center gap-2 border border-orange-200"
                  >
                    <Edit className="w-3 h-3" />
                    {telegramChatIds.length > 0 ? "Edit" : "Add"}
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setIsEditingTelegram(false);
                        fetchTelegramChatIds(); // Reset to saved values
                      }}
                      className="px-3 py-1.5 border border-amber-300 text-amber-700 rounded-lg text-xs font-bold hover:bg-amber-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              {isEditingTelegram ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Chat IDs for {branch} Semester {sem}
                    </label>
                    <p className="text-xs text-gray-500 mb-3">
                      Add Telegram Chat IDs for notifications. These will be
                      used for all {branch} Semester {sem} study groups.
                    </p>

                    {/* How to get Chat ID instructions */}
                    <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg">
                      <h4 className="font-bold text-rose-900 mb-2 flex items-center gap-2">
                        <Info className="w-4 h-4" />
                        How to get your Chat ID:
                      </h4>
                      <ol className="text-sm text-rose-800 space-y-1 ml-6 list-decimal">
                        <li>
                          Click this link:{" "}
                          <a
                            href="https://t.me/MyTestBot?start"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-rose-600 hover:text-rose-800 underline font-bold"
                          >
                            https://t.me/MyTestBot?start
                          </a>
                        </li>
                        <li>Add bot to study group and make admin</li>
                        <li>Send /start command to the bot in your group</li>
                        <li>Copy the Chat ID provided by the bot</li>
                        <li>Paste it in the field above</li>
                        <li>
                          You'll receive study schedule updates directly on
                          Telegram
                        </li>
                      </ol>
                    </div>

                    {/* Chat ID Inputs */}
                    <div className="space-y-2 mb-3">
                      {telegramChatIds.length === 0 ? (
                        <div className="text-center py-4 border-2 border-dashed border-orange-300 rounded-lg bg-white">
                          <MessageSquare className="w-8 h-8 text-orange-400 mx-auto mb-2" />
                          <p className="text-gray-600">No Chat IDs added yet</p>
                          <p className="text-xs text-gray-500 mt-1">
                            Follow the instructions above to get your Chat ID
                          </p>
                        </div>
                      ) : (
                        telegramChatIds.map((chatId, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-2 group"
                          >
                            <div className="flex-1 flex items-center gap-3 px-3 py-2 border border-orange-300 rounded-lg bg-white">
                              <div className="w-6 h-6 flex items-center justify-center rounded-full bg-orange-100 text-orange-700 text-xs font-bold">
                                {index + 1}
                              </div>
                              <input
                                type="text"
                                value={chatId}
                                onChange={(e) =>
                                  handleUpdateChatId(index, e.target.value)
                                }
                                placeholder="Enter Telegram Chat ID (e.g., 123456789)"
                                className="flex-1 outline-none bg-transparent"
                              />
                              <span
                                className={`text-xs px-2 py-1 rounded ${
                                  chatId.trim() &&
                                  !/^-?\d+$/.test(chatId.trim())
                                    ? "bg-red-100 text-red-700"
                                    : "bg-orange-100 text-orange-700"
                                }`}
                              >
                                {chatId.trim() && !/^-?\d+$/.test(chatId.trim())
                                  ? "Invalid"
                                  : "Valid"}
                              </span>
                            </div>
                            <button
                              onClick={() => handleRemoveChatId(index)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100 border border-red-200"
                              title="Remove"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Add new Chat ID */}
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={newChatId}
                        onChange={(e) => setNewChatId(e.target.value)}
                        placeholder="Enter new Chat ID..."
                        className="flex-1 px-4 py-2 border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        onKeyPress={(e) => {
                          if (e.key === "Enter" && newChatId.trim()) {
                            handleAddChatIdField();
                          }
                        }}
                      />
                      <button
                        onClick={handleAddChatIdField}
                        disabled={!newChatId.trim()}
                        className="px-4 py-2 bg-orange-600 text-white rounded-lg font-bold hover:bg-orange-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed border border-orange-700"
                      >
                        <Plus className="w-4 h-4" />
                        Add
                      </button>
                    </div>

                    {/* Validation and Help Text */}
                    <div className="mt-2 space-y-1">
                      {telegramChatIds.some(
                        (id) => id.trim() && !/^-?\d+$/.test(id.trim())
                      ) && (
                        <div className="flex items-start gap-2 text-red-600 text-xs">
                          <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                          <p>
                            Invalid Chat IDs detected. Please enter only numeric
                            values.
                          </p>
                        </div>
                      )}
                      <p className="text-xs text-gray-500">
                        Tip: Use the bot link above to easily get your Chat ID
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleUpdateTelegramChatIds}
                      disabled={
                        isSavingTelegram ||
                        telegramChatIds.some(
                          (id) => id.trim() && !/^-?\d+$/.test(id.trim())
                        )
                      }
                      className="px-4 py-2 bg-orange-600 text-white rounded-lg font-bold hover:bg-orange-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed border border-orange-700"
                    >
                      {isSavingTelegram ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          Save Changes
                        </>
                      )}
                    </button>
                    {telegramChatIds.length > 0 && (
                      <button
                        onClick={() => {
                          if (
                            window.confirm(
                              "Are you sure you want to clear all Chat IDs?"
                            )
                          ) {
                            setTelegramChatIds([]);
                          }
                        }}
                        className="px-4 py-2 bg-red-100 text-red-700 rounded-lg font-bold hover:bg-red-200 transition-colors flex items-center gap-2 border border-red-200"
                      >
                        <Trash2 className="w-4 h-4" />
                        Clear All
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div>
                  {telegramChatIds.length > 0 ? (
                    <>
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="text-sm font-bold text-orange-900 mb-1">
                            {telegramChatIds.length} Chat ID
                            {telegramChatIds.length !== 1 ? "s" : ""} configured
                          </p>
                          <p className="text-sm text-orange-700">
                            These IDs will be used for all {branch} Semester{" "}
                            {sem} study groups
                          </p>
                        </div>
                        <div className="p-3 bg-white rounded-lg border border-orange-200">
                          <MessageSquare className="w-6 h-6 text-orange-600" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        {telegramChatIds.map((chatId, index) => (
                          <div
                            key={index}
                            className="px-3 py-3 bg-white border border-orange-200 rounded-lg hover:border-orange-300 transition-colors group"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 flex items-center justify-center rounded-full bg-orange-100 text-orange-700 font-bold">
                                  {index + 1}
                                </div>
                                <div>
                                  <div className="font-mono text-orange-800 text-sm">
                                    {chatId}
                                  </div>
                                  <div className="text-xs text-orange-600">
                                    {/^-?\d+$/.test(chatId.trim())
                                      ? "Valid format"
                                      : "Invalid format"}
                                  </div>
                                </div>
                              </div>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(chatId);
                                  showAlert(
                                    "Copied!",
                                    `Chat ID ${chatId} copied to clipboard`,
                                    "success"
                                  );
                                }}
                                className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100 border border-orange-200"
                                title="Copy to clipboard"
                              >
                                <Copy className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 pt-3 border-t border-orange-200">
                        <div className="flex items-center justify-between text-xs text-orange-700">
                          <span>Last updated: Just now</span>
                          <span>Applied to all {branch} study groups</span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-6">
                      <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-700 font-bold mb-2">
                        No Telegram Chat IDs set
                      </p>
                      <p className="text-gray-600 text-sm mb-4">
                        Add Chat IDs to receive study schedule notifications
                      </p>

                      {/* Instructions in non-edit mode */}
                      <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-left">
                        <p className="text-sm text-rose-800 font-bold mb-1">
                          How to get Chat ID:
                        </p>
                        <ol className="text-xs text-rose-700 space-y-1 ml-4 list-decimal">
                          <li>
                            <a
                              href="https://t.me/MyTestBot?start"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-rose-600 hover:text-rose-800 underline"
                            >
                              Click here to open the bot
                            </a>
                          </li>
                          <li>Add bot to study group & make admin</li>
                          <li>Send /start command</li>
                          <li>Copy the Chat ID provided</li>
                          <li>Paste above to get notifications</li>
                        </ol>
                      </div>

                      <button
                        onClick={() => setIsEditingTelegram(true)}
                        className="px-4 py-2 bg-orange-600 text-white rounded-lg font-bold hover:bg-orange-700 transition-colors border border-orange-700"
                      >
                        Add Chat IDs
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* Semester */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-amber-600" />
                Semester
              </label>
              <div className="relative">
                <GraduationCap className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-amber-500" />
                <select
                  value={sem}
                  onChange={(e) => {
                    setSem(Number(e.target.value));
                    setIsInitialLoad(false);
                  }}
                  className="w-full pl-10 pr-4 py-3 bg-white border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
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
              <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                <Notebook className="w-4 h-4 text-rose-600" />
                Subject
              </label>
              <div className="relative">
                <Notebook className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-rose-500" />
                <select
                  value={branch}
                  onChange={(e) => {
                    setBranch(e.target.value);
                    setIsInitialLoad(false);
                  }}
                  className="w-full pl-10 pr-4 py-3 bg-white border border-rose-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-all"
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
              <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                <FolderPlus className="w-4 h-4 text-orange-600" />
                Section Actions
              </label>
              <button
                onClick={handleLoadBranchClasses}
                disabled={fetching || !branch || !sem}
                className={`w-full px-4 py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all border ${
                  fetching || !branch || !sem
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed border-gray-300"
                    : "bg-gradient-to-r from-amber-600 to-amber-700 text-white hover:from-amber-700 hover:to-amber-800 border-amber-700"
                }`}
              >
                {fetching ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <FolderPlus className="w-5 h-5" />
                    Load Study Groups
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Division Selection */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-bold text-gray-700 flex items-center gap-2">
                <Users className="w-4 h-4 text-violet-600" />
                Select Study Groups for {branch}
              </label>
              <div className="text-sm text-gray-500">
                {selectedDivisions.length} selected
                {fetching && (
                  <Loader2 className="inline-block ml-2 w-4 h-4 animate-spin text-amber-600" />
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
                          ? "bg-gradient-to-r from-orange-100 to-orange-50 border-orange-300 text-orange-800 hover:from-orange-200 hover:to-orange-100"
                          : "bg-gradient-to-r from-amber-100 to-amber-50 border-amber-300 text-amber-800 hover:from-amber-200 hover:to-amber-100"
                        : "bg-gradient-to-r from-gray-100 to-gray-50 border-gray-300 text-gray-700 hover:from-gray-200 hover:to-gray-100"
                    }`}
                    title={`Allowed tutors: ${
                      allowedFaculty.length > 0
                        ? allowedFaculty.join(", ")
                        : "None assigned"
                    }`}
                  >
                    {division}
                    {isSelected && exists && (
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    )}
                    {allowedFaculty.length > 0 && (
                      <span className="text-xs bg-violet-100 px-1.5 py-0.5 rounded border border-violet-200 text-violet-700">
                        {allowedFaculty.length}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            <div className="flex flex-wrap items-center gap-4 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-gradient-to-r from-amber-100 to-amber-50 border border-amber-300 rounded"></div>
                <span className="text-sm text-gray-600">Selected (New)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-gradient-to-r from-orange-100 to-orange-50 border border-orange-300 rounded"></div>
                <span className="text-sm text-gray-600">
                  Selected (Existing)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-gradient-to-r from-gray-100 to-gray-50 border border-gray-300 rounded"></div>
                <span className="text-sm text-gray-600">Not Selected</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-gradient-to-r from-violet-100 to-violet-50 border border-violet-300 rounded"></div>
                <span className="text-sm text-gray-600">
                  Has Assigned Tutors
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Legend & Controls */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 border border-amber-200 shadow-sm flex-1">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-gradient-to-br from-amber-100 to-amber-50 rounded-lg border border-amber-200">
                  <Highlighter className="w-4 h-4 text-amber-600" />
                </div>
                <h3 className="text-sm font-bold text-gray-700">
                  Tutor Legend
                </h3>
              </div>
              <button
                onClick={() => setShowFacultyModal(true)}
                className="px-3 py-1.5 bg-gradient-to-r from-amber-50 to-amber-100 text-amber-700 rounded-lg text-xs font-bold flex items-center gap-2 hover:from-amber-100 hover:to-amber-200 transition-colors border border-amber-200"
              >
                <UserPlus className="w-3 h-3" />
                Add Tutor
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {facultyOptions.map((faculty) => {
                // Skip formatting for "free" option
                if (faculty.value === "free") {
                  return (
                    <div
                      key={faculty.value}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold ${faculty.color} border`}
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
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold ${faculty.color} border`}
                    title={`${facultyId}${
                      facultyName ? ` (${facultyName})` : ""
                    }`}
                  >
                    {facultyName ? `${facultyId} (${facultyName})` : facultyId}
                  </div>
                );
              })}
            </div>
            <div className="text-xs text-gray-500 mt-3 flex items-center gap-1">
              <Info className="w-3 h-3" />
              Note: Each study group only shows tutors assigned to it from the
              study groups database.
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-amber-200 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 bg-gradient-to-br from-rose-100 to-rose-50 rounded-lg border border-rose-200">
                <Eye className="w-4 h-4 text-rose-600" />
              </div>
              <h3 className="text-sm font-bold text-gray-700">View Options</h3>
            </div>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => setShowFreeSlots(!showFreeSlots)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 border ${
                  showFreeSlots
                    ? "bg-gradient-to-r from-amber-100 to-amber-50 text-amber-700 border-amber-300"
                    : "bg-gradient-to-r from-gray-100 to-gray-50 text-gray-700 border-gray-300"
                }`}
              >
                {showFreeSlots ? (
                  <Eye className="w-3 h-3" />
                ) : (
                  <EyeOff className="w-3 h-3" />
                )}
                {showFreeSlots ? "Show Free Lectures" : "Hide Free Lectures"}
              </button>
              <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                <Layers className="w-3 h-3" />
                Showing {selectedDivisions.length} study group
                {selectedDivisions.length !== 1 ? "s" : ""}
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
                    className="bg-white rounded-xl border border-amber-200 shadow-sm relative group"
                  >
                    {/* Notebook Spine Effect */}
                    <div className="absolute left-0 top-0 bottom-0 w-2 bg-gradient-to-b from-amber-400 to-amber-300 rounded-l-lg"></div>

                    {/* Empty Warning Badge */}
                    {isEmpty && exists && (
                      <div className="absolute -top-2 -right-2">
                        <div className="bg-gradient-to-r from-red-500 to-rose-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1 border border-red-600 shadow-sm">
                          <AlertCircle className="w-3 h-3" />
                          Empty
                        </div>
                      </div>
                    )}

                    {/* Division Header */}
                    <div
                      className={`p-4 border-b ml-2 ${
                        exists
                          ? "bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200"
                          : "bg-gradient-to-r from-amber-50 to-amber-100 border-amber-200"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className={`p-2 rounded-lg border ${
                              exists
                                ? "border-orange-200 bg-white"
                                : "border-amber-200 bg-white"
                            }`}
                          >
                            <BookOpen
                              className={`w-5 h-5 ${
                                exists ? "text-orange-600" : "text-amber-600"
                              }`}
                            />
                          </div>
                          <div>
                            <h3 className="font-bold text-lg text-gray-900">
                              {division}
                            </h3>
                            <div className="flex items-center gap-2 mt-1">
                              <div
                                className={`text-xs px-2 py-1 rounded-full border ${
                                  exists
                                    ? "bg-orange-100 text-orange-800 border-orange-200"
                                    : "bg-amber-100 text-amber-800 border-amber-200"
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
                                assigned Lectures
                              </div>
                              {allowedFaculty.length > 0 && (
                                <div className="text-xs px-2 py-1 rounded-full bg-gradient-to-r from-violet-100 to-violet-50 text-violet-800 border border-violet-200">
                                  {allowedFaculty.length} tutor(s)
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
                              className="p-1.5 hover:bg-red-50 text-red-500 hover:text-red-600 rounded-lg transition-colors border border-red-200"
                              title="Delete study schedule"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => toggleDivisionCollapse(division)}
                            className="p-1 hover:bg-white/50 rounded-lg transition-colors border border-amber-200"
                          >
                            {isCollapsed ? (
                              <ChevronDown className="w-5 h-5 text-amber-500" />
                            ) : (
                              <ChevronUp className="w-5 h-5 text-amber-500" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Weekdays inside Division (when not collapsed) */}
                    {!isCollapsed && (
                      <div className="p-4 ml-2">
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
                                className="border border-amber-200 rounded-lg overflow-hidden"
                              >
                                {/* Day Header */}
                                <div
                                  onClick={() =>
                                    toggleDayCollapse(division, day)
                                  }
                                  className="p-3 bg-gradient-to-r from-amber-50 to-amber-100 hover:from-amber-100 hover:to-amber-150 cursor-pointer transition-colors flex items-center justify-between"
                                >
                                  <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-amber-600" />
                                    <span className="font-bold text-gray-900">
                                      {day}
                                    </span>
                                    <span className="text-xs text-amber-600">
                                      ({assignedCount}/{timeSlots.length}{" "}
                                      Lectures)
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {isDayCollapsed ? (
                                      <ChevronDown className="w-4 h-4 text-amber-500" />
                                    ) : (
                                      <ChevronUp className="w-4 h-4 text-amber-500" />
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
                                            className="flex items-center gap-2 p-2 border border-amber-100 rounded hover:bg-amber-50 transition-colors"
                                          >
                                            <div className="w-16 text-xs text-amber-700 font-bold">
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
                                              className={`flex-1 px-3 py-1.5 text-sm rounded-lg border ${faculty.color} focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all`}
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
                      <div className="p-4 text-center ml-2">
                        <div className="text-gray-500 text-sm py-8">
                          <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p>Click expand to view {days.length} study days</p>
                          <p className="text-xs mt-1">
                            {
                              Object.values(schedule[division] || {}).flatMap(
                                (day) =>
                                  Object.values(day).filter(
                                    (val) => val !== "free"
                                  )
                              ).length
                            }{" "}
                            assigned Lectures
                          </p>
                          {allowedFaculty.length > 0 && (
                            <p className="text-xs mt-2 text-violet-600">
                              ✓ {allowedFaculty.length} tutor(s) assigned
                            </p>
                          )}
                          {isEmpty && exists && (
                            <p className="text-xs mt-2 text-red-600">
                              ⚠️ No tutor assigned
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
              <div className="bg-white rounded-xl p-6 border border-amber-200 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Study Groups</p>
                    <p className="text-2xl font-bold text-gray-900 mt-2">
                      {selectedDivisions.length}
                    </p>
                  </div>
                  <div className="p-3 bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg border border-amber-200">
                    <Users className="w-6 h-6 text-amber-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 border border-amber-200 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Assigned Lectures</p>
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
                  <div className="p-3 bg-gradient-to-br from-rose-50 to-rose-100 rounded-lg border border-rose-200">
                    <Clock className="w-6 h-6 text-rose-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 border border-amber-200 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Available Tutors</p>
                    <p className="text-2xl font-bold text-gray-900 mt-2">
                      {facultyOptions.length - 1} {/* Subtract "free" option */}
                    </p>
                  </div>
                  <div className="p-3 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg border border-orange-200">
                    <PenTool className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 border border-amber-200 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Empty Schedules</p>
                    <p className="text-2xl font-bold text-gray-900 mt-2">
                      {
                        selectedDivisions.filter((division) =>
                          hasAllFreeLectures(division)
                        ).length
                      }
                    </p>
                  </div>
                  <div className="p-3 bg-gradient-to-br from-red-50 to-rose-50 rounded-lg border border-red-200">
                    <AlertCircle className="w-6 h-6 text-red-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-4 justify-center mb-12">
              <button
                onClick={handleSubmit}
                disabled={isLoading || selectedDivisions.length === 0}
                className={`px-8 py-3 rounded-lg font-bold flex items-center gap-2 transition-all duration-300 border ${
                  isLoading || selectedDivisions.length === 0
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed border-gray-300"
                    : "bg-gradient-to-r from-amber-600 to-amber-700 text-white hover:from-amber-700 hover:to-amber-800 shadow-sm hover:shadow-md border-amber-700"
                }`}
              >
                <Save className="w-5 h-5" />
                {isLoading
                  ? "Saving..."
                  : saved
                  ? "All Schedules Saved"
                  : `Save ${selectedDivisions.length} Schedule${
                      selectedDivisions.length !== 1 ? "s" : ""
                    }`}
              </button>

              <button
                onClick={handleClear}
                disabled={selectedDivisions.length === 0}
                className={`px-6 py-3 rounded-lg border font-bold flex items-center gap-2 transition-all duration-300 ${
                  selectedDivisions.length === 0
                    ? "border-gray-200 text-gray-400 cursor-not-allowed"
                    : "border-amber-300 text-amber-700 hover:bg-amber-50"
                }`}
              >
                <Trash2 className="w-5 h-5" />
                Clear All Groups
              </button>

              <button
                onClick={handleReset}
                disabled={selectedDivisions.length === 0}
                className={`px-6 py-3 rounded-lg border font-bold flex items-center gap-2 transition-all duration-300 ${
                  selectedDivisions.length === 0
                    ? "border-gray-200 text-gray-400 cursor-not-allowed"
                    : "border-amber-300 text-amber-700 hover:bg-amber-50"
                }`}
              >
                <RefreshCw className="w-5 h-5" />
                Reload Schedules
              </button>
            </div>
          </>
        )}

        {/* Quick Tips */}
        <div className="bg-gradient-to-r from-amber-50 to-rose-50 rounded-2xl p-6 border-2 border-amber-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-gradient-to-br from-amber-100 to-amber-50 rounded-lg border border-amber-200">
              <Info className="w-5 h-5 text-amber-600" />
            </div>
            <h3 className="font-bold text-amber-900">Study Planner Guide</h3>
          </div>
          <ul className="space-y-2 text-amber-800 text-sm">
            <li className="flex items-start gap-2">
              <div className="w-2 h-2 bg-amber-400 rounded-full mt-1.5"></div>
              <span>
                <strong>Study Notifications</strong> - Set multiple Telegram
                Chat IDs for all {branch} Semester {sem} study groups. These
                will be used for schedule updates and announcements.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-2 h-2 bg-amber-400 rounded-full mt-1.5"></div>
              <span>
                <strong>Delete Study Schedule</strong> - Click the trash icon on
                existing study group cards to permanently remove that schedule.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-2 h-2 bg-amber-400 rounded-full mt-1.5"></div>
              <span>
                <strong>Empty Schedule Validation</strong> - Study groups with
                all free Lectures cannot be saved. Assign at least one tutor or
                remove the group.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-2 h-2 bg-amber-400 rounded-full mt-1.5"></div>
              <span>
                <strong>Tutor Management</strong> - Use the "Add Tutor" button
                to add tutors from the database to your dropdown options.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-2 h-2 bg-amber-400 rounded-full mt-1.5"></div>
              <span>
                <strong>Create New Tutor</strong> - Click "Create New Tutor" in
                the modal to add a new tutor by entering their ID and Name.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-2 h-2 bg-amber-400 rounded-full mt-1.5"></div>
              <span>
                <strong>Group-Specific Tutors</strong> - Each study group
                dropdown only shows tutors assigned to that specific group in
                the database.
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
