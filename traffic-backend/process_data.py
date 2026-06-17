# C:\Users\lenovo\flipkart-gridlock-v2\traffic-backend\process_data.py
import pandas as pd
import numpy as np
import os

def run_traffic_analytics(file_path):
    try:
        df = pd.read_csv(file_path)
        df.columns = [col.strip().lower() for col in df.columns]

        val_col = next((c for c in df.columns if 'validation' in c or 'status' in c), None)
        viol_col = next((c for c in df.columns if 'violation' in c or 'type' in c), None)
        loc_col = next((c for c in df.columns if 'location' in c or 'place' in c), None)
        veh_col = next((c for c in df.columns if 'vehicle' in c), None)
        time_col = next((c for c in df.columns if 'timestamp' in c or 'time' in c or 'date' in c), None)
        lat_col = next((c for c in df.columns if 'lat' in c), None)
        lng_col = next((c for c in df.columns if 'lng' in c or 'lon' in c), None)

        if not loc_col or not viol_col:
            return {"hotspots": [], "hourlyTrends": []}

        condition = df[viol_col].str.contains('NO PARK', na=False, case=False)
        if val_col:
            condition = condition & (df[val_col].str.lower() == 'approved')
            
        df_clean = df[condition].copy()
        if df_clean.empty:
            return {"hotspots": [], "hourlyTrends": []}

        if time_col:
            df_clean['hour'] = pd.to_datetime(df_clean[time_col], errors='coerce').dt.hour
        else:
            df_clean['hour'] = 12
        df_clean['hour'] = df_clean['hour'].fillna(12).astype(int)

        weight_mapping = {
            'SCOOTER': 1.0, 'MOTOR CYCLE': 1.0, 'TWO WHEELER': 1.0,
            'CAR': 2.5, 'PASSENGER': 2.5, 'THREE WHEELER': 1.5,
            'TANKER': 4.5, 'BUS': 4.5, 'TRUCK': 4.5
        }
        df_clean['weight'] = df_clean[veh_col].str.upper().map(weight_mapping).fillna(1.5) if veh_col else 1.5

        hotspots_df = df_clean.groupby(loc_col).agg(
            total_violations=(loc_col, 'count'),
            calculated_pci=('weight', 'sum'),
            lat=(lat_col, 'mean') if lat_col else lambda x: 12.9716,
            lng=(lng_col, 'mean') if lng_col else lambda x: 77.5946
        ).reset_index()

        max_pci = hotspots_df['calculated_pci'].max() if not hotspots_df.empty else 1
        hotspots_df['congestionIndex'] = ((hotspots_df['calculated_pci'] / max_pci) * 100).round(1)
        hotspots_df = hotspots_df.sort_values(by='congestionIndex', ascending=False).head(10)
        hotspots_df.columns = ['location', 'total_violations', 'calculated_pci', 'lat', 'lng', 'congestionIndex']

        hourly_df = df_clean.groupby('hour').size().reset_index(name='violationsCount')
        all_hours = pd.DataFrame({'hour': range(0, 24)})
        hourly_df = pd.merge(all_hours, hourly_df, on='hour', how='left').fillna(0)
        hourly_df['violationsCount'] = hourly_df['violationsCount'].astype(int)

        return {
            "hotspots": hotspots_df.to_dict(orient='records'),
            "hourlyTrends": hourly_df.to_dict(orient='records')
        }
    except Exception as e:
        print(f"Error compiling backend data pipeline: {e}")
        return {"hotspots": [], "hourlyTrends": []}