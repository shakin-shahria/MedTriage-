from typing import List, Tuple


def _matches_any(text_l: str, keywords: List[str]) -> bool:
    return any(k in text_l for k in keywords)


def classify_symptom(text: str) -> Tuple[str, str, List[str], float, List[str]]:
    """Classify symptom text into (risk, suggestion, conditions).

    Uses a simple weighted trigger system: high/medium/low trigger matches
    contribute to a score which is mapped to an overall risk level. Returns
    (risk, suggestion, conditions).
    """
    if not text or not text.strip():
        return "Medium", "Telehealth", ["Undetermined"]

    text_l = text.lower()

    # Define trigger keywords for each bucket with weights
    HIGH_TRIGGERS = [
        "chest pain",
        "shortness of breath",
        "difficulty breathing",
        "severe breath",
        "severe chest",
        "loss of consciousness",
        "fainting",
        "unconscious",
        "severe bleeding",
        "stroke",
        "face droop",
        "slurred speech",
        "weakness on one side",
        "sudden weakness",
        "severe fever",
        "severe abdominal pain",
    ]

    MEDIUM_TRIGGERS = [
        "fever",
        "persistent fever",
        "vomiting",
        "diarrhea",
        "abdominal pain",
        "moderate pain",
        "persistent cough",
        "high temperature",
        "dehydration",
        "worsening",
    ]

    LOW_TRIGGERS = [
        "headache",
        "mild headache",
        "sore throat",
        "runny nose",
        "sneezing",
        "mild cough",
        "cough",
        "minor",
        "itch",
    ]

    # Weighting per trigger
    weight_map = {}
    for k in HIGH_TRIGGERS:
        weight_map[k] = 2.0
    for k in MEDIUM_TRIGGERS:
        weight_map[k] = 1.0
    for k in LOW_TRIGGERS:
        weight_map[k] = 0.5

    score = 0.0
    conditions: List[str] = []

    # To avoid double-counting overlapping phrases (e.g. 'mild headache' and 'headache')
    # we match triggers in descending length order and skip triggers that are
    # substrings of already-matched longer triggers.
    matched: List[str] = []
    # Combined triggers sorted by length (longest first)
    combined_triggers = sorted(weight_map.keys(), key=lambda s: -len(s))
    for k in combined_triggers:
        if k in text_l:
            # skip if any already matched trigger contains this one or is contained by it
            skip = False
            for m in matched:
                if k in m or m in k:
                    skip = True
                    break
            if skip:
                continue
            matched.append(k)
            score += float(weight_map[k])
            conditions.append(k)

    # Add small heuristics for intensity words
    if any(w in text_l for w in ["severe", "intense", "very bad", "excruciating"]):
        score += 1.0
    if any(w in text_l for w in ["mild", "slight", "tiny"]):
        score -= 0.25

    # Map score to risk
    # score >= 2.0 -> High, score >= 1.0 -> Medium, else Low
    if score >= 2.0:
        risk = "High"
        suggestion = "Visit ER immediately"
        if not conditions:
            conditions = ["Severe condition"]
    elif score >= 1.0:
        risk = "Medium"
        suggestion = "Telehealth"
        if not conditions:
            conditions = ["Monitor symptoms"]
    else:
        risk = "Low"
        suggestion = "Self-care"
        if not conditions:
            conditions = ["Mild condition"]

    # Deduplicate conditions and make them human-friendly
    cond_clean = []
    for c in conditions:
        c = c.strip()
        if c and c not in cond_clean:
            cond_clean.append(c)

    # Return risk, suggestion, conditions, numeric score, and matched triggers
    return risk, suggestion, cond_clean, float(score), matched
