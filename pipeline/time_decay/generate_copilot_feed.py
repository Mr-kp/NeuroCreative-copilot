import os
import pandas as pd

def main():
    os.makedirs("./pipeline_artifacts", exist_ok=True)
    
    print("Loading predictions and fused ABT...")
    try:
        preds = pd.read_csv("./pipeline_artifacts/model_predictions.csv")
        abt = pd.read_csv("./pipeline_artifacts/fused_abt.csv")
    except Exception as e:
        print(f"Error loading files: {e}")
        return
        
    # Convert creative_id to strings to ensure matching
    preds['creative_id'] = preds['creative_id'].astype(str)
    abt['creative_id'] = abt['creative_id'].astype(str)
    
    # Merge predictions with specific neural scores from ABT
    # We only need attention_score and visual_load_score for the final output
    cols_to_fetch = ['creative_id']
    if 'attention_score' in abt.columns:
        cols_to_fetch.append('attention_score')
    if 'visual_load_score' in abt.columns:
        cols_to_fetch.append('visual_load_score')
        
    df = preds.merge(abt[cols_to_fetch], on='creative_id', how='left')
    
    # Calculate predicted remaining lifespan
    df['remaining_lifespan'] = df['predicted_lifespan_days'] - df['duration']
    
    print("Applying Copilot decision logic...")
    def tag_decision(row):
        rem = row['remaining_lifespan']
        hs = row['health_score']
        
        if rem < 2 or hs < 40:
            return "Pause"
        elif 2 <= rem <= 5 or 40 <= hs <= 70:
            return "Monitor"
        else:
            return "Scale"
            
    df['decision_tag'] = df.apply(tag_decision, axis=1)
    
    # Prepare the final output file columns
    final_cols = ['creative_id', 'predicted_lifespan_days', 'health_score', 'decision_tag']
    if 'attention_score' in df.columns:
        final_cols.append('attention_score')
    else:
        df['attention_score'] = None
        final_cols.append('attention_score')
        
    if 'visual_load_score' in df.columns:
        final_cols.append('visual_load_score')
    else:
        df['visual_load_score'] = None
        final_cols.append('visual_load_score')
        
    out_df = df[final_cols]
    
    out_path = "./pipeline_artifacts/copilot_action_feed.csv"
    out_df.to_csv(out_path, index=False)
    print(f"Exported Copilot action feed to {out_path}")

if __name__ == "__main__":
    main()
