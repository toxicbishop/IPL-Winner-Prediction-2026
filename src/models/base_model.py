"""
Base model class for all IPL prediction models.
Provides common interface: train, predict, evaluate, save, load.
"""

import logging
import os
from abc import ABC, abstractmethod

import joblib
import numpy as np
import pandas as pd
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.model_selection import StratifiedKFold, cross_val_score

logger = logging.getLogger(__name__)

from config import CV_FOLDS, MODELS_DIR, RANDOM_STATE

FEATURE_COLS = [
    # Toss (minimal - context only, not primary signal)
    "toss_won_by_team1",
    "toss_decision_bat",
    # All-time win rate (Bayesian-smoothed, cumulative - no leakage)
    "t1_alltime_wr",
    "t2_alltime_wr",
    "wr_diff",
    # Last 3 seasons win rate - reflects CURRENT strength
    "t1_last3yr_wr",
    "t2_last3yr_wr",
    "last3yr_wr_diff",
    # Recent match form (last 5 matches - exponentially weighted)
    "t1_recent_form",
    "t2_recent_form",
    "form_diff",
    # Longer-term form (last 10 matches - stable trend)
    "t1_last10_form",
    "t2_last10_form",
    "last10_form_diff",
    # Recent NRR (last 5 matches - margin based)
    "t1_recent_nrr",
    "t2_recent_nrr",
    "nrr_diff",
    # Current season form
    "t1_season_form",
    "t2_season_form",
    # Head-to-head (last 3 seasons)
    "h2h_t1_wr",
    # Venue win rates
    "t1_venue_wr",
    "t2_venue_wr",
    "venue_wr_diff",
    # Home advantage
    "t1_is_home",
    "t2_is_home",
    # Recent titles (last 5 seasons only)
    "t1_recent_titles",
    "t2_recent_titles",
    "recent_title_diff",
    # Venue pitch features
    "venue_avg_score",
    "venue_toss_impact",
    "venue_size",
    # Team batting/bowling strength (from player stats)
    "t1_batting_str",
    "t2_batting_str",
    "batting_str_diff",
    "t1_bowling_str",
    "t2_bowling_str",
    "bowling_str_diff",
    # Advanced player metrics (difference features)
    "top5_bat_sr_diff",
    "top3_bowl_econ_diff",
    "top3_bat_runs_diff",
    # Ball-by-ball derived features (death/powerplay/boundaries)
    "death_bowl_diff",
    "boundary_pct_diff",
    "pp_bowl_diff",
    # Momentum & interaction features
    "t1_momentum",
    "t2_momentum",
    "momentum_diff",
    # Pro-level matchup features
    "is_playoff",
    "win_streak_diff",
    "bat_vs_bowl_diff",
    "bowl_vs_bat_diff",
]

TARGET_COL = "team1_won"


