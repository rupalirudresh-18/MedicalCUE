from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List
from app.services.recommend import get_related_diseases
from app.services.normalize import predict_disease
from app.services.ask_ai import generate_answer, client
from fastapi import UploadFile, File, Form
import base64, re, json
import fitz          # PyMuPDF
from PIL import Image
import io
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

@app.post("/analyze-report")
async def analyze_report(
    file: UploadFile = File(None),
    plain_text: str  = Form(None)
):
    extracted_text = ""

    # ── A) Plain text pasted directly ────────────────────────
    if plain_text and plain_text.strip():
        extracted_text = plain_text.strip()

    # ── B) File upload ────────────────────────────────────────
    elif file:
        contents = await file.read()
        fname    = (file.filename or "").lower()

        # PDF → extract all page text
        if fname.endswith(".pdf"):
            doc = fitz.open(stream=contents, filetype="pdf")
            for page in doc:
                extracted_text += page.get_text()
            doc.close()

        # Image → base64 encode, send to Groq vision-capable model
        elif fname.endswith((".jpg", ".jpeg", ".png", ".webp")):
            b64 = base64.b64encode(contents).decode()
            ext = fname.split(".")[-1].replace("jpg", "jpeg")

            # Use Groq llama-3.2-11b-vision-preview for image reading
            vision_resp = client.chat.completions.create(
                model="llama-3.2-11b-vision-preview",
                messages=[{
                    "role": "user",
                    "content": [
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/{ext};base64,{b64}"
                            }
                        },
                        {
                            "type": "text",
                            "text": "Extract ALL text from this medical report image. Return only the raw text, no commentary."
                        }
                    ]
                }],
                max_tokens=2000
            )
            extracted_text = vision_resp.choices[0].message.content

        else:
            # Try plain text decode for .txt files
            extracted_text = contents.decode("utf-8", errors="ignore")
    else:
        return {"error": "No file or text provided"}

    if not extracted_text.strip():
        return {"error": "Could not extract text from the provided file."}

    # ── GROQ LLM: Analyze the extracted text ─────────────────
    analysis_prompt = f"""You are a medical report analysis assistant. Analyze the following medical report text and return ONLY valid JSON with no markdown, no extra text.

Medical Report Text:
{extracted_text[:4000]}

Return this exact JSON structure:
{{
  "patient_summary": "1-2 sentence overview of what this report is about",
  "report_type": "e.g. Blood Test, X-Ray Report, CBC Report, Urine Analysis, etc.",
  "test_values": [
    {{
      "test_name": "Test name",
      "value": "actual value with unit",
      "normal_range": "normal range with unit",
      "numeric_value": 0.0,
      "normal_min": 0.0,
      "normal_max": 0.0,
      "unit": "unit string",
      "status": "Normal or High or Low or Critical"
    }}
  ],
  "abnormal_findings": [
    {{
      "finding": "finding description",
      "severity": "Mild or Moderate or Severe",
      "explanation": "plain language explanation of what this means"
    }}
  ],
  "detected_conditions": ["condition1", "condition2"],
  "key_medical_terms": [
    {{"term": "medical term", "meaning": "simple explanation"}}
  ],
  "simplified_summary": "3-4 sentence plain language summary a non-doctor can understand",
  "recommendations": ["recommendation 1", "recommendation 2", "recommendation 3"],
  "urgency_level": "Routine or Follow-up Soon or Urgent or Emergency",
  "stats": {{
    "total_tests": 0,
    "normal_count": 0,
    "abnormal_count": 0,
    "critical_count": 0
  }}
}}

For test_values: only include tests that have actual numeric values. Set numeric_value, normal_min, normal_max as numbers (not strings) for chart rendering. If a range is unavailable, use 0 for min/max.
Return ONLY the JSON object."""

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": analysis_prompt}],
        temperature=0.1,
        max_tokens=3000
    )

    raw = response.choices[0].message.content.strip()
    raw = raw.replace("```json", "").replace("```", "").strip()

    try:
        result = json.loads(raw)
    except Exception as e:
        # Try to extract JSON from response
        match = re.search(r'\{.*\}', raw, re.DOTALL)
        if match:
            try:
                result = json.loads(match.group())
            except:
                result = {"error": "Could not parse analysis", "raw": raw[:500]}
        else:
            result = {"error": "Analysis failed", "details": str(e)}

    result["extracted_text_preview"] = extracted_text[:300] + "..." if len(extracted_text) > 300 else extracted_text
    return result


# ─────────────────────────────────────────────────────────────
#  ENDPOINT 2 — Ask a follow-up question about the report
# ─────────────────────────────────────────────────────────────
@app.post("/ask-report")
async def ask_about_report(body: dict):
    report_summary = body.get("report_summary", "")
    question       = body.get("question", "")

    if not question:
        return {"error": "No question provided"}

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{
            "role": "user",
            "content": f"""You are a helpful medical education assistant.
The user has uploaded a medical report. Here is a summary of it:
{report_summary}

The user asks: {question}

Answer in 2-4 simple sentences. Use plain language. Always remind them to consult their doctor for personal medical advice."""
        }],
        temperature=0.3,
        max_tokens=400
    )
    return {"answer": response.choices[0].message.content}
