import React, { useState, useEffect } from "react";
import {
  RefreshCw,
  Calendar,
  Users,
  GraduationCap,
  Clock,
  Search,
  Repeat,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  ArrowRightLeft,
  UserCheck,
  Loader2,
  Info,
  Zap,
  Shield,
  Copy,
  X,
  UserCircle,
  Check,
  ArrowRight,
  GitBranch,
  Bell,
  CalendarDays,
  BookOpen,
  PenTool,
  Highlighter,
  StickyNote,
  Compass,
  Notebook,
  Scissors,
  Layers,
  Ruler,
  Bookmark,
  FileText,
} from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format, parse } from "date-fns";
import api from "../configs/api";
import Alert from "../components/Alert";

export default function ReplaceLecture() {
  const days = [
    { value: "mon", label: "Monday" },
    { value: "tue", label: "Tuesday" },
    { value: "wed", label: "Wednesday" },
    { value: "thu", label: "Thursday" },
    { value: "fri", label: "Friday" },
    { value: "sat", label: "Saturday" },
  ];

  const timeSlots = [
    { value: 0, label: "9:00 AM - 10:00 AM" },
    { value: 1, label: "10:00 AM - 11:00 AM" },
    { value: 2, label: "11:45 AM - 12:45 PM" },
    { value: 3, label: "12:45 PM - 1:45 PM" },
    { value: 4, label: "2:00 PM - 3:00 PM" },
  ];

  // Get today's date and day
  const today = new Date();
  const todayDate = today.toISOString().split("T")[0];
  const todayDayIndex = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const todayDay =
    todayDayIndex === 0
      ? "sun"
      : todayDayIndex === 1
      ? "mon"
      : todayDayIndex === 2
      ? "tue"
      : todayDayIndex === 3
      ? "wed"
      : todayDayIndex === 4
      ? "thu"
      : todayDayIndex === 5
      ? "fri"
      : "sat";

  const [formData, setFormData] = useState({
    date: todayDate,
    day: days.find((d) => d.value === todayDay)?.value || "",
    class: "",
    sem: 1,
    branch: "CSE",
    lec_no: "",
  });

  //token declared
  const token = localStorage.getItem("token");

  const [isLoading, setIsLoading] = useState(false);
  const [isRearranging, setIsRearranging] = useState(false);
  const [isFetchingFaculty, setIsFetchingFaculty] = useState(false);
  const [isFetchingOptions, setIsFetchingOptions] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [isExecutingSwap, setIsExecutingSwap] = useState(false);
  const [result, setResult] = useState(null);
  const [availableFaculty, setAvailableFaculty] = useState([]);
  const [rearrangeOptions, setRearrangeOptions] = useState([]);
  const [selectedFaculty, setSelectedFaculty] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [showClassToast, setShowClassToast] = useState(false);
  const [classToastMessages, setClassToastMessages] = useState([]);
  const [currentToastIndex, setCurrentToastIndex] = useState(0);
  const [showAlert, setShowAlert] = useState(false);
  const [alertData, setAlertData] = useState({ main: "", info: "" });
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Function to get day name from date string
  const getDayFromDate = (dateString) => {
    const date = new Date(dateString);
    const dayIndex = date.getDay();

    // Map JavaScript day index to your day values
    const dayMap = {
      0: "sun", // Sunday
      1: "mon", // Monday
      2: "tue", // Tuesday
      3: "wed", // Wednesday
      4: "thu", // Thursday
      5: "fri", // Friday
      6: "sat", // Saturday
    };

    return dayMap[dayIndex] || "";
  };

  // Function to get date for a specific day of the week
  const getDateForDay = (dayValue) => {
    const today = new Date();
    const currentDayIndex = today.getDay(); // 0 = Sunday, 1 = Monday, etc.

    // Map your day values to JavaScript day indices
    const dayValueToIndex = {
      sun: 0,
      mon: 1,
      tue: 2,
      wed: 3,
      thu: 4,
      fri: 5,
      sat: 6,
    };

    const targetDayIndex = dayValueToIndex[dayValue];

    if (targetDayIndex === undefined) return todayDate;

    // Calculate the difference in days
    let diff = targetDayIndex - currentDayIndex;

    // If the target day is earlier in the week, move to next week
    if (diff < 0) {
      diff += 7;
    }

    // If same day, use today
    if (diff === 0) {
      return todayDate;
    }

    // Calculate the target date
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + diff);

    return targetDate.toISOString().split("T")[0];
  };

  // Function to show alert
  const showAlertMessage = (main, info, type = "success") => {
    setAlertData({ main, info, type });
    setShowAlert(true);
  };

  // Function to hide alert
  const hideAlert = () => {
    setShowAlert(false);
    setAlertData({ main: "", info: "" });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => {
      const newData = {
        ...prev,
        [name]: name === "sem" || name === "lec_no" ? parseInt(value) : value,
      };

      // Auto-sync date and day
      if (name === "date" && value) {
        // Update day based on selected date
        const selectedDay = getDayFromDate(value);
        newData.day = selectedDay;
      } else if (name === "day" && value) {
        // Update date based on selected day
        const selectedDate = getDateForDay(value);
        newData.date = selectedDate;
      }

      return newData;
    });

    setResult(null);
    setAvailableFaculty([]);
    setRearrangeOptions([]);
    setSelectedFaculty(null);
    setSelectedOption(null);
    setErrorMsg("");
    setSuccessMsg("");
    setShowClassToast(false);
    setClassToastMessages([]);
    setShowAlert(false);
  };

  // Update form when component mounts or when today changes
  useEffect(() => {
    const today = new Date();
    const todayDate = today.toISOString().split("T")[0];
    const todayDay = getDayFromDate(todayDate);

    setFormData((prev) => ({
      ...prev,
      date: todayDate,
      day: todayDay,
    }));
  }, []);

  const handleFetchAvailableFaculty = async () => {
    if (
      !formData.date ||
      !formData.day ||
      !formData.class ||
      !formData.sem ||
      !formData.branch ||
      formData.lec_no === ""
    ) {
      showAlertMessage(
        "Validation Error",
        "Please fill all required fields",
        "error"
      );
      return;
    }

    setIsFetchingFaculty(true);
    setAvailableFaculty([]);
    setRearrangeOptions([]);
    setSelectedFaculty(null);
    setSelectedOption(null);
    setResult(null);
    setErrorMsg("");
    setSuccessMsg("");
    setShowClassToast(false);
    setClassToastMessages([]);
    setShowAlert(false);

    try {
      const response = await api.post("/api/get-available-faculty",formData,{
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        setAvailableFaculty(response.data.available_faculty);
        showAlertMessage(
          "Available Tutors Found",
          `Found ${response.data.count} available tutor(s)`,
          "success"
        );
      } else {
        showAlertMessage(
          "Failed to Fetch Tutors",
          response.data.message || "Failed to fetch available tutors",
          "error"
        );
      }
    } catch (error) {
      console.error("Error fetching available faculty:", error);
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Something went wrong";
      showAlertMessage("Error fetching available faculty", message, "error");

      if (error.response) {
        const { status, data } = error.response;
        if (status === 404) {
          showAlertMessage(
            "Study Group Not Found",
            data.message || "Study group not found",
            "error"
          );
        } else if (status === 409) {
          showAlertMessage(
            "No Tutors Available",
            data.message || "No tutors available for this study session",
            "error"
          );
        } else {
          showAlertMessage(
            "Failed to Fetch Tutors",
            data.message || "Failed to fetch available tutors",
            "error"
          );
        }
      } else {
        showAlertMessage(
          "Network Error",
          "Network error. Please try again.",
          "error"
        );
      }
    } finally {
      setIsFetchingFaculty(false);
    }
  };

  const handleFetchRearrangeOptions = async () => {
    if (
      !formData.date ||
      !formData.day ||
      !formData.class ||
      !formData.sem ||
      !formData.branch ||
      formData.lec_no === ""
    ) {
      showAlertMessage(
        "Validation Error",
        "Please fill all required fields",
        "error"
      );
      return;
    }

    setIsFetchingOptions(true);
    setRearrangeOptions([]);
    setAvailableFaculty([]);
    setSelectedOption(null);
    setSelectedFaculty(null);
    setResult(null);
    setErrorMsg("");
    setSuccessMsg("");
    setShowClassToast(false);
    setClassToastMessages([]);
    setShowAlert(false);

    try {
      const response = await api.post("/api/get-rearrange-options",formData,{
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        setRearrangeOptions(response.data.options);
        showAlertMessage(
          "Reschedule Options Found",
          `Found ${response.data.count} possible reschedule option(s)`,
          "success"
        );
      } else {
        showAlertMessage(
          "Failed to Fetch Options",
          response.data.message || "Failed to fetch reschedule options",
          "error"
        );
      }
    } catch (error) {
      console.error("Error fetching rearrange options:", error);
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Something went wrong";
      showAlertMessage("Error fetching rearrange options", message, "error");

      if (error.response) {
        const { status, data } = error.response;
        if (status === 404) {
          showAlertMessage(
            "Study Group Not Found",
            data.message || "Study group not found",
            "error"
          );
        } else if (status === 409) {
          showAlertMessage(
            "No Reschedule Options",
            data.message || "No possible reschedule options found",
            "error"
          );
        } else {
          showAlertMessage(
            "Failed to Fetch Options",
            data.message || "Failed to fetch reschedule options",
            "error"
          );
        }
      } else {
        showAlertMessage(
          "Network Error",
          "Network error. Please try again.",
          "error"
        );
      }
    } finally {
      setIsFetchingOptions(false);
    }
  };

  const handleExecuteRearrange = async () => {
    if (!selectedOption) {
      showAlertMessage(
        "Selection Required",
        "Please select a reschedule option",
        "error"
      );
      return;
    }

    setIsExecutingSwap(true);
    setErrorMsg("");
    setSuccessMsg("");
    setShowClassToast(false);
    setClassToastMessages([]);
    setShowAlert(false);

    try {
      const response = await api.post("/api/execute-rearrange", {
        ...formData,
        primary_faculty_id: selectedOption.primary_faculty.id,
        secondary_faculty_id: selectedOption.secondary_faculty.id,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );


      if (response.data.success) {
        setResult(response.data);

        // If it's a rearrangement, show multiple toasts for affected classes
        if (
          response.data.type === "rearranged" &&
          response.data.affected_classes
        ) {
          const messages = response.data.affected_classes.map((cls) => ({
            class: `${cls.branch}-${cls.class}-Sem${cls.sem}`,
            message: cls.message,
            faculty: cls.new_faculty,
          }));

          setClassToastMessages(messages);
          setCurrentToastIndex(0);
          setShowClassToast(true);
        } else {
          // For direct assignments, show single toast
          const message =
            response.data.message || "Study session successfully assigned!";
          setToastMessage(message);
          setShowToast(true);
        }

        // Show success alert
        showAlertMessage(
          "Operation Successful",
          response.data.message || "Study session rescheduled successfully",
          "success"
        );

        setRearrangeOptions([]);
        setSelectedOption(null);
      } else {
        showAlertMessage(
          "Failed to Execute Reschedule",
          response.data.message || "Failed to execute reschedule",
          "error"
        );
      }
    } catch (error) {
      console.error("Error executing rearrangement:", error);
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Something went wrong";
      showAlertMessage("Error executing rearrangement", message, "error");


      if (error.response) {
        const { status, data } = error.response;
        if (status === 404) {
          showAlertMessage(
            "Tutor Not Found",
            data.message || "Tutor not found",
            "error"
          );
        } else if (status === 409) {
          showAlertMessage(
            "Reschedule Not Possible",
            data.message || "Reschedule no longer possible",
            "error"
          );
        } else {
          showAlertMessage(
            "Failed to Execute Reschedule",
            data.message || "Failed to execute reschedule",
            "error"
          );
        }
      } else {
        showAlertMessage(
          "Network Error",
          "Network error. Please try again.",
          "error"
        );
      }
    } finally {
      setIsExecutingSwap(false);
    }
  };

  const handleAssignFaculty = async () => {
    if (!selectedFaculty) {
      showAlertMessage(
        "Selection Required",
        "Please select a tutor to assign",
        "error"
      );
      return;
    }

    setIsAssigning(true);
    setErrorMsg("");
    setSuccessMsg("");
    setShowClassToast(false);
    setClassToastMessages([]);
    setShowAlert(false);

    try {
      const response = await api.post("/api/assign-faculty", {
        ...formData,
        faculty_id: selectedFaculty.faculty_id,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        setResult(response.data);

        const message =
          response.data.message || "Study session successfully assigned!";

        // Show success alert
        showAlertMessage("Assignment Successful", message, "success");

        setToastMessage(message);
        setShowToast(true);

        setAvailableFaculty([]);
        setSelectedFaculty(null);
      } else {
        showAlertMessage(
          "Failed to Assign Tutor",
          response.data.message || "Failed to assign tutor",
          "error"
        );
      }
    } catch (error) {
      console.error("Error assigning faculty:", error);
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Something went wrong";
      showAlertMessage("Error assigning faculty:", message, "error");

      if (error.response) {
        const { status, data } = error.response;
        if (status === 403) {
          showAlertMessage(
            "Tutor Not Allowed",
            data.message || "Tutor not allowed for this study group",
            "error"
          );
        } else if (status === 409) {
          showAlertMessage(
            "Tutor No Longer Available",
            data.message || "Tutor is no longer available",
            "error"
          );
        } else {
          showAlertMessage(
            "Failed to Assign Tutor",
            data.message || "Failed to assign tutor",
            "error"
          );
        }
      } else {
        showAlertMessage(
          "Network Error",
          "Network error. Please try again.",
          "error"
        );
      }
    } finally {
      setIsAssigning(false);
    }
  };

  const handleSubmit = async (action = "replace") => {
    if (
      !formData.date ||
      !formData.day ||
      !formData.class ||
      !formData.sem ||
      !formData.branch ||
      formData.lec_no === ""
    ) {
      showAlertMessage(
        "Validation Error",
        "Please fill all required fields",
        "error"
      );
      return;
    }

    const isRearrange = action === "rearrange";
    setIsLoading(true);
    setIsRearranging(isRearrange);
    setResult(null);
    setAvailableFaculty([]);
    setRearrangeOptions([]);
    setSelectedFaculty(null);
    setSelectedOption(null);
    setErrorMsg("");
    setSuccessMsg("");
    setShowClassToast(false);
    setClassToastMessages([]);
    setShowAlert(false);

    try {
      const endpoint = isRearrange
        ? "/api/rearrange-lecture"
        : "/api/replace-lecture";
      const response = await api.post(endpoint,formData,{
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        setResult(response.data);

        // Handle different notification types
        if (
          response.data.type === "rearranged" &&
          response.data.affected_classes
        ) {
          const messages = response.data.affected_classes.map((cls) => ({
            class: `${cls.branch}-${cls.class}-Sem${cls.sem}`,
            message: cls.message,
            faculty: cls.new_faculty,
          }));

          setClassToastMessages(messages);
          setCurrentToastIndex(0);
          setShowClassToast(true);
        } else {
          const message =
            response.data.message || "Study session successfully managed!";
          setToastMessage(message);
          setShowToast(true);
        }

        // Show success alert
        showAlertMessage(
          "Operation Successful",
          response.data.message || "Study session updated successfully",
          "success"
        );
      } else {
        showAlertMessage(
          "Operation Failed",
          response.data.message ||
            `Failed to ${isRearrange ? "reschedule" : "replace"} study session`,
          "error"
        );
      }
    } catch (error) {
      console.error(
        `Error ${isRearrange ? "rescheduling" : "replacing"} study session:`,
        error
      );
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Something went wrong";
      showAlertMessage(`Error ${isRearrange ? "rescheduling" : "replacing"} study session:`, message, "error");

      if (error.response) {
        const { status, data } = error.response;
        if (status === 404) {
          showAlertMessage(
            "Study Group Not Found",
            data.message || "Study group not found",
            "error"
          );
        } else if (status === 409) {
          showAlertMessage(
            "No Options Available",
            data.message ||
              (isRearrange
                ? "No possible reschedule found"
                : "No tutors available at this time slot"),
            "error"
          );
        } else {
          showAlertMessage(
            "Operation Failed",
            data.message ||
              `Failed to ${
                isRearrange ? "reschedule" : "replace"
              } study session`,
            "error"
          );
        }
      } else {
        showAlertMessage(
          "Network Error",
          "Network error. Please try again.",
          "error"
        );
      }
    } finally {
      setIsLoading(false);
      setIsRearranging(false);
    }
  };

  const handleReset = () => {
    const today = new Date();
    const todayDate = today.toISOString().split("T")[0];
    const todayDay = getDayFromDate(todayDate);

    setFormData({
      date: todayDate,
      day: todayDay,
      class: "",
      sem: 1,
      branch: "CSE",
      lec_no: "",
    });
    setResult(null);
    setAvailableFaculty([]);
    setRearrangeOptions([]);
    setSelectedFaculty(null);
    setSelectedOption(null);
    setErrorMsg("");
    setSuccessMsg("");
    setShowClassToast(false);
    setClassToastMessages([]);
    setShowAlert(false);
  };

  const copyToClipboard = () => {
    const textToCopy =
      result?.message ||
      `Study Session Replacement Result:
Date: ${formData.date}
Assigned Tutor: ${result?.assigned_faculty || "N/A"}
Tutor Name: ${result?.faculty_name || "N/A"}
Day: ${days.find((d) => d.value === formData.day)?.label || formData.day}
Study Group: ${formData.class}
Semester: ${formData.sem}
Subject: ${formData.branch}
Time Slot: ${
        timeSlots.find((t) => t.value === parseInt(formData.lec_no))?.label
      }
Slot Index: ${formData.lec_no}
Method: ${
        result?.type === "rearranged"
          ? "Session Reschedule"
          : result?.type === "direct"
          ? "Direct Assignment"
          : "Standard Replacement"
      }
Status: Successfully Completed`;

    navigator.clipboard.writeText(textToCopy).then(() => {
      const copyBtn = document.getElementById("copy-toast-btn");
      if (copyBtn) {
        const originalHtml = copyBtn.innerHTML;
        copyBtn.innerHTML = `
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
          </svg>
          <span>Copied!</span>
        `;
        setTimeout(() => {
          copyBtn.innerHTML = originalHtml;
        }, 2000);
      }
    });
  };

  const copySuccessMessage = () => {
    navigator.clipboard.writeText(toastMessage).then(() => {
      const toastCopyBtn = document.getElementById("toast-copy-btn");
      if (toastCopyBtn) {
        const originalHtml = toastCopyBtn.innerHTML;
        toastCopyBtn.innerHTML = `
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
          </svg>
          <span>Copied!</span>
        `;
        setTimeout(() => {
          toastCopyBtn.innerHTML = originalHtml;
        }, 2000);
      }
    });
  };

  const copyClassMessage = () => {
    if (classToastMessages.length === 0) return;

    const currentMessage = classToastMessages[currentToastIndex];
    navigator.clipboard.writeText(currentMessage.message).then(() => {
      const classCopyBtn = document.getElementById("class-toast-copy-btn");
      if (classCopyBtn) {
        const originalHtml = classCopyBtn.innerHTML;
        classCopyBtn.innerHTML = `
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
          </svg>
          <span>Copied!</span>
        `;
        setTimeout(() => {
          classCopyBtn.innerHTML = originalHtml;
        }, 2000);
      }
    });
  };

  const goToNextClassToast = () => {
    if (currentToastIndex < classToastMessages.length - 1) {
      setCurrentToastIndex(currentToastIndex + 1);
    } else {
      setShowClassToast(false);
    }
  };

  const goToPrevClassToast = () => {
    if (currentToastIndex > 0) {
      setCurrentToastIndex(currentToastIndex - 1);
    }
  };

  const formatMessage = (message) => {
    if (!message) return "";
    return message.split("\n").map((line, index) => (
      <React.Fragment key={index}>
        {line}
        {index < message.split("\n").length - 1 && <br />}
      </React.Fragment>
    ));
  };

  const branchOptions = ["CSE", "CSE(AIML)", "DS", "ECE", "EEE", "ME", "CE"];

  // Generate time slot options (1-5 as requested)
  const timeSlotOptions = [
    { value: 0, label: "Study Session 1" },
    { value: 1, label: "Study Session 2" },
    { value: 2, label: "Study Session 3" },
    { value: 3, label: "Study Session 4" },
    { value: 4, label: "Study Session 5" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-blue-50 p-4 md:p-6">
      {/* Decorative Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-amber-100 to-transparent rounded-full opacity-20"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-blue-100 to-transparent rounded-full opacity-10"></div>
      </div>

      {/* Regular Toast Notification */}
      {showToast && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in">
          <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-xl shadow-lg border border-emerald-500 overflow-hidden max-w-md">
            <div className="flex items-start p-4">
              <div className="flex-shrink-0 mt-0.5">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div className="ml-3 flex-1">
                <p className="font-bold">Study Session Updated Successfully</p>
                <div className="text-emerald-100 text-sm mt-1 whitespace-pre-line font-mono">
                  {formatMessage(toastMessage)}
                </div>
              </div>
              <div className="ml-4 flex items-center gap-2">
                <button
                  id="toast-copy-btn"
                  onClick={copySuccessMessage}
                  className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-white rounded-lg text-sm font-bold transition-colors border border-emerald-600"
                >
                  <Copy className="w-4 h-4" />
                  <span>Copy</span>
                </button>
                <button
                  onClick={() => setShowToast(false)}
                  className="p-1 hover:bg-emerald-500 rounded-lg transition-colors border border-emerald-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="h-1 bg-emerald-500">
              <div className="h-full bg-white animate-progress"></div>
            </div>
          </div>
        </div>
      )}

      {/* Multi-class Toast Notification for Rearrangements */}
      {showClassToast && classToastMessages.length > 0 && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in">
          <div className="bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-xl shadow-lg border border-amber-500 overflow-hidden max-w-md">
            <div className="flex items-start p-4">
              <div className="flex-shrink-0 mt-0.5">
                <Bell className="w-5 h-5" />
              </div>
              <div className="ml-3 flex-1">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-bold">
                    Session Reschedule ({currentToastIndex + 1}/
                    {classToastMessages.length})
                  </p>
                  <span className="px-2 py-0.5 bg-amber-500 text-white rounded text-xs font-bold">
                    {classToastMessages[currentToastIndex].class}
                  </span>
                </div>
                <div className="text-amber-100 text-sm mt-1 whitespace-pre-line font-mono">
                  {formatMessage(classToastMessages[currentToastIndex].message)}
                </div>
              </div>
              <div className="ml-4 flex items-center gap-2">
                <button
                  id="class-toast-copy-btn"
                  onClick={copyClassMessage}
                  className="flex items-center gap-1 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-white rounded-lg text-sm font-bold transition-colors border border-amber-600"
                >
                  <Copy className="w-4 h-4" />
                  <span>Copy</span>
                </button>
                <div className="flex items-center gap-1">
                  {currentToastIndex > 0 && (
                    <button
                      onClick={goToPrevClassToast}
                      className="p-1 hover:bg-amber-500 rounded-lg transition-colors border border-amber-600"
                    >
                      <ChevronRight className="w-4 h-4 rotate-180" />
                    </button>
                  )}
                  <button
                    onClick={goToNextClassToast}
                    className="p-1 hover:bg-amber-500 rounded-lg transition-colors border border-amber-600"
                  >
                    {currentToastIndex < classToastMessages.length - 1 ? (
                      <ChevronRight className="w-4 h-4" />
                    ) : (
                      <X className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
            <div className="h-1 bg-amber-500">
              <div className="h-full bg-white animate-progress"></div>
            </div>
          </div>
        </div>
      )}

      {/* Alert Component for Success/Error Messages */}
      {showAlert && (
        <div className="fixed top-20 right-4 z-50 animate-slide-in">
          <Alert
            main={alertData.main}
            info={alertData.info}
            type={alertData.type}
            onClose={hideAlert}
          />
        </div>
      )}

      <div className="relative z-10 max-w-6xl mx-auto">
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
            <span className="font-bold text-amber-600 flex items-center gap-1">
              <Scissors className="w-4 h-4" />
              Study Session Management
            </span>
          </div>
        </div>

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 bg-white rounded-xl shadow-sm border border-amber-100">
                <Scissors className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Study Session Management
                </h1>
                <p className="text-gray-600">
                  Find available tutors or reschedule existing sessions to
                  manage study schedule conflicts
                </p>
              </div>
            </div>
          </div>
          <div className="p-3 bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl border border-amber-200">
            <Clock className="w-6 h-6 text-amber-600" />
          </div>
        </div>

        {/* Main Form Card */}
        <div className="bg-white rounded-2xl border border-amber-200 shadow-sm overflow-hidden mb-8">
          <div className="p-6 border-b border-amber-100 bg-gradient-to-r from-amber-50 to-amber-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-lg border border-amber-200">
                <Compass className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-amber-900">
                  Session Details
                </h2>
                <p className="text-sm text-amber-700 mt-1">
                  Select the study session you want to manage. Date and day are
                  auto-synced.
                </p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Date Selection - UPDATED with minDate */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-amber-500" />
                  Date
                  <span className="ml-auto text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
                    Auto-sync
                  </span>
                </label>
                <DatePicker
                  selected={
                    formData.date ? new Date(formData.date) : new Date()
                  }
                  onChange={(date) => {
                    if (date) {
                      const year = date.getFullYear();
                      const month = String(date.getMonth() + 1).padStart(
                        2,
                        "0"
                      );
                      const day = String(date.getDate()).padStart(2, "0");
                      const dateString = `${year}-${month}-${day}`;
                      const selectedDay = getDayFromDate(dateString);

                      setFormData((prev) => ({
                        ...prev,
                        date: dateString,
                        day: selectedDay,
                      }));
                    }
                  }}
                  minDate={new Date()} // Add this line to prevent past dates
                  dateFormat="dd/MM/yyyy"
                  placeholderText="DD/MM/YYYY"
                  className="w-135 px-4 py-3 bg-white border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Selecting a date will automatically update the day
                </p>
              </div>

              {/* Day Selection - Also updated to prevent selecting days in the past */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-amber-500" />
                  Day
                  <span className="ml-auto text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
                    Auto-sync
                  </span>
                </label>
                <select
                  name="day"
                  value={formData.day}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-white border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                >
                  <option value="" className="text-gray-500">
                    Select Day
                  </option>
                  {days.map((day) => {
                    // Check if this day is in the past
                    const dateForThisDay = getDateForDay(day.value);
                    const isPastDate = new Date(dateForThisDay) < new Date();
                    const isToday = dateForThisDay === todayDate;

                    return (
                      <option
                        key={day.value}
                        value={day.value}
                        disabled={isPastDate && !isToday} // Disable past days except today
                      >
                        {day.label} {isToday ? "(Today)" : ""}
                        {isPastDate && !isToday ? " (Past)" : ""}
                      </option>
                    );
                  })}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Day is auto-calculated from the selected date, but you can
                  also select manually
                </p>
              </div>

              {/* Class Name */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                  <Users className="w-4 h-4 text-violet-500" />
                  Study Group
                </label>
                <select
                  name="class"
                  value={formData.class}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-white border border-violet-200 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all"
                >
                  <option value="" className="text-gray-500">
                    Select Study Group
                  </option>
                  {[
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
                  ].map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              {/* Semester */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-emerald-500" />
                  Semester
                </label>
                <select
                  name="sem"
                  value={formData.sem}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-white border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                    <option key={s} value={s}>
                      Semester {s}
                    </option>
                  ))}
                </select>
              </div>

              {/* Branch */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-blue-500" />
                  Subject
                </label>
                <select
                  name="branch"
                  value={formData.branch}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-white border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                >
                  {branchOptions.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>

              {/* Time Slot Selection - Changed to dropdown */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-orange-500" />
                  Study Session
                </label>
                <select
                  name="lec_no"
                  value={formData.lec_no}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-white border border-orange-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                >
                  <option value="" className="text-gray-500">
                    Select Study Session
                  </option>
                  {timeSlotOptions.map((slot) => (
                    <option key={slot.value} value={slot.value}>
                      {slot.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-8 pt-6 border-t border-amber-200">
              <div className="flex flex-wrap gap-4 justify-center">
                <button
                  type="button"
                  onClick={handleFetchAvailableFaculty}
                  disabled={
                    isFetchingFaculty ||
                    formData.lec_no === "" ||
                    isNaN(formData.lec_no)
                  }
                  className={`px-6 py-3 rounded-lg font-bold flex items-center gap-2 transition-all duration-300 border ${
                    isFetchingFaculty
                      ? "bg-violet-100 text-violet-400 cursor-not-allowed border-violet-300"
                      : formData.lec_no === "" || isNaN(formData.lec_no)
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed border-gray-300"
                      : "bg-gradient-to-r from-violet-600 to-violet-700 text-white hover:from-violet-700 hover:to-violet-800 shadow-sm hover:shadow-md border-violet-700"
                  }`}
                >
                  {isFetchingFaculty ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <PenTool className="w-5 h-5" />
                  )}
                  {isFetchingFaculty ? "Fetching..." : "Find Available Tutors"}
                </button>

                <button
                  type="button"
                  onClick={handleFetchRearrangeOptions}
                  disabled={
                    isFetchingOptions ||
                    formData.lec_no === "" ||
                    isNaN(formData.lec_no)
                  }
                  className={`px-6 py-3 rounded-lg font-bold flex items-center gap-2 transition-all duration-300 border ${
                    isFetchingOptions
                      ? "bg-amber-100 text-amber-400 cursor-not-allowed border-amber-300"
                      : formData.lec_no === "" || isNaN(formData.lec_no)
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed border-gray-300"
                      : "bg-gradient-to-r from-amber-600 to-orange-600 text-white hover:from-amber-700 hover:to-orange-700 shadow-sm hover:shadow-md border-amber-700"
                  }`}
                >
                  {isFetchingOptions ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <GitBranch className="w-5 h-5" />
                  )}
                  {isFetchingOptions ? "Loading..." : "Find Reschedule Options"}
                </button>

                <button
                  type="button"
                  onClick={() => handleSubmit("replace")}
                  disabled={
                    isLoading ||
                    formData.lec_no === "" ||
                    isNaN(formData.lec_no)
                  }
                  className={`px-6 py-3 rounded-lg font-bold flex items-center gap-2 transition-all duration-300 border ${
                    isLoading && !isRearranging
                      ? "bg-blue-100 text-blue-400 cursor-not-allowed border-blue-300"
                      : formData.lec_no === "" || isNaN(formData.lec_no)
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed border-gray-300"
                      : "bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-sm hover:shadow-md border-blue-700"
                  }`}
                >
                  {isLoading && !isRearranging ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Search className="w-5 h-5" />
                  )}
                  {isLoading && !isRearranging
                    ? "Searching..."
                    : "Auto Schedule"}
                </button>

                <button
                  type="button"
                  onClick={() => handleSubmit("rearrange")}
                  disabled={
                    isLoading ||
                    formData.lec_no === "" ||
                    isNaN(formData.lec_no)
                  }
                  className={`px-6 py-3 rounded-lg font-bold flex items-center gap-2 transition-all duration-300 border ${
                    isLoading && isRearranging
                      ? "bg-orange-100 text-orange-400 cursor-not-allowed border-orange-300"
                      : formData.lec_no === "" || isNaN(formData.lec_no)
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed border-gray-300"
                      : "bg-gradient-to-r from-orange-600 to-orange-700 text-white hover:from-orange-700 hover:to-orange-800 shadow-sm hover:shadow-md border-orange-700"
                  }`}
                >
                  {isLoading && isRearranging ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Repeat className="w-5 h-5" />
                  )}
                  {isLoading && isRearranging
                    ? "Rescheduling..."
                    : "Auto Reschedule"}
                </button>

                <button
                  type="button"
                  onClick={handleReset}
                  className="px-6 py-3 rounded-lg border border-amber-300 text-amber-700 font-bold flex items-center gap-2 hover:bg-amber-50 transition-all duration-300"
                >
                  <RefreshCw className="w-5 h-5" />
                  Reset Form
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Available Faculty Selection */}
        {availableFaculty.length > 0 && (
          <div className="bg-white rounded-2xl border border-amber-200 shadow-sm overflow-hidden mb-8">
            <div className="p-6 border-b border-amber-100 bg-gradient-to-r from-violet-50 to-violet-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg border border-violet-200">
                    <PenTool className="w-5 h-5 text-violet-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-violet-900">
                      Available Tutors ({availableFaculty.length})
                    </h2>
                    <p className="text-sm text-violet-700">
                      Select a tutor to assign to this study session
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {availableFaculty.map((faculty) => (
                  <div
                    key={faculty.faculty_id}
                    onClick={() => setSelectedFaculty(faculty)}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 ml-2 ${
                      selectedFaculty?.faculty_id === faculty.faculty_id
                        ? "border-violet-500 bg-violet-50 shadow-md"
                        : "border-amber-200 bg-amber-50 hover:border-violet-300 hover:bg-violet-50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <div
                          className={`p-2 rounded-lg border ${
                            selectedFaculty?.faculty_id === faculty.faculty_id
                              ? "bg-violet-100 border-violet-200"
                              : "bg-white border-amber-200"
                          }`}
                        >
                          <UserCheck
                            className={`w-5 h-5 ${
                              selectedFaculty?.faculty_id === faculty.faculty_id
                                ? "text-violet-600"
                                : "text-gray-600"
                            }`}
                          />
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-gray-900">
                            {faculty.name}
                          </p>
                          <p className="text-sm text-gray-600">
                            ID: {faculty.faculty_id}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Department: {faculty.department}
                          </p>
                        </div>
                      </div>
                      {selectedFaculty?.faculty_id === faculty.faculty_id && (
                        <div className="flex-shrink-0 ml-3">
                          <div className="w-6 h-6 bg-violet-500 rounded-full flex items-center justify-center">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {selectedFaculty && (
                <div className="bg-gradient-to-r from-violet-50 to-violet-100 rounded-xl p-4 border border-violet-200 ml-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-violet-900">
                        Selected Tutor
                      </p>
                      <p className="text-lg font-bold text-violet-900">
                        {selectedFaculty.name}
                      </p>
                      <p className="text-sm text-violet-700">
                        {selectedFaculty.faculty_id}
                      </p>
                    </div>
                    <button
                      onClick={handleAssignFaculty}
                      disabled={isAssigning}
                      className={`px-6 py-3 rounded-lg font-bold flex items-center gap-2 transition-all duration-300 border ${
                        isAssigning
                          ? "bg-violet-200 text-violet-400 cursor-not-allowed border-violet-300"
                          : "bg-gradient-to-r from-violet-600 to-violet-700 text-white hover:from-violet-700 hover:to-violet-800 shadow-sm hover:shadow-md border-violet-700"
                      }`}
                    >
                      {isAssigning ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <UserCheck className="w-5 h-5" />
                      )}
                      {isAssigning ? "Assigning..." : "Assign Tutor"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Rearrange Options Selection */}
        {rearrangeOptions.length > 0 && (
          <div className="bg-white rounded-2xl border border-amber-200 shadow-sm overflow-hidden mb-8">
            <div className="p-6 border-b border-amber-100 bg-gradient-to-r from-amber-50 to-orange-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg border border-amber-200">
                    <GitBranch className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-amber-900">
                      Reschedule Options ({rearrangeOptions.length})
                    </h2>
                    <p className="text-sm text-amber-700">
                      Select a swap option to execute the reschedule
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="space-y-4 mb-6">
                {rearrangeOptions.map((option, index) => (
                  <div
                    key={option.option_id}
                    onClick={() => setSelectedOption(option)}
                    className={`p-5 rounded-xl border-2 cursor-pointer transition-all duration-300 ml-2 ${
                      selectedOption?.option_id === option.option_id
                        ? "border-amber-500 bg-amber-50 shadow-md"
                        : "border-amber-200 bg-amber-50 hover:border-amber-300 hover:bg-amber-50"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="px-2 py-1 bg-amber-100 text-amber-800 rounded-md text-xs font-bold border border-amber-200">
                            Option {index + 1}
                          </span>
                          {selectedOption?.option_id === option.option_id && (
                            <div className="w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center">
                              <Check className="w-3 h-3 text-white" />
                            </div>
                          )}
                        </div>

                        <div className="space-y-3">
                          {/* Primary Faculty */}
                          <div className="bg-white rounded-lg p-3 border border-amber-200">
                            <div className="flex items-center gap-2 mb-2">
                              <UserCheck className="w-4 h-4 text-blue-600" />
                              <span className="text-xs font-bold text-gray-600">
                                Primary Tutor
                              </span>
                            </div>
                            <p className="font-bold text-gray-900">
                              {option.primary_faculty.name}
                            </p>
                            <p className="text-xs text-gray-600 mt-1">
                              ID: {option.primary_faculty.id}
                            </p>
                            <div className="mt-2 flex items-center gap-2 text-sm">
                              <span className="text-gray-600">Moves from:</span>
                              <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs font-medium border border-red-200">
                                {option.primary_faculty.current_class}
                              </span>
                              <ArrowRight className="w-4 h-4 text-gray-400" />
                              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-xs font-medium border border-emerald-200">
                                {option.primary_faculty.new_class}
                              </span>
                            </div>
                          </div>

                          {/* Secondary Faculty */}
                          <div className="bg-white rounded-lg p-3 border border-amber-200">
                            <div className="flex items-center gap-2 mb-2">
                              <UserCircle className="w-4 h-4 text-violet-600" />
                              <span className="text-xs font-bold text-gray-600">
                                Secondary Tutor
                              </span>
                            </div>
                            <p className="font-bold text-gray-900">
                              {option.secondary_faculty.name}
                            </p>
                            <p className="text-xs text-gray-600 mt-1">
                              ID: {option.secondary_faculty.id}
                            </p>
                            <div className="mt-2 flex items-center gap-2 text-sm">
                              <span className="text-gray-600">Takes over:</span>
                              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium border border-blue-200">
                                {option.secondary_faculty.takes_over}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Description */}
                        <div className="mt-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
                          <p className="text-sm text-gray-700">
                            <Info className="w-4 h-4 inline mr-1 text-amber-500" />
                            {option.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {selectedOption && (
                <div className="bg-gradient-to-r from-amber-50 to-orange-100 rounded-xl p-4 border border-amber-200 ml-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-amber-900">
                        Selected Reschedule
                      </p>
                      <p className="text-lg font-bold text-amber-900">
                        {selectedOption.primary_faculty.name}
                      </p>
                      <p className="text-sm text-amber-700">
                        will be assigned to {formData.class}
                      </p>
                      <p className="text-xs text-amber-600 mt-1">
                        Note: Two study groups will be affected by this
                        reschedule
                      </p>
                    </div>
                    <button
                      onClick={handleExecuteRearrange}
                      disabled={isExecutingSwap}
                      className={`px-6 py-3 rounded-lg font-bold flex items-center gap-2 transition-all duration-300 border ${
                        isExecutingSwap
                          ? "bg-amber-200 text-amber-400 cursor-not-allowed border-amber-300"
                          : "bg-gradient-to-r from-amber-600 to-orange-600 text-white hover:from-amber-700 hover:to-orange-700 shadow-sm hover:shadow-md border-amber-700"
                      }`}
                    >
                      {isExecutingSwap ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Zap className="w-5 h-5" />
                      )}
                      {isExecutingSwap ? "Executing..." : "Execute Reschedule"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-violet-50 to-indigo-50 rounded-2xl p-6 border border-violet-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-violet-100 rounded-lg border border-violet-200">
                <PenTool className="w-5 h-5 text-violet-600" />
              </div>
              <h3 className="font-bold text-violet-900">Select Tutor</h3>
            </div>
            <p className="text-violet-800 text-sm mb-4">
              View all available tutors and manually select who you want to
              assign to the study session.
            </p>
            <ul className="space-y-2 text-violet-700 text-sm">
              <li className="flex items-start gap-2">
                <div className="w-2 h-2 bg-violet-400 rounded-full mt-1.5"></div>
                <span>See all available tutors at once</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-2 h-2 bg-violet-400 rounded-full mt-1.5"></div>
                <span>Choose based on preference</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-2 h-2 bg-violet-400 rounded-full mt-1.5"></div>
                <span>Full control over assignment</span>
              </li>
            </ul>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 rounded-lg border border-blue-200">
                <Search className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="font-bold text-blue-900">Auto Schedule</h3>
            </div>
            <p className="text-blue-800 text-sm mb-4">
              Automatically find and assign the first available tutor from the
              allowed list.
            </p>
            <ul className="space-y-2 text-blue-700 text-sm">
              <li className="flex items-start gap-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full mt-1.5"></div>
                <span>Quick one-click assignment</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full mt-1.5"></div>
                <span>No manual selection needed</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full mt-1.5"></div>
                <span>Instant solution for urgent cases</span>
              </li>
            </ul>
          </div>

          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 border border-amber-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-amber-100 rounded-lg border border-amber-200">
                <GitBranch className="w-5 h-5 text-amber-600" />
              </div>
              <h3 className="font-bold text-amber-900">Reschedule Options</h3>
            </div>
            <p className="text-amber-800 text-sm mb-4">
              View all possible session swaps and choose the best reschedule
              option.
            </p>
            <ul className="space-y-2 text-amber-700 text-sm">
              <li className="flex items-start gap-2">
                <div className="w-2 h-2 bg-amber-400 rounded-full mt-1.5"></div>
                <span>Multiple swap options</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-2 h-2 bg-amber-400 rounded-full mt-1.5"></div>
                <span>
                  Separate notifications for each affected study group
                </span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-2 h-2 bg-amber-400 rounded-full mt-1.5"></div>
                <span>Manual approval before execution</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Result Display */}
        {result && (
          <div className="bg-white rounded-2xl border border-amber-200 shadow-sm mb-8 overflow-hidden">
            <div className="p-6 border-b border-amber-100 bg-gradient-to-r from-amber-50 to-amber-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg border border-amber-200">
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-amber-900">
                      Assignment Result
                    </h2>
                    <p className="text-sm text-amber-700">
                      Study session successfully managed
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold border ${
                      result.type === "rearranged"
                        ? "bg-amber-100 text-amber-800 border-amber-200"
                        : result.type === "direct"
                        ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                        : "bg-blue-100 text-blue-800 border-blue-200"
                    }`}
                  >
                    {result.type === "rearranged"
                      ? "Rescheduled"
                      : result.type === "direct"
                      ? "Direct Assignment"
                      : "Manual Selection"}
                  </span>
                  <button
                    id="copy-toast-btn"
                    onClick={copyToClipboard}
                    className="flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-amber-100 to-amber-50 hover:from-amber-200 hover:to-amber-100 text-amber-700 rounded-lg text-sm font-bold transition-colors border border-amber-200"
                  >
                    <Copy className="w-4 h-4" />
                    <span>Copy Result</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-5 border border-blue-200">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-white rounded-lg border border-blue-200">
                      <UserCheck className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-blue-700">
                        Primary Tutor
                      </p>
                      <p className="text-lg font-bold text-blue-900">
                        {result.faculty_name || result.assigned_faculty}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-5 border border-emerald-200">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-white rounded-lg border border-emerald-200">
                      <Zap className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-emerald-700">
                        Method
                      </p>
                      <p className="text-lg font-bold text-emerald-900">
                        {result.type === "rearranged"
                          ? "Session Reschedule"
                          : result.type === "direct"
                          ? "Direct Assignment"
                          : "Manual Selection"}
                      </p>
                    </div>
                  </div>
                </div>

                {result.secondary_faculty_name && (
                  <div className="bg-gradient-to-br from-violet-50 to-violet-100 rounded-xl p-5 border border-violet-200">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-white rounded-lg border border-violet-200">
                        <UserCircle className="w-4 h-4 text-violet-600" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-violet-700">
                          Secondary Tutor
                        </p>
                        <p className="text-lg font-bold text-violet-900">
                          {result.secondary_faculty_name}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Affected Classes Section for Rearrangements */}
              {result.type === "rearranged" && result.affected_classes && (
                <div className="mb-6">
                  <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Bell className="w-4 h-4 text-amber-500" />
                    Affected Study Groups ({result.affected_classes.length})
                  </h3>
                  <div className="space-y-4">
                    {result.affected_classes.map((cls, index) => (
                      <div
                        key={index}
                        className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-200"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-bold border border-amber-200">
                              {index === 0 ? "Target Group" : "Occupied Group"}
                            </span>
                            <p className="font-bold text-gray-900 mt-2">
                              {cls.branch}-{cls.class}-Sem{cls.sem}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-600">New Tutor</p>
                            <p className="font-bold text-gray-900">
                              {cls.new_faculty}
                            </p>
                          </div>
                        </div>
                        <div className="bg-white rounded-lg p-3 border border-amber-100">
                          <div className="whitespace-pre-line font-mono text-sm text-gray-700">
                            {formatMessage(cls.message)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {result.message && result.type !== "rearranged" && (
                <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                  <div className="whitespace-pre-line font-mono text-sm text-blue-800">
                    {formatMessage(result.message)}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Add CSS for animations */}
      <style jsx>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @keyframes progress {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }

        .animate-slide-in {
          animation: slideIn 0.3s ease-out;
        }

        .animate-progress {
          animation: progress 8s linear forwards;
        }
      `}</style>
    </div>
  );
}
