import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
from sklearn.metrics import r2_score
import joblib # NEW: Import joblib to save the model
import os

# --- Configuration ---
INPUT_FILE = 'sensor_data_cleaned.csv'
MODEL_FILE = 'temperature_model.joblib' # The name of the file to save the model

def train_and_save_model(data_file, model_output_file):
    """
    Loads data, trains a model, evaluates it, and saves the
    trained model to a file.
    """
    print(f"Loading prepared data from {data_file}...")
    
    # 1. Load Data
    if not os.path.exists(data_file):
        print(f"Error: File not found '{data_file}'.")
        return
    
    df = pd.read_csv(data_file)
    if df.empty:
        print("Error: The cleaned data file is empty.")
        return

    # 2. Define Features (X) and Target (y)
    target_column = 'temp_target'
    feature_columns = ['hour_of_day', 'temp_lag_1', 'hum_lag_1', 'light_lag_1']
    
    X = df[feature_columns]
    y = df[target_column]

    # 3. Split Data
    # We train on ALL available data to make the final model as smart as possible
    print("Splitting data for final training...")
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, shuffle=False)

    # 4. Create and Train the Model
    print("Training the final model on all available data...")
    model = LinearRegression()
    model.fit(X_train, y_train) # Train the model

    # 5. Evaluate (as in Task 7.5)
    y_pred = model.predict(X_test)
    r2 = r2_score(y_test, y_pred)
    print(f"Model Evaluation R² Score: {r2:.4f}")

    # --- THIS IS THE NEW PART FOR TASK 8.2 ---
    # 6. Save (Serialize) the Model
    print(f"\nSaving trained model to {model_output_file}...")
    joblib.dump(model, model_output_file)
    # --- END OF TASK 8.2 ---

    print("---")
    print("Success! Model is trained and saved.")
    print(f"Task 8.2 is complete. The file '{model_output_file}' is ready for deployment.")

# --- Run the script ---
if __name__ == "__main__":
    train_and_save_model(INPUT_FILE, MODEL_FILE)

    # --- NEW: Example of loading the model and making a prediction ---
    def load_model_and_predict(model_path, input_data):
        """
        Loads a saved model from a file and uses it to make predictions.

        Args:
            model_path (str): The path to the saved model file.
            input_data (pd.DataFrame): A DataFrame containing the input features for prediction.

        Returns:
            A numpy array of predictions.
        """
        # Load the model
        if not os.path.exists(model_path):
            print(f"Error: Model file not found at '{model_path}'")
            return None

        model = joblib.load(model_path)

        # Make predictions
        predictions = model.predict(input_data)
        return predictions

    # Example usage:
    print("\n--- Example Prediction ---")
    # Create a sample input DataFrame (replace with your actual data)
    sample_input = pd.DataFrame({
        'hour_of_day': [14], 
        'temp_lag_1': [25.0], 
        'hum_lag_1': [60.0], 
        'light_lag_1': [800.0]
    })

    # Load the model and make a prediction
    predicted_temp = load_model_and_predict(MODEL_FILE, sample_input)

    if predicted_temp is not None:
        print(f"Predicted temperature for the next hour: {predicted_temp[0]:.2f}°C")