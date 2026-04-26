import os
import pandas as pd
import xgboost as xgb
import numpy as np

def main():
    os.makedirs("./pipeline_artifacts", exist_ok=True)
    
    data_path = "./pipeline_artifacts/fused_abt.csv"
    print(f"Loading fused ABT from {data_path}...")
    try:
        df = pd.read_csv(data_path)
    except Exception as e:
        print(f"Error loading {data_path}: {e}")
        return
        
    # Feature extraction
    # We drop identifier, target variable, and any other target leaks
    drop_cols = ['creative_id', 'duration', 'event', 'peak_ctr', 'date']
    X = df.drop(columns=[c for c in drop_cols if c in df.columns])
    
    # Ensure all columns in X are numeric
    X = X.select_dtypes(include=[np.number, bool])
    
    # Construct y_lower and y_upper for XGBoost AFT model
    # For AFT, y_lower is the observed duration
    # y_upper is the observed duration if event == 1, else +inf if right-censored (event == 0)
    y_lower = df['duration'].values
    y_upper = np.where(df['event'] == 1, df['duration'].values, np.inf)
    
    print("Preparing XGBoost DMatrix structures for right-censored data...")
    dtrain = xgb.DMatrix(X)
    dtrain.set_float_info('label_lower_bound', y_lower)
    dtrain.set_float_info('label_upper_bound', y_upper)
    
    # Define XGBoost AFT parameters
    params = {
        'objective': 'survival:aft',
        'eval_metric': 'aft-nloglik',
        'aft_loss_distribution': 'normal', # or 'extreme'
        'aft_loss_distribution_scale': 1.20,
        'tree_method': 'hist',
        'learning_rate': 0.05,
        'max_depth': 6,
        'min_child_weight': 1,
        'subsample': 0.8
    }
    
    print("Training XGBoost AFT model...")
    bst = xgb.train(params, dtrain, num_boost_round=100)
    
    print("Predicting expected lifespans...")
    # Predicting returns the expected lifespan duration
    predicted_duration = bst.predict(dtrain)
    
    # Calculate Health Score
    df['predicted_lifespan_days'] = predicted_duration
    # Ratio of current running days to predicted maximum lifespan
    df['health_score'] = (df['duration'] / df['predicted_lifespan_days']) * 100
    df['health_score'] = df['health_score'].clip(0, 100) # Ensure it doesn't exceed 100%
    
    # Export model predictions and feature importances
    out_df = df[['creative_id', 'predicted_lifespan_days', 'health_score', 'duration', 'event']].copy()
    
    out_path = "./pipeline_artifacts/model_predictions.csv"
    out_df.to_csv(out_path, index=False)
    print(f"Exported model predictions to {out_path}")

if __name__ == "__main__":
    main()
