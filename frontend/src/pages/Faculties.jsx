import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Users,
  Search,
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
  Mail,
  Phone,
  BookOpen,
  RefreshCw,
  Info,
} from "lucide-react";
import api from "../configs/api";
import EditFacultyModal from "../components/EditFacultyModal";

export default function Faculties() {
  const [faculties, setFaculties] = useState([]);
  const [filteredFaculties, setFilteredFaculties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedFaculty, setSelectedFaculty] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const navigate = useNavigate();
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState(null);

  // New faculty form state
  const [newFaculty, setNewFaculty] = useState({
    id: "",
    name: "",
  });

  // Filters
  const filters = [
    { id: "all", label: "All Faculties", count: 0 },
    { id: "active", label: "Currently Teaching", count: 0 },
    { id: "available", label: "Available", count: 0 },
  ];

  /* =======================
     🔹 FETCH ALL FACULTIES
  ======================= */
  const fetchFaculties = async () => {
    setLoading(true);
    try {
      const response = await api.get("/api/faculties");
      if (response.data.success) {
        const facultiesList = response.data.faculties || [];
        setFaculties(facultiesList);
        setFilteredFaculties(facultiesList);

        // Update filter counts (you might want to add logic to determine "active" vs "available")
        filters[0].count = facultiesList.length;
      }
    } catch (error) {
      console.error("Error fetching faculties:", error);
      setErrorMsg("Failed to load faculties. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  /* =======================
     🔹 CREATE NEW FACULTY
  ======================= */
  const handleCreateFaculty = async () => {
    if (!newFaculty.id.trim() || !newFaculty.name.trim()) {
      setErrorMsg("Both Faculty ID and Name are required");
      return;
    }

    try {
      const response = await api.post("/api/faculties", newFaculty);
      if (response.data.success) {
        setSuccessMsg(`Faculty "${newFaculty.name}" created successfully!`);
        setShowCreateModal(false);
        setNewFaculty({ id: "", name: "" });
        fetchFaculties(); // Refresh the list

        setTimeout(() => setSuccessMsg(""), 3000);
      } else {
        setErrorMsg(response.data.error || "Failed to create faculty");
      }
    } catch (error) {
      console.error("Error creating faculty:", error);
      setErrorMsg(error.response?.data?.error || "Failed to create faculty");
    }
  };

  const handleEditFaculty = (faculty) => {
    setEditingFaculty(faculty);
    setShowEditModal(true);
  };
  const handleEditSuccess = () => {
    fetchFaculties(); // Refresh the list
    setSuccessMsg(`Faculty "${editingFaculty?.name}" updated successfully!`);
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  /* =======================
     🔹 DELETE FACULTY
  ======================= */
  const handleDeleteFaculty = async () => {
    if (!selectedFaculty) return;

    try {
      const response = await api.delete(`/api/faculties/${selectedFaculty.id}`);
      if (response.data.success) {
        setSuccessMsg(
          `Faculty "${selectedFaculty.name}" deleted successfully!`
        );
        setShowDeleteModal(false);
        setSelectedFaculty(null);
        fetchFaculties(); // Refresh the list

        setTimeout(() => setSuccessMsg(""), 3000);
      } else {
        setErrorMsg(response.data.error || "Failed to delete faculty");
      }
    } catch (error) {
      console.error("Error deleting faculty:", error);
      setErrorMsg(error.response?.data?.error || "Failed to delete faculty");
    }
  };

  /* =======================
     🔹 HANDLE SEARCH
  ======================= */
  useEffect(() => {
    const filtered = faculties.filter(
      (faculty) =>
        faculty.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faculty.id.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredFaculties(filtered);
  }, [searchQuery, faculties]);

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
     🔹 CALCULATE STATS (MOCK - YOU CAN IMPLEMENT REAL LOGIC)
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

    // Parse each day's schedule
    days.forEach((day) => {
      const daySchedule = timetable[day] || [];

      daySchedule.forEach((slot) => {
        if (slot !== "free") {
          weeklyHours++;

          // Extract class information from slot format: "CSE-D2-Sem1-Time Slot 1"
          // We want to extract the class part (e.g., "CSE-D2-Sem1")
          const parts = slot.split("-");
          if (parts.length >= 3) {
            // Combine branch, class, and semester to get unique class identifier
            const classIdentifier = `${parts[0]}-${parts[1]}-${parts[2]}`;
            uniqueClasses.add(classIdentifier);
          }
        }
      });
    });

    return {
      classesCount: uniqueClasses.size,
      weeklyHours,
    };
  };

  /* =======================
     🔹 RENDER
  ======================= */
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 p-4 md:p-6">
      {/* Decorative Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-64 h-64 bg-gradient-to-br from-purple-100 to-transparent rounded-full opacity-20"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tr from-blue-100 to-transparent rounded-full opacity-10"></div>
      </div>

      {/* Create Faculty Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Add New Faculty
                  </h2>
                  <p className="text-gray-600 text-sm mt-1">
                    Create a new faculty member
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewFaculty({ id: "", name: "" });
                    setErrorMsg("");
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Faculty ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newFaculty.id}
                    onChange={(e) =>
                      setNewFaculty({
                        ...newFaculty,
                        id: e.target.value.toUpperCase(),
                      })
                    }
                    placeholder="e.g., FAC009"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Use uppercase letters, numbers, underscores or hyphens
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Faculty Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newFaculty.name}
                    onChange={(e) =>
                      setNewFaculty({ ...newFaculty, name: e.target.value })
                    }
                    placeholder="e.g., Dr. Sunil Verma"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {errorMsg && (
                <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                  <p className="text-red-700 text-sm">{errorMsg}</p>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewFaculty({ id: "", name: "" });
                    setErrorMsg("");
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateFaculty}
                  disabled={!newFaculty.id.trim() || !newFaculty.name.trim()}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    !newFaculty.id.trim() || !newFaculty.name.trim()
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                  }`}
                >
                  Create Faculty
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedFaculty && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Delete Faculty
                  </h2>
                  <p className="text-gray-600 text-sm mt-1">
                    This action cannot be undone
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedFaculty(null);
                    setErrorMsg("");
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Are you sure?</p>
                  <p className="text-gray-600 text-sm mt-1">
                    You're about to delete{" "}
                    <span className="font-semibold">
                      {selectedFaculty.name}
                    </span>
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Faculty ID:</span>{" "}
                  {selectedFaculty.id}
                </p>
                <p className="text-sm text-gray-700 mt-1">
                  <span className="font-medium">Faculty Name:</span>{" "}
                  {selectedFaculty.name}
                </p>
                <p className="text-xs text-red-600 mt-2">
                  ⚠️ Warning: All timetable assignments for this faculty will
                  also be removed.
                </p>
              </div>

              {errorMsg && (
                <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200">
                  <p className="text-red-700 text-sm">{errorMsg}</p>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedFaculty(null);
                    setErrorMsg("");
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteFaculty}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Faculty
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
              className="hover:text-gray-800 cursor-pointer"
            >
              Dashboard
            </Link>
            <ChevronRight className="w-4 h-4 mx-2" />
            <span className="font-medium text-blue-600">
              Faculty Management
            </span>
          </div>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Faculty Management
            </h1>
            <p className="text-gray-600">
              Manage all faculty members and their timetables
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <UserPlus className="w-5 h-5" />
              Add Faculty
            </button>
          </div>
        </div>

        {/* Status Messages */}
        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl border border-red-200 bg-red-50 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-red-800">Error</p>
              <p className="text-red-600 text-sm mt-1">{errorMsg}</p>
            </div>
          </div>
        )}

        {successMsg && (
          <div className="mb-6 p-4 rounded-xl border border-emerald-200 bg-emerald-50 flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-emerald-800">Success</p>
              <p className="text-emerald-600 text-sm mt-1">{successMsg}</p>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Faculties</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {faculties.length}
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
                <p className="text-sm text-gray-600">Currently Teaching</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {faculties.length > 0
                    ? Math.floor(faculties.length * 0.8)
                    : 0}
                </p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <BookOpen className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Weekly Hours (Avg)</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">18</p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <Clock className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Available</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {faculties.length > 0
                    ? Math.floor(faculties.length * 0.2)
                    : 0}
                </p>
              </div>
              <div className="p-3 bg-amber-50 rounded-lg">
                <GraduationCap className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search faculties by name or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-500" />
              <span className="text-sm text-gray-700 font-medium">Filter:</span>
              <div className="flex flex-wrap gap-2">
                {filters.map((filter) => (
                  <button
                    key={filter.id}
                    onClick={() => setActiveFilter(filter.id)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      activeFilter === filter.id
                        ? "bg-blue-100 text-blue-700 border border-blue-200"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
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
              <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-4" />
              <p className="text-gray-600">Loading faculties...</p>
            </div>
          ) : filteredFaculties.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No faculties found
              </h3>
              <p className="text-gray-600">
                {searchQuery
                  ? "Try a different search term"
                  : "No faculties have been added yet"}
              </p>
              {!searchQuery && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Your First Faculty
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
                    className="bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-300 overflow-hidden group"
                  >
                    {/* Faculty Card Header */}
                    <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <GraduationCap className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-900">
                              {faculty.name}
                            </h3>
                            <p className="text-sm text-gray-600 mt-1">
                              ID: {faculty.id}
                            </p>
                          </div>
                        </div>
                        <div className="relative">
                          <button
                            onClick={() => setSelectedFaculty(faculty)}
                            className="p-1.5 hover:bg-white/50 rounded-lg transition-colors"
                          >
                            <MoreVertical className="w-5 h-5 text-gray-500" />
                          </button>

                          {/* Dropdown Menu */}
                          {selectedFaculty?.id === faculty.id && (
                            <div className="absolute right-0 top-10 w-48 bg-white rounded-lg border border-gray-200 shadow-lg z-10">
                              <button
                                onClick={() => handleViewTimetable(faculty)}
                                className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-2 rounded-t-lg"
                              >
                                <Eye className="w-4 h-4" />
                                View Timetable
                              </button>
                              <button
                                onClick={() => handleEditFaculty(faculty)}
                                className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-2"
                              >
                                <Edit className="w-4 h-4" />
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
                                Delete Faculty
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Faculty Stats */}
                    <div className="p-4">
                      <div className="grid grid-cols-3 gap-3 mb-4">
                        <div className="text-center">
                          <div className="text-lg font-bold text-blue-600">
                            {stats.classesCount}
                          </div>
                          <div className="text-xs text-gray-600">Classes</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-green-600">
                            {stats.weeklyHours}
                          </div>
                          <div className="text-xs text-gray-600">
                            Lectures/Week
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleViewTimetable(faculty)}
                          className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                        >
                          <Calendar className="w-4 h-4" />
                          View Timetable
                        </button>
                        <button
                          onClick={() => {
                            // Email functionality (placeholder)
                            window.location.href = `mailto:${faculty.id.toLowerCase()}@college.edu`;
                          }}
                          className="p-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                          title="Send Email"
                        >
                          <Mail className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Quick Info */}
                    <div className="px-4 pb-4">
                      <div className="text-xs text-gray-500 flex items-center gap-2">
                        <Building className="w-3 h-3" />
                        <span>Department: Computer Science</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination/Info */}
          <div className="mt-6 flex items-center justify-between text-sm text-gray-600">
            <div>
              Showing {filteredFaculties.length} of {faculties.length} faculties
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={fetchFaculties}
                className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Quick Tips */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
          <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
            <Info className="w-5 h-5" />
            Faculty Management Tips
          </h3>
          <ul className="space-y-2 text-blue-800 text-sm">
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-1.5"></div>
              <span>
                <strong>Click on any faculty card</strong> to view their
                detailed timetable
              </span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-1.5"></div>
              <span>
                <strong>Use the search bar</strong> to quickly find faculty by
                name or ID
              </span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-1.5"></div>
              <span>
                <strong>Filter options</strong> help you view only active or
                available faculty
              </span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-1.5"></div>
              <span>
                <strong>Add new faculty</strong> before assigning them to
                classes in the timetable
              </span>
            </li>
          </ul>
        </div>
      </div>

      {/* Click outside to close dropdown */}
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
          setErrorMsg("");
        }}
        onSuccess={handleEditSuccess}
      />
    </div>
  );
}
