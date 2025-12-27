import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  Printer,
  Download,
  Calendar,
  GraduationCap,
  Building,
  Clock,
  Loader2,
  ArrowLeft,
  Eye,
  FileText,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import api from "../configs/api";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

const Preview = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // State from navigation or default values
  const [sem, setSem] = useState(location.state?.sem || 1);
  const [branch, setBranch] = useState(location.state?.branch || "CSE");
  const [division, setDivision] = useState(location.state?.division || "D1");
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [schedule, setSchedule] = useState(null);
  const [facultyNames, setFacultyNames] = useState({});
  const [subjectCodes, setSubjectCodes] = useState({});
  
  // Branch name mapping
  const branchNames = {
    "CSE": "Computer Science and Engineering",
    "CSE(AIML)": "Computer Science and Engineering (AIML)",
    "DS": "Data Science",
    "ECE": "Electronics and Communication Engineering",
    "EEE": "Electrical and Electronics Engineering",
    "ME": "Mechanical Engineering",
    "CE": "Civil Engineering"
  };
  
  // Branch code mapping
  const branchCodes = {
    "CSE": "42",
    "CSE(AIML)": "42",
    "DS": "43",
    "ECE": "44",
    "EEE": "45",
    "ME": "46",
    "CE": "47"
  };
  
  // Time slots
  const timeSlots = [
    { index: 1, time: "09:00 am to 10:00 am" },
    { index: 2, time: "10:00 am to 11:00 am" },
    { index: 3, time: "11:45 am to 12:45 pm" },
    { index: 4, time: "12:45 pm to 01:45 pm" },
    { index: 5, time: "02:00 pm to 03:00 pm" }
  ];
  
  // Days mapping
  const days = [
    { key: "Monday", display: "MON", full: "Monday" },
    { key: "Tuesday", display: "TUES", full: "Tuesday" },
    { key: "Wednesday", display: "WED", full: "Wednesday" },
    { key: "Thursday", display: "THUR", full: "Thursday" },
    { key: "Friday", display: "FRI", full: "Friday" },
    { key: "Saturday", display: "SAT", full: "Saturday" }
  ];
  
  // Color scheme matching your HTML
  const colors = {
    headerBg: "black",
    headerText: "white",
    dayBg: "rgb(134, 131, 131)",
    divisionHeader: "rgb(248, 178, 48)",
    subjectCell: "rgb(253, 194, 204)",
    timeSlotBg: "rgb(153, 207, 252)",
    breakBg: "rgb(130, 240, 130)",
    deBg: "rgb(248, 178, 48)"
  };
  
  // Fetch timetable data
  const fetchTimetableData = async () => {
    if (!sem || !branch || !division) {
      setError("Missing parameters for timetable preview");
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    setError("");
    
    try {
      // Fetch timetable
      const response = await api.get("/api/fetchtimetable", {
        params: { sem, branch, class: division }
      });
      
      if (response.data.success && response.data.schedule) {
        setSchedule(response.data.schedule);
        
        // Extract unique faculty IDs from schedule
        const facultyIds = new Set();
        Object.values(response.data.schedule).forEach(day => {
          Object.values(day).forEach(facultyId => {
            if (facultyId && facultyId !== "free") {
              facultyIds.add(facultyId);
            }
          });
        });
        
        // Fetch faculty names
        if (facultyIds.size > 0) {
          try {
            const facultyResponse = await api.get("/api/faculties");
            if (facultyResponse.data.success) {
              const facultyMap = {};
              facultyResponse.data.faculties.forEach(faculty => {
                facultyMap[faculty.id] = faculty.name;
              });
              setFacultyNames(facultyMap);
            }
          } catch (err) {
            console.warn("Could not fetch faculty names:", err);
          }
        }
        
        // TODO: Fetch subject codes from your database
        // This is a placeholder - you should replace with actual API call
        const subjectMap = {
          "FAC001": "FAI",
          "FAC002": "PP",
          "FAC003": "MSE",
          "FAC004": "MLE",
          "FAC005": "DE-IIB"
        };
        setSubjectCodes(subjectMap);
        
      } else {
        setError("No timetable data found for the selected parameters");
      }
    } catch (err) {
      console.error("Error fetching timetable:", err);
      setError("Failed to load timetable. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle print
  const handlePrint = () => {
    window.print();
  };
  
  // Handle download as PDF
  const handleDownloadPDF = async () => {
    const element = document.getElementById("timetable-preview");
    
    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff"
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a3'
      });
      
      const imgWidth = 420; // A3 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`Timetable_${branch}_Sem${sem}_${division}.pdf`);
      
    } catch (err) {
      console.error("Error generating PDF:", err);
      alert("Failed to generate PDF. Please try again.");
    }
  };
  
  // Get faculty name by ID
  const getFacultyName = (facultyId) => {
    if (!facultyId || facultyId === "free") return "*";
    return facultyNames[facultyId] || facultyId;
  };
  
  // Get subject code by faculty ID
  const getSubjectCode = (facultyId) => {
    if (!facultyId || facultyId === "free") return "-";
    return subjectCodes[facultyId] || "SUB";
  };
  
  // Generate room number (placeholder logic)
  const getRoomNumber = (dayIndex, timeSlotIndex, division) => {
    const rooms = [
      "CL-05/302,Floor-3",
      "CL-04/301,Floor-3", 
      "LAB-04/302,Floor-3",
      "CL-05/302,Floor-3",
      "-"
    ];
    
    // Simple logic - you can replace with your actual room assignment logic
    if (division === "D1") {
      if (timeSlotIndex === 3 || timeSlotIndex === 4) {
        return "LAB-04/302,Floor-3";
      }
      return "CL-05/302,Floor-3";
    } else if (division === "D2") {
      return "CL-04/301,Floor-3";
    }
    
    return rooms[timeSlotIndex % rooms.length];
  };
  
  // Format date
  const getCurrentDate = () => {
    const now = new Date();
    const day = now.getDate();
    const month = now.toLocaleString('default', { month: 'long' });
    const year = now.getFullYear();
    return `${day}${getOrdinalSuffix(day)} ${month} ${year}`;
  };
  
  const getOrdinalSuffix = (n) => {
    if (n > 3 && n < 21) return 'th';
    switch (n % 10) {
      case 1: return "st";
      case 2: return "nd";
      case 3: return "rd";
      default: return "th";
    }
  };
  
  // Initial data fetch
  useEffect(() => {
    fetchTimetableData();
  }, [sem, branch, division]);
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading timetable preview...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl p-6 border border-red-200">
            <div className="flex items-center gap-3 text-red-600 mb-4">
              <AlertTriangle className="w-6 h-6" />
              <h2 className="text-xl font-bold">Error Loading Timetable</h2>
            </div>
            <p className="text-gray-700 mb-6">{error}</p>
            <button
              onClick={() => navigate(-1)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2 hover:bg-blue-700"
            >
              <ArrowLeft className="w-4 h-4" />
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 p-4 print:p-0">
      {/* Preview Header (Non-printable) */}
      <div className="max-w-7xl mx-auto mb-6 print:hidden">
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-6 h-6 text-gray-700" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Timetable Preview</h1>
                <p className="text-gray-600">
                  Previewing {branch} - Semester {sem} - {division}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-end">
                <span className="text-sm text-gray-600">Last Updated</span>
                <span className="font-medium">{getCurrentDate()}</span>
              </div>
            </div>
          </div>
          
          {/* Preview Controls */}
          <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg border">
                  <Building className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Branch</p>
                  <p className="font-medium">{branchNames[branch] || branch}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg border">
                  <GraduationCap className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Semester</p>
                  <p className="font-medium">Semester {sem}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg border">
                  <Users className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Division</p>
                  <p className="font-medium">{division}</p>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={handlePrint}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg flex items-center gap-2 hover:bg-gray-50"
              >
                <Printer className="w-4 h-4" />
                Print
              </button>
              <button
                onClick={handleDownloadPDF}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2 hover:bg-blue-700"
              >
                <Download className="w-4 h-4" />
                Download PDF
              </button>
            </div>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mt-6">
            <div className="bg-white p-4 rounded-lg border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Periods</p>
                  <p className="text-2xl font-bold">30</p>
                </div>
                <Clock className="w-8 h-8 text-blue-500 opacity-50" />
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Assigned Periods</p>
                  <p className="text-2xl font-bold">
                    {schedule ? 
                      Object.values(schedule).flatMap(day => 
                        Object.values(day).filter(val => val && val !== "free")
                      ).length : 0
                    }
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500 opacity-50" />
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Faculty Count</p>
                  <p className="text-2xl font-bold">
                    {Object.keys(facultyNames).length}
                  </p>
                </div>
                <Users className="w-8 h-8 text-purple-500 opacity-50" />
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Generated On</p>
                  <p className="text-lg font-medium">{getCurrentDate()}</p>
                </div>
                <Calendar className="w-8 h-8 text-amber-500 opacity-50" />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Timetable Preview (Printable) */}
      <div id="timetable-preview" className="bg-white print:p-0">
        <table className="table w-full border-collapse border border-black text-center">
          <thead>
            {/* Institute Name */}
            <tr>
              <td colSpan="14" className="border border-black p-2">
                <div className="font-bold text-lg">
                  New L J Institute of Engineering and Technology, Ahmedabad
                </div>
              </td>
            </tr>
            
            {/* Branch Info */}
            <tr>
              <td colSpan="14" className="border border-black p-2">
                <div>
                  Branch: {branchNames[branch] || branch}, Branch Code: {branchCodes[branch] || "00"}
                </div>
              </td>
            </tr>
            
            {/* Main Header */}
            <tr className="bg-black text-white">
              <td colSpan="14" className="border border-black p-3">
                <div className="font-bold">
                  TIME TABLE FOR {branch.toUpperCase()} ENGINEERING STUDENTS SEM-{sem} 2025 W.E.F. {getCurrentDate().toUpperCase()}
                </div>
              </td>
            </tr>
            
            {/* Sub Headers */}
            <tr>
              <td rowSpan="2" className="border border-black p-2 bg-gray-500 text-white">
                <div className="font-bold">DAY</div>
              </td>
              <td rowSpan="2" className="border border-black p-2 bg-gray-500 text-white">
                <div className="font-bold">LEC NO.</div>
              </td>
              <td colSpan="2" className="border border-black p-2 bg-gray-500 text-white">
                <div className="font-bold">DIVISION</div>
              </td>
              
              {/* Division 1 Header */}
              <td colSpan="3" className="border border-black p-2 bg-amber-300">
                <div className="font-bold">
                  DIV - 1 (Roll Nos - 01 to 34)
                </div>
              </td>
              
              {/* Division 2 Header */}
              <td colSpan="3" className="border border-black p-2 bg-amber-300">
                <div className="font-bold">
                  DIV - 2 (Roll Nos - 35 to 68)
                </div>
              </td>
              
              <td colSpan="2" className="border border-black p-2 bg-gray-500 text-white">
                <div className="font-bold">DIVISION</div>
              </td>
              <td rowSpan="2" className="border border-black p-2 bg-gray-500 text-white">
                <div className="font-bold">LEC NO.</div>
              </td>
              <td rowSpan="2" className="border border-black p-2 bg-gray-500 text-white">
                <div className="font-bold">DAY</div>
              </td>
            </tr>
            
            <tr>
              <td colSpan="2" className="border border-black p-2 bg-gray-500 text-white">
                <div className="font-bold">TIME</div>
              </td>
              
              {/* Division 1 Sub Headers */}
              <td className="border border-black p-2 bg-pink-200">
                <div className="font-bold">Subject</div>
              </td>
              <td className="border border-black p-2 bg-pink-200">
                <div className="font-bold">Faculty</div>
              </td>
              <td className="border border-black p-2 bg-pink-200">
                <div className="font-bold">Room No Floor No</div>
              </td>
              
              {/* Division 2 Sub Headers */}
              <td className="border border-black p-2 bg-pink-200">
                <div className="font-bold">Subject</div>
              </td>
              <td className="border border-black p-2 bg-pink-200">
                <div className="font-bold">Faculty</div>
              </td>
              <td className="border border-black p-2 bg-pink-200">
                <div className="font-bold">Room No Floor No</div>
              </td>
              
              <td colSpan="2" className="border border-black p-2 bg-gray-500 text-white">
                <div className="font-bold">TIME</div>
              </td>
            </tr>
          </thead>
          
          <tbody>
            {days.map((day, dayIndex) => (
              <React.Fragment key={day.key}>
                {timeSlots.map((timeSlot, slotIndex) => {
                  const isBreak1 = slotIndex === 2; // 11:00-11:45 break
                  const isBreak2 = slotIndex === 5; // 01:45-02:00 break
                  const isDESlot = slotIndex === 4; // DE slot
                  
                  // Get faculty for current time slot
                  const facultyId1 = schedule?.[day.key]?.[`Time Slot ${slotIndex + 1}`];
                  const facultyId2 = schedule?.[day.key]?.[`Time Slot ${slotIndex + 1}`]; // Same for demo
                  
                  // For breaks and DE slots
                  if (isBreak1) {
                    return (
                      <tr key={`${day.key}-break1`} className="bg-green-200">
                        <td></td>
                        <td></td>
                        <td colSpan="2">11:00 am to 11:45 am</td>
                        <td colSpan="6"></td>
                        <td colSpan="2">11:00 am to 11:45 am</td>
                        <td></td>
                        <td></td>
                      </tr>
                    );
                  }
                  
                  if (isBreak2) {
                    return (
                      <tr key={`${day.key}-break2`} className="bg-green-200">
                        <td></td>
                        <td></td>
                        <td colSpan="2">01:45 pm to 02:00 pm</td>
                        <td colSpan="6"></td>
                        <td colSpan="2">01:45 pm to 02:00 pm</td>
                        <td></td>
                        <td></td>
                      </tr>
                    );
                  }
                  
                  return (
                    <tr 
                      key={`${day.key}-${slotIndex}`}
                      className={
                        slotIndex === 0 || slotIndex === 3 
                          ? "bg-blue-100" 
                          : isDESlot 
                          ? "bg-amber-200" 
                          : ""
                      }
                    >
                      {/* Day (only show on first row of each day) */}
                      {slotIndex === 0 && (
                        <td rowSpan={timeSlots.length} className="border border-black p-2 font-bold">
                          {day.display}
                        </td>
                      )}
                      
                      {/* Lecture Number */}
                      <td className="border border-black p-2 font-bold">
                        {timeSlot.index}
                      </td>
                      
                      {/* Time Slot */}
                      <td colSpan="2" className="border border-black p-2">
                        {timeSlot.time}
                      </td>
                      
                      {/* Division 1 Data */}
                      <td className="border border-black p-2">
                        {isDESlot ? "DE-IIB" : getSubjectCode(facultyId1)}
                      </td>
                      <td className="border border-black p-2">
                        {isDESlot ? "*" : getFacultyName(facultyId1)}
                      </td>
                      <td className="border border-black p-2">
                        {isDESlot ? "-" : getRoomNumber(dayIndex, slotIndex, "D1")}
                      </td>
                      
                      {/* Division 2 Data */}
                      <td className="border border-black p-2">
                        {isDESlot ? "DE-IIB" : getSubjectCode(facultyId2)}
                      </td>
                      <td className="border border-black p-2">
                        {isDESlot ? "*" : getFacultyName(facultyId2)}
                      </td>
                      <td className="border border-black p-2">
                        {isDESlot ? "-" : getRoomNumber(dayIndex, slotIndex, "D2")}
                      </td>
                      
                      {/* Time Slot (right side) */}
                      <td colSpan="2" className="border border-black p-2">
                        {timeSlot.time}
                      </td>
                      
                      {/* Lecture Number (right side) */}
                      <td className="border border-black p-2 font-bold">
                        {timeSlot.index}
                      </td>
                      
                      {/* Day (right side, only show on first row) */}
                      {slotIndex === 0 && (
                        <td rowSpan={timeSlots.length} className="border border-black p-2 font-bold">
                          {day.display}
                        </td>
                      )}
                    </tr>
                  );
                })}
                
                {/* Separator between days */}
                <tr>
                  <td colSpan="14" className="h-3 bg-black"></td>
                </tr>
              </React.Fragment>
            ))}
          </tbody>
        </table>
        
        {/* Footer Notes */}
        <div className="mt-8 p-4 border-t border-gray-300 print:mt-4">
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="font-bold mb-2">Subject Codes:</p>
              <ul className="space-y-1">
                <li>FAI - Fundamentals of AI</li>
                <li>PP - Python Programming</li>
                <li>MSE - Machine Learning</li>
                <li>MLE - Deep Learning</li>
                <li>DE-IIB - Departmental Elective</li>
              </ul>
            </div>
            <div>
              <p className="font-bold mb-2">Faculty Codes:</p>
              <ul className="space-y-1">
                {Object.entries(facultyNames).slice(0, 5).map(([id, name]) => (
                  <li key={id}>
                    {id} - {name}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-bold mb-2">Room Codes:</p>
              <ul className="space-y-1">
                <li>CL - Classroom</li>
                <li>LAB - Laboratory</li>
                <li>First number: Room number</li>
                <li>Second number: Floor number</li>
                <li>Example: CL-05/302 = Classroom 05, Room 302</li>
              </ul>
            </div>
          </div>
          
          <div className="mt-6 pt-4 border-t border-gray-300 text-center text-sm text-gray-600">
            <p>This timetable is generated electronically. No signature required.</p>
            <p className="mt-1">Generated on: {getCurrentDate()} | System: Timetable Management System</p>
          </div>
        </div>
      </div>
      
      {/* Print Styles */}
      <style>{`
        @media print {
          body {
            margin: 0;
            padding: 0;
            background: white;
          }
          
          .print\\:hidden {
            display: none !important;
          }
          
          #timetable-preview {
            width: 100%;
            font-size: 10pt;
          }
          
          .table {
            page-break-inside: avoid;
            page-break-after: auto;
          }
          
          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
          
          td {
            padding: 4px !important;
          }
        }
        
        /* Screen-only styles */
        @media screen {
          #timetable-preview {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            border: 1px solid #e5e7eb;
            border-radius: 12px;
            background: white;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          }
          
          .table {
            min-width: 100%;
          }
          
          td {
            padding: 8px;
            font-weight: 500;
          }
        }
      `}</style>
    </div>
  );
};

export default Preview;