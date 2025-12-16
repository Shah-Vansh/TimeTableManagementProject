import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import MakeTimetable from "./pages/MakeTimetable";

function App() {
  return (
    <Routes>
      <Route path="/" element={<MakeTimetable />} />
    </Routes>
  );
}

export default App;