from flask import Flask, jsonify
from flask_cors import CORS
import os
# Importamos tu script inteligente que lee de Firebase
from predict_from_firebase import predict_from_rtdb, MODEL_FILE 

app = Flask(__name__)
CORS(app) # Permite que tu página web hable con este servidor

# Umbrales de decisión de la IA
TEMP_HIGH_THRESHOLD = 28.0
TEMP_LOW_THRESHOLD = 18.0

@app.route('/predict', methods=['GET'])
def predict():
    """
    Endpoint Real: Consulta Firebase, obtiene los últimos datos 
    y usa el modelo para predecir la temperatura Y explicar su decisión.
    """
    print("--- Solicitud de Predicción Recibida ---")
    
    try:
        # 1. Obtener el valor numérico puro
        prediction_result = predict_from_rtdb(MODEL_FILE)
        
        if prediction_result is not None:
            pred_temp = round(prediction_result, 2)
            print(f"Predicción exitosa: {pred_temp}°C")
            
            # 2. Generar el "Pensamiento" de la IA
            ai_thought = "Analyzing..."
            ai_status = "stable" # stable, warning, danger
            
            if pred_temp > TEMP_HIGH_THRESHOLD:
                ai_thought = "🔥 Heat Spike Predicted! Strategy: Cooling (Fan ON)"
                ai_status = "warning"
            elif pred_temp < TEMP_LOW_THRESHOLD:
                ai_thought = "❄️ Drop Predicted! Strategy: Heating (Heater ON)"
                ai_status = "warning"
            else:
                ai_thought = "✅ Forecast Stable. No action needed."
                ai_status = "optimal"

            # 3. Enviar el paquete completo al dashboard
            return jsonify({
                'status': 'success',
                'predicted_temperature': pred_temp,
                'ai_reasoning': ai_thought, # <--- ¡El nuevo mensaje!
                'ai_condition_status': ai_status
            })
        else:
            print("Advertencia: Datos insuficientes.")
            return jsonify({
                'status': 'error',
                'message': 'Gathering more data...'
            }), 500

    except Exception as e:
        print(f"Error Crítico en API: {str(e)}")
        return jsonify({'error': str(e)}), 500

# --- Iniciar servidor ---
if __name__ == '__main__':
    print(f"🤖 Servidor de IA con Razonamiento iniciado.")
    app.run(debug=True, host='0.0.0.0', port=5000)