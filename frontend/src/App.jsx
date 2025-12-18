import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import MakeTimetable from "./pages/MakeTimetable";
import ReplaceLecture from "./pages/ReplaceLecture";
import EditTimetable from "./pages/EditTimeTable";

function App() {
  return (
    <Routes>
      <Route path="/" element={<MakeTimetable />} />
      <Route path="/edit" element={<EditTimetable />} />
      <Route path="/replace" element={<ReplaceLecture />} />
    </Routes>
  );
}

export default App; 