import React from "react";
import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./pages/ProtectedRoute";

import Dashboard from "./pages/Dashboard";
import AuthPage from "./pages/AuthPage";
import ReplaceLecture from "./pages/ReplaceLecture";
import ViewChanges from "./pages/ViewChanges";
import TimeTable from "./pages/TimeTable";
import FacultyTimetable from "./pages/FacultyTimetable";
import Faculties from "./pages/Faculties";
import FacultyProfile from "./pages/FacultyProfile";
import PreviewTimetable from "./pages/PreviewTimetable";
import AutoGenerateTimetable from "./pages/AutoGenerateTimetable";
import PreviewFullTimetable from "./pages/PreviewFull";
import FullTimetable from "./pages/FullTimetable";
import AutoBranchTimetable from "./pages/AutoBranchTimetable";

function App() {
  const location = useLocation();
  const hideNavbar = location.pathname === "/auth";

  return (
    <>
      {!hideNavbar && <Navbar />}

      <Routes>
        {/* Public Route */}
        <Route path="/auth" element={<AuthPage />} />

        {/* Protected Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/auto"
          element={
            <ProtectedRoute>
              <AutoGenerateTimetable />
            </ProtectedRoute>
          }
        />
        <Route
          path="/full"
          element={
            <ProtectedRoute>
              <PreviewFullTimetable />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/fullsave"
          element={
            <ProtectedRoute>
              <FullTimetable />
            </ProtectedRoute>
          }
        />
        <Route
          path="/autobranch"
          element={
            <ProtectedRoute>
              <AutoBranchTimetable />
            </ProtectedRoute>
          }
        />

        <Route
          path="/edit"
          element={
            <ProtectedRoute>
              <TimeTable />
            </ProtectedRoute>
          }
        />

        <Route
          path="/timetable"
          element={
            <ProtectedRoute>
              <TimeTable />
            </ProtectedRoute>
          }
        />

        <Route
          path="/replace"
          element={
            <ProtectedRoute>
              <ReplaceLecture />
            </ProtectedRoute>
          }
        />

        <Route
          path="/changes"
          element={
            <ProtectedRoute>
              <ViewChanges />
            </ProtectedRoute>
          }
        />

        <Route
          path="/faculties"
          element={
            <ProtectedRoute>
              <Faculties />
            </ProtectedRoute>
          }
        />

        <Route
          path="/faculty/:facultyId"
          element={
            <ProtectedRoute>
              <FacultyTimetable />
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <FacultyProfile />
            </ProtectedRoute>
          }
        />

        <Route
          path="/preview"
          element={
            <ProtectedRoute>
              <PreviewTimetable />
            </ProtectedRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/auth" />} />
      </Routes>
    </>
  );
}

export default App;
