export default function History({ history, onSelect }) {
  return (
    <section className="card sticky-card">
      <h2>Recent searches</h2>
      {history.length === 0 ? (
        <p className="muted">No searches yet.</p>
      ) : (
        <div className="history-list">
          {history.map((item) => (
            <button
              key={item}
              className="history-item"
              onClick={() => onSelect(item)}
              type="button"
            >
              {item}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}