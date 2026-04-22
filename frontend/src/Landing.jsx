import { useState, useEffect, useRef } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "https://medicalcue-3.onrender.com";

const QUICK_CHIPS = ["Diabetes", "Asthma", "Migraine", "Dengue", "Hypertension", "PCOS"];

const FLOATING_CARDS = [
  {
    icon: "✨",
    label: "AI-Powered Insights",
    sub: "Understand symptoms, conditions, and medicines in simple language",
    color: "#315CD1",
  },
  {
    icon: "🩺",
    label: "Trusted Health Information",
    sub: "Explore clear, structured medical information for everyday questions",
    color: "#7C6FCD",
  },
  {
    icon: "📄",
    label: "Easy-to-Read Summaries",
    sub: "Get concise overviews designed for quick understanding",
    color: "#4A90D9",
  },
];

const NAV_LINKS = [
  { label: "Home", id: "home" },
  { label: "Explore", id: "explore" },
  { label: "AI Q&A", id: "ai-qa" },
  { label: "History", id: "history" },
  { label: "About", id: "about" },
];

export default function Landing() {
  const [query, setQuery] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const [listening, setListening] = useState(false);
  const [visibleCards, setVisibleCards] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [diseaseData, setDiseaseData] = useState(null);
  const [history, setHistory] = useState([]);
  const [loadingDisease, setLoadingDisease] = useState(false);
  const [loadingAnswer, setLoadingAnswer] = useState(false);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    FLOATING_CARDS.forEach((_, i) => {
      setTimeout(() => setVisibleCards((p) => [...p, i]), 400 + i * 220);
    });
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("medicue_history");
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem("medicue_history", JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!query.trim()) {
        setSuggestions([]);
        return;
      }

      try {
        const res = await fetch(`${API_BASE}/search-suggestions/${encodeURIComponent(query)}`);
        if (!res.ok) throw new Error("Failed to fetch suggestions");
        const data = await res.json();
        setSuggestions(data.suggestions || []);
      } catch {
        setSuggestions([]);
      }
    };

    const timer = setTimeout(fetchSuggestions, 250);
    return () => clearTimeout(timer);
  }, [query]);

  const scrollToId = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      return true;
    }
    return false;
  };

  const handleNavClick = (id) => {
    const found = scrollToId(id);
    if (found) return;

    if (id === "explore" || id === "ai-qa" || id === "history") {
      scrollToId("search-box");
    }
  };

  const handleSearch = async (searchTerm = query) => {
    const trimmed = searchTerm.trim();
    if (!trimmed) return;

    setQuery(trimmed);
    setLoadingDisease(true);
    setError("");
    setAnswer("");
    setShowSuggestions(false);

    try {
      const res = await fetch(`${API_BASE}/disease/${encodeURIComponent(trimmed)}`);
      if (!res.ok) throw new Error("Failed to fetch disease info");

      const data = await res.json();
      setDiseaseData(data);

      setHistory((prev) => {
        const updated = [
          data.disease_name || trimmed,
          ...prev.filter((item) => item.toLowerCase() !== (data.disease_name || trimmed).toLowerCase()),
        ];
        return updated.slice(0, 8);
      });

      setTimeout(() => {
        const section = document.getElementById("results-section");
        if (section) section.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 150);
    } catch (err) {
      setError(err.message || "Something went wrong");
      setDiseaseData(null);
    } finally {
      setLoadingDisease(false);
    }
  };

  const handleVoice = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return alert("Voice search not supported in this browser.");

    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }

    const r = new SR();
    r.lang = "en-US";
    r.onresult = (e) => {
      const spoken = e.results[0][0].transcript;
      setQuery(spoken);
      setListening(false);
    };

    r.onend = () => setListening(false);
    r.start();
    recognitionRef.current = r;
    setListening(true);
  };

  const askQuestion = async () => {
  if (!question.trim() || !diseaseData?.disease_name) return;

  setLoadingAnswer(true);
  setAnswer("");

  try {
    const res = await fetch(`${API_BASE}/ask-ai`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        disease_name: diseaseData.disease_name,
        disease_context: diseaseData.overview,
        user_question: question,
      }),
    });

    if (!res.ok) throw new Error("Failed to get AI answer");

    const data = await res.json();
    setAnswer(data.answer || "No answer returned.");
  } catch (err) {
    setAnswer(err.message || "Something went wrong");
  } finally {
    setLoadingAnswer(false);
  }
};

  return (
    <div style={styles.root}>
      <div style={styles.bgWash} />
      <div style={styles.bgOrb1} />
      <div style={styles.bgOrb2} />

      <nav style={{ ...styles.navbar, ...(scrolled ? styles.navbarScrolled : {}) }}>
        <div style={styles.navInner}>
          <div style={styles.logo}>
            <div style={styles.logoMark}>
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <circle cx="14" cy="14" r="13" stroke="#315CD1" strokeWidth="1.5" />
                <path d="M7 14 Q10 8 14 14 Q18 20 21 14" stroke="#315CD1" strokeWidth="2" fill="none" strokeLinecap="round" />
                <circle cx="14" cy="14" r="2.5" fill="#315CD1" />
              </svg>
            </div>
            <span style={styles.logoText}>MediCue</span>
          </div>

          <div style={styles.navLinks}>
            {NAV_LINKS.map((item) => (
              <button
                key={item.label}
                type="button"
                style={styles.navLinkButton}
                onClick={() => handleNavClick(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div style={styles.navRight}>
            <div style={styles.avatar}>MC</div>
          </div>
        </div>
      </nav>

      <section id="home" style={styles.hero}>
        <div style={styles.heroLeft}>
          <div style={styles.heroBadge}>
            <span style={styles.heroBadgeDot} />
            AI-Powered Medical Education
          </div>

          <h1 style={styles.heroTitle}>
            Understand Any
            <br />
            <span style={styles.heroTitleAccent}>Disease</span> Clearly
          </h1>

          <p style={styles.heroSub}>
            Get AI-assisted educational guidance on symptoms, remedies, and
            precautions — explained in plain language you actually understand.
          </p>

          <div
            id="search-box"
            style={{ ...styles.searchGlass, ...(inputFocused ? styles.searchGlassFocused : {}) }}
          >
            <div style={styles.searchInner}>
              <svg style={styles.searchIcon} width="18" height="18" viewBox="0 0 18 18" fill="none">
                <circle cx="7.5" cy="7.5" r="5.5" stroke="#96ABD7" strokeWidth="1.5" />
                <path d="M11.5 11.5L15 15" stroke="#96ABD7" strokeWidth="1.5" strokeLinecap="round" />
              </svg>

              <input
                style={styles.searchInput}
                placeholder="Search a disease, condition or symptom…"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => {
                  setInputFocused(true);
                  setShowSuggestions(true);
                }}
                onBlur={() => {
                  setInputFocused(false);
                  setTimeout(() => setShowSuggestions(false), 180);
                }}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />


              <button onClick={() => handleSearch()} style={styles.searchBtn}>
                Search
              </button>
            </div>

            {showSuggestions && suggestions.length > 0 && (
              <div style={styles.suggestionsBox}>
                {suggestions.map((item) => (
                  <button
                    key={item}
                    style={styles.suggestionItem}
                    onClick={() => handleSearch(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>
            )}

            <div style={styles.chipsRow}>
              <span style={styles.chipsLabel}>Quick search:</span>
              {QUICK_CHIPS.map((c) => (
                <button key={c} style={styles.chip} onClick={() => handleSearch(c)}>
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div style={styles.disclaimer}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
              <circle cx="7" cy="7" r="6" stroke="#96ABD7" strokeWidth="1.2" />
              <line x1="7" y1="5" x2="7" y2="7.5" stroke="#96ABD7" strokeWidth="1.2" strokeLinecap="round" />
              <circle cx="7" cy="9.5" r="0.6" fill="#96ABD7" />
            </svg>
            Educational only. Not a replacement for professional medical advice.
          </div>
        </div>

        <div style={styles.heroRight}>
          <div style={styles.floatingStack}>
            {FLOATING_CARDS.map((card, i) => (
              <div
                key={i}
                style={{
                  ...styles.floatCard,
                  top: `${i * 112}px`,
                  left: i === 1 ? "32px" : i === 2 ? "16px" : "0px",
                  opacity: visibleCards.includes(i) ? 1 : 0,
                  transform: visibleCards.includes(i) ? "translateY(0)" : "translateY(20px)",
                  transition: "opacity 0.5s ease, transform 0.5s ease",
                  zIndex: 3 - i,
                }}
              >
                <div style={{ ...styles.floatCardIcon, background: card.color + "18", color: card.color }}>
                  {card.icon}
                </div>
                <div>
                  <div style={styles.floatCardLabel}>{card.label}</div>
                  <div style={styles.floatCardSub}>{card.sub}</div>
                </div>
              </div>
            ))}
            <div style={styles.decorRing} />
            <div style={styles.decorDot1} />
            <div style={styles.decorDot2} />
          </div>
        </div>
      </section>

      {(loadingDisease || error || diseaseData) && (
        <section id="results-section" style={styles.resultsWrap}>
          {loadingDisease && (
            <div style={styles.resultCard}>
              <h3 style={styles.resultTitle}>Searching...</h3>
              <p style={styles.resultText}>Fetching disease information for you.</p>
            </div>
          )}

          {error && (
            <div style={{ ...styles.resultCard, border: "1px solid #F1C8C8", background: "#FFF8F8" }}>
              <h3 style={{ ...styles.resultTitle, color: "#A44E4E" }}>Something went wrong</h3>
              <p style={styles.resultText}>{error}</p>
            </div>
          )}

          {diseaseData && (
            <>
              <div style={styles.resultCard}>
                <div style={styles.resultHeader}>
                  <div>
                    <div style={styles.sectionTag}>Disease result</div>
                    <h2 style={styles.resultMainHeading}>{diseaseData.disease_name}</h2>
                    <p style={styles.resultMeta}>
                      Search: {diseaseData.original_query} · Matched from: {diseaseData.matched_from}
                    </p>
                  </div>
                </div>

                <div style={styles.resultBlock}>
                  <h3 style={styles.resultTitle}>Overview</h3>
                  <p style={styles.resultText}>{diseaseData.overview}</p>
                </div>

                <div style={styles.infoGrid}>
                  <InfoBox title="Symptoms" items={diseaseData.symptoms} />
                  <InfoBox title="Remedies" items={diseaseData.remedies} />
                  <InfoBox title="Precautions" items={diseaseData.precautions} />
                  <InfoBox title="When to consult a doctor" items={diseaseData.doctor_signs} />
                </div>
 
 <div style={styles.resultBlock}>
  <h3 style={styles.resultTitle}>Summary</h3>
  <p style={styles.resultText}>{diseaseData.summary}</p>
</div>

                <div style={styles.resultBlock}>
                  <h3 style={styles.resultTitle}>Related diseases</h3>
                  <div style={styles.relatedWrap}>
                    {(diseaseData.related_diseases || []).map((item) => (
                      <span key={item} style={styles.relatedChip}>{item}</span>
                    ))}
                  </div>
                </div>

                <div style={styles.warningBox}>
                  {diseaseData.disclaimer}
                </div>
              </div>


              <div style={styles.bottomGrid}>
                <div id="ai-qa" style={styles.resultCard}>
                  <div style={styles.sectionTag}>AI Q&A</div>
                  <h3 style={styles.resultTitle}>Ask a follow-up question</h3>
                  <p style={styles.resultText}>
                    Ask anything about {diseaseData.disease_name} in plain language.
                  </p>

                  <textarea
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="Example: What foods should be avoided in this condition?"
                    style={styles.questionBox}
                  />

                  <button style={styles.askBtn} onClick={askQuestion}>
                    {loadingAnswer ? "Thinking..." : "Ask AI"}
                  </button>

                  {answer && (
                    <div style={styles.answerCard}>
                      <h4 style={styles.answerTitle}>Answer</h4>
                      <p style={styles.resultText}>{answer}</p>
                    </div>
                  )}
                </div>

                <div id="history" style={styles.resultCard}>
                  <div style={styles.sectionTag}>History</div>
                  <h3 style={styles.resultTitle}>Recent searches</h3>
                  {history.length === 0 ? (
                    <p style={styles.resultText}>No recent searches yet.</p>
                  ) : (
                    <div style={styles.historyWrap}>
                      {history.map((item) => (
                        <button
                          key={item}
                          style={styles.historyItem}
                          onClick={() => handleSearch(item)}
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </section>
      )}

      <section style={styles.howSection}>
        <div style={styles.sectionHeader}>
          <span style={styles.sectionTag}>How it works</span>
          <h2 style={styles.sectionTitle}>From search to clarity in seconds</h2>
        </div>

        <div style={styles.stepsRow}>
          {[
            {
              n: "01",
              title: "Search",
              desc: "Enter a disease name or use voice input. MediCue even corrects typos automatically.",
            },
            {
              n: "02",
              title: "Understand clearly",
              desc: "Get symptoms, remedies, precautions and doctor alerts in simple, plain language.",
            },
            {
              n: "03",
              title: "Ask follow-up questions",
              desc: "Use AI Q&A to understand the condition better in a conversational way.",
            },
          ].map((step) => (
            <div key={step.n} style={styles.stepCard}>
              <span style={styles.stepNum}>{step.n}</span>
              <h3 style={styles.stepTitle}>{step.title}</h3>
              <p style={styles.stepDesc}>{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section style={styles.ctaBanner}>
        <div style={styles.ctaGlass}>
          <h2 style={styles.ctaTitle}>Start understanding diseases today</h2>
          <p style={styles.ctaSub}>Type any condition and get a clear, AI-powered breakdown instantly.</p>
          <button style={styles.ctaBtn} onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
            Try MediCue now
          </button>
        </div>
      </section>

      <section id="about" style={styles.aboutSection}>
        <div style={styles.aboutCard}>
          <span style={styles.sectionTag}>About</span>
          <h2 style={styles.sectionTitle}>About MediCue</h2>
          <p style={styles.resultText}>
            MediCue is an AI-powered medical education assistant that helps users
            understand diseases in simple language through search, related insights,
            and follow-up Q&A.
          </p>
        </div>
      </section>

      <footer style={styles.footer}>
        <div style={styles.footerInner}>
          <div style={styles.logo}>
            <div style={styles.logoMark}>
              <svg width="22" height="22" viewBox="0 0 28 28" fill="none">
                <circle cx="14" cy="14" r="13" stroke="#315CD1" strokeWidth="1.5" />
                <path d="M7 14 Q10 8 14 14 Q18 20 21 14" stroke="#315CD1" strokeWidth="2" fill="none" strokeLinecap="round" />
                <circle cx="14" cy="14" r="2.5" fill="#315CD1" />
              </svg>
            </div>
            <span style={{ ...styles.logoText, fontSize: "15px" }}>MediCue</span>
          </div>
          <p style={styles.footerNote}>
            Educational purposes only. Always consult a qualified healthcare professional for medical advice.
          </p>
          <p style={styles.footerCopy}>© 2025 MediCue. Built with React, FastAPI.</p>
        </div>
      </footer>
    </div>
  );
}

function InfoBox({ title, items = [] }) {
  return (
    <div style={styles.infoBox}>
      <h4 style={styles.infoBoxTitle}>{title}</h4>
      {items.length ? (
        <ul style={styles.infoList}>
          {items.map((item, index) => (
            <li key={`${title}-${index}`} style={styles.infoListItem}>{item}</li>
          ))}
        </ul>
      ) : (
        <p style={styles.resultText}>No details available.</p>
      )}
    </div>
  );
}

function MicIcon({ active, size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none">
      <rect
        x="6"
        y="2"
        width="6"
        height="9"
        rx="3"
        stroke={active ? "#315CD1" : "#96ABD7"}
        strokeWidth="1.4"
        fill={active ? "#315CD120" : "none"}
      />
      <path
        d="M3.5 9.5A5.5 5.5 0 0 0 14.5 9.5"
        stroke={active ? "#315CD1" : "#96ABD7"}
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <line x1="9" y1="15" x2="9" y2="12.5" stroke={active ? "#315CD1" : "#96ABD7"} strokeWidth="1.4" strokeLinecap="round" />
      <line x1="6.5" y1="15.5" x2="11.5" y2="15.5" stroke={active ? "#315CD1" : "#96ABD7"} strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

const styles = {
  root: {
    fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
    background: "#F8FAFC",
    minHeight: "100vh",
    position: "relative",
    overflowX: "hidden",
    color: "#182E6C",
  },
  bgWash: {
    position: "fixed",
    inset: 0,
    zIndex: 0,
    background: "linear-gradient(145deg, #F8FAFC 0%, #EEF2F7 40%, #CDCBE2 100%)",
    opacity: 0.5,
    pointerEvents: "none",
  },
  bgOrb1: {
    position: "fixed",
    top: "-120px",
    right: "-80px",
    width: "480px",
    height: "480px",
    borderRadius: "50%",
    background: "radial-gradient(circle, #315CD115 0%, transparent 70%)",
    zIndex: 0,
    pointerEvents: "none",
  },
  bgOrb2: {
    position: "fixed",
    bottom: "-100px",
    left: "-60px",
    width: "360px",
    height: "360px",
    borderRadius: "50%",
    background: "radial-gradient(circle, #CDCBE240 0%, transparent 70%)",
    zIndex: 0,
    pointerEvents: "none",
  },
  navbar: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    background: "rgba(248,250,252,0.7)",
    backdropFilter: "blur(14px)",
    WebkitBackdropFilter: "blur(14px)",
    borderBottom: "1px solid transparent",
    transition: "border-color 0.3s, box-shadow 0.3s",
  },
  navbarScrolled: {
    borderBottom: "1px solid #D9E1EC",
    boxShadow: "0 2px 20px rgba(24,46,108,0.06)",
  },
  navInner: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "0 32px",
    height: "60px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  logo: { display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" },
  logoMark: { display: "flex", alignItems: "center" },
  logoText: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#182E6C",
    letterSpacing: "-0.3px",
  },
  navLinks: { display: "flex", gap: "4px", alignItems: "center" },
  navLinkButton: {
    fontSize: "14px",
    color: "#5E6B85",
    background: "transparent",
    border: "none",
    textDecoration: "none",
    padding: "6px 14px",
    borderRadius: "8px",
    fontWeight: "500",
    cursor: "pointer",
    fontFamily: "inherit",
  },
  navRight: { display: "flex", alignItems: "center", gap: "10px" },
  navVoiceBtn: {
    width: "34px",
    height: "34px",
    borderRadius: "50%",
    border: "1px solid #D9E1EC",
    background: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },
  avatar: {
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #315CD1, #7C6FCD)",
    color: "white",
    fontSize: "13px",
    fontWeight: "600",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  
  hero: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "120px 32px 88px",
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: "46px",
    position: "relative",
    zIndex: 1,
  },
  heroLeft: {
    flex: "1 1 560px",
    minWidth: 0,
    maxWidth: "560px",
    paddingTop: "18px",
  },
  heroRight: {
    width: "340px",
    flexShrink: 0,
    position: "relative",
    height: "360px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  heroBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "12px",
    fontWeight: "600",
    color: "#315CD1",
    background: "#315CD108",
    border: "1px solid #315CD130",
    borderRadius: "100px",
    padding: "6px 14px",
    marginBottom: "22px",
    letterSpacing: "0.5px",
    textTransform: "uppercase",
  },
  heroBadgeDot: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    background: "#315CD1",
    display: "inline-block",
  },
  heroTitle: {
    fontSize: "clamp(38px, 5vw, 58px)",
    fontWeight: "800",
    lineHeight: "1.06",
    color: "#182E6C",
    marginBottom: "18px",
    letterSpacing: "-1.6px",
  },
  heroTitleAccent: {
    color: "#315CD1",
    background: "linear-gradient(135deg, #315CD1, #7C6FCD)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  heroSub: {
    fontSize: "17px",
    color: "#5E6B85",
    lineHeight: "1.75",
    marginBottom: "32px",
    maxWidth: "500px",
  },
  searchGlass: {
    background: "rgba(255,255,255,0.75)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    border: "1.5px solid #D9E1EC",
    borderRadius: "24px",
    padding: "18px 18px 20px",
    boxShadow: "0 4px 24px rgba(24,46,108,0.07)",
    transition: "border-color 0.2s, box-shadow 0.2s",
    marginBottom: "20px",
    position: "relative",
  },
  searchGlassFocused: {
    borderColor: "#315CD1",
    boxShadow: "0 4px 24px rgba(49,92,209,0.13)",
  },
  searchInner: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    background: "#EEF2F7",
    borderRadius: "12px",
    padding: "8px 12px",
  },
  searchIcon: { flexShrink: 0 },
  searchInput: {
    flex: 1,
    border: "none",
    background: "transparent",
    fontSize: "15px",
    color: "#182E6C",
    outline: "none",
    fontFamily: "inherit",
  },
  
 
  searchBtn: {
    background: "#315CD1",
    color: "white",
    border: "none",
    borderRadius: "10px",
    padding: "9px 22px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    whiteSpace: "nowrap",
    flexShrink: 0,
  },
  suggestionsBox: {
    marginTop: "10px",
    background: "rgba(255,255,255,0.95)",
    border: "1px solid #D9E1EC",
    borderRadius: "14px",
    overflow: "hidden",
    boxShadow: "0 8px 24px rgba(24,46,108,0.07)",
  },
  suggestionItem: {
    width: "100%",
    textAlign: "left",
    border: "none",
    background: "transparent",
    padding: "12px 14px",
    cursor: "pointer",
    color: "#182E6C",
    borderBottom: "1px solid #EEF2F7",
    fontFamily: "inherit",
  },
  chipsRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    alignItems: "center",
    padding: "10px 4px 0",
  },
  chipsLabel: { fontSize: "12px", color: "#96ABD7", fontWeight: "500" },
  chip: {
    fontSize: "13px",
    color: "#315CD1",
    fontWeight: "500",
    background: "transparent",
    border: "1px solid #96ABD7",
    borderRadius: "100px",
    padding: "4px 14px",
    cursor: "pointer",
    fontFamily: "inherit",
  },
  disclaimer: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "12px",
    color: "#96ABD7",
    fontStyle: "italic",
  },
  floatingStack: {
    position: "relative",
    width: "320px",
    height: "300px",
  },
  floatCard: {
    position: "absolute",
    width: "280px",
    background: "rgba(255,255,255,0.82)",
    backdropFilter: "blur(16px)",
    WebkitBackdropFilter: "blur(16px)",
    border: "1px solid #D9E1EC",
    borderRadius: "16px",
    padding: "16px",
    display: "flex",
    alignItems: "center",
    gap: "14px",
    boxShadow: "0 4px 20px rgba(24,46,108,0.08)",
  },
  floatCardIcon: {
    width: "40px",
    height: "40px",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "18px",
    flexShrink: 0,
  },
  floatCardLabel: { fontSize: "13px", fontWeight: "600", color: "#182E6C" },
  floatCardSub: { fontSize: "11px", color: "#5E6B85", marginTop: "3px" },
  decorRing: {
    position: "absolute",
    right: "-20px",
    bottom: "20px",
    width: "80px",
    height: "80px",
    borderRadius: "50%",
    border: "2px dashed #CDCBE2",
    opacity: 0.6,
  },
  decorDot1: {
    position: "absolute",
    top: "10px",
    right: "10px",
    width: "10px",
    height: "10px",
    borderRadius: "50%",
    background: "#315CD130",
  },
  decorDot2: {
    position: "absolute",
    bottom: "60px",
    left: "-10px",
    width: "16px",
    height: "16px",
    borderRadius: "50%",
    background: "#CDCBE2",
  },
  resultsWrap: {
    maxWidth: "1200px",
    margin: "0 auto 70px",
    padding: "0 32px",
    position: "relative",
    zIndex: 1,
  },
  resultCard: {
    background: "rgba(255,255,255,0.82)",
    backdropFilter: "blur(18px)",
    WebkitBackdropFilter: "blur(18px)",
    border: "1px solid #D9E1EC",
    borderRadius: "24px",
    padding: "28px",
    boxShadow: "0 8px 30px rgba(24,46,108,0.06)",
    marginBottom: "24px",
  },
  resultHeader: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: "18px",
    marginBottom: "20px",
  },
  resultMainHeading: {
    margin: "8px 0 8px",
    fontSize: "34px",
    lineHeight: "1.1",
    color: "#182E6C",
  },
  resultMeta: {
    margin: 0,
    color: "#96ABD7",
    fontSize: "13px",
  },
  resultBlock: {
    marginBottom: "24px",
  },
  resultTitle: {
    margin: "0 0 12px",
    fontSize: "20px",
    color: "#182E6C",
  },
  resultText: {
    margin: 0,
    fontSize: "15px",
    color: "#5E6B85",
    lineHeight: "1.8",
  },
  infoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "18px",
    marginBottom: "24px",
  },
  infoBox: {
    background: "#F8FAFC",
    border: "1px solid #E3E9F2",
    borderRadius: "18px",
    padding: "18px",
  },
  infoBoxTitle: {
    margin: "0 0 10px",
    fontSize: "16px",
    color: "#182E6C",
  },
  infoList: {
    margin: 0,
    paddingLeft: "18px",
    color: "#5E6B85",
  },
  infoListItem: {
    marginBottom: "8px",
    lineHeight: "1.7",
  },
  relatedWrap: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
  },
  relatedChip: {
    border: "1px solid #D3DCF2",
    background: "#EEF2FF",
    color: "#315CD1",
    borderRadius: "999px",
    padding: "8px 14px",
    fontSize: "13px",
    fontWeight: "600",
  },
  warningBox: {
    background: "#FFF9ED",
    border: "1px solid #F0DFC1",
    color: "#8C6A2E",
    borderRadius: "16px",
    padding: "14px 16px",
    fontSize: "14px",
    lineHeight: "1.7",
  },
  bottomGrid: {
    display: "grid",
    gridTemplateColumns: "1.35fr 0.85fr",
    gap: "24px",
  },
  questionBox: {
    width: "100%",
    minHeight: "120px",
    resize: "vertical",
    marginTop: "10px",
    border: "1px solid #D9E1EC",
    borderRadius: "16px",
    padding: "14px",
    fontFamily: "inherit",
    fontSize: "15px",
    outline: "none",
    background: "#F8FAFC",
    color: "#182E6C",
  },
  askBtn: {
    marginTop: "14px",
    background: "#315CD1",
    color: "white",
    border: "none",
    borderRadius: "12px",
    padding: "12px 22px",
    fontSize: "14px",
    fontWeight: "700",
    cursor: "pointer",
  },
  answerCard: {
    marginTop: "18px",
    background: "#F8FAFC",
    border: "1px solid #E3E9F2",
    borderRadius: "18px",
    padding: "18px",
  },
  answerTitle: {
    margin: "0 0 10px",
    color: "#182E6C",
    fontSize: "16px",
  },
  historyWrap: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    marginTop: "12px",
  },
  historyItem: {
    textAlign: "left",
    border: "1px solid #D9E1EC",
    background: "#F8FAFC",
    color: "#182E6C",
    borderRadius: "14px",
    padding: "12px 14px",
    cursor: "pointer",
    fontFamily: "inherit",
    fontWeight: "500",
  },
  howSection: {
    maxWidth: "1200px",
    margin: "0 auto 80px",
    padding: "0 32px",
    position: "relative",
    zIndex: 1,
  },
  sectionHeader: { textAlign: "center", marginBottom: "48px" },
  sectionTag: {
    display: "inline-block",
    fontSize: "11px",
    fontWeight: "700",
    color: "#315CD1",
    letterSpacing: "1.5px",
    textTransform: "uppercase",
    marginBottom: "12px",
  },
  sectionTitle: {
    fontSize: "clamp(24px, 3vw, 34px)",
    fontWeight: "800",
    color: "#182E6C",
    letterSpacing: "-0.8px",
    lineHeight: "1.2",
  },
  stepsRow: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "24px" },
  stepCard: {
    background: "white",
    border: "1px solid #D9E1EC",
    borderRadius: "20px",
    padding: "32px 28px",
    boxShadow: "0 2px 12px rgba(24,46,108,0.06)",
  },
  stepNum: {
    display: "inline-block",
    fontSize: "11px",
    fontWeight: "800",
    color: "#315CD1",
    letterSpacing: "1px",
    background: "#315CD108",
    borderRadius: "6px",
    padding: "3px 10px",
    marginBottom: "20px",
  },
  stepTitle: { fontSize: "18px", fontWeight: "700", color: "#182E6C", marginBottom: "12px" },
  stepDesc: { fontSize: "14px", color: "#5E6B85", lineHeight: "1.7" },
  ctaBanner: {
    maxWidth: "1200px",
    margin: "0 auto 80px",
    padding: "0 32px",
    position: "relative",
    zIndex: 1,
  },
  aboutSection: {
    maxWidth: "1200px",
    margin: "0 auto 80px",
    padding: "0 32px",
    position: "relative",
    zIndex: 1,
  },
  aboutCard: {
    background: "rgba(255,255,255,0.82)",
    backdropFilter: "blur(18px)",
    WebkitBackdropFilter: "blur(18px)",
    border: "1px solid #D9E1EC",
    borderRadius: "24px",
    padding: "32px",
    boxShadow: "0 8px 30px rgba(24,46,108,0.06)",
  },
  navLinkButton: {
    fontSize: "14px",
    color: "#5E6B85",
    background: "transparent",
    border: "none",
    textDecoration: "none",
    padding: "6px 14px",
    borderRadius: "8px",
    fontWeight: "500",
    cursor: "pointer",
    fontFamily: "inherit",
  },
  ctaGlass: {
    background: "linear-gradient(135deg, rgba(49,92,209,0.08), rgba(124,111,205,0.10))",
    backdropFilter: "blur(16px)",
    WebkitBackdropFilter: "blur(16px)",
    border: "1px solid rgba(49,92,209,0.18)",
    borderRadius: "24px",
    padding: "60px 40px",
    textAlign: "center",
  },
  ctaTitle: {
    fontSize: "clamp(24px, 3vw, 36px)",
    fontWeight: "800",
    color: "#182E6C",
    marginBottom: "14px",
    letterSpacing: "-0.8px",
  },
  ctaSub: { fontSize: "16px", color: "#5E6B85", marginBottom: "32px" },
  ctaBtn: {
    background: "#315CD1",
    color: "white",
    border: "none",
    borderRadius: "12px",
    padding: "14px 36px",
    fontSize: "15px",
    fontWeight: "700",
    cursor: "pointer",
  },
  footer: {
    borderTop: "1px solid #D9E1EC",
    background: "white",
    position: "relative",
    zIndex: 1,
  },
  footerInner: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "40px 32px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "12px",
  },
  footerNote: {
    fontSize: "13px",
    color: "#96ABD7",
    textAlign: "center",
    maxWidth: "480px",
  },
  footerCopy: { fontSize: "12px", color: "#D9E1EC" },
};
