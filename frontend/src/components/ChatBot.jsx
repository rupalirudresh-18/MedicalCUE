import { useState } from "react";
import { askDiseaseQuestion } from "../services/api";

function ChatBot({ diseaseName }) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAsk = async () => {
    if (!question.trim()) return;

    try {
      setLoading(true);
      setError("");
      setAnswer("");

      const data = await askDiseaseQuestion(diseaseName, question);
      setAnswer(data.answer);
    } catch (err) {
      setError("Could not get answer from AI");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chatbot-box">
      <h3>Ask AI</h3>

      <textarea
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder="Ask something like: What food should be taken?"
        rows="4"
      />

      <button onClick={handleAsk} disabled={loading}>
        {loading ? "Asking..." : "Ask"}
      </button>

      {error && <p className="error-text">{error}</p>}
      {answer && (
        <div className="answer-box">
          <h4>Answer</h4>
          <p>{answer}</p>
        </div>
      )}
    </div>
  );
}

export default ChatBot;