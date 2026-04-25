from fastapi import APIRouter, HTTPException
from src.api import schemas
from src.api import service
import subprocess
import logging

router = APIRouter()
logger = logging.getLogger("ipl.api.routes")

@router.get("/winner-probabilities")
def get_winner_probs(tournament: str = "ipl"):
    try:
        return service.get_winner_probabilities(tournament)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/model-performance")
def get_model_stats(tournament: str = "ipl"):
    try:
        return service.get_model_performance(tournament)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/match-fixtures")
def get_match_fixtures(tournament: str = "ipl"):
    try:
        return service.get_match_fixtures(tournament)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/shap-importance/{model_name}")
def get_shap_importance(model_name: str, tournament: str = "ipl"):
    try:
        return service.get_shap_importance(model_name, tournament)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/intelligence")
def get_intelligence(tournament: str = "ipl"):
    try:
        return service.get_intelligence(tournament)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/simulate-h2h")
def simulate_h2h(team1: str, team2: str, tournament: str = "ipl"):
    try:
        return service.simulate_h2h(team1, team2, tournament)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.exception("Failed to simulate h2h")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/trigger-pipeline", response_model=schemas.TriggerPipelineResponse)
def trigger_pipeline():
    try:
        return service.trigger_pipeline()
    except subprocess.TimeoutExpired as e:
        logger.error("Pipeline timed out")
        raise HTTPException(status_code=504, detail="Pipeline timed out.")
    except FileNotFoundError as e:
        logger.exception("Pipeline executable not found")
        raise HTTPException(status_code=500, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))
