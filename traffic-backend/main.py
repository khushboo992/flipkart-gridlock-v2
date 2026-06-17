# traffic-backend/main.py
import os
import pandas as pd

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# 1. Target the Excel file directly (checking both common extensions)
excel_path_xlsx = os.path.join(BASE_DIR, "bengaluru_traffic_violations.xlsx")
excel_path_xls = os.path.join(BASE_DIR, "bengaluru_traffic_violations.xls")

excel_path = excel_path_xlsx if os.path.exists(excel_path_xlsx) else excel_path_xls

print("🔍 Reading Excel file structure...")

try:
    # Read just the top rows of the Excel sheet safely
    df = pd.read_excel(excel_path, nrows=5)
    print("\n⭐⭐ YOUR EXCEL DATASET COLUMNS ARE: ⭐⭐")
    print(list(df.columns))
    print("---------------------------------------")
except Exception as e:
    print(f"❌ Error reading Excel file: {e}")
    print("\n👉 Quick Check: Make sure your file inside the backend folder is named exactly 'bengaluru_traffic_violations' (with your Excel extension).")

input("\nPress Enter to close...")