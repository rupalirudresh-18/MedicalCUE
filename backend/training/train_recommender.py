import pandas as pd
import joblib
from pathlib import Path
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "app" / "data"
MODELS_DIR = BASE_DIR / "app" / "models"

MODELS_DIR.mkdir(parents=True, exist_ok=True)

df = pd.read_csv(DATA_DIR / "diseases.csv")

df["combined_text"] = (
    df["overview"].fillna("") + " " +
    df["symptoms"].fillna("").str.replace("|", " ", regex=False) + " " +
    df["home_remedies"].fillna("").str.replace("|", " ", regex=False) + " " +
    df["precautions"].fillna("").str.replace("|", " ", regex=False) + " " +
    df["when_to_see_doctor"].fillna("").str.replace("|", " ", regex=False)
)

vectorizer = TfidfVectorizer(stop_words="english")
tfidf_matrix = vectorizer.fit_transform(df["combined_text"])

similarity_matrix = cosine_similarity(tfidf_matrix)

joblib.dump(df, MODELS_DIR / "recommender_df.joblib")
joblib.dump(similarity_matrix, MODELS_DIR / "similarity_matrix.joblib")

print("Recommender model saved successfully.")