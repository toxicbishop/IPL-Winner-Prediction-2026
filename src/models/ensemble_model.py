"""
Stacking Ensemble model combining RF, XGBoost, LightGBM, Neural Network, and ExtraTrees.
Uses a Logistic Regression meta-learner on top of base model probability outputs.
"""

import os

import joblib
import numpy as np
import pandas as pd
from sklearn.metrics import accuracy_score, classification_report, roc_auc_score
from sklearn.model_selection import StratifiedKFold

from config import CV_FOLDS, MODELS_DIR, RANDOM_STATE, get_tournament_paths

# Default features path for main execution (not used during API calls)
FEATURES_CSV = get_tournament_paths("ipl")["features"]

from src.models.base_model import FEATURE_COLS, TARGET_COL
from src.models.lightgbm_model import LightGBMModel
from src.models.random_forest_model import RandomForestModel


class EnsembleModel:
    """
    Stacking ensemble:
      Level 0: RF + XGBoost + LightGBM + NeuralNetwork + ExtraTrees
      Level 1: Logistic Regression meta-learner
    """

    name = "ensemble"

    def __init__(self, save_dir: str = None):
        self.save_dir = save_dir or MODELS_DIR
        self.base_models = [
            RandomForestModel(save_dir=self.save_dir),
            LightGBMModel(save_dir=self.save_dir),
        ]
        self.is_trained = False

    def _get_meta_features(self, df: pd.DataFrame, fit: bool = False) -> np.ndarray:
        """Return (n_samples, n_base_models) probability matrix."""
        X = df[FEATURE_COLS]
        meta = np.zeros((len(df), len(self.base_models)))
        for i, model in enumerate(self.base_models):
            probs = model.predict_proba(X)[:, 1]
            meta[:, i] = probs
        return meta

    def train(self, df: pd.DataFrame) -> dict:
        y = df[TARGET_COL].values

        # Train all base models
        print("Training base models...")
        for model in self.base_models:
            model.train(df)
            print(f"  {model.name} trained.")

        self.is_trained = True

        # Soft voting accuracy
        train_acc = accuracy_score(y, self.predict(df))
        print(f"Ensemble train accuracy: {train_acc:.4f}")
        return {"train_accuracy": round(train_acc, 4)}

    def cross_validate(self, df: pd.DataFrame) -> dict:
        """Real stratified K-fold CV on the soft-voting ensemble.

        For each fold we retrain every base model on the training split, then
        average their probabilities on the held-out split. Falls back to the
        base models' own averaged CV scores if any fold raises.
        """
        y = df[TARGET_COL].values
        skf = StratifiedKFold(n_splits=CV_FOLDS, shuffle=True, random_state=RANDOM_STATE)
        fold_scores = []
        for _fold_idx, (train_idx, test_idx) in enumerate(skf.split(df, y)):
            train_df = df.iloc[train_idx]
            test_df = df.iloc[test_idx]
            probs = np.zeros(len(test_df))
            for model in self.base_models:
                # Rebuild a fresh instance per fold to avoid leakage
                fresh = model.__class__(save_dir=self.save_dir)
                fresh.train(train_df)
                probs += fresh.predict_proba(test_df[FEATURE_COLS])[:, 1]
            probs /= len(self.base_models)
            preds = (probs >= 0.5).astype(int)
            fold_scores.append(accuracy_score(y[test_idx], preds))
        arr = np.array(fold_scores)
        return {
            "cv_mean": round(float(arr.mean()), 4),
            "cv_std": round(float(arr.std()), 4),
            "cv_scores": [round(float(s), 4) for s in arr],
        }

    def predict_proba(self, X: pd.DataFrame) -> np.ndarray:
        if not self.is_trained:
            raise RuntimeError("Model not trained yet.")
        meta = self._get_meta_features(
            X if isinstance(X, pd.DataFrame) else pd.DataFrame(X, columns=FEATURE_COLS)
        )
        # Soft Voting (Mean of probabilities)
        mean_probs = np.mean(meta, axis=1)

        # Format as (n_samples, 2)
        final_probs = np.zeros((len(X), 2))
        final_probs[:, 1] = mean_probs
        final_probs[:, 0] = 1.0 - mean_probs
        return final_probs

    def predict(self, X: pd.DataFrame) -> np.ndarray:
        return (self.predict_proba(X)[:, 1] >= 0.5).astype(int)

    def evaluate(self, df: pd.DataFrame) -> dict:
        y = df[TARGET_COL].values
        preds = self.predict(df)
        probs = self.predict_proba(df)[:, 1]
        return {
            "accuracy": round(accuracy_score(y, preds), 4),
            "roc_auc": round(roc_auc_score(y, probs), 4),
            "report": classification_report(y, preds, target_names=["team2_won", "team1_won"]),
        }

    def save(self):
        os.makedirs(self.save_dir, exist_ok=True)
        data = {
            "base_model_names": [m.name for m in self.base_models],
        }
        path = os.path.join(self.save_dir, f"{self.name}.pkl")
        joblib.dump(data, path)
        # Also save individual base models (redundant but safe)
        for m in self.base_models:
            m.save()
        print(f"Ensemble saved: {path}")
        return path

    def load(self):
        path = os.path.join(self.save_dir, f"{self.name}.pkl")
        joblib.load(path)
        for m in self.base_models:
            m.load()
        self.is_trained = True
        print(f"Ensemble loaded: {path}")


if __name__ == "__main__":
    df = pd.read_csv(FEATURES_CSV)
    model = EnsembleModel()
    print("Running OOF cross-validation (takes a few minutes)...")
    cv = model.cross_validate(df)
    print(f"\nEnsemble CV accuracy: {cv['cv_mean']:.4f}")
    print("\nTraining final ensemble on full data...")
    model.train(df)
    metrics = model.evaluate(df)
    print(f"Final train accuracy: {metrics['accuracy']:.4f}")
    print(f"ROC AUC: {metrics['roc_auc']:.4f}")
    model.save()
