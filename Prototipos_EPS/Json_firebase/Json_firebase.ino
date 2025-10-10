/*
Proyecto: Sistema de Control de Sensores y Actuadores con ESP8266
Autor: Enrique A. Gracián Castro
Fecha de migración: 06/10/2025
Descripción:
Este código, migrado para ESP8266, integra la lectura de múltiples sensores
(DHT11, ultrasónico y de luz), controla un LED y un ventilador a través de un relé,
se conecta a una red WiFi y envía los datos de los sensores a Firebase en el
formato estructurado que requiere el dashboard web.
*/

// ---------------------------
// Bibliotecas
// ---------------------------
#include <ESP8266WiFi.h>
#include "DHT.h"
#include <ESP8266HTTPClient.h>
#include <WiFiClientSecure.h>

// ---------------------------
// Credenciales y URL
// ---------------------------
const char* WIFI_SSID = "upaep wifi";
String FIREBASE_HOST = "agcroller-default-rtdb.firebaseio.com";

// ---------------------------
// Definición de Pines
// ---------------------------
#define DHTPIN D2
#define DHTTYPE DHT11

const int ledPin = D1; // Este representará el 'heater' en el dashboard
const int fanRelayPin = D6;
const int lightSensorPin = D5;
const int trigPin = D3;
const int echoPin = D4;

// ---------------------------
// Variables Globales
// ---------------------------
long duration;
int distance;
DHT dht(DHTPIN, DHTTYPE);

// ---------------------------
// FUNCIÓN ADAPTADA para Enviar Datos a Firebase
// ---------------------------
void sendDataToFirebase(float temp, float hum, int dist, int light) {
  if (WiFi.status() == WL_CONNECTED) {
    std::unique_ptr<BearSSL::WiFiClientSecure> client(new BearSSL::WiFiClientSecure);
    client->setInsecure();
    HTTPClient http;

    // --- 1. ENVIAR DATOS DE SENSORES a /latest_readings ---
    String url_readings = "https://" + FIREBASE_HOST + "/latest_readings.json";
    if (http.begin(*client, url_readings)) {
      http.addHeader("Content-Type", "application/json");

      // Creamos el JSON para los sensores
      String jsonReadings = "{\"temperature\":" + String(temp, 1) +
                            ",\"humidity\":" + String(hum, 1) +
                            ",\"light_received\":" + String(dist) + // Usamos distancia como 'light_received'
                            ",\"timestamp\":" + String(millis()) + "}";

      Serial.println("Enviando a /latest_readings: " + jsonReadings);
      int httpCode = http.PUT(jsonReadings); // Usamos PUT para sobreescribir

      if (httpCode == 200) {
        Serial.println("-> latest_readings actualizado con éxito.");
      } else {
        Serial.printf("[HTTP] Error actualizando latest_readings. Código: %d\n", httpCode);
      }
      http.end();
    }

    // --- 2. ENVIAR ESTADO DE ACTUADORES a /actuator_status ---
    String url_actuators = "https://" + FIREBASE_HOST + "/actuator_status.json";
    if (http.begin(*client, url_actuators)) {
      http.addHeader("Content-Type", "application/json");

      // Obtenemos el estado actual de los relés
      String fanStatus = (digitalRead(fanRelayPin) == LOW) ? "true" : "false";
      String heaterStatus = (digitalRead(ledPin) == HIGH) ? "true" : "false"; // ledPin simula el calentador

      // Creamos el JSON para los actuadores
      String jsonActuators = "{\"fan\":" + fanStatus + ",\"heater\":" + heaterStatus + "}";

      Serial.println("Enviando a /actuator_status: " + jsonActuators);
      int httpCode = http.PUT(jsonActuators); // Usamos PUT para sobreescribir

      if (httpCode == 200) {
        Serial.println("-> actuator_status actualizado con éxito.");
      } else {
        Serial.printf("[HTTP] Error actualizando actuator_status. Código: %d\n", httpCode);
      }
      http.end();
    }
  } else {
    Serial.println("Error: No hay conexión WiFi para enviar los datos.");
  }
}

// ---------------------------
// Función de Conexión WiFi (Sin cambios)
// ---------------------------
void connectToWifi() {
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

// ---------------------------
// Configuración Inicial (setup) (Sin cambios)
// ---------------------------
void setup() {
  Serial.begin(9600);
  Serial.println("Iniciando sistema integrado en ESP8266...");
  connectToWifi();
  pinMode(ledPin, OUTPUT);
  pinMode(fanRelayPin, OUTPUT);
  pinMode(trigPin, OUTPUT);
  pinMode(echoPin, INPUT);
  pinMode(lightSensorPin, INPUT);
  digitalWrite(fanRelayPin, HIGH);
  digitalWrite(ledPin, LOW);
  dht.begin();
}

// ---------------------------
// Bucle Principal (loop) (Sin cambios)
// ---------------------------
void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("\nConexión WiFi perdida. Intentando reconectar...");
    connectToWifi();
  }

  Serial.println("\n--- Ciclo de Actuadores ---");
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
    Serial.print("Humedad: ");
    Serial.print(h);
    Serial.print(" %  |  Temperatura: ");
    Serial.print(t);
    Serial.println(" °C");
  }

  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);
  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);
  duration = pulseIn(echoPin, HIGH);
  distance = duration * 0.034 / 2;
  Serial.print("Distancia: ");
  Serial.print(distance);
  Serial.println(" cm");

  int lightState = digitalRead(lightSensorPin);
  Serial.print("Estado del sensor de luz (Digital): ");
  Serial.println(lightState == HIGH ? "Luz Detectada" : "Oscuridad");

  if (!isnan(h) && !isnan(t)) {
    sendDataToFirebase(t, h, distance, lightState);
  }

  delay(10000);
}