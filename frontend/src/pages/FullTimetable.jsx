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
  Book,
  BookPlus,
  Library,
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

  // Subject color mapping
  const subjectColors = [
    "border-teal-200 bg-teal-50 text-teal-700",
    "border-blue-200 bg-blue-50 text-blue-700",
    "border-emerald-200 bg-emerald-50 text-emerald-700",
    "border-cyan-200 bg-cyan-50 text-cyan-700",
    "border-lime-200 bg-lime-50 text-lime-700",
    "border-amber-200 bg-amber-50 text-amber-700",
    "border-orange-200 bg-orange-50 text-orange-700",
    "border-rose-200 bg-rose-50 text-rose-700",
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

  // Initialize schedule
  const initializeSchedule = (divisions) => {
    const schedule = {};
    divisions.forEach((division) => {
      schedule[division] = days.reduce((dayAcc, day) => {
        dayAcc[day] = timeSlots.reduce((slotAcc, slot) => {
          slotAcc[slot.value] = {
            faculty: "free",
            subject: "",
            room: "",
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

  // Subject state - similar to faculty
  const [classSubjectMap, setClassSubjectMap] = useState({});

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

  // Subject management
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [allAvailableSubjects, setAllAvailableSubjects] = useState([]);
  const [selectedSubjectsToAdd, setSelectedSubjectsToAdd] = useState([]);
  const [subjectSearchQuery, setSubjectSearchQuery] = useState("");
  const [isLoadingAllSubjects, setIsLoadingAllSubjects] = useState(false);

  // New subject creation
  const [showCreateSubject, setShowCreateSubject] = useState(false);
  const [newSubjectCode, setNewSubjectCode] = useState("");
  const [newSubjectName, setNewSubjectName] = useState("");
  const [newSubjectSlug, setNewSubjectSlug] = useState("");
  const [isCreatingSubject, setIsCreatingSubject] = useState(false);
  const [createSubjectError, setCreateSubjectError] = useState("");

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
  const [subjectOptions, setSubjectOptions] = useState([]);
  const [subjectMap, setSubjectMap] = useState({});
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(false);

  const [roomOptions, setRoomOptions] = useState([]);
  const [isLoadingRooms, setIsLoadingRooms] = useState(false);

  // Editing state for in-place editing
  const [editingSlot, setEditingSlot] = useState(null);
  const [editingValue, setEditingValue] = useState("");

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
   FETCH ALL SUBJECTS FROM DATABASE
  ======================= */
  const fetchAllSubjects = async () => {
    setIsLoadingSubjects(true);
    try {
      const response = await api.get("/api/subjects", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        const subjects = response.data.subjects || [];

        // Create mapping: subject_code -> {name, slug}
        const subjectMapping = {};
        const subjectOptionsList = [];

        subjects.forEach((subject, index) => {
          const subjectCode = subject.subject_code || subject.id;
          const subjectName = subject.name || "Unknown Subject";
          const subjectSlug = subject.slug || subjectCode;

          subjectMapping[subjectCode] = {
            name: subjectName,
            slug: subjectSlug,
            color: subjectColors[index % subjectColors.length],
          };

          subjectOptionsList.push({
            value: subjectCode,
            label: subjectSlug,
            name: subjectName,
            slug: subjectSlug,
            color: subjectColors[index % subjectColors.length],
          });
        });

        setSubjectMap(subjectMapping);
        setSubjectOptions(subjectOptionsList);

        // Also update allAvailableSubjects for modal
        const formattedSubjects = subjects.map((subject, index) => {
          const subjectCode = subject.subject_code || subject.id;
          const subjectName = subject.name || "Unknown Subject";
          const subjectSlug = subject.slug || subjectCode;

          return {
            id: subjectCode,
            code: subjectCode,
            name: subjectName,
            slug: subjectSlug,
            displayLabel: `${subjectSlug} (${subjectCode})`,
            colorIndex: index % subjectColors.length,
          };
        });

        setAllAvailableSubjects(formattedSubjects);

        console.log(`Loaded ${subjects.length} subjects from database`);
        return subjectMapping;
      } else {
        console.error("Failed to fetch subjects:", response.data.error);
        showAlert(
          "Failed to load subjects",
          "Could not fetch subject names from database",
          "warning",
        );
        return {};
      }
    } catch (error) {
      console.error("Error fetching subjects:", error);
      showAlert(
        "Error loading subjects",
        error.response?.data?.error || "Network error",
        "warning",
      );
      return {};
    } finally {
      setIsLoadingSubjects(false);
    }
  };

  /* =======================
   FETCH ALL ROOMS FROM DATABASE
  ======================= */
  const fetchAllRooms = async () => {
    setIsLoadingRooms(true);
    try {
      const response = await api.get("/api/rooms", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        const rooms = response.data.rooms || [];
        const roomNames = rooms.map((room) => room.name || room.id).sort();

        setRoomOptions(roomNames);
        console.log(`Loaded ${rooms.length} rooms from database`);
        return roomNames;
      } else {
        console.error("Failed to fetch rooms:", response.data.error);
        showAlert(
          "Failed to load rooms",
          "Could not fetch room list from database",
          "warning",
        );
        return [];
      }
    } catch (error) {
      console.error("Error fetching rooms:", error);
      showAlert(
        "Error loading rooms",
        error.response?.data?.error || "Network error",
        "warning",
      );
      return [];
    } finally {
      setIsLoadingRooms(false);
    }
  };

  /* =======================
   CREATE NEW ROOM IN DATABASE
  ======================= */
  const createNewRoom = async (roomName) => {
    try {
      const response = await api.post(
        "/api/rooms",
        {
          name: roomName.trim(),
          floor: 1,
          type: "Classroom",
          capacity: 50,
          description: "",
          is_lab: false,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (response.data.success) {
        // Add to local options
        setRoomOptions((prev) => [...prev, roomName.trim()].sort());
        showAlert(
          "Room created successfully",
          `Room "${roomName}" has been added to the database`,
          "success",
        );
        return true;
      } else {
        throw new Error(response.data.message || "Failed to create room");
      }
    } catch (error) {
      console.error("Error creating room:", error);
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Something went wrong";
      showAlert("Failed to create room", message, "error");
      return false;
    }
  };

  /* =======================
   GET SUBJECT DISPLAY NAME
  ======================= */
  const getSubjectDisplayName = (subjectCode) => {
    if (!subjectCode || subjectCode === "") return "";

    if (subjectMap[subjectCode]) {
      return subjectMap[subjectCode].slug || subjectCode;
    }

    return subjectCode;
  };

  /* =======================
   GET SUBJECT DETAILS
  ======================= */
  const getSubjectDetails = (subjectCode) => {
    if (!subjectCode || subjectCode === "")
      return { name: "", slug: "", color: "" };

    if (subjectMap[subjectCode]) {
      return subjectMap[subjectCode];
    }

    return {
      name: "",
      slug: subjectCode,
      color: "border-gray-200 bg-gray-50 text-gray-700",
    };
  };

  /* =======================
   IN-PLACE FACULTY SELECT COMPONENT (TYPABLE VERSION)
  ======================= */
  const InPlaceFacultySelect = ({
    value,
    onChange,
    division,
    day,
    timeSlot,
    disabled,
  }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [filteredOptions, setFilteredOptions] = useState([]);
    const dropdownRef = useRef(null);
    const inputRef = useRef(null);

    const facultyOptionsForClass = React.useMemo(() => {
      return facultyOptions;
    }, [facultyOptions]);

    useEffect(() => {
      if (search.trim() === "") {
        setFilteredOptions(facultyOptionsForClass);
      } else {
        const searchLower = search.toLowerCase();
        const filtered = facultyOptionsForClass.filter((option) => {
          const valueStr = option.value || "";
          const nameStr = option.name || "";
          const labelStr = option.label || "";
          return (
            valueStr.toLowerCase().includes(searchLower) ||
            nameStr.toLowerCase().includes(searchLower) ||
            labelStr.toLowerCase().includes(searchLower)
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
        } else {
          // Try to find exact match
          const exactMatch = facultyOptionsForClass.find(
            (option) =>
              option.value.toLowerCase() === search.toLowerCase().trim() ||
              option.name.toLowerCase() === search.toLowerCase().trim(),
          );
          if (exactMatch) {
            handleSelect(exactMatch);
          } else {
            setIsOpen(false);
            setSearch("");
          }
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
      setEditingSlot(null);
    };

    const currentOption =
      facultyOptionsForClass.find((opt) => opt.value === value) ||
      facultyOptionsForClass[0];

    const displayValue =
      currentOption.value === "free"
        ? "Free Period"
        : currentOption.name
          ? `${currentOption.value} (${currentOption.name})`
          : currentOption.value;

    const handleInputChange = (e) => {
      const newValue = e.target.value;
      setSearch(newValue);

      // If user types a value that matches a faculty exactly, select it
      if (newValue.trim() !== "") {
        const exactMatch = facultyOptionsForClass.find(
          (option) =>
            option.value.toLowerCase() === newValue.toLowerCase().trim() ||
            (option.name &&
              option.name.toLowerCase() === newValue.toLowerCase().trim()),
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
      // Delay closing to allow click events on dropdown items
      setTimeout(() => {
        setIsOpen(false);
        setSearch("");
      }, 200);
    };

    return (
      <div className="relative" ref={dropdownRef}>
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
            className={`w-full px-3 py-2 text-sm rounded-lg border focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all ${
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
                    : "Type faculty ID or name..."}
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
                <div className="text-xs text-gray-400">
                  Try a different search
                </div>
              </div>
            ) : (
              <div className="py-1 max-h-48 overflow-y-auto">
                {filteredOptions.map((option) => {
                  const isSelected = option.value === value;
                  const displayText =
                    option.value === "free"
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
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-2 h-2 rounded-full ${option.bgColor?.split(" ")[0] || "bg-indigo-100"}`}
                        ></div>
                        <div
                          className={`text-sm ${option.textColor || "text-gray-700"}`}
                        >
                          {displayText}
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
          </div>
        )}
      </div>
    );
  };

  /* =======================
   IN-PLACE SUBJECT SELECT COMPONENT (TYPABLE VERSION)
  ======================= */
  const InPlaceSubjectSelect = ({
    value,
    onChange,
    disabled,
    isFreePeriod,
  }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [filteredOptions, setFilteredOptions] = useState([]);
    const dropdownRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
      if (search.trim() === "") {
        setFilteredOptions(subjectOptions);
      } else {
        const searchLower = search.toLowerCase();
        const filtered = subjectOptions.filter((option) => {
          const valueStr = option.value || "";
          const labelStr = option.label || "";
          const nameStr = option.name || "";
          const slugStr = option.slug || "";
          return (
            valueStr.toLowerCase().includes(searchLower) ||
            labelStr.toLowerCase().includes(searchLower) ||
            nameStr.toLowerCase().includes(searchLower) ||
            slugStr.toLowerCase().includes(searchLower)
          );
        });
        setFilteredOptions(filtered);
      }
    }, [search, subjectOptions]);

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
        } else {
          // Try to find exact match
          const exactMatch = subjectOptions.find(
            (option) =>
              option.value.toLowerCase() === search.toLowerCase().trim() ||
              option.label.toLowerCase() === search.toLowerCase().trim() ||
              option.slug.toLowerCase() === search.toLowerCase().trim(),
          );
          if (exactMatch) {
            handleSelect(exactMatch);
          } else {
            setIsOpen(false);
            setSearch("");
          }
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
      setEditingSlot(null);
    };

    const currentOption = subjectOptions.find((opt) => opt.value === value) || {
      value: "",
      label: "Select Subject",
    };

    const displayValue = currentOption.label
      ? `${currentOption.label}`
      : "Select Subject";

    if (isFreePeriod) {
      return (
        <div className="px-3 py-2 text-sm text-gray-500 italic bg-gray-100 rounded-lg">
          Free Period
        </div>
      );
    }

    const handleInputChange = (e) => {
      const newValue = e.target.value;
      setSearch(newValue);

      // If user types a value that matches a subject exactly, select it
      if (newValue.trim() !== "") {
        const exactMatch = subjectOptions.find(
          (option) =>
            option.value.toLowerCase() === newValue.toLowerCase().trim() ||
            option.label.toLowerCase() === newValue.toLowerCase().trim() ||
            option.slug.toLowerCase() === newValue.toLowerCase().trim(),
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
      // Delay closing to allow click events on dropdown items
      setTimeout(() => {
        setIsOpen(false);
        setSearch("");
      }, 200);
    };

    return (
      <div className="relative" ref={dropdownRef}>
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={isOpen ? search : displayValue}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            placeholder="Type subject code or slug..."
            disabled={disabled || isFreePeriod}
            className={`w-full px-3 py-2 text-sm rounded-lg border focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all ${
              currentOption.color || "border-gray-300"
            } ${disabled || isFreePeriod ? "bg-gray-100 cursor-not-allowed" : "bg-white"}`}
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
            disabled={disabled || isFreePeriod}
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
                    : "Type subject code, name or slug..."}
                </span>
                <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                  {filteredOptions.length} found
                </span>
              </div>
            </div>

            {filteredOptions.length === 0 ? (
              <div className="p-4 text-center">
                <div className="text-gray-500 text-sm mb-2">
                  No matching subject found
                </div>
                <div className="text-xs text-gray-400">
                  Try a different search
                </div>
              </div>
            ) : (
              <div className="py-1 max-h-48 overflow-y-auto">
                {filteredOptions.map((option) => {
                  const isSelected = option.value === value;
                  const displayText = `${option.label} (${option.value})`;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      onClick={() => handleSelect(option)}
                      className={`w-full px-3 py-2 text-left hover:bg-teal-50 flex items-center justify-between border-b border-gray-50 last:border-b-0 ${
                        isSelected ? "bg-teal-50" : ""
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-2 h-2 rounded-full ${option.color?.split(" ")[2]?.replace("bg-", "bg-") || "bg-teal-100"}`}
                        ></div>
                        <div className="text-sm text-gray-700">
                          <div className="font-medium">{option.label}</div>
                          <div className="text-xs text-gray-500">
                            {option.value} - {option.name}
                          </div>
                        </div>
                      </div>
                      {isSelected && (
                        <Check className="w-4 h-4 text-teal-600 flex-shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  /* =======================
   IN-PLACE ROOM SELECT COMPONENT
  ======================= */
  const InPlaceRoomSelect = ({ value, onChange, disabled, isFreePeriod }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [filteredOptions, setFilteredOptions] = useState([]);
    const dropdownRef = useRef(null);

    useEffect(() => {
      if (search.trim() === "") {
        setFilteredOptions(roomOptions);
      } else {
        const searchLower = search.toLowerCase();
        const filtered = roomOptions.filter((option) => {
          return option.toLowerCase().includes(searchLower);
        });
        setFilteredOptions(filtered);
      }
    }, [search, roomOptions]);

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
        }
      } else if (e.key === "Escape") {
        setIsOpen(false);
        setSearch("");
      }
    };

    const handleSelect = (option) => {
      onChange(option);
      setSearch("");
      setIsOpen(false);
      setEditingSlot(null);
    };

    if (isFreePeriod) {
      return (
        <div className="px-3 py-2 text-sm text-gray-500 italic bg-gray-100 rounded-lg">
          -
        </div>
      );
    }

    return (
      <div className="relative" ref={dropdownRef}>
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            disabled={disabled || isFreePeriod}
            className={`w-full px-3 py-2 text-left text-sm rounded-lg border border-amber-200 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all ${
              disabled
                ? "bg-gray-100 cursor-not-allowed"
                : "bg-white hover:bg-amber-50"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="truncate">{value || "Select Room"}</span>
              <ChevronDown
                className={`w-4 h-4 text-gray-500 transition-transform ${
                  isOpen ? "rotate-180" : ""
                }`}
              />
            </div>
          </button>
        </div>

        {isOpen && !disabled && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 p-2">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Search className="w-3 h-3" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search room..."
                  className="flex-1 outline-none bg-transparent text-xs"
                  autoFocus
                />
                <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                  {filteredOptions.length}
                </span>
              </div>
            </div>

            {filteredOptions.length === 0 ? (
              <div className="p-4 text-center">
                <div className="text-gray-500 text-sm mb-2">
                  No matching room found
                </div>
                <div className="text-xs text-gray-400">
                  Try a different search
                </div>
              </div>
            ) : (
              <div className="py-1 max-h-48 overflow-y-auto">
                {filteredOptions.map((option) => {
                  const isSelected = option === value;

                  return (
                    <button
                      key={option}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      onClick={() => handleSelect(option)}
                      className={`w-full px-3 py-2 text-left hover:bg-amber-50 flex items-center justify-between border-b border-gray-50 last:border-b-0 ${
                        isSelected ? "bg-amber-50" : ""
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <DoorOpen className="w-4 h-4 text-amber-600" />
                        <div className="text-sm text-amber-700">{option}</div>
                      </div>
                      {isSelected && (
                        <Check className="w-4 h-4 text-amber-600 flex-shrink-0" />
                      )}
                    </button>
                  );
                })}
                <div className="border-t border-gray-100 p-2">
                  <button
                    onClick={async () => {
                      const newRoom = prompt("Enter new room number/name:");
                      if (newRoom && newRoom.trim()) {
                        const success = await createNewRoom(newRoom.trim());
                        if (success) {
                          handleSelect(newRoom.trim());
                        }
                      }
                    }}
                    className="w-full px-3 py-2 text-left text-sm text-amber-600 hover:bg-amber-100 rounded flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add New Room
                  </button>
                </div>
              </div>
            )}
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

  /* =======================
   GET SUBJECT STYLE
  ======================= */
  const getSubjectStyle = (subjectCode) => {
    const subject = subjectOptions.find((s) => s.value === subjectCode);
    return (
      subject || {
        color: "border-gray-200 bg-gray-50 text-gray-700",
        bgColor: "bg-gray-50",
        textColor: "text-gray-700",
      }
    );
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
   HANDLE SLOT CHANGE
  ======================= */
  const handleSlotChange = (division, day, timeSlot, field, value) => {
    setSchedule((prev) => {
      const newSchedule = { ...prev };
      if (!newSchedule[division]) newSchedule[division] = {};
      if (!newSchedule[division][day]) newSchedule[division][day] = {};
      if (!newSchedule[division][day][timeSlot]) {
        newSchedule[division][day][timeSlot] = {
          faculty: "free",
          subject: "",
          room: "",
        };
      }

      newSchedule[division][day][timeSlot] = {
        ...newSchedule[division][day][timeSlot],
        [field]: value,
        ...(field === "faculty" && value === "free"
          ? { subject: "", room: "" }
          : {}),
      };

      return newSchedule;
    });

    setSaved(false);
    setErrorMsg("");
  };

  /* =======================
   RENDER SLOT CONTENT
  ======================= */
  const renderSlotContent = (division, day, timeSlot) => {
    const slotData = schedule[division]?.[day]?.[timeSlot] || {
      faculty: "free",
      subject: "",
      room: "",
    };

    const isFreePeriod = slotData.faculty === "free";
    const facultyStyle = getFacultyStyle(slotData.faculty);
    const facultyOption = facultyOptions.find(
      (f) => f.value === slotData.faculty,
    );
    const subjectDisplayName = getSubjectDisplayName(slotData.subject);
    const subjectStyle = getSubjectStyle(slotData.subject);

    return (
      <div className="space-y-2">
        {/* Faculty Selector */}
        <div>
          <InPlaceFacultySelect
            value={slotData.faculty}
            onChange={(value) =>
              handleSlotChange(division, day, timeSlot, "faculty", value)
            }
            division={division}
            day={day}
            timeSlot={timeSlot}
            disabled={false}
          />
        </div>

        {/* Subject Selector */}
        <div>
          <InPlaceSubjectSelect
            value={slotData.subject}
            onChange={(value) =>
              handleSlotChange(division, day, timeSlot, "subject", value)
            }
            disabled={isFreePeriod}
            isFreePeriod={isFreePeriod}
          />
        </div>

        {/* Room Selector */}
        <div>
          <InPlaceRoomSelect
            value={slotData.room}
            onChange={(value) =>
              handleSlotChange(division, day, timeSlot, "room", value)
            }
            disabled={isFreePeriod}
            isFreePeriod={isFreePeriod}
          />
        </div>

        {/* Preview */}
        {!isFreePeriod && (
          <div className="pt-2 border-t border-gray-100">
            <div className="text-xs text-gray-500 space-y-1">
              {facultyOption?.name && (
                <div className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  <span className="truncate">{facultyOption.name}</span>
                </div>
              )}
              {slotData.subject && (
                <div className="flex items-center gap-1">
                  <BookMarked className="w-3 h-3" />
                  <span className="truncate">{subjectDisplayName}</span>
                </div>
              )}
              {slotData.room && (
                <div className="flex items-center gap-1">
                  <DoorOpen className="w-3 h-3" />
                  <span className="truncate">{slotData.room}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
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
      (id) => id.trim() && !/^-?\d+$/.test(id.trim()),
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
          response.data.error || "Failed to update Telegram Chat IDs",
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
   FETCH ALL FACULTIES FROM DATABASE
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
   FETCH ALL SUBJECTS FOR MODAL
  ======================= */
  const fetchAllSubjectsForModal = async () => {
    setIsLoadingAllSubjects(true);
    try {
      const response = await api.get("/api/subjects", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        const subjects = response.data.subjects || [];

        const formattedSubjects = subjects.map((subject, index) => {
          const subjectCode = subject.subject_code || subject.id;
          const subjectName = subject.name || "Unknown Subject";
          const subjectSlug = subject.slug || subjectCode;

          return {
            id: subjectCode,
            code: subjectCode,
            name: subjectName,
            slug: subjectSlug,
            displayLabel: `${subjectSlug} (${subjectCode})`,
            colorIndex: index % subjectColors.length,
          };
        });

        setAllAvailableSubjects(formattedSubjects);
        return formattedSubjects;
      } else {
        throw new Error("Failed to fetch subjects");
      }
    } catch (error) {
      console.error("Error fetching all subjects:", error);
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Something went wrong";
      showAlert("Failed to fetch subjects", message, "error");

      const sampleSubjects = [
        {
          id: "3160001",
          code: "3160001",
          name: "Mathematics I",
          slug: "MATH-I",
          displayLabel: "MATH-I (3160001)",
          colorIndex: 0,
        },
        {
          id: "3160002",
          code: "3160002",
          name: "Physics",
          slug: "PHY",
          displayLabel: "PHY (3160002)",
          colorIndex: 1,
        },
        {
          id: "3160003",
          code: "3160003",
          name: "Chemistry",
          slug: "CHEM",
          displayLabel: "CHEM (3160003)",
          colorIndex: 2,
        },
        {
          id: "3160004",
          code: "3160004",
          name: "Programming Fundamentals",
          slug: "PROG",
          displayLabel: "PROG (3160004)",
          colorIndex: 3,
        },
        {
          id: "3160005",
          code: "3160005",
          name: "Digital Electronics",
          slug: "DE",
          displayLabel: "DE (3160005)",
          colorIndex: 4,
        },
        {
          id: "3160006",
          code: "3160006",
          name: "Engineering Mechanics",
          slug: "EM",
          displayLabel: "EM (3160006)",
          colorIndex: 5,
        },
      ];
      setAllAvailableSubjects(sampleSubjects);
      return sampleSubjects;
    } finally {
      setIsLoadingAllSubjects(false);
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
        faculty.id.toLowerCase() === newFacultyId.trim().toLowerCase(),
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
        },
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

        // Add to faculty options
        const color =
          facultyColors[allAvailableFaculties.length % facultyColors.length];
        const parts = color.split(" ");

        const newFacultyOption = {
          value: newFacultyId.trim(),
          label: `${newFacultyName.trim()} (${newFacultyId.trim()})`,
          name: newFacultyName.trim(),
          color: color,
          bgColor: parts[2] + " " + (parts[3] || ""),
          textColor: parts[4] || parts[3],
        };

        setFacultyOptions((prev) => [...prev, newFacultyOption]);

        setSelectedFacultiesToAdd((prev) => [...prev, newFaculty]);

        setNewFacultyId("");
        setNewFacultyName("");

        setCreateFacultyError("");
        showAlert(
          "Faculty created successfully",
          `"${newFacultyName}" has been created and added to dropdowns`,
          "success",
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
        "error",
      );
    } finally {
      setIsCreatingFaculty(false);
    }
  };

  /* =======================
      CREATE NEW SUBJECT
  ======================= */
  const handleCreateNewSubject = async () => {
    if (!newSubjectCode.trim()) {
      setCreateSubjectError("Subject Code is required");
      return;
    }

    if (!newSubjectName.trim()) {
      setCreateSubjectError("Subject Name is required");
      return;
    }

    if (!newSubjectSlug.trim()) {
      setCreateSubjectError("Subject Slug is required");
      return;
    }

    if (!/^\d+$/.test(newSubjectCode.trim())) {
      setCreateSubjectError("Subject Code must be numeric");
      return;
    }

    const subjectExists = allAvailableSubjects.some(
      (subject) =>
        subject.code.toLowerCase() === newSubjectCode.trim().toLowerCase() ||
        subject.id.toLowerCase() === newSubjectCode.trim().toLowerCase(),
    );

    if (subjectExists) {
      setCreateSubjectError("A subject with this code already exists");
      return;
    }

    setIsCreatingSubject(true);
    setCreateSubjectError("");

    try {
      const response = await api.post(
        "/api/subjects",
        {
          id: newSubjectCode.trim(),
          name: newSubjectName.trim(),
          slug: newSubjectSlug.trim().toUpperCase(),
          credit: 3,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.data.success) {
        const newSubject = {
          id: newSubjectCode.trim(),
          code: newSubjectCode.trim(),
          name: newSubjectName.trim(),
          slug: newSubjectSlug.trim().toUpperCase(),
          displayLabel: `${newSubjectSlug.trim().toUpperCase()} (${newSubjectCode.trim()})`,
          colorIndex: allAvailableSubjects.length % subjectColors.length,
        };

        const updatedSubjects = [...allAvailableSubjects, newSubject];
        setAllAvailableSubjects(updatedSubjects);

        const newSubjectOption = {
          value: newSubjectCode.trim(),
          label: newSubjectSlug.trim().toUpperCase(),
          name: newSubjectName.trim(),
          slug: newSubjectSlug.trim().toUpperCase(),
          color:
            subjectColors[allAvailableSubjects.length % subjectColors.length],
        };

        setSubjectOptions((prev) => [...prev, newSubjectOption]);

        setSubjectMap((prev) => ({
          ...prev,
          [newSubjectCode.trim()]: {
            name: newSubjectName.trim(),
            slug: newSubjectSlug.trim().toUpperCase(),
            color:
              subjectColors[allAvailableSubjects.length % subjectColors.length],
          },
        }));

        setSelectedSubjectsToAdd((prev) => [...prev, newSubject]);

        setNewSubjectCode("");
        setNewSubjectName("");
        setNewSubjectSlug("");

        setCreateSubjectError("");
        showAlert(
          "Subject created successfully",
          `"${newSubjectSlug}" has been created and added to dropdowns`,
          "success",
        );
      } else {
        throw new Error(response.data.message || "Failed to create subject");
      }
    } catch (error) {
      console.error("Error creating subject:", error);
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Something went wrong";
      showAlert(
        "Failed to create subject",
        message || "Please try again",
        "error",
      );
    } finally {
      setIsCreatingSubject(false);
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

    setLoadingDivisions((prev) => ({ ...prev, [division]: true }));

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
            // Get subject slug from subjectMap if available
            let subjectDisplay =
              slotData.subject || slotData.subject_code || "";

            // If we have a subject code, try to get its slug
            if (subjectDisplay && subjectMap[subjectDisplay]) {
              subjectDisplay = subjectMap[subjectDisplay].slug;
            }

            formattedSchedule[day][slot.value] = {
              faculty: slotData.faculty_id || slotData.faculty || "free",
              subject: slotData.subject || slotData.subject_code || "", // Store subject code
              room: slotData.room || "",
              faculty_id: slotData.faculty_id || slotData.faculty || "",
            };
          } else {
            formattedSchedule[day][slot.value] = {
              faculty: "free",
              subject: "",
              room: "",
              faculty_id: "",
            };
          }
        });
      });

      setSchedule((prev) => ({
        ...prev,
        [division]: formattedSchedule,
      }));

      setExistingTimetables((prev) => ({
        ...prev,
        [division]: true,
      }));

      await fetchAllowedFacultyForClasses([division]);
      await fetchAllowedSubjectsForClasses([division]); // Fetch subjects for this division

      return formattedSchedule;
    } catch (error) {
      console.warn(`No timetable found for ${division}:`, error);

      const emptySchedule = days.reduce((dayAcc, day) => {
        dayAcc[day] = timeSlots.reduce((slotAcc, slot) => {
          slotAcc[slot.value] = {
            faculty: "free",
            subject: "",
            room: "",
          };
          return slotAcc;
        }, {});
        return dayAcc;
      }, {});

      setSchedule((prev) => ({
        ...prev,
        [division]: emptySchedule,
      }));

      setExistingTimetables((prev) => ({
        ...prev,
        [division]: false,
      }));

      return null;
    } finally {
      setLoadingDivisions((prev) => ({ ...prev, [division]: false }));
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

      const allFaculty = new Set();
      Object.values(facultyMap).forEach((facultyList) => {
        facultyList.forEach((faculty) => allFaculty.add(faculty));
      });

      const uniqueFaculty = Array.from(allFaculty);

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
            facultyId: facultyId,
          };
        } catch (error) {
          return {
            id: facultyId,
            name: "",
            facultyId: facultyId,
          };
        }
      });

      const facultyDetails = await Promise.all(facultyDetailsPromises);

      const newFacultyOptions = [
        ...baseFacultyOptions,
        ...facultyDetails.map((faculty, index) => {
          return {
            value: faculty.facultyId,
            label: faculty.name
              ? `${faculty.facultyId} (${faculty.name})`
              : faculty.facultyId,
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
      setClassFacultyMap((prev) => ({ ...prev, ...facultyMap }));

      return facultyMap;
    } catch (error) {
      console.error("Error fetching allowed faculty:", error);
      return {};
    }
  };

  /* =======================
   FETCH ALLOWED SUBJECTS FOR CLASSES (Updated to match faculty behavior)
  ======================= */
  const fetchAllowedSubjectsForClasses = async (classes) => {
    if (!classes || classes.length === 0) return {};

    try {
      const subjectMap = {};
      const allSubjectsSet = new Set();

      // First, fetch all subjects from database
      const allSubjectsResponse = await api.get("/api/subjects", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const allSubjects = allSubjectsResponse.data.subjects || [];

      // Add all subjects to the set
      allSubjects.forEach((subject) => {
        const subjectCode = subject.subject_code || subject.id;
        allSubjectsSet.add(subjectCode);
      });

      // Then fetch class-specific subjects
      const fetchPromises = classes.map(async (className) => {
        try {
          const response = await api.get("/api/timetable/classwise-subjects", {
            headers: { Authorization: `Bearer ${token}` },
            params: { sem, branch, class: className },
          });

          const classSubjects = response.data.allowed_subjects || [];

          // Add class-specific subjects to the set
          classSubjects.forEach((subjectCode) => {
            allSubjectsSet.add(subjectCode);
          });

          return {
            class: className,
            subjects: classSubjects,
            success: true,
          };
        } catch (error) {
          console.warn(`No subject data found for class ${className}:`, error);
          return {
            class: className,
            subjects: [],
            success: false,
          };
        }
      });

      await Promise.all(fetchPromises);

      // Build comprehensive subject options
      const allSubjectsArray = Array.from(allSubjectsSet);
      const newSubjectOptions = [];
      const newSubjectMap = {};

      allSubjectsArray.forEach((subjectCode, index) => {
        // Find subject details from allSubjects
        const subjectDetails =
          allSubjects.find((s) => (s.subject_code || s.id) === subjectCode) ||
          {};

        const color = subjectColors[index % subjectColors.length];
        const colorParts = color.split(" ");

        const subjectOption = {
          value: subjectCode,
          label: subjectDetails.slug || subjectCode, // Slug for display
          name: subjectDetails.name || subjectCode, // Full name
          slug: subjectDetails.slug || subjectCode,
          color: color,
          bgColor: colorParts[2] + " " + (colorParts[3] || ""),
          textColor: colorParts[4] || colorParts[3],
        };

        newSubjectOptions.push(subjectOption);

        newSubjectMap[subjectCode] = {
          name: subjectDetails.name || subjectCode,
          slug: subjectDetails.slug || subjectCode,
          color: color,
        };
      });

      // Update state with all subjects
      setSubjectOptions(newSubjectOptions);
      setSubjectMap(newSubjectMap);

      return subjectMap;
    } catch (error) {
      console.error("Error fetching allowed subjects:", error);
      showAlert(
        "Error loading subjects",
        "Could not fetch subject data",
        "warning",
      );
      return {};
    }
  };

  /* =======================
   HANDLE DIVISION SELECTION
  ======================= */
  const handleDivisionToggle = async (division) => {
    const isSelected = selectedDivisions.includes(division);

    if (isSelected) {
      setSelectedDivisions((prev) => prev.filter((d) => d !== division));

      setSchedule((prev) => {
        const newSchedule = { ...prev };
        delete newSchedule[division];
        return newSchedule;
      });

      setExistingTimetables((prev) => {
        const newExisting = { ...prev };
        delete newExisting[division];
        return newExisting;
      });

      // Remove from classSubjectMap as well
      setClassSubjectMap((prev) => {
        const newMap = { ...prev };
        delete newMap[division];
        return newMap;
      });
    } else {
      setSelectedDivisions((prev) => [...prev, division]);
      await fetchTimetableForDivision(division);
      setSaved(false);
    }
  };

  /* =======================
   ADD FACULTIES TO LEGEND AND DROPDOWNS
  ======================= */
  const handleAddFaculties = () => {
    if (selectedFacultiesToAdd.length === 0) return;

    const updatedFacultyOptions = [...facultyOptions];

    selectedFacultiesToAdd.forEach((faculty, idx) => {
      const exists = updatedFacultyOptions.some(
        (f) => f.value === faculty.facultyId || f.value === faculty.id,
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
      "success",
    );
  };

  /* =======================
   ADD SUBJECTS TO LEGEND AND DROPDOWNS
  ======================= */
  const handleAddSubjects = () => {
    if (selectedSubjectsToAdd.length === 0) return;

    const updatedSubjectOptions = [...subjectOptions];
    const updatedSubjectMap = { ...subjectMap };

    selectedSubjectsToAdd.forEach((subject, idx) => {
      const exists = updatedSubjectOptions.some(
        (s) => s.value === subject.code || s.value === subject.id,
      );

      if (!exists) {
        const color = subjectColors[idx % subjectColors.length];

        const newSubjectOption = {
          value: subject.code || subject.id,
          label: subject.slug,
          name: subject.name,
          slug: subject.slug,
          color: color,
        };

        updatedSubjectOptions.push(newSubjectOption);

        updatedSubjectMap[subject.code || subject.id] = {
          name: subject.name,
          slug: subject.slug,
          color: color,
        };
      }
    });

    setSubjectOptions(updatedSubjectOptions);
    setSubjectMap(updatedSubjectMap);

    // Add to classSubjectMap for selected divisions (similar to faculty behavior)
    setClassSubjectMap((prev) => {
      const updated = { ...prev };

      selectedDivisions.forEach((division) => {
        const existing = updated[division] || [];

        selectedSubjectsToAdd.forEach((subject) => {
          const subjectCode = subject.code || subject.id;
          if (subjectCode && !existing.includes(subjectCode)) {
            existing.push(subjectCode);
          }
        });

        updated[division] = [...existing];
      });

      return updated;
    });

    setSelectedSubjectsToAdd([]);
    setShowSubjectModal(false);
    setSubjectSearchQuery("");
    setShowCreateSubject(false);
    setNewSubjectCode("");
    setNewSubjectName("");
    setNewSubjectSlug("");
    setCreateSubjectError("");

    showAlert(
      "Subjects added successfully",
      `${selectedSubjectsToAdd.length} subject(s) added to dropdowns`,
      "success",
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
   RESET NEW SUBJECT FORM
  ======================= */
  const resetNewSubjectForm = () => {
    setNewSubjectCode("");
    setNewSubjectName("");
    setNewSubjectSlug("");
    setCreateSubjectError("");
    setShowCreateSubject(false);
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
   TOGGLE SUBJECT SELECTION
  ======================= */
  const toggleSubjectSelection = (subject) => {
    setSelectedSubjectsToAdd((prev) => {
      const isSelected = prev.some((s) => s.id === subject.id);
      if (isSelected) {
        return prev.filter((s) => s.id !== subject.id);
      } else {
        return [...prev, subject];
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
        "error",
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
          ", ",
        )} ${
          emptyClasses.length > 1 ? "have" : "has"
        } no tutor assigned. Please assign at least one tutor or delete/deselect the study group${
          emptyClasses.length > 1 ? "s" : ""
        }.`,
        "error",
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
                response.data.error,
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
        setExistingTimetables((prev) => ({
          ...prev,
          [division]: true,
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
        "success",
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
          "error",
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
                  // Get subject slug from subjectMap if available
                  let subjectDisplay =
                    slotData.subject || slotData.subject_code || "";

                  // If we have a subject code, try to get its slug
                  if (subjectDisplay && subjectMap[subjectDisplay]) {
                    subjectDisplay = subjectMap[subjectDisplay].slug;
                  }

                  formattedSchedule[day][slot.value] = {
                    faculty: slotData.faculty_id || slotData.faculty || "free",
                    subject: slotData.subject || slotData.subject_code || "", // Store subject code
                    room: slotData.room || "",
                    faculty_id: slotData.faculty_id || slotData.faculty || "",
                  };
                } else {
                  formattedSchedule[day][slot.value] = {
                    faculty: "free",
                    subject: "",
                    room: "",
                    faculty_id: "",
                  };
                }
              });
            });

            setSchedule((prev) => ({
              ...prev,
              [division]: formattedSchedule,
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
          "success",
        );
      }

      if (existingDivisions.length > 0) {
        await fetchAllowedFacultyForClasses(existingDivisions);
        await fetchAllowedSubjectsForClasses(existingDivisions); // Fetch subjects for existing divisions
      }
    } catch (error) {
      console.error("Error checking existing timetables:", error);
    } finally {
      setFetching(false);
    }
  };

  /* =======================
   FETCH ALL FACULTIES ON MODAL OPEN
  ======================= */
  useEffect(() => {
    if (showFacultyModal) {
      fetchAllFaculties();
    }
  }, [showFacultyModal]);

  /* =======================
   FETCH ALL SUBJECTS ON MODAL OPEN
  ======================= */
  useEffect(() => {
    if (showSubjectModal) {
      fetchAllSubjectsForModal();
    }
  }, [showSubjectModal]);

  /* =======================
   INITIAL LOAD
  ======================= */
  useEffect(() => {
    if (isInitialLoad && location.state?.branch && location.state?.sem) {
      fetchAllSubjects();
      fetchAllRooms(); // Fetch rooms from backend
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
   GET SUBJECTS FOR LEGEND - Show all subjects like faculty
  ======================= */
  const getSubjectsForLegend = () => {
    // Return all subject options, not just filtered ones
    return subjectOptions;
  };

  /* =======================
   FACULTY MANAGEMENT MODAL (UPDATED - Fixed form input focus issue)
  ======================= */
  const FacultyManagementModal = () => {
    const [search, setSearch] = useState(searchQuery);
    const [filteredFaculties, setFilteredFaculties] = useState(
      allAvailableFaculties,
    );
    const [localNewFacultyId, setLocalNewFacultyId] = useState(newFacultyId);
    const [localNewFacultyName, setLocalNewFacultyName] =
      useState(newFacultyName);
    const searchInputRef = useRef(null);
    const facultyIdInputRef = useRef(null);
    const facultyNameInputRef = useRef(null);

    // Filter faculties based on search
    useEffect(() => {
      if (search.trim() === "") {
        setFilteredFaculties(allAvailableFaculties);
      } else {
        const searchLower = search.toLowerCase();
        const filtered = allAvailableFaculties.filter(
          (faculty) =>
            faculty.displayLabel.toLowerCase().includes(searchLower) ||
            (faculty.facultyId &&
              faculty.facultyId.toLowerCase().includes(searchLower)) ||
            faculty.name.toLowerCase().includes(searchLower),
        );
        setFilteredFaculties(filtered);
      }
    }, [search, allAvailableFaculties]);

    // Focus search input ONLY when modal opens and NOT in create mode
    useEffect(() => {
      if (showFacultyModal && !showCreateFaculty) {
        setTimeout(() => {
          searchInputRef.current?.focus();
        }, 100);
      }
    }, [showFacultyModal, showCreateFaculty]);

    // Focus first input when in create mode
    useEffect(() => {
      if (showCreateFaculty) {
        setTimeout(() => {
          facultyIdInputRef.current?.focus();
        }, 100);
      }
    }, [showCreateFaculty]);

    // Handle create faculty with local state
    const handleLocalCreateNewFaculty = async () => {
      if (!localNewFacultyId.trim()) {
        setCreateFacultyError("Faculty ID is required");
        return;
      }

      if (!localNewFacultyName.trim()) {
        setCreateFacultyError("Faculty Name is required");
        return;
      }

      // Update parent state with local values
      setNewFacultyId(localNewFacultyId);
      setNewFacultyName(localNewFacultyName);

      // Then call the original create function
      await handleCreateNewFaculty();
    };

    // Reset local form
    const resetLocalNewFacultyForm = () => {
      setLocalNewFacultyId("");
      setLocalNewFacultyName("");
      setCreateFacultyError("");
      setShowCreateFaculty(false);
    };

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
                className="p-2 hover:bg-white/50 rounded-lg transition-colors border border-indigo-200"
              >
                <X className="w-5 h-5 text-indigo-600" />
              </button>
            </div>

            <div className="mt-4 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-indigo-400" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search tutors by name or ID..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                }}
                onBlur={() => {
                  // Only update parent state when input loses focus
                  setSearchQuery(search);
                }}
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
                  <h3 className="font-bold text-gray-900">Create New Tutor</h3>
                </div>
                <button
                  onClick={resetLocalNewFacultyForm}
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
                    ref={facultyIdInputRef}
                    type="text"
                    value={localNewFacultyId}
                    onChange={(e) => setLocalNewFacultyId(e.target.value)}
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
                    ref={facultyNameInputRef}
                    type="text"
                    value={localNewFacultyName}
                    onChange={(e) => setLocalNewFacultyName(e.target.value)}
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
                  onClick={resetLocalNewFacultyForm}
                  className="px-4 py-2.5 border border-indigo-300 text-indigo-700 rounded-lg font-medium hover:bg-indigo-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLocalCreateNewFaculty}
                  disabled={
                    isCreatingFaculty ||
                    !localNewFacultyId.trim() ||
                    !localNewFacultyName.trim()
                  }
                  className={`px-4 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                    isCreatingFaculty ||
                    !localNewFacultyId.trim() ||
                    !localNewFacultyName.trim()
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
                onClick={() => {
                  setShowCreateFaculty(true);
                  // Reset local form when entering create mode
                  setLocalNewFacultyId("");
                  setLocalNewFacultyName("");
                }}
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
                {search && (
                  <p className="text-gray-500 text-sm mt-1">
                    Try a different search term
                  </p>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredFaculties.map((faculty) => {
                  const isSelected = selectedFacultiesToAdd.some(
                    (f) => f.id === faculty.id,
                  );
                  const isAlreadyInOptions = facultyOptions.some(
                    (option) =>
                      option.value === faculty.facultyId ||
                      option.value === faculty.id,
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
   SUBJECT MANAGEMENT MODAL (UPDATED - Fixed form input focus issue)
  ======================= */
  const SubjectManagementModal = () => {
    const [search, setSearch] = useState(subjectSearchQuery);
    const [filteredSubjects, setFilteredSubjects] =
      useState(allAvailableSubjects);
    const [localNewSubjectCode, setLocalNewSubjectCode] =
      useState(newSubjectCode);
    const [localNewSubjectName, setLocalNewSubjectName] =
      useState(newSubjectName);
    const [localNewSubjectSlug, setLocalNewSubjectSlug] =
      useState(newSubjectSlug);
    const searchInputRef = useRef(null);
    const subjectCodeInputRef = useRef(null);
    const subjectNameInputRef = useRef(null);
    const subjectSlugInputRef = useRef(null);

    // Filter subjects based on search
    useEffect(() => {
      if (search.trim() === "") {
        setFilteredSubjects(allAvailableSubjects);
      } else {
        const searchLower = search.toLowerCase();
        const filtered = allAvailableSubjects.filter(
          (subject) =>
            subject.displayLabel.toLowerCase().includes(searchLower) ||
            (subject.code &&
              subject.code.toLowerCase().includes(searchLower)) ||
            subject.name.toLowerCase().includes(searchLower) ||
            subject.slug.toLowerCase().includes(searchLower),
        );
        setFilteredSubjects(filtered);
      }
    }, [search, allAvailableSubjects]);

    // Focus search input ONLY when modal opens and NOT in create mode
    useEffect(() => {
      if (showSubjectModal && !showCreateSubject) {
        setTimeout(() => {
          searchInputRef.current?.focus();
        }, 100);
      }
    }, [showSubjectModal, showCreateSubject]);

    // Focus first input when in create mode
    useEffect(() => {
      if (showCreateSubject) {
        setTimeout(() => {
          subjectCodeInputRef.current?.focus();
        }, 100);
      }
    }, [showCreateSubject]);

    // Handle create subject with local state
    const handleLocalCreateNewSubject = async () => {
      if (!localNewSubjectCode.trim()) {
        setCreateSubjectError("Subject Code is required");
        return;
      }

      if (!localNewSubjectName.trim()) {
        setCreateSubjectError("Subject Name is required");
        return;
      }

      if (!localNewSubjectSlug.trim()) {
        setCreateSubjectError("Subject Slug is required");
        return;
      }

      // Update parent state with local values
      setNewSubjectCode(localNewSubjectCode);
      setNewSubjectName(localNewSubjectName);
      setNewSubjectSlug(localNewSubjectSlug);

      // Then call the original create function
      await handleCreateNewSubject();
    };

    // Reset local form
    const resetLocalNewSubjectForm = () => {
      setLocalNewSubjectCode("");
      setLocalNewSubjectName("");
      setLocalNewSubjectSlug("");
      setCreateSubjectError("");
      setShowCreateSubject(false);
    };

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[80vh] overflow-hidden flex flex-col border border-teal-200">
          <div className="p-6 border-b border-teal-100 bg-gradient-to-r from-teal-50 to-teal-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg border border-teal-200">
                  <Book className="w-5 h-5 text-teal-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-teal-900">
                    Add Subjects
                  </h2>
                  <p className="text-teal-700 text-sm mt-1">
                    Select subjects to add to your schedule dropdowns or create
                    new subject
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowSubjectModal(false);
                  setSelectedSubjectsToAdd([]);
                  setSubjectSearchQuery("");
                  resetNewSubjectForm();
                }}
                className="p-2 hover:bg-white/50 rounded-lg transition-colors border border-teal-200"
              >
                <X className="w-5 h-5 text-teal-600" />
              </button>
            </div>

            <div className="mt-4 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-teal-400" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search subjects by code, name or slug..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                }}
                onBlur={() => {
                  // Only update parent state when input loses focus
                  setSubjectSearchQuery(search);
                }}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-teal-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              />
            </div>

            <div className="mt-3 flex items-center justify-between">
              <span className="text-sm text-teal-700">
                {selectedSubjectsToAdd.length} subject(s) selected
              </span>
              <span className="text-sm text-teal-700">
                {filteredSubjects.length} available
              </span>
            </div>
          </div>

          {showCreateSubject ? (
            <div className="p-6 border-b border-teal-100 bg-blue-50">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg border border-blue-200">
                    <BookPlus className="w-5 h-5 text-blue-600" />
                  </div>
                  <h3 className="font-bold text-gray-900">
                    Create New Subject
                  </h3>
                </div>
                <button
                  onClick={resetLocalNewSubjectForm}
                  className="p-1 hover:bg-blue-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              {createSubjectError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-700 text-sm">{createSubjectError}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Hash className="w-4 h-4" />
                    Subject Code
                  </label>
                  <input
                    ref={subjectCodeInputRef}
                    type="text"
                    value={localNewSubjectCode}
                    onChange={(e) => setLocalNewSubjectCode(e.target.value)}
                    placeholder="e.g., 3160001"
                    className="w-full px-4 py-2.5 bg-white border border-teal-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Numeric subject code
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Book className="w-4 h-4" />
                    Subject Name
                  </label>
                  <input
                    ref={subjectNameInputRef}
                    type="text"
                    value={localNewSubjectName}
                    onChange={(e) => setLocalNewSubjectName(e.target.value)}
                    placeholder="e.g., Mathematics I"
                    className="w-full px-4 py-2.5 bg-white border border-teal-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Full name of the subject
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Bookmark className="w-4 h-4" />
                    Subject Slug
                  </label>
                  <input
                    ref={subjectSlugInputRef}
                    type="text"
                    value={localNewSubjectSlug}
                    onChange={(e) =>
                      setLocalNewSubjectSlug(e.target.value.toUpperCase())
                    }
                    placeholder="e.g., MATH-I"
                    className="w-full px-4 py-2.5 bg-white border border-teal-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Short code (displayed in UI)
                  </p>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={resetLocalNewSubjectForm}
                  className="px-4 py-2.5 border border-teal-300 text-teal-700 rounded-lg font-medium hover:bg-teal-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLocalCreateNewSubject}
                  disabled={
                    isCreatingSubject ||
                    !localNewSubjectCode.trim() ||
                    !localNewSubjectName.trim() ||
                    !localNewSubjectSlug.trim()
                  }
                  className={`px-4 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                    isCreatingSubject ||
                    !localNewSubjectCode.trim() ||
                    !localNewSubjectName.trim() ||
                    !localNewSubjectSlug.trim()
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-gradient-to-r from-teal-600 to-teal-700 text-white hover:from-teal-700 hover:to-teal-800"
                  }`}
                >
                  {isCreatingSubject ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Create Subject
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="p-4 border-b border-teal-100">
              <button
                onClick={() => {
                  setShowCreateSubject(true);
                  // Reset local form when entering create mode
                  setLocalNewSubjectCode("");
                  setLocalNewSubjectName("");
                  setLocalNewSubjectSlug("");
                }}
                className="w-full px-4 py-3 border-2 border-dashed border-teal-300 rounded-xl text-teal-600 hover:border-teal-500 hover:text-teal-700 hover:bg-teal-50 transition-all flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Create New Subject
              </button>
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-6">
            {isLoadingAllSubjects ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-teal-600 mb-4" />
                <p className="text-gray-600">Loading all subjects...</p>
              </div>
            ) : filteredSubjects.length === 0 ? (
              <div className="text-center py-12">
                <Book className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No subjects found</p>
                {search && (
                  <p className="text-gray-500 text-sm mt-1">
                    Try a different search term
                  </p>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredSubjects.map((subject) => {
                  const isSelected = selectedSubjectsToAdd.some(
                    (s) => s.id === subject.id,
                  );
                  const isAlreadyInOptions = subjectOptions.some(
                    (option) =>
                      option.value === subject.code ||
                      option.value === subject.id,
                  );

                  return (
                    <div
                      key={subject.id}
                      onClick={() =>
                        !isAlreadyInOptions && toggleSubjectSelection(subject)
                      }
                      className={`p-4 rounded-xl border cursor-pointer transition-all ${
                        isAlreadyInOptions
                          ? "border-gray-200 bg-gray-50 opacity-75 cursor-not-allowed"
                          : isSelected
                            ? "border-teal-500 bg-teal-50"
                            : "border-teal-200 hover:border-teal-300 hover:bg-teal-50"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mt-0.5 flex-shrink-0 ${
                            isAlreadyInOptions
                              ? "border-gray-300 bg-gray-200"
                              : isSelected
                                ? "border-teal-500 bg-teal-500"
                                : "border-teal-300"
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
                                {subject.slug}
                              </h3>
                              <p className="text-sm text-gray-600 mt-1">
                                Code: {subject.code}
                              </p>
                              <p className="text-xs text-gray-500 mt-1 truncate">
                                {subject.name}
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
                              This subject is already available in dropdowns
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

          <div className="p-6 border-t border-teal-100 bg-teal-50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">
                  Selected: {selectedSubjectsToAdd.length} subject(s)
                </p>
                {selectedSubjectsToAdd.length > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    Selected subject(s) will be added to all dropdowns
                  </p>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowSubjectModal(false);
                    setSelectedSubjectsToAdd([]);
                    setSubjectSearchQuery("");
                    resetNewSubjectForm();
                  }}
                  className="px-4 py-2 border border-teal-300 text-teal-700 rounded-lg font-medium hover:bg-teal-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddSubjects}
                  disabled={selectedSubjectsToAdd.length === 0}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    selectedSubjectsToAdd.length === 0
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-gradient-to-r from-teal-600 to-teal-700 text-white hover:from-teal-700 hover:to-teal-800"
                  }`}
                >
                  Add Selected Subject(s)
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
                      copyToClipboard(generatedCredentials.username, "username")
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
                      copyToClipboard(generatedCredentials.password, "password")
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

      {showFacultyModal && <FacultyManagementModal />}
      {showSubjectModal && <SubjectManagementModal />}
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
              Manage complete schedules with in-place editing for faculty,
              subject, and room details
            </p>
            {isLoadingSubjects && (
              <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 px-3 py-1 rounded-full mt-2">
                <Loader2 className="w-3 h-3 animate-spin" />
                Loading subjects...
              </div>
            )}
            {isLoadingRooms && (
              <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 px-3 py-1 rounded-full mt-2">
                <Loader2 className="w-3 h-3 animate-spin" />
                Loading rooms...
              </div>
            )}
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
            {isLoadingSubjects && (
              <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 px-3 py-1 rounded-full">
                <Loader2 className="w-3 h-3 animate-spin" />
                Loading subjects...
              </div>
            )}
            {isLoadingRooms && (
              <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 px-3 py-1 rounded-full">
                <Loader2 className="w-3 h-3 animate-spin" />
                Loading rooms...
              </div>
            )}
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
                            href="https://t.me/sister_saira_bot?start "
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
                        (id) => id.trim() && !/^-?\d+$/.test(id.trim()),
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
                          (id) => id.trim() && !/^-?\d+$/.test(id.trim()),
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
                              "Are you sure you want to clear all Chat IDs?",
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
                                    "success",
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
                              href="https://t.me/sister_saira_bot?start=123 "
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
                    setClassSubjectMap({}); // Clear subject map
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
                    setClassSubjectMap({}); // Clear subject map
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
                    {isLoading && <Loader2 className="w-3 h-3 animate-spin" />}
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

          {/* FACULTY AND SUBJECTS LEGENDS SECTION */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Faculty Legend */}
            <div className="bg-white rounded-xl p-4 border border-indigo-200 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-gradient-to-br from-indigo-100 to-indigo-50 rounded-lg border border-indigo-200">
                    <Users className="w-4 h-4 text-indigo-600" />
                  </div>
                  <h3 className="text-sm font-bold text-gray-700">
                    Faculty Legend
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
                      {facultyName
                        ? `${facultyId} (${facultyName})`
                        : facultyId}
                    </div>
                  );
                })}
              </div>
              <div className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                <Info className="w-3 h-3" />
                Faculty names are color-coded for easy identification
              </div>
            </div>

            {/* Subject Legend - Now shows all subjects like faculty */}
            <div className="bg-white rounded-xl p-4 border border-teal-200 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-gradient-to-br from-teal-100 to-teal-50 rounded-lg border border-teal-200">
                    <Book className="w-4 h-4 text-teal-600" />
                  </div>
                  <h3 className="text-sm font-bold text-gray-700">
                    Subject Legend
                    <span className="ml-2 text-xs font-normal text-teal-600">
                      ({subjectOptions.length} subjects)
                    </span>
                  </h3>
                </div>
                <button
                  onClick={() => setShowSubjectModal(true)}
                  className="px-3 py-1.5 bg-gradient-to-r from-teal-50 to-teal-100 text-teal-700 rounded-lg text-xs font-bold flex items-center gap-2 hover:from-teal-100 hover:to-teal-200 transition-colors border border-teal-200"
                >
                  <BookPlus className="w-3 h-3" />
                  Add Subject
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {subjectOptions.slice(0, 8).map((subject) => (
                  <div
                    key={subject.value}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold ${subject.color} border`}
                    title={`${subject.label} (${subject.value}) - ${subject.name}`}
                  >
                    {subject.label}
                  </div>
                ))}
                {subjectOptions.length > 8 && (
                  <div
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${subjectColors[0]}`}
                  >
                    +{subjectOptions.length - 8} more
                  </div>
                )}
                {subjectOptions.length === 0 && (
                  <div className="text-sm text-gray-500 italic">
                    No subjects available
                  </div>
                )}
              </div>
              <div className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                <Info className="w-3 h-3" />
                Click subject slug to see full name and code
              </div>
            </div>
          </div>

          <div className="text-xs text-gray-500 mt-2 flex items-center gap-1">
            <Info className="w-3 h-3" />
            Click on any dropdown to edit faculty, subject (showing slug), and
            room details directly
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
                              {exists ? "Existing timetable" : "New timetable"}{" "}
                              • Edit directly in place
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
                                    <div className="w-16 text-xs text-indigo-700 font-bold mb-3">
                                      {slot.label}
                                    </div>
                                    {renderSlotContent(
                                      division,
                                      day,
                                      slot.value,
                                    )}
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
                  if (
                    window.confirm(
                      "Clear all schedules for selected divisions?",
                    )
                  ) {
                    selectedDivisions.forEach((division) => {
                      setSchedule((prev) => ({
                        ...prev,
                        [division]: days.reduce((dayAcc, day) => {
                          dayAcc[day] = timeSlots.reduce((slotAcc, slot) => {
                            slotAcc[slot.value] = {
                              faculty: "free",
                              subject: "",
                              room: "",
                            };
                            return slotAcc;
                          }, {});
                          return dayAcc;
                        }, {}),
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
                      return (
                        total +
                        Object.values(schedule[division]).flatMap((day) =>
                          Object.values(day).filter(
                            (slot) => slot.faculty !== "free",
                          ),
                        ).length
                      );
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
                    {getSubjectsForLegend().length}
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
                    {
                      Array.from(
                        new Set(
                          selectedDivisions.flatMap((division) =>
                            Object.values(schedule[division] || {}).flatMap(
                              (day) =>
                                Object.values(day)
                                  .map((slot) => slot.room)
                                  .filter(Boolean),
                            ),
                          ),
                        ),
                      ).length
                    }
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
            <h3 className="font-bold text-indigo-900">
              In-Place Editing Guide
            </h3>
          </div>
          <ul className="space-y-2 text-indigo-800 text-sm">
            <li className="flex items-start gap-2">
              <div className="w-2 h-2 bg-indigo-400 rounded-full mt-1.5"></div>
              <span>
                <strong>Direct Editing</strong> - Click on any dropdown to edit
                faculty, subject, or room details directly in place.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-2 h-2 bg-indigo-400 rounded-full mt-1.5"></div>
              <span>
                <strong>Searchable Dropdowns</strong> - All dropdowns are
                searchable. Start typing to filter options.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-2 h-2 bg-indigo-400 rounded-full mt-1.5"></div>
              <span>
                <strong>Auto-Clear</strong> - Setting faculty to "Free Period"
                automatically clears subject and room.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-2 h-2 bg-indigo-400 rounded-full mt=1.5"></div>
              <span>
                <strong>Subject Display</strong> - Subjects show slug (short
                name) with code displayed below.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-2 h-2 bg-indigo-400 rounded-full mt-1.5"></div>
              <span>
                <strong>Add New Rooms</strong> - Click "Add New Room" in room
                dropdown to create new room options in database.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-2 h-2 bg-indigo-400 rounded-full mt-1.5"></div>
              <span>
                <strong>Visual Preview</strong> - Selected values show a preview
                with faculty name and subject details.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-2 h-2 bg-indigo-400 rounded-full mt-1.5"></div>
              <span>
                <strong>Color Coding</strong> - Faculty dropdowns are
                color-coded, subjects in teal, rooms in amber.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-2 h-2 bg-indigo-400 rounded-full mt-1.5"></div>
              <span>
                <strong>Real-time Updates</strong> - Changes are saved to state
                immediately, no need to click "Save" per slot.
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
