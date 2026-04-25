"""
IPL 2026 Tournament Winner Prediction.

Strategy:
  1. For every pair of teams in the 2026 IPL, simulate a match
     using the trained ensemble model to get win probabilities.
  2. Average win probabilities across all toss/venue scenarios.
  3. Apply a Bayesian update using CURRENT-STRENGTH priors:
       - Squad strength (35%) -- current players, retentions, auction
       - Recent form last 3 seasons (30%) -- actual 2023-2025 performance
       - ML model signal (30%)
       - Playoff appearances last 3 seasons (5%)
  4. All-time title count is NOT a prior.

Data: trained on real IPL.csv (2008-2025, 1100+ matches).
"""

import itertools
import json
import os

import numpy as np
import pandas as pd

from config import (
    TEAMS,
    get_tournament_paths,
)
from src.features.engineer import (
    get_all_time_win_rates,
    get_h2h_rate,
    get_last_n_seasons_wr,
    get_recent_form,
    get_recent_titles,
    get_venue_win_rate,
    is_home_ground,
)
from src.features.team_strength import get_team_strength_features
from src.features.venue_features import (
    get_venue_avg_score,
    get_venue_size,
    get_venue_toss_impact,
)
from src.models.base_model import FEATURE_COLS

_PRIORS_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "data", "priors_2026.json")


def _load_priors_2026() -> dict:
    """Load the 2026 IPL priors (squad strength, playoff rate, season rank) from JSON.

    Keeping these in data/priors_2026.json instead of hardcoded constants allows
    updates without code changes and gives us an audit trail in git.
    """
    with open(_PRIORS_PATH) as f:
        priors = json.load(f)
    required = {"squad_strength_2026", "playoff_rate_3yr", "season_2025_rank_score"}
    missing = required - set(priors.keys())
    if missing:
        raise ValueError(f"priors_2026.json missing required keys: {missing}")
    return priors


_PRIORS = _load_priors_2026()
SQUAD_STRENGTH_2026 = _PRIORS["squad_strength_2026"]
PLAYOFF_RATE_3YR = _PRIORS["playoff_rate_3yr"]
SEASON_2025_RANK_SCORE = _PRIORS["season_2025_rank_score"]

# Venues to average over (tournament-specific defaults can be added)
PREDICTION_VENUES_IPL = [
    "Wankhede Stadium",
    "Eden Gardens",
    "MA Chidambaram Stadium",
    "Narendra Modi Stadium",
    "Rajiv Gandhi International Cricket Stadium",
    "M Chinnaswamy Stadium",
    "Sawai Mansingh Stadium",
]


def build_matchup_features(
    team1: str, team2: str, df: pd.DataFrame, tournament: str = "ipl"
) -> pd.DataFrame:
    """
    Build feature rows for a hypothetical team1 vs team2 matchup in 2026.
    Averages over toss outcomes, toss decisions, and multiple venues.
    """
    overall_rates = get_all_time_win_rates(df)

    venues = (
        PREDICTION_VENUES_IPL if tournament == "ipl" else df["venue"].dropna().unique()[:5].tolist()
    )  # fallback for ICC

    features_list = []
    for toss_t1 in [1, 0]:
        for toss_bat in [1, 0]:
            for venue in venues:
                t1_alltime = overall_rates.get(team1, 0.5)
                t2_alltime = overall_rates.get(team2, 0.5)

                t1_last3yr = get_last_n_seasons_wr(df, team1, 2026, n_seasons=3)
                t2_last3yr = get_last_n_seasons_wr(df, team2, 2026, n_seasons=3)

                sq1 = SQUAD_STRENGTH_2026.get(team1, 7.5) / 10 if tournament == "ipl" else 0.75
                sq2 = SQUAD_STRENGTH_2026.get(team2, 7.5) / 10 if tournament == "ipl" else 0.75
                t1_form_adj = t1_last3yr * 0.5 + sq1 * 0.5
                t2_form_adj = t2_last3yr * 0.5 + sq2 * 0.5

                t1_form = get_recent_form(df, team1, len(df), 10)
                t2_form = get_recent_form(df, team2, len(df), 10)

                t1_season = get_recent_form(df, team1, len(df), 14)
                t2_season = get_recent_form(df, team2, len(df), 14)

                h2h = get_h2h_rate(df, team1, team2, len(df), 5)

                t1_venue = get_venue_win_rate(df, team1, venue, len(df))
                t2_venue = get_venue_win_rate(df, team2, venue, len(df))

                t1_home = is_home_ground(team1, venue)
                t2_home = is_home_ground(team2, venue)

                t1_rt = get_recent_titles(
                    team1, 2026, window=5, db_path=df.loc[0, "db_path"] if "db_path" in df else None
                )
                t2_rt = get_recent_titles(
                    team2, 2026, window=5, db_path=df.loc[0, "db_path"] if "db_path" in df else None
                )

                v_avg_score = get_venue_avg_score(venue)
                v_toss_impact = get_venue_toss_impact(venue)
                v_size = get_venue_size(venue)

                t1_str = get_team_strength_features(team1, 2026)
                t2_str = get_team_strength_features(team2, 2026)

                f = {
                    "toss_won_by_team1": toss_t1,
                    "toss_decision_bat": toss_bat,
                    "t1_alltime_wr": t1_alltime,
                    "t2_alltime_wr": t2_alltime,
                    "wr_diff": t1_alltime - t2_alltime,
                    "t1_last3yr_wr": t1_form_adj,
                    "t2_last3yr_wr": t2_form_adj,
                    "last3yr_wr_diff": t1_form_adj - t2_form_adj,
                    "t1_recent_form": t1_form,
                    "t2_recent_form": t2_form,
                    "form_diff": t1_form - t2_form,
                    "t1_season_form": t1_season,
                    "t2_season_form": t2_season,
                    "h2h_t1_wr": h2h,
                    "t1_venue_wr": t1_venue,
                    "t2_venue_wr": t2_venue,
                    "venue_wr_diff": t1_venue - t2_venue,
                    "t1_is_home": t1_home,
                    "t2_is_home": t2_home,
                    "t1_recent_titles": t1_rt,
                    "t2_recent_titles": t2_rt,
                    "recent_title_diff": t1_rt - t2_rt,
                    "venue_avg_score": v_avg_score,
                    "venue_toss_impact": v_toss_impact,
                    "venue_size": v_size,
                    "t1_batting_str": t1_str["batting_strength"],
                    "t2_batting_str": t2_str["batting_strength"],
                    "batting_str_diff": t1_str["batting_strength"] - t2_str["batting_strength"],
                    "t1_bowling_str": t1_str["bowling_strength"],
                    "t2_bowling_str": t2_str["bowling_strength"],
                    "bowling_str_diff": t1_str["bowling_strength"] - t2_str["bowling_strength"],
                }
                features_list.append(f)

    return pd.DataFrame(features_list, columns=FEATURE_COLS)


def simulate_tournament(model, df: pd.DataFrame, tournament: str = "ipl"):
    """Simulate all round-robin matchups and accumulate win probabilities."""
    teams = (
        list(set(df["team1"]) | set(df["team2"]))
        if tournament != "ipl"
        else ["CSK", "MI", "RCB", "KKR", "SRH", "RR", "GT", "LSG", "DC", "PBKS"]
    )
    win_probs = {t: [] for t in teams if t}
    fixtures = []

    for idx, (team1, team2) in enumerate(itertools.combinations(win_probs.keys(), 2)):
        # We need to pass the DB path into the features builder for title lookup
        feats = build_matchup_features(team1, team2, df, tournament)
        probs = model.predict_proba(feats)
        avg_t1_wins = probs[:, 1].mean()
        avg_t2_wins = 1 - avg_t1_wins
        win_probs[team1].append(avg_t1_wins)
        win_probs[team2].append(avg_t2_wins)

        predicted_winner = team1 if avg_t1_wins > 0.5 else team2
        # Just create some sample dates spanning April/May 2026
        fixtures.append(
            {
                "date": f"2026-04-{(idx % 30) + 1:02d}",
                "team1": team1,
                "team2": team2,
                "predicted_winner": predicted_winner,
                "t1_prob": round(avg_t1_wins, 2),
            }
        )

    model_probs = {t: np.mean(v) for t, v in win_probs.items()}
    # Sort fixtures randomly or by some logic; let's keep them as generated so frontend gets a schedule
    return model_probs, fixtures


def bayesian_update(model_probs: dict, tournament: str = "ipl") -> dict:
    """
    Combine model probabilities with CURRENT-STRENGTH domain priors.

    Includes an in-season form signal (2026 win rates for completed matches)
    whose weight ramps with matches played; pre-tournament it contributes 0 and
    the other four priors stay at their original weights.
    """
    if tournament != "ipl":
        return model_probs  # simplified for ICC for now

    teams = list(model_probs.keys())

    def normalize(d):
        total = sum(d.values())
        return {k: v / total for k, v in d.items()} if total > 0 else d

    sq_prior = normalize(SQUAD_STRENGTH_2026)

    recent_form_raw = {}
    for t in teams:
        playoff_score = PLAYOFF_RATE_3YR.get(t, 0)
        rank_score = SEASON_2025_RANK_SCORE.get(t, 5) / 10
        recent_form_raw[t] = playoff_score * 0.6 + rank_score * 0.4
    recent_prior = normalize({t: max(v, 0.01) for t, v in recent_form_raw.items()})

    pl_prior = normalize({t: max(v, 0.01) for t, v in PLAYOFF_RATE_3YR.items()})

    model_norm = normalize(model_probs)

    from src.features.in_season_form import compute_in_season_form, in_season_weight

    in_season_rates, n_played = compute_in_season_form(tournament, season=2026)
    in_season_prior = normalize({t: max(in_season_rates.get(t, 0.5), 0.01) for t in teams})
    in_season_w = in_season_weight(n_played)

    base = {"squad": 0.35, "recent_form": 0.30, "model": 0.30, "playoff": 0.05}
    scale = 1.0 - in_season_w
    weights = {k: v * scale for k, v in base.items()}
    weights["in_season"] = in_season_w

    combined = {}
    for t in teams:
        combined[t] = (
            weights["squad"] * sq_prior.get(t, 0)
            + weights["recent_form"] * recent_prior.get(t, 0)
            + weights["model"] * model_norm.get(t, 0)
            + weights["playoff"] * pl_prior.get(t, 0)
            + weights["in_season"] * in_season_prior.get(t, 0)
        )

    print(f"In-season signal: {n_played} matches played, weight={in_season_w:.2f}")
    return normalize(combined)


def rank_predictions(combined_probs: dict, tournament: str = "ipl") -> list:
    ranked = sorted(combined_probs.items(), key=lambda x: x[1], reverse=True)
    results = []
    for rank, (team, prob) in enumerate(ranked, start=1):
        results.append(
            {
                "rank": rank,
                "team_id": team,
                "team_name": TEAMS.get(team, team),
                "win_probability": round(prob * 100, 2),
            }
        )
    return results


def predict_2026_winner(tournament: str = "ipl", use_ensemble: bool = True):
    # Main function. Loads ensemble, simulates tournament, returns ranked predictions.
    from src.models.ensemble_model import EnsembleModel
    from src.models.xgboost_model import XGBoostModel

    paths = get_tournament_paths(tournament)
    matches_df = pd.read_csv(paths["features"].replace("features.csv", "matches_processed.csv"))
    matches_df["db_path"] = paths["db"]

    if use_ensemble:
        try:
            model = EnsembleModel(save_dir=paths["models"])
            model.load()
        except Exception:
            print(f"No saved ensemble for {tournament}. Using XGBoost as fallback.")
            model = XGBoostModel(save_dir=paths["models"])
            model.load()
    else:
        model = XGBoostModel(save_dir=paths["models"])
        model.load()

    print(f"\nSimulating {tournament.upper()} 2026 matchups...")
    model_probs, fixtures = simulate_tournament(model, matches_df, tournament)

    print("Applying Bayesian update...")
    final_probs = bayesian_update(model_probs, tournament)

    rankings = rank_predictions(final_probs, tournament)
    return rankings, fixtures


def print_predictions(rankings: list):
    print("\n" + "=" * 65)
    print("         IPL 2026 WINNER PREDICTION RESULTS")
    print("  (Squad strength 35% + Recent form 30% + Model 30%)")
    print("  Trained on REAL IPL data: 2008-2025 (1100+ matches)")
    print("=" * 65)
    print(f"{'Rank':<6} {'Team':<35} {'Win Probability':>15}")
    print("-" * 65)
    for r in rankings:
        bar = "=" * int(r["win_probability"] / 2)
        print(f"  {r['rank']:<4} {r['team_name']:<35} {r['win_probability']:>6.2f}%  {bar}")
    print("=" * 65)
    w = rankings[0]
    print(f"\n  PREDICTED WINNER: {w['team_name']}")
    print(f"  Confidence score: {w['win_probability']:.2f}%")
    print("=" * 65)


def save_predictions(rankings: list, fixtures: list, tournament: str = "ipl"):
    paths = get_tournament_paths(tournament)
    out_dir = paths["results"]
    os.makedirs(out_dir, exist_ok=True)
    path = os.path.join(out_dir, "prediction_2026.json")
    with open(path, "w") as f:
        json.dump(
            {
                "season": 2026,
                "tournament": tournament,
                "method": "Stacking Ensemble",
                "rankings": rankings,
            },
            f,
            indent=2,
        )

    # Save CSV for frontend match fixture table for all tournaments
    csv_path = os.path.join(out_dir, f"{tournament}_2026_match_predictions.csv")
    pd.DataFrame(fixtures).to_csv(csv_path, index=False)

    print(f"\n[{tournament}] Predictions saved: {path}")


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser()
    parser.add_argument("--tournament", default="ipl")
    args = parser.parse_args()

    rankings, fixtures = predict_2026_winner(args.tournament)
    print_predictions(rankings)
    save_predictions(rankings, fixtures, args.tournament)
