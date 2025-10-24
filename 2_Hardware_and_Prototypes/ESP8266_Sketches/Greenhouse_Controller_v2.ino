/*
Proyecto: Sistema de Control de Sensores y Actuadores con ESP8266
Autores:
- Lucio Emiliano Ruiz Sepulveda
- Rodrigo Samuel Bernal Moreno
- Enrique Alfonso Gracian Castro
- Jesus Perez Rodriguez
Fecha de migración: 06/10/2025
Descripción:
Este código integra la lectura de sensores, envía datos en tiempo real (PUT)
y registra un historial de lecturas (POST) a Firebase.
*/

// ---------------------------
// Bibliotecas
// ---------------------------
#include <ESP8266WiFi.h>
#include "DHT.h"
#include <ESP8266HTTPClient.h>
#include <WiFiClientSecure.h>
#include <ArduinoJson.h>

// ---------------------------
// Credenciales y URL
// ---------------------------
const char* WIFI_SSID = "upaep wifi";
// const char* WIFI_PASSWORD = "51A888D6R3V227nU";
String FIREBASE_HOST = "agcroller-default-rtdb.firebaseio.com";

// ---------------------------
// Definición de Pines
// ---------------------------
#define DHTPIN D2
#define DHTTYPE DHT11

const int ledPin = D1;
const int lightSensorPin = D0;
const int soilSensorPin = A0;
const int trigPin = D3;
const int echoPin = D4;
const int fanRelayPin = D6;
const int irrigationRelayPin = D7;

// ---------------------------
// Variables Globales
// ---------------------------
long duration;
int distance;
DHT dht(DHTPIN, DHTTYPE);
WiFiClient client;

// ---------------------------
// Enviar Datos a Firebase
// ---------------------------
void sendDataToFirebase(float temp, float hum, int lightValue, int soilMoisture) {
  if (WiFi.status() == WL_CONNECTED) {
    std::unique_ptr<BearSSL::WiFiClientSecure> client(new BearSSL::WiFiClientSecure);
    client->setInsecure();
    HTTPClient http;

    // --- 1. ACTUALIZAR DATOS EN TIEMPO REAL (PUT) ---
    String url_readings = "https://" + FIREBASE_HOST + "/latest_readings.json";
    if (http.begin(*client, url_readings)) {
      http.addHeader("Content-Type", "application/json");
      String jsonReadings = "{\"temperature\":" + String(temp, 1) +
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
    String url_actuators = "https://" + FIREBASE_HOST + "/actuator_status.json";
    if (http.begin(*client, url_actuators)) {
      http.addHeader("Content-Type", "application/json");
      
      String fanStatus = (digitalRead(fanRelayPin) == LOW) ? "true" : "false";
      String heaterStatus = (digitalRead(ledPin) == HIGH) ? "true" : "false";
      
      String irrigationStatus = (digitalRead(irrigationRelayPin) == LOW) ? "true" : "false";

      String jsonActuators = "{\"fan\":" + fanStatus + 
                             ",\"heater\":" + heaterStatus + 
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
    String url_logs = "https://" + FIREBASE_HOST + "/sensor_logs.json";
    if (http.begin(*client, url_logs)) {
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
    Serial.println("\nNo se pudo conectar a la red WiFi.");
  }
}

// ---------------------------
// Configuración Inicial (setup) 
// ---------------------------
void setup() {
  Serial.begin(9600);
  Serial.println("Iniciando sistema integrado en ESP8266...");
  connectToWifi();
  pinMode(ledPin, OUTPUT);
  pinMode(fanRelayPin, OUTPUT);
  pinMode(irrigationRelayPin, OUTPUT);
  
  // pinMode(trigPin, OUTPUT);
  // pinMode(echoPin, INPUT);
  
  digitalWrite(fanRelayPin, HIGH);
  digitalWrite(ledPin, LOW);
  digitalWrite(irrigationRelayPin, HIGH);
  dht.begin();
}

void checkFirebaseControls() {
  HTTPClient http;
  String url_controls = "https://" + String(FIREBASE_HOST) + "/actuator_controls.json";
  
  // Usamos un cliente no seguro para https (simple)
  std::unique_ptr<BearSSL::WiFiClientSecure> client(new BearSSL::WiFiClientSecure);
  client->setInsecure();
  
  Serial.println("Consultando controles de actuadores...");
  if (http.begin(*client, url_controls)) { // Usa el cliente seguro
    int httpCode = http.GET();
    
    if (httpCode == 200) {
      String payload = http.getString();
      Serial.println("Comandos recibidos: " + payload);
      
      StaticJsonDocument<200> doc;
      DeserializationError error = deserializeJson(doc, payload);

      if (error) {
        Serial.print("deserializeJson() falló: ");
        Serial.println(error.c_str());
        http.end();
        return;
      }

      // Lógica de control para Ventilador (fan)
      if (doc.containsKey("fan")) {
        if (doc["fan"] == true) {
          digitalWrite(fanRelayPin, LOW); // ON (Active LOW)
        } else {
          digitalWrite(fanRelayPin, HIGH); // OFF (Active LOW)
        }
      }

      // Lógica de control para Calefactor (heater)
      if (doc.containsKey("heater")) {
        if (doc["heater"] == true) {
          digitalWrite(ledPin, HIGH); // ON (Active HIGH)
        } else {
          digitalWrite(ledPin, LOW); // OFF (Active HIGH)
        }
      }

      // <-- CAMBIO: Lógica de control para Riego (irrigation)
      if (doc.containsKey("irrigation")) {
        if (doc["irrigation"] == true) {
          Serial.println("Activando Riego (Pin LOW)");
          digitalWrite(irrigationRelayPin, LOW); // ON (Active LOW)
        } else {
          Serial.println("Desactivando Riego (Pin HIGH)");
          digitalWrite(irrigationRelayPin, HIGH); // OFF (Active LOW)
        }
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
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("\nConexión WiFi perdida. Intentando reconectar...");
    connectToWifi();
  }

  // --- Ciclo de Lectura de Sensores ---
  Serial.println("\n--- Ciclo de Sensores ---");

  digitalWrite(ledPin, HIGH);
  digitalWrite(fanRelayPin, LOW);
  delay(5000);
  digitalWrite(ledPin, LOW);
  digitalWrite(fanRelayPin, HIGH);
  delay(2000);

  Serial.println("\n--- Ciclo de Sensores ---");

  float h = dht.readHumidity();
  float t = dht.readTemperature();

  if (isnan(h) || isnan(t)) {
    Serial.println("Error al leer el sensor DHT11.");
  } else {
    Serial.print("Humedad: "); Serial.print(h);
    Serial.print(" %  |  Temperatura: "); Serial.print(t); Serial.println(" °C");
  }

  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);
  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);
  duration = pulseIn(echoPin, HIGH);
  distance = duration * 0.034 / 2;
  Serial.print("Distancia: "); Serial.print(distance); Serial.println(" cm");

  int soilMoistureValue = analogRead(soilSensorPin); 
  Serial.print("Humedad del Suelo (Analógico): ");
  Serial.println(soilMoistureValue);

  int lightValue = analogRead(lightSensorPin);
  Serial.print("Intensidad de Luz (Analógico): ");
  Serial.println(lightValue);

  if (!isnan(h) && !isnan(t)) {
    sendDataToFirebase(t, h, lightValue, soilMoistureValue);
  }

  // --- Ciclo de Control ---
  checkFirebaseControls();

  delay(10000);
}