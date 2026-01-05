import React from "react";
import { Clock, Eye, EyeOff } from "lucide-react";

const TimetableTable = ({ 
  timetable = {}, 
  showEmptySlots = true, 
  facultyName = "",
  onToggleEmptySlots = null,
  printMode = false
}) => {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dayKeys = ["mon", "tue", "wed", "thu", "fri", "sat"];
  const dayLabels = {
    "Mon": "Monday",
    "Tue": "Tuesday",
    "Wed": "Wednesday",
    "Thu": "Thursday",
    "Fri": "Friday",
    "Sat": "Saturday"
  };
  
  const timeSlots = [
    { label: "Lecture 1", time: "9:00 - 10:00" },
    { label: "Lecture 2", time: "10:00 - 11:00" },
    { label: "Lecture 3", time: "11:45 - 12:45" },
    { label: "Lecture 4", time: "12:45 - 1:45" },
    { label: "Lecture 5", time: "2:00 - 3:00" },
  ];

  const getCellColor = (lecture) => {
    if (lecture === "free" || !lecture) return "bg-gray-50";
    
    const parts = lecture.split('-');
    const branch = parts[0] || "UNKNOWN";
    
    const branchColors = {
      CSE: "bg-blue-50 border-blue-200",
      "CSE(AIML)": "bg-purple-50 border-purple-200",
      DS: "bg-emerald-50 border-emerald-200",
      IT: "bg-indigo-50 border-indigo-200",
      ECE: "bg-red-50 border-red-200",
      EEE: "bg-indigo-50 border-indigo-200",
      MECH: "bg-orange-50 border-orange-200",
      CIVIL: "bg-teal-50 border-teal-200",
    };
    
    return branchColors[branch] || "bg-gray-50 border-gray-200";
  };

  const getBranchColor = (branch) => {
    const branchColors = {
      CSE: "bg-blue-100 text-blue-800",
      "CSE(AIML)": "bg-purple-100 text-purple-800",
      DS: "bg-emerald-100 text-emerald-800",
      IT: "bg-indigo-100 text-indigo-800",
      ECE: "bg-red-100 text-red-800",
      EEE: "bg-indigo-100 text-indigo-800",
      MECH: "bg-orange-100 text-orange-800",
      CIVIL: "bg-teal-100 text-teal-800",
    };
    
    return branchColors[branch] || "bg-gray-100 text-gray-800";
  };

  // Calculate statistics
  const calculateStatistics = () => {
    let totalLectures = 0;
    const classesAssigned = new Set();
    const subjectsAssigned = new Set();
    const daysWithLectures = new Set();

    dayKeys.forEach((day) => {
      const daySchedule = timetable[day] || [];
      const hasLectures = daySchedule.some(lecture => lecture !== "free");
      
      if (hasLectures) {
        daysWithLectures.add(day);
        
        daySchedule.forEach((lecture) => {
          if (lecture !== "free") {
            totalLectures++;
            
            const parts = lecture.split('-');
            if (parts.length >= 2) {
              classesAssigned.add(parts[0]);
              subjectsAssigned.add(parts[1]);
            }
          }
        });
      }
    });

    return {
      totalLectures,
      daysPerWeek: daysWithLectures.size,
      classesAssigned: Array.from(classesAssigned),
      subjectsAssigned: Array.from(subjectsAssigned),
    };
  };

  const stats = calculateStatistics();

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm print:rounded-none print:border-0 print:shadow-none print:p-0">
      {/* Header for non-print mode */}
      {!printMode && (
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Weekly Timetable
            </h2>
            <p className="text-gray-600">
              Academic Year: {new Date().getFullYear()}-{new Date().getFullYear() + 1}
            </p>
          </div>
          {onToggleEmptySlots && (
            <button
              onClick={onToggleEmptySlots}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 ${
                showEmptySlots
                  ? "bg-blue-100 text-blue-700 border border-blue-200"
                  : "bg-gray-100 text-gray-700 border border-gray-200"
              }`}
            >
              {showEmptySlots ? (
                <Eye className="w-4 h-4" />
              ) : (
                <EyeOff className="w-4 h-4" />
              )}
              {showEmptySlots ? "Hide Free" : "Show Free"}
            </button>
          )}
        </div>
      )}

      {/* Timetable Table */}
      <div className="overflow-x-auto print:overflow-visible">
        <table className="w-full border-collapse print:text-sm">
          <thead>
            <tr className="bg-gray-50">
              <th className="border border-gray-200 p-3 text-left font-semibold text-gray-700 min-w-[120px] print:p-2">
                Time Slot
              </th>
              {days.map(day => (
                <th 
                  key={day} 
                  className="border border-gray-200 p-3 text-center font-semibold text-gray-700 min-w-[150px] print:p-2"
                >
                  {dayLabels[day]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {timeSlots.map((slot, timeIndex) => (
              <tr key={slot.label} className="hover:bg-gray-50">
                <td className="border border-gray-200 p-3 text-gray-700 print:p-2">
                  <div className="font-medium">{slot.label}</div>
                  <div className="text-xs text-gray-500 print:text-[10px]">{slot.time}</div>
                </td>
                {days.map(day => {
                  const dayKey = day.toLowerCase();
                  const lecture = timetable[dayKey]?.[timeIndex] || "free";
                  
                  if (!showEmptySlots && lecture === "free") {
                    return (
                      <td 
                        key={`${day}-${timeIndex}`} 
                        className="border border-gray-200 p-3 print:p-2"
                      >
                        <div className="h-10 flex items-center justify-center">
                          <span className="text-gray-400">—</span>
                        </div>
                      </td>
                    );
                  }

                  return (
                    <td 
                      key={`${day}-${timeIndex}`} 
                      className={`border p-3 ${getCellColor(lecture)} print:p-2`}
                    >
                      {lecture === "free" ? (
                        <div className="text-center text-gray-500 italic">
                          Free
                        </div>
                      ) : (
                        <div>
                          <div className="flex justify-between items-start mb-1">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${getBranchColor(lecture.split('-')[0])}`}>
                              {lecture.split('-')[0]}
                            </span>
                            <Clock className="w-3 h-3 text-gray-400" />
                          </div>
                          <div className="font-medium text-gray-900">
                            {lecture.split('-')[2]}-{lecture.split('-')[1]}
                          </div>
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200 print:text-sm print:p-2">
        <h4 className="font-semibold text-gray-700 mb-2">Color Legend:</h4>
        <div className="flex flex-wrap gap-2">
          {stats.classesAssigned.map(branch => (
            <div key={branch} className="flex items-center gap-1">
              <span className={`w-3 h-3 rounded ${getCellColor(branch + '-X')} border`}></span>
              <span className="text-sm text-gray-600">{branch}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Summary for Print */}
      {printMode && (
        <div className="mt-6 pt-4 border-t border-gray-200 print:text-sm">
          <h3 className="font-bold text-gray-900 mb-2">Timetable Summary</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p><strong>Faculty Name:</strong> {facultyName}</p>
              <p><strong>Total Lectures:</strong> {stats.totalLectures}</p>
              <p><strong>Teaching Days:</strong> {stats.daysPerWeek}/6</p>
            </div>
            <div>
              <p><strong>Branches:</strong> {stats.classesAssigned.join(', ')}</p>
              <p><strong>Subjects/Semesters:</strong> {stats.subjectsAssigned.length}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimetableTable;