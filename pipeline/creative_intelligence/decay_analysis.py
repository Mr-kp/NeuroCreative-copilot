import os
import warnings
warnings.filterwarnings("ignore")

import numpy as np
import pandas as pd
from scipy.optimize import curve_fit
from sklearn.linear_model import LinearRegression
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
CHARTS_DIR = os.path.join(BASE_DIR, "charts")

fatigue_path = os.path.join(DATA_DIR, "daily_fatigue_table.csv")
master_path = os.path.join(DATA_DIR, "master_creatives.csv")

fatigue_df = pd.read_csv(fatigue_path)
master_df = pd.read_csv(master_path)

creative_groups = fatigue_df.groupby("creative_id")

results = []
example_fatigued = None
example_top = None
example_fatigued_df = None
example_top_df = None

for idx, (creative_id, grp) in enumerate(creative_groups):
    if (idx + 1) % 100 == 0:
        print(f"Processed {idx + 1} creatives...")

    grp = grp.sort_values("days_since_launch").reset_index(drop=True)
    n = len(grp)

    row = {
        "creative_id": creative_id,
        "data_points": n,
        "max_ctr": grp["ctr"].max(),
        "mean_ctr": grp["ctr"].mean(),
        "peak_day": int(grp.loc[grp["ctr"].idxmax(), "days_since_launch"]),
        "decay_rate_prophet": None,
        "forecast_ctr_14d": None,
        "half_life_days": None,
        "method": "too_short",
        "exp_lambda": None,
        "exp_half_life": None,
        "sse_exp": None,
        "sse_power": None,
        "best_parametric": None,
    }

    if n < 2:
        results.append(row)
        continue

    if n >= 3:
        t = grp["days_since_launch"].values.astype(float)
        y = grp["ctr"].values.astype(float)
        peak_ctr = y.max()

        def exp_func(t, a, lam):
            return a * np.exp(-lam * t)

        def power_func(t, a, alpha):
            return a * (t + 1) ** (-alpha)

        try:
            popt_exp, _ = curve_fit(exp_func, t, y, p0=[peak_ctr, 0.05], maxfev=5000)
            y_pred_exp = exp_func(t, *popt_exp)
            row["sse_exp"] = float(np.sum((y - y_pred_exp) ** 2))
            row["exp_lambda"] = float(popt_exp[1])
            row["exp_half_life"] = float(np.log(2) / popt_exp[1]) if popt_exp[1] > 0 else None
        except Exception:
            row["sse_exp"] = None
            row["exp_lambda"] = None
            row["exp_half_life"] = None

        try:
            popt_pow, _ = curve_fit(power_func, t, y, p0=[peak_ctr, 0.5], maxfev=5000)
            y_pred_pow = power_func(t, *popt_pow)
            row["sse_power"] = float(np.sum((y - y_pred_pow) ** 2))
        except Exception:
            row["sse_power"] = None

        if row["sse_exp"] is not None and row["sse_power"] is not None:
            row["best_parametric"] = "exponential" if row["sse_exp"] <= row["sse_power"] else "power_law"
        elif row["sse_exp"] is not None:
            row["best_parametric"] = "exponential"
        elif row["sse_power"] is not None:
            row["best_parametric"] = "power_law"

    if n >= 7:
        from prophet import Prophet

        prophet_ok = False
        try:
            prophet_df = grp[["date", "ctr"]].copy()
            prophet_df = prophet_df.rename(columns={"date": "ds", "ctr": "y"})
            prophet_df["ds"] = pd.to_datetime(prophet_df["ds"])
            prophet_df["y"] = prophet_df["y"].clip(lower=1e-6)

            m = Prophet(
                changepoint_prior_scale=0.1,
                seasonality_mode="multiplicative",
                yearly_seasonality=False,
                weekly_seasonality=False,
                daily_seasonality=False,
                n_changepoints=min(5, n // 5),
            )
            m.fit(prophet_df)

            future = m.make_future_dataframe(periods=14)
            forecast = m.predict(future)

            forecast_actual = forecast[forecast["ds"].isin(prophet_df["ds"])].copy()
            forecast_actual = forecast_actual.sort_values("ds").reset_index(drop=True)

            last7 = forecast_actual.tail(7)
            if len(last7) >= 2:
                x_lr = np.arange(len(last7)).reshape(-1, 1)
                y_lr = last7["trend"].values.reshape(-1, 1)
                reg = LinearRegression().fit(x_lr, y_lr)
                row["decay_rate_prophet"] = float(reg.coef_[0][0])
            else:
                row["decay_rate_prophet"] = None

            last_forecast_date = prophet_df["ds"].max()
            future_14 = forecast[forecast["ds"] == last_forecast_date + pd.Timedelta(days=14)]
            if len(future_14) > 0:
                row["forecast_ctr_14d"] = float(future_14["yhat"].values[0])
            else:
                row["forecast_ctr_14d"] = None

            peak_trend = forecast_actual["trend"].max()
            half_val = peak_trend * 0.5
            below_half = forecast_actual[forecast_actual["trend"] < half_val]
            if len(below_half) > 0:
                first_below = below_half.iloc[0]
                first_date = pd.to_datetime(first_below["ds"])
                peak_date_idx = forecast_actual["trend"].idxmax()
                peak_date = pd.to_datetime(forecast_actual.loc[peak_date_idx, "ds"])
                row["half_life_days"] = float((first_date - peak_date).days)
            else:
                row["half_life_days"] = None

            row["method"] = "prophet"
            prophet_ok = True

            status_row = master_df[master_df["creative_id"] == creative_id]
            if len(status_row) > 0:
                status = status_row.iloc[0]["creative_status"]
                if status == "fatigued" and example_fatigued is None:
                    example_fatigued = creative_id
                    example_fatigued_df = (grp.copy(), forecast.copy())
                if status == "top_performer" and example_top is None:
                    example_top = creative_id
                    example_top_df = (grp.copy(), forecast.copy())

        except Exception:
            row["decay_rate_prophet"] = None
            row["forecast_ctr_14d"] = None
            row["half_life_days"] = None

        if not prophet_ok and n >= 3:
            row["method"] = "exp_decay"
    elif n >= 3:
        row["method"] = "exp_decay"

    results.append(row)

print(f"Processed {len(results)} creatives total.")

features_df = pd.DataFrame(results)
features_df.to_csv(os.path.join(DATA_DIR, "decay_features.csv"), index=False)

fig, axes = plt.subplots(1, 2, figsize=(14, 5))

def plot_example(ax, grp_data, fc_data, color, title):
    ax.scatter(grp_data["days_since_launch"], grp_data["ctr"], color=color, s=20, label="Actual CTR", zorder=3)
    date_to_day = dict(zip(grp_data["date"].values, grp_data["days_since_launch"].values))
    fc_dates = pd.to_datetime(fc_data["ds"]).dt.strftime("%Y-%m-%d")
    mask = fc_dates.isin(date_to_day)
    fc_actual = fc_data[mask].copy()
    fc_actual["day"] = fc_actual["ds"].map(lambda d: date_to_day.get(pd.Timestamp(d).strftime("%Y-%m-%d")))
    fc_actual = fc_actual.dropna(subset=["day"]).sort_values("day")
    ax.plot(fc_actual["day"].values, fc_actual["trend"].values, color="red", linewidth=2, label="Prophet trend")
    ax.set_title(title)
    ax.set_xlabel("Days Since Launch")
    ax.set_ylabel("CTR")
    ax.legend()

if example_top_df is not None:
    grp_top, fc_top = example_top_df
    plot_example(axes[0], grp_top, fc_top, "blue", f"Top Performer (ID: {example_top})")
else:
    axes[0].set_title("No top_performer example found")

if example_fatigued_df is not None:
    grp_fat, fc_fat = example_fatigued_df
    plot_example(axes[1], grp_fat, fc_fat, "orange", f"Fatigued (ID: {example_fatigued})")
else:
    axes[1].set_title("No fatigued example found")

plt.tight_layout()
plt.savefig(os.path.join(CHARTS_DIR, "decay_examples.png"), dpi=150)
plt.close()

method_counts = features_df["method"].value_counts()
fig2, ax2 = plt.subplots(figsize=(8, 5))
method_counts.plot.bar(ax=ax2, color=["#4C72B0", "#DD8452", "#55A868"])
ax2.set_title("Decay Method Distribution")
ax2.set_xlabel("Method")
ax2.set_ylabel("Number of Creatives")
ax2.set_xticklabels(ax2.get_xticklabels(), rotation=0)
plt.tight_layout()
plt.savefig(os.path.join(CHARTS_DIR, "decay_method_distribution.png"), dpi=150)
plt.close()

print("\n=== Decay Analysis Summary ===")
print("\nMethod distribution:")
print(method_counts.to_string())

merged = features_df.merge(master_df[["creative_id", "creative_status"]], on="creative_id", how="left")

print("\nMean decay_rate_prophet by creative_status:")
prophet_only = merged[merged["method"] == "prophet"]
if len(prophet_only) > 0:
    print(prophet_only.groupby("creative_status")["decay_rate_prophet"].mean().to_string())
else:
    print("No prophet-fitted creatives.")

print("\nMean half_life_days by creative_status:")
if len(prophet_only) > 0:
    print(prophet_only.groupby("creative_status")["half_life_days"].mean().to_string())
else:
    print("No prophet-fitted creatives.")

pct_negative = (prophet_only["decay_rate_prophet"] < 0).mean() * 100 if len(prophet_only) > 0 else 0
print(f"\nPercentage of prophet creatives with negative decay_rate: {pct_negative:.1f}%")
print(f"\nSaved decay_features.csv ({len(features_df)} rows)")
print("Saved charts/decay_examples.png")
print("Saved charts/decay_method_distribution.png")
