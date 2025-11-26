import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.model_selection import train_test_split
import joblib
import os

# Archivo de entrada (asegúrate de tener sensor_logs.csv en la carpeta)
INPUT_FILE = 'sensor_logs.csv'

def train_all_models():
    print("1. Cargando datos...")
    if not os.path.exists(INPUT_FILE):
        print(f"Error: No encuentro {INPUT_FILE}. Descarga un export nuevo de Firebase o usa el anterior.")
        return

    df = pd.read_csv(INPUT_FILE)
    
    # --- LIMPIEZA Y RELLENO DE DATOS FALTANTES ---
    # Si faltan columnas (como soil_moisture en logs viejos), las simulamos para poder entrenar
    if 'soil_moisture' not in df.columns:
        print("⚠️ Aviso: No hay datos históricos de suelo. Generando simulados para entrenamiento...")
        # Simulamos que el suelo está inversamente relacionado a la humedad ambiental (lógica básica)
        df['soil_moisture'] = 4095 - (df['humidity'] * 30) + np.random.randint(-100, 100, size=len(df))
    
    if 'light_received' not in df.columns:
         df['light_received'] = np.random.randint(0, 4095, size=len(df))

    # Asegurar que todo sea numérico
    df = df.select_dtypes(include=[np.number]).dropna()

    # --- INGENIERÍA DE CARACTERÍSTICAS (FEATURES) ---
    # Usamos el estado actual para predecir el futuro (1 hora después)
    # Features (X): Lo que sabemos AHORA
    X = df[['temperature', 'humidity', 'light_received', 'soil_moisture']]
    
    # Targets (y): Lo que queremos adivinar (shifted -1 row)
    y_temp = df['temperature'].shift(-1)
    y_hum = df['humidity'].shift(-1)
    y_light = df['light_received'].shift(-1)
    y_soil = df['soil_moisture'].shift(-1)

    # Eliminamos la última fila (que no tiene futuro)
    X = X[:-1]
    y_temp = y_temp[:-1]
    y_hum = y_hum[:-1]
    y_light = y_light[:-1]
    y_soil = y_soil[:-1]

    # --- ENTRENAMIENTO DE LOS 4 CEREBROS ---
    print("2. Entrenando modelos...")
    
    models = {
        'model_temp.joblib': y_temp,
        'model_hum.joblib': y_hum,
        'model_light.joblib': y_light,
        'model_soil.joblib': y_soil
    }

    for name, target in models.items():
        model = LinearRegression()
        model.fit(X, target)
        joblib.dump(model, name)
        print(f"   ✅ Modelo guardado: {name}")

    print("\n¡Listo! Ahora sube estos 4 archivos .joblib a PythonAnywhere.")

if __name__ == "__main__":
    train_all_models()