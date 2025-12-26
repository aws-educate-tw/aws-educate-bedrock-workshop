import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { GamePage } from './pages/GamePage';
import { SummaryPage } from './pages/SummaryPage';
import { AchievementPage } from './pages/AchievementPage';
import { ReportPage } from './pages/ReportPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/game" element={<GamePage />} />
        <Route path="/summary" element={<SummaryPage />} />
        <Route path="/achievement" element={<AchievementPage />} />
        <Route path="/report" element={<ReportPage />} />
      </Routes>
    </Router>
  );
}

export default App;