/*
Proyecto: Sistema de Control de Sensores y Actuadores
Versión: ESP32
Descripción:
Este código se ha migrado para funcionar con un módulo ESP32.
Lee sensores DHT, Humedad de Suelo (Analógico) y Luz (Analógico).
Se conecta a Firebase para enviar datos y recibir comandos.
*/

// ---------------------------
// Bibliotecas
// ---------------------------
#include <WiFi.h>              
#include "DHT.h"
#include <HTTPClient.h>        
#include <WiFiClientSecure.h>  
#include <ArduinoJson.h>

// ---------------------------
// Credenciales y URL
// ---------------------------
const char* WIFI_SSID = "upaep wifi"; //"Totalplay-51A8";
const char* WIFI_PASSWORD = "51A888D6R3V227nU";
String FIREBASE_HOST = "agcroller-default-rtdb.firebaseio.com";

// --------------------------- 
// Identificador del dispositivo
// ---------------------------
const String DEVICE_ID = "greenhouse_1";

// ---------------------------
// Definición de Pines 
// ---------------------------
#define DHTTYPE DHT11
const int DHTPIN = 4;                // <-- Pin digital GPIO 4

const int growLightPin = 2;          // <-- GPIO 2 (Luces de crecimiento)
const int heaterPin = 13;            // <-- GPIO 13 (Calefactor)
const int fanRelayPin = 12;          // <-- GPIO 12 (Ventilador)
const int irrigationRelayPin = 14;   // <-- GPIO 14 (Riego)

const int soilSensorPin = 34;        // <-- GPIO 34 (Pin Analógico ADC1_6)
const int lightSensorPin = 35;       // <-- GPIO 35 (Pin Analógico ADC1_7)

// ---------------------------
// Variables Globales
// ---------------------------
DHT dht(DHTPIN, DHTTYPE);
unsigned long irrigationStartTime = 0; 
bool isIrrigating = false;             
const long IRRIGATION_DURATION = 5000; 

// ---------------------------
// Enviar Datos a Firebase
// ---------------------------
void sendDataToFirebase(float temp, float hum, int lightValue, int soilMoisture) {
  if (WiFi.status() == WL_CONNECTED) {
    
    // --- Lógica de cliente HTTPS para ESP32 ---
    WiFiClientSecure client;
    client.setInsecure(); // Permite conexiones HTTPS sin verificar el certificado
    HTTPClient http;
    // --- Fin del cambio ---

    // --- 1. ACTUALIZAR DATOS EN TIEMPO REAL (PUT) ---
    String url_readings = "https://" + String(FIREBASE_HOST) + "/latest_readings/" + DEVICE_ID + ".json";

    if (http.begin(*client, url_readings)) { 
      http.addHeader("Content-Type", "application/json");
      String jsonReadings = "{\"device_id\":\"" + DEVICE_ID + "\"," +
                            "\"temperature\":" + String(temp, 1) +
                            ",\"humidity\":" + String(hum, 1) +
                            ",\"soil_moisture\":" + String(soilMoisture) +
                            ",\"light_received\":" + String(lightValue) +
                            ",\"timestamp\":" + String(millis()) + "}";
      int httpCode = http.PUT(jsonReadings);
      if (httpCode == 200) {
        Serial.println("-> latest_readings actualizado con éxito.");
      } else {
        Serial.printf("[HTTP] Error actualizando latest_readings. Código: %d\n", httpCode);
      }
      http.end();
    }

    // --- 2. ACTUALIZAR ESTADO DE ACTUADORES (PUT) ---
    String url_actuators = "https://" + FIREBASE_HOST + "/actuator_status.json" + DEVICE_ID + ".json";
    if (http.begin(*client, url_actuators)) {
      http.addHeader("Content-Type", "application/json");
      
      String fanStatus = (digitalRead(fanRelayPin) == LOW) ? "true" : "false";
      String lightsStatus = (digitalRead(growLightPin) == HIGH) ? "true" : "false"; // Estado de las luces
      String irrigationStatus = (digitalRead(irrigationRelayPin) == LOW) ? "true" : "false";

      String jsonActuators = "{\"fan\":" + fanStatus + 
                            ",\"heater\":" + lightsStatus + // "heater" es el ID que usa tu JavaScript para las luces
                            ",\"irrigation\":" + irrigationStatus + "}";
      
      int httpCode = http.PUT(jsonActuators);
      if (httpCode == 200) {
        Serial.println("-> actuator_status actualizado con éxito.");
      } else {
        Serial.printf("[HTTP] Error actualizando actuator_status. Código: %d\n", httpCode);
      }
      http.end();
    }

    // --- 3. GUARDAR REGISTRO HISTÓRICO (POST) 
    String url_logs = "https://" + FIREBASE_HOST + "/sensor_logs.json" + DEVICE_ID + ".json";
    if (http.begin(*client, url_logs)) { // Re-usamos el cliente
      http.addHeader("Content-Type", "application/json");
      String jsonLog = "{\"temperature\":" + String(temp, 1) +
                       ",\"humidity\":" + String(hum, 1) +
                       ",\"light_received\":" + String(lightValue) +
                       ",\"soil_moisture\":" + String(soilMoisture) +
                       ",\"timestamp\":" + String(millis()) + "}";
      
      int httpCode = http.POST(jsonLog);

      if (httpCode == 200) {
        Serial.println("-> Registro histórico guardado con éxito en /sensor_logs.");
      } else {
        Serial.printf("[HTTP] Error guardando registro histórico. Código: %d\n", httpCode);
      }
      http.end();
    }
    
  } else {
    Serial.println("Error: No hay conexión WiFi para enviar los datos.");
  }
}

