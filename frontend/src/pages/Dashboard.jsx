import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
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
          color: timetable.color || "blue",
          createdBy: timetable.createdBy,
        };
      }
      
      branchMap[key].classes.push(timetable.class);
      branchMap[key].totalClasses++;
      branchMap[key].facultyCount += timetable.allowed_faculty.length;
      branchMap[key].totalPeriods += timetable.periods_per_day || 0;
      branchMap[key].timetables.push(timetable);
      
      // Use the latest updatedAt
      if (new Date(timetable.updatedAt) > new Date(branchMap[key].updatedAt)) {
        branchMap[key].updatedAt = new Date(timetable.updatedAt);
      }
    });
    
    return Object.values(branchMap);
  };

  const fetchTimetables = async () => {
    try {
      const res = await api.get("/api/timetable");
      const data = res.data;

      const enriched = data.map((t) => ({
        ...t,
        className: t.className || t.class,
        status: t.status || "active",
        color: t.color || "blue",
        updatedAt: new Date(t.updatedAt),
      }));

      setAllTimetables(enriched);
      // Aggregate data by branch
      setBranchData(aggregateByBranch(enriched));
    } catch (err) {
      console.error("Failed to fetch timetables", err);
      showAlert("Failed to fetch timetables", "Please try again later", "error");
    }
  };

  useEffect(() => {
    fetchTimetables();
  }, []);

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
    if (!window.confirm(`Are you sure you want to delete ALL timetables for ${branchInfo.branch} Semester ${branchInfo.sem}? This will remove ${branchInfo.totalClasses} classes.`)) {
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
      showAlert(
        "Failed to delete timetables",
        "Something went wrong while deleting timetables",
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

  // View branch details - show all classes in this branch
  const handleViewBranchDetails = (branchInfo) => {
    // You could create a view page or show a modal with all classes
    const classList = branchInfo.classes.join(", ");
    alert(`Branch: ${branchInfo.branch} - Semester ${branchInfo.sem}\nClasses: ${classList}\nTotal Classes: ${branchInfo.totalClasses}\nTotal Faculty: ${branchInfo.facultyCount}`);
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
      blue: {
        bg: "bg-blue-50",
        border: "border-blue-200",
        text: "text-blue-700",
        light: "bg-blue-100",
      },
      green: {
        bg: "bg-emerald-50",
        border: "border-emerald-200",
        text: "text-emerald-700",
        light: "bg-emerald-100",
      },
      purple: {
        bg: "bg-violet-50",
        border: "border-violet-200",
        text: "text-violet-700",
        light: "bg-violet-100",
      },
      amber: {
        bg: "bg-amber-50",
        border: "border-amber-200",
        text: "text-amber-700",
        light: "bg-amber-100",
      },
      indigo: {
        bg: "bg-indigo-50",
        border: "border-indigo-200",
        text: "text-indigo-700",
        light: "bg-indigo-100",
      },
    };
    return colorMap[color] || colorMap.blue;
  };

  // Navigate to TimeTable page for creating new
  const handleCreateNew = () => {
    navigate("/timetable");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
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
        <div className="absolute top-20 right-10 w-72 h-72 bg-gradient-to-br from-blue-100 to-transparent rounded-full opacity-40"></div>
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-gradient-to-tr from-emerald-100 to-transparent rounded-full opacity-30"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full h-64 bg-gradient-to-r from-transparent via-indigo-50/20 to-transparent"></div>
      </div>

      <div className="relative z-10 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header with Breadcrumb */}
          <div className="mb-8">
            <div className="flex items-center text-sm text-gray-500 mb-4">
              <span className="hover:text-gray-700 cursor-pointer">
                Dashboard
              </span>
              <ChevronRight className="w-4 h-4 mx-2" />
              <span className="hover:text-gray-700 cursor-pointer">
                Academic
              </span>
              <ChevronRight className="w-4 h-4 mx-2" />
              <span className="font-medium text-blue-600">
                Timetable Management
              </span>
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2.5 bg-white rounded-xl shadow-sm border border-gray-100">
                    <Building className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">
                      Branch Timetable Management
                    </h1>
                    <p className="text-gray-600 mt-1">
                      Manage timetables by branch - each branch includes multiple classes
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-3 mt-4 md:mt-0">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search branches..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2.5 bg-white border border-gray-300 text-gray-900 placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-64 transition-all shadow-sm"
                  />
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Stats Overview with Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Branches</p>
                  <p className="text-2xl font-bold text-gray-900 mb-2">
                    {[...new Set(branchData.map(b => b.branch))].length}
                  </p>
                  <div className="flex items-center text-xs text-emerald-600">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    <span>Organized by branch</span>
                  </div>
                </div>
                <div className="p-3 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
                  <Building className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Classes</p>
                  <p className="text-2xl font-bold text-gray-900 mb-2">
                    {branchData.reduce((acc, b) => acc + b.totalClasses, 0)}
                  </p>
                  <div className="flex items-center text-xs text-blue-600">
                    <Activity className="w-3 h-3 mr-1" />
                    <span>Across all branches</span>
                  </div>
                </div>
                <div className="p-3 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl">
                  <Layers className="w-6 h-6 text-emerald-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Active Schedules</p>
                  <p className="text-2xl font-bold text-gray-900 mb-2">
                    {branchData.filter((b) => b.status === "active").length}
                  </p>
                  <div className="flex items-center text-xs text-amber-600">
                    <FileText className="w-3 h-3 mr-1" />
                    <span>Branch schedules</span>
                  </div>
                </div>
                <div className="p-3 bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl">
                  <CalendarDays className="w-6 h-6 text-amber-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Faculty Involved</p>
                  <p className="text-2xl font-bold text-gray-900 mb-2">
                    {branchData.reduce((acc, b) => acc + b.facultyCount, 0)}
                  </p>
                  <div className="flex items-center text-xs text-violet-600">
                    <Users className="w-3 h-3 mr-1" />
                    <span>Across all branches</span>
                  </div>
                </div>
                <div className="p-3 bg-gradient-to-br from-violet-50 to-violet-100 rounded-xl">
                  <GraduationCap className="w-6 h-6 text-violet-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Control Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
            <div className="flex items-center space-x-3">
              <button
                onClick={handleCreateNew}
                className="inline-flex items-center px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-sm hover:shadow-md"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create New Branch Schedule
              </button>
              <button className="inline-flex items-center px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-300 shadow-sm hover:shadow">
                <Upload className="w-4 h-4 mr-2" />
                Import Branch
              </button>
              <button className="inline-flex items-center px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-300 shadow-sm hover:shadow">
                <Download className="w-4 h-4 mr-2" />
                Export All Branches
              </button>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 bg-white border border-gray-300 rounded-lg p-1">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 rounded ${
                    viewMode === "grid"
                      ? "bg-blue-50 text-blue-600"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 rounded ${
                    viewMode === "list"
                      ? "bg-blue-50 text-blue-600"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="recent">Most Recent</option>
                <option value="name">By Branch Name</option>
                <option value="sem">By Semester</option>
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active Only</option>
                <option value="draft">Draft Only</option>
              </select>
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
                      className={`bg-white rounded-xl border-2 ${colors.border} hover:border-blue-400 transition-all duration-300 overflow-hidden group hover:shadow-lg`}
                    >
                      <div className={`h-2 ${colors.light}`}></div>
                      <div className="p-5">
                        {/* Card Header */}
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <div className={`p-2 rounded-lg ${colors.bg}`}>
                                <Building
                                  className={`w-5 h-5 ${colors.text}`}
                                />
                              </div>
                              <div>
                                <h3 className="font-semibold text-gray-900 text-lg">
                                  {branchInfo.branch}
                                </h3>
                                <p className="text-sm text-gray-600">
                                  Semester {branchInfo.sem}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="relative">
                            <button
                              onClick={() =>
                                setActiveDropdown(
                                  activeDropdown === `${branchInfo.sem}-${branchInfo.branch}` ? null : `${branchInfo.sem}-${branchInfo.branch}`
                                )
                              }
                              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                              <MoreVertical className="w-5 h-5 text-gray-400" />
                            </button>
                            {activeDropdown === `${branchInfo.sem}-${branchInfo.branch}` && (
                              <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                                <button
                                  onClick={() => handleViewBranchDetails(branchInfo)}
                                  className="flex items-center w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                  <Eye className="w-4 h-4 mr-3 text-gray-500" />
                                  View Details
                                </button>
                                <button
                                  onClick={() => handleEditBranchTimetable(branchInfo)}
                                  className="flex items-center w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                  <Edit className="w-4 h-4 mr-3 text-gray-500" />
                                  Edit Branch Schedule
                                </button>
                                <button
                                  onClick={() => {
                                    deleteBranchTimetable(branchInfo);
                                    setActiveDropdown(null);
                                  }}
                                  className="flex items-center w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                >
                                  <Trash2 className="w-4 h-4 mr-3" />
                                  Delete Entire Branch
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Status Badge */}
                        <div className="mb-4">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                              branchInfo.status === "active"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {branchInfo.status === "active" ? "● Active" : "○ Draft"}
                          </span>
                        </div>

                        {/* Details */}
                        <div className="space-y-3 mb-5">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Classes</span>
                            <div className="flex flex-wrap justify-end gap-1 max-w-32">
                              {branchInfo.classes.slice(0, 3).map((cls, idx) => (
                                <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                                  {cls}
                                </span>
                              ))}
                              {branchInfo.classes.length > 3 && (
                                <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded">
                                  +{branchInfo.classes.length - 3}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">
                              Total Classes
                            </span>
                            <span className="font-medium text-gray-900">
                              {branchInfo.totalClasses}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">
                              Faculty
                            </span>
                            <span className="font-medium text-gray-900">
                              {branchInfo.facultyCount}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">
                              Total Periods/Day
                            </span>
                            <span className="font-medium text-gray-900">
                              {branchInfo.totalPeriods}
                            </span>
                          </div>
                        </div>

                        {/* Footer */}
                        <div className="pt-4 border-t border-gray-100">
                          <div className="flex justify-between items-center mb-4">
                            <div className="text-xs text-gray-500">
                              Updated {formatDate(branchInfo.updatedAt)}
                            </div>
                            <div className="text-xs text-gray-500">
                              By {branchInfo.createdBy}
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
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="py-3 px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Branch
                        </th>
                        <th className="py-3 px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Classes
                        </th>
                        <th className="py-3 px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Faculty
                        </th>
                        <th className="py-3 px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Periods/Day
                        </th>
                        <th className="py-3 px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="py-3 px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Last Updated
                        </th>
                        <th className="py-3 px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
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
                            className="hover:bg-gray-50 transition-colors"
                          >
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${colors.bg}`}>
                                  <Building
                                    className={`w-5 h-5 ${colors.text}`}
                                  />
                                </div>
                                <div>
                                  <div className="font-medium text-gray-900">
                                    {branchInfo.branch}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    Semester {branchInfo.sem}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <div className="flex flex-wrap gap-1">
                                {branchInfo.classes.slice(0, 3).map((cls, idx) => (
                                  <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                                    {cls}
                                  </span>
                                ))}
                                {branchInfo.classes.length > 3 && (
                                  <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded">
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
                                <Users className="w-4 h-4 text-gray-400" />
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
                                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                                  branchInfo.status === "active"
                                    ? "bg-emerald-100 text-emerald-800"
                                    : "bg-amber-100 text-amber-800"
                                }`}
                              >
                                {branchInfo.status === "active" ? "Active" : "Draft"}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-sm text-gray-600">
                              {formatDate(branchInfo.updatedAt)}
                            </td>
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-2">
                                <button 
                                  onClick={() => handleViewBranchDetails(branchInfo)}
                                  className="p-2 hover:bg-blue-50 rounded-lg text-blue-600 hover:text-blue-700 transition-colors"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleEditBranchTimetable(branchInfo)}
                                  className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 hover:text-gray-700 transition-colors"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => deleteBranchTimetable(branchInfo)}
                                  className="p-2 hover:bg-red-50 rounded-lg text-red-600 hover:text-red-700 transition-colors"
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
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
              <div className="inline-block p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl mb-6">
                <Building className="w-16 h-16 text-blue-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                No branch timetables found
              </h3>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                Create your first branch timetable to start organizing academic schedules across multiple classes
              </p>
              <button
                onClick={handleCreateNew}
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-sm hover:shadow-md"
              >
                <Plus className="w-5 h-5 mr-2" />
                Create Branch Timetable
              </button>
            </div>
          )}

          {/* Instructions Section */}
          <div className="mt-12 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
            <h3 className="font-semibold text-blue-900 mb-4 flex items-center gap-2">
              <Info className="w-5 h-5" />
              How to Use Branch Timetables
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-3">
                <h4 className="font-medium text-blue-800">Create New</h4>
                <p className="text-blue-700 text-sm">
                  Click "Create New Branch Schedule" to open the timetable editor where you can manage multiple classes within a branch simultaneously.
                </p>
              </div>
              <div className="space-y-3">
                <h4 className="font-medium text-blue-800">Edit Branch</h4>
                <p className="text-blue-700 text-sm">
                  Click the edit button to open the timetable editor with all existing classes for that branch pre-loaded.
                </p>
              </div>
              <div className="space-y-3">
                <h4 className="font-medium text-blue-800">Delete Branch</h4>
                <p className="text-blue-700 text-sm">
                  Deleting a branch will remove ALL class timetables for that branch and semester. This action cannot be undone.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;