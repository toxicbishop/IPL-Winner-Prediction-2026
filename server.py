import os
import json
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

app = FastAPI()

# Enable CORS for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

RESULTS_PATH = "outputs/results/"

@app.get("/api/winner-probabilities")
def get_winner_probs(tournament: str = "ipl"):
    path = os.path.join(RESULTS_PATH, tournament, "prediction_2026.json")
    if os.path.exists(path):
        with open(path) as f:
            return json.load(f)
    return {"error": f"Prediction results for {tournament} not found. Run the pipeline first."}

@app.get("/api/model-performance")
def get_model_stats(tournament: str = "ipl"):
    path = os.path.join(RESULTS_PATH, tournament, "model_results.json")
    if os.path.exists(path):
        with open(path) as f:
            return json.load(f)
    return {"error": f"Model results for {tournament} not found."}

@app.get("/api/match-fixtures")
def get_match_fixtures(tournament: str = "ipl"):
    # Read from the generated CSV summary
    path = os.path.join(RESULTS_PATH, tournament, f"{tournament}_2026_match_predictions.csv")
    if os.path.exists(path):
        import pandas as pd
        df = pd.read_csv(path)
        return df.to_dict(orient="records")
    return {"error": f"Match predictions for {tournament} not found."}

@app.get("/api/shap-importance/{model_name}")
def get_shap_importance(model_name: str, tournament: str = "ipl"):
    path = os.path.join(RESULTS_PATH, tournament, f"shap_importance_{model_name}.json")
    if os.path.exists(path):
        with open(path) as f:
            return json.load(f)
    return {"error": f"SHAP results for {tournament}/{model_name} not found."}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
