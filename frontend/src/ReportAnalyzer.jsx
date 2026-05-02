import { useState, useRef, useCallback } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

const STATUS_COLORS = {
  Normal:   { bg: "#E8F5E9", text: "#2E7D32", bar: "#4CAF50" },
  High:     { bg: "#FFF3E0", text: "#E65100", bar: "#FF9800" },
  Low:      { bg: "#E3F2FD", text: "#1565C0", bar: "#2196F3" },
  Critical: { bg: "#FCE4EC", text: "#B71C1C", bar: "#F44336" },
};

const URGENCY_COLORS = {
  Routine:         { bg: "#E8F5E9", text: "#2E7D32", icon: "✅" },
  "Follow-up Soon":{ bg: "#FFF3E0", text: "#E65100", icon: "⚠️" },
  Urgent:          { bg: "#FCE4EC", text: "#C62828", icon: "🚨" },
  Emergency:       { bg: "#FCE4EC", text: "#B71C1C", icon: "🆘" },
};

export default function ReportAnalyzer({ onBack }) {
  const [tab, setTab]             = useState("upload"); // upload | paste
  const [file, setFile]           = useState(null);
  const [pasteText, setPasteText] = useState("");
  const [dragging, setDragging]   = useState(false);
  const [loading, setLoading]     = useState(false);
  const [result, setResult]       = useState(null);
  const [error, setError]         = useState("");
  const [question, setQuestion]   = useState("");
  const [answer, setAnswer]       = useState("");
  const [askLoading, setAskLoading] = useState(false);
  const [activeSection, setActiveSection] = useState("summary");
  const fileRef = useRef();

  // ── Drag & Drop ─────────────────────────────────────────────
  const onDrop = useCallback((e) => {
    e.preventDefault(); setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) setFile(f);
  }, []);

  // ── Submit ──────────────────────────────────────────────────
  const handleAnalyze = async () => {
    setError(""); setResult(null); setAnswer("");
    if (tab === "upload" && !file) return setError("Please upload a file first.");
    if (tab === "paste" && !pasteText.trim()) return setError("Please paste some report text.");
    setLoading(true);
    try {
      const fd = new FormData();
      if (tab === "upload") fd.append("file", file);
      else fd.append("plain_text", pasteText);

      const res  = await fetch(`${API_BASE}/analyze-report`, { method: "POST", body: fd });
      const data = await res.json();
      if (data.error) setError(data.error);
      else setResult(data);
    } catch (e) {
      setError("Failed to connect to backend. Make sure it is running.");
    }
    setLoading(false);
  };

  const handleAsk = async () => {
    if (!question.trim() || !result) return;
    setAskLoading(true); setAnswer("");
    try {
      const res = await fetch(`${API_BASE}/ask-report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          report_summary: result.simplified_summary || "",
          question,
        }),
      });
      const data = await res.json();
      setAnswer(data.answer || "");
    } catch { setAnswer("Could not get an answer. Please try again."); }
    setAskLoading(false);
  };

  const urgency = result ? (URGENCY_COLORS[result.urgency_level] || URGENCY_COLORS["Routine"]) : null;

  return (
    <div style={s.page}>
      <div style={s.bgOrb1} /><div style={s.bgOrb2} />

      {/* ── HEADER ─────────────────────────────── */}
      <div style={s.header}>
        <button onClick={onBack} style={{
  display: "flex", alignItems: "center", gap: "6px",
  background: "none", border: "1px solid #D9E1EC",
  borderRadius: "10px", padding: "8px 16px",
  fontSize: "13px", fontWeight: "600", color: "#5E6B85",
  cursor: "pointer", marginBottom: "24px", fontFamily: "inherit",
}}>
  ← Back to MediCue
</button>
        <div style={s.headerBadge}>
          <span style={s.badgeDot} />AI Report Analysis
        </div>
        <h1 style={s.headerTitle}>Medical Report Analyzer</h1>
        <p style={s.headerSub}>
          Upload your medical report — get a plain-language breakdown, abnormal findings, and AI-powered insights instantly.
        </p>
      </div>

      {/* ── UPLOAD PANEL ───────────────────────── */}
      {!result && (
        <div style={s.uploadPanel}>
          {/* Tab switcher */}
          <div style={s.tabRow}>
            {["upload","paste"].map(t => (
              <button key={t} style={{ ...s.tabBtn, ...(tab===t ? s.tabBtnActive : {}) }}
                onClick={() => setTab(t)}>
                {t === "upload" ? "📎 Upload File" : "📝 Paste Text"}
              </button>
            ))}
          </div>

          {tab === "upload" ? (
            <div
              style={{ ...s.dropzone, ...(dragging ? s.dropzoneDrag : {}), ...(file ? s.dropzoneFilled : {}) }}
              onClick={() => fileRef.current.click()}
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
            >
              <input ref={fileRef} type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp,.txt"
                style={{ display:"none" }}
                onChange={e => setFile(e.target.files[0])}
              />
              {file ? (
                <div style={s.fileChosen}>
                  <span style={s.fileIcon}>{file.name.endsWith(".pdf") ? "📄" : "🖼️"}</span>
                  <div>
                    <div style={s.fileName}>{file.name}</div>
                    <div style={s.fileSize}>{(file.size/1024).toFixed(1)} KB</div>
                  </div>
                  <button style={s.removeBtn} onClick={e => { e.stopPropagation(); setFile(null); }}>✕</button>
                </div>
              ) : (
                <>
                  <div style={s.dropIcon}>📋</div>
                  <div style={s.dropTitle}>Drop your report here</div>
                  <div style={s.dropSub}>PDF, JPG, PNG, WEBP, TXT · Click or drag to upload</div>
                </>
              )}
            </div>
          ) : (
            <textarea
              style={s.pasteArea}
              placeholder="Paste your medical report text here...&#10;&#10;Example: Blood Test Report&#10;Hemoglobin: 11.2 g/dL (Normal: 13.5-17.5)&#10;WBC: 11,500 /µL (Normal: 4,500-11,000)..."
              value={pasteText}
              onChange={e => setPasteText(e.target.value)}
              rows={10}
            />
          )}

          {error && <div style={s.errorBox}>⚠️ {error}</div>}

          <button style={{ ...s.analyzeBtn, ...(loading ? s.analyzeBtnLoading : {}) }}
            onClick={handleAnalyze} disabled={loading}>
            {loading ? (
              <span style={s.loadingRow}>
                <span style={s.spinner} />Analyzing your report…
              </span>
            ) : "🔬 Analyze Report"}
          </button>

          <div style={s.disclaimer}>
            🔒 Your report is processed securely and not stored. For educational purposes only.
          </div>
        </div>
      )}

      {/* ── RESULTS ────────────────────────────── */}
      {result && (
        <div style={s.results}>

          {/* Top strip */}
          <div style={s.resultTopBar}>
            <div>
              <div style={s.reportTypeBadge}>{result.report_type || "Medical Report"}</div>
              <h2 style={s.resultTitle}>Analysis Complete</h2>
              <p style={s.resultSub}>{result.patient_summary}</p>
            </div>
            <button style={s.newBtn} onClick={() => { setResult(null); setFile(null); setPasteText(""); setAnswer(""); }}>
              + Analyze Another
            </button>
          </div>

          {/* Urgency banner */}
          {result.urgency_level && (
            <div style={{ ...s.urgencyBanner, background: urgency.bg, color: urgency.text }}>
              <span style={s.urgencyIcon}>{urgency.icon}</span>
              <div>
                <strong>Urgency: {result.urgency_level}</strong>
                {result.urgency_level === "Urgent" || result.urgency_level === "Emergency"
                  ? " — Please consult a doctor as soon as possible."
                  : result.urgency_level === "Follow-up Soon"
                  ? " — Schedule a follow-up with your doctor."
                  : " — Results appear within normal limits. Continue regular check-ups."}
              </div>
            </div>
          )}

          {/* Stats row */}
          {result.stats && (
            <div style={s.statsRow}>
              {[
                { label: "Total Tests", val: result.stats.total_tests, color: "#315CD1" },
                { label: "Normal", val: result.stats.normal_count, color: "#2E7D32" },
                { label: "Abnormal", val: result.stats.abnormal_count, color: "#E65100" },
                { label: "Critical", val: result.stats.critical_count, color: "#B71C1C" },
              ].map(s2 => (
                <div key={s2.label} style={s.statCard}>
                  <span style={{ ...s.statVal, color: s2.color }}>{s2.val}</span>
                  <span style={s.statLbl}>{s2.label}</span>
                </div>
              ))}
            </div>
          )}

          {/* Section nav */}
          <div style={s.sectionNav}>
            {[
              { id:"summary",   label:"📋 Summary" },
              { id:"tests",     label:"🧪 Test Values" },
              { id:"abnormal",  label:"⚠️ Findings" },
              { id:"conditions",label:"🔗 Conditions" },
              { id:"terms",     label:"📖 Medical Terms" },
              { id:"ask",       label:"💬 Ask AI" },
            ].map(n => (
              <button key={n.id}
                style={{ ...s.secNavBtn, ...(activeSection===n.id ? s.secNavBtnActive : {}) }}
                onClick={() => setActiveSection(n.id)}>
                {n.label}
              </button>
            ))}
          </div>

          {/* ── SUMMARY ── */}
          {activeSection === "summary" && (
            <div style={s.section}>
              <div style={s.aiCard}>
                <div style={s.aiCardHeader}>
                  <span style={s.aiSparkle}>✨</span>
                  <span style={s.aiCardTitle}>AI Simplified Summary</span>
                  <span style={s.aiCardBadge}>Simplified by AI</span>
                </div>
                <p style={s.aiCardText}>{result.simplified_summary}</p>
              </div>
              {result.recommendations?.length > 0 && (
                <div style={s.card}>
                  <h3 style={s.cardTitle}>💡 Recommendations</h3>
                  <ul style={s.bulletList}>
                    {result.recommendations.map((r,i) => (
                      <li key={i} style={s.bulletItem}>
                        <span style={s.bulletDot} />{r}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* ── TEST VALUES + CHARTS ── */}
          {activeSection === "tests" && (
            <div style={s.section}>
              <div style={s.card}>
                <h3 style={s.cardTitle}>🧪 Test Results with Normal Ranges</h3>
                {result.test_values?.length > 0 ? (
                  <div style={s.testGrid}>
                    {result.test_values.map((t, i) => {
                      const sc = STATUS_COLORS[t.status] || STATUS_COLORS.Normal;
                      const min = parseFloat(t.normal_min) || 0;
                      const max = parseFloat(t.normal_max) || 0;
                      const val = parseFloat(t.numeric_value) || 0;
                      const chartMax = Math.max(max * 1.4, val * 1.2, 0.1);
                      const valPct   = Math.min((val / chartMax) * 100, 100);
                      const minPct   = (min / chartMax) * 100;
                      const maxPct   = (max / chartMax) * 100;
                      return (
                        <div key={i} style={s.testCard}>
                          <div style={s.testHeader}>
                            <span style={s.testName}>{t.test_name}</span>
                            <span style={{ ...s.statusChip, background: sc.bg, color: sc.text }}>
                              {t.status}
                            </span>
                          </div>
                          <div style={s.testValueRow}>
                            <span style={{ ...s.testValue, color: sc.text }}>{t.value}</span>
                            <span style={s.testRange}>Normal: {t.normal_range}</span>
                          </div>
                          {/* Bar chart */}
                          {max > 0 && (
                            <div style={s.barWrap}>
                              <div style={s.barTrack}>
                                {/* Normal range highlight */}
                                <div style={{
                                  ...s.normalRange,
                                  left: `${minPct}%`,
                                  width: `${maxPct - minPct}%`,
                                }} />
                                {/* Value bar */}
                                <div style={{
                                  ...s.valueBar,
                                  width: `${valPct}%`,
                                  background: sc.bar,
                                }} />
                                {/* Value marker */}
                                <div style={{ ...s.valMarker, left: `${valPct}%` }} />
                              </div>
                              <div style={s.barLabels}>
                                <span>0</span>
                                <span style={{ color: "#2E7D32", fontSize:"10px" }}>
                                  ▐ Normal: {t.normal_range}
                                </span>
                                <span>{chartMax.toFixed(1)}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p style={s.emptyMsg}>No numeric test values were detected in this report.</p>
                )}
              </div>
            </div>
          )}

          {/* ── ABNORMAL FINDINGS ── */}
          {activeSection === "abnormal" && (
            <div style={s.section}>
              <div style={s.card}>
                <h3 style={s.cardTitle}>⚠️ Abnormal Findings</h3>
                {result.abnormal_findings?.length > 0 ? (
                  <div style={s.findingsList}>
                    {result.abnormal_findings.map((f, i) => {
                      const sevColor = f.severity==="Severe"||f.severity==="Critical"
                        ? { bg:"#FCE4EC", border:"#EF9A9A", text:"#B71C1C" }
                        : f.severity==="Moderate"
                        ? { bg:"#FFF3E0", border:"#FFCC80", text:"#E65100" }
                        : { bg:"#FFF8E1", border:"#FFE082", text:"#F57F17" };
                      return (
                        <div key={i} style={{ ...s.findingCard, background: sevColor.bg, borderColor: sevColor.border }}>
                          <div style={s.findingHeader}>
                            <span style={{ ...s.sevChip, color: sevColor.text }}>
                              {f.severity}
                            </span>
                            <span style={s.findingName}>{f.finding}</span>
                          </div>
                          <p style={s.findingExpl}>{f.explanation}</p>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div style={s.allNormal}>
                    <span style={{ fontSize:"32px" }}>✅</span>
                    <p>No significant abnormal findings detected.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── DETECTED CONDITIONS ── */}
          {activeSection === "conditions" && (
            <div style={s.section}>
              <div style={s.card}>
                <h3 style={s.cardTitle}>🔗 Detected Conditions</h3>
                {result.detected_conditions?.length > 0 ? (
                  <div style={s.condGrid}>
                    {result.detected_conditions.map((c, i) => (
                      <div key={i} style={s.condCard}>
                        <span style={s.condIcon}>🏥</span>
                        <span style={s.condName}>{c}</span>
                        <button style={s.condSearchBtn}
                          onClick={() => window.dispatchEvent(new CustomEvent("medicue-search", { detail: c }))}>
                          Search in MediCue →
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={s.emptyMsg}>No specific conditions detected.</p>
                )}
              </div>
            </div>
          )}

          {/* ── MEDICAL TERMS ── */}
          {activeSection === "terms" && (
            <div style={s.section}>
              <div style={s.card}>
                <h3 style={s.cardTitle}>📖 Medical Terms Explained</h3>
                {result.key_medical_terms?.length > 0 ? (
                  <div style={s.termsList}>
                    {result.key_medical_terms.map((t, i) => (
                      <div key={i} style={s.termRow}>
                        <span style={s.termName}>{t.term}</span>
                        <span style={s.termArrow}>→</span>
                        <span style={s.termMeaning}>{t.meaning}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={s.emptyMsg}>No medical terms were extracted.</p>
                )}
              </div>
            </div>
          )}

          {/* ── ASK AI ── */}
          {activeSection === "ask" && (
            <div style={s.section}>
              <div style={s.aiCard}>
                <div style={s.aiCardHeader}>
                  <span style={s.aiSparkle}>💬</span>
                  <span style={s.aiCardTitle}>Ask About Your Report</span>
                </div>
                <div style={s.askSuggestions}>
                  {["What does this report mean?", "Which values are concerning?", "What should I ask my doctor?"].map(q => (
                    <button key={q} style={s.suggBtn} onClick={() => setQuestion(q)}>{q}</button>
                  ))}
                </div>
                <div style={s.askInputRow}>
                  <input
                    style={s.askInput}
                    placeholder="Ask anything about this report…"
                    value={question}
                    onChange={e => setQuestion(e.target.value)}
                    onKeyDown={e => e.key==="Enter" && handleAsk()}
                  />
                  <button style={s.askBtn} onClick={handleAsk} disabled={askLoading}>
                    {askLoading ? "…" : "Ask"}
                  </button>
                </div>
                {answer && (
                  <div style={s.answerCard}>
                    <div style={s.answerLabel}>AI Answer</div>
                    <p style={s.answerText}>{answer}</p>
                    <p style={s.answerDisclaimer}>Always consult a qualified doctor for personal medical advice.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Disclaimer */}
          <div style={s.bottomDisclaimer}>
            🔒 This analysis is for educational purposes only and does not constitute medical advice.
            Always consult a licensed healthcare professional for diagnosis and treatment.
          </div>
        </div>
      )}
    </div>
  );
}

// ── STYLES ────────────────────────────────────────────────────
const s = {
  page: {
    fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
    background: "#F8FAFC", minHeight: "100vh",
    padding: "40px 24px 80px", position: "relative", overflowX: "hidden",
    color: "#182E6C",
  },
  bgOrb1: {
    position:"fixed", top:"-100px", right:"-80px", width:"400px", height:"400px",
    borderRadius:"50%", background:"radial-gradient(circle,#315CD112 0%,transparent 70%)",
    zIndex:0, pointerEvents:"none",
  },
  bgOrb2: {
    position:"fixed", bottom:"-80px", left:"-60px", width:"320px", height:"320px",
    borderRadius:"50%", background:"radial-gradient(circle,#CDCBE240 0%,transparent 70%)",
    zIndex:0, pointerEvents:"none",
  },

  // HEADER
  header: { maxWidth:"720px", margin:"0 auto 40px", textAlign:"center", position:"relative", zIndex:1 },
  headerBadge: {
    display:"inline-flex", alignItems:"center", gap:"8px",
    fontSize:"11px", fontWeight:"700", color:"#315CD1",
    background:"#315CD108", border:"1px solid #315CD130",
    borderRadius:"100px", padding:"5px 14px", marginBottom:"16px",
    letterSpacing:"0.8px", textTransform:"uppercase",
  },
  badgeDot: { width:"6px", height:"6px", borderRadius:"50%", background:"#315CD1", display:"inline-block" },
  headerTitle: { fontSize:"clamp(28px,4vw,42px)", fontWeight:"800", color:"#182E6C", letterSpacing:"-1px", marginBottom:"12px" },
  headerSub: { fontSize:"16px", color:"#5E6B85", lineHeight:"1.7", maxWidth:"560px", margin:"0 auto" },

  // UPLOAD PANEL
  uploadPanel: {
    maxWidth:"640px", margin:"0 auto", position:"relative", zIndex:1,
    background:"rgba(255,255,255,0.85)", backdropFilter:"blur(20px)",
    border:"1.5px solid #D9E1EC", borderRadius:"24px", padding:"32px",
    boxShadow:"0 4px 32px rgba(24,46,108,0.08)",
  },
  tabRow: { display:"flex", gap:"8px", marginBottom:"24px" },
  tabBtn: {
    flex:1, padding:"10px", borderRadius:"12px", border:"1px solid #D9E1EC",
    background:"white", fontSize:"14px", fontWeight:"600", cursor:"pointer",
    color:"#5E6B85", transition:"all 0.2s", fontFamily:"inherit",
  },
  tabBtnActive: { background:"#315CD1", color:"white", borderColor:"#315CD1" },

  dropzone: {
    border:"2px dashed #D9E1EC", borderRadius:"16px", padding:"40px 24px",
    textAlign:"center", cursor:"pointer", transition:"all 0.2s",
    background:"#F8FAFC", marginBottom:"20px",
  },
  dropzoneDrag: { borderColor:"#315CD1", background:"#315CD108" },
  dropzoneFilled: { borderStyle:"solid", borderColor:"#315CD1", background:"#315CD105" },
  dropIcon: { fontSize:"36px", marginBottom:"12px" },
  dropTitle: { fontSize:"16px", fontWeight:"600", color:"#182E6C", marginBottom:"6px" },
  dropSub: { fontSize:"13px", color:"#96ABD7" },
  fileChosen: { display:"flex", alignItems:"center", gap:"14px", justifyContent:"center" },
  fileIcon: { fontSize:"28px" },
  fileName: { fontSize:"14px", fontWeight:"600", color:"#182E6C" },
  fileSize: { fontSize:"12px", color:"#96ABD7" },
  removeBtn: {
    width:"28px", height:"28px", borderRadius:"50%", border:"1px solid #D9E1EC",
    background:"white", cursor:"pointer", fontSize:"12px", color:"#5E6B85",
  },

  pasteArea: {
    width:"100%", border:"1.5px solid #D9E1EC", borderRadius:"16px",
    padding:"16px", fontSize:"14px", color:"#182E6C", fontFamily:"inherit",
    resize:"vertical", outline:"none", background:"#F8FAFC",
    marginBottom:"20px", boxSizing:"border-box", lineHeight:"1.6",
  },
  errorBox: {
    background:"#FCE4EC", border:"1px solid #EF9A9A", borderRadius:"10px",
    padding:"12px 16px", fontSize:"13px", color:"#C62828", marginBottom:"16px",
  },
  analyzeBtn: {
    width:"100%", background:"#315CD1", color:"white", border:"none",
    borderRadius:"14px", padding:"16px", fontSize:"16px", fontWeight:"700",
    cursor:"pointer", transition:"background 0.2s", fontFamily:"inherit",
  },
  analyzeBtnLoading: { background:"#96ABD7", cursor:"not-allowed" },
  loadingRow: { display:"flex", alignItems:"center", justifyContent:"center", gap:"10px" },
  spinner: {
    width:"16px", height:"16px", border:"2px solid rgba(255,255,255,0.3)",
    borderTop:"2px solid white", borderRadius:"50%",
    animation:"spin 0.8s linear infinite", display:"inline-block",
  },
  disclaimer: { fontSize:"12px", color:"#96ABD7", textAlign:"center", marginTop:"14px" },

  // RESULTS
  results: { maxWidth:"900px", margin:"0 auto", position:"relative", zIndex:1 },
  resultTopBar: {
    display:"flex", justifyContent:"space-between", alignItems:"flex-start",
    marginBottom:"20px", flexWrap:"wrap", gap:"16px",
  },
  reportTypeBadge: {
    display:"inline-block", fontSize:"11px", fontWeight:"700", color:"#315CD1",
    background:"#315CD110", borderRadius:"6px", padding:"3px 10px",
    marginBottom:"8px", letterSpacing:"0.5px", textTransform:"uppercase",
  },
  resultTitle: { fontSize:"clamp(22px,3vw,30px)", fontWeight:"800", color:"#182E6C", marginBottom:"6px", letterSpacing:"-0.5px" },
  resultSub: { fontSize:"14px", color:"#5E6B85", lineHeight:"1.6", maxWidth:"560px" },
  newBtn: {
    background:"white", border:"1.5px solid #315CD1", color:"#315CD1",
    borderRadius:"12px", padding:"10px 20px", fontSize:"14px", fontWeight:"600",
    cursor:"pointer", whiteSpace:"nowrap", fontFamily:"inherit",
  },

  urgencyBanner: {
    display:"flex", alignItems:"center", gap:"14px",
    borderRadius:"14px", padding:"16px 20px", marginBottom:"20px",
    fontSize:"14px", fontWeight:"500", border:"1px solid transparent",
  },
  urgencyIcon: { fontSize:"20px", flexShrink:0 },

  statsRow: {
    display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"12px",
    marginBottom:"24px",
  },
  statCard: {
    background:"white", border:"1px solid #D9E1EC", borderRadius:"14px",
    padding:"20px 16px", display:"flex", flexDirection:"column",
    alignItems:"center", gap:"6px",
    boxShadow:"0 2px 10px rgba(24,46,108,0.05)",
  },
  statVal: { fontSize:"28px", fontWeight:"800", letterSpacing:"-0.5px" },
  statLbl: { fontSize:"12px", color:"#5E6B85", fontWeight:"500" },

  sectionNav: {
    display:"flex", gap:"8px", flexWrap:"wrap", marginBottom:"24px",
  },
  secNavBtn: {
    padding:"8px 16px", borderRadius:"100px", border:"1px solid #D9E1EC",
    background:"white", fontSize:"13px", fontWeight:"600", cursor:"pointer",
    color:"#5E6B85", transition:"all 0.2s", fontFamily:"inherit",
  },
  secNavBtnActive: { background:"#315CD1", color:"white", borderColor:"#315CD1" },

  section: { display:"flex", flexDirection:"column", gap:"16px" },
  card: {
    background:"white", border:"1px solid #D9E1EC", borderRadius:"18px",
    padding:"28px", boxShadow:"0 2px 12px rgba(24,46,108,0.05)",
  },
  cardTitle: { fontSize:"16px", fontWeight:"700", color:"#182E6C", marginBottom:"20px" },

  // AI CARD
  aiCard: {
    background:"linear-gradient(135deg,rgba(49,92,209,0.07),rgba(124,111,205,0.09))",
    border:"1px solid rgba(49,92,209,0.18)", borderRadius:"18px", padding:"28px",
    backdropFilter:"blur(12px)",
  },
  aiCardHeader: { display:"flex", alignItems:"center", gap:"10px", marginBottom:"16px" },
  aiSparkle: { fontSize:"20px" },
  aiCardTitle: { fontSize:"16px", fontWeight:"700", color:"#182E6C", flex:1 },
  aiCardBadge: {
    fontSize:"10px", fontWeight:"700", color:"#315CD1",
    background:"#315CD115", borderRadius:"6px", padding:"3px 8px",
    letterSpacing:"0.5px", textTransform:"uppercase",
  },
  aiCardText: { fontSize:"15px", color:"#2C3E6B", lineHeight:"1.75" },

  bulletList: { listStyle:"none", padding:0, display:"flex", flexDirection:"column", gap:"10px" },
  bulletItem: { display:"flex", alignItems:"flex-start", gap:"10px", fontSize:"14px", color:"#5E6B85", lineHeight:"1.6" },
  bulletDot: { width:"8px", height:"8px", borderRadius:"50%", background:"#315CD1", flexShrink:0, marginTop:"6px" },

  // TEST VALUES
  testGrid: { display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:"16px" },
  testCard: {
    background:"#F8FAFC", border:"1px solid #EEF2F7", borderRadius:"14px", padding:"18px",
  },
  testHeader: { display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"10px" },
  testName: { fontSize:"14px", fontWeight:"600", color:"#182E6C" },
  statusChip: { fontSize:"11px", fontWeight:"700", borderRadius:"6px", padding:"3px 9px" },
  testValueRow: { display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:"12px" },
  testValue: { fontSize:"20px", fontWeight:"800", letterSpacing:"-0.5px" },
  testRange: { fontSize:"11px", color:"#96ABD7" },
  barWrap: { marginTop:"4px" },
  barTrack: { height:"10px", background:"#EEF2F7", borderRadius:"100px", position:"relative", overflow:"hidden" },
  normalRange: {
    position:"absolute", top:0, bottom:0,
    background:"rgba(46,125,50,0.15)", borderRadius:"100px",
  },
  valueBar: { height:"100%", borderRadius:"100px", transition:"width 0.6s ease", position:"relative", zIndex:1 },
  valMarker: {
    position:"absolute", top:"-2px", width:"3px", height:"14px",
    background:"#182E6C", borderRadius:"2px", transform:"translateX(-1px)", zIndex:2,
  },
  barLabels: { display:"flex", justifyContent:"space-between", fontSize:"10px", color:"#96ABD7", marginTop:"4px" },

  // FINDINGS
  findingsList: { display:"flex", flexDirection:"column", gap:"12px" },
  findingCard: { border:"1px solid", borderRadius:"14px", padding:"16px 20px" },
  findingHeader: { display:"flex", alignItems:"center", gap:"10px", marginBottom:"8px" },
  sevChip: { fontSize:"11px", fontWeight:"700", textTransform:"uppercase", letterSpacing:"0.5px" },
  findingName: { fontSize:"14px", fontWeight:"600", color:"#182E6C" },
  findingExpl: { fontSize:"13px", color:"#5E6B85", lineHeight:"1.6", margin:0 },
  allNormal: { textAlign:"center", padding:"40px", color:"#2E7D32", fontSize:"16px", fontWeight:"600" },

  // CONDITIONS
  condGrid: { display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))", gap:"12px" },
  condCard: {
    background:"#F8FAFC", border:"1px solid #EEF2F7", borderRadius:"14px",
    padding:"18px", display:"flex", flexDirection:"column", gap:"8px",
  },
  condIcon: { fontSize:"20px" },
  condName: { fontSize:"15px", fontWeight:"700", color:"#182E6C" },
  condSearchBtn: {
    fontSize:"12px", color:"#315CD1", background:"#315CD110",
    border:"none", borderRadius:"8px", padding:"6px 12px",
    cursor:"pointer", fontWeight:"600", fontFamily:"inherit", textAlign:"left",
  },

  // TERMS
  termsList: { display:"flex", flexDirection:"column", gap:"12px" },
  termRow: {
    display:"flex", alignItems:"flex-start", gap:"12px",
    padding:"14px 16px", background:"#F8FAFC", borderRadius:"12px",
    border:"1px solid #EEF2F7",
  },
  termName: { fontSize:"14px", fontWeight:"700", color:"#315CD1", minWidth:"160px", flexShrink:0 },
  termArrow: { color:"#D9E1EC", fontSize:"16px", flexShrink:0 },
  termMeaning: { fontSize:"13px", color:"#5E6B85", lineHeight:"1.6" },

  // ASK
  askSuggestions: { display:"flex", gap:"8px", flexWrap:"wrap", marginBottom:"16px" },
  suggBtn: {
    fontSize:"12px", color:"#315CD1", background:"white",
    border:"1px solid #96ABD7", borderRadius:"100px",
    padding:"6px 14px", cursor:"pointer", fontFamily:"inherit", fontWeight:"500",
  },
  askInputRow: { display:"flex", gap:"10px", marginBottom:"16px" },
  askInput: {
    flex:1, border:"1.5px solid #D9E1EC", borderRadius:"12px",
    padding:"12px 16px", fontSize:"14px", outline:"none",
    color:"#182E6C", fontFamily:"inherit", background:"white",
  },
  askBtn: {
    background:"#315CD1", color:"white", border:"none",
    borderRadius:"12px", padding:"12px 24px", fontSize:"14px",
    fontWeight:"700", cursor:"pointer", fontFamily:"inherit",
  },
  answerCard: {
    background:"white", border:"1px solid #D9E1EC", borderRadius:"14px", padding:"20px",
  },
  answerLabel: { fontSize:"11px", fontWeight:"700", color:"#315CD1", letterSpacing:"0.5px", textTransform:"uppercase", marginBottom:"10px" },
  answerText: { fontSize:"14px", color:"#182E6C", lineHeight:"1.75", marginBottom:"10px" },
  answerDisclaimer: { fontSize:"12px", color:"#96ABD7", fontStyle:"italic" },

  emptyMsg: { fontSize:"14px", color:"#96ABD7", textAlign:"center", padding:"30px" },
  bottomDisclaimer: {
    fontSize:"12px", color:"#96ABD7", textAlign:"center",
    marginTop:"32px", lineHeight:"1.6",
    padding:"16px", background:"white", borderRadius:"12px",
    border:"1px solid #EEF2F7",
  },
};