class BaseIPLModel(ABC):
    """Abstract base class for IPL winner prediction models."""

    name: str = "base"

    def __init__(self, save_dir: str = None):
        self.save_dir = save_dir or MODELS_DIR
        self.model = None
        self.is_trained = False
        self._build()

    @abstractmethod
    def _build(self):
        """Instantiate self.model with configured hyperparameters."""

    def get_X_y(self, df: pd.DataFrame):
        missing = [c for c in FEATURE_COLS if c not in df.columns]
        if missing:
            raise ValueError(f"Feature matrix missing columns: {missing}")
        if TARGET_COL not in df.columns:
            raise ValueError(f"Target column '{TARGET_COL}' missing from features dataframe.")
        X = df[FEATURE_COLS].copy()
        y = df[TARGET_COL].copy()
        nan_cols = X.columns[X.isna().any()].tolist()
        if nan_cols:
            raise ValueError(
                f"NaN values found in feature columns: {nan_cols}. "
                "Fix feature engineering before training."
            )
        if y.isna().any():
            raise ValueError(f"NaN values found in target column '{TARGET_COL}'.")
        return X, y

    def train(self, df: pd.DataFrame, sample_weight=None) -> dict:
        X, y = self.get_X_y(df)

        # Determine the correct fit arguments
        fit_params = {}
        if sample_weight is not None:
            # Handle Pipeline routing: Pipeline.fit(X, y, stepname__sample_weight=...)
            from sklearn.pipeline import Pipeline

            if isinstance(self.model, Pipeline):
                last_step_name = self.model.steps[-1][0]
                last_step_estimator = self.model.steps[-1][1]
                # Only pass if the final estimator supports sample_weight
                if (
                    hasattr(last_step_estimator, "fit")
                    and "sample_weight" in last_step_estimator.fit.__code__.co_varnames
                ):
                    fit_params[f"{last_step_name}__sample_weight"] = sample_weight
            elif (
                hasattr(self.model, "fit")
                and "sample_weight" in self.model.fit.__code__.co_varnames
            ):
                fit_params["sample_weight"] = sample_weight

        self.model.fit(X, y, **fit_params)
        self.is_trained = True
        train_acc = accuracy_score(y, self.model.predict(X))
        return {"train_accuracy": round(train_acc, 4)}

    def cross_validate(self, df: pd.DataFrame) -> dict:
        X, y = self.get_X_y(df)
        cv = StratifiedKFold(n_splits=CV_FOLDS, shuffle=True, random_state=RANDOM_STATE)
        scores = cross_val_score(self.model, X, y, cv=cv, scoring="accuracy", n_jobs=1)
        return {
            "cv_mean": round(scores.mean(), 4),
            "cv_std": round(scores.std(), 4),
            "cv_scores": [round(s, 4) for s in scores],
        }

    def evaluate(self, df: pd.DataFrame) -> dict:
        X, y = self.get_X_y(df)
        preds = self.model.predict(X)
        probs = self.predict_proba(X)[:, 1] if hasattr(self.model, "predict_proba") else None

        # Calculate scores
        acc = accuracy_score(y, preds)
        prec = precision_score(y, preds, zero_division=0)
        rec = recall_score(y, preds, zero_division=0)
        f1 = f1_score(y, preds, zero_division=0)

        metrics = {
            "accuracy": round(acc, 4),
            "precision": round(prec, 4),
            "recall": round(rec, 4),
            "f1_score": round(f1, 4),
            "report": classification_report(
                y, preds, target_names=["team2_won", "team1_won"], zero_division=0
            ),
        }

        if probs is not None:
            try:
                metrics["roc_auc"] = round(roc_auc_score(y, probs), 4)
            except ValueError as e:
                logger.warning("ROC AUC could not be computed for %s: %s", self.name, e)
                metrics["roc_auc"] = None
        return metrics

    def evaluate_2024(self, df: pd.DataFrame) -> dict:
        """Specific evaluation on 2024 season matches."""
        if "season" not in df.columns:
            return {}
        df_2024 = df[df["season"] == 2024].copy()
        if df_2024.empty:
            return {}
        return self.evaluate(df_2024)

    def predict(self, X: pd.DataFrame) -> np.ndarray:
        if isinstance(X, pd.DataFrame):
            X = X[FEATURE_COLS]
        return self.model.predict(X)

    def predict_proba(self, X) -> np.ndarray:
        if isinstance(X, pd.DataFrame):
            X = X[FEATURE_COLS]
        if hasattr(self.model, "predict_proba"):
            return self.model.predict_proba(X)
        # Fallback for models without predict_proba
        preds = self.model.predict(X)
        probs = np.zeros((len(preds), 2))
        probs[preds == 1, 1] = 0.9
        probs[preds == 0, 0] = 0.9
        return probs

    def save(self):
        os.makedirs(self.save_dir, exist_ok=True)
        path = os.path.join(self.save_dir, f"{self.name}.pkl")
        joblib.dump(self.model, path)
        print(f"Model saved: {path}")
        return path

    def load(self, path: str = None):
        if path is None:
            path = os.path.join(self.save_dir, f"{self.name}.pkl")
        if not os.path.exists(path):
            raise FileNotFoundError(f"No saved model at {path}")
        self.model = joblib.load(path)
        self.is_trained = True
        print(f"Model loaded: {path}")

    def feature_importance(self) -> pd.Series | None:
        if hasattr(self.model, "feature_importances_"):
            return pd.Series(self.model.feature_importances_, index=FEATURE_COLS).sort_values(
                ascending=False
            )
        if hasattr(self.model, "coef_"):
            return pd.Series(abs(self.model.coef_[0]), index=FEATURE_COLS).sort_values(
                ascending=False
            )
        return None
