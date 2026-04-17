# IPL 2026 Winner Prediction

A complete machine learning pipeline to predict IPL 2026 outcomes using real ball-by-ball IPL data.

The project supports two prediction modes:

- Tournament winner probabilities (all 10 teams)
- Match-by-match fixture predictions for the full 2026 schedule

## IPL 2026 Prediction Snapshot

### IPL 2026 Winner Ranking

| Rank | Team                        | Win Probability |
| ---- | --------------------------- | --------------- |
| 1    | Mumbai Indians              | 12.61%          |
| 2    | Gujarat Titans              | 12.24%          |
| 3    | Royal Challengers Bengaluru | 12.20%          |
| 4    | Punjab Kings                | 10.58%          |
| 5    | Sunrisers Hyderabad         | 9.78%           |
| 6    | Lucknow Super Giants        | 9.58%           |
| 7    | Kolkata Knight Riders       | 8.67%           |
| 8    | Rajasthan Royals            | 8.51%           |
| 9    | Chennai Super Kings         | 8.29%           |
| 10   | Delhi Capitals              | 7.55%           |

Probabilities now incorporate bottom-up team strength aggregated from each projected 2026 XI's per-player career form. See `data/rosters_2026.json` and `src/features/player_form.py`.

Source: `outputs/results/ipl/prediction_2026.json`

### Fixture-level Summary (2026 Schedule)

Predicted league-stage wins from `outputs/results/ipl/ipl_2026_match_predictions.csv`:

- GT: 9
- PBKS: 8
- MI: 7
- DC: 6
- LSG: 5
- SRH: 4
- RR: 3
- CSK: 2
- KKR: 1

## Model Performance

| Model          | CV Accuracy | Test Accuracy | Test AUC |
| -------------- | ----------- | ------------- | -------- |
| Random Forest  | 0.6350      | 0.6711        | 0.6995   |
| XGBoost        | 0.6311      | 0.6534        | 0.7111   |
| LightGBM       | 0.6477      | 0.6600        | 0.7138   |
| Neural Network | 0.6080      | 0.6049        | 0.6141   |
| ExtraTrees     | 0.6444      | 0.6512        | 0.7083   |
| Ensemble       | -           | 0.6490        | 0.7054   |

Source: `outputs/results/model_results.json`

## Data

Primary training source:

- `data/raw_datasets/ipl/` (Cricsheet JSON files)
- `data/raw_datasets/icc_men/`
- `data/raw_datasets/icc_women/`

Generated pipeline artifacts:

- `data/raw/matches.csv`
- `data/raw/player_stats.csv`
- `data/raw/teams.json`
- `data/processed/matches_processed.csv`
- `data/processed/features.csv`
- `data/db/ipl.db`

2026 fixture input:

- (Generated dynamically) Legacy input at `data/mock/ipl-2026-UTC.csv`

2026 priors and rosters:

- `data/priors_2026.json` — `playoff_rate_3yr` and `season_2025_rank_score` auto-computed from Cricsheet; `squad_strength_2026` is hand-curated.
- `data/rosters_2026.json` — projected 2026 XI per team (top-15 by 2025 Cricsheet appearances, hand-editable post-auction).

## Project Structure

```
IPL-Winner-Prediction-2026/
├── config.py
├── main.py
├── server.py
├── data/
│   ├── raw_datasets/ (Cricsheet JSONs)
│   │   ├── ipl
│   │   ├── icc_men
│   │   └── icc_women
│   ├── mock/         (Dummy datasets and legacy fixtures)
│   ├── raw/          (Parsed raw stats CSVs)
│   ├── processed/    (Engineered feature CSVs)
│   └── db/           (SQLite caching)
├── src/
│   ├── data/
│   ├── features/
│   ├── models/
│   └── prediction/
├── dashboard/        (UI Frontend)
├── scripts/          (CRON jobs and rebuilds)
├── outputs/
│   ├── models/
│   └── results/
├── notebooks/
└── requirements.txt
```

## Setup

```bash
pip install -r requirements.txt
```

## Run Pipeline

```bash
python main.py --mode setup
python main.py --mode train
python main.py --mode predict
python main.py --mode visualize
```

Or run all in one command:

```bash
python main.py --mode all
```

## Generate Match-by-Match Predictions (2026 schedule)

Input file must exist at `data/mock/ipl-2026-UTC.csv`.

Output file:

- `outputs/results/ipl/ipl_2026_match_predictions.csv`

## Output Visualizations

Generated in `outputs/results/ipl/`:

- `win_probability.png`
- `model_comparison.png`
- `historical_win_rates.png`

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
