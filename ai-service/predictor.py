import re
from pathlib import Path

import joblib
import pandas as pd

MODEL_DIR = Path(__file__).resolve().parent / "model"
MODEL_PATH = MODEL_DIR / "priority_model.pkl"
VECTORIZER_PATH = MODEL_DIR / "vectorizer.pkl"

PRIORITY_RANK = {"LOW": 0, "MEDIUM": 1, "HIGH": 2, "CRITICAL": 3}
PRIORITY_FLOORS = {"LOW": 0, "MEDIUM": 52, "HIGH": 72, "CRITICAL": 85}
SEVERITY_VALUES = {"Low": 1, "Medium": 2, "High": 4, "Critical": 5}
ESSENTIAL_CATEGORIES = {"Water Supply", "Electrical", "Security"}


def load_artifacts():
    if not MODEL_PATH.exists() or not VECTORIZER_PATH.exists():
        raise FileNotFoundError(
            "Trained model files are missing. Run `python train_model.py` in ai-service first."
        )
    return joblib.load(MODEL_PATH), joblib.load(VECTORIZER_PATH)


def _context_factors(text: str, category: str, model_priority: str):
    normalized = re.sub(r"\s+", " ", text.lower())
    localized_issue = re.search(
        r"\b(my (?:hostel )?room|one (?:hostel )?room|single (?:hostel )?room|"
        r"individual room|my classroom|one student|"
        r"one person|just my|only my)\b",
        normalized,
    )
    broad_impact = re.search(
        r"\b(entire|whole|all|campus[- ]wide|every|multiple|several|many|across|"
        r"block|building|floor|hostel|residence|students|people|everyone)\b",
        normalized,
    )
    count_match = re.search(r"\b(\d{1,4})\s+(?:students|people|rooms|hostels|buildings)\b", normalized)
    if count_match:
        affected_people = max(1, min(int(count_match.group(1)), 5))
    elif localized_issue:
        affected_people = 1
    elif broad_impact:
        affected_people = 5 if re.search(r"\b(entire|whole|all|campus[- ]wide|every|everyone)\b", normalized) else 3
    else:
        affected_people = 1

    urgent = re.search(
        r"\b(now|immediately|emergency|since morning|since yesterday|all day|"
        r"stopped|outage|no \w+|without|cannot|can't|unable|stranded)\b",
        normalized,
    )
    urgency = "Very High" if model_priority == "CRITICAL" else (
        "High" if model_priority == "HIGH" or urgent and affected_people >= 3
        else "Medium" if model_priority == "MEDIUM" or urgent
        else "Low"
    )
    urgency_value = {"Low": 1, "Medium": 2, "High": 4, "Very High": 5}[urgency]

    high_safety = re.search(
        r"\b(fire|smoke|gas leak|gas smell|sparking|electric shock|threat|assault|"
        r"weapon|trapped|collapse|chemical spill|can't breathe|cannot breathe|injur)\w*\b",
        normalized,
    )
    safety = 5 if high_safety else (
        4 if re.search(r"\b(unsafe|danger|hazard|exposed wire|blocked exit|sewage|spoiled food)\b", normalized) else 1
    )
    water_fixture = category == "Water Supply" and re.search(
        r"\b(tap|faucet|dripping|drip|one shower|my shower|single sink)\b", normalized
    )
    electrical_fixture = category == "Electrical" and localized_issue and re.search(
        r"\b(fan|light|bulb|lamp|outlet|switch)\b", normalized
    )
    if category == "Water Supply":
        essential = 2 if water_fixture else 5
    elif electrical_fixture:
        essential = 1
    elif category in {"Electrical", "Security"}:
        essential = 5
    elif category in {"Mess & Food", "Bathroom & Cleaning", "Transport"}:
        essential = 4
    else:
        essential = 1
    return affected_people, urgency, urgency_value, essential, safety