// ---------------------------
// Función de Conexión WiFi 
// ---------------------------
void connectToWifi() {
  WiFi.begin(WIFI_SSID);//, WIFI_PASSWORD);
  Serial.print("Estableciendo conexión con ");
  Serial.print(WIFI_SSID);
  int retryCounter = 0;
  while (WiFi.status() != WL_CONNECTED && retryCounter < 40) {
    delay(500);
    Serial.print(".");
    retryCounter++;
  }
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n¡Conexión WiFi exitosa!");
    Serial.print("Dirección IP asignada: ");
    Serial.println(WiFi.localIP());
  } else {
    const char* WIFI_SSID = "Totalplay-51A8";
    const char* WIFI_PASSWORD = "51A888D6R3V227nU";
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    Serial.print("Estableciendo conexión con ");
    Serial.print(WIFI_SSID);
    int retryCounter = 0;
    while (WiFi.status() != WL_CONNECTED && retryCounter < 40) {
      delay(500);
      Serial.print(".");
      retryCounter++;
    }
    if (WiFi.status() == WL_CONNECTED) {
      Serial.println("\n¡Conexión WiFi exitosa!");
      Serial.print("Dirección IP asignada: ");
      Serial.println(WiFi.localIP());
    } else {
      Serial.println("\nNo se pudo conectar a la red WiFi.");
    }
  }
}

// --- FUNCIÓN HELPER PARA ACTUALIZAR FIREBASE (Para apagar el botón web) ---
void updateFirebaseActuatorState(String actuator, bool state) {
    if (WiFi.status() == WL_CONNECTED) {
        WiFiClientSecure client;
        client.setInsecure();
        HTTPClient http;
        String url = "https://" + String(FIREBASE_HOST) + "/actuator_controls/" + DEVICE_ID + "/" + actuator + ".json";
        if (http.begin(client, url)) {
            http.PUT(state ? "true" : "false");
            http.end();
            Serial.println("Estado de " + actuator + " actualizado en Firebase.");
        }
    }
}

// ---------------------------
// Configuración Inicial (setup) 
// ---------------------------
void setup() {
  Serial.begin(9600);
  Serial.println("Iniciando sistema integrado en ESP32...");
  connectToWifi();
  
  pinMode(growLightPin, OUTPUT);
  pinMode(heaterPin, OUTPUT);
  pinMode(fanRelayPin, OUTPUT);
  pinMode(irrigationRelayPin, OUTPUT);
  
  // Los pines analógicos del ESP32 (34, 35) son solo de entrada, no necesitan pinMode.
  
  digitalWrite(fanRelayPin, HIGH);        // APAGADO (Active-LOW)
  digitalWrite(heaterPin, LOW);           // APAGADO (Active-HIGH)
  digitalWrite(growLightPin, LOW);        // APAGADO (Active-HIGH)
  digitalWrite(irrigationRelayPin, HIGH); // APAGADO (Active-LOW)
  
  dht.begin();
}

// ---------------------------
// Revisar Controles de Firebase
// ---------------------------
void checkFirebaseControls() {
  WiFiClientSecure client;
  client.setInsecure();
  HTTPClient http;

  String url_controls = "https://" + String(FIREBASE_HOST) + "/actuator_controls/" + DEVICE_ID + ".json"; 

  Serial.println("Consultando controles de actuadores...");
  
  if (http.begin(client, url_controls)) { 
    int httpCode = http.GET();
    
    if (httpCode == 200) {
      String payload = http.getString();
      Serial.println("Comandos recibidos: " + payload);
      
      StaticJsonDocument<512> doc;
      DeserializationError error = deserializeJson(doc, payload);

      if (error) {
        Serial.print("deserializeJson() falló: ");
        Serial.println(error.c_str());
        http.end();
        return;
      }

      // DEBUG: Imprimir todos los campos disponibles
      Serial.println("=== CAMPOS DISPONIBLES ===");
      for (JsonPair kv : doc.as<JsonObject>()) {
        Serial.printf("Campo: %s, Valor: %s\n", kv.key().c_str(), kv.value().as<bool>() ? "true" : "false");
      }
      Serial.println("==========================");

      // Control para Ventilador
      if (doc.containsKey("fan")) {
        bool fanState = doc["fan"];
        digitalWrite(fanRelayPin, fanState ? LOW : HIGH);
        Serial.printf("Fan: %s\n", fanState ? "ON" : "OFF");
      }

      // Control para Luces de Crecimiento - usa "heater" (que viene del JavaScript)
      if (doc.containsKey("heater")) {
        bool lightsState = doc["heater"];
        digitalWrite(growLightPin, lightsState ? HIGH : LOW);
        Serial.printf("Grow Lights: %s\n", lightsState ? "ON" : "OFF");
      }

      // Control para Riego
      if (doc.containsKey("irrigation")) {
        bool command = doc["irrigation"];
        
        // Si recibimos TRUE y no estamos regando aún, INICIAR
        if (command && !isIrrigating) {
           Serial.println("Iniciando Riego (5 segundos)...");
           digitalWrite(irrigationRelayPin, LOW); // ENCENDER (Active-LOW)
           isIrrigating = true;
           irrigationStartTime = millis(); // Guardar hora de inicio
        }
        // Nota: No añadimos el "else" para apagar aquí inmediatamente,
        // dejamos que el timer en el loop() lo apague.
      }

    } else {
      Serial.printf("Error al obtener controles. HTTP code: %d\n", httpCode);
    }
    http.end();
  } else {
      Serial.println("No se pudo conectar a Firebase para leer controles.");
  }
}

// ---------------------------
// Bucle Principal (loop)
// ---------------------------
void loop() {
  // Re-conexión WiFi
  if (WiFi.status() != WL_CONNECTED) connectToWifi();

  // --- LÓGICA DEL TEMPORIZADOR DE RIEGO (PRIORIDAD ALTA) ---
  if (isIrrigating) {
    // Verificar si ya pasaron 5 segundos (5000 ms)
    if (millis() - irrigationStartTime >= IRRIGATION_DURATION) {
        Serial.println("Tiempo de riego terminado. Apagando bomba.");
        
        // 1. Apagar físicamente
        digitalWrite(irrigationRelayPin, HIGH); // APAGAR (Active-LOW)
        isIrrigating = false;
        
        // 2. Apagar el botón en la página Web (Sincronización)
        updateFirebaseActuatorState("irrigation", false);
    }
  }

  // --- LECTURA DE SENSORES Y ENVÍO (Cada 10 seg aprox) ---
  // Usamos un timer no bloqueante para no detener el chequeo del riego
  static unsigned long lastSensorRun = 0;
  if (millis() - lastSensorRun > 10000) {
      lastSensorRun = millis();
      
      float h = dht.readHumidity();
      float t = dht.readTemperature();
      int soil = analogRead(soilSensorPin);
      int light = analogRead(lightSensorPin);
      
      Serial.printf("T: %.1f, H: %.1f, Soil: %d, Light: %d\n", t, h, soil, light);
      
      if (!isnan(h) && !isnan(t)) {
        sendDataToFirebase(t, h, light, soil);
      }
      
      // Checar controles remotos
      checkFirebaseControls();
  }
  
  // Pequeño delay para estabilidad del ESP32, pero corto para no bloquear el riego
  delay(100); 
}