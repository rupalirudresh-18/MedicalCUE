import { useState } from "react";
import Landing from "./Landing";
import ReportAnalyzer from "./ReportAnalyzer";

export default function App() {
  const [currentPage, setCurrentPage] = useState("home");

  if (currentPage === "report") {
    return <ReportAnalyzer onBack={() => setCurrentPage("home")} />;
  }

  return <Landing onNavigate={setCurrentPage} />;
}