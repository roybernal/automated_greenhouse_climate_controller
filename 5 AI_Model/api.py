import pandas as pd
import joblib
from flask import Flask, jsonify
from flask_cors import CORS # Necesario para permitir la conexión desde tu dashboard
import datetime

# 1. Cargar el modelo entrenado (de la Tarea 8.2)
try:
    model = joblib.load('temperature_model.joblib')
    print("Modelo 'temperature_model.joblib' cargado exitosamente.")
except FileNotFoundError:
    print("Error: 'temperature_model.joblib' no encontrado.")
    print("Asegúrate de ejecutar 'train_and_save_model.py' primero.")
    exit()

# 2. Crear la aplicación Flask
app = Flask(__name__)
CORS(app) # Habilita CORS para todas las rutas

# 3. Crear el endpoint de predicción
@app.route('/predict', methods=['GET'])
def predict():
    """
    Carga los últimos datos, los formatea y devuelve una predicción.
    """
    try:
        # --- Simulación de datos de entrada ---
        # En un sistema más avanzado, aquí consultarías Firebase
        # para obtener los últimos datos de 'latest_readings'.
        # Por ahora, usaremos datos de prueba fijos:
        
        now = datetime.datetime.now()
        current_hour = now.hour
        
        # Creamos un DataFrame con los mismos nombres de columnas que usamos para entrenar
        input_data = pd.DataFrame({
            'hour_of_day': [current_hour],
            'temp_lag_1': [25.0],  # Dato de prueba: temp 15 min antes
            'hum_lag_1': [60.0],   # Dato de prueba: hum 15 min antes
            'light_lag_1': [400]   # Dato de prueba: luz 15 min antes
        })

        # 4. Realizar la predicción
        prediction = model.predict(input_data)
        
        # Devolver la predicción en formato JSON
        return jsonify({'predicted_temperature': round(prediction[0], 2)})

    except Exception as e:
        return jsonify({'error': str(e)})

# --- Iniciar el servidor de la API ---
if __name__ == '__main__':
    print("Iniciando servidor de API en http://127.0.0.1:5000")
    app.run(debug=True, port=5000)