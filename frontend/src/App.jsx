import { useState, useEffect } from "react";
import Landing from "./Landing";
import ReportAnalyzer from "./ReportAnalyzer"; 

const API_BASE = import.meta.env.VITE_API_URL || "https://medicalcue-3.onrender.com";

export default function App() {
  const [currentPage, setCurrentPage] = useState("home");
  const [backendReady, setBackendReady] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      i++;
      if (i <= 3) setLoadingStep(i);
    }, 15000);

    const ping = async () => {
      try {
        const res = await fetch(`${API_BASE}/health`, {
          signal: AbortSignal.timeout(65000)
        });
        if (res.ok) {
          setBackendReady(true);
          clearInterval(interval);
        } else {
          setTimeout(ping, 5000);
        }
      } catch {
        setTimeout(ping, 5000);
      }
    };

    ping();
    return () => clearInterval(interval);
  }, []);

  if (!backendReady) {
    return <LoadingScreen step={loadingStep} />;
  }

   if (currentPage === "report") {
    return <ReportAnalyzer onBack={() => setCurrentPage("home")} />;
  }

  return <Landing onNavigate={setCurrentPage} />;
}

const STEPS = [
  { icon: "🩺", text: "Preparing Medical AI Platform..." },
  { icon: "✓",  text: "Loading disease database" },
  { icon: "⏳", text: "Starting AI services..." },
  { icon: "⌛", text: "Connecting to backend..." },
];

function LoadingScreen({ step }) {
  return (
    <div style={ls.root}>
      <div style={ls.orb1} />
      <div style={ls.orb2} />

      <div style={ls.card}>
        <div style={ls.logoRow}>
          <svg width="36" height="36" viewBox="0 0 28 28" fill="none">
            <circle cx="14" cy="14" r="13" stroke="#315CD1" strokeWidth="1.5"/>
            <path d="M7 14 Q10 8 14 14 Q18 20 21 14" stroke="#315CD1"
              strokeWidth="2" fill="none" strokeLinecap="round"/>
            <circle cx="14" cy="14" r="2.5" fill="#315CD1"/>
          </svg>
          <span style={ls.logoText}>MediCue</span>
        </div>

        <div style={ls.spinnerWrap}>
          <div style={ls.spinnerRing} />
          <span style={ls.spinnerIcon}>🩺</span>
        </div>

        <div style={ls.steps}>
          {STEPS.map((s, i) => {
            const isActive  = i === step;
            const isDone    = i < step;
            const isPending = i > step;
            return (
              <div key={i} style={{
                ...ls.stepRow,
                opacity: isPending ? 0.35 : 1,
                transform: isActive ? "scale(1.02)" : "scale(1)",
                transition: "all 0.4s ease",
              }}>
                <div style={{
                  ...ls.stepIcon,
                  background: isDone ? "#E8F5E9" : isActive ? "#315CD110" : "#F0F0F0",
                  color: isDone ? "#2E7D32" : isActive ? "#315CD1" : "#999",
                }}>
                  {isDone ? "✓" : s.icon}
                </div>
                <span style={{
                  ...ls.stepText,
                  color: isDone ? "#2E7D32" : isActive ? "#182E6C" : "#999",
                  fontWeight: isActive ? "600" : "400",
                }}>
                  {s.text}
                </span>
                {isActive && <div style={ls.activeDot} />}
              </div>
            );
          })}
        </div>

        <div style={ls.note}>
          ⚡ This may take up to 1 minute on the first visit.<br/>
          The server wakes up automatically — please wait.
        </div>

        <div style={ls.barTrack}>
          <div style={{
            ...ls.barFill,
            width: `${((step + 1) / STEPS.length) * 100}%`,
            transition: "width 1.5s ease",
          }} />
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.8); }
        }
      `}</style>
    </div>
  );
}

const ls = {
  root: {
    minHeight: "100vh", display: "flex", alignItems: "center",
    justifyContent: "center", position: "relative",
    background: "linear-gradient(145deg, #F8FAFC 0%, #EEF2F7 50%, #CDCBE2 100%)",
    fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
  },
  orb1: {
    position: "fixed", top: "-100px", right: "-80px",
    width: "400px", height: "400px", borderRadius: "50%",
    background: "radial-gradient(circle, #315CD115 0%, transparent 70%)",
    pointerEvents: "none",
  },
  orb2: {
    position: "fixed", bottom: "-80px", left: "-60px",
    width: "320px", height: "320px", borderRadius: "50%",
    background: "radial-gradient(circle, #CDCBE240 0%, transparent 70%)",
    pointerEvents: "none",
  },
  card: {
    background: "rgba(255,255,255,0.85)",
    backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
    border: "1.5px solid #D9E1EC", borderRadius: "28px",
    padding: "48px 44px", maxWidth: "420px", width: "90%",
    boxShadow: "0 8px 40px rgba(24,46,108,0.10)",
    display: "flex", flexDirection: "column", alignItems: "center", gap: "28px",
    position: "relative", zIndex: 1,
  },
  logoRow: { display: "flex", alignItems: "center", gap: "10px" },
  logoText: {
    fontSize: "22px", fontWeight: "800", color: "#182E6C", letterSpacing: "-0.5px",
  },
  spinnerWrap: {
    position: "relative", width: "72px", height: "72px",
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  spinnerRing: {
    position: "absolute", inset: 0, borderRadius: "50%",
    border: "3px solid #EEF2F7", borderTop: "3px solid #315CD1",
    animation: "spin 1s linear infinite",
  },
  spinnerIcon: { fontSize: "28px", zIndex: 1 },
  steps: { width: "100%", display: "flex", flexDirection: "column", gap: "12px" },
  stepRow: { display: "flex", alignItems: "center", gap: "12px" },
  stepIcon: {
    width: "32px", height: "32px", borderRadius: "50%",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: "14px", flexShrink: 0, fontWeight: "700",
  },
  stepText: { fontSize: "14px", flex: 1 },
  activeDot: {
    width: "6px", height: "6px", borderRadius: "50%", background: "#315CD1",
    flexShrink: 0, animation: "pulse 1s ease-in-out infinite",
  },
  note: {
    fontSize: "12px", color: "#96ABD7", textAlign: "center",
    lineHeight: "1.7", fontStyle: "italic",
  },
  barTrack: { width: "100%", height: "4px", background: "#EEF2F7", borderRadius: "100px" },
  barFill: {
    height: "100%", borderRadius: "100px",
    background: "linear-gradient(90deg, #315CD1, #7C6FCD)",
  },
};
