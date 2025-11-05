import json
import pandas as pd
import os

# --- Configuration ---
# The name of the file you downloaded from Firebase
INPUT_JSON_FILE = 'agcroller-default-rtdb-export.json' 

# The name of the new CSV file we will create
OUTPUT_CSV_FILE = 'sensor_logs.csv'

# The key in your JSON that holds the historical data
LOGS_KEY = 'sensor_logs' 
# ---------------------

def convert_firebase_export_to_csv(json_file, csv_file, logs_key):
    """
    Extracts the nested sensor_logs from a full Firebase export
    and converts them into a clean CSV file.
    """
    print(f"Loading data from '{json_file}'...")
    
    # Check if the input file exists
    if not os.path.exists(json_file):
        print(f"Error: File not found: '{json_file}'")
        print("Please make sure the JSON file is in the same directory as this script.")
        return

    # Open and load the JSON file
    with open(json_file, 'r', encoding='utf-8') as f:
        data = json.load(f)

    # Check if the main 'sensor_logs' key exists
    if logs_key not in data:
        print(f"Error: Could not find the key '{logs_key}' in your JSON file.")
        return
        
    # Access the nested log data
    logs_data = data[logs_key]

    # pandas.DataFrame.from_dict() is the perfect tool for this.
    # It automatically converts the Firebase keys (e.g., "-Nq...") into the rows of our table.
    print("Converting data...")
    df = pd.DataFrame.from_dict(logs_data, orient='index')

    # Ensure the 'timestamp' column is first, followed by others
    cols = ['timestamp', 'temperature', 'humidity', 'light_received']
    # Reorder columns and drop any extras we don't need
    df = df[cols] 

    # Sort the data by timestamp just to be safe
    df = df.sort_values(by='timestamp')

    # Save the clean data to a new CSV file
    df.to_csv(csv_file, index=False)
    
    print(f"Success! Converted {len(df)} rows.")
    print(f"Clean data saved to '{csv_file}'.")

# --- Run the conversion ---
if __name__ == "__main__":
    convert_firebase_export_to_csv(INPUT_JSON_FILE, OUTPUT_CSV_FILE, LOGS_KEY)