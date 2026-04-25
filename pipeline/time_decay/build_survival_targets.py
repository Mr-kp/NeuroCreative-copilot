import os
import pandas as pd

def main():
    os.makedirs("./pipeline_artifacts", exist_ok=True)
    
    data_path = "./Smadex_Creative_Intelligence_Dataset_FULL/creative_daily_country_os_stats.csv"
    if not os.path.exists(data_path):
        data_path = "./neuralad/Smadex_Creative_Intelligence_Dataset_FULL/creative_daily_country_os_stats.csv"
    print(f"Loading {data_path}...")
    try:
        df = pd.read_csv(data_path)
    except Exception as e:
        print(f"Failed to load dataset: {e}")
        return
        
    print("Aggregating daily performance globally per creative...")
    # Aggregate daily performance globally per creative
    daily_stats = df.groupby(['creative_id', 'date']).agg({
        'impressions': 'sum',
        'clicks': 'sum',
        'spend_usd': 'sum'
    }).reset_index()
    
    # Calculate raw CTR
    daily_stats['CTR'] = daily_stats['clicks'] / daily_stats['impressions']
    daily_stats['CTR'] = daily_stats['CTR'].fillna(0)
    
    # Sort by date for EMA calculation
    daily_stats['date'] = pd.to_datetime(daily_stats['date'])
    daily_stats = daily_stats.sort_values(by=['creative_id', 'date'])
    
    print("Applying 3-day EMA to CTR...")
    # Apply 3-day EMA
    daily_stats['smoothed_CTR'] = daily_stats.groupby('creative_id')['CTR'].transform(
        lambda x: x.ewm(span=3, adjust=False).mean()
    )
    
    # Add day index from campaign start
    daily_stats['day_index'] = daily_stats.groupby('creative_id').cumcount() + 1
    
    print("Defining fatigue events and calculating survival variables...")
    survival_data = []
    
    for creative_id, group in daily_stats.groupby('creative_id'):
        group = group.sort_values('date')
        
        peak_ctr = 0
        is_dead = 0
        duration = group['day_index'].max()
        consecutive_drops = 0
        
        for idx, row in group.iterrows():
            current_ctr = row['smoothed_CTR']
            peak_ctr = max(peak_ctr, current_ctr)
            
            # Fatigue event: smoothed CTR drops below 60% of peak_ctr for 3 consecutive days
            if peak_ctr > 0 and current_ctr < 0.60 * peak_ctr:
                consecutive_drops += 1
                if consecutive_drops >= 3:
                    is_dead = 1
                    duration = row['day_index']
                    break
            else:
                consecutive_drops = 0
                
        survival_data.append({
            'creative_id': creative_id,
            'duration': duration,
            'event': is_dead,
            'peak_ctr': peak_ctr
        })
        
    targets_df = pd.DataFrame(survival_data)
    out_path = "./pipeline_artifacts/survival_targets.csv"
    targets_df.to_csv(out_path, index=False)
    print(f"Exported survival targets to {out_path}")

if __name__ == "__main__":
    main()
