from typing import List, Tuple


def _matches_any(text_l: str, keywords: List[str]) -> bool:
    return any(k in text_l for k in keywords)


def classify_symptom(text: str, age: int = None, gender: str = None) -> Tuple[str, str, List[str], float, List[str]]:
    """Advanced disease classification system with medical pattern recognition.

    Uses sophisticated symptom pattern matching with medical knowledge, demographic factors,
    and evidence-based diagnostic criteria. Returns (primary_disease, treatment_protocol,
    differential_diagnoses, confidence_score, key_symptoms).
    """
    if not text or not text.strip():
        return "Undifferentiated Illness", "Monitor symptoms and seek medical evaluation if they persist or worsen", ["General symptoms"], 0.1, []

    text_l = text.lower()

    # Enhanced disease database with medical patterns, demographics, and evidence-based criteria
    DISEASE_DATABASE = {
        # Critical Emergency Conditions
        "Acute Myocardial Infarction": {
            "symptoms": ["chest pain", "retrosternal chest pain", "left arm pain", "jaw pain",
                        "shortness of breath", "dyspnea", "diaphoresis", "nausea", "vomiting",
                        "lightheadedness", "syncope", "severe fatigue"],
            "critical_symptoms": ["chest pain", "shortness of breath", "diaphoresis"],
            "demographics": {"age_risk": "high", "gender_prevalence": "male"},
            "urgency": "immediate",
            "confidence": 0.95,
            "treatment": "Activate EMS immediately - MONA-B protocol: Morphine, Oxygen, Nitroglycerin, Aspirin, Beta-blockers"
        },
        "Acute Ischemic Stroke": {
            "symptoms": ["sudden weakness", "hemiplegia", "facial droop", "slurred speech",
                        "aphasia", "dysarthria", "confusion", "severe headache", "vertigo",
                        "loss of balance", "vision changes", "numbness"],
            "critical_symptoms": ["sudden weakness", "facial droop", "slurred speech"],
            "demographics": {"age_risk": "high"},
            "urgency": "immediate",
            "confidence": 0.92,
            "treatment": "EMS activation - Time is brain: tPA within 4.5 hours, thrombectomy within 6 hours"
        },
        "Acute Respiratory Distress": {
            "symptoms": ["severe shortness of breath", "hypoxia", "tachypnea", "cyanosis",
                        "chest pain", "fever", "cough", "confusion", "fatigue"],
            "critical_symptoms": ["severe shortness of breath", "cyanosis"],
            "urgency": "immediate",
            "confidence": 0.90,
            "treatment": "Emergency evaluation - Possible intubation, ventilator support, treat underlying cause"
        },

        # Urgent Surgical Conditions
        "Acute Appendicitis": {
            "symptoms": ["right lower quadrant pain", "rebound tenderness", "nausea", "vomiting",
                        "fever", "anorexia", "diarrhea", "migratory pain"],
            "critical_symptoms": ["rebound tenderness", "right lower quadrant pain"],
            "demographics": {"age_risk": "young_adult"},
            "urgency": "urgent",
            "confidence": 0.88,
            "treatment": "Surgical consultation - Appendectomy within 24-48 hours, IV antibiotics, NPO"
        },
        "Acute Cholecystitis": {
            "symptoms": ["right upper quadrant pain", "epigastric pain", "nausea", "vomiting",
                        "fever", "jaundice", "murphy's sign", "biliary colic"],
            "critical_symptoms": ["right upper quadrant pain", "murphy's sign"],
            "demographics": {"gender_prevalence": "female", "age_risk": "adult"},
            "urgency": "urgent",
            "confidence": 0.85,
            "treatment": "Surgical evaluation - Cholecystectomy, IV fluids, pain control, antibiotics"
        },

        # Infectious Diseases
        "Community-Acquired Pneumonia": {
            "symptoms": ["fever", "chills", "productive cough", "chest pain", "shortness of breath",
                        "fatigue", "myalgia", "headache", "nausea"],
            "critical_symptoms": ["shortness of breath", "chest pain"],
            "demographics": {"age_risk": "elderly"},
            "urgency": "urgent",
            "confidence": 0.82,
            "treatment": "Antibiotic therapy based on CURB-65 score, oxygen supplementation, supportive care"
        },
        "Influenza (Seasonal)": {
            "symptoms": ["sudden fever", "chills", "myalgia", "fatigue", "dry cough",
                        "headache", "sore throat", "rhinorrhea"],
            "critical_symptoms": ["sudden fever", "myalgia"],
            "urgency": "primary_care",
            "confidence": 0.78,
            "treatment": "Supportive care, antipyretics, hydration; consider antivirals within 48 hours"
        },
        "COVID-19": {
            "symptoms": ["fever", "dry cough", "fatigue", "anosmia", "ageusia", "sore throat",
                        "headache", "myalgia", "shortness of breath", "diarrhea"],
            "critical_symptoms": ["anosmia", "ageusia", "dry cough"],
            "urgency": "urgent",
            "confidence": 0.80,
            "treatment": "Isolate, monitor oxygen saturation, seek medical care for severe symptoms"
        },
        "Urinary Tract Infection": {
            "symptoms": ["dysuria", "frequency", "urgency", "suprapubic pain", "hematuria",
                        "fever", "chills", "nausea", "flank pain"],
            "critical_symptoms": ["dysuria", "frequency", "urgency"],
            "demographics": {"gender_prevalence": "female"},
            "urgency": "primary_care",
            "confidence": 0.75,
            "treatment": "Urine analysis, appropriate antibiotics based on culture, hydration"
        },

        # Gastrointestinal Conditions
        "Acute Gastroenteritis": {
            "symptoms": ["nausea", "vomiting", "diarrhea", "abdominal cramps", "fever",
                        "dehydration", "headache", "myalgia"],
            "critical_symptoms": ["dehydration", "severe vomiting"],
            "urgency": "primary_care",
            "confidence": 0.70,
            "treatment": "Oral rehydration therapy, BRAT diet, antiemetics if needed, monitor for dehydration"
        },
        "Acute Diverticulitis": {
            "symptoms": ["left lower quadrant pain", "fever", "nausea", "constipation",
                        "diarrhea", "abdominal tenderness"],
            "critical_symptoms": ["left lower quadrant pain", "fever"],
            "demographics": {"age_risk": "adult"},
            "urgency": "urgent",
            "confidence": 0.76,
            "treatment": "CT scan, antibiotics, bowel rest, possible surgical intervention"
        },

        # Neurological Conditions
        "Migraine Headache": {
            "symptoms": ["unilateral headache", "throbbing pain", "photophobia", "phonophobia",
                        "nausea", "vomiting", "aura", "visual disturbances"],
            "critical_symptoms": ["throbbing pain", "photophobia", "phonophobia"],
            "demographics": {"gender_prevalence": "female", "age_risk": "young_adult"},
            "urgency": "primary_care",
            "confidence": 0.72,
            "treatment": "Triptans, NSAIDs, antiemetics, prophylactic therapy for frequent episodes"
        },
        "Tension Headache": {
            "symptoms": ["bilateral headache", "dull pain", "neck stiffness", "scalp tenderness",
                        "mild nausea", "fatigue"],
            "critical_symptoms": ["bilateral headache", "neck stiffness"],
            "urgency": "self_care",
            "confidence": 0.65,
            "treatment": "NSAIDs, relaxation techniques, stress management, physical therapy"
        },

        # Respiratory Conditions
        "Acute Bronchitis": {
            "symptoms": ["productive cough", "chest congestion", "fever", "fatigue",
                        "wheezing", "shortness of breath"],
            "critical_symptoms": ["productive cough", "chest congestion"],
            "urgency": "primary_care",
            "confidence": 0.68,
            "treatment": "Supportive care, hydration, cough suppressants, bronchodilators if wheezing"
        },
        "Allergic Rhinitis": {
            "symptoms": ["sneezing", "rhinorrhea", "nasal congestion", "itchy nose", "itchy eyes",
                        "postnasal drip", "sore throat"],
            "critical_symptoms": ["sneezing", "itchy nose", "itchy eyes"],
            "urgency": "self_care",
            "confidence": 0.60,
            "treatment": "Antihistamines, nasal corticosteroids, allergen avoidance, immunotherapy"
        },

        # Musculoskeletal Conditions
        "Acute Low Back Pain": {
            "symptoms": ["low back pain", "radiating pain", "stiffness", "limited mobility",
                        "muscle spasms", "sciatica"],
            "critical_symptoms": ["radiating pain", "neurological symptoms"],
            "urgency": "primary_care",
            "confidence": 0.64,
            "treatment": "NSAIDs, physical therapy, activity modification, epidural injections if indicated"
        },

        # Endocrine/Metabolic
        "Diabetic Ketoacidosis": {
            "symptoms": ["polyuria", "polydipsia", "fatigue", "nausea", "vomiting",
                        "abdominal pain", "fruity breath", "confusion"],
            "critical_symptoms": ["fruity breath", "confusion", "vomiting"],
            "demographics": {"age_risk": "young"},
            "urgency": "immediate",
            "confidence": 0.87,
            "treatment": "IV fluids, insulin therapy, electrolyte correction, monitor glucose and ketones"
        }
    }

    # Analyze symptom text with advanced pattern recognition
    symptom_scores = {}
    matched_symptoms = []
    critical_matches = []

    for disease_name, disease_data in DISEASE_DATABASE.items():
        score = 0.0
        disease_matches = []
        critical_count = 0

        # Enhanced symptom matching with severity weighting
        for symptom in disease_data["symptoms"]:
            if symptom in text_l:
                # Base score for symptom presence
                base_score = 1.0

                # Critical symptom bonus
                if symptom in disease_data.get("critical_symptoms", []):
                    base_score *= 2.0
                    critical_count += 1
                    critical_matches.append(symptom)

                # Severity modifiers
                if any(word in text_l for word in ["severe", "intense", "excruciating", "worst"]):
                    base_score *= 1.5
                elif any(word in text_l for word in ["mild", "slight", "minimal"]):
                    base_score *= 0.7

                # Duration modifiers (chronic vs acute)
                if "chronic" in text_l and disease_data.get("chronic_possible", True):
                    base_score *= 0.8
                elif "sudden" in text_l or "acute" in text_l:
                    base_score *= 1.2

                score += base_score
                disease_matches.append(symptom)

        if disease_matches:
            # Demographic adjustments
            demo_multiplier = 1.0
            if age and gender:
                if disease_data["demographics"].get("age_risk") == "high" and age > 65:
                    demo_multiplier *= 1.2
                elif disease_data["demographics"].get("age_risk") == "young" and age < 30:
                    demo_multiplier *= 1.2
                elif disease_data["demographics"].get("age_risk") == "young_adult" and 18 <= age <= 40:
                    demo_multiplier *= 1.1

                if disease_data["demographics"].get("gender_prevalence") == gender.lower():
                    demo_multiplier *= 1.1

            # Critical symptom bonus
            critical_bonus = min(critical_count * 0.3, 1.0)

            # Normalize and apply confidence
            normalized_score = min(score / len(disease_data["symptoms"]), 1.0)
            final_score = (normalized_score * disease_data["confidence"] * demo_multiplier) + critical_bonus

            symptom_scores[disease_name] = {
                "score": min(final_score, 1.0),
                "matches": disease_matches,
                "treatment": disease_data["treatment"],
                "urgency": disease_data["urgency"],
                "critical_count": critical_count
            }
            matched_symptoms.extend(disease_matches)

    # Find top 3 differential diagnoses
    if symptom_scores:
        sorted_diseases = sorted(symptom_scores.items(), key=lambda x: x[1]["score"], reverse=True)
        top_disease = sorted_diseases[0]

        primary_disease = top_disease[0]
        primary_data = top_disease[1]

        # Create differential diagnosis list
        differential = []
        for disease, data in sorted_diseases[:3]:
            urgency_indicator = {
                "immediate": "🚨 EMERGENCY",
                "urgent": "⚠️ URGENT",
                "primary_care": "👨‍⚕️ Primary Care",
                "self_care": "🏠 Self-Care"
            }.get(data["urgency"], "Unknown")

            differential.append(f"{disease} ({urgency_indicator}, {data['score']:.1%} confidence)")

        # Remove duplicates from symptoms
        unique_symptoms = list(set(matched_symptoms))

        return (primary_disease, primary_data["treatment"], differential,
                round(primary_data["score"], 3), unique_symptoms)

    # Fallback for unrecognized patterns
    return ("Undifferentiated Medical Condition",
            "Consult healthcare provider for proper evaluation and diagnosis",
            ["Requires professional medical assessment"], 0.05, [])
