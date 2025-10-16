# 🩺 MedTriage — Intelligent Symptom & Heart-Risk Assessment System

**MedTriage** is an AI-powered triage platform built with **FastAPI + React** that combines a rule-based engine with a trained **RandomForest heart-risk model**.  
It provides interpretable, auditable, and calibrated triage guidance for early heart disease risk assessment and clinical decision support.

---

## 🎥 Demo Video

[recording (2).webm](https://github.com/user-attachments/assets/9a587988-442b-4350-bb67-92aee40ef957)





---

## ⚡ Overview

Users enter symptoms or clinical values (age, chest pain type, blood pressure, cholesterol, etc.).  
The FastAPI backend returns:
- **Risk label** (`Normal` / `Disease`)
- **Calibrated probability**
- **Top contributing features**
- **Recommended next step**

Every request is logged for **auditability**, and low-confidence predictions trigger a **rule-based fallback** for safe handling.

---

## 🧠 Machine Learning Model

**Dataset:** [UCI Cleveland Heart Disease Dataset](https://archive.ics.uci.edu/ml/datasets/Heart+Disease) (303 samples, 14 features)  
**Goal:** Predict likelihood of heart disease using 9 key clinical parameters.

### 🧩 Model Architecture
- **Pipeline:** `ColumnTransformer` → `StandardScaler` → `RandomForestClassifier`
- **Tuning:** `RandomizedSearchCV` (20 iterations, 5-fold CV, ROC-AUC optimized)
- **Calibration:** Post-hoc Platt-scaling using Logistic Regression on a held-out fold
- **Explainability:** Feature importance extraction (`feature_importances_`) served through the API
- **Persistence:** Serialized with `joblib` → `heart_attack_model.pkl`

### ⚙️ Preprocessing Steps
| Feature Type | Transformation |
|---------------|----------------|
| Numeric | Median imputation → StandardScaler |
| Categorical | Mode imputation → OneHotEncoder |

---

## 📊 Model Results

| Metric | Value |
|---------|-------|
| **ROC-AUC** | **0.85** |
| **Brier Score** | **0.1625** |

The model achieves a good tradeoff between discrimination (AUC = 0.85) and calibration (Brier = 0.1625), ensuring confidence scores align well with actual outcomes.

---

### 🔍 Evaluation Visuals

**Confusion Matrix**
> Shows classification accuracy across both risk classes.  
> ✅ Correct predictions on the diagonal indicate balanced model performance.
<img width="600" height="500" alt="confusion_matrix" src="https://github.com/user-attachments/assets/de70be11-461d-44a1-856a-a6cfd86fe592" />



**Calibration Curve**
> Demonstrates how well predicted probabilities match observed outcomes.  
> A nearly diagonal curve indicates proper probability calibration.
<img width="600" height="600" alt="calibration" src="https://github.com/user-attachments/assets/9ff381d6-04ae-4be8-98a2-b948a3ce5b6d" />


**ROC Curve**
> Illustrates tradeoff between sensitivity (TPR) and false positive rate (FPR).  
> AUC = 0.85 indicates strong discriminative capability.


<img width="640" height="480" alt="roc_curve" src="https://github.com/user-attachments/assets/b59a22ad-4314-4a4b-82dd-3d1986664501" />

---

## 🧩 Tech Stack

**Backend:** Python, FastAPI, Uvicorn, SQLAlchemy  
**Frontend:** React (Vite), Tailwind CSS, Framer Motion  
**ML:** scikit-learn, joblib, RandomForestClassifier, LogisticRegression calibrator  
**Database:** SQLite / MySQL (via environment variable)  
**Security:** JWT authentication (users + admin), input validation, rate limiting  
**Ops:** Audit logging, PID/log files, environment-driven configuration

---

## 💡 Key Features

- 🩺 **Smart triage:** Combines rule-based logic + ML predictions  
- 🔍 **Explainable:** Displays top contributing features  
- ⚖️ **Calibrated confidence:** Avoids overconfident outputs  
- 🧾 **Auditable:** Logs all sessions for transparency and QA  
- 🔒 **Secure:** JWT-protected endpoints for users and admins  

---

## 🧠 My ML Work (Core Contributions)

- Implemented full preprocessing pipeline (imputation, scaling, encoding)  
- Trained and tuned RandomForestClassifier (ROC-AUC optimized)  
- Applied post-hoc Platt-scaling with LogisticRegression for calibration  
- Extracted and served explainable top-k features via FastAPI  
- Added rule-based fallback + confidence thresholding for safety  
- Integrated model serialization and lazy loading in production  
- Logged predictions, confidence, and latency for monitoring  
- Produced JSON model report with key metrics and importances  

---

## 🧾 Example Architecture

│
├── /triage → Rule-based engine
├── /triage_ml → DistilBERT zero-shot symptom classifier
└── /triage_heart → RandomForest heart-risk model
├── Preprocessing + Calibration
├── Prediction + Feature Importance
└── Audit Logging (SQLAlchemy)


---

## 💬 Elevator Pitch

> “I built **MedTriage**, an interpretable triage platform that combines a rule-based engine with a calibrated RandomForest heart-risk model.  
> I designed the full ML pipeline — preprocessing, tuning, calibration, and explainability — and integrated it into a secure FastAPI backend with JWT-based auth and audit logging.  
> The system delivers calibrated probabilities, top contributing features, and rule-based fallback to ensure safe and interpretable predictions.”

---

## 🧭 Project Impact

- Early heart-risk detection through evidence-based predictions  
- Transparent and auditable model for clinical trust  
- Safety-first design with abstain thresholds and fallback logic  
- Scalable for integration into hospital or telehealth systems  

---

## 🧑‍💻 Run Locally

```bash
# Clone repo
git clone https://github.com/<your-username>/MedTriage.git
cd MedTriage

# Backend setup
cd backend
pip install -r requirements.txt
uvicorn main:app --reload

# Frontend setup
cd ../frontend
npm install
npm run dev

```

📜 License

MIT License © 2025 Shakin Shahria

🙏 Acknowledgments

Dataset: UCI Heart Disease Dataset

Libraries: scikit-learn • FastAPI • React • Tailwind CSS • Framer Motion



---

✅ **Next Step:**  
Add your generated plots:
- `confusion_matrix.png` → already included  
- `roc_curve.png` and `calibration_curve.png` → place them in the root folder and replace the placeholders above.  
- Keep your demo video file (`recording (2).webm`) or link in the section marked **Demo Video**.








