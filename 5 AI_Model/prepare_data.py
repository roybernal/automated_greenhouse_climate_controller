import pandas as pd
from sklearn.preprocessing import StandardScaler

def clean_and_prepare_data(input_file, output_file):
    """
    Loads raw sensor data, cleans it, and engineers features
    for a time-series prediction model.
    """
    print(f"Loading raw data from {input_file}...")
    
    # 1. Load the dataset
    try:
        df = pd.read_csv(input_file)
    except FileNotFoundError:
        print(f"Error: Input file '{input_file}' not found.")
        return

    # 2. Basic Cleaning
    df = df.dropna(subset=['temperature', 'humidity', 'light_received'])
    df['timestamp'] = pd.to_datetime(df['timestamp'], unit='ms')
    df = df.set_index('timestamp')
    df = df.sort_index()
    df = df.drop_duplicates()
    
    print("Cleaning complete. Starting feature engineering...")

    # 3. Feature Engineering (Preparation)
    
    # MODIFICADO: Ya no creamos 'hour_of_day'
    
    # Create "lag features" - what were the values in the past?
    df['temp_lag_1'] = df['temperature'].shift(1) # Temp 15 mins ago
    df['hum_lag_1'] = df['humidity'].shift(1)     # Hum 15 mins ago
    df['light_lag_1'] = df['light_received'].shift(1) # Light 15 mins ago

    # Create the target variable (what we want to predict)
    df['temp_target'] = df['temperature'].shift(-1)

    # 4. Final Cleanup
    df = df.dropna()

    if df.empty:
        print("Error: Not enough data to create features. Try exporting a larger dataset.")
        return

    print("Data preparation complete.")
    
    # 5. Save the prepared data
    df.to_csv(output_file)
    print(f"Successfully cleaned and prepared data. Saved to {output_file}")
    print("\nPrepared Data Head:")
    print(df.head())


# --- Run the function ---
if __name__ == "__main__":
    INPUT_CSV = 'sensor_logs.csv' 
    OUTPUT_CSV = 'sensor_data_cleaned.csv' 
    
    clean_and_prepare_data(INPUT_CSV, OUTPUT_CSV)