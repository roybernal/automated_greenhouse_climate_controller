from flask import Flask, jsonify
from flask_cors import CORS
import os
# Importamos tu script inteligente que sí lee de Firebase
from predict_from_firebase import predict_from_rtdb, MODEL_FILE 

app = Flask(__name__)
CORS(app) # Permite que tu página web hable con este servidor

@app.route('/predict', methods=['GET'])
def predict():
    """
    Endpoint Real: Consulta Firebase, obtiene los últimos datos 
    y usa el modelo para predecir la temperatura real futura.
    """
    print("--- Solicitud de Predicción Recibida ---")
    
    try:
        # Llamamos a tu función maestra que hace todo el trabajo duro
        # (Asegúrate de tener tu 'serviceAccountKey.json' en la carpeta)
        prediction_result = predict_from_rtdb(MODEL_FILE)
        
        if prediction_result is not None:
            print(f"Predicción exitosa: {prediction_result:.2f}°C")
            return jsonify({
                'status': 'success',
                'predicted_temperature': round(prediction_result, 2)
            })
        else:
            print("Advertencia: No se pudo generar una predicción (datos insuficientes o error de conexión).")
            return jsonify({
                'status': 'error',
                'message': 'No enough data in Firebase to predict yet.'
            }), 500

    except Exception as e:
        print(f"Error Crítico en API: {str(e)}")
        return jsonify({'error': str(e)}), 500

# --- Iniciar servidor ---
if __name__ == '__main__':
    print(f"🤖 Servidor de IA Real iniciado. Esperando peticiones...")
    print(f"Asegúrate de que 'serviceAccountKey.json' esté en esta carpeta.")
    app.run(debug=True, host='0.0.0.0', port=5000)