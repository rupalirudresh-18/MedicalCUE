export default function DiseaseCard({ data }) {
  const {
    disease_name,
    overview,
    symptoms = [],
    remedies = [],
    precautions = [],
    doctor_signs = [],
    related_diseases = [],
    disclaimer,
    matched_from,
    original_query,
  } = data;

  return (
    <section className="card">
      <div className="card-header">
        <div>
          <h2>{disease_name}</h2>
          <p className="muted">
            Search: {original_query} | Matched: {matched_from}
          </p>
        </div>
      </div>

      <div className="info-block">
        <h3>Overview</h3>
        <p>{overview}</p>
      </div>

      <div className="grid-two">
        <InfoList title="Symptoms" items={symptoms} />
        <InfoList title="Remedies" items={remedies} />
        <InfoList title="Precautions" items={precautions} />
        <InfoList title="Doctor signs" items={doctor_signs} />
      </div>

      <div className="info-block">
        <h3>Related diseases</h3>
        <div className="chip-wrap">
          {related_diseases.map((item) => (
            <span className="chip" key={item}>
              {item}
            </span>
          ))}
        </div>
      </div>

      <div className="disclaimer">
        <strong>Note:</strong> {disclaimer}
      </div>
    </section>
  );
}

function InfoList({ title, items }) {
  return (
    <div className="mini-card">
      <h3>{title}</h3>
      {items.length > 0 ? (
        <ul>
          {items.map((item, index) => (
            <li key={`${title}-${index}`}>{item}</li>
          ))}
        </ul>
      ) : (
        <p className="muted">No details available.</p>
      )}
    </div>
  );
}