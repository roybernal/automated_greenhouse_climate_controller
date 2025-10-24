/*
Project: Sensor and Actuator Control System with ESP8266
Authors:
- Lucio Emiliano Ruiz Sepulveda
- Rodrigo Samuel Bernal Moreno
- Enrique Alfonso Gracian Castro
- Jesus Perez Rodriguez
Migration Date: 06/10/2025
Description:
This code integrates sensor reading, sends real-time data (PUT),
and logs a history of readings (POST) to Firebase.
*/

// --------------------------- 
// Libraries
// --------------------------- 
#include <ESP8266WiFi.h>
#include "DHT.h"
#include <ESP8266HTTPClient.h>
#include <WiFiClientSecure.h>

// --------------------------- 
// Credentials and URL
// --------------------------- 
const char* WIFI_SSID = "Totalplay-51A8";
const char* WIFI_PASSWORD = "51A888D6R3V227nU";
String FIREBASE_HOST = "agcroller-default-rtdb.firebaseio.com";

// --------------------------- 
// Pin Definitions
// --------------------------- 
#define DHTPIN D2
#define DHTTYPE DHT11

const int ledPin = D1;
const int fanRelayPin = D6;
const int lightSensorPin = A0;
const int trigPin = D3;
const int echoPin = D4;

// --------------------------- 
// Global Variables
// --------------------------- 
long duration;
int distance;
DHT dht(DHTPIN, DHTTYPE);

// --------------------------- 
// Send Data to Firebase
// --------------------------- 
void sendDataToFirebase(float temp, float hum, int lightValue) {
  if (WiFi.status() == WL_CONNECTED) {
    std::unique_ptr<BearSSL::WiFiClientSecure> client(new BearSSL::WiFiClientSecure);
    client->setInsecure();
    HTTPClient http;

    // --- 1. UPDATE REAL-TIME DATA (PUT) ---
    String url_readings = "https://" + FIREBASE_HOST + "/latest_readings.json";
    if (http.begin(*client, url_readings)) {
      http.addHeader("Content-Type", "application/json");
      String jsonReadings = "{\"temperature\":\"" + String(temp, 1) +
                            "\",\"humidity\":\"" + String(hum, 1) +
                            "\",\"light_received\":\"" + String(lightValue) +
                            "\",\"timestamp\":\"" + String(millis()) + "\"}";
      int httpCode = http.PUT(jsonReadings);
      if (httpCode == 200) {
        Serial.println("-> latest_readings updated successfully.");
      } else {
        Serial.printf("[HTTP] Error updating latest_readings. Code: %d\n", httpCode);
      }
      http.end();
    }

    // --- 2. UPDATE ACTUATOR STATUS (PUT) ---
    String url_actuators = "https://" + FIREBASE_HOST + "/actuator_status.json";
    if (http.begin(*client, url_actuators)) {
      http.addHeader("Content-Type", "application/json");
      String fanStatus = (digitalRead(fanRelayPin) == LOW) ? "true" : "false";
      String heaterStatus = (digitalRead(ledPin) == HIGH) ? "true" : "false";
      String jsonActuators = "{\"fan\":\"" + fanStatus + "\",\"heater\":\"" + heaterStatus + "\"}";
      int httpCode = http.PUT(jsonActuators);
      if (httpCode == 200) {
        Serial.println("-> actuator_status updated successfully.");
      } else {
        Serial.printf("[HTTP] Error updating actuator_status. Code: %d\n", httpCode);
      }
      http.end();
    }

    // --- 3. SAVE HISTORICAL RECORD (POST) ---
    String url_logs = "https://" + FIREBASE_HOST + "/sensor_logs.json";
    if (http.begin(*client, url_logs)) {
      http.addHeader("Content-Type", "application/json");
      String jsonLog = "{\"temperature\":\"" + String(temp, 1) +
                       "\",\"humidity\":\"" + String(hum, 1) +
                       "\",\"light_received\":\"" + String(lightValue) +
                       "\",\"timestamp\":\"" + String(millis()) + "\"}";
      
      int httpCode = http.POST(jsonLog);

      if (httpCode == 200) {
        Serial.println("-> Historical record saved successfully in /sensor_logs.");
      } else {
        Serial.printf("[HTTP] Error saving historical record. Code: %d\n", httpCode);
      }
      http.end();
    }
    
  } else {
    Serial.println("Error: No WiFi connection to send data.");
  }
}

// --------------------------- 
// WiFi Connection Function
// --------------------------- 
void connectToWifi() {
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Establishing connection to ");
  Serial.print(WIFI_SSID);
  int retryCounter = 0;
  while (WiFi.status() != WL_CONNECTED && retryCounter < 40) {
    delay(500);
    Serial.print(".");
    retryCounter++;
  }
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWiFi connection successful!");
    Serial.print("Assigned IP address: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\nCould not connect to the WiFi network.");
  }
}

// --------------------------- 
// Initial Setup
// --------------------------- 
void setup() {
  Serial.begin(9600);
  Serial.println("Starting integrated system on ESP8266...");
  connectToWifi();
  pinMode(ledPin, OUTPUT);
  pinMode(fanRelayPin, OUTPUT);
  pinMode(trigPin, OUTPUT);
  pinMode(echoPin, INPUT);
  digitalWrite(fanRelayPin, HIGH);
  digitalWrite(ledPin, LOW);
  dht.begin();
}

// --------------------------- 
// Main Loop
// --------------------------- 
void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("\nWiFi connection lost. Attempting to reconnect...");
    connectToWifi();
  }

  // Actuator cycle (no changes)
  digitalWrite(ledPin, HIGH);
  digitalWrite(fanRelayPin, LOW);
  delay(5000);
  digitalWrite(ledPin, LOW);
  digitalWrite(fanRelayPin, HIGH);
  delay(2000);

  Serial.println("\n--- Sensor Cycle ---");

  float h = dht.readHumidity();
  float t = dht.readTemperature();
  if (isnan(h) || isnan(t)) {
    Serial.println("Error reading from DHT11 sensor.");
  } else {
    Serial.print("Humidity: "); Serial.print(h);
    Serial.print(" %  |  Temperature: "); Serial.print(t); Serial.println(" °C");
  }

  digitalWrite(trigPin, LOW);
  delayMicroseconds(2); 
  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);
  duration = pulseIn(echoPin, HIGH);
  distance = duration * 0.034 / 2;
  Serial.print("Distance: "); Serial.print(distance); Serial.println(" cm");

  int lightValue = analogRead(lightSensorPin);
  Serial.print("Light Intensity (Analog): ");
  Serial.println(lightValue);

  if (!isnan(h) && !isnan(t)) {
    sendDataToFirebase(t, h, lightValue);
  }

  delay(10000);
}
