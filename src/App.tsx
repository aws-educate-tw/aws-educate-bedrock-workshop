import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { AchievementPage } from "./pages/AchievementPage";
import { GamePage } from "./pages/GamePage";
import { HomePage } from "./pages/HomePage";
import { ReportPage } from "./pages/ReportPage";
import { SummaryPage } from "./pages/SummaryPage";

const router = createBrowserRouter(
  [
    { path: "/", element: <HomePage /> },
    { path: "/game", element: <GamePage /> },
    { path: "/summary", element: <SummaryPage /> },
    { path: "/achievement", element: <AchievementPage /> },
    { path: "/report", element: <ReportPage /> },
  ],
  {
    future: {
      v7_startTransition: true,
      v7_relativeSplatPath: true,
    },
  }
);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
