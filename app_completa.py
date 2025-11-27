# Se necesita subir a pythonanywhere o similar junto con los modelos entrenados y el archivo serviceAccountKey.json
# Para que funcione y se vea reflejado en Firebase Realtime Database.
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

# --- DICCIONARIO DE MENSAJES ---
MESSAGES = {
    'es': {
        'heat': "🔥 Calor futuro ({val:.1f}°C)",
        'cold': "❄️ Frío futuro ({val:.1f}°C)",
        'high_hum': "💧 Humedad alta ({val:.0f}%)",
        'dry_soil': "🌵 Sequía prevista -> Regando",
        'low_light': "💡 Luz Baja -> Luces ON",
        'stable': "✅ Pronóstico Estable",
        'gathering': "Recopilando datos..."
    },
    'en': {
        'heat': "🔥 Heat spike forecast ({val:.1f}°C)",
        'cold': "❄️ Cold drop forecast ({val:.1f}°C)",
        'high_hum': "💧 High humidity ({val:.0f}%)",
        'dry_soil': "🌵 Drought forecast -> Watering",
        'low_light': "💡 Low Light -> Lights ON",
        'stable': "✅ Forecast Stable",
        'gathering': "Gathering data..."
    }
}

@app.route('/predict_and_control', methods=['POST'])
def smart_brain():
    try:
        req_data = request.json
        device_id = req_data.get('device_id')
        limits = req_data.get('limits', {})
        lang = req_data.get('lang', 'en') # Recibimos el idioma (default inglés)
        
        # Seleccionar diccionario correcto
        msgs = MESSAGES.get(lang, MESSAGES['en'])
        
        MAX_TEMP = float(limits.get('maxTemp', 28))
        MIN_TEMP = float(limits.get('minTemp', 18))
        MAX_HUM = float(limits.get('maxHum', 70))
        SOIL_DRY_LIMIT = float(limits.get('soilLimit', 3000))

        if not device_id: return jsonify({'error': 'Falta device_id'}), 400

        # Leer Sensores
        ref = db.reference(f'sensor_logs/{device_id}')
        snapshot = ref.order_by_key().limit_to_last(1).get()
        
        if not snapshot:
            return jsonify({'status': 'waiting', 'message': msgs['gathering']}), 200

        last_key = list(snapshot.keys())[0]
        curr_data = snapshot[last_key]
        
        # Preparar datos
        input_data = pd.DataFrame({
            'temperature': [float(curr_data.get('temperature', 0))],
            'humidity': [float(curr_data.get('humidity', 0))],
            'light_received': [float(curr_data.get('light_received', 0))],
            'soil_moisture': [float(curr_data.get('soil_moisture', 0))]
        })

        # --- PREDICCIONES ---
        preds = {
            'temp': models['temp'].predict(input_data)[0] if 'temp' in models else 0,
            'hum': models['hum'].predict(input_data)[0] if 'hum' in models else 0,
            'light': models['light'].predict(input_data)[0] if 'light' in models else 0,
            'soil': models['soil'].predict(input_data)[0] if 'soil' in models else 0
        }

        # --- RAZONAMIENTO ---
        reasons = []
        status = "optimal"
        controls = {}

        # 1. Temperatura
        if preds['temp'] > MAX_TEMP:
            reasons.append(msgs['heat'].format(val=preds['temp']))
            controls['fan'] = True; controls['heater'] = False
            status = "warning"
        elif preds['temp'] < MIN_TEMP:
            reasons.append(msgs['cold'].format(val=preds['temp']))
            controls['fan'] = False; controls['heater'] = True
            status = "warning"
        else:
            controls['fan'] = False; controls['heater'] = False

        # 2. Humedad
        if preds['hum'] > MAX_HUM:
            reasons.append(msgs['high_hum'].format(val=preds['hum']))
            controls['fan'] = True
            status = "warning"

        # 3. Suelo
        if preds['soil'] > SOIL_DRY_LIMIT: 
            reasons.append(msgs['dry_soil'])
            controls['irrigation'] = True
            status = "warning"
        
        # 4. Luz (Ejemplo simple)
        if preds['light'] > 3000: # Si está muy oscuro (valor alto en LDR raw)
             # reasons.append(msgs['low_light']) # Opcional: agregar mensaje
             pass 

        # Ejecutar Acciones
        if controls:
            db.reference(f'actuator_controls/{device_id}').update(controls)

        ai_msg = " | ".join(reasons) if reasons else msgs['stable']

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