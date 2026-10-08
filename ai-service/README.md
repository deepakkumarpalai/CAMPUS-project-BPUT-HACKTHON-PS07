# CampusConnect AI-Assisted Complaint Priority Recommendation

This is a separate Python microservice. It does not replace the MERN application.
The Node.js backend calls its REST API after a student submits a complaint and
stores the returned recommendation with the complaint. Administrators remain
responsible for final decisions; model output can be wrong and is not an
automated safety determination.

## Requirements and setup

Use Python 3.10 or newer in a virtual environment:

```powershell
cd ai-service
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
```

## Train the model

The CSV contains over 100 varied, labeled campus complaints. The training
script uses TF-IDF word and bigram features, lowercasing, accent normalization,
English stop-word handling, and Logistic Regression models for category,
severity, and priority. It prints holdout accuracy for transparency, then trains
on all examples and saves the model/vectorizer artifacts.

```powershell
python train_model.py
```

Training data is illustrative, not a validated production dataset. Replace or
augment it with reviewed, representative campus complaints before operational
use. Do not include student names or other personal information in training
examples.

## Start and test the API

```powershell
uvicorn app:app --reload --port 8000
```

The `app:app` import path is required (`app.py`, object `app`). Open
`http://127.0.0.1:8000/docs` for interactive API documentation.

```powershell
Invoke-RestMethod -Method Post -Uri http://127.0.0.1:8000/predict-priority `
  -ContentType 'application/json' `
  -Body '{"complaint":"Water is not coming in our entire hostel since morning"}'
```

Run the sample predictions and API checks:

```powershell
python -m unittest -v
```

The tests cover 20 varied complaint phrasings and compare a campus-wide water
outage with a single-room fan issue. Individual expected categories/priorities
and the rationale for representative cases are described in `TEST_CASES.md`.

## REST contract

`POST /predict-priority` accepts `{"complaint":"..."}` and returns category,
severity, urgency, affectedPeople, contextual impact factors, priority,
priorityScore (0-100), reason, and a human-review disclaimer. Categories are
human-readable values which the Node adapter maps to the existing MongoDB
complaint enum. Affected-people values are a rough impact band (1, 3, or 5),
not an exact headcount.

The priority score combines severity, urgency, affected-people band, essential
service impact, and safety impact. The Logistic Regression priority class acts
as a conservative tier floor so localized examples learned as MEDIUM do not
become LOW solely because only one person is affected. Category, severity, and
priority come from text classification; impact factors and explanation also
consider the complaint context. This is explainable baseline NLP, not a
guarantee of correctness.

## Run the complete MERN + Python project

1. Install and start the API as described above. Keep it running on port 8000.
2. In `backend/.env`, set `AI_PRIORITY_SERVICE_URL=http://127.0.0.1:8000` and
   configure the existing MongoDB/JWT settings from `backend/.env.example`.
3. In a second terminal, install backend dependencies if needed and start
   Express:

   ```powershell
   cd backend
   npm install
   npm run dev
   ```

4. In a third terminal, start the existing Vite frontend:

   ```powershell
   cd frontend
   npm install
   npm run dev
   ```

5. Submit a student complaint from the campus portal. Express stores the
   complaint with its AI recommendation, score, factors, and explanation. The
   admin dashboard ranks complaints by priority, score descending, then oldest
   creation time. An administrator can explicitly change the priority; that
   sets `prioritySource` to `ADMIN` without altering `aiRecommendedPriority`.

If the Python service is unreachable, the backend logs the failure and uses the
project's existing complaint-analysis fallback. The resulting analysis mode is
shown in the review screen; restart Python and submit a new complaint to receive
the NLP model prediction.

## Model validation note

The bundled illustrative dataset is small and synthetic. The training script's
holdout metrics are printed each time it trains; they are not a production
certification. On the included 178-example dataset, one 80/20 stratified split
reported 0.61 category, 0.36 severity, and 0.36 priority accuracy. That is
limited baseline performance, especially for severity and priority; do not
rely on it as a production classifier without substantially more reviewed,
representative data and evaluation. Review the metrics after retraining, test
locally with campus-specific examples, and collect administrator-reviewed
labels before operational use. Always keep a human in the decision loop.
