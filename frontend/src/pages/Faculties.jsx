import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Users,
  Search,
  Key,
  Copy,
  Download,
  UserPlus,
  GraduationCap,
  Calendar,
  Clock,
  ChevronRight,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  AlertCircle,
  Building,
  CheckCircle,
  X,
  Plus,
  Loader2,
  Phone,
  BookOpen,
  RefreshCw,
  Info,
  User,
  Hash,
  Check,
  Notebook,
  PenTool,
  Clipboard,
  FileText,
  Bookmark,
  StickyNote,
  Highlighter,
  Compass,
  Archive,
  Layers
} from "lucide-react";
import api from "../configs/api";
import EditFacultyModal from "../components/EditFacultyModal";
import Alert from "../components/Alert";

export default function Faculties() {
  const [faculties, setFaculties] = useState([]);
  const [filteredFaculties, setFilteredFaculties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedFaculty, setSelectedFaculty] = useState(null);
  const [activeFilter, setActiveFilter] = useState("all");
  const navigate = useNavigate();
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState(null);

  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [generatedCredentials, setGeneratedCredentials] = useState(null);
  const [copiedField, setCopiedField] = useState("");

  // New faculty form state
  const [newFacultyId, setNewFacultyId] = useState("");
  const [newFacultyName, setNewFacultyName] = useState("");
  const [isCreatingFaculty, setIsCreatingFaculty] = useState(false);
  const [createFacultyError, setCreateFacultyError] = useState("");

  // All faculties state for create modal
  const [allAvailableFaculties, setAllAvailableFaculties] = useState([]);

  // Filters state
  const [filters, setFilters] = useState([
    { id: "all", label: "All Tutors", count: 0 },
    { id: "active", label: "Currently Teaching", count: 0 },
    { id: "available", label: "Available", count: 0 },
  ]);

  //token declared
  const token = localStorage.getItem("token");

  // Alert state
  const [alert, setAlert] = useState({
    show: false,
    type: "", // 'success' or 'error'
    main: "",
    info: "",
  });

  const showAlert = (type, main, info) => {
    setAlert({
      show: true,
      type,
      main,
      info,
    });

    // Auto-hide after 4 seconds
    setTimeout(() => {
      setAlert((prev) => ({ ...prev, show: false }));
    }, 4000);
  };

  const closeAlert = () => {
    setAlert((prev) => ({ ...prev, show: false }));
  };

  /* =======================
     🔹 CALCULATE FACULTY STATUS
  ======================= */
  const isFacultyActive = (faculty) => {
    if (!faculty || !faculty.timetable) return false;

    const timetable = faculty.timetable;
    const days = ["mon", "tue", "wed", "thu", "fri", "sat"];

    for (const day of days) {
      const daySchedule = timetable[day] || [];
      if (daySchedule.some((slot) => slot !== "free")) {
        return true;
      }
    }
    return false;
  };

  /* =======================
     🔹 UPDATE FILTER COUNTS
  ======================= */
  const updateFilterCounts = (facultyList) => {
    if (!facultyList || facultyList.length === 0) {
      setFilters([
        { id: "all", label: "All Tutors", count: 0 },
        { id: "active", label: "Currently Teaching", count: 0 },
        { id: "available", label: "Available", count: 0 },
      ]);
      return;
    }

    let activeCount = 0;
    let availableCount = 0;

    facultyList.forEach((faculty) => {
      if (isFacultyActive(faculty)) {
        activeCount++;
      } else {
        availableCount++;
      }
    });

    setFilters([
      { id: "all", label: "All Tutors", count: facultyList.length },
      { id: "active", label: "Currently Teaching", count: activeCount },
      { id: "available", label: "Available", count: availableCount },
    ]);
  };

  /* =======================
     🔹 APPLY FILTERS
  ======================= */
  const applyFilters = () => {
    let result = [...faculties];

    switch (activeFilter) {
      case "active":
        result = result.filter((faculty) => isFacultyActive(faculty));
        break;
      case "available":
        result = result.filter((faculty) => !isFacultyActive(faculty));
        break;
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (faculty) =>
          faculty.name.toLowerCase().includes(query) ||
          faculty.id.toLowerCase().includes(query)
      );
    }

    setFilteredFaculties(result);
  };

  /* =======================
     🔹 FETCH ALL FACULTIES
  ======================= */
  const fetchFaculties = async () => {
    setLoading(true);
    try {
      const response = await api.get("/api/faculties",{
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.data.success) {
        const facultiesList = response.data.faculties || [];
        setFaculties(facultiesList);
        updateFilterCounts(facultiesList);
        applyFilters();
      }
    } catch (error) {
      console.error("Error fetching faculties:", error);
      showAlert("error", "Failed to load tutors", "Please try again.");
    } finally {
      setLoading(false);
    }
  };

  /* =======================
     🔹 FETCH ALL FACULTIES FOR MODAL
  ======================= */
  const fetchAllFacultiesForModal = async () => {
    try {
      const response = await api.get("/api/faculties",{
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.data.success) {
        const facultiesList = response.data.faculties || [];
        setAllAvailableFaculties(facultiesList);
      }
    } catch (error) {
      console.error("Error fetching faculties for modal:", error);
    }
  };

  /* =======================
     🔹 HANDLE FILTER CHANGE
  ======================= */
  const handleFilterChange = (filterId) => {
    setActiveFilter(filterId);
  };

  /* =======================
     🔹 CREATE NEW FACULTY
  ======================= */
  const handleCreateNewFaculty = async () => {
    if (!newFacultyId.trim()) {
      setCreateFacultyError("Tutor ID is required");
      return;
    }

    if (!newFacultyName.trim()) {
      setCreateFacultyError("Tutor Name is required");
      return;
    }

    const facultyExists = allAvailableFaculties.some(
      (faculty) =>
        faculty.id.toLowerCase() === newFacultyId.trim().toLowerCase()
    );

    if (facultyExists) {
      setCreateFacultyError("A tutor with this ID already exists");
      return;
    }

    setIsCreatingFaculty(true);
    setCreateFacultyError("");

    try {
      const response = await api.post("/api/faculties", {
        id: newFacultyId.trim(),
        name: newFacultyName.trim(),
        },        
        {
          headers: {
            Authorization: `Bearer ${token}`,
        },  
      });

      if (response.data.success) {
        const username = newFacultyId.trim().toUpperCase();
        const password = `${username}@NLJIET`;

        setGeneratedCredentials({
          name: newFacultyName.trim(),
          username,
          password,
        });

        setShowCreateModal(false);
        setShowCredentialsModal(true);

        setNewFacultyId("");
        setNewFacultyName("");
        setCreateFacultyError("");

        fetchFaculties();

        showAlert(
          "success",
          "Tutor created successfully",
          "Credentials have been generated."
        );
      } else {
        throw new Error(response.data.error || "Failed to create tutor");
      }
    } catch (error) {
      console.error("Error creating faculty:", error);
      setCreateFacultyError(
        error.response?.data?.error ||
          "Failed to create tutor. Please try again."
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
    }
  };

  const downloadCredentials = () => {
    if (!generatedCredentials) return;

    const content = `Tutor Login Credentials
========================

Tutor Name: ${generatedCredentials.name}
Username: ${generatedCredentials.username}
Password: ${generatedCredentials.password}

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

  const handleEditFaculty = (faculty) => {
    setEditingFaculty(faculty);
    setShowEditModal(true);
  };

  const handleAdminToggle = async (faculty_id, currentStatus, facultyName) => {
    try {
      
      const response = await api.patch(
        `/api/faculties/${faculty_id}/toggle-admin`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        // Update local state immediately for better UX
        setFaculties((prevFaculties) =>
          prevFaculties.map((faculty) =>
            faculty.id === faculty_id
              ? { ...faculty, isAdmin: !currentStatus }
              : faculty
          )
        );

        // Also update filteredFaculties
        setFilteredFaculties((prevFiltered) =>
          prevFiltered.map((faculty) =>
            faculty.id === faculty_id
              ? { ...faculty, isAdmin: !currentStatus }
              : faculty
          )
        );

        showAlert(
          "success",
          "Admin status updated",
          `"${facultyName || "Tutor"}" is now ${
            !currentStatus ? "an admin" : "a regular user"
          }`
        );
      } else if (response.data.error?.includes("can't change your own")) {
        showAlert(
          "error",
          "Cannot change your own status",
          "You cannot change your own admin status."
        );
      } else {
        showAlert(
          "error",
          "Failed to update status",
          response.data.error || "Please try again."
        );
      }
    } catch (error) {
      console.error("Error updating admin status:", error);

      if (error.response?.data?.error?.includes("can't change your own")) {
        showAlert(
          "error",
          "Cannot change your own status",
          "You cannot change your own admin status."
        );
      } else {
        showAlert(
          "error",
          "Failed to update status",
          error.response?.data?.error || "Please try again."
        );
      }
    }
  };

  const handleEditSuccess = () => {
    fetchFaculties();
    showAlert(
      "success",
      "Tutor updated successfully",
      `"${editingFaculty?.name}" has been updated.`
    );
  };

  /* =======================
     🔹 DELETE FACULTY
  ======================= */
  const handleDeleteFaculty = async () => {
    if (!selectedFaculty) return;

    try {
      
      const response = await api.delete(
        `/api/faculties/${selectedFaculty.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (response.data.success) {
        showAlert(
          "success",
          "Tutor deleted successfully",
          `"${selectedFaculty.name}" has been removed.`
        );
        setShowDeleteModal(false);
        setSelectedFaculty(null);
        fetchFaculties();
      } else {
        showAlert(
          "error",
          "Failed to delete tutor",
          response.data.error || "Please try again."
        );
      }
    } catch (error) {
      console.error("Error deleting faculty:", error);
      showAlert(
        "error",
        "Failed to delete tutor",
        error.response?.data?.error || "Please try again."
      );
    }
  };

  /* =======================
     🔹 HANDLE SEARCH AND FILTER CHANGES
  ======================= */
  useEffect(() => {
    applyFilters();
  }, [searchQuery, activeFilter, faculties]);

  /* =======================
     🔹 INITIAL LOAD
  ======================= */
  useEffect(() => {
    fetchFaculties();
  }, []);

  /* =======================
     🔹 VIEW FACULTY TIMETABLE
  ======================= */
  const handleViewTimetable = (faculty) => {
    navigate(`/faculty/${faculty.id}`, {
      state: {
        facultyId: faculty.id,
        facultyName: faculty.name,
      },
    });
  };

  /* =======================
     🔹 CALCULATE FACULTY STATS
  ======================= */
  const calculateFacultyStats = (faculty) => {
    if (!faculty || !faculty.timetable) {
      return {
        classesCount: 0,
        weeklyHours: 0,
      };
    }

    const timetable = faculty.timetable;
    const days = ["mon", "tue", "wed", "thu", "fri", "sat"];
    const uniqueClasses = new Set();
    let weeklyHours = 0;

    days.forEach((day) => {
      const daySchedule = timetable[day] || [];

      daySchedule.forEach((slot) => {
        if (slot !== "free") {
          weeklyHours++;

          const parts = slot.split("-");
          if (parts.length >= 3) {
            const classIdentifier = `${parts[0]}-${parts[1]}-${parts[2]}`;
            uniqueClasses.add(classIdentifier);
          }
        }
      });
    });

    return {
      classesCount: uniqueClasses.size,
      weeklyHours,
      isActive: weeklyHours > 0,
    };
  };

  const averageWeeklyHours =
    faculties.length > 0
      ? Math.round(
          faculties.reduce((sum, faculty) => {
            const { weeklyHours } = calculateFacultyStats(faculty);
            return sum + weeklyHours;
          }, 0) / faculties.length
        )
      : 0;

  const activeFacultiesCount = faculties.filter((f) =>
    isFacultyActive(f)
  ).length;
  const availableFacultiesCount = faculties.length - activeFacultiesCount;

  /* =======================
     🔹 RESET NEW FACULTY FORM
  ======================= */
  const resetNewFacultyForm = () => {
    setNewFacultyId("");
    setNewFacultyName("");
    setCreateFacultyError("");
  };

  /* =======================
     🔹 OPEN CREATE MODAL
  ======================= */
  const handleOpenCreateModal = () => {
    setShowCreateModal(true);
    fetchAllFacultiesForModal();
    resetNewFacultyForm();
  };

  /* =======================
     🔹 RENDER
  ======================= */
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-blue-50 p-4 md:p-6">
      {/* Alert Component */}
      {alert.show && (
        <Alert
          main={alert.main}
          info={alert.info}
          onClose={closeAlert}
          type={alert.type}
        />
      )}

      {/* Credentials Modal */}
      {showCredentialsModal && generatedCredentials && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 z-[100]">
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl border border-amber-200">
            <div className="p-6 bg-gradient-to-r from-green-400 to-green-600 text-white">
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
                  <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-amber-900 text-sm">
                      Important: Save These Credentials
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
                      className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors flex items-center gap-2 border border-blue-200"
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
                      className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors flex items-center gap-2 border border-blue-200"
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

      {/* Create Faculty Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden border border-amber-200">
            <div className="p-6 border-b border-amber-100 bg-gradient-to-r from-amber-50 to-amber-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg border border-amber-200">
                    <UserPlus className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-amber-900">
                      Add New Tutor
                    </h2>
                    <p className="text-amber-700 text-sm mt-1">
                      Enter tutor details to create a new study account
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    resetNewFacultyForm();
                  }}
                  className="p-2 hover:bg-white/50 rounded-lg transition-colors border border-amber-200"
                >
                  <X className="w-5 h-5 text-amber-600" />
                </button>
              </div>
            </div>

            <div className="p-6">
              {createFacultyError && (
                <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-700 text-sm">{createFacultyError}</p>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
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
                  <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
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

              <div className="flex gap-3 mt-8">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    resetNewFacultyForm();
                  }}
                  className="px-4 py-2.5 border border-amber-300 text-amber-700 rounded-lg font-bold hover:bg-amber-50 transition-colors flex-1"
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
                  className={`px-4 py-2.5 rounded-lg font-bold transition-colors flex items-center justify-center gap-2 flex-1 ${
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
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedFaculty && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden border border-amber-200">
            <div className="p-6 border-b border-amber-100 bg-gradient-to-r from-amber-50 to-amber-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg border border-amber-200">
                    <Archive className="w-5 h-5 text-amber-600" />
                  </div>
                  <h2 className="text-xl font-bold text-amber-900">
                    Remove Tutor
                  </h2>
                </div>
                <button
                  onClick={() => setShowDeleteModal(false)}
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
                Remove {selectedFaculty.name}?
              </h3>
              <p className="text-gray-600 text-center mb-6">
                This will permanently remove tutor "{selectedFaculty.name}"
                (ID: {selectedFaculty.id}) from all assigned study schedules.
              </p>

              <div className="bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-red-800 font-bold">Important Notice</p>
                    <p className="text-red-700 text-sm mt-1">
                      This action cannot be undone. All study schedule assignments
                      will be removed.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 bg-amber-50">
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 border border-amber-300 text-amber-700 rounded-lg font-bold hover:bg-amber-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteFaculty}
                  className="px-4 py-2 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-lg font-bold hover:from-red-700 hover:to-rose-700 transition-colors flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Remove Tutor
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Breadcrumb */}
        <div className="mb-6">
          <div className="flex items-center text-sm text-gray-600 mb-4">
            <Link
              to="/dashboard"
              className="hover:text-gray-800 cursor-pointer flex items-center gap-1"
            >
              <Bookmark className="w-3 h-3" />
              Dashboard
            </Link>
            <ChevronRight className="w-4 h-4 mx-2" />
            <span className="font-bold text-amber-600 flex items-center gap-1">
              <PenTool className="w-4 h-4" />
              Study Tutors
            </span>
          </div>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 bg-white rounded-xl shadow-sm border border-gray-100">
                <PenTool className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Study Tutors
                </h1>
                <p className="text-gray-600">
                  Manage all tutors and their study schedules
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleOpenCreateModal}
              className="px-4 py-3 bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-lg font-bold hover:from-amber-700 hover:to-amber-800 transition-colors flex items-center gap-2 border border-amber-700"
            >
              <UserPlus className="w-5 h-5" />
              Add Tutor
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 border border-amber-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Tutors</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {faculties.length}
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
                <p className="text-sm text-gray-600">Currently Teaching</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {activeFacultiesCount}
                </p>
              </div>
              <div className="p-3 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg border border-orange-200">
                <BookOpen className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-amber-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Weekly Sessions (Avg)</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {averageWeeklyHours}
                </p>
              </div>
              <div className="p-3 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-amber-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Available</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {availableFacultiesCount}
                </p>
              </div>
              <div className="p-3 bg-gradient-to-br from-violet-50 to-violet-100 rounded-lg border border-violet-200">
                <GraduationCap className="w-6 h-6 text-violet-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-2xl p-6 border border-amber-200 shadow-sm mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-amber-400" />
                <input
                  type="text"
                  placeholder="Search tutors by name or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="p-2 bg-gradient-to-br from-amber-100 to-amber-50 rounded-lg border border-amber-200">
                <Filter className="w-4 h-4 text-amber-600" />
              </div>
              <span className="text-sm text-gray-700 font-bold">Filter:</span>
              <div className="flex flex-wrap gap-2">
                {filters.map((filter) => (
                  <button
                    key={filter.id}
                    onClick={() => handleFilterChange(filter.id)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-colors border ${
                      activeFilter === filter.id
                        ? "bg-gradient-to-r from-amber-100 to-amber-50 text-amber-700 border-amber-300"
                        : "bg-gradient-to-r from-gray-100 to-gray-50 text-gray-700 hover:from-gray-200 hover:to-gray-100 border-gray-200"
                    }`}
                  >
                    {filter.label}
                    <span className="ml-1.5 text-xs opacity-75">
                      ({filter.count})
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Faculty List */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-amber-600 mb-4" />
              <p className="text-gray-600">Loading tutors...</p>
            </div>
          ) : filteredFaculties.length === 0 ? (
            <div className="text-center py-12">
              <PenTool className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                No tutors found
              </h3>
              <p className="text-gray-600">
                {searchQuery
                  ? "Try a different search term or filter"
                  : activeFilter !== "all"
                  ? `No ${activeFilter} tutors found`
                  : "No tutors have been added yet"}
              </p>
              {!searchQuery &&
                activeFilter === "all" &&
                faculties.length === 0 && (
                  <button
                    onClick={handleOpenCreateModal}
                    className="mt-4 px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-lg font-bold hover:from-amber-700 hover:to-amber-800 transition-colors inline-flex items-center gap-2 border border-amber-700"
                  >
                    <Plus className="w-4 h-4" />
                    Add Your First Tutor
                  </button>
                )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredFaculties.map((faculty) => {
                const stats = calculateFacultyStats(faculty);

                return (
                  <div
                    key={faculty.id}
                    className={`bg-white rounded-xl border ${
                      stats.isActive ? "border-orange-200" : "border-amber-200"
                    } hover:border-amber-300 hover:shadow-md transition-all duration-300 overflow-hidden group relative`}
                  >
                    {/* Notebook Spine Effect */}
                    <div className="absolute left-0 top-0 bottom-0 w-2 bg-gradient-to-b from-amber-400 to-amber-300 rounded-l-lg"></div>
                    
                    <div
                      className={`p-4 border-b ml-2 ${
                        stats.isActive
                          ? "bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200"
                          : "bg-gradient-to-r from-amber-50 to-amber-100 border-amber-200"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center border ${
                              stats.isActive
                                ? "border-orange-200 bg-gradient-to-br from-orange-100 to-orange-50"
                                : "border-amber-200 bg-gradient-to-br from-amber-100 to-amber-50"
                            }`}
                          >
                            <PenTool
                              className={`w-5 h-5 ${
                                stats.isActive
                                  ? "text-orange-600"
                                  : "text-amber-600"
                              }`}
                            />
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-900">
                              {faculty.name}
                            </h3>
                            <p className="text-sm text-gray-600 mt-1 flex items-center gap-1">
                              <Hash className="w-3 h-3" />
                              ID: {faculty.id}
                            </p>
                          </div>
                        </div>
                        <div className="relative">
                          <button
                            onClick={() =>
                              setSelectedFaculty(
                                selectedFaculty?.id === faculty.id
                                  ? null
                                  : faculty
                              )
                            }
                            className="p-1.5 hover:bg-white/50 rounded-lg transition-colors border border-amber-200"
                          >
                            <MoreVertical className="w-5 h-5 text-amber-500" />
                          </button>

                          {selectedFaculty?.id === faculty.id && (
                            <div className="absolute right-0 top-10 w-48 bg-white rounded-lg border border-amber-200 shadow-lg z-10">
                              <button
                                onClick={() => handleViewTimetable(faculty)}
                                className="w-full px-4 py-3 text-left hover:bg-amber-50 flex items-center gap-2 rounded-t-lg border-b border-amber-100"
                              >
                                <Calendar className="w-4 h-4 text-amber-600" />
                                View Schedule
                              </button>
                              <button
                                onClick={() => handleEditFaculty(faculty)}
                                className="w-full px-4 py-3 text-left hover:bg-amber-50 flex items-center gap-2 border-b border-amber-100"
                              >
                                <Edit className="w-4 h-4 text-amber-600" />
                                Edit Details
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedFaculty(faculty);
                                  setShowDeleteModal(true);
                                }}
                                className="w-full px-4 py-3 text-left hover:bg-red-50 text-red-600 flex items-center gap-2 rounded-b-lg"
                              >
                                <Trash2 className="w-4 h-4" />
                                Remove Tutor
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="p-4 ml-2">
                      <div className="grid grid-cols-3 gap-3 mb-4">
                        <div className="text-center">
                          <div className="text-lg font-bold text-blue-600">
                            {stats.classesCount}
                          </div>
                          <div className="text-xs text-gray-600 flex items-center justify-center gap-1">
                            <Layers className="w-3 h-3" />
                            Groups
                          </div>
                        </div>
                        <div className="text-center">
                          <div
                            className={`text-lg font-bold ${
                              stats.weeklyHours > 0
                                ? "text-orange-600"
                                : "text-gray-400"
                            }`}
                          >
                            {stats.weeklyHours}
                          </div>
                          <div className="text-xs text-gray-600 flex items-center justify-center gap-1">
                            <Clock className="w-3 h-3" />
                            Sessions/Week
                          </div>
                        </div>
                        <div className="text-center">
                          <div
                            className={`text-xs px-2 py-1 rounded-full font-bold border ${
                              stats.isActive
                                ? "bg-gradient-to-r from-orange-100 to-orange-50 text-orange-700 border-orange-200"
                                : "bg-gradient-to-r from-blue-100 to-blue-50 text-blue-700 border-blue-200"
                            }`}
                          >
                            {stats.isActive ? "Teaching" : "Available"}
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleViewTimetable(faculty)}
                          className="flex-1 px-3 py-2 bg-gradient-to-r from-amber-600 to-amber-600 text-white text-sm font-bold rounded-lg hover:from-amber-700 hover:to-amber-800 transition-colors flex items-center justify-center gap-2 border border-amber-700"
                        >
                          <Calendar className="w-4 h-4" />
                          View Schedule
                        </button>
                        <button
                          onClick={() =>
                            handleAdminToggle(
                              faculty.id,
                              faculty.isAdmin,
                              faculty.name
                            )
                          }
                          className={`p-2 rounded-lg transition-colors relative group border ${
                            faculty.isAdmin
                              ? "bg-gradient-to-r from-orange-100 to-orange-50 text-orange-700 hover:from-orange-200 hover:to-orange-100 border-orange-200"
                              : "bg-gradient-to-r from-amber-100 to-amber-50 text-amber-700 hover:from-amber-200 hover:to-amber-100 border-amber-200"
                          }`}
                          title={
                            faculty.isAdmin
                              ? "Click to revoke admin privileges"
                              : "Click to make admin"
                          }
                        >
                          {faculty.isAdmin ? (
                            <>
                              <Key className="w-4 h-4" />
                              {/* Admin badge indicator */}
                              <span className="absolute -top-1 -right-1">
                                <span className="flex h-3 w-3">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
                                </span>
                              </span>
                            </>
                          ) : (
                            <User className="w-4 h-4" />
                          )}

                          {/* Tooltip text */}
                          <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs font-medium text-white bg-gray-900 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                            {faculty.isAdmin ? "Study Admin" : "Make Admin"}
                          </span>
                        </button>
                      </div>
                    </div>

                    <div className="px-4 pb-4 ml-2">
                      <div className="text-xs text-gray-500 flex items-center gap-2">
                        <Building className="w-3 h-3" />
                        <span>
                          Status:{" "}
                          {stats.isActive
                            ? "Currently Teaching"
                            : "Available for Study Groups"}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-6 flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <StickyNote className="w-4 h-4" />
              Showing {filteredFaculties.length} of {faculties.length} tutors
              {activeFilter !== "all" && ` (${activeFilter} only)`}
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={fetchFaculties}
                className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-amber-100 to-amber-50 rounded-lg transition-colors border border-amber-200 hover:from-amber-200 hover:to-amber-100"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-amber-50 to-blue-50 rounded-2xl p-6 border-2 border-amber-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-gradient-to-br from-amber-100 to-amber-50 rounded-lg border border-amber-200">
              <Compass className="w-5 h-5 text-amber-600" />
            </div>
            <h3 className="font-bold text-amber-900">
              Tutor Management Guide
            </h3>
          </div>
          <ul className="space-y-2 text-amber-800 text-sm">
            <li className="flex items-start gap-2">
              <div className="w-2 h-2 bg-amber-400 rounded-full mt-1.5"></div>
              <span>
                <strong>Currently Teaching</strong>: Tutors with assigned
                sessions in their schedule
              </span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-2 h-2 bg-amber-400 rounded-full mt-1.5"></div>
              <span>
                <strong>Available</strong>: Tutors with no sessions assigned
                (can be assigned to new study groups)
              </span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-2 h-2 bg-amber-400 rounded-full mt-1.5"></div>
              <span>
                <strong>Use the search bar</strong> to quickly find tutors by
                name or ID
              </span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-2 h-2 bg-amber-400 rounded-full mt-1.5"></div>
              <span>
                <strong>Filter options</strong> help you view only active or
                available tutors
              </span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-2 h-2 bg-amber-400 rounded-full mt-1.5"></div>
              <span>
                <strong>Click "Add Tutor"</strong> to create new tutor
                accounts with auto-generated study access
              </span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-2 h-2 bg-amber-400 rounded-full mt-1.5"></div>
              <span>
                <strong>Key Icon</strong>: Click to grant/revoke admin
                privileges for study management
              </span>
            </li>
          </ul>
        </div>
      </div>

      {selectedFaculty && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setSelectedFaculty(null)}
        />
      )}

      <EditFacultyModal
        faculty={editingFaculty}
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingFaculty(null);
        }}
        onSuccess={handleEditSuccess}
      />
    </div>
  );
}