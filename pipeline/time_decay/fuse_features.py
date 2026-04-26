import os
import pandas as pd

def main():
    os.makedirs("./pipeline_artifacts", exist_ok=True)
    
    print("Loading data files...")
    survival_path = "./pipeline_artifacts/survival_targets.csv"
    neural_path = "./pipeline_artifacts/neural_cache.csv"
    summary_path = "./Smadex_Creative_Intelligence_Dataset_FULL/creative_summary.csv"
    if not os.path.exists(summary_path):
        summary_path = "./neuralad/Smadex_Creative_Intelligence_Dataset_FULL/creative_summary.csv"
    
    try:
        survival_df = pd.read_csv(survival_path)
        neural_df = pd.read_csv(neural_path)
        summary_df = pd.read_csv(summary_path)
    except Exception as e:
        print(f"Error loading files: {e}")
        return
        
    print("Joining datasets...")
    # Convert creative_id to str in all datasets to ensure proper joining if some parsed as int
    survival_df['creative_id'] = survival_df['creative_id'].astype(str)
    neural_df['creative_id'] = neural_df['creative_id'].astype(str)
    summary_df['creative_id'] = summary_df['creative_id'].astype(str)
    
    abt = survival_df.merge(neural_df, on='creative_id', how='left')
    abt = abt.merge(summary_df, on='creative_id', how='left')
    
    # Impute missing neural scores
    neural_cols = ['attention_score', 'reward_score', 'memory_score', 'emotion_score', 'visual_load_score']
    for col in neural_cols:
        if col in abt.columns:
            median_val = abt[col].median()
            abt[col] = abt[col].fillna(median_val)
            
    # Apply One-Hot Encoding
    # Assuming categorical variables like 'ad_format' and 'os' might exist in summary_df
    # Let's dynamically find object columns that could be categorically encoded
    categorical_cols = ['ad_format', 'os', 'category'] # Add more if needed
    existing_cat_cols = [c for c in categorical_cols if c in abt.columns]
    
    if existing_cat_cols:
        print(f"Applying One-Hot Encoding to: {existing_cat_cols}...")
        abt = pd.get_dummies(abt, columns=existing_cat_cols, dummy_na=True)
    
    # Drop other non-numeric columns except creative_id
    cols_to_keep = ['creative_id'] + [c for c in abt.columns if c != 'creative_id' and pd.api.types.is_numeric_dtype(abt[c])]
    abt = abt[cols_to_keep]
    
    out_path = "./pipeline_artifacts/fused_abt.csv"
    abt.to_csv(out_path, index=False)
    print(f"Exported fused Analytical Base Table to {out_path}")

if __name__ == "__main__":
    main()
