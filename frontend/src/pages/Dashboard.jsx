import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Notebook,
  Plus,
  Upload,
  Edit,
  Trash2,
  X,
  Download,
  Eye,
  Copy,
  MoreVertical,
  FileText,
  Users,
  Clock,
  CalendarDays,
  Search,
  TrendingUp,
  Activity,
  Filter,
  SortAsc,
  ChevronRight,
  Globe,
  BookOpen,
  GraduationCap,
  BarChart3,
  Grid,
  List,
  Building,
  Layers,
  Info,
  Bookmark,
  Ruler,
  Scissors,
  PenTool,
  Palette,
  Compass,
  Book,
  BookmarkCheck,
  ClipboardList,
  StickyNote,
  Highlighter,
} from "lucide-react";
import api from "../configs/api";
import Alert from "../components/Alert";

function Dashboard() {
  const navigate = useNavigate();
  const [allTimetables, setAllTimetables] = useState([]);
  const [branchData, setBranchData] = useState([]); // Aggregated branch data
  const [sem, setSem] = useState("");
  const [branch, setBranch] = useState("");
  const [className, setClassName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [viewMode, setViewMode] = useState("grid"); // grid or list
  const [sortBy, setSortBy] = useState("recent");
  const [filterStatus, setFilterStatus] = useState("all");
  const [alert, setAlert] = useState(null);

  const branches = ["CSE", "CSE(AIML)", "DS", "ECE", "EEE"];
  const semesters = Array.from({ length: 8 }, (_, i) => i + 1);
  const classes = ["D1", "D2", "D3", "D4"];

  // Show alert message
  const showAlert = (main, info, type) => {
    setAlert({ main, info, type });
    setTimeout(() => setAlert(null), 5000);
  };

  const token = localStorage.getItem("token");
  // Aggregate timetables by branch
  // Aggregate timetables by branch
  const aggregateByBranch = (timetables) => {
    const branchMap = {};

    timetables.forEach((timetable) => {
      const key = `${timetable.sem}-${timetable.branch}`;

      if (!branchMap[key]) {
        branchMap[key] = {
          sem: timetable.sem,
          branch: timetable.branch,
          classes: [],
          totalClasses: 0,
          facultyCount: 0,
          totalPeriods: 0,
          timetables: [],
          updatedAt: new Date(timetable.updatedAt),
          status: timetable.status || "active",
          color: timetable.color || "rose",
          createdBy: timetable.createdBy,
          allFaculties: [], // Store all faculty arrays
        };
      }

      // Add class if not already present
      if (!branchMap[key].classes.includes(timetable.class)) {
        branchMap[key].classes.push(timetable.class);
      }

      branchMap[key].totalClasses++;
      branchMap[key].totalPeriods += timetable.periods_per_day || 0;
      branchMap[key].timetables.push(timetable);

      // Collect all faculties
      if (
        timetable.allowed_faculty &&
        Array.isArray(timetable.allowed_faculty)
      ) {
        branchMap[key].allFaculties.push(...timetable.allowed_faculty);
      }

      // Calculate unique faculty count
      const uniqueFaculties = new Set(branchMap[key].allFaculties);
      branchMap[key].facultyCount = uniqueFaculties.size;

      // Use the latest updatedAt
      if (new Date(timetable.updatedAt) > new Date(branchMap[key].updatedAt)) {
        branchMap[key].updatedAt = new Date(timetable.updatedAt);
      }
    });

    // Remove the allFaculties property before returning
    return Object.values(branchMap).map((branchInfo) => {
      const { allFaculties, ...rest } = branchInfo;
      return rest;
    });
  };

  const getRandomCoverColor = () => {
    const colors = [
      "from-amber-100 to-amber-200",
      "from-rose-100 to-rose-200",
      "from-emerald-100 to-emerald-200",
      "from-rose-100 to-rose-200",
      "from-violet-100 to-violet-200",
      "from-cyan-100 to-cyan-200",
      "from-lime-100 to-lime-200",
      "from-pink-100 to-pink-200",
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const fetchTimetables = async () => {
    try {
      const res = await api.get("/api/timetable", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = res.data;

      const enriched = data.map((t) => ({
        ...t,
        className: t.className || t.class,
        status: t.status || "active",
        color: t.color || "yellow",
        updatedAt: new Date(t.updatedAt),
      }));

      setAllTimetables(enriched);
      // Aggregate data by branch
      setBranchData(aggregateByBranch(enriched));
    } catch (err) {
      console.error("Failed to fetch timetables", err);
      const message =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "Something went wrong";
      showAlert(
        "Failed to fetch timetables",
        message,
        "error"
      );
    }
  };

  useEffect(() => {
    fetchTimetables();
  }, []);


  useEffect(() => {
    const handleClickOutside = (event) => {
      if (activeDropdown && !event.target.closest('button')) {
        setActiveDropdown(null);
      }
    };
  
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeDropdown]);
  
  // Filter branch data
  const filteredBranchData = branchData.filter((b) => {
    const matchesSearch =
      b.branch.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.sem.toString().includes(searchQuery);

    const matchesStatus = filterStatus === "all" || b.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  // Sort branch data
  const sortedBranchData = [...filteredBranchData].sort((a, b) => {
    if (sortBy === "recent") {
      return new Date(b.updatedAt) - new Date(a.updatedAt);
    } else if (sortBy === "name") {
      return a.branch.localeCompare(b.branch);
    } else if (sortBy === "sem") {
      return a.sem - b.sem;
    }
    return 0;
  });

  // Delete entire branch timetable
  const deleteBranchTimetable = async (branchInfo) => {
    if (
      !window.confirm(
        `Are you sure you want to delete ALL timetables for ${branchInfo.branch} Semester ${branchInfo.sem}? This will remove ${branchInfo.totalClasses} classes.`
      )
    ) {
      return;
    }

    try {
      // Delete all timetables for this branch and semester
      const deletePromises = branchInfo.timetables.map(async (timetable) => {
        const formData = new FormData();
        formData.append("sem", timetable.sem);
        formData.append("branch", timetable.branch);
        formData.append("class", timetable.className || timetable.class);

        return api.delete("/api/timetable", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          data: formData,
        });
      });

      await Promise.all(deletePromises);
      showAlert(
        "Branch timetables deleted successfully",
        `${branchInfo.totalClasses} classes from ${branchInfo.branch} Semester ${branchInfo.sem} have been removed`,
        "success"
      );

      // Refresh the list
      fetchTimetables();
    } catch (err) {
      console.error(err);
      const message =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "Something went wrong";
      showAlert(
        "Failed to delete timetables",
        message,
        "error"
      );
    }
  };

  // Edit branch timetable - navigate to TimeTable page with all classes
  const handleEditBranchTimetable = (branchInfo) => {
    navigate("/timetable", {
      state: {
        sem: branchInfo.sem,
        branch: branchInfo.branch,
        // Pass first class as default for backward compatibility
        className: branchInfo.classes[0] || "",
        // We'll handle multiple classes in the TimeTable page
      },
    });
  };

  // View branch details - navigate to preview page
  const handleViewBranchDetails = (branchInfo) => {
    navigate("/preview", {
      state: {
        sem: branchInfo.sem,
        branch: branchInfo.branch,
        // Pass all classes in this branch
        classes: branchInfo.classes,
        // Pass the timetables data if needed
        branchInfo: branchInfo,
      },
    });
  };

  const resetForm = () => {
    setSem("");
    setBranch("");
    setClassName("");
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getColorClasses = (color) => {
    const colorMap = {
      yellow: {
        bg: "bg-amber-50",
        border: "border-amber-200",
        text: "text-amber-700",
        light: "bg-gradient-to-r from-amber-100 to-amber-50",
        ribbon: "bg-gradient-to-r from-amber-400 to-amber-300",
      },
      rose: {
        bg: "bg-rose-50",
        border: "border-rose-200",
        text: "text-rose-700",
        light: "bg-gradient-to-r from-rose-100 to-rose-50",
        ribbon: "bg-gradient-to-r from-rose-400 to-rose-300",
      },
      green: {
        bg: "bg-emerald-50",
        border: "border-emerald-200",
        text: "text-emerald-700",
        light: "bg-gradient-to-r from-emerald-100 to-emerald-50",
        ribbon: "bg-gradient-to-r from-emerald-400 to-emerald-300",
      },
      red: {
        bg: "bg-rose-50",
        border: "border-rose-200",
        text: "text-rose-700",
        light: "bg-gradient-to-r from-rose-100 to-rose-50",
        ribbon: "bg-gradient-to-r from-rose-400 to-rose-300",
      },
      purple: {
        bg: "bg-violet-50",
        border: "border-violet-200",
        text: "text-violet-700",
        light: "bg-gradient-to-r from-violet-100 to-violet-50",
        ribbon: "bg-gradient-to-r from-violet-400 to-violet-300",
      },
    };
    return colorMap[color] || colorMap.yellow;
  };

  // Navigate to TimeTable page for creating new
  const handleCreateNew = () => {
    navigate("/timetable");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-rose-50">
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
        <div className="absolute top-20 right-10 w-72 h-72 bg-gradient-to-br from-amber-100 to-transparent rounded-full opacity-40"></div>
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-gradient-to-tr from-rose-100 to-transparent rounded-full opacity-30"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full h-64 bg-gradient-to-r from-transparent via-amber-50/20 to-transparent"></div>

        {/* Stationery Elements */}
        <div className="absolute top-40 left-20 w-24 h-24 border-4 border-amber-200/40 border-dashed rounded-lg rotate-12"></div>
        <div className="absolute bottom-40 right-20 w-16 h-16 border-2 border-rose-200/40 border-dotted rounded-full"></div>
        <div className="absolute top-60 right-40 w-8 h-32 bg-gradient-to-b from-emerald-200/30 to-transparent transform rotate-45"></div>
      </div>

      <div className="relative z-10 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header with Breadcrumb */}
          <div className="mb-8">
            <div className="flex items-center text-sm text-gray-500 mb-4">
              <span className="hover:text-gray-700 cursor-pointer flex items-center gap-1">
                <Bookmark className="w-3 h-3" />
                Dashboard
              </span>
              <ChevronRight className="w-4 h-4 mx-2" />
              <span className="hover:text-gray-700 cursor-pointer flex items-center gap-1">
                <Notebook className="w-3 h-3" />
                Academic
              </span>
              <ChevronRight className="w-4 h-4 mx-2" />
              <span className="font-medium text-amber-600 flex items-center gap-1">
                <ClipboardList className="w-4 h-4" />
                Study Planner
              </span>
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2.5 bg-white rounded-xl shadow-sm border border-gray-100 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-100 to-transparent opacity-60"></div>
                    <div className="relative">
                      <Notebook className="w-6 h-6 text-amber-600" />
                    </div>
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">
                      Study Planner Organizer
                    </h1>
                    <p className="text-gray-600 mt-1">
                      Organize academic schedules like a study binder - each
                      branch is a separate section
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-3 mt-4 md:mt-0">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search planners..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2.5 bg-white border border-gray-300 text-gray-900 placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 w-64 transition-all shadow-sm"
                  />
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Stats Overview with Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300 relative overflow-hidden group">
              <div className="absolute -right-6 -top-6 w-24 h-24 bg-gradient-to-br from-amber-100 to-transparent rounded-full opacity-60 group-hover:opacity-80 transition-opacity"></div>
              <div className="relative">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Study Sections</p>
                    <p className="text-2xl font-bold text-gray-900 mb-2">
                      {[...new Set(branchData.map((b) => b.branch))].length}
                    </p>
                    <div className="flex items-center text-xs text-amber-600">
                      <BookOpen className="w-3 h-3 mr-1" />
                      <span>Organized subjects</span>
                    </div>
                  </div>
                  <div className="p-3 bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl border border-amber-200">
                    <Book className="w-6 h-6 text-amber-600" />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300 relative overflow-hidden group">
              <div className="absolute -right-6 -top-6 w-24 h-24 bg-gradient-to-br from-rose-100 to-transparent rounded-full opacity-60 group-hover:opacity-80 transition-opacity"></div>
              <div className="relative">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Study Groups</p>
                    <p className="text-2xl font-bold text-gray-900 mb-2">
                      {branchData.reduce((acc, b) => acc + b.totalClasses, 0)}
                    </p>
                    <div className="flex items-center text-xs text-rose-600">
                      <Users className="w-3 h-3 mr-1" />
                      <span>Across all sections</span>
                    </div>
                  </div>
                  <div className="p-3 bg-gradient-to-br from-rose-50 to-rose-100 rounded-xl border border-rose-200">
                    <Layers className="w-6 h-6 text-rose-600" />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300 relative overflow-hidden group">
              <div className="absolute -right-6 -top-6 w-24 h-24 bg-gradient-to-br from-emerald-100 to-transparent rounded-full opacity-60 group-hover:opacity-80 transition-opacity"></div>
              <div className="relative">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">
                      Active Planners
                    </p>
                    <p className="text-2xl font-bold text-gray-900 mb-2">
                      {branchData.filter((b) => b.status === "active").length}
                    </p>
                    <div className="flex items-center text-xs text-emerald-600">
                      <BookmarkCheck className="w-3 h-3 mr-1" />
                      <span>Study schedules</span>
                    </div>
                  </div>
                  <div className="p-3 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl border border-emerald-200">
                    <ClipboardList className="w-6 h-6 text-emerald-600" />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300 relative overflow-hidden group">
              <div className="absolute -right-6 -top-6 w-24 h-24 bg-gradient-to-br from-violet-100 to-transparent rounded-full opacity-60 group-hover:opacity-80 transition-opacity"></div>
              <div className="relative">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Tutors</p>
                    <p className="text-2xl font-bold text-gray-900 mb-2">
                      {branchData.reduce((acc, b) => acc + b.facultyCount, 0)}
                    </p>
                    <div className="flex items-center text-xs text-violet-600">
                      <GraduationCap className="w-3 h-3 mr-1" />
                      <span>Across all sections</span>
                    </div>
                  </div>
                  <div className="p-3 bg-gradient-to-br from-violet-50 to-violet-100 rounded-xl border border-violet-200">
                    <PenTool className="w-6 h-6 text-violet-600" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Control Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
            <div className="flex items-center space-x-3">
              <button
                onClick={handleCreateNew}
                className="inline-flex items-center px-5 py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-lg hover:from-amber-700 hover:to-amber-800 transition-all duration-300 shadow-sm hover:shadow-md group"
              >
                <Plus className="w-4 h-4 mr-2 group-hover:rotate-90 transition-transform" />
                New Study Section
              </button>
              {/* <button className="inline-flex items-center px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-300 shadow-sm hover:shadow group">
                <Upload className="w-4 h-4 mr-2 group-hover:-translate-y-0.5 transition-transform" />
                Import Section
              </button>
              <button className="inline-flex items-center px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-300 shadow-sm hover:shadow group">
                <Download className="w-4 h-4 mr-2 group-hover:translate-y-0.5 transition-transform" />
                Export All
              </button> */}
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 bg-white border border-gray-300 rounded-lg p-1">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 rounded transition-colors ${
                    viewMode === "grid"
                      ? "bg-amber-50 text-amber-600 border border-amber-200"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 rounded transition-colors ${
                    viewMode === "list"
                      ? "bg-amber-50 text-amber-600 border border-amber-200"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>

              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 appearance-none cursor-pointer"
                >
                  <option value="recent">Most Recent</option>
                  <option value="name">By Subject</option>
                  <option value="sem">By Semester</option>
                </select>
                <SortAsc className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>

              <div className="relative">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 appearance-none cursor-pointer"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active Only</option>
                  <option value="draft">Draft Only</option>
                </select>
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
            </div>
          </div>

          {/* Branch Grid/List View */}
          {sortedBranchData.length > 0 ? (
            viewMode === "grid" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {sortedBranchData.map((branchInfo) => {
                  const colors = getColorClasses(branchInfo.color);
                  return (
                    <div
                      key={`${branchInfo.sem}-${branchInfo.branch}`}
                      className={`bg-white rounded-xl border-2 ${colors.border} hover:border-amber-400 transition-all duration-300 overflow-hidden group hover:shadow-lg relative`}
                    >
                      {/* Notebook Spine Effect */}
                      <div
                        className={`absolute left-0 top-0 bottom-0 w-3 ${colors.ribbon}`}
                      ></div>

                      {/* Notebook Cover */}
                      <div
                        className={`ml-3 mt-4 mr-4 mb-4 rounded-lg ${branchInfo.coverColor} p-6 border border-gray-200/50 relative overflow-hidden`}
                      >
                        {/* Subtle lines like notebook paper */}
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/10 to-transparent"></div>
                        <div className="relative">
                          {/* Card Header */}
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <div
                                  className={`p-2 rounded-lg ${colors.bg} border ${colors.border}`}
                                >
                                  <BookOpen
                                    className={`w-5 h-5 ${colors.text}`}
                                  />
                                </div>
                                <div>
                                  <h3 className="font-bold text-gray-900 text-lg">
                                    {branchInfo.branch}
                                  </h3>
                                  <p className="text-sm text-gray-600 flex items-center gap-1">
                                    <StickyNote className="w-3 h-3" />
                                    Semester {branchInfo.sem}
                                  </p>
                                </div>
                              </div>
                            </div>

                            <div className="relative">
                              <button
                                onClick={() =>
                                  setActiveDropdown(
                                    activeDropdown ===
                                      `${branchInfo.sem}-${branchInfo.branch}`
                                      ? null
                                      : `${branchInfo.sem}-${branchInfo.branch}`
                                  )
                                }
                                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
                              >
                                <MoreVertical className="w-5 h-5 text-gray-400" />
                              </button>
                              {activeDropdown ===
                                `${branchInfo.sem}-${branchInfo.branch}` && (
                                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                                  <button
                                    onClick={() =>
                                      handleViewBranchDetails(branchInfo)
                                    }
                                    className="flex items-center w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors border-b border-gray-100"
                                  >
                                    <Eye className="w-4 h-4 mr-3 text-gray-500" />
                                    Preview Planner
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleEditBranchTimetable(branchInfo)
                                    }
                                    className="flex items-center w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors border-b border-gray-100"
                                  >
                                    <Edit className="w-4 h-4 mr-3 text-gray-500" />
                                    Edit Section
                                  </button>
                                  <button
                                    onClick={() => {
                                      deleteBranchTimetable(branchInfo);
                                      setActiveDropdown(null);
                                    }}
                                    className="flex items-center w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                  >
                                    <Trash2 className="w-4 h-4 mr-3" />
                                    Delete Section
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Status Badge */}
                          <div className="mb-4">
                            <span
                              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${
                                branchInfo.status === "active"
                                  ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                                  : "bg-amber-100 text-amber-800 border-amber-200"
                              }`}
                            >
                              {branchInfo.status === "active"
                                ? "✓ Active Study"
                                : "✎ In Progress"}
                            </span>
                          </div>

                          {/* Details */}
                          <div className="space-y-3 mb-5">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600 flex items-center gap-1">
                                <Highlighter className="w-3 h-3" />
                                Study Groups
                              </span>
                              <div className="flex flex-wrap justify-end gap-1 max-w-32">
                                {branchInfo.classes
                                  .slice(0, 3)
                                  .map((cls, idx) => (
                                    <span
                                      key={idx}
                                      className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded border border-gray-200"
                                    >
                                      {cls}
                                    </span>
                                  ))}
                                {branchInfo.classes.length > 3 && (
                                  <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded border border-gray-200">
                                    +{branchInfo.classes.length - 3}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600 flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                Total Groups
                              </span>
                              <span className="font-medium text-gray-900">
                                {branchInfo.totalClasses}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600 flex items-center gap-1">
                                <GraduationCap className="w-3 h-3" />
                                Tutors
                              </span>
                              <span className="font-medium text-gray-900">
                                {branchInfo.facultyCount}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                Study Hours/Day
                              </span>
                              <span className="font-medium text-gray-900">
                                {branchInfo.totalPeriods}
                              </span>
                            </div>
                          </div>

                          {/* Footer */}
                          <div className="pt-4 border-t border-gray-200/50">
                            <div className="flex justify-between items-center mb-4">
                              <div className="text-xs text-gray-500 flex items-center gap-1">
                                <CalendarDays className="w-3 h-3" />
                                Updated {formatDate(branchInfo.updatedAt)}
                              </div>
                              <div className="text-xs text-gray-500 flex items-center gap-1">
                                <PenTool className="w-3 h-3" />
                                By {branchInfo.createdBy}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* List View */
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-amber-50 to-amber-100 border-b border-amber-200">
                      <tr>
                        <th className="py-4 px-6 text-left text-xs font-semibold text-amber-800 uppercase tracking-wider">
                          Study Section
                        </th>
                        <th className="py-4 px-6 text-left text-xs font-semibold text-amber-800 uppercase tracking-wider">
                          Groups
                        </th>
                        <th className="py-4 px-6 text-left text-xs font-semibold text-amber-800 uppercase tracking-wider">
                          Tutors
                        </th>
                        <th className="py-4 px-6 text-left text-xs font-semibold text-amber-800 uppercase tracking-wider">
                          Hours/Day
                        </th>
                        <th className="py-4 px-6 text-left text-xs font-semibold text-amber-800 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="py-4 px-6 text-left text-xs font-semibold text-amber-800 uppercase tracking-wider">
                          Last Updated
                        </th>
                        <th className="py-4 px-6 text-left text-xs font-semibold text-amber-800 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {sortedBranchData.map((branchInfo) => {
                        const colors = getColorClasses(branchInfo.color);
                        return (
                          <tr
                            key={`${branchInfo.sem}-${branchInfo.branch}`}
                            className="hover:bg-amber-50/50 transition-colors"
                          >
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-3">
                                <div
                                  className={`p-2 rounded-lg ${colors.bg} border ${colors.border}`}
                                >
                                  <BookOpen
                                    className={`w-5 h-5 ${colors.text}`}
                                  />
                                </div>
                                <div>
                                  <div className="font-bold text-gray-900">
                                    {branchInfo.branch}
                                  </div>
                                  <div className="text-sm text-gray-500 flex items-center gap-1">
                                    <StickyNote className="w-3 h-3" />
                                    Semester {branchInfo.sem}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <div className="flex flex-wrap gap-1">
                                {branchInfo.classes
                                  .slice(0, 3)
                                  .map((cls, idx) => (
                                    <span
                                      key={idx}
                                      className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded border border-gray-200"
                                    >
                                      {cls}
                                    </span>
                                  ))}
                                {branchInfo.classes.length > 3 && (
                                  <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded border border-gray-200">
                                    +{branchInfo.classes.length - 3}
                                  </span>
                                )}
                                <div className="text-xs text-gray-500 mt-1">
                                  Total: {branchInfo.totalClasses}
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-2">
                                <GraduationCap className="w-4 h-4 text-gray-400" />
                                <span>{branchInfo.facultyCount}</span>
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-gray-400" />
                                <span>{branchInfo.totalPeriods}</span>
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <span
                                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${
                                  branchInfo.status === "active"
                                    ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                                    : "bg-amber-100 text-amber-800 border-amber-200"
                                }`}
                              >
                                {branchInfo.status === "active"
                                  ? "Active"
                                  : "Draft"}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-sm text-gray-600 flex items-center gap-1">
                              <CalendarDays className="w-3 h-3" />
                              {formatDate(branchInfo.updatedAt)}
                            </td>
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() =>
                                    handleViewBranchDetails(branchInfo)
                                  }
                                  className="p-2 hover:bg-rose-50 rounded-lg text-rose-600 hover:text-rose-700 transition-colors border border-rose-200 hover:border-rose-300"
                                  title="Preview"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() =>
                                    handleEditBranchTimetable(branchInfo)
                                  }
                                  className="p-2 hover:bg-amber-50 rounded-lg text-amber-600 hover:text-amber-700 transition-colors border border-amber-200 hover:border-amber-300"
                                  title="Edit"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() =>
                                    deleteBranchTimetable(branchInfo)
                                  }
                                  className="p-2 hover:bg-red-50 rounded-lg text-red-600 hover:text-red-700 transition-colors border border-red-200 hover:border-red-300"
                                  title="Delete"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          ) : (
            /* Empty State */
            <div className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-amber-200 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-50/50 to-transparent"></div>
              <div className="relative">
                <div className="inline-block p-6 bg-gradient-to-br from-amber-100 to-amber-50 rounded-2xl mb-6 border border-amber-200">
                  <Notebook className="w-16 h-16 text-amber-500" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  No study planners found
                </h3>
                <p className="text-gray-600 mb-8 max-w-md mx-auto">
                  Create your first study section to start organizing academic
                  schedules in a notebook-style layout
                </p>
                <button
                  onClick={handleCreateNew}
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-lg hover:from-amber-700 hover:to-amber-800 transition-all duration-300 shadow-sm hover:shadow-md group"
                >
                  <Plus className="w-5 h-5 mr-2 group-hover:rotate-90 transition-transform" />
                  Create Study Section
                </button>
              </div>
            </div>
          )}

          {/* Instructions Section */}
          <div className="mt-12 bg-gradient-to-r from-amber-50 to-rose-50 rounded-2xl p-8 border-2 border-amber-200 relative overflow-hidden">
            <div className="absolute top-4 right-4">
              <Bookmark className="w-8 h-8 text-amber-400/40" />
            </div>
            <div className="relative">
              <h3 className="font-bold text-amber-900 mb-6 flex items-center gap-3 text-lg">
                <div className="p-2 bg-gradient-to-br from-amber-100 to-amber-200 rounded-lg">
                  <Compass className="w-5 h-5 text-amber-700" />
                </div>
                Study Planner Guide
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center">
                      <span className="text-xs font-bold text-amber-700">
                        1
                      </span>
                    </div>
                    <h4 className="font-semibold text-amber-800">
                      Create New Section
                    </h4>
                  </div>
                  <p className="text-amber-700 text-sm leading-relaxed">
                    Click "New Study Section" to open the planner editor where
                    you can manage multiple study groups within a section
                    simultaneously.
                  </p>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-rose-100 to-rose-200 flex items-center justify-center">
                      <span className="text-xs font-bold text-rose-700">2</span>
                    </div>
                    <h4 className="font-semibold text-rose-800">
                      Edit Section
                    </h4>
                  </div>
                  <p className="text-rose-700 text-sm leading-relaxed">
                    Click the edit button to open the planner editor with all
                    existing study groups for that section pre-loaded.
                  </p>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-rose-100 to-rose-200 flex items-center justify-center">
                      <span className="text-xs font-bold text-rose-700">3</span>
                    </div>
                    <h4 className="font-semibold text-rose-800">
                      Delete Section
                    </h4>
                  </div>
                  <p className="text-rose-700 text-sm leading-relaxed">
                    Deleting a section will remove ALL study group planners for
                    that branch and semester. This action cannot be undone.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
