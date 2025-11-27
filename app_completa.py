from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import joblib
import pandas as pd
import firebase_admin
from firebase_admin import credentials, db

app = Flask(__name__)
CORS(app)

# --- CONFIGURACIÓN ---
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
CREDENTIALS_PATH = os.path.join(SCRIPT_DIR, 'serviceAccountKey.json')

if not firebase_admin._apps:
    cred = credentials.Certificate(CREDENTIALS_PATH)
    firebase_admin.initialize_app(cred, {
        'databaseURL': 'https://agcroller-default-rtdb.firebaseio.com/'
    })

# --- CARGAR LOS 4 CEREBROS ---
models = {}
try:
    models['temp'] = joblib.load(os.path.join(SCRIPT_DIR, 'model_temp.joblib'))
    models['hum'] = joblib.load(os.path.join(SCRIPT_DIR, 'model_hum.joblib'))
    models['light'] = joblib.load(os.path.join(SCRIPT_DIR, 'model_light.joblib'))
    models['soil'] = joblib.load(os.path.join(SCRIPT_DIR, 'model_soil.joblib'))
    print("✅ Los 4 modelos cargados correctamente.")
except Exception as e:
    print(f"⚠️ Error cargando modelos: {e}")

@app.route('/predict_and_control', methods=['POST'])
def smart_brain():
    try:
        req_data = request.json
        device_id = req_data.get('device_id')
        limits = req_data.get('limits', {})
        
        # Límites de usuario
        MAX_TEMP = float(limits.get('maxTemp', 28))
        MIN_TEMP = float(limits.get('minTemp', 18))
        MAX_HUM = float(limits.get('maxHum', 70))
        SOIL_DRY_LIMIT = float(limits.get('soilLimit', 3000))

        if not device_id: return jsonify({'error': 'Falta device_id'}), 400

        # Leer Sensores
        ref = db.reference(f'sensor_logs/{device_id}')
        snapshot = ref.order_by_key().limit_to_last(1).get() # Solo necesitamos el último para predecir el siguiente
        
        if not snapshot:
            return jsonify({'status': 'waiting', 'message': 'Sin datos'}), 200

        last_key = list(snapshot.keys())[0]
        curr_data = snapshot[last_key]
        
        # Preparar datos para la IA
        # (La IA espera: [temperature, humidity, light_received, soil_moisture])
        input_data = pd.DataFrame({
            'temperature': [float(curr_data.get('temperature', 0))],
            'humidity': [float(curr_data.get('humidity', 0))],
            'light_received': [float(curr_data.get('light_received', 0))],
            'soil_moisture': [float(curr_data.get('soil_moisture', 0))]
        })

        # --- HACER LAS 4 PREDICCIONES ---
        preds = {
            'temp': models['temp'].predict(input_data)[0] if 'temp' in models else 0,
            'hum': models['hum'].predict(input_data)[0] if 'hum' in models else 0,
            'light': models['light'].predict(input_data)[0] if 'light' in models else 0,
            'soil': models['soil'].predict(input_data)[0] if 'soil' in models else 0
        }

        # --- RAZONAMIENTO Y CONTROL ---
        reasons = []
        status = "optimal"
        controls = {}

        # 1. Temperatura (Futura)
        if preds['temp'] > MAX_TEMP:
            reasons.append(f"🔥 Calor futuro ({preds['temp']:.1f}°C)\n")
            controls['fan'] = True; controls['heater'] = False # Encender ventilador
            status = "warning"
        elif preds['temp'] < MIN_TEMP:
            reasons.append(f"❄️ Frío futuro ({preds['temp']:.1f}°C)\n")
            controls['fan'] = False; controls['heater'] = True # Encender calefacción
            status = "warning"
        # else:
        #    controls['fan'] = False; controls['heater'] = False

        # 2. Humedad (Futura)
        if preds['hum'] > MAX_HUM:
            reasons.append(f"💧 Humedad alta ({preds['hum']:.0f}%)\n")
            controls['fan'] = True # El ventilador ayuda a bajar humedad
            status = "warning"

        # 3. Suelo (Futuro) - Prevenir sequía antes de que pase
        if preds['soil'] > SOIL_DRY_LIMIT: 
            reasons.append("🌵 Sequía prevista -> Regando\n")
            controls['irrigation'] = True
            status = "warning"
        
        # 4. Luz (Futura)
        if preds['light'] > 3000: # Si se prevé oscuridad
             # Aquí podrías decidir encender luz si es de día
             pass 

        # Ejecutar Acciones
        if controls:
            db.reference(f'actuator_controls/{device_id}').update(controls)

        # Mensaje final para el humano
        ai_msg = " | ".join(reasons) if reasons else "✅ Pronóstico Estable"

        return jsonify({
            'predicted_temperature': round(preds['temp'], 1),
            'predicted_humidity': round(preds['hum'], 1),
            'predicted_soil': round(preds['soil'], 0),
            'predicted_light': round(preds['light'], 0),
            'ai_reasoning': ai_msg,
            'ai_condition_status': status
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run()