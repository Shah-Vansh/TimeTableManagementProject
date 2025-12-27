import React, { useState } from "react";
import { X, AlertCircle, CheckCircle } from "lucide-react";
import api from "../configs/api";

export default function EditFacultyModal({ faculty, isOpen, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: faculty?.name || ""
  });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setErrorMsg("Faculty name is required");
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
        setSuccessMsg("Faculty updated successfully!");
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1500);
      } else {
        setErrorMsg(response.data.error || "Failed to update faculty");
      }
    } catch (error) {
      console.error("Error updating faculty:", error);
      setErrorMsg(error.response?.data?.error || "Failed to update faculty");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Edit Faculty
              </h2>
              <p className="text-gray-600 text-sm mt-1">
                Update faculty information
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Faculty ID
                </label>
                <input
                  type="text"
                  value={faculty.id}
                  disabled
                  className="w-full px-4 py-3 bg-gray-100 border border-gray-300 rounded-lg cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Faculty ID cannot be changed
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Faculty Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter faculty name"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
            </div>

            {errorMsg && (
              <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                <p className="text-red-700 text-sm">{errorMsg}</p>
              </div>
            )}

            {successMsg && (
              <div className="mt-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                <p className="text-emerald-700 text-sm">{successMsg}</p>
              </div>
            )}
          </div>

          <div className="p-6 border-t border-gray-200 bg-gray-50">
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !formData.name.trim()}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  loading || !formData.name.trim()
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                {loading ? "Updating..." : "Update Faculty"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}