def _contextual_recommendation(text, category, severity, model_priority, factors):
    normalized = re.sub(r"\s+", " ", text.lower())
    affected_people, urgency, urgency_value, essential, safety = factors
    localized_fixture = re.search(
        r"\b(tap|faucet|dripping|drip|one shower|my shower|single sink|"
        r"broken chair|broken stool|loose chair|one chair|my room)\b",
        normalized,
    )
    water_outage = category == "Water Supply" and re.search(
        r"\b(no water|without water|water stopped|water supply.{0,20}(?:stop|unavailable|fail|outage)|"
        r"water.{0,20}(?:not coming|unavailable|outage))\b",
        normalized,
    )
    broad_electrical_outage = category == "Electrical" and re.search(
        r"\b(all|whole|entire|every|block|building|floor)\b", normalized
    ) and re.search(r"\b(power|electricity|light|lights|fan|outage)\b", normalized)

    if localized_fixture:
        if category == "Water Supply":
            return "Low", "LOW", urgency, urgency_value, affected_people, essential, safety
        if re.search(r"\b(chair|stool|furniture|desk)\b", normalized):
            return "Low", "LOW", urgency, urgency_value, 1, 1, 1

    if water_outage and affected_people >= 3:
        return "Critical", "CRITICAL", "Very High", 5, affected_people, 5, max(safety, 4)
    if broad_electrical_outage and affected_people >= 3:
        severity_rank = {"Low": 0, "Medium": 1, "High": 2, "Critical": 3}
        contextual_severity = max((severity, "High"), key=lambda value: severity_rank[value])
        return contextual_severity, max((model_priority, "HIGH"), key=lambda value: PRIORITY_RANK[value]), "High", 4, affected_people, 5, safety
    if category == "Wi-Fi & Internet" and re.search(r"\b(slow|intermittent|drops repeatedly)\b", normalized):
        return "Medium", "MEDIUM", "Medium", 2, 1, essential, safety
    if category == "Bathroom & Cleaning" and re.search(r"\b(dirty|unclean|not been cleaned|bad smell)\b", normalized):
        return "Medium", "MEDIUM", "Medium", 2, max(affected_people, 1), essential, safety
    if category == "Security" and re.search(r"\b(main gate|entrance|gate)\b", normalized):
        return "High", max((model_priority, "HIGH"), key=lambda value: PRIORITY_RANK[value]), "High", 4, max(affected_people, 1), essential, safety
    return severity, model_priority, urgency, urgency_value, affected_people, essential, safety


def _reason(category, affected_people, severity, urgency, essential, safety):
    if essential >= 5 and affected_people >= 3:
        return (
            "This complaint concerns an essential campus service and may affect "
            "multiple students. Prompt action is recommended."
        )
    if safety >= 4:
        return (
            "The complaint describes a potential safety or health hazard. "
            "Prompt administrator review is recommended."
        )
    if affected_people >= 3 and severity in {"High", "Critical"}:
        return (
            "The reported issue may affect several people and disrupt campus operations. "
            "Review it promptly."
        )
    if category == "Electrical" and affected_people == 1:
        return (
            "The reported electrical issue appears localized. Review the reported condition "
            "for any additional safety risk."
        )
    return (
        f"The model identified a {severity.lower()} {category.lower()} issue with "
        f"{urgency.lower()} urgency. An administrator should confirm the recommendation."
    )


def predict_priority(complaint: str, model_bundle=None, vectorizer=None):
    text = re.sub(r"\s+", " ", complaint.strip())
    if len(text) < 5:
        raise ValueError("Complaint must contain at least 5 non-whitespace characters.")
    if model_bundle is None or vectorizer is None:
        model_bundle, vectorizer = load_artifacts()

    features = vectorizer.transform([text])
    category = str(model_bundle["category"].predict(features)[0])
    severity = str(model_bundle["severity"].predict(features)[0])
    model_priority = str(model_bundle["priority"].predict(features)[0])
    normalized = re.sub(r"\s+", " ", text.lower())
    if re.search(r"\b(security|guard|unauthorized|intruder|stranger|threat|suspicious person)\b", normalized) and not re.search(
        r"\b(visitor pass|gate pass|student pass|pass scanner|valid pass)\b", normalized
    ):
        category = "Security"
    elif re.search(r"\b(tap|faucet|water supply|drinking water|water pipe|shower)\b", normalized):
        category = "Water Supply"
    elif re.search(r"\b(broken chair|broken stool|loose chair|furniture|desk)\b", normalized):
        category = "Maintenance"

    factors = _context_factors(text, category, model_priority)
    severity, model_priority, urgency, urgency_value, affected_people, essential, safety = (
        _contextual_recommendation(text, category, severity, model_priority, factors)
    )

    severity_value = SEVERITY_VALUES[severity]
    raw_score = round(
        (
            severity_value * 5
            + urgency_value * 5
            + affected_people * 4
            + essential * 5
            + safety * 6
        )
        / 125
        * 100
    )
    score_priority = (
        "CRITICAL" if raw_score >= 85
        else "HIGH" if raw_score >= 65
        else "MEDIUM" if raw_score >= 40
        else "LOW"
    )
    priority = max((score_priority, model_priority), key=lambda value: PRIORITY_RANK[value])
    priority_score = max(raw_score, PRIORITY_FLOORS[priority])

    return {
        "category": category,
        "severity": severity,
        "urgency": urgency,
        "affectedPeople": affected_people,
        "safetyImpact": safety,
        "essentialServiceImpact": essential,
        "priority": priority,
        "priorityScore": priority_score,
        "reason": _reason(category, affected_people, severity, urgency, essential, safety),
        "recommendationDisclaimer": (
            "AI-assisted recommendation only. An administrator makes the final decision."
        ),
    }
