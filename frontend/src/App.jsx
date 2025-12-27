import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import MakeTimetable from "./pages/MakeTimetable";
import ReplaceLecture from "./pages/ReplaceLecture";
import EditTimetable from "./pages/EditTimetable";
import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import AuthPage from "./pages/AuthPage";
import ViewChanges from "./pages/ViewChanges";
import TimeTable from "./pages/TimeTable";

function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/edit" element={<TimeTable />} />
        <Route path="/" element={<Dashboard />} />
        <Route path="/timetable" element={<TimeTable />} />
        <Route path="/replace" element={<ReplaceLecture />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/changes" element={<ViewChanges />} />
      </Routes>
    </>
  );
}

export default App;
