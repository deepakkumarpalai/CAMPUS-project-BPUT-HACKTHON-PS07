from pathlib import Path

import joblib
import pandas as pd
from sklearn.feature_extraction.text import ENGLISH_STOP_WORDS, TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
from sklearn.pipeline import FeatureUnion, make_pipeline

DATASET_PATH = Path(__file__).resolve().parent / "dataset" / "complaints.csv"
MODEL_DIR = Path(__file__).resolve().parent / "model"


def make_vectorizer():
    return FeatureUnion(
        [
            (
                "word",
                TfidfVectorizer(
                    lowercase=True,
                    strip_accents="unicode",
                    stop_words=sorted(ENGLISH_STOP_WORDS),
                    ngram_range=(1, 2),
                    min_df=1,
                    sublinear_tf=True,
                    token_pattern=r"(?u)\b[a-zA-Z][a-zA-Z0-9'-]+\b",
                ),
            ),
            (
                "character",
                TfidfVectorizer(
                    analyzer="char_wb",
                    ngram_range=(3, 5),
                    min_df=2,
                    sublinear_tf=True,
                ),
            ),
        ],
        transformer_weights={"word": 1.0, "character": 0.6},
    )


def main():
    dataset = pd.read_csv(DATASET_PATH)
    required = {"complaint_text", "category", "severity", "priority"}
    if not required.issubset(dataset.columns):
        raise ValueError(f"Dataset must contain columns: {', '.join(sorted(required))}")
    if len(dataset) < 50:
        raise ValueError(f"Expected at least 50 training examples; found {len(dataset)}.")
    if dataset[list(required)].isnull().any().any():
        raise ValueError("Training dataset contains empty values in required columns.")

    X = dataset["complaint_text"].astype(str)
    labels_by_target = {}

    for target in ("category", "severity", "priority"):
        labels = dataset[target].astype(str)
        labels_by_target[target] = labels
        X_train, X_test, y_train, y_test = train_test_split(
            X,
            labels,
            test_size=0.2,
            random_state=42,
            stratify=labels,
        )
        evaluation_model = make_pipeline(make_vectorizer(), LogisticRegression(
            max_iter=1500, class_weight="balanced", random_state=42
        ))
        evaluation_model.fit(X_train, y_train)
        accuracy = accuracy_score(y_test, evaluation_model.predict(X_test))
        print(f"{target.capitalize()} holdout accuracy: {accuracy:.2f}")

    vectorizer = make_vectorizer()
    features = vectorizer.fit_transform(X)
    model_bundle = {}
    for target, labels in labels_by_target.items():
        model = LogisticRegression(max_iter=1500, class_weight="balanced", random_state=42)
        model.fit(features, labels)
        model_bundle[target] = model

    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    joblib.dump(model_bundle, MODEL_DIR / "priority_model.pkl")
    joblib.dump(vectorizer, MODEL_DIR / "vectorizer.pkl")
    print(f"Trained {len(dataset)} examples; artifacts saved to {MODEL_DIR}.")


if __name__ == "__main__":
    main()
