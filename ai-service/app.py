from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

from predictor import load_artifacts, predict_priority

app = FastAPI(
    title="CampusConnect Complaint Priority Service",
    description="Explainable, AI-assisted campus complaint categorization and prioritization.",
    version="1.0.0",
)
model_bundle = None
vectorizer = None


class ComplaintRequest(BaseModel):
    complaint: str = Field(min_length=5, max_length=10000)


@app.on_event("startup")
def initialize_model():
    global model_bundle, vectorizer
    model_bundle, vectorizer = load_artifacts()


@app.get("/health")
def health():
    return {"status": "ok" if model_bundle is not None else "model_not_loaded"}


@app.post("/predict-priority")
def predict(request: ComplaintRequest):
    if model_bundle is None or vectorizer is None:
        raise HTTPException(status_code=503, detail="The complaint model is not loaded.")
    try:
        return predict_priority(request.complaint, model_bundle, vectorizer)
    except ValueError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error

