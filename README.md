# MedTriage - AI-powered Symptom Checker (MVP)

This is a minimal demo of a symptom triage API built with FastAPI. It implements simple rule-based logic for the MVP and is ready to be extended with an ML model.

## Setup (Mac)

1. Create and activate a virtual environment (macOS / zsh):

   python3 -m venv venv
   source venv/bin/activate

2. Install dependencies:

   pip install -r requirements.txt

3. Run the server:

    uvicorn main:app --reload

One-liners:

- Run server (dev):

   MEDTRIAGE_PRELOAD_ML=0 uvicorn main:app --reload

- Run server and preload ML model at startup (will download model on startup):

   MEDTRIAGE_PRELOAD_ML=1 uvicorn main:app

4. Open the interactive docs:

   http://127.0.0.1:8000/docs

## Endpoint

POST /triage

Request JSON:

    {"symptom": "Severe chest pain, shortness of breath"}

Example response (rule-based):

    {
      "risk": "High",
      "suggestion": "Visit ER immediately",
      "conditions": ["Heart attack"]
    }

Optional ML endpoint

POST /triage_ml

This endpoint attempts to use a transformers zero-shot-classification model to
classify symptom urgency. The first time it runs it may download a model from
the internet. If the ML model cannot be loaded the endpoint will gracefully
fall back to the rule-based behavior.

## Docker
------

Build runtime image (small):

   docker build -t medtriage:latest .

Run:

   docker run -p 8000:8000 medtriage:latest

Development image (includes test deps):

   docker build -f Dockerfile.dev -t medtriage:dev .

## CI
--

A simple GitHub Actions workflow is included at `.github/workflows/ci.yml`. It installs a slim set of test dependencies from `requirements-ci.txt` (no heavy ML libs) and runs `pytest`.


## Notes

- `transformers` and `torch` are included as placeholders for future ML integration. The current logic is rule-based for the MVP.
- The `venv/` directory is not included in the repository; add it to `.gitignore`.
