from typing import List, Tuple


def _matches_any(text_l: str, keywords: List[str]) -> bool:
    return any(k in text_l for k in keywords)


def classify_symptom(text: str) -> Tuple[str, str, List[str], float, List[str]]:
    """Classify symptom text into specific diseases with confidence scores.

    Uses pattern matching to identify likely diseases based on symptom combinations.
    Returns (predicted_disease, treatment_recommendation, symptoms_matched, confidence_score, matched_triggers).
    """
    if not text or not text.strip():
        return "Common Cold", "Rest and hydration", ["Undetermined symptoms"], 0.3, []

    text_l = text.lower()

    # Disease patterns with associated symptoms and confidence weights
    DISEASE_PATTERNS = {
        "Heart Attack": {
            "symptoms": ["chest pain", "shortness of breath", "difficulty breathing", "severe chest",
                        "left arm pain", "jaw pain", "sweating", "nausea", "dizziness"],
            "confidence": 0.9,
            "treatment": "Call emergency services immediately"
        },
        "Stroke": {
            "symptoms": ["sudden weakness", "face droop", "slurred speech", "weakness on one side",
                        "confusion", "trouble seeing", "dizziness", "severe headache", "loss of balance"],
            "confidence": 0.85,
            "treatment": "Call emergency services immediately"
        },
        "Pneumonia": {
            "symptoms": ["shortness of breath", "chest pain", "persistent cough", "fever", "chills",
                        "fatigue", "difficulty breathing", "coughing up mucus"],
            "confidence": 0.8,
            "treatment": "See a doctor immediately"
        },
        "Appendicitis": {
            "symptoms": ["severe abdominal pain", "nausea", "vomiting", "fever", "loss of appetite",
                        "right lower abdominal pain", "rebound tenderness"],
            "confidence": 0.8,
            "treatment": "Go to emergency room"
        },
        "COVID-19": {
            "symptoms": ["fever", "cough", "loss of taste", "loss of smell", "shortness of breath",
                        "fatigue", "body aches", "sore throat", "runny nose"],
            "confidence": 0.75,
            "treatment": "Isolate and contact healthcare provider"
        },
        "Influenza (Flu)": {
            "symptoms": ["fever", "chills", "body aches", "fatigue", "cough", "sore throat",
                        "runny nose", "headache"],
            "confidence": 0.7,
            "treatment": "Rest, fluids, and over-the-counter medications"
        },
        "Gastroenteritis": {
            "symptoms": ["nausea", "vomiting", "diarrhea", "abdominal pain", "fever", "dehydration",
                        "stomach cramps"],
            "confidence": 0.7,
            "treatment": "Stay hydrated, rest, and monitor symptoms"
        },
        "Migraine": {
            "symptoms": ["severe headache", "throbbing pain", "nausea", "sensitivity to light",
                        "sensitivity to sound", "aura", "visual disturbances"],
            "confidence": 0.65,
            "treatment": "Rest in dark room, pain medication if needed"
        },
        "Common Cold": {
            "symptoms": ["runny nose", "sore throat", "cough", "sneezing", "mild fever",
                        "congestion", "mild headache"],
            "confidence": 0.6,
            "treatment": "Rest, fluids, and over-the-counter medications"
        },
        "Allergies": {
            "symptoms": ["runny nose", "sneezing", "itchy eyes", "sore throat", "cough",
                        "congestion", "watery eyes"],
            "confidence": 0.55,
            "treatment": "Antihistamines and avoid allergens"
        }
    }

    # Score each disease based on symptom matches
    disease_scores = {}
    matched_symptoms = []

    for disease, pattern in DISEASE_PATTERNS.items():
        score = 0
        disease_matches = []

        for symptom in pattern["symptoms"]:
            if symptom in text_l:
                # Check for intensity modifiers
                if any(word in text_l for word in ["severe", "intense", "very bad", "excruciating"]):
                    score += 2.0  # Higher weight for severe symptoms
                elif any(word in text_l for word in ["mild", "slight", "slight"]):
                    score += 0.5  # Lower weight for mild symptoms
                else:
                    score += 1.0  # Normal weight

                disease_matches.append(symptom)

        if disease_matches:
            # Normalize score by number of symptoms and apply base confidence
            normalized_score = min(score / len(pattern["symptoms"]), 1.0)
            final_score = normalized_score * pattern["confidence"]
            disease_scores[disease] = {
                "score": final_score,
                "matches": disease_matches,
                "treatment": pattern["treatment"]
            }
            matched_symptoms.extend(disease_matches)

    # Find the highest scoring disease
    if disease_scores:
        best_disease = max(disease_scores.items(), key=lambda x: x[1]["score"])
        disease_name = best_disease[0]
        disease_data = best_disease[1]

        # Remove duplicates from matched symptoms
        unique_symptoms = list(set(matched_symptoms))

        return (disease_name, disease_data["treatment"], unique_symptoms,
                round(disease_data["score"], 2), disease_data["matches"])

    # Fallback if no specific disease matches well
    return "General Illness", "Monitor symptoms and consult healthcare provider if they worsen", ["General symptoms"], 0.2, []
