from pathlib import Path
import joblib

BASE_DIR = Path(__file__).resolve().parent.parent
MODELS_DIR = BASE_DIR / "models"

df = joblib.load(MODELS_DIR / "recommender_df.joblib")
similarity_matrix = joblib.load(MODELS_DIR / "similarity_matrix.joblib")

def get_related_diseases(disease_name: str, top_k: int = 3):
    disease_name = disease_name.strip().lower()

    matches = df.index[df["disease_name"].str.lower() == disease_name].tolist()

    if not matches:
        return []

    idx = matches[0]
    similarity_scores = list(enumerate(similarity_matrix[idx]))
    similarity_scores = sorted(similarity_scores, key=lambda x: x[1], reverse=True)

    related = []
    for i, score in similarity_scores[1:top_k + 1]:
        related.append({
            "disease_name": df.iloc[i]["disease_name"],
            "score": round(float(score), 3)
        })

    return related