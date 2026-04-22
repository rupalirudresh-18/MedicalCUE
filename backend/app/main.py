from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List
from app.services.recommend import get_related_diseases
from app.services.normalize import predict_disease
from app.services.ask_ai import generate_answer
from app.services.summarize import summarize_text
from fastapi.middleware.cors import CORSMiddleware
app = FastAPI(title="MediCue API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173" ,
                   "https://medicalcue-3.onrender.com",
                   "https://medical-cue.onrender.com",],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class SearchRequest(BaseModel):
    query: str


class SearchResponse(BaseModel):
    disease_name: str
    overview: str
    symptoms: List[str]
    home_remedies: List[str]
    precautions: List[str]
    when_to_see_doctor: List[str]
    summary: str


class AskRequest(BaseModel):
    disease: str
    question: str

class QuestionRequest(BaseModel):
    disease_name: str
    disease_context: str
    user_question: str


class SuggestionResponse(BaseModel):
    suggestions: List[str]


@app.get("/")
def root():
    return {"message": "MediCue API is running"}


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/search", response_model=SearchResponse)
def search(request: SearchRequest):
    result = predict_disease(request.query)

    if not result["disease_name"]:
        raise HTTPException(status_code=404, detail="Disease not found")

    overview = result.get("overview", "")
    summary = summarize_text(overview)
    result["summary"] = summary

    return result


@app.get("/related/{disease_name}")
def related_diseases(disease_name: str):
    return {
        "disease_name": disease_name,
        "related_diseases": get_related_diseases(disease_name)
    }


@app.get("/disease/{query}")
def get_disease(query: str):
    result = predict_disease(query)

    if not result["disease_name"]:
        raise HTTPException(status_code=404, detail="Disease not found")

    overview = result.get("overview", "")
    summary = summarize_text(overview)
    related = get_related_diseases(result["disease_name"])

    related_names = []
    for item in related:
        if isinstance(item, dict):
            related_names.append(item.get("disease_name", ""))
        else:
            related_names.append(str(item))

    return {
        "disease_name": result.get("disease_name", ""),
        "original_query": query,
        "matched_from": "normalized search",
        "overview": overview,
        "summary": summary,
        "symptoms": result.get("symptoms", []),
        "remedies": result.get("home_remedies", []),
        "precautions": result.get("precautions", []),
        "doctor_signs": result.get("when_to_see_doctor", []),
        "related_diseases": [name for name in related_names if name],
        "disclaimer": "This information is for educational purposes only and is not a substitute for professional medical advice."
    }


@app.get("/search-suggestions/{query}", response_model=SuggestionResponse)
def search_suggestions(query: str):
    if not query.strip():
        return {"suggestions": []}

    suggestion = predict_disease(query).get("disease_name")

    if not suggestion:
        return {"suggestions": []}

    return {"suggestions": [suggestion]}


@app.post("/ask-ai")
def ask_ai(data: QuestionRequest):
    answer = generate_answer(
        disease_name=data.disease_name,
        disease_context=data.disease_context,
        user_question=data.user_question
    )
    return {"answer": answer}