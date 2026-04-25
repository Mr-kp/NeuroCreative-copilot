# NeuroCreative Time-Decay Pipeline Documentation

## 1. Explanation for the Average Person

Imagine you are running a digital advertising campaign. Usually, you only know if an ad is "good" or "bad" after spending thousands of dollars to see if people actually click on it. If the ad is bad, you've already wasted money. Furthermore, over time, even a great ad gets boring to people who see it every day—a phenomenon known as **"ad fatigue."**

What we've built is an intelligent assistant (a Copilot) that acts like a virtual focus group and a fortune teller combined:

1. **The Virtual Focus Group (TRIBE v2):** Before an ad is scaled up, we use an advanced AI model (originally developed by Meta to predict brain activity) to "look" at the ad image. It calculates how a human brain would react, scoring the ad on metrics like **Attention**, **Emotion**, **Memory**, and **Visual Load** (how cluttered or confusing it is).
2. **The Fortune Teller (Survival AI):** We take historical data from past ads and teach a machine learning algorithm to understand the relationship between those "Brain Scores" and exactly *when* an ad usually gets boring and stops getting clicks. 
3. **The Copilot Decision Engine:** Finally, the system looks at active ads running right now. Based on the brain scores and how many days the ad has been running, it calculates a "Health Score" and automatically tags ads with an action: **Scale** (spend more money), **Monitor** (keep an eye on it), or **Pause** (stop the ad because our algorithm predicts it will die in the next 48 hours). 

This system prevents budget from being wasted on fatigued ads and automatically scales winning ads, saving time and money for media buyers.

---

## 2. Technical Architecture & Pipeline Phases

The pipeline is executed in a sequential batch process, designed to run in a GPU-enabled environment (like Google Colab).

* **Phase 2: TRIBE v2 Batch Inference** (`run_tribe_batch.py`)
  Passes all static `.png` creative assets through the multimodal `facebook/tribev2` model to extract neurological scalar features. Audio and text extraction are bypassed to optimize speed for static images.
* **Phase 3: Survival Target Definition** (`build_survival_targets.py`)
  Ingests daily impression/click logs. Calculates a 3-day Exponential Moving Average (EMA) of the Click-Through Rate (CTR). Right-censored "fatigue events" are triggered when the smoothed CTR drops below 60% of its cumulative peak for 3 consecutive days.
* **Phase 4: Feature Fusion** (`fuse_features.py`)
  Performs Left Joins to consolidate survival targets, neural cache data, and static categorical metadata into a single Analytical Base Table (ABT). Missing values are imputed via median, and categorical columns are One-Hot Encoded.
* **Phase 5: Accelerated Failure Time (AFT) Modeling** (`train_aft_model.py`)
  Transforms the ABT into right-censored `xgb.DMatrix` structures. Trains an XGBoost algorithm using the `survival:aft` objective function to predict maximum lifespan and compute a current Health Score ratio.
* **Phase 6: Copilot Output Generation** (`generate_copilot_feed.py`)
  Applies deterministic business logic (e.g., Remaining Lifespan < 2 days $\rightarrow$ `Pause`) to the predictions and exports a streamlined feed for the backend API.

---

## 3. Output Files & Project Mapping

All processed data is deposited into the `./pipeline_artifacts/` directory. Here is how they map to the broader project architecture:

### `neural_cache.csv`
* **What it is:** The raw output from the TRIBE v2 model, containing neurological scalar scores for every creative.
* **Mapping to Project:** When your live FastAPI backend or front-end Copilot needs to display the "Brain Features" of a historical creative, it queries this cache instantly instead of taking 10 seconds to run the image through the GPU again in real-time.

### `survival_targets.csv`
* **What it is:** The statistical "ground truth" of ad performance. It contains the `creative_id`, how many days it ran (`duration`), and a binary flag (`event`) indicating if the ad died/fatigued.
* **Mapping to Project:** This is a purely intermediate file. It acts as the mathematical target variable ($Y$) that the predictive algorithm needs to learn from.

### `fused_abt.csv` (Analytical Base Table)
* **What it is:** The master data matrix. It merges the $Y$ targets, the visual features, and the static metadata (ad format, OS) into one giant table with One-Hot Encoding applied.
* **Mapping to Project:** This is the exact training set for the XGBoost model. In a production system, this table structure is what your data engineering pipeline must recreate in real-time for continuous learning.

### `model_predictions.csv`
* **What it is:** The raw mathematical output of the XGBoost AFT model. It contains the expected total days an ad will survive and its calculated `health_score`.
* **Mapping to Project:** This acts as the "Brain" of the logic engine. If a creative has a 95% Health Score and is predicted to last 30 days, the system identifies it statistically as a high performer.

### `copilot_action_feed.csv`
* **What it is:** The final, actionable deliverable of the pipeline. It merges predictions, health scores, and key visual metrics, assigning a concrete `decision_tag` (**Scale**, **Monitor**, or **Pause**).
* **Mapping to Project:** **This is your Copilot's database.** When a media buyer opens the frontend dashboard, this file tells the UI exactly what to display. In an autonomous setup, a script reads this file and sends API calls directly to an Ad Server (like Google/Facebook Ads) to pause campaigns automatically.
