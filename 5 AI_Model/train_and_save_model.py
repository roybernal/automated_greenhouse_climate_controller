import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
from sklearn.metrics import r2_score
import joblib 
import os

# --- Configuration ---
INPUT_FILE = 'sensor_data_cleaned.csv'
MODEL_FILE = 'temperature_model.joblib' 

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
    # MODIFICADO: 'hour_of_day' ha sido eliminado
    feature_columns = ['temp_lag_1', 'hum_lag_1', 'light_lag_1']
    
    X = df[feature_columns]
    y = df[target_column]

    # 3. Split Data
    print("Splitting data for final training...")
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, shuffle=False)

    # 4. Create and Train the Model
    print("Training the final model on all available data...")
    model = LinearRegression()
    model.fit(X_train, y_train) # Train the model

    # 5. Evaluate
    y_pred = model.predict(X_test)
    r2 = r2_score(y_test, y_pred)
    print(f"Model Evaluation R² Score: {r2:.4f}")

    # 6. Save (Serialize) the Model
    print(f"\nSaving trained model to {model_output_file}...")
    joblib.dump(model, model_output_file)

    print("---")
    print("Success! Model is trained and saved.")


# --- Run the script ---
if __name__ == "__main__":
    train_and_save_model(INPUT_FILE, MODEL_FILE)

    # --- Example of loading the model and making a prediction ---
    def load_model_and_predict(model_path, input_data):
        if not os.path.exists(model_path):
            print(f"Error: Model file not found at '{model_path}'")
            return None
        model = joblib.load(model_path)
        predictions = model.predict(input_data)
        return predictions

    print("\n--- Example Prediction ---")
    # MODIFICADO: Sample input ya no incluye 'hour_of_day'
    sample_input = pd.DataFrame({
        'temp_lag_1': [25.0], 
        'hum_lag_1': [60.0], 
        'light_lag_1': [800.0]
    })

    predicted_temp = load_model_and_predict(MODEL_FILE, sample_input)

    if predicted_temp is not None:
        print(f"Predicted temperature for the next hour: {predicted_temp[0]:.2f}°C")