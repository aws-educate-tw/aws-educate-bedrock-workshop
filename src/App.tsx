import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import { AchievementPage } from "./pages/AchievementPage";
import { GamePage } from "./pages/GamePage";
import { HomePage } from "./pages/HomePage";
import { ReportPage } from "./pages/ReportPage";
import { SummaryPage } from "./pages/SummaryPage";

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
