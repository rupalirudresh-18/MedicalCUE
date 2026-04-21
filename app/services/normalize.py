from pathlib import Path
import joblib
import pandas as pd

BASE_DIR = Path(__file__).resolve().parent.parent
MODELS_DIR = BASE_DIR / "models"

pipeline = joblib.load(MODELS_DIR / "normalizer.joblib")
disease_index = joblib.load(MODELS_DIR / "disease_index.joblib")

def split_field(value):
    if pd.isna(value) or str(value).strip() == "":
        return []
    return [item.strip() for item in str(value).split("|") if item.strip()]

def predict_disease(query: str) -> dict:
    predicted_disease = pipeline.predict([query])[0]

    if predicted_disease not in disease_index.index:
        return {
            "disease_name": None,
            "overview": "",
            "symptoms": [],
            "home_remedies": [],
            "precautions": [],
            "when_to_see_doctor": []
        }

    row = disease_index.loc[predicted_disease]

    return {
        "disease_name": predicted_disease,
        "overview": str(row["overview"]),
        "symptoms": split_field(row["symptoms"]),
        "home_remedies": split_field(row["home_remedies"]),
        "precautions": split_field(row["precautions"]),
        "when_to_see_doctor": split_field(row["when_to_see_doctor"])
    }