"""
IPL 2026 Tournament Winner Prediction using Monte Carlo Simulation.

Strategy:
  1. For every pair of teams in the 2026 IPL, simulate the round-robin stage
     10,000 times using the trained ensemble model.
  2. Each match outcome is a Bernoulli trial based on model win probability.
  3. Apply Bayesian update using CURRENT-STRENGTH priors to the final win rates.
  4. Output probability of winning, reaching playoffs, and finishing top.

Data: trained on real IPL.csv (2008-2025, 1100+ matches).
"""

import itertools
import json
import os
import random

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
    with open(_PRIORS_PATH) as f:
        priors = json.load(f)
    return priors


_PRIORS = _load_priors_2026()
SQUAD_STRENGTH_2026 = _PRIORS["squad_strength_2026"]
PLAYOFF_RATE_3YR = _PRIORS["playoff_rate_3yr"]
SEASON_2025_RANK_SCORE = _PRIORS["season_2025_rank_score"]

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
    team1: str, team2: str, df: pd.DataFrame, tournament: str = "ipl", is_playoff: int = 0
) -> pd.DataFrame:
    """
    Build feature rows for a hypothetical team1 vs team2 matchup in 2026.
    Averages over toss outcomes, toss decisions, and multiple venues.
    """
    overall_rates = get_all_time_win_rates(df)
    venues = (
        PREDICTION_VENUES_IPL if tournament == "ipl" else df["venue"].dropna().unique()[:5].tolist()
    )

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

                t1_rt = get_recent_titles(team1, 2026, window=5)
                t2_rt = get_recent_titles(team2, 2026, window=5)

                t1_str = get_team_strength_features(team1, 2026)
                t2_str = get_team_strength_features(team2, 2026)

                t1_last10 = get_recent_form(df, team1, len(df), 10)
                t2_last10 = get_recent_form(df, team2, len(df), 10)

                t1_nrr = 0.0  # Neutral for prediction (no past NRR in 2026)
                t2_nrr = 0.0

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
                    "t1_last10_form": t1_last10,
                    "t2_last10_form": t2_last10,
                    "last10_form_diff": t1_last10 - t2_last10,
                    "t1_recent_nrr": t1_nrr,
                    "t2_recent_nrr": t2_nrr,
                    "nrr_diff": t1_nrr - t2_nrr,
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
                    "venue_avg_score": get_venue_avg_score(venue),
                    "venue_toss_impact": get_venue_toss_impact(venue),
                    "venue_size": get_venue_size(venue),
                    "t1_batting_str": t1_str["batting_strength"],
                    "t2_batting_str": t2_str["batting_strength"],
                    "batting_str_diff": t1_str["batting_strength"] - t2_str["batting_strength"],
                    "t1_bowling_str": t1_str["bowling_strength"],
                    "t2_bowling_str": t2_str["bowling_strength"],
                    "bowling_str_diff": t1_str["bowling_strength"] - t2_str["bowling_strength"],
                    "top5_bat_sr_diff": t1_str["top5_bat_sr"] - t2_str["top5_bat_sr"],
                    "top3_bowl_econ_diff": t1_str["top3_bowl_econ"] - t2_str["top3_bowl_econ"],
                    "top3_bat_runs_diff": t1_str.get("top3_bat_runs", 300)
                    - t2_str.get("top3_bat_runs", 300),
                    "death_bowl_diff": t1_str.get("death_bowl_str", 0.5)
                    - t2_str.get("death_bowl_str", 0.5),
                    "boundary_pct_diff": t1_str.get("boundary_pct", 55)
                    - t2_str.get("boundary_pct", 55),
                    "pp_bowl_diff": t1_str.get("pp_bowl_str", 0.5) - t2_str.get("pp_bowl_str", 0.5),
                    "t1_momentum": t1_form * t1_venue * t1_str["batting_strength"],
                    "t2_momentum": t2_form * t2_venue * t2_str["batting_strength"],
                    "momentum_diff": (t1_form * t1_venue * t1_str["batting_strength"])
                    - (t2_form * t2_venue * t2_str["batting_strength"]),
                    "is_playoff": is_playoff,
                    "win_streak_diff": 0,
                    "bat_vs_bowl_diff": t1_str["batting_strength"] - t2_str["bowling_strength"],
                    "bowl_vs_bat_diff": t1_str["bowling_strength"] - t2_str["batting_strength"],
                }

                features_list.append(f)

    return pd.DataFrame(features_list, columns=FEATURE_COLS)


def monte_carlo_simulation(
    model, df: pd.DataFrame, tournament: str = "ipl", iterations: int = 5000
):
    """
    Simulate the full tournament multiple times to find the winner distribution.
    """
    teams = ["CSK", "MI", "RCB", "KKR", "SRH", "RR", "GT", "LSG", "DC", "PBKS"]
    if tournament != "ipl":
        teams = list(set(df["team1"]) | set(df["team2"]))

    # Pre-calculate win probabilities for every matchup to speed up simulation
    matchup_probs = {}
    print("Calculating matchup probabilities...")
    for t1, t2 in itertools.combinations(teams, 2):
        feats = build_matchup_features(t1, t2, df, tournament, is_playoff=0)
        prob = model.predict_proba(feats)[:, 1].mean()
        matchup_probs[(t1, t2)] = prob

    # Simulation results
    win_counts = {t: 0 for t in teams}
    playoff_counts = {t: 0 for t in teams}

    print(f"Running {iterations} Monte Carlo iterations...")
    for _ in range(iterations):
        points = {t: 0 for t in teams}

        # Round Robin (each team plays others twice in IPL)
        for t1, t2 in itertools.combinations(teams, 2):
            # Match 1
            if random.random() < matchup_probs[(t1, t2)]:
                points[t1] += 2
            else:
                points[t2] += 2
            # Match 2
            if random.random() < matchup_probs[(t1, t2)]:
                points[t1] += 2
            else:
                points[t2] += 2

        # Sort teams by points
        ranked_teams = sorted(points.items(), key=lambda x: (x[1], random.random()), reverse=True)

        # Top 4 reach playoffs
        for i in range(4):
            playoff_counts[ranked_teams[i][0]] += 1

        # Simplification: Winner is the one who finished 1st (or simulate playoffs)
        # For IPL, let's simulate a basic playoff between top 4
        top4 = [t for t, p in ranked_teams[:4]]
        # Qualifier 1: 1 vs 2
        q1_winner = (
            top4[0]
            if random.random()
            < matchup_probs.get((top4[0], top4[1]), matchup_probs.get((top4[1], top4[0]), 0.5))
            else top4[1]
        )
        q1_loser = top4[1] if q1_winner == top4[0] else top4[0]
        # Eliminator: 3 vs 4
        elim_winner = (
            top4[2]
            if random.random()
            < matchup_probs.get((top4[2], top4[3]), matchup_probs.get((top4[3], top4[2]), 0.5))
            else top4[3]
        )
        # Qualifier 2: q1_loser vs elim_winner
        q2_winner = (
            q1_loser
            if random.random()
            < matchup_probs.get(
                (q1_loser, elim_winner), matchup_probs.get((elim_winner, q1_loser), 0.5)
            )
            else elim_winner
        )
        # Final: q1_winner vs q2_winner
        final_winner = (
            q1_winner
            if random.random()
            < matchup_probs.get(
                (q1_winner, q2_winner), matchup_probs.get((q2_winner, q1_winner), 0.5)
            )
            else q2_winner
        )

        win_counts[final_winner] += 1

    # Convert to probabilities
    final_win_probs = {t: count / iterations for t, count in win_counts.items()}

    # Create fixtures for the dashboard (just a sample set)
    fixtures = []
    for idx, (t1, t2) in enumerate(itertools.combinations(teams, 2)):
        fixtures.append(
            {
                "date": f"2026-04-{(idx % 30) + 1:02d}",
                "team1": t1,
                "team2": t2,
                "predicted_winner": t1 if matchup_probs[(t1, t2)] > 0.5 else t2,
                "t1_prob": round(matchup_probs[(t1, t2)], 2),
            }
        )

    return final_win_probs, fixtures


def bayesian_update(model_probs: dict, tournament: str = "ipl") -> dict:
    if tournament != "ipl":
        return model_probs

    teams = list(model_probs.keys())

    def normalize(d):
        total = sum(d.values())
        return {k: v / total for k, v in d.items()} if total > 0 else d

    sq_prior = normalize(SQUAD_STRENGTH_2026)
    recent_form_raw = {
        t: PLAYOFF_RATE_3YR.get(t, 0) * 0.6 + (SEASON_2025_RANK_SCORE.get(t, 5) / 10) * 0.4
        for t in teams
    }
    recent_prior = normalize({t: max(v, 0.01) for t, v in recent_form_raw.items()})
    model_norm = normalize(model_probs)

    weights = {"squad": 0.35, "recent_form": 0.35, "model": 0.30}
    combined = {}
    for t in teams:
        combined[t] = (
            weights["squad"] * sq_prior.get(t, 0)
            + weights["recent_form"] * recent_prior.get(t, 0)
            + weights["model"] * model_norm.get(t, 0)
        )

    return normalize(combined)


def print_predictions(rankings: list):
    print("\n" + "=" * 65)
    print("         IPL 2026 WINNER PREDICTION RESULTS")
    print("  (Stacking Ensemble + Monte Carlo Simulation)")
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


def rank_predictions(combined_probs: dict) -> list:
    ranked = sorted(combined_probs.items(), key=lambda x: x[1], reverse=True)
    return [
        {
            "rank": i + 1,
            "team_id": t,
            "team_name": TEAMS.get(t, t),
            "win_probability": round(p * 100, 2),
        }
        for i, (t, p) in enumerate(ranked)
    ]


def predict_2026_winner(tournament: str = "ipl"):
    from src.models.ensemble_model import EnsembleModel

    paths = get_tournament_paths(tournament)
    matches_df = pd.read_csv(paths["features"].replace("features.csv", "matches_processed.csv"))

    model = EnsembleModel(save_dir=paths["models"])
    model.load()

    print(f"\nStarting Monte Carlo Simulation for {tournament.upper()} 2026...")
    model_probs, fixtures = monte_carlo_simulation(model, matches_df, tournament)

    print("Applying Bayesian update with current squad strength...")
    final_probs = bayesian_update(model_probs, tournament)

    rankings = rank_predictions(final_probs)
    return rankings, fixtures


def save_predictions(rankings: list, fixtures: list, tournament: str = "ipl"):
    paths = get_tournament_paths(tournament)
    out_dir = paths["results"]
    os.makedirs(out_dir, exist_ok=True)

    with open(os.path.join(out_dir, "prediction_2026.json"), "w") as f:
        json.dump(
            {
                "season": 2026,
                "tournament": tournament,
                "method": "Stacking Ensemble + Monte Carlo",
                "rankings": rankings,
            },
            f,
            indent=2,
        )

    pd.DataFrame(fixtures).to_csv(
        os.path.join(out_dir, f"{tournament}_2026_match_predictions.csv"), index=False
    )
    print(f"Predictions saved to {out_dir}")


if __name__ == "__main__":
    rankings, fixtures = predict_2026_winner("ipl")
    for r in rankings[:3]:
        print(f"#{r['rank']} {r['team_name']}: {r['win_probability']}%")
    save_predictions(rankings, fixtures, "ipl")
