from flask import Flask, jsonify
import os
import joblib 
from sklearn.linear_model import LinearRegression 
# Import the core logic and configuration constants
from predict_from_rtdb import predict_from_rtdb, MODEL_FILE, CREDENTIALS_PATH 

app = Flask(__name__)

# --- Setup: Ensure Model File Exists for Local Testing ---
# This helper function creates a dummy model so the API can run 
# without requiring you to run the separate training script first.
def setup_mock_model():
    """Creates a dummy model file if it doesn't exist."""
    if not os.path.exists(MODEL_FILE):
        print("\n--- MOCK MODEL CREATION: Creating dummy model for API testing... ---")
        # Creates a basic Linear Regression model and saves it
        model = LinearRegression()
        joblib.dump(model, MODEL_FILE)
        print(f"Created dummy model file: {MODEL_FILE}")

setup_mock_model()
# --------------------------------------------------------

@app.route('/predict', methods=['GET'])
def get_prediction():
    """
    API endpoint that triggers the model prediction process.
    It fetches the latest data from Firebase RTDB and returns the prediction result 
    in JSON format for a web dashboard.
    """
    
    # 1. Check for Credentials
    if not os.path.exists(CREDENTIALS_PATH):
        response = {
            "status": "error",
            "message": f"Service is not configured. Credentials file '{CREDENTIALS_PATH}' not found."
        }
        return jsonify(response), 500

    # 2. Call the Core Prediction Logic
    predicted_temp = predict_from_rtdb()
    
    # 3. Handle Result
    if predicted_temp is not None:
        # Success: Return the prediction as JSON
        response = {
            "status": "success",
            "prediction": float(predicted_temp), # Use float() for safe JSON serialization
            "unit": "Celsius",
            "data_source": "Firebase Realtime Database"
        }
        return jsonify(response), 200
    else:
        # Failure: The prediction function returned None
        response = {
            "status": "failure",
            "message": "Model prediction failed. Check the server console logs for detailed error information (e.g., Firebase connection or data validation errors)."
        }
        return jsonify(response), 500

@app.route('/')
def home():
    """Simple status check route."""
    return jsonify({
        "status": "ok",
        "service": "Sensor Data Prediction API",
        "instructions": "Call the /predict endpoint to get the latest temperature prediction.",
        "model_file": MODEL_FILE
    })

if __name__ == '__main__':
    # To run this API locally:
    # 1. Ensure you have all files: 'predict_api.py', 'predict_from_rtdb.py', 
    #    'temperature_model.joblib' (created automatically if missing), and 
    #    'serviceAccountKey.json'.
    # 2. Install Flask: pip install Flask
    # 3. Run: python predict_api.py
    
    print(f"\nAPI starting. Access the prediction endpoint at http://127.0.0.1:5000/predict")
    app.run(debug=True, host='0.0.0.0', port=5000)  # CHANGE TO ACTUAL IRL PORT AND ADDRESS OF THE PAGE, ROY PLEASE HELP WITH THIS ;-;
    