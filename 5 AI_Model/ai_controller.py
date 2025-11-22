import requests
import time
import firebase_admin
from firebase_admin import credentials, db

# 1. Configura Firebase (Necesitas tu serviceAccountKey.json)
cred = credentials.Certificate("serviceAccountKey.json")
firebase_admin.initialize_app(cred, {
    'databaseURL': 'https://agcroller-default-rtdb.firebaseio.com/'
})

# Umbrales de Temperatura
TEMP_MAX = 28.0
TEMP_MIN = 18.0

def ai_control_loop():
    print("🤖 AI Controller Started. Monitoring predictions...")
    
    while True:
        try:
            # 1. Obtener predicción de tu API local
            response = requests.get('http://127.0.0.1:5000/predict')
            if response.status_code == 200:
                data = response.json()
                predicted_temp = data.get('predicted_temperature')
                
                if predicted_temp:
                    print(f"🔮 Predicción (1h): {predicted_temp}°C")
                    
                    # 2. Tomar decisiones proactivas
                    ref = db.reference('actuator_controls')
                    
                    if predicted_temp > TEMP_MAX:
                        print("⚠️ ALERTA: Calor previsto. Activando ventilador preventivamente.")
                        ref.update({'fan': True})
                        
                    elif predicted_temp < TEMP_MIN:
                        print("⚠️ ALERTA: Frío previsto. Activando calefactor preventivamente.")
                        ref.update({'heater': True})
                    
                    else:
                        print("✅ Clima estable. Manteniendo estado.")
                        # Opcional: Apagar si todo está bien
                        # ref.update({'fan': False, 'heater': False})
            
            else:
                print("Error contactando API de predicción.")

        except Exception as e:
            print(f"Error en loop de control: {e}")

        # Esperar 1 minuto antes de la siguiente verificación
        time.sleep(60)

if __name__ == "__main__":
    ai_control_loop()