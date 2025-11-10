import pandas as pd
import joblib
import os
import firebase_admin
from firebase_admin import credentials, db

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

CREDENTIALS_PATH = os.path.join(SCRIPT_DIR, 'serviceAccountKey.json')
MODEL_FILE = os.path.join(SCRIPT_DIR, 'temperature_model.joblib')

DATABASE_URL = 'https://agcroller-default-rtdb.firebaseio.com' 

RTDB_PATH = 'sensor_logs' 

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
        print(f"Loading trained model from {model_path}...")
        if not os.path.exists(model_path):
            print(f"Error: Model file not found at '{model_path}'")
            return None
        
        model = joblib.load(model_path)
        print("Model loaded successfully.")

        if not os.path.exists(CREDENTIALS_PATH):
            print(f"Error: Firebase credentials file not found at '{CREDENTIALS_PATH}'")
            return None
        
        if not firebase_admin._apps:
            cred = credentials.Certificate(CREDENTIALS_PATH)
            firebase_admin.initialize_app(cred, {
                'databaseURL': DATABASE_URL
            })
        print("Firebase Admin SDK initialized for RTDB.")
        
        print(f"Querying RTDB path: {RTDB_PATH} for the last 2 readings...")
        
        ref = db.reference(RTDB_PATH)
        snapshot = ref.order_by_key().limit_to_last(2).get()

        if not snapshot or len(snapshot) < 2:
            print(f"Error: Not enough data to create lag features. Found {len(snapshot) if snapshot else 0} records at '{RTDB_PATH}'.")
            return None

        keys = list(snapshot.keys())
        previous_record = snapshot[keys[0]]
        latest_record = snapshot[keys[1]]
        
        print(f"Successfully fetched latest reading (key: {keys[1]}) and previous reading (key: {keys[0]})")

        input_data_dict = {
            'temp_lag_1': previous_record.get('temperature'),
            'hum_lag_1': previous_record.get('humidity'),
            'light_lag_1': previous_record.get('light_received')
        }
        
        latest_timestamp = pd.to_datetime(latest_record.get('timestamp'), unit='ms')
        input_data_dict['hour_of_day'] = latest_timestamp.hour

        if None in input_data_dict.values():
            print(f"Error: Could not create all required features. One of the source values was missing.")
            print(f"Created features: {input_data_dict}")
            return None

        missing_features = [col for col in FEATURE_COLUMNS if col not in input_data_dict]
        if missing_features:
            print(f"Error: Logic error, missing features that should have been created: {missing_features}")
            return None
            
        feature_values = {col: [input_data_dict[col]] for col in FEATURE_COLUMNS}

        input_df = pd.DataFrame(feature_values, columns=FEATURE_COLUMNS)
        
        print("Input Data for Prediction:")
        print(input_df)

        predictions = model.predict(input_df)
        predicted_temp = predictions[0]

        return predicted_temp

    except Exception as e:
        print(f"An error occurred during prediction: {e}")
        return None

if __name__ == "__main__":
    
    if not os.path.exists(MODEL_FILE):
        print("\n--- MOCK MODEL CREATION: Running a dummy training step... ---")
        from sklearn.linear_model import LinearRegression
        import pandas as pd
        model = LinearRegression()
        dummy_data = {
            'hour_of_day': [0, 1, 2],
            'temp_lag_1': [20, 21, 22],
            'hum_lag_1': [50, 51, 52],
            'light_lag_1': [500, 510, 520]
        }
        dummy_df = pd.DataFrame(dummy_data)
        dummy_target = [21, 22, 23]
        model.fit(dummy_df, dummy_target)
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