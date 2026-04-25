import json
import logging
import os
import subprocess
import sys
from typing import Any

import pandas as pd

# Setup logger for the service
logger = logging.getLogger("ipl.api.service")

# We still import from config since we will modify it later to act as an interface to the yaml files
from config import TOURNAMENTS, OUTPUTS_DIR

RESULTS_PATH = os.path.join(OUTPUTS_DIR, "results")
REBUILD_SCRIPT = os.path.join("scripts", "rebuild_all.py")
PIPELINE_TIMEOUT_SECONDS = 60 * 30

def validate_tournament(tournament: str) -> str:
    if tournament not in TOURNAMENTS:
        raise ValueError(f"Invalid tournament. Must be one of {list(TOURNAMENTS.keys())}")
    return tournament

def validate_model_name(model_name: str) -> str:
    allowed = {"random_forest", "xgboost", "lightgbm", "neural_network", "extra_trees", "ensemble"}
    if model_name not in allowed:
        raise ValueError(f"Invalid model. Must be one of {sorted(allowed)}")
    return model_name

def get_winner_probabilities(tournament: str) -> Any:
    tournament = validate_tournament(tournament)
    path = os.path.join(RESULTS_PATH, tournament, "prediction_2026.json")
    if os.path.exists(path):
        with open(path) as f:
            return json.load(f)
    return {"error": f"Prediction results for {tournament} not found. Run the pipeline first."}

def get_model_performance(tournament: str) -> Any:
    tournament = validate_tournament(tournament)
    path = os.path.join(RESULTS_PATH, tournament, "model_results.json")
    if os.path.exists(path):
        with open(path) as f:
            return json.load(f)
    return {"error": f"Model results for {tournament} not found."}

def get_match_fixtures(tournament: str) -> Any:
    tournament = validate_tournament(tournament)
    path = os.path.join(RESULTS_PATH, tournament, f"{tournament}_2026_match_predictions.csv")
    if os.path.exists(path):
        df = pd.read_csv(path)
        return df.to_dict(orient="records")
    return {"error": f"Match predictions for {tournament} not found."}

def get_shap_importance(model_name: str, tournament: str) -> Any:
    tournament = validate_tournament(tournament)
    model_name = validate_model_name(model_name)
    path = os.path.join(RESULTS_PATH, tournament, f"shap_importance_{model_name}.json")
    if os.path.exists(path):
        with open(path) as f:
            return json.load(f)
    return {"error": f"SHAP results for {tournament}/{model_name} not found."}

def get_intelligence(tournament: str) -> Any:
    tournament = validate_tournament(tournament)
    from src.prediction.predict_2026 import (
        PLAYOFF_RATE_3YR,
        SEASON_2025_RANK_SCORE,
        SQUAD_STRENGTH_2026,
    )
    return {
        "squad_strength": SQUAD_STRENGTH_2026,
        "playoff_rate": PLAYOFF_RATE_3YR,
        "form_score": SEASON_2025_RANK_SCORE,
    }

def simulate_h2h(team1: str, team2: str, tournament: str) -> Any:
    tournament = validate_tournament(tournament)
    from src.prediction.match_predictor import predict_match
    return predict_match(team1, team2, tournament=tournament)

def trigger_pipeline() -> dict[str, str]:
    if not os.path.exists(REBUILD_SCRIPT):
        raise FileNotFoundError("Pipeline script not found.")
    
    result = subprocess.run(
        [sys.executable, REBUILD_SCRIPT, "--all"],
        capture_output=True,
        text=True,
        timeout=PIPELINE_TIMEOUT_SECONDS,
        check=False,
    )

    if result.returncode != 0:
        logger.error("Pipeline failed (rc=%s): %s", result.returncode, result.stderr[-2000:])
        raise RuntimeError(f"Pipeline failed (rc={result.returncode}). See server logs.")
    
    logger.info("Pipeline completed successfully.")
    return {"status": "success", "message": "Pipeline finished."}

def get_team_logos() -> dict[str, str]:
    """Returns a mapping of team IDs to their logo URLs."""
    logo_dir = "data/assets/logos"
    logos = {}
    if os.path.exists(logo_dir):
        for f in os.listdir(logo_dir):
            if f.endswith((".png", ".jpg", ".jpeg")):
                team_id = os.path.splitext(f)[0]
                logos[team_id] = f"/assets/logos/{f}"
    return logos
