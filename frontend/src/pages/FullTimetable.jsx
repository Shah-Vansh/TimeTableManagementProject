import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
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
  MapPin,
  BookCheck,
  UserCheck,
  DoorOpen,
  BookMarked,
} from "lucide-react";
import api from "../configs/api";
import Alert from "../components/Alert";

export default function FullTimetable() {
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
    { label: "Lecture 1", value: "Time Slot 1" },
    { label: "Lecture 2", value: "Time Slot 2" },
    { label: "Lecture 3", value: "Time Slot 3" },
    { label: "Lecture 4", value: "Time Slot 4" },
    { label: "Lecture 5", value: "Time Slot 5" },
  ];

  const branchOptions = ["CSE", "CSE(AIML)", "DS", "IT"];
  const divisionOptions = [
    "D1", "D2", "D3", "D4", "D5", "D6", 
    "D7", "D8", "D9", "D10", "D11", "D12"
  ];

  // Default faculty options
  const baseFacultyOptions = [
    {
      value: "free",
      label: "Free Period",
      color: "border-violet-200 bg-violet-50 text-violet-700",
      bgColor: "bg-violet-50",
      textColor: "text-violet-700",
    },
  ];

  // Faculty color mapping
  const facultyColors = [
    "border-indigo-200 bg-indigo-50 text-indigo-700",
    "border-amber-200 bg-amber-50 text-amber-700",
    "border-teal-200 bg-teal-50 text-teal-700",
    "border-rose-200 bg-rose-50 text-rose-700",
    "border-sky-200 bg-sky-50 text-sky-700",
    "border-orange-200 bg-orange-50 text-orange-700",
    "border-emerald-200 bg-emerald-50 text-emerald-700",
    "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700",
    "border-cyan-200 bg-cyan-50 text-cyan-700",
    "border-lime-200 bg-lime-50 text-lime-700",
    "border-violet-200 bg-violet-50 text-violet-700",
    "border-pink-200 bg-pink-50 text-pink-700",
    "border-blue-200 bg-blue-50 text-blue-700",
    "border-purple-200 bg-purple-50 text-purple-700",
  ];

  // Helper function defined before useState
  const initializeSchedule = (divisions) => {
    const schedule = {};
    divisions.forEach((division) => {
      schedule[division] = days.reduce((dayAcc, day) => {
        dayAcc[day] = timeSlots.reduce((slotAcc, slot) => {
          slotAcc[slot.value] = {
            faculty: "free",
            subject: "",
            room: ""
          };
          return slotAcc;
        }, {});
        return dayAcc;
      }, {});
    });
    return schedule;
  };

  /* =======================
            STATE
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
  const [classFacultyMap, setClassFacultyMap] = useState({});
  const [schedule, setSchedule] = useState(() => initializeSchedule([]));
  
  // Telegram Chat IDs
  const [telegramChatIds, setTelegramChatIds] = useState([]);
  const [isEditingTelegram, setIsEditingTelegram] = useState(false);
  const [isSavingTelegram, setIsSavingTelegram] = useState(false);
  const [newChatId, setNewChatId] = useState("");

  // Faculty management
  const [showFacultyModal, setShowFacultyModal] = useState(false);
  const [allAvailableFaculties, setAllAvailableFaculties] = useState([]);
  const [selectedFacultiesToAdd, setSelectedFacultiesToAdd] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoadingAllFaculties, setIsLoadingAllFaculties] = useState(false);

  // New faculty creation
  const [showCreateFaculty, setShowCreateFaculty] = useState(false);
  const [newFacultyId, setNewFacultyId] = useState("");
  const [newFacultyName, setNewFacultyName] = useState("");
  const [isCreatingFaculty, setIsCreatingFaculty] = useState(false);
  const [createFacultyError, setCreateFacultyError] = useState("");

  // Delete modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [divisionToDelete, setDivisionToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Alert state
  const [alert, setAlert] = useState(null);

  // Faculty credentials
  const [generatedCredentials, setGeneratedCredentials] = useState(null);
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [copiedField, setCopiedField] = useState("");

  // Subject and Room management
  const [subjectOptions, setSubjectOptions] = useState([
    "Mathematics",
    "Physics",
    "Chemistry",
    "Programming",
    "Database",
    "Networks",
    "AI/ML",
    "Web Development",
    "Software Engineering",
    "Data Structures",
    "Algorithms",
    "Operating Systems",
  ]);

  const [roomOptions, setRoomOptions] = useState([
    "101", "102", "103", "104", "105", "106",
    "201", "202", "203", "204", "205", "206",
    "301", "302", "303", "304", "305", "306",
    "Lab 1", "Lab 2", "Lab 3", "Lab 4", "Auditorium"
  ]);

  // Slot editing modal
  const [showSlotModal, setShowSlotModal] = useState(false);
  const [currentSlot, setCurrentSlot] = useState({
    division: "",
    day: "",
    timeSlot: "",
    faculty: "free",
    subject: "",
    room: ""
  });

  // Loading states for individual divisions
  const [loadingDivisions, setLoadingDivisions] = useState({});

  // Token declare
  const token = localStorage.getItem("token");

  // Show alert message
  const showAlert = (main, info, type) => {
    setAlert({ main, info, type });
    setTimeout(() => setAlert(null), 5000);
  };

  /* =======================
   SEARCHABLE FACULTY SELECT COMPONENT
  ======================= */
  const SearchableFacultySelect = ({
    value,
    onChange,
    division,
    disabled,
    onEnterPress,
  }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [filteredOptions, setFilteredOptions] = useState([]);
    const dropdownRef = useRef(null);
    const inputRef = useRef(null);

    // Get faculty options for this class
    const facultyOptionsForClass = React.useMemo(() => {
      return getFacultyOptionsForClass(division);
    }, [division]);

    useEffect(() => {
      if (search.trim() === "") {
        setFilteredOptions(facultyOptionsForClass);
      } else {
        const searchLower = search.toLowerCase();
        const filtered = facultyOptionsForClass.filter((option) => {
          const valueStr = option.value || "";
          const nameStr = option.name || "";
          return (
            valueStr.toLowerCase().includes(searchLower) ||
            nameStr.toLowerCase().includes(searchLower)
          );
        });
        setFilteredOptions(filtered);
      }
    }, [search, facultyOptionsForClass]);

    useEffect(() => {
      const handleClickOutside = (event) => {
        if (
          dropdownRef.current &&
          !dropdownRef.current.contains(event.target)
        ) {
          setIsOpen(false);
          setSearch("");
        }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleKeyDown = (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        if (isOpen && filteredOptions.length > 0) {
          handleSelect(filteredOptions[0]);
        } else if (onEnterPress) {
          onEnterPress();
        }
      } else if (e.key === "Escape") {
        setIsOpen(false);
        setSearch("");
      }
    };

    const handleSelect = (option) => {
      onChange(option.value);
      setSearch("");
      setIsOpen(false);
    };

    const handleInputChange = (e) => {
      const newValue = e.target.value;
      setSearch(newValue);

      if (newValue.trim() !== "") {
        const exactMatch = facultyOptionsForClass.find(
          (option) =>
            option.value.toLowerCase() === newValue.toLowerCase().trim()
        );
        if (exactMatch) {
          handleSelect(exactMatch);
          return;
        }
      }

      if (!isOpen) setIsOpen(true);
    };

    const handleInputFocus = () => {
      setIsOpen(true);
      setSearch("");
    };

    const handleBlur = () => {
      setTimeout(() => {
        setIsOpen(false);
        setSearch("");
      }, 200);
    };

    const currentOption =
      facultyOptionsForClass.find((opt) => opt.value === value) || facultyOptionsForClass[0];
    
    const displayValue = currentOption.value === "free" 
      ? "Free Period" 
      : currentOption.name 
        ? `${currentOption.value} (${currentOption.name})`
        : currentOption.value;

    return (
      <div className="relative flex-1" ref={dropdownRef}>
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={isOpen ? search : displayValue}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            placeholder="Type faculty ID or name..."
            disabled={disabled}
            className={`w-full px-3 py-1.5 text-sm rounded-lg border focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all ${
              currentOption.color || "border-gray-300"
            } ${disabled ? "bg-gray-100 cursor-not-allowed" : "bg-white"}`}
          />
          <button
            type="button"
            onClick={() => {
              if (!isOpen) {
                setIsOpen(true);
                setSearch("");
                inputRef.current?.focus();
              } else {
                setIsOpen(false);
                setSearch("");
              }
            }}
            disabled={disabled}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded"
          >
            <ChevronDown
              className={`w-4 h-4 text-gray-500 transition-transform ${
                isOpen ? "rotate-180" : ""
              }`}
            />
          </button>
        </div>

        {isOpen && !disabled && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 p-2">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Search className="w-3 h-3" />
                <span className="flex-1">
                  {search
                    ? `Searching: "${search}"`
                    : "Type faculty ID or name to filter..."}
                </span>
                <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                  {filteredOptions.length} found
                </span>
              </div>
            </div>

            {filteredOptions.length === 0 ? (
              <div className="p-4 text-center">
                <div className="text-gray-500 text-sm mb-2">
                  No matching faculty found
                </div>
                <div className="text-xs text-gray-400">Try a different search</div>
              </div>
            ) : (
              <div className="py-1">
                {filteredOptions.map((option) => {
                  const isSelected = option.value === value;
                  const displayText = option.value === "free" 
                    ? "Free Period" 
                    : option.name 
                      ? `${option.value} (${option.name})`
                      : option.value;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      onClick={() => handleSelect(option)}
                      className={`w-full px-3 py-2 text-left hover:bg-indigo-50 flex items-center justify-between border-b border-gray-50 last:border-b-0 ${
                        isSelected ? "bg-indigo-50" : ""
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-3 h-3 rounded-full ${
                            isSelected
                              ? "bg-indigo-500"
                              : "border border-gray-300"
                          }`}
                        ></div>
                        <div className="flex flex-col">
                          <div
                            className={`font-medium ${
                              option.textColor || "text-gray-700"
                            }`}
                          >
                            {displayText}
                          </div>
                          {option.value !== "free" && option.name && (
                            <div className="text-xs text-gray-500">
                              {option.name}
                            </div>
                          )}
                        </div>
                      </div>
                      {isSelected && (
                        <Check className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-100 p-2">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-gray-200 rounded text-xs">
                    Enter
                  </kbd>
                  <span>to move to next</span>
                </div>
                <div className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-gray-200 rounded text-xs">
                    ↓
                  </kbd>
                  <span>to select</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  /* =======================
   HELPER FUNCTIONS
  ======================= */
  const getFacultyOptionsForClass = (division) => {
    return facultyOptions;
  };

  const getFacultyStyle = (val) => {
    const faculty = facultyOptions.find((f) => f.value === val);
    return faculty || facultyOptions[0];
  };

  const hasAllFreeLectures = (division) => {
    if (!schedule[division]) return true;

    for (const day of days) {
      for (const slot of timeSlots) {
        const slotData = schedule[division][day]?.[slot.value];
        if (slotData && slotData.faculty !== "free") {
          return false;
        }
      }
    }
    return true;
  };

  /* =======================
   TELEGRAM CHAT IDs FUNCTIONS
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
        const chatIds = response.data.telegram_chat_ids || [];
        setTelegramChatIds(Array.isArray(chatIds) ? chatIds : [chatIds]);
      } else {
        setTelegramChatIds([]);
      }
    } catch (error) {
      console.error("Error fetching Telegram Chat IDs:", error);
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Something went wrong";
      showAlert("Error fetching Telegram Chat IDs", message, "error");
      setTelegramChatIds([]);
    }
  };

  const handleUpdateTelegramChatIds = async () => {
    const invalidChatIds = telegramChatIds.filter(
      (id) => id.trim() && !/^-?\d+$/.test(id.trim())
    );

    if (invalidChatIds.length > 0) {
      showAlert("Invalid format", "Telegram Chat IDs must be numbers", "error");
      return;
    }

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
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Something went wrong";
      showAlert("Update failed", message || "Please try again", "error");
    } finally {
      setIsSavingTelegram(false);
    }
  };

  const handleAddChatIdField = () => {
    setTelegramChatIds([...telegramChatIds, newChatId]);
    setNewChatId("");
  };

  const handleRemoveChatId = (index) => {
    const updatedChatIds = telegramChatIds.filter((_, i) => i !== index);
    setTelegramChatIds(updatedChatIds);
  };

  const handleUpdateChatId = (index, value) => {
    const updatedChatIds = [...telegramChatIds];
    updatedChatIds[index] = value;
    setTelegramChatIds(updatedChatIds);
  };

  /* =======================
   FETCH ALL FACULTIES FROM DATABASE - FIXED
  ======================= */
  const fetchAllFaculties = async () => {
    setIsLoadingAllFaculties(true);
    try {
      const response = await api.get("/api/faculties", {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.data.success) {
        const faculties = response.data.faculties || [];

        // Format faculties for display in modal
        const formattedFaculties = faculties.map((faculty, index) => {
          const facultyId = faculty.id || faculty._id || `faculty-${index}`;
          const facultyName = faculty.name || "Unknown Faculty";

          return {
            id: facultyId,
            facultyId: facultyId,
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
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Something went wrong";
      showAlert("Failed to fetch faculties", message, "error");

      // Fallback to sample data
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
      CREATE NEW FACULTY
  ======================= */
  const handleCreateNewFaculty = async () => {
    if (!newFacultyId.trim()) {
      setCreateFacultyError("Faculty ID is required");
      return;
    }

    if (!newFacultyName.trim()) {
      setCreateFacultyError("Faculty Name is required");
      return;
    }

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
        if (response.data.credentials) {
          const username = newFacultyId.trim();
          const password = `${username}@NLJIET`;

          setGeneratedCredentials({
            name: newFacultyName.trim(),
            ...response.data.credentials,
            password,
          });

          setShowCreateFaculty(false);
          setShowCredentialsModal(true);
        }

        const newFaculty = {
          id: newFacultyId.trim(),
          facultyId: newFacultyId.trim(),
          name: newFacultyName.trim(),
          displayLabel: `${newFacultyName.trim()} (${newFacultyId.trim()})`,
          colorIndex: allAvailableFaculties.length % facultyColors.length,
        };

        const updatedFaculties = [...allAvailableFaculties, newFaculty];
        setAllAvailableFaculties(updatedFaculties);

        setSelectedFacultiesToAdd((prev) => [...prev, newFaculty]);

        setNewFacultyId("");
        setNewFacultyName("");

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
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Something went wrong";
      showAlert(
        "Failed to create faculty",
        message || "Please try again",
        "error"
      );
    } finally {
      setIsCreatingFaculty(false);
    }
  };

  /* =======================
   COPY TO CLIPBOARD AND DOWNLOAD FUNCTIONS
  ======================= */
  const copyToClipboard = async (text, field) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(""), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
      const message =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "Something went wrong";
      showAlert("Failed to copy to clipboard", message, "error");
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
   FETCH TIMETABLE FOR A DIVISION
  ======================= */
  const fetchTimetableForDivision = async (division) => {
    if (!branch || !sem || !division) return null;

    setLoadingDivisions(prev => ({ ...prev, [division]: true }));

    try {
      const response = await api.get("/api/timetable/fetchfulltimetable", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          sem: sem,
          branch: branch,
          class: division,
        },
      });

      const fetchedSchedule = response.data.schedule;

      const formattedSchedule = {};
      days.forEach((day) => {
        formattedSchedule[day] = {};
        timeSlots.forEach((slot) => {
          const slotData = fetchedSchedule[day]?.[slot.value];
          if (slotData) {
            formattedSchedule[day][slot.value] = {
              faculty: slotData.faculty_id || slotData.faculty || "free",
              subject: slotData.subject || "",
              room: slotData.room || "",
              faculty_id: slotData.faculty_id || slotData.faculty || ""
            };
          } else {
            formattedSchedule[day][slot.value] = {
              faculty: "free",
              subject: "",
              room: "",
              faculty_id: ""
            };
          }
        });
      });

      setSchedule(prev => ({
        ...prev,
        [division]: formattedSchedule
      }));

      setExistingTimetables(prev => ({
        ...prev,
        [division]: true
      }));

      await fetchAllowedFacultyForClasses([division]);

      return formattedSchedule;
    } catch (error) {
      console.warn(`No timetable found for ${division}:`, error);
      
      const emptySchedule = days.reduce((dayAcc, day) => {
        dayAcc[day] = timeSlots.reduce((slotAcc, slot) => {
          slotAcc[slot.value] = {
            faculty: "free",
            subject: "",
            room: ""
          };
          return slotAcc;
        }, {});
        return dayAcc;
      }, {});

      setSchedule(prev => ({
        ...prev,
        [division]: emptySchedule
      }));

      setExistingTimetables(prev => ({
        ...prev,
        [division]: false
      }));

      return null;
    } finally {
      setLoadingDivisions(prev => ({ ...prev, [division]: false }));
    }
  };

  /* =======================
   FETCH ALLOWED FACULTY FOR CLASSES
  ======================= */
  const fetchAllowedFacultyForClasses = async (classes) => {
    if (!classes || classes.length === 0) return {};

    try {
      const facultyMap = {};

      const fetchPromises = classes.map(async (className) => {
        try {
          const response = await api.get("/api/timetable/classwise-faculty", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
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
      results.forEach((result) => {
        facultyMap[result.class] = result.faculty;
      });

      // Update faculty options
      const allFaculty = new Set();
      Object.values(facultyMap).forEach((facultyList) => {
        facultyList.forEach((faculty) => allFaculty.add(faculty));
      });

      const uniqueFaculty = Array.from(allFaculty);
      
      // Fetch faculty details to get names
      const facultyDetailsPromises = uniqueFaculty.map(async (facultyId) => {
        try {
          const response = await api.get(`/api/faculties/${facultyId}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          return {
            id: facultyId,
            name: response.data.name || "",
            facultyId: facultyId
          };
        } catch (error) {
          return {
            id: facultyId,
            name: "",
            facultyId: facultyId
          };
        }
      });

      const facultyDetails = await Promise.all(facultyDetailsPromises);

      const newFacultyOptions = [
        ...baseFacultyOptions,
        ...facultyDetails.map((faculty, index) => {
          return {
            value: faculty.facultyId,
            label: faculty.name ? `${faculty.facultyId} (${faculty.name})` : faculty.facultyId,
            name: faculty.name,
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
      setClassFacultyMap(prev => ({ ...prev, ...facultyMap }));

      return facultyMap;
    } catch (error) {
      console.error("Error fetching allowed faculty:", error);
      return {};
    }
  };

  /* =======================
   HANDLE DIVISION SELECTION
  ======================= */
  const handleDivisionToggle = async (division) => {
    const isSelected = selectedDivisions.includes(division);
    
    if (isSelected) {
      setSelectedDivisions(prev => prev.filter(d => d !== division));
      
      setSchedule(prev => {
        const newSchedule = { ...prev };
        delete newSchedule[division];
        return newSchedule;
      });
      
      setExistingTimetables(prev => {
        const newExisting = { ...prev };
        delete newExisting[division];
        return newExisting;
      });
    } else {
      setSelectedDivisions(prev => [...prev, division]);
      await fetchTimetableForDivision(division);
      setSaved(false);
    }
  };

  /* =======================
   SLOT DETAILS MODAL
  ======================= */
  const SlotDetailsModal = () => {
    const handleSaveSlot = () => {
      if (!currentSlot.division || !currentSlot.day || !currentSlot.timeSlot) {
        return;
      }

      setSchedule((prev) => ({
        ...prev,
        [currentSlot.division]: {
          ...prev[currentSlot.division],
          [currentSlot.day]: {
            ...prev[currentSlot.division][currentSlot.day],
            [currentSlot.timeSlot]: {
              faculty: currentSlot.faculty,
              subject: currentSlot.subject,
              room: currentSlot.room
            }
          }
        }
      }));

      setShowSlotModal(false);
      setSaved(false);
      setErrorMsg("");

      showAlert(
        "Slot updated",
        `${currentSlot.day} - ${currentSlot.timeSlot} updated for ${currentSlot.division}`,
        "success"
      );
    };

    const handleFacultyChange = (value) => {
      setCurrentSlot(prev => ({
        ...prev,
        faculty: value,
        ...(value === "free" ? { subject: "", room: "" } : {})
      }));
    };

    const handleAddNewSubject = () => {
      const newSubject = prompt("Enter new subject name:");
      if (newSubject && newSubject.trim() && !subjectOptions.includes(newSubject.trim())) {
        setSubjectOptions(prev => [...prev, newSubject.trim()]);
        setCurrentSlot(prev => ({ ...prev, subject: newSubject.trim() }));
      }
    };

    const handleAddNewRoom = () => {
      const newRoom = prompt("Enter new room number/name:");
      if (newRoom && newRoom.trim() && !roomOptions.includes(newRoom.trim())) {
        setRoomOptions(prev => [...prev, newRoom.trim()]);
        setCurrentSlot(prev => ({ ...prev, room: newRoom.trim() }));
      }
    };

    const facultyStyle = getFacultyStyle(currentSlot.faculty);
    const currentFaculty = facultyOptions.find(f => f.value === currentSlot.faculty);

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden border border-indigo-200">
          <div className="p-6 border-b border-indigo-100 bg-gradient-to-r from-indigo-50 to-indigo-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-white rounded-lg border border-indigo-200">
                  <BookCheck className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-indigo-900">
                    Edit Lecture Details
                  </h2>
                  <p className="text-indigo-700 text-sm mt-1">
                    {currentSlot.division} - {currentSlot.day} - {currentSlot.timeSlot}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowSlotModal(false)}
                className="p-2 hover:bg-white/50 rounded-lg transition-colors border border-indigo-200"
              >
                <X className="w-5 h-5 text-indigo-600" />
              </button>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Faculty
                </label>
                <div className={`p-3 rounded-lg border ${facultyStyle.color}`}>
                  <SearchableFacultySelect
                    value={currentSlot.faculty}
                    onChange={handleFacultyChange}
                    division={currentSlot.division}
                    disabled={false}
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Select faculty for this lecture
                </p>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <BookMarked className="w-4 h-4" />
                  Subject
                </label>
                <div className="flex gap-2">
                  <select
                    value={currentSlot.subject}
                    onChange={(e) => setCurrentSlot(prev => ({ ...prev, subject: e.target.value }))}
                    disabled={currentSlot.faculty === "free"}
                    className="flex-1 px-4 py-2.5 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50"
                  >
                    <option value="">Select Subject</option>
                    {subjectOptions.map((subject) => (
                      <option key={subject} value={subject}>
                        {subject}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={handleAddNewSubject}
                    disabled={currentSlot.faculty === "free"}
                    className="px-3 py-2.5 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors disabled:opacity-50 border border-indigo-200"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-gray-500">
                  Choose or add a subject
                </p>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <DoorOpen className="w-4 h-4" />
                  Room
                </label>
                <div className="flex gap-2">
                  <select
                    value={currentSlot.room}
                    onChange={(e) => setCurrentSlot(prev => ({ ...prev, room: e.target.value }))}
                    disabled={currentSlot.faculty === "free"}
                    className="flex-1 px-4 py-2.5 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50"
                  >
                    <option value="">Select Room</option>
                    {roomOptions.map((room) => (
                      <option key={room} value={room}>
                        Room {room}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={handleAddNewRoom}
                    disabled={currentSlot.faculty === "free"}
                    className="px-3 py-2.5 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors disabled:opacity-50 border border-indigo-200"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-gray-500">
                  Choose or add a room
                </p>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preview
                </label>
                <div className="p-4 bg-gradient-to-r from-indigo-50 to-indigo-100 rounded-lg border border-indigo-200">
                  {currentSlot.faculty === "free" ? (
                    <div className="text-center py-4">
                      <span className="text-gray-500 italic">Free Period</span>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className={`px-3 py-2 rounded-lg border ${facultyStyle.color}`}>
                        <div className="font-medium">
                          Faculty: {currentSlot.faculty}
                          {currentFaculty?.name && ` (${currentFaculty.name})`}
                        </div>
                      </div>
                      {currentSlot.subject && (
                        <div className="px-3 py-2 rounded-lg border border-teal-200 bg-teal-50 text-teal-700">
                          <div className="flex items-center gap-2">
                            <BookMarked className="w-4 h-4" />
                            <span>Subject: {currentSlot.subject}</span>
                          </div>
                        </div>
                      )}
                      {currentSlot.room && (
                        <div className="px-3 py-2 rounded-lg border border-amber-200 bg-amber-50 text-amber-700">
                          <div className="flex items-center gap-2">
                            <DoorOpen className="w-4 h-4" />
                            <span>Room: {currentSlot.room}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 border-t border-indigo-100 bg-indigo-50">
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowSlotModal(false)}
                className="px-4 py-2 border border-indigo-300 text-indigo-700 rounded-lg font-medium hover:bg-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSlot}
                className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-lg font-medium hover:from-indigo-700 hover:to-indigo-800 transition-colors flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  /* =======================
   RENDER SLOT CONTENT
  ======================= */
  const renderSlotContent = (division, day, timeSlot) => {
    const slotData = schedule[division]?.[day]?.[timeSlot] || {
      faculty: "free",
      subject: "",
      room: ""
    };

    if (slotData.faculty === "free") {
      return (
        <div className="text-center py-2">
          <span className="text-gray-400 italic text-xs">Free Period</span>
        </div>
      );
    }

    const facultyStyle = getFacultyStyle(slotData.faculty);
    const facultyOption = facultyOptions.find(f => f.value === slotData.faculty);

    return (
      <div 
        className="cursor-pointer hover:opacity-90 transition-opacity p-2"
        onClick={() => openSlotModal(division, day, timeSlot)}
      >
        <div className={`px-2 py-1.5 rounded-lg ${facultyStyle.color} mb-2`}>
          <div className="flex items-center justify-between">
            <div className="font-semibold text-sm truncate">
              {facultyOption?.name 
                ? `${slotData.faculty} (${facultyOption.name})`
                : slotData.faculty}
            </div>
          </div>
        </div>

        <div className="space-y-1">
          {slotData.subject && (
            <div className="flex items-center gap-2 px-2 py-1 rounded-md bg-teal-50 border border-teal-100">
              <BookMarked className="w-3 h-3 text-teal-600 flex-shrink-0" />
              <span className="text-xs text-teal-700 truncate">
                {slotData.subject}
              </span>
            </div>
          )}
          
          {slotData.room && (
            <div className="flex items-center gap-2 px-2 py-1 rounded-md bg-amber-50 border border-amber-100">
              <DoorOpen className="w-3 h-3 text-amber-600 flex-shrink-0" />
              <span className="text-xs text-amber-700">
                Room {slotData.room}
              </span>
            </div>
          )}
        </div>

        <div className="mt-2 text-center">
          <span className="text-xs text-indigo-500 opacity-0 hover:opacity-100 transition-opacity">
            Click to edit
          </span>
        </div>
      </div>
    );
  };

  /* =======================
   OPEN SLOT MODAL
  ======================= */
  const openSlotModal = (division, day, timeSlot) => {
    const slotData = schedule[division]?.[day]?.[timeSlot] || {
      faculty: "free",
      subject: "",
      room: ""
    };

    setCurrentSlot({
      division,
      day,
      timeSlot,
      faculty: slotData.faculty,
      subject: slotData.subject || "",
      room: slotData.room || ""
    });
    setShowSlotModal(true);
  };

  /* =======================
   ADD FACULTIES TO LEGEND AND DROPDOWNS
  ======================= */
  const handleAddFaculties = () => {
    if (selectedFacultiesToAdd.length === 0) return;

    // Add to Faculty Legend
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
          value: faculty.facultyId || faculty.id,
          label: `${faculty.name} (${faculty.facultyId || faculty.id})`,
          name: faculty.name,
          color,
          bgColor: parts[2] + " " + (parts[3] || ""),
          textColor: parts[4] || parts[3],
        });
      }
    });

    setFacultyOptions(updatedFacultyOptions);

    // Also add to classFacultyMap for selected divisions
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

    // Reset modal
    setSelectedFacultiesToAdd([]);
    setShowFacultyModal(false);
    setSearchQuery("");
    setShowCreateFaculty(false);
    setNewFacultyId("");
    setNewFacultyName("");
    setCreateFacultyError("");

    showAlert(
      "Tutor added successfully",
      `${selectedFacultiesToAdd.length} tutor(s) added to legend and all study group dropdowns`,
      "success"
    );
  };

  /* =======================
   RESET NEW FACULTY FORM
  ======================= */
  const resetNewFacultyForm = () => {
    setNewFacultyId("");
    setNewFacultyName("");
    setCreateFacultyError("");
    setShowCreateFaculty(false);
  };

  /* =======================
   TOGGLE FACULTY SELECTION
  ======================= */
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

  /* =======================
   SAVE FULL TIMETABLE
  ======================= */
  const handleSaveFullTimetable = async () => {
    if (selectedDivisions.length === 0) {
      showAlert(
        "No study groups selected",
        "Please select at least one study group",
        "error"
      );
      return;
    }

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
      if (telegramChatIds.length > 0) {
        try {
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
            }
          }
        } catch (error) {
          console.warn("Error updating Telegram Chat IDs:", error);
          const message =
            error.response?.data?.message ||
            error.response?.data?.error ||
            error.message ||
            "Something went wrong";
          showAlert("Error updating Telegram Chat IDs", message, "error");
        }
      }

      const savePromises = selectedDivisions.map(async (division) => {
        const divisionSchedule = schedule[division];

        const formData = new FormData();
        formData.append("sem", sem);
        formData.append("branch", branch);
        formData.append("class", division);
        formData.append("schedule", JSON.stringify(divisionSchedule));

        const cleanedChatIds = telegramChatIds
          .map((id) => id.trim())
          .filter((id) => id !== "");

        if (cleanedChatIds.length > 0) {
          cleanedChatIds.forEach((chatId, index) => {
            formData.append(`telegram_chat_ids[${index}]`, chatId);
          });
        }

        return api.post("/api/timetable/fullsave", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        });
      });

      const results = await Promise.all(savePromises);

      console.log("Saved all complete timetables:", results);
      setSaved(true);

      selectedDivisions.forEach((division) => {
        setExistingTimetables(prev => ({
          ...prev,
          [division]: true
        }));
      });

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
        "Complete timetables saved successfully",
        `All ${selectedDivisions.length} study group schedules with subject and room details have been saved for ${branch} - Semester ${sem}. ${telegramMessage}`,
        "success"
      );
    } catch (error) {
      console.error("Error saving complete timetables:", error);
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Something went wrong";
      showAlert("Error saving timetables", message, "error");

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
      }
    } finally {
      setIsLoading(false);
    }
  };

  /* =======================
   FETCH ALL EXISTING TIMETABLES FOR BRANCH
  ======================= */
  const fetchAllExistingTimetables = async () => {
    if (!branch || !sem) return;

    setFetching(true);
    try {
      const existingDivisions = [];
      const newExistingTimetables = {};

      for (const division of divisionOptions) {
        try {
          const response = await api.get("/api/timetable/fetchfulltimetable", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            params: {
              sem: sem,
              branch: branch,
              class: division,
            },
          });

          if (response.data && response.data.schedule) {
            existingDivisions.push(division);
            newExistingTimetables[division] = true;
            
            const fetchedSchedule = response.data.schedule;
            const formattedSchedule = {};
            days.forEach((day) => {
              formattedSchedule[day] = {};
              timeSlots.forEach((slot) => {
                const slotData = fetchedSchedule[day]?.[slot.value];
                if (slotData) {
                  formattedSchedule[day][slot.value] = {
                    faculty: slotData.faculty_id || slotData.faculty || "free",
                    subject: slotData.subject || "",
                    room: slotData.room || "",
                    faculty_id: slotData.faculty_id || slotData.faculty || ""
                  };
                } else {
                  formattedSchedule[day][slot.value] = {
                    faculty: "free",
                    subject: "",
                    room: "",
                    faculty_id: ""
                  };
                }
              });
            });

            setSchedule(prev => ({
              ...prev,
              [division]: formattedSchedule
            }));
          }
        } catch (error) {
          newExistingTimetables[division] = false;
        }
      }

      setExistingTimetables(newExistingTimetables);
      
      if (existingDivisions.length > 0) {
        showAlert(
          "Found existing timetables",
          `${existingDivisions.length} divisions have existing timetables for ${branch} - Semester ${sem}`,
          "success"
        );
      }

      if (existingDivisions.length > 0) {
        await fetchAllowedFacultyForClasses(existingDivisions);
      }
    } catch (error) {
      console.error("Error checking existing timetables:", error);
    } finally {
      setFetching(false);
    }
  };

  /* =======================
   FETCH ALL FACULTIES ON MODAL OPEN - FIXED
  ======================= */
  useEffect(() => {
    if (showFacultyModal) {
      fetchAllFaculties();
    }
  }, [showFacultyModal]);

  /* =======================
   INITIAL LOAD
  ======================= */
  useEffect(() => {
    if (isInitialLoad && location.state?.branch && location.state?.sem) {
      fetchAllFaculties();
      fetchTelegramChatIds();
      fetchAllExistingTimetables();
      setIsInitialLoad(false);
    }
  }, []);

  useEffect(() => {
    if (branch && sem) {
      fetchTelegramChatIds();
    }
  }, [branch, sem]);

  /* =======================
   FACULTY MANAGEMENT MODAL - FIXED
  ======================= */
  const FacultyManagementModal = () => {
    const filteredFaculties = allAvailableFaculties.filter(
      (faculty) =>
        faculty.displayLabel.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (faculty.facultyId &&
          faculty.facultyId.toLowerCase().includes(searchQuery.toLowerCase())) ||
        faculty.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[80vh] overflow-hidden flex flex-col border border-indigo-200">
          <div className="p-6 border-b border-indigo-100 bg-gradient-to-r from-indigo-50 to-indigo-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg border border-indigo-200">
                  <PenTool className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-indigo-900">
                    Add Study Tutors
                  </h2>
                  <p className="text-indigo-700 text-sm mt-1">
                    Select tutors to add to your schedule dropdowns or create new tutor
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
                className="p-2 hover:bg-white/50 rounded-lg transition-colors border border-indigo-200"
              >
                <X className="w-5 h-5 text-indigo-600" />
              </button>
            </div>

            <div className="mt-4 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-indigo-400" />
              <input
                type="text"
                placeholder="Search tutors by name or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div className="mt-3 flex items-center justify-between">
              <span className="text-sm text-indigo-700">
                {selectedFacultiesToAdd.length} tutor(s) selected
              </span>
              <span className="text-sm text-indigo-700">
                {filteredFaculties.length} available
              </span>
            </div>
          </div>

          {showCreateFaculty ? (
            <div className="p-6 border-b border-indigo-100 bg-violet-50">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg border border-violet-200">
                    <UserPlus className="w-5 h-5 text-violet-600" />
                  </div>
                  <h3 className="font-bold text-gray-900">
                    Create New Tutor
                  </h3>
                </div>
                <button
                  onClick={resetNewFacultyForm}
                  className="p-1 hover:bg-violet-100 rounded-lg transition-colors"
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
                    className="w-full px-4 py-2.5 bg-white border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
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
                    className="w-full px-4 py-2.5 bg-white border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Full name of the tutor
                  </p>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={resetNewFacultyForm}
                  className="px-4 py-2.5 border border-indigo-300 text-indigo-700 rounded-lg font-medium hover:bg-indigo-50 transition-colors"
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
                      : "bg-gradient-to-r from-indigo-600 to-indigo-700 text-white hover:from-indigo-700 hover:to-indigo-800"
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
            <div className="p-4 border-b border-indigo-100">
              <button
                onClick={() => setShowCreateFaculty(true)}
                className="w-full px-4 py-3 border-2 border-dashed border-indigo-300 rounded-xl text-indigo-600 hover:border-indigo-500 hover:text-indigo-700 hover:bg-indigo-50 transition-all flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Create New Tutor
              </button>
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-6">
            {isLoadingAllFaculties ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-4" />
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
                          ? "border-indigo-500 bg-indigo-50"
                          : "border-indigo-200 hover:border-indigo-300 hover:bg-indigo-50"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mt-0.5 flex-shrink-0 ${
                            isAlreadyInOptions
                              ? "border-gray-300 bg-gray-200"
                              : isSelected
                              ? "border-indigo-500 bg-indigo-500"
                              : "border-indigo-300"
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

          <div className="p-6 border-t border-indigo-100 bg-indigo-50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">
                  Selected: {selectedFacultiesToAdd.length} tutor(s)
                </p>
                {selectedFacultiesToAdd.length > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    Selected tutor(s) will be added to all study group dropdowns
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
                  className="px-4 py-2 border border-indigo-300 text-indigo-700 rounded-lg font-medium hover:bg-indigo-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddFaculties}
                  disabled={selectedFacultiesToAdd.length === 0}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    selectedFacultiesToAdd.length === 0
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-gradient-to-r from-indigo-600 to-indigo-700 text-white hover:from-indigo-700 hover:to-indigo-800"
                  }`}
                >
                  Add Selected Tutor(s)
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  /* =======================
   CREDENTIALS MODAL
  ======================= */
  const CredentialsModal = () => {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 z-[100]">
        <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl border border-indigo-200">
          <div className="p-6 bg-gradient-to-r from-violet-500 to-violet-600 text-white">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <Key className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Study Access Created!</h2>
                <p className="text-violet-100 text-sm mt-1">
                  Tutor account created successfully
                </p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-6">
              <div className="flex gap-3">
                <StickyNote className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-indigo-900 text-sm">
                    Save These Credentials!
                  </p>
                  <p className="text-indigo-700 text-sm mt-1">
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
                    className="px-4 py-2 bg-violet-100 text-violet-700 rounded-lg hover:bg-violet-200 transition-colors flex items-center gap-2 border border-violet-200"
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
                    className="px-4 py-2 bg-violet-100 text-violet-700 rounded-lg hover:bg-violet-200 transition-colors flex items-center gap-2 border border-violet-200"
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

          <div className="p-6 border-t border-gray-200 bg-indigo-50">
            <div className="flex gap-3">
              <button
                onClick={downloadCredentials}
                className="flex-1 px-4 py-3 bg-white border border-indigo-300 text-indigo-700 rounded-lg font-medium hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download as File
              </button>
              <button
                onClick={() => {
                  setShowCredentialsModal(false);
                  setGeneratedCredentials(null);
                }}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-violet-600 to-violet-700 text-white rounded-lg font-medium hover:from-violet-700 hover:to-violet-800 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  /* =======================
        RENDER
  ======================= */
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-violet-50 p-4 md:p-6">
      {alert && (
        <Alert
          main={alert.main}
          info={alert.info}
          type={alert.type}
          onClose={() => setAlert(null)}
        />
      )}

      {showSlotModal && <SlotDetailsModal />}
      {showFacultyModal && <FacultyManagementModal />}
      {showCredentialsModal && generatedCredentials && <CredentialsModal />}

      <div className="relative z-10 max-w-7xl mx-auto">
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
            <span className="font-medium text-indigo-600 flex items-center gap-1">
              <BookCheck className="w-4 h-4" />
              Complete Schedule Management
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Complete Timetable Management
            </h1>
            <p className="text-gray-600">
              Manage complete schedules with faculty, subject, and room details
            </p>
          </div>
          <div className="p-3 bg-white rounded-xl border border-indigo-200 shadow-sm">
            <BookCheck className="w-6 h-6 text-indigo-600" />
          </div>
        </div>

        {errorMsg && (
          <div
            className={`mb-6 p-4 rounded-xl border flex items-start gap-3 ${
              errorMsg.includes("Loaded") ||
              errorMsg.includes("Added") ||
              errorMsg.includes("created successfully") ||
              errorMsg.includes("Failed to fetch")
                ? "border-indigo-200 bg-indigo-50"
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
                  ? "text-indigo-500"
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
                    ? "text-indigo-800"
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
                    ? "text-indigo-700"
                    : "text-red-700"
                }`}
              >
                {errorMsg}
              </p>
            </div>
          </div>
        )}

        {saved && (
          <div className="mb-6 p-4 rounded-xl border border-violet-200 bg-gradient-to-r from-violet-50 to-violet-100 flex items-center gap-3">
            <div className="p-2 bg-white rounded-lg border border-violet-200">
              <FileCheck className="w-5 h-5 text-violet-500" />
            </div>
            <div>
              <p className="font-bold text-violet-800">
                Complete Schedules Saved Successfully
              </p>
              <p className="text-violet-700 text-sm mt-1">
                All {selectedDivisions.length} study group schedules have been
                saved for {branch} - Semester {sem}.
              </p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl p-6 border border-indigo-200 shadow-sm mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-gradient-to-br from-indigo-100 to-indigo-50 rounded-lg border border-indigo-200">
              <Compass className="w-5 h-5 text-indigo-600" />
            </div>
            <h2 className="text-lg font-bold text-indigo-900">
              Complete Schedule Configuration
            </h2>
          </div>

          {branch && sem && (
            <div className="mb-6 p-4 bg-gradient-to-r from-violet-50 to-violet-100 rounded-xl border border-violet-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg border border-violet-200">
                    <MessageSquare className="w-5 h-5 text-violet-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-violet-900">
                      Study Notifications
                    </h3>
                    <p className="text-violet-700 text-sm">
                      Set up Telegram for schedule updates
                    </p>
                  </div>
                </div>
                {!isEditingTelegram ? (
                  <button
                    onClick={() => setIsEditingTelegram(true)}
                    className="px-3 py-1.5 bg-violet-100 text-violet-700 rounded-lg text-xs font-bold hover:bg-violet-200 transition-colors flex items-center gap-2 border border-violet-200"
                  >
                    <Edit className="w-3 h-3" />
                    {telegramChatIds.length > 0 ? "Edit" : "Add"}
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setIsEditingTelegram(false);
                        fetchTelegramChatIds();
                      }}
                      className="px-3 py-1.5 border border-indigo-300 text-indigo-700 rounded-lg text-xs font-bold hover:bg-indigo-50 transition-colors"
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

                    <div className="mb-4 p-3 bg-violet-50 border border-violet-200 rounded-lg">
                      <h4 className="font-bold text-violet-900 mb-2 flex items-center gap-2">
                        <Info className="w-4 h-4" />
                        How to get your Chat ID:
                      </h4>
                      <ol className="text-sm text-violet-800 space-y-1 ml-6 list-decimal">
                        <li>
                          Click this link:{" "}
                          <a
                            href="https://t.me/sister_saira_bot?start"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-violet-600 hover:text-violet-800 underline font-bold"
                          >
                            https://t.me/sister_saira_bot?start
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

                    <div className="space-y-2 mb-3">
                      {telegramChatIds.length === 0 ? (
                        <div className="text-center py-4 border-2 border-dashed border-violet-300 rounded-lg bg-white">
                          <MessageSquare className="w-8 h-8 text-violet-400 mx-auto mb-2" />
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
                            <div className="flex-1 flex items-center gap-3 px-3 py-2 border border-violet-300 rounded-lg bg-white">
                              <div className="w-6 h-6 flex items-center justify-center rounded-full bg-violet-100 text-violet-700 text-xs font-bold">
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
                                    : "bg-violet-100 text-violet-700"
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

                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={newChatId}
                        onChange={(e) => setNewChatId(e.target.value)}
                        placeholder="Enter new Chat ID..."
                        className="flex-1 px-4 py-2 border border-violet-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                        onKeyPress={(e) => {
                          if (e.key === "Enter" && newChatId.trim()) {
                            handleAddChatIdField();
                          }
                        }}
                      />
                      <button
                        onClick={handleAddChatIdField}
                        disabled={!newChatId.trim()}
                        className="px-4 py-2 bg-violet-600 text-white rounded-lg font-bold hover:bg-violet-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed border border-violet-700"
                      >
                        <Plus className="w-4 h-4" />
                        Add
                      </button>
                    </div>

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
                      className="px-4 py-2 bg-violet-600 text-white rounded-lg font-bold hover:bg-violet-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed border border-violet-700"
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
                          <p className="text-sm font-bold text-violet-900 mb-1">
                            {telegramChatIds.length} Chat ID
                            {telegramChatIds.length !== 1 ? "s" : ""} configured
                          </p>
                          <p className="text-sm text-violet-700">
                            These IDs will be used for all {branch} Semester{" "}
                            {sem} study groups
                          </p>
                        </div>
                        <div className="p-3 bg-white rounded-lg border border-violet-200">
                          <MessageSquare className="w-6 h-6 text-violet-600" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        {telegramChatIds.map((chatId, index) => (
                          <div
                            key={index}
                            className="px-3 py-3 bg-white border border-violet-200 rounded-lg hover:border-violet-300 transition-colors group"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 flex items-center justify-center rounded-full bg-violet-100 text-violet-700 font-bold">
                                  {index + 1}
                                </div>
                                <div>
                                  <div className="font-mono text-violet-800 text-sm">
                                    {chatId}
                                  </div>
                                  <div className="text-xs text-violet-600">
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
                                className="p-2 text-violet-600 hover:bg-violet-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100 border border-violet-200"
                                title="Copy to clipboard"
                              >
                                <Copy className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 pt-3 border-t border-violet-200">
                        <div className="flex items-center justify-between text-xs text-violet-700">
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

                      <div className="mb-4 p-3 bg-violet-50 border border-violet-200 rounded-lg text-left">
                        <p className="text-sm text-violet-800 font-bold mb-1">
                          How to get Chat ID:
                        </p>
                        <ol className="text-xs text-violet-700 space-y-1 ml-4 list-decimal">
                          <li>
                            <a
                              href="https://t.me/sister_saira_bot?start=123"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-violet-600 hover:text-violet-800 underline"
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
                        className="px-4 py-2 bg-violet-600 text-white rounded-lg font-bold hover:bg-violet-700 transition-colors border border-violet-700"
                      >
                        Add Chat IDs
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-600" />
                Semester
              </label>
              <div className="relative">
                <GraduationCap className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-indigo-500" />
                <select
                  value={sem}
                  onChange={(e) => {
                    setSem(Number(e.target.value));
                    setSelectedDivisions([]);
                    setSchedule(initializeSchedule([]));
                    setExistingTimetables({});
                  }}
                  className="w-full pl-10 pr-4 py-3 bg-white border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                    <option key={s} value={s}>
                      Semester {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                <Notebook className="w-4 h-4 text-violet-600" />
                Subject
              </label>
              <div className="relative">
                <Notebook className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-violet-500" />
                <select
                  value={branch}
                  onChange={(e) => {
                    setBranch(e.target.value);
                    setSelectedDivisions([]);
                    setSchedule(initializeSchedule([]));
                    setExistingTimetables({});
                  }}
                  className="w-full pl-10 pr-4 py-3 bg-white border border-violet-200 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all"
                >
                  {branchOptions.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-end">
              <button
                onClick={fetchAllExistingTimetables}
                disabled={fetching || !branch || !sem}
                className={`w-full px-4 py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all border ${
                  fetching || !branch || !sem
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed border-gray-300"
                    : "bg-gradient-to-r from-indigo-600 to-indigo-700 text-white hover:from-indigo-700 hover:to-indigo-800 border-indigo-700"
                }`}
              >
                {fetching ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Checking...
                  </>
                ) : (
                  <>
                    <FolderPlus className="w-5 h-5" />
                    Check Existing
                  </>
                )}
              </button>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                <Users className="w-4 h-4 text-violet-600" />
                Select Study Groups
              </label>
              <div className="flex items-center gap-2">
                <div className="text-xs text-gray-500">
                  {selectedDivisions.length} selected
                </div>
                {fetching && (
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                )}
              </div>
            </div>
          </div>

          <div className="mb-6">
            <div className="flex flex-wrap gap-2">
              {divisionOptions.map((division) => {
                const isSelected = selectedDivisions.includes(division);
                const exists = existingTimetables[division];
                const isLoading = loadingDivisions[division];

                return (
                  <button
                    key={division}
                    onClick={() => handleDivisionToggle(division)}
                    disabled={isLoading}
                    className={`px-4 py-2 rounded-lg border transition-all duration-200 flex items-center gap-2 ${
                      isSelected
                        ? exists
                          ? "bg-gradient-to-r from-violet-100 to-violet-50 border-violet-300 text-violet-800 hover:from-violet-200 hover:to-violet-100"
                          : "bg-gradient-to-r from-indigo-100 to-indigo-50 border-indigo-300 text-indigo-800 hover:from-indigo-200 hover:to-indigo-100"
                        : "bg-gradient-to-r from-gray-100 to-gray-50 border-gray-300 text-gray-700 hover:from-gray-200 hover:to-gray-100"
                    } ${isLoading ? "opacity-75 cursor-wait" : ""}`}
                    title={
                      exists
                        ? `Existing timetable for ${division}`
                        : `No timetable found for ${division}`
                    }
                  >
                    {division}
                    {isLoading && (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    )}
                    {isSelected && exists && (
                      <div className="w-2 h-2 bg-violet-500 rounded-full"></div>
                    )}
                    {!isSelected && exists && (
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center gap-4 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-gradient-to-r from-indigo-100 to-indigo-50 border border-indigo-300 rounded"></div>
                <span className="text-sm text-gray-600">Selected (New)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-gradient-to-r from-violet-100 to-violet-50 border border-violet-300 rounded"></div>
                <span className="text-sm text-gray-600">
                  Selected (Existing)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-gradient-to-r from-gray-100 to-gray-50 border border-gray-300 rounded"></div>
                <span className="text-sm text-gray-600">Not Selected</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Has Existing</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-indigo-200 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-gradient-to-br from-indigo-100 to-indigo-50 rounded-lg border border-indigo-200">
                  <Highlighter className="w-4 h-4 text-indigo-600" />
                </div>
                <h3 className="text-sm font-bold text-gray-700">
                  Schedule Legend
                </h3>
              </div>
              <button
                onClick={() => setShowFacultyModal(true)}
                className="px-3 py-1.5 bg-gradient-to-r from-indigo-50 to-indigo-100 text-indigo-700 rounded-lg text-xs font-bold flex items-center gap-2 hover:from-indigo-100 hover:to-indigo-200 transition-colors border border-indigo-200"
              >
                <UserPlus className="w-3 h-3" />
                Add Tutor
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {facultyOptions.map((faculty) => {
                if (faculty.value === "free") {
                  return (
                    <div
                      key={faculty.value}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold ${faculty.color} border`}
                    >
                      {faculty.label}
                    </div>
                  );
                }

                const facultyId = faculty.value;
                const facultyName = faculty.name || "";

                return (
                  <div
                    key={faculty.value}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold ${faculty.color} border`}
                    title={`${facultyId}${facultyName ? ` (${facultyName})` : ""}`}
                  >
                    {facultyName ? `${facultyId} (${facultyName})` : facultyId}
                  </div>
                );
              })}
            </div>
            <div className="text-xs text-gray-500 mt-2 flex items-center gap-1">
              <Info className="w-3 h-3" />
              Click on any slot to edit faculty, subject, and room details
            </div>
          </div>
        </div>

        {selectedDivisions.length > 0 && (
          <div className="mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-4">
              {selectedDivisions.map((division) => {
                const exists = existingTimetables[division];
                const isLoading = loadingDivisions[division];

                return (
                  <div
                    key={division}
                    className="bg-white rounded-xl border border-indigo-200 shadow-sm relative"
                  >
                    {isLoading && (
                      <div className="absolute inset-0 bg-white/80 z-10 flex items-center justify-center rounded-xl">
                        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                      </div>
                    )}

                    <div className="p-4 border-b border-indigo-200 bg-gradient-to-r from-indigo-50 to-indigo-100">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-white rounded-lg border border-indigo-200">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                          </div>
                          <div>
                            <h3 className="font-bold text-lg text-gray-900">
                              {division}
                            </h3>
                            <div className="text-xs text-indigo-600 mt-1">
                              {exists ? "Existing timetable" : "New timetable"} • Click slots to edit
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-4">
                      <div className="space-y-3">
                        {days.map((day) => (
                          <div
                            key={day}
                            className="border border-indigo-200 rounded-lg overflow-hidden"
                          >
                            <div className="p-3 bg-gradient-to-r from-indigo-50 to-indigo-100">
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-indigo-600" />
                                <span className="font-bold text-gray-900">
                                  {day}
                                </span>
                              </div>
                            </div>

                            <div className="p-3 bg-white">
                              <div className="space-y-3">
                                {timeSlots.map((slot) => (
                                  <div
                                    key={slot.value}
                                    className="p-3 border border-indigo-100 rounded-lg hover:bg-indigo-50/50 transition-colors"
                                  >
                                    <div className="w-16 text-xs text-indigo-700 font-bold mb-2">
                                      {slot.label}
                                    </div>
                                    {renderSlotContent(division, day, slot.value)}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex flex-wrap gap-4 justify-center mb-12">
              <button
                onClick={handleSaveFullTimetable}
                disabled={isLoading || selectedDivisions.length === 0}
                className={`px-8 py-3 rounded-lg font-bold flex items-center gap-2 transition-all duration-300 border ${
                  isLoading || selectedDivisions.length === 0
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed border-gray-300"
                    : "bg-gradient-to-r from-indigo-600 to-indigo-700 text-white hover:from-indigo-700 hover:to-indigo-800 shadow-sm hover:shadow-md border-indigo-700"
                }`}
              >
                <Save className="w-5 h-5" />
                {isLoading
                  ? "Saving..."
                  : `Save ${selectedDivisions.length} Complete Schedule${
                      selectedDivisions.length !== 1 ? "s" : ""
                    }`}
              </button>

              <button
                onClick={() => {
                  if (window.confirm("Clear all schedules for selected divisions?")) {
                    selectedDivisions.forEach(division => {
                      setSchedule(prev => ({
                        ...prev,
                        [division]: days.reduce((dayAcc, day) => {
                          dayAcc[day] = timeSlots.reduce((slotAcc, slot) => {
                            slotAcc[slot.value] = {
                              faculty: "free",
                              subject: "",
                              room: ""
                            };
                            return slotAcc;
                          }, {});
                          return dayAcc;
                        }, {})
                      }));
                    });
                    setSaved(false);
                  }
                }}
                disabled={selectedDivisions.length === 0}
                className={`px-6 py-3 rounded-lg border font-bold flex items-center gap-2 transition-all duration-300 ${
                  selectedDivisions.length === 0
                    ? "border-gray-200 text-gray-400 cursor-not-allowed"
                    : "border-indigo-300 text-indigo-700 hover:bg-indigo-50"
                }`}
              >
                <Trash2 className="w-5 h-5" />
                Clear All
              </button>
            </div>
          </div>
        )}

        {selectedDivisions.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl p-6 border border-indigo-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Study Groups</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">
                    {selectedDivisions.length}
                  </p>
                </div>
                <div className="p-3 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg border border-indigo-200">
                  <Users className="w-6 h-6 text-indigo-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 border border-indigo-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Assigned Lectures</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">
                    {selectedDivisions.reduce((total, division) => {
                      if (!schedule[division]) return total;
                      return total + Object.values(schedule[division]).flatMap(
                        (day) => Object.values(day).filter(
                          (slot) => slot.faculty !== "free"
                        )
                      ).length;
                    }, 0)}
                  </p>
                </div>
                <div className="p-3 bg-gradient-to-br from-violet-50 to-violet-100 rounded-lg border border-violet-200">
                  <Clock className="w-6 h-6 text-violet-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 border border-indigo-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Subjects Used</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">
                    {Array.from(new Set(
                      selectedDivisions.flatMap(division => 
                        Object.values(schedule[division] || {}).flatMap(day =>
                          Object.values(day).map(slot => slot.subject).filter(Boolean)
                        )
                      )
                    )).length}
                  </p>
                </div>
                <div className="p-3 bg-gradient-to-br from-teal-50 to-teal-100 rounded-lg border border-teal-200">
                  <BookMarked className="w-6 h-6 text-teal-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 border border-indigo-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Rooms Used</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">
                    {Array.from(new Set(
                      selectedDivisions.flatMap(division => 
                        Object.values(schedule[division] || {}).flatMap(day =>
                          Object.values(day).map(slot => slot.room).filter(Boolean)
                        )
                      )
                    )).length}
                  </p>
                </div>
                <div className="p-3 bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg border border-amber-200">
                  <DoorOpen className="w-6 h-6 text-amber-600" />
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-gradient-to-r from-indigo-50 to-violet-50 rounded-2xl p-6 border-2 border-indigo-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-gradient-to-br from-indigo-100 to-indigo-50 rounded-lg border border-indigo-200">
              <Info className="w-5 h-5 text-indigo-600" />
            </div>
            <h3 className="font-bold text-indigo-900">Complete Schedule Guide</h3>
          </div>
          <ul className="space-y-2 text-indigo-800 text-sm">
            <li className="flex items-start gap-2">
              <div className="w-2 h-2 bg-indigo-400 rounded-full mt-1.5"></div>
              <span>
                <strong>Click to Edit</strong> - Click on any slot to edit faculty, subject, and room details in a convenient modal.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-2 h-2 bg-indigo-400 rounded-full mt-1.5"></div>
              <span>
                <strong>Faculty Display</strong> - Faculty are shown as "Faculty ID (Faculty Name)" in both dropdowns and slot displays.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-2 h-2 bg-indigo-400 rounded-full mt-1.5"></div>
              <span>
                <strong>Color Coding</strong> - Faculty names are color-coded, subjects show in teal, and rooms in amber for easy scanning.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-2 h-2 bg-indigo-400 rounded-full mt-1.5"></div>
              <span>
                <strong>Add New Values</strong> - In the edit modal, click the + button to add new subjects or rooms that aren't in the list.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-2 h-2 bg-indigo-400 rounded-full mt-1.5"></div>
              <span>
                <strong>Statistics Dashboard</strong> - Track the number of study groups, lectures, subjects, and rooms used.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-2 h-2 bg-indigo-400 rounded-full mt-1.5"></div>
              <span>
                <strong>Add Tutors</strong> - Use the "Add Tutor" button in the legend section to add new tutors from the database to your dropdowns.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-2 h-2 bg-indigo-400 rounded-full mt-1.5"></div>
              <span>
                <strong>Telegram Notifications</strong> - Set up Telegram Chat IDs to receive schedule updates and notifications for all study groups.
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}