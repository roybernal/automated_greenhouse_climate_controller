import pandas as pd
import joblib
import os
import firebase_admin
from firebase_admin import credentials, db # We now use firebase_admin for RTDB

# --- Configuration (UPDATED FOR REALTIME DATABASE) ---
CREDENTIALS_PATH = 'serviceAccountKey.json' 
MODEL_FILE = 'temperature_model.joblib' 

# Database Path - We use 'sensor_logs' as the starting path
RTDB_PATH = 'sensor_logs' 

# The features the model was trained on (MUST match the training script)
FEATURE_COLUMNS = ['hour_of_day', 'temp_lag_1', 'hum_lag_1', 'light_lag_1']

def predict_from_rtdb(model_path: str) -> float | None:
    """
    Loads a saved model, fetches the LATEST input data from Realtime Database,
    makes a prediction, and returns the result.
    
    This function uses a query to fetch the last (most recent) item 
    pushed under the 'sensor_logs' path.

    Args:
        model_path: Path to the saved joblib model file.

    Returns:
        The predicted temperature (float) or None if an error occurs.
    """
    try:
        # 1. Load the Model
        print(f"Loading trained model from {model_path}...")
        if not os.path.exists(model_path):
            print(f"Error: Model file not found at '{model_path}'")
            return None
        
        model = joblib.load(model_path)
        print("Model loaded successfully.")

        # 2. Initialize Firebase Admin SDK
        if not os.path.exists(CREDENTIALS_PATH):
            print(f"Error: Firebase credentials file not found at '{CREDENTIALS_PATH}'")
            return None
        
        # Initialize only if not already initialized
        if not firebase_admin._apps:
            cred = credentials.Certificate(CREDENTIALS_PATH)
            # The databaseURL is required for the Realtime Database
            # Replace the URL below with your database URL from the screenshot
            # (e.g., https://agcrolller-default-rtdb.firebaseio.com)
            firebase_admin.initialize_app(cred, {
                'databaseURL': 'https://agcrolller-default-rtdb.firebaseio.com' 
            })
        print("Firebase Admin SDK initialized for RTDB.")
        
        # 3. Retrieve LATEST Data from Realtime Database
        print(f"Querying RTDB path: {RTDB_PATH} for the latest reading...")
        
        # To get the LATEST item: we query by the key (which is a push ID, usually sortable by time)
        # and limit the result to the last 1 record.
        ref = db.reference(RTDB_PATH)
        snapshot = ref.order_by_key().limit_to_last(1).get()

        if not snapshot:
            print(f"Error: No data found at path '{RTDB_PATH}'.")
            return None

        # snapshot is a dictionary where the key is the push ID and the value is the data
        # We need to extract the actual data dictionary (the value of the single item)
        data_key, input_data_dict = list(snapshot.items())[0]
        
        print(f"Successfully fetched latest reading with key: {data_key}")

        # 4. Validate and Format Data for the Model
        
        missing_features = [col for col in FEATURE_COLUMNS if col not in input_data_dict]
        if missing_features:
            print(f"Error: Missing required features in RTDB record: {missing_features}")
            print(f"Found keys: {list(input_data_dict.keys())}")
            return None
            
        # Extract only the features needed for prediction
        feature_values = {col: [input_data_dict[col]] for col in FEATURE_COLUMNS}

        # Create the required Pandas DataFrame 
        input_df = pd.DataFrame(feature_values, columns=FEATURE_COLUMNS)
        
        print("Input Data for Prediction:")
        print(input_df)

        # 5. Make Prediction
        predictions = model.predict(input_df)
        predicted_temp = predictions[0]

        return predicted_temp

    except Exception as e:
        print(f"An error occurred during prediction: {e}")
        return None

# --- Main Execution ---
if __name__ == "__main__":
    
    # --- MOCK SETUP (for local testing without a real trained model) ---
    if not os.path.exists(MODEL_FILE):
        print("\n--- MOCK MODEL CREATION: Running a dummy training step... ---")
        from sklearn.linear_model import LinearRegression
        model = LinearRegression()
        joblib.dump(model, MODEL_FILE)
        print(f"Created dummy model file: {MODEL_FILE}")
    
    if not os.path.exists(CREDENTIALS_PATH):
        print(f"\n!!! WARNING: Credentials file '{CREDENTIALS_PATH}' not found. Prediction will fail. !!!")
        print("Remember to replace the databaseURL in the code with your specific URL.")

    print("\n-----------------------------------------------------")
    final_prediction = predict_from_rtdb(MODEL_FILE)
    
    print("-----------------------------------------------------")
    if final_prediction is not None:
        print(f"FINAL PREDICTED TEMPERATURE: {final_prediction:.2f}°C")
    else:
        print("Prediction failed. Check error messages above.")