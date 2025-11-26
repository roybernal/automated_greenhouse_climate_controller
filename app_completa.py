# app_completa.py
from flask import Flask, jsonify
from flask_cors import CORS
import os
from predict_from_firebase import predict_from_rtdb, MODEL_FILE
import firebase_admin
from firebase_admin import credentials, db

app = Flask(__name__)
CORS(app)

# --- CONFIGURACIÓN FIREBASE (Solo se inicia una vez) ---
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
CREDENTIALS_PATH = os.path.join(SCRIPT_DIR, 'serviceAccountKey.json')

if not firebase_admin._apps:
    cred = credentials.Certificate(CREDENTIALS_PATH)
    firebase_admin.initialize_app(cred, {
        'databaseURL': 'https://agcroller-default-rtdb.firebaseio.com/'
    })

# Umbrales
TEMP_MAX = 28.0
TEMP_MIN = 18.0

@app.route('/predict_and_control', methods=['GET'])
def smart_brain():
    """
    Este endpoint hace TODO: Predice, Piensa y Actúa.
    """
    try:
        # 1. PREDICCIÓN
        pred_temp = predict_from_rtdb(MODEL_FILE)
        
        if pred_temp is None:
            return jsonify({'status': 'error', 'message': 'Faltan datos'}), 500
            
        pred_temp = round(pred_temp, 2)
        
        # 2. RAZONAMIENTO Y CONTROL (Lógica del ai_controller)
        ai_thought = "Estable"
        ai_status = "optimal"
        ref = db.reference('actuator_controls')
        
        if pred_temp > TEMP_MAX:
            ai_thought = "🔥 ¡Calor previsto! Activando ventilador."
            ai_status = "warning"
            ref.update({'fan': True}) # Acción automática
            
        elif pred_temp < TEMP_MIN:
            ai_thought = "❄️ Frío previsto. Activando calefactor."
            ai_status = "warning"
            ref.update({'heater': True}) # Acción automática
            
        else:
            ai_thought = "✅ Clima estable. Manteniendo."
            # Opcional: Apagar si todo está bien
            # ref.update({'fan': False, 'heater': False})

        # 3. RESPUESTA (Para tu página web)
        return jsonify({
            'predicted_temperature': pred_temp,
            'ai_reasoning': ai_thought,
            'ai_condition_status': ai_status
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run()