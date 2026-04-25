"""
Model training orchestrator with MLflow tracking.
Trains all individual models + ensemble, saves metrics to JSON and MLflow.
"""

import json
import os
import logging
import pandas as pd
import mlflow
import mlflow.sklearn
from sklearn.model_selection import train_test_split

from config import RANDOM_STATE, TEST_SIZE, get_tournament_paths
from src.models.base_model import FEATURE_COLS, TARGET_COL
from src.models.ensemble_model import EnsembleModel
from src.models.extra_trees_model import ExtraTreesModel
from src.models.lightgbm_model import LightGBMModel
from src.models.neural_network_model import NeuralNetworkModel
from src.models.random_forest_model import RandomForestModel
from src.models.tune import load_best_params
from src.models.xgboost_model import XGBoostModel

logger = logging.getLogger(__name__)

# Set MLflow experiment
mlflow.set_experiment("IPL_2026_Winner_Prediction")

def load_features(features_path: str) -> pd.DataFrame:
    if not os.path.exists(features_path):
        raise FileNotFoundError(
            f"Features file not found: {features_path}\nRun: python main.py --mode setup first."
        )
    return pd.read_csv(features_path)

def _apply_tuned_params(model, best_params: dict):
    name_map = {
        "random_forest": None,
        "xgboost": "xgboost",
        "lightgbm": "lightgbm",
        "neural_network": None,
        "extra_trees": None,
    }
    key = name_map.get(model.name)
    if key and key in best_params and best_params[key]:
        params = best_params[key]
        for attr, val in params.items():
            if hasattr(model.model, attr):
                setattr(model.model, attr, val)
        print(f"  Applied {len(params)} tuned params to {model.name}")

def train_all(df: pd.DataFrame, models_dir: str, tournament: str) -> dict:
    results = {}

    df_train, df_test = train_test_split(
        df, test_size=TEST_SIZE, random_state=RANDOM_STATE, stratify=df[TARGET_COL]
    )

    best_params = load_best_params()
    
    individual_models = [
        RandomForestModel(save_dir=models_dir),
        XGBoostModel(save_dir=models_dir),
        LightGBMModel(save_dir=models_dir),
        NeuralNetworkModel(save_dir=models_dir),
        ExtraTreesModel(save_dir=models_dir),
    ]

    for model in individual_models:
        with mlflow.start_run(run_name=f"{tournament}_{model.name}"):
            print(f"\nTraining: {model.name.upper()}")
            
            if best_params:
                _apply_tuned_params(model, best_params)

            cv = model.cross_validate(df_train)
            model.train(df_train)
            train_metrics = model.evaluate(df_train)
            test_metrics = model.evaluate(df_test)

            # Log metrics to MLflow
            mlflow.log_param("tournament", tournament)
            mlflow.log_param("model_type", model.name)
            mlflow.log_metric("cv_accuracy", cv["cv_mean"])
            mlflow.log_metric("train_accuracy", train_metrics["accuracy"])
            mlflow.log_metric("test_accuracy", test_metrics["accuracy"])
            if "roc_auc" in test_metrics:
                mlflow.log_metric("test_roc_auc", test_metrics["roc_auc"])

            # Log model
            mlflow.sklearn.log_model(model.model, f"model_{model.name}")

            model.save()
            results[model.name] = {
                "cv_accuracy": cv["cv_mean"],
                "cv_std": cv["cv_std"],
                "train_accuracy": train_metrics["accuracy"],
                "test_accuracy": test_metrics["accuracy"],
            }
            if "roc_auc" in test_metrics:
                results[model.name]["test_roc_auc"] = test_metrics["roc_auc"]

    # Ensemble
    with mlflow.start_run(run_name=f"{tournament}_ensemble"):
        ensemble = EnsembleModel(save_dir=models_dir)
        ensemble.train(df_train)
        ens_test = ensemble.evaluate(df_test)
        ensemble.save()
        
        mlflow.log_param("tournament", tournament)
        mlflow.log_metric("test_accuracy", ens_test["accuracy"])
        if "roc_auc" in ens_test:
            mlflow.log_metric("test_roc_auc", ens_test["roc_auc"])

        results["ensemble"] = {
            "train_accuracy": ensemble.evaluate(df_train)["accuracy"],
            "test_accuracy": ens_test["accuracy"],
            "test_roc_auc": ens_test.get("roc_auc", None),
        }

    return results

def save_results(results: dict, results_dir: str):
    os.makedirs(results_dir, exist_ok=True)
    path = os.path.join(results_dir, "model_results.json")
    with open(path, "w") as f:
        json.dump(results, f, indent=2)

def run_training(tournament: str = "ipl"):
    paths = get_tournament_paths(tournament)
    df = load_features(paths["features"])
    results = train_all(df, paths["models"], tournament)
    save_results(results, paths["results"])
    return results

if __name__ == "__main__":
    run_training()
