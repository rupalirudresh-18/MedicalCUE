import { useEffect, useRef, useState } from "react";

export default function SearchBar({ query, setQuery, onSearch, apiBase }) {
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!query.trim()) {
        setSuggestions([]);
        return;
      }

      try {
        setLoadingSuggestions(true);
        const res = await fetch(
          `${apiBase}/search-suggestions/${encodeURIComponent(query)}`
        );
        if (!res.ok) throw new Error("Suggestion fetch failed");
        const data = await res.json();
        setSuggestions(data.suggestions || []);
      } catch {
        setSuggestions([]);
      } finally {
        setLoadingSuggestions(false);
      }
    };

    const timer = setTimeout(fetchSuggestions, 250);
    return () => clearTimeout(timer);
  }, [query, apiBase]);

  const handleVoice = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      alert("Voice search is not supported in this browser.");
      return;
    }

    const rec = new SR();
    rec.lang = "en-US";
    rec.onresult = (e) => {
      const spoken = e.results[0][0].transcript;
      setQuery(spoken);
    };
    rec.start();
    recognitionRef.current = rec;
  };

  return (
    <div className="search-wrap">
      <div className="search-row">
        <input
          type="text"
          className="search-input"
          placeholder="Search disease, condition, or symptom"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSearch(query)}
        />
        <button className="voice-btn" onClick={handleVoice} type="button">
          🎙️
        </button>
        <button className="primary-btn" onClick={() => onSearch(query)} type="button">
          Search
        </button>
      </div>

      {(loadingSuggestions || suggestions.length > 0) && (
        <div className="suggestions-box">
          {loadingSuggestions && <div className="suggestion-item">Loading suggestions...</div>}
          {!loadingSuggestions &&
            suggestions.map((item) => (
              <button
                key={item}
                className="suggestion-item suggestion-btn"
                onClick={() => onSearch(item)}
                type="button"
              >
                {item}
              </button>
            ))}
        </div>
      )}
    </div>
  );
}