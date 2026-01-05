import React, { useEffect, useState } from "react";
import { X, AlertCircle, CheckCircle, User, PenTool, Loader2, BookOpen, Shield } from "lucide-react";
import api from "../configs/api";

export default function EditFacultyModal({ faculty, isOpen, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: faculty?.name || ""
  });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    if (faculty && isOpen) {
      setFormData({ name: faculty.name });
      setErrorMsg("");
      setSuccessMsg("");
    }
  }, [faculty, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setErrorMsg("Tutor name is required");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const response = await api.put(`/api/faculties/${faculty.id}`, {
        name: formData.name.trim()
      });

      if (response.data.success) {
        setSuccessMsg("Tutor updated successfully!");
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1500);
      } else {
        setErrorMsg(response.data.error || "Failed to update tutor");
      }
    } catch (error) {
      console.error("Error updating tutor:", error);
      setErrorMsg(error.response?.data?.error || "Failed to update tutor");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      {/* Decorative Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/4 w-64 h-64 bg-gradient-to-br from-indigo-100/30 to-transparent rounded-full"></div>
        <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-gradient-to-tr from-blue-100/20 to-transparent rounded-full"></div>
      </div>

      <div className="relative z-10 bg-white rounded-2xl w-full max-w-md overflow-hidden border-2 border-indigo-200 shadow-xl">
        {/* Notebook Spine Effect */}
        <div className="absolute left-0 top-0 bottom-0 w-2 bg-gradient-to-b from-indigo-400 to-indigo-300 rounded-l-xl"></div>

        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-indigo-100/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-indigo-100 to-indigo-200 rounded-lg border border-indigo-300">
                <PenTool className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Edit Tutor Profile
                </h2>
                <p className="text-gray-600 text-sm mt-1">
                  Update tutor information and details
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gradient-to-r hover:from-indigo-100 hover:to-indigo-50 rounded-lg border border-indigo-200 hover:border-indigo-300 transition-all duration-300"
            >
              <X className="w-5 h-5 text-indigo-600" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6">
            <div className="space-y-6">
              {/* Tutor ID Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-indigo-600" />
                  Tutor ID
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={faculty.id}
                    disabled
                    className="w-full px-4 py-3 pl-11 bg-gradient-to-r from-gray-100 to-gray-50 border border-gray-300 rounded-lg cursor-not-allowed text-gray-600"
                  />
                  <BookOpen className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                </div>
                <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                  <Info className="w-3 h-3" />
                  Tutor ID cannot be changed (unique identifier)
                </p>
              </div>

              {/* Tutor Name Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <User className="w-4 h-4 text-indigo-600" />
                  Tutor Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter tutor's full name"
                    className="w-full px-4 py-3 pl-11 bg-white border border-gray-300 text-gray-900 placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-sm"
                    required
                  />
                  <User className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                </div>
              </div>

              {/* Current Information */}
              <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100/50 rounded-xl border border-gray-200">
                <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Info className="w-4 h-4 text-blue-600" />
                  Current Information
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Original Name:</span>
                    <span className="font-medium text-gray-900">{faculty.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">New Name:</span>
                    <span className={`font-medium ${formData.name ? 'text-emerald-600' : 'text-gray-400'}`}>
                      {formData.name || "Not set"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Error Message */}
              {errorMsg && (
                <div className="p-4 bg-gradient-to-r from-rose-50 to-rose-100/50 rounded-xl border-2 border-rose-200">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-gradient-to-br from-rose-100 to-rose-200 rounded-lg border border-rose-300">
                      <AlertCircle className="w-5 h-5 text-rose-600" />
                    </div>
                    <div>
                      <p className="font-medium text-rose-800 mb-1">Update Failed</p>
                      <p className="text-rose-700 text-sm">{errorMsg}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Success Message */}
              {successMsg && (
                <div className="p-4 bg-gradient-to-r from-emerald-50 to-emerald-100/50 rounded-xl border-2 border-emerald-200">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-lg border border-emerald-300">
                      <CheckCircle className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="font-medium text-emerald-800 mb-1">Tutor Updated!</p>
                      <p className="text-emerald-700 text-sm">{successMsg}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-200 bg-gradient-to-r from-indigo-50/50 to-blue-50/50">
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100/50 transition-all duration-300 hover:border-gray-400"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !formData.name.trim()}
                className={`px-4 py-2.5 rounded-lg font-medium transition-all duration-300 shadow-sm hover:shadow-md flex items-center gap-2 group ${
                  loading || !formData.name.trim()
                    ? "bg-gradient-to-r from-gray-100 to-gray-50 text-gray-400 border border-gray-200 cursor-not-allowed"
                    : "bg-gradient-to-r from-indigo-600 to-indigo-700 text-white hover:from-indigo-700 hover:to-indigo-800"
                }`}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin group-hover:rotate-180 transition-transform" />
                    Updating...
                  </>
                ) : (
                  <>
                    <PenTool className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    Update Tutor
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

// Helper Info icon component
const Info = ({ className }) => (
  <svg className={className} width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14Zm0-1A6 6 0 1 0 8 2a6 6 0 0 0 0 12Z"/>
    <path d="M8.5 4.5a.5.5 0 0 0-1 0v.25a.5.5 0 0 0 1 0V4.5Zm0 2.75a.5.5 0 0 0-1 0V11a.5.5 0 0 0 1 0V7.25Z"/>
  </svg>
);