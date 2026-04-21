import pandas as pd
import joblib
from pathlib import Path
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "app" / "data"
MODELS_DIR = BASE_DIR / "app" / "models"

MODELS_DIR.mkdir(parents=True, exist_ok=True)

print("Loading data...")
diseases_df = pd.read_csv(DATA_DIR / "diseases.csv")
queries_df = pd.read_csv(DATA_DIR / "disease_queries.csv")

print("Diseases loaded:", len(diseases_df))
print("Queries loaded:", len(queries_df))

X = queries_df["query"].fillna("").astype(str)
y = queries_df["disease_name"].fillna("").astype(str)

print("Fitting TF-IDF + LogisticRegression...")

vectorizer = TfidfVectorizer(
    analyzer="char_wb",
    ngram_range=(2, 5),
    lowercase=True
)

model = LogisticRegression(max_iter=2000)

pipeline = Pipeline([
    ("vectorizer", vectorizer),
    ("classifier", model)
])

pipeline.fit(X, y)

joblib.dump(pipeline, MODELS_DIR / "normalizer.joblib")
print("Model saved to:", MODELS_DIR / "normalizer.joblib")

joblib.dump(diseases_df.set_index("disease_name"), MODELS_DIR / "disease_index.joblib")
print("Disease index saved.")