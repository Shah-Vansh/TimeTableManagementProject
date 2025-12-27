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
} from "lucide-react";
import api from "../configs/api";
import Alert from "../components/Alert"; // Import the Alert component

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
    { value: 2, label: "11:00 AM - 12:00 PM" },
    { value: 3, label: "12:00 PM - 1:00 PM" },
    { value: 4, label: "1:00 PM - 2:00 PM" },
    { value: 5, label: "2:00 PM - 3:00 PM" },
    { value: 6, label: "3:00 PM - 4:00 PM" },
    { value: 7, label: "4:00 PM - 5:00 PM" },
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
  const showAlertMessage = (main, info, type="success") => {
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
      showAlertMessage("Validation Error", "Please fill all required fields", "error");
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
      const response = await api.post("/api/get-available-faculty", formData);

      if (response.data.success) {
        setAvailableFaculty(response.data.available_faculty);
        showAlertMessage(
          "Available Faculty Found",
          `Found ${response.data.count} available faculty`
        );
      } else {
        showAlertMessage(
          "Failed to Fetch Faculty",
          response.data.message || "Failed to fetch available faculty",
          "error"
        );
      }
    } catch (error) {
      console.error("Error fetching available faculty:", error);

      if (error.response) {
        const { status, data } = error.response;
        if (status === 404) {
          showAlertMessage("Class Not Found", data.message || "Class not found", "error");
        } else if (status === 409) {
          showAlertMessage(
            "No Faculty Available",
            data.message || "No faculty available for this time slot",
            "error"
          );
        } else {
          showAlertMessage(
            "Failed to Fetch Faculty",
            data.message || "Failed to fetch available faculty",
            "error"
          );
        }
      } else {
        showAlertMessage("Network Error", "Network error. Please try again.", "error");
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
      showAlertMessage("Validation Error", "Please fill all required fields", "error");
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
      const response = await api.post("/api/get-rearrange-options", formData);

      if (response.data.success) {
        setRearrangeOptions(response.data.options);
        showAlertMessage(
          "Rearrangement Options Found",
          `Found ${response.data.count} possible rearrangement option(s)`
        );
      } else {
        showAlertMessage(
          "Failed to Fetch Options",
          response.data.message || "Failed to fetch rearrange options",
          "error"
        );
      }
    } catch (error) {
      console.error("Error fetching rearrange options:", error);

      if (error.response) {
        const { status, data } = error.response;
        if (status === 404) {
          showAlertMessage("Class Not Found", data.message || "Class not found");
        } else if (status === 409) {
          showAlertMessage(
            "No Rearrangement Options",
            data.message || "No possible rearrangement options found",
            "error"
          );
        } else {
          showAlertMessage(
            "Failed to Fetch Options",
            data.message || "Failed to fetch rearrange options",
            "error"
          );
        }
      } else {
        showAlertMessage("Network Error", "Network error. Please try again.", "error");
      }
    } finally {
      setIsFetchingOptions(false);
    }
  };

  const handleExecuteRearrange = async () => {
    if (!selectedOption) {
      showAlertMessage("Selection Required", "Please select a rearrangement option", "error");
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
      });

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
            response.data.message || "Lecture successfully assigned!";
          setToastMessage(message);
          setShowToast(true);
        }

        // Show success alert
        showAlertMessage("Operation Successful", response.data.message || "Operation successful");

        setRearrangeOptions([]);
        setSelectedOption(null);
      } else {
        showAlertMessage(
          "Failed to Execute Rearrangement",
          response.data.message || "Failed to execute rearrangement",
          "error"
        );
      }
    } catch (error) {
      console.error("Error executing rearrangement:", error);

      if (error.response) {
        const { status, data } = error.response;
        if (status === 404) {
          showAlertMessage("Faculty Not Found", data.message || "Faculty not found", "error");
        } else if (status === 409) {
          showAlertMessage(
            "Rearrangement Not Possible",
            data.message || "Rearrangement no longer possible",
            "error"
          );
        } else {
          showAlertMessage(
            "Failed to Execute Rearrangement",
            data.message || "Failed to execute rearrangement",
            "error"
          );
        }
      } else {
        showAlertMessage("Network Error", "Network error. Please try again.", "error");
      }
    } finally {
      setIsExecutingSwap(false);
    }
  };

  const handleAssignFaculty = async () => {
    if (!selectedFaculty) {
      showAlertMessage("Selection Required", "Please select a faculty to assign", "error");
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
      });

      if (response.data.success) {
        setResult(response.data);

        const message =
          response.data.message || "Lecture successfully assigned!";
        
        // Show success alert
        showAlertMessage("Assignment Successful", message);

        setToastMessage(message);
        setShowToast(true);

        setAvailableFaculty([]);
        setSelectedFaculty(null);
      } else {
        showAlertMessage(
          "Failed to Assign Faculty",
          response.data.message || "Failed to assign faculty",
          "error"
        );
      }
    } catch (error) {
      console.error("Error assigning faculty:", error);

      if (error.response) {
        const { status, data } = error.response;
        if (status === 403) {
          showAlertMessage(
            "Faculty Not Allowed",
            data.message || "Faculty not allowed for this class",
            "error"
          );
        } else if (status === 409) {
          showAlertMessage(
            "Faculty No Longer Available",
            data.message || "Faculty is no longer available",
            "error"
          );
        } else {
          showAlertMessage(
            "Failed to Assign Faculty",
            data.message || "Failed to assign faculty",
            "error"
          );
        }
      } else {
        showAlertMessage("Network Error", "Network error. Please try again.", "error");
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
      showAlertMessage("Validation Error", "Please fill all required fields", "error");
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
      const response = await api.post(endpoint, formData);

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
            response.data.message || "Lecture successfully managed!";
          setToastMessage(message);
          setShowToast(true);
        }

        // Show success alert
        showAlertMessage("Operation Successful", response.data.message || "Operation successful");
      } else {
        showAlertMessage(
          "Operation Failed",
          response.data.message ||
            `Failed to ${isRearrange ? "rearrange" : "replace"} lecture`,
            "error"
        );
      }
    } catch (error) {
      console.error(
        `Error ${isRearrange ? "rearranging" : "replacing"} lecture:`,
        error
      );

      if (error.response) {
        const { status, data } = error.response;
        if (status === 404) {
          showAlertMessage("Class Not Found", data.message || "Class not found", "error");
        } else if (status === 409) {
          showAlertMessage(
            "No Options Available",
            data.message ||
              (isRearrange
                ? "No possible rearrangement found"
                : "No faculty available at this time slot"),
                "error"
          );
        } else {
          showAlertMessage(
            "Operation Failed",
            data.message ||
              `Failed to ${isRearrange ? "rearrange" : "replace"} lecture`,
            "error"
          );
        }
      } else {
        showAlertMessage("Network Error", "Network error. Please try again.", "error");
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
      `Lecture Replacement Result:
Date: ${formData.date}
Assigned Faculty: ${result?.assigned_faculty || "N/A"}
Faculty Name: ${result?.faculty_name || "N/A"}
Day: ${days.find((d) => d.value === formData.day)?.label || formData.day}
Class: ${formData.class}
Semester: ${formData.sem}
Branch: ${formData.branch}
Time Slot: ${
        timeSlots.find((t) => t.value === parseInt(formData.lec_no))?.label
      }
Slot Index: ${formData.lec_no}
Method: ${
        result?.type === "rearranged"
          ? "Lecture Rearrangement"
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
    { value: 0, label: "1 (9:00 AM - 10:00 AM)" },
    { value: 1, label: "2 (10:00 AM - 11:00 AM)" },
    { value: 2, label: "3 (11:00 AM - 12:00 PM)" },
    { value: 3, label: "4 (12:00 PM - 1:00 PM)" },
    { value: 4, label: "5 (1:00 PM - 2:00 PM)" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 p-4 md:p-6">
      {/* Decorative Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-100 to-transparent rounded-full opacity-20"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-emerald-100 to-transparent rounded-full opacity-10"></div>
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
                <p className="font-medium">Lecture Replacement Successful</p>
                <div className="text-emerald-100 text-sm mt-1 whitespace-pre-line font-mono">
                  {formatMessage(toastMessage)}
                </div>
              </div>
              <div className="ml-4 flex items-center gap-2">
                <button
                  id="toast-copy-btn"
                  onClick={copySuccessMessage}
                  className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  <Copy className="w-4 h-4" />
                  <span>Copy</span>
                </button>
                <button
                  onClick={() => setShowToast(false)}
                  className="p-1 hover:bg-emerald-500 rounded-lg transition-colors"
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
          <div className="bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-xl shadow-lg border border-orange-500 overflow-hidden max-w-md">
            <div className="flex items-start p-4">
              <div className="flex-shrink-0 mt-0.5">
                <Bell className="w-5 h-5" />
              </div>
              <div className="ml-3 flex-1">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium">
                    Lecture Rearrangement ({currentToastIndex + 1}/
                    {classToastMessages.length})
                  </p>
                  <span className="px-2 py-0.5 bg-orange-500 text-white rounded text-xs font-medium">
                    {classToastMessages[currentToastIndex].class}
                  </span>
                </div>
                <div className="text-orange-100 text-sm mt-1 whitespace-pre-line font-mono">
                  {formatMessage(classToastMessages[currentToastIndex].message)}
                </div>
              </div>
              <div className="ml-4 flex items-center gap-2">
                <button
                  id="class-toast-copy-btn"
                  onClick={copyClassMessage}
                  className="flex items-center gap-1 px-3 py-1.5 bg-orange-500 hover:bg-orange-400 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  <Copy className="w-4 h-4" />
                  <span>Copy</span>
                </button>
                <div className="flex items-center gap-1">
                  {currentToastIndex > 0 && (
                    <button
                      onClick={goToPrevClassToast}
                      className="p-1 hover:bg-orange-500 rounded-lg transition-colors"
                    >
                      <ChevronRight className="w-4 h-4 rotate-180" />
                    </button>
                  )}
                  <button
                    onClick={goToNextClassToast}
                    className="p-1 hover:bg-orange-500 rounded-lg transition-colors"
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
            <div className="h-1 bg-orange-500">
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
            <span className="hover:text-gray-800 cursor-pointer">
              Dashboard
            </span>
            <ChevronRight className="w-4 h-4 mx-2" />
            <span className="hover:text-gray-800 cursor-pointer">
              Timetable Management
            </span>
            <ChevronRight className="w-4 h-4 mx-2" />
            <span className="font-medium text-blue-600">
              Lecture Replacement
            </span>
          </div>
        </div>

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 bg-white rounded-xl shadow-sm border border-gray-100">
                <ArrowRightLeft className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Lecture Replacement
                </h1>
                <p className="text-gray-600">
                  Find available faculty or rearrange existing lectures to
                  manage scheduling conflicts
                </p>
              </div>
            </div>
          </div>
          <div className="p-3 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
            <Clock className="w-6 h-6 text-blue-600" />
          </div>
        </div>

        {/* Main Form Card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-8">
          <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">
              Lecture Details
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Select the lecture slot you want to manage. Date and day are
              auto-synced.
            </p>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Date Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-blue-500" />
                  Date
                  <span className="ml-auto text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                    Auto-sync
                  </span>
                </label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Selecting a date will automatically update the day
                </p>
              </div>

              {/* Day Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-500" />
                  Day
                  <span className="ml-auto text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                    Auto-sync
                  </span>
                </label>
                <select
                  name="day"
                  value={formData.day}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                >
                  <option value="" className="text-gray-500">
                    Select Day
                  </option>
                  {days.map((day) => (
                    <option key={day.value} value={day.value}>
                      {day.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Selecting a day will automatically update the date to the next
                  occurrence
                </p>
              </div>

              {/* Class Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Users className="w-4 h-4 text-purple-500" />
                  Class Name
                </label>
                <input
                  type="text"
                  name="class"
                  placeholder="e.g. D1, A, B2"
                  value={formData.class}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                />
              </div>

              {/* Semester */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-emerald-500" />
                  Semester
                </label>
                <select
                  name="sem"
                  value={formData.sem}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
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
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-indigo-500" />
                  Branch
                </label>
                <select
                  name="branch"
                  value={formData.branch}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
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
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-500" />
                  Time Slot
                </label>
                <select
                  name="lec_no"
                  value={formData.lec_no}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                >
                  <option value="" className="text-gray-500">
                    Select Time Slot
                  </option>
                  {timeSlotOptions.map((slot) => (
                    <option key={slot.value} value={slot.value}>
                      {slot.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Date & Day Sync Info */}
            <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <ArrowRightLeft className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-900">
                    Auto-Sync Information
                  </p>
                  <p className="text-sm text-blue-700">
                    Date and day are automatically synchronized. Changing one
                    will update the other.
                    <br />
                    <span className="font-medium">Current: </span>
                    {formData.date} (
                    {days.find((d) => d.value === formData.day)?.label ||
                      "Select a day"}
                    )
                  </p>
                </div>
              </div>
            </div>

            {/* Selected Time Slot Info */}
            {formData.lec_no !== "" && (
              <div className="mt-4 p-4 bg-gradient-to-r from-amber-50 to-amber-100 rounded-xl border border-amber-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-100 rounded-lg">
                    <Clock className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-amber-900">
                      Selected Time Slot
                    </p>
                    <p className="text-lg font-bold text-amber-900">
                      {
                        timeSlotOptions.find(
                          (t) => t.value === parseInt(formData.lec_no)
                        )?.label
                      }
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="flex flex-wrap gap-4 justify-center">
                <button
                  type="button"
                  onClick={handleFetchAvailableFaculty}
                  disabled={
                    isFetchingFaculty ||
                    formData.lec_no === "" ||
                    isNaN(formData.lec_no)
                  }
                  className={`px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-all duration-300 ${
                    isFetchingFaculty
                      ? "bg-purple-100 text-purple-400 cursor-not-allowed"
                      : formData.lec_no === "" || isNaN(formData.lec_no)
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-gradient-to-r from-purple-600 to-purple-700 text-white hover:from-purple-700 hover:to-purple-800 shadow-sm hover:shadow-md"
                  }`}
                >
                  {isFetchingFaculty ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <UserCircle className="w-5 h-5" />
                  )}
                  {isFetchingFaculty ? "Fetching..." : "Get Available Faculty"}
                </button>

                <button
                  type="button"
                  onClick={handleFetchRearrangeOptions}
                  disabled={isFetchingOptions || formData.lec_no === "" || isNaN(formData.lec_no)}
                  className={`px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-all duration-300 ${
                    isFetchingOptions
                      ? "bg-orange-100 text-orange-400 cursor-not-allowed"
                      : formData.lec_no === "" || isNaN(formData.lec_no)
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-gradient-to-r from-orange-600 to-orange-700 text-white hover:from-orange-700 hover:to-orange-800 shadow-sm hover:shadow-md"
                  }`}
                >
                  {isFetchingOptions ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <GitBranch className="w-5 h-5" />
                  )}
                  {isFetchingOptions ? "Loading..." : "Get Rearrange Options"}
                </button>

                <button
                  type="button"
                  onClick={() => handleSubmit("replace")}
                  disabled={isLoading || formData.lec_no === "" || isNaN(formData.lec_no)}
                  className={`px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-all duration-300 ${
                    isLoading && !isRearranging
                      ? "bg-blue-100 text-blue-400 cursor-not-allowed"
                      : formData.lec_no === "" || isNaN(formData.lec_no)
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-sm hover:shadow-md"
                  }`}
                >
                  {isLoading && !isRearranging ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Search className="w-5 h-5" />
                  )}
                  {isLoading && !isRearranging
                    ? "Searching..."
                    : "Auto Replace"}
                </button>

                <button
                  type="button"
                  onClick={() => handleSubmit("rearrange")}
                  disabled={isLoading || formData.lec_no === "" || isNaN(formData.lec_no)}
                  className={`px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-all duration-300 ${
                    isLoading && isRearranging
                      ? "bg-amber-100 text-amber-400 cursor-not-allowed"
                      : formData.lec_no === "" || isNaN(formData.lec_no)
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-gradient-to-r from-amber-600 to-orange-600 text-white hover:from-amber-700 hover:to-orange-700 shadow-sm hover:shadow-md"
                  }`}
                >
                  {isLoading && isRearranging ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Repeat className="w-5 h-5" />
                  )}
                  {isLoading && isRearranging
                    ? "Rearranging..."
                    : "Auto Rearrange"}
                </button>

                <button
                  type="button"
                  onClick={handleReset}
                  className="px-6 py-3 rounded-lg border border-gray-300 text-gray-700 font-medium flex items-center gap-2 hover:bg-gray-50 transition-all duration-300"
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
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-8">
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-purple-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <UserCircle className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-purple-900">
                      Available Faculty ({availableFaculty.length})
                    </h2>
                    <p className="text-sm text-purple-700">
                      Select a faculty member to assign to this lecture
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
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
                      selectedFaculty?.faculty_id === faculty.faculty_id
                        ? "border-purple-500 bg-purple-50 shadow-md"
                        : "border-gray-200 bg-gray-50 hover:border-purple-300 hover:bg-purple-50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <div
                          className={`p-2 rounded-lg ${
                            selectedFaculty?.faculty_id === faculty.faculty_id
                              ? "bg-purple-100"
                              : "bg-white"
                          }`}
                        >
                          <UserCheck
                            className={`w-5 h-5 ${
                              selectedFaculty?.faculty_id === faculty.faculty_id
                                ? "text-purple-600"
                                : "text-gray-600"
                            }`}
                          />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">
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
                          <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {selectedFaculty && (
                <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-purple-900">
                        Selected Faculty
                      </p>
                      <p className="text-lg font-bold text-purple-900">
                        {selectedFaculty.name}
                      </p>
                      <p className="text-sm text-purple-700">
                        {selectedFaculty.faculty_id}
                      </p>
                    </div>
                    <button
                      onClick={handleAssignFaculty}
                      disabled={isAssigning}
                      className={`px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-all duration-300 ${
                        isAssigning
                          ? "bg-purple-200 text-purple-400 cursor-not-allowed"
                          : "bg-gradient-to-r from-purple-600 to-purple-700 text-white hover:from-purple-700 hover:to-purple-800 shadow-sm hover:shadow-md"
                      }`}
                    >
                      {isAssigning ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <UserCheck className="w-5 h-5" />
                      )}
                      {isAssigning ? "Assigning..." : "Assign Faculty"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Rearrange Options Selection */}
        {rearrangeOptions.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-8">
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-orange-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <GitBranch className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-orange-900">
                      Rearrangement Options ({rearrangeOptions.length})
                    </h2>
                    <p className="text-sm text-orange-700">
                      Select a swap option to execute the rearrangement
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
                    className={`p-5 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
                      selectedOption?.option_id === option.option_id
                        ? "border-orange-500 bg-orange-50 shadow-md"
                        : "border-gray-200 bg-gray-50 hover:border-orange-300 hover:bg-orange-50"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-md text-xs font-semibold">
                            Option {index + 1}
                          </span>
                          {selectedOption?.option_id === option.option_id && (
                            <div className="w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center">
                              <Check className="w-3 h-3 text-white" />
                            </div>
                          )}
                        </div>

                        <div className="space-y-3">
                          {/* Primary Faculty */}
                          <div className="bg-white rounded-lg p-3 border border-gray-200">
                            <div className="flex items-center gap-2 mb-2">
                              <UserCheck className="w-4 h-4 text-blue-600" />
                              <span className="text-xs font-semibold text-gray-600">
                                Primary Faculty
                              </span>
                            </div>
                            <p className="font-semibold text-gray-900">
                              {option.primary_faculty.name}
                            </p>
                            <p className="text-xs text-gray-600 mt-1">
                              ID: {option.primary_faculty.id}
                            </p>
                            <div className="mt-2 flex items-center gap-2 text-sm">
                              <span className="text-gray-600">Moves from:</span>
                              <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs font-medium">
                                {option.primary_faculty.current_class}
                              </span>
                              <ArrowRight className="w-4 h-4 text-gray-400" />
                              <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium">
                                {option.primary_faculty.new_class}
                              </span>
                            </div>
                          </div>

                          {/* Secondary Faculty */}
                          <div className="bg-white rounded-lg p-3 border border-gray-200">
                            <div className="flex items-center gap-2 mb-2">
                              <UserCircle className="w-4 h-4 text-purple-600" />
                              <span className="text-xs font-semibold text-gray-600">
                                Secondary Faculty
                              </span>
                            </div>
                            <p className="font-semibold text-gray-900">
                              {option.secondary_faculty.name}
                            </p>
                            <p className="text-xs text-gray-600 mt-1">
                              ID: {option.secondary_faculty.id}
                            </p>
                            <div className="mt-2 flex items-center gap-2 text-sm">
                              <span className="text-gray-600">Takes over:</span>
                              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                                {option.secondary_faculty.takes_over}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Description */}
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <p className="text-sm text-gray-700">
                            <Info className="w-4 h-4 inline mr-1 text-gray-500" />
                            {option.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {selectedOption && (
                <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl p-4 border border-orange-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-orange-900">
                        Selected Rearrangement
                      </p>
                      <p className="text-lg font-bold text-orange-900">
                        {selectedOption.primary_faculty.name}
                      </p>
                      <p className="text-sm text-orange-700">
                        will be assigned to {formData.class}
                      </p>
                      <p className="text-xs text-orange-600 mt-1">
                        Note: Two classes will be affected by this rearrangement
                      </p>
                    </div>
                    <button
                      onClick={handleExecuteRearrange}
                      disabled={isExecutingSwap}
                      className={`px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-all duration-300 ${
                        isExecutingSwap
                          ? "bg-orange-200 text-orange-400 cursor-not-allowed"
                          : "bg-gradient-to-r from-orange-600 to-orange-700 text-white hover:from-orange-700 hover:to-orange-800 shadow-sm hover:shadow-md"
                      }`}
                    >
                      {isExecutingSwap ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Zap className="w-5 h-5" />
                      )}
                      {isExecutingSwap
                        ? "Executing..."
                        : "Execute Rearrangement"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-6 border border-purple-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <UserCircle className="w-5 h-5 text-purple-600" />
              </div>
              <h3 className="font-semibold text-purple-900">Select Faculty</h3>
            </div>
            <p className="text-purple-800 text-sm mb-4">
              View all available faculty members and manually select who you
              want to assign to the lecture.
            </p>
            <ul className="space-y-2 text-purple-700 text-sm">
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-purple-400 rounded-full mt-1.5"></div>
                <span>See all available faculty at once</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-purple-400 rounded-full mt-1.5"></div>
                <span>Choose based on preference</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-purple-400 rounded-full mt-1.5"></div>
                <span>Full control over assignment</span>
              </li>
            </ul>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Search className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="font-semibold text-blue-900">Auto Replace</h3>
            </div>
            <p className="text-blue-800 text-sm mb-4">
              Automatically find and assign the first available faculty from the
              allowed list.
            </p>
            <ul className="space-y-2 text-blue-700 text-sm">
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-1.5"></div>
                <span>Quick one-click assignment</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-1.5"></div>
                <span>No manual selection needed</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-1.5"></div>
                <span>Instant solution for urgent cases</span>
              </li>
            </ul>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-6 border border-orange-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-orange-100 rounded-lg">
                <GitBranch className="w-5 h-5 text-orange-600" />
              </div>
              <h3 className="font-semibold text-orange-900">
                Rearrange Options
              </h3>
            </div>
            <p className="text-orange-800 text-sm mb-4">
              View all possible lecture swaps and choose the best rearrangement
              option.
            </p>
            <ul className="space-y-2 text-orange-700 text-sm">
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-orange-400 rounded-full mt-1.5"></div>
                <span>Multiple swap options</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-orange-400 rounded-full mt-1.5"></div>
                <span>Separate notifications for each affected class</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-orange-400 rounded-full mt-1.5"></div>
                <span>Manual approval before execution</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Result Display */}
        {result && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm mb-8 overflow-hidden">
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-emerald-100 to-emerald-50 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      Assignment Result
                    </h2>
                    <p className="text-sm text-gray-600">
                      Lecture successfully managed
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      result.type === "rearranged"
                        ? "bg-amber-100 text-amber-800"
                        : result.type === "direct"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {result.type === "rearranged"
                      ? "Rearranged"
                      : result.type === "direct"
                      ? "Direct Assignment"
                      : "Manual Selection"}
                  </span>
                  <button
                    id="copy-toast-btn"
                    onClick={copyToClipboard}
                    className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                    <span>Copy Result</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-white rounded-lg">
                      <UserCheck className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-blue-700">
                        Primary Faculty
                      </p>
                      <p className="text-lg font-semibold text-blue-900">
                        {result.faculty_name || result.assigned_faculty}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-white rounded-lg">
                      <Zap className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-emerald-700">
                        Method
                      </p>
                      <p className="text-lg font-semibold text-emerald-900">
                        {result.type === "rearranged"
                          ? "Lecture Rearrangement"
                          : result.type === "direct"
                          ? "Direct Assignment"
                          : "Manual Selection"}
                      </p>
                    </div>
                  </div>
                </div>

                {result.secondary_faculty_name && (
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-white rounded-lg">
                        <UserCircle className="w-4 h-4 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-purple-700">
                          Secondary Faculty
                        </p>
                        <p className="text-lg font-semibold text-purple-900">
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
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Bell className="w-4 h-4 text-orange-500" />
                    Affected Classes ({result.affected_classes.length})
                  </h3>
                  <div className="space-y-4">
                    {result.affected_classes.map((cls, index) => (
                      <div
                        key={index}
                        className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl p-4 border border-orange-200"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-medium">
                              {index === 0 ? "Target Class" : "Occupied Class"}
                            </span>
                            <p className="font-bold text-gray-900 mt-2">
                              {cls.branch}-{cls.class}-Sem{cls.sem}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-600">New Faculty</p>
                            <p className="font-semibold text-gray-900">
                              {cls.new_faculty}
                            </p>
                          </div>
                        </div>
                        <div className="bg-white rounded-lg p-3 border border-orange-100">
                          <div className="whitespace-pre-line font-mono text-sm text-gray-700">
                            {formatMessage(cls.message)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Details Card */}
              <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Info className="w-4 h-4 text-gray-500" />
                  Assignment Details
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex justify-between items-center py-2 border-b border-gray-200">
                    <span className="text-sm text-gray-600">Date</span>
                    <span className="font-medium text-gray-900">
                      {new Date(formData.date).toLocaleDateString("en-US", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-200">
                    <span className="text-sm text-gray-600">Day</span>
                    <span className="font-medium text-gray-900">
                      {days.find((d) => d.value === formData.day)?.label ||
                        formData.day}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-200">
                    <span className="text-sm text-gray-600">Class</span>
                    <span className="font-medium text-gray-900">
                      {formData.class}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-200">
                    <span className="text-sm text-gray-600">Semester</span>
                    <span className="font-medium text-gray-900">
                      {formData.sem}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-200">
                    <span className="text-sm text-gray-600">Branch</span>
                    <span className="font-medium text-gray-900">
                      {formData.branch}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-200">
                    <span className="text-sm text-gray-600">Time Slot</span>
                    <span className="font-medium text-gray-900">
                      {
                        timeSlotOptions.find(
                          (t) => t.value === parseInt(formData.lec_no)
                        )?.label
                      }
                    </span>
                  </div>
                </div>
              </div>

              {result.message && result.type !== "rearranged" && (
                <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                  <div className="whitespace-pre-line font-mono text-sm text-blue-800">
                    {formatMessage(result.message)}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Time Slot Guide */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
          <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Clock className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Time Slot Guide
                </h2>
                <p className="text-sm text-gray-600">
                  Reference for slot numbers and timings
                </p>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="py-3 px-4 text-left text-xs font-semibold text-gray-700 uppercase">
                    Slot #
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-semibold text-gray-700 uppercase">
                    Time Period
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-semibold text-gray-700 uppercase">
                    Description
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {timeSlotOptions.map((slot) => (
                  <tr
                    key={slot.value}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {slot.value + 1}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-gray-900">
                      {timeSlots.find((t) => t.value === slot.value)?.label}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {slot.value === 0
                        ? "First lecture of the day"
                        : slot.value === 4
                        ? "Last lecture before lunch"
                        : `Regular lecture ${slot.value + 1}`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Info className="w-4 h-4" />
              <span>
                Time slots 1-5 run from 9:00 AM to 2:00 PM (before lunch break)
              </span>
            </div>
          </div>
        </div>
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