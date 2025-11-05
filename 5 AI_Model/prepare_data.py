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
    
    # Drop any rows where sensor readings are missing (NaN)
    df = df.dropna(subset=['temperature', 'humidity', 'light_received'])

    # Convert timestamp to a usable datetime object
    # We assume the timestamp is in milliseconds (common from Firebase/JS)
    df['timestamp'] = pd.to_datetime(df['timestamp'], unit='ms')
    
    # Set the timestamp as the index
    df = df.set_index('timestamp')
    
    # Sort the data just in case it's out of order
    df = df.sort_index()
    
    # Remove any exact duplicate rows
    df = df.drop_duplicates()
    
    print("Cleaning complete. Starting feature engineering...")

    # 3. Feature Engineering (Preparation)
    # The goal is to predict the temperature for the *next* time step.

    # Create time-based features
    # The hour is the most important predictor of temperature
    df['hour_of_day'] = df.index.hour
    
    # Create "lag features" - what were the values in the past?
    # This assumes your data is logged every ~15 minutes.
    # If your log is faster (e.g., every 5 min), you might use lags of 1, 2, 3.
    df['temp_lag_1'] = df['temperature'].shift(1) # Temp 15 mins ago
    df['hum_lag_1'] = df['humidity'].shift(1)     # Hum 15 mins ago
    df['light_lag_1'] = df['light_received'].shift(1) # Light 15 mins ago

    # Create the target variable (what we want to predict)
    # We shift the temperature column *up* by one step.
    # So, for the 8:00 row, the target will be the temp at 8:15.
    df['temp_target'] = df['temperature'].shift(-1)

    # 4. Final Cleanup
    # The shift() operations create NaN values at the beginning and end
    # of the dataset. We must drop these rows.
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
    # Define your input file (from Task 7.2)
    INPUT_CSV = 'sensor_logs.csv' 
    # Define the output file (for Task 7.4)
    OUTPUT_CSV = 'sensor_data_cleaned.csv' 
    
    clean_and_prepare_data(INPUT_CSV, OUTPUT_CSV)