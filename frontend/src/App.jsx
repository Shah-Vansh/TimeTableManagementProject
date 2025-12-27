import React from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";

import Dashboard from "./pages/Dashboard";
import AuthPage from "./pages/AuthPage";
import ReplaceLecture from "./pages/ReplaceLecture";
import ViewChanges from "./pages/ViewChanges";
import TimeTable from "./pages/TimeTable";
import FacultyTimetable from "./pages/FacultyTimetable";
import Faculties from "./pages/Faculties";

function App() {
  const location = useLocation();

  // hide navbar on auth page
  const hideNavbar = location.pathname === "/auth";

  return (
    <>
      {!hideNavbar && <Navbar />}

      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/" element={<Dashboard />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/edit" element={<TimeTable />} />
        <Route path="/timetable" element={<TimeTable />} />
        <Route path="/replace" element={<ReplaceLecture />} />
        <Route path="/changes" element={<ViewChanges />} />
        <Route path="/faculties" element={<Faculties />} />
        <Route path="/faculty/:facultyId" element={<FacultyTimetable />} />
      </Routes>
    </>
  );
}

export default App;
