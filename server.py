import os
import sys
import json
import subprocess
import logging
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from config import TOURNAMENTS

logger = logging.getLogger("ipl.server")
logging.basicConfig(level=logging.INFO)

app = FastAPI()

ALLOWED_ORIGINS = [
    o.strip()
    for o in os.getenv(
        "IPL_ALLOWED_ORIGINS",
        "http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173,http://127.0.0.1:5173",
    ).split(",")
    if o.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "Authorization"],
)

os.makedirs("outputs", exist_ok=True)
app.mount("/outputs", StaticFiles(directory="outputs"), name="outputs")

RESULTS_PATH = "outputs/results/"
REBUILD_SCRIPT = os.path.join("scripts", "rebuild_all.py")
PIPELINE_TIMEOUT_SECONDS = 60 * 30  # 30 min hard cap


def _validate_tournament(tournament: str) -> str:
    """Whitelist the tournament key to prevent path traversal."""
    if tournament not in TOURNAMENTS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid tournament. Must be one of {list(TOURNAMENTS.keys())}",
        )
    return tournament


def _validate_model_name(model_name: str) -> str:
    allowed = {"random_forest", "xgboost", "lightgbm", "neural_network", "extra_trees", "ensemble"}
    if model_name not in allowed:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid model. Must be one of {sorted(allowed)}",
        )
    return model_name


@app.get("/api/winner-probabilities")
def get_winner_probs(tournament: str = "ipl"):
    tournament = _validate_tournament(tournament)
    path = os.path.join(RESULTS_PATH, tournament, "prediction_2026.json")
    if os.path.exists(path):
        with open(path) as f:
            return json.load(f)
    return {"error": f"Prediction results for {tournament} not found. Run the pipeline first."}


@app.get("/api/model-performance")
def get_model_stats(tournament: str = "ipl"):
    tournament = _validate_tournament(tournament)
    path = os.path.join(RESULTS_PATH, tournament, "model_results.json")
    if os.path.exists(path):
        with open(path) as f:
            return json.load(f)
    return {"error": f"Model results for {tournament} not found."}


@app.get("/api/match-fixtures")
def get_match_fixtures(tournament: str = "ipl"):
    tournament = _validate_tournament(tournament)
    path = os.path.join(RESULTS_PATH, tournament, f"{tournament}_2026_match_predictions.csv")
    if os.path.exists(path):
        import pandas as pd
        df = pd.read_csv(path)
        return df.to_dict(orient="records")
    return {"error": f"Match predictions for {tournament} not found."}


@app.get("/api/shap-importance/{model_name}")
def get_shap_importance(model_name: str, tournament: str = "ipl"):
    tournament = _validate_tournament(tournament)
    model_name = _validate_model_name(model_name)
    path = os.path.join(RESULTS_PATH, tournament, f"shap_importance_{model_name}.json")
    if os.path.exists(path):
        with open(path) as f:
            return json.load(f)
    return {"error": f"SHAP results for {tournament}/{model_name} not found."}


@app.get("/api/intelligence")
def get_intelligence(tournament: str = "ipl"):
    tournament = _validate_tournament(tournament)
    from src.prediction.predict_2026 import (
        SQUAD_STRENGTH_2026,
        PLAYOFF_RATE_3YR,
        SEASON_2025_RANK_SCORE,
    )
    return {
        "squad_strength": SQUAD_STRENGTH_2026,
        "playoff_rate": PLAYOFF_RATE_3YR,
        "form_score": SEASON_2025_RANK_SCORE,
    }


@app.post("/api/trigger-pipeline")
def trigger_pipeline():
    if not os.path.exists(REBUILD_SCRIPT):
        raise HTTPException(status_code=500, detail="Pipeline script not found.")
    try:
        result = subprocess.run(
            [sys.executable, REBUILD_SCRIPT, "--all"],
            capture_output=True,
            text=True,
            timeout=PIPELINE_TIMEOUT_SECONDS,
            check=False,
        )
    except subprocess.TimeoutExpired:
        logger.error("Pipeline timed out after %ss", PIPELINE_TIMEOUT_SECONDS)
        raise HTTPException(status_code=504, detail="Pipeline timed out.")
    except FileNotFoundError as e:
        logger.exception("Pipeline executable not found")
        raise HTTPException(status_code=500, detail=str(e))

    if result.returncode != 0:
        logger.error("Pipeline failed (rc=%s): %s", result.returncode, result.stderr[-2000:])
        raise HTTPException(
            status_code=500,
            detail=f"Pipeline failed (rc={result.returncode}). See server logs.",
        )
    logger.info("Pipeline completed successfully.")
    return {"status": "success", "message": "Pipeline finished."}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=True)
