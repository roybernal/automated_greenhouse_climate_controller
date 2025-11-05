import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
from sklearn.metrics import r2_score, mean_squared_error
import os

# --- Configuración ---
INPUT_FILE = 'sensor_data_cleaned.csv'

def train_model(data_file):
    """
    Loads prepared data, splits it, trains a linear regression model,
    and evaluates its performance.
    """
    print(f"Loading prepared data from {data_file}...")
    
    # 1. Cargar los datos limpios
    if not os.path.exists(data_file):
        print(f"Error: File not found '{data_file}'.")
        print("Please run 'prepare_data.py' first to generate this file.")
        return

    df = pd.read_csv(data_file)

    if df.empty:
        print("Error: The cleaned data file is empty.")
        return

    print("Data loaded. Preparing for training...")

    # 2. Definir Características (X) y Objetivo (y)
    
    # Queremos predecir 'temp_target'
    target_column = 'temp_target'
    
    # Usaremos estas columnas como nuestras 'pistas' para la predicción
    # Excluimos la temperatura y humedad actuales porque el 'target' ya las incluye
    feature_columns = ['hour_of_day', 'temp_lag_1', 'hum_lag_1', 'light_lag_1']

    X = df[feature_columns]
    y = df[target_column]

    # 3. Dividir los datos en set de Entrenamiento y Prueba
    # Usaremos 80% para entrenar y 20% para probar
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, shuffle=False, random_state=42)
    # Nota: Usamos shuffle=False porque en datos de series temporales, el orden importa.
    
    print(f"Data split: {len(X_train)} training samples, {len(X_test)} testing samples.")

    # 4. Crear y Entrenar el Modelo
    print("Training the Linear Regression model...")
    model = LinearRegression()
    model.fit(X_train, y_train)

    print("Model training complete.")

    # 5. Evaluar el Modelo
    print("\n--- Model Evaluation ---")
    y_pred = model.predict(X_test)
    
    # R-squared (R²): Mide qué tan bien el modelo explica la varianza. 
    # Un valor de 1.0 es una predicción perfecta. 0.8+ es muy bueno.
    r2 = r2_score(y_test, y_pred)
    print(f"R-squared (R²) Score: {r2:.4f}")

    # Mean Squared Error (MSE): Mide el error promedio.
    # Un valor más bajo es mejor.
    mse = mean_squared_error(y_test, y_pred)
    print(f"Mean Squared Error (MSE): {mse:.4f}")

    print("\nModel training (Task 7.4) is complete.")
    print("The next step (Task 8.2) is to save this trained model.")

    # Este script solo entrena y evalúa. La siguiente tarea (8.2)
    # se encargará de guardar el 'model' en un archivo.


# --- Ejecutar el script ---
if __name__ == "__main__":
    train_model(INPUT_FILE)