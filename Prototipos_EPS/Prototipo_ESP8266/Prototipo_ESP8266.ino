/*
--------------------------------------------------------------------
Project: Automated Greenhouse Climate Controller
--------------------------------------------------------------------
File: Prototipo_ESP8266.ino
--------------------------------------------------------------------
Description: This functional code for the ESP8266 integrates the
reading of multiple sensors (DHT22, LDR), controls actuators
(fan, LED) via relays, connects to WiFi, and sends structured
data to Firebase to be displayed on the web dashboard.
--------------------------------------------------------------------
Authors:
- Lucio Emiliano Ruiz Sepulveda
- Rodrigo Samuel Bernal Moreno
- Enrique Alfonso Gracian Castro
- Jesus Perez Rodriguez
--------------------------------------------------------------------
Last modification: October 6, 2025
--------------------------------------------------------------------
*/

// --- 1. LIBRARIES ---
#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClient.h>
#include <ArduinoJson.h> 
#include "DHT.h"

// --- 2. CREDENTIALS & CONFIGURATION ---
const char* WIFI_SSID = "upaep wifi"; // Your WiFi network name

// Your Firebase project URL (without https://)
const char* FIREBASE_HOST = "agcroller-default-rtdb.firebaseio.com";
const String FIREBASE_AUTH = "YOUR_DATABASE_SECRET"; // Optional: if you have a database secret

// --- 3. PIN DEFINITIONS ---
#define DHT_PIN D2
#define DHT_TYPE DHT22

const int LIGHT_SENSOR_PIN = A0; // LDR/Photoresistor on the analog pin
const int FAN_RELAY_PIN = D5;
const int HEATER_RELAY_PIN = D6;

// --- 4. GLOBAL OBJECTS & VARIABLES ---
DHT dht(DHT_PIN, DHT_TYPE);
WiFiClient client;

unsigned long previousMillis = 0;
const long interval = 10000; // Interval to send data (10 seconds)

// --- 5. SETUP FUNCTION ---
void setup() {
  Serial.begin(115200);
  dht.begin();

  // Configure pin modes
  pinMode(FAN_RELAY_PIN, OUTPUT);
  pinMode(HEATER_RELAY_PIN, OUTPUT);
  digitalWrite(FAN_RELAY_PIN, HIGH); // Relays are active LOW, so HIGH is OFF
  digitalWrite(HEATER_RELAY_PIN, HIGH);

  connectToWifi();
}

// --- 6. MAIN LOOP ---
void loop() {
  // Check WiFi connection and reconnect if needed
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("\nWiFi connection lost. Attempting to reconnect...");
    connectToWifi();
  }

  unsigned long currentMillis = millis();
  if (currentMillis - previousMillis >= interval) {
    previousMillis = currentMillis;

    // Read all sensor data
    float temperature = dht.readTemperature();
    float humidity = dht.readHumidity();
    int light_level = analogRead(LIGHT_SENSOR_PIN);

    // Check for sensor read errors
    if (isnan(temperature) || isnan(humidity)) {
      Serial.println("Failed to read from DHT sensor!");
      return;
    }

    // Send the data to Firebase
    updateFirebase(temperature, humidity, light_level);

    checkFirebaseControls();
  }
}

// --- 7. WIFI CONNECTION FUNCTION ---
void connectToWifi() {
  WiFi.begin(WIFI_SSID);
  Serial.print("Connecting to ");
  Serial.print(WIFI_SSID);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi connection successful!");
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());
}

// --- 8. FIREBASE UPDATE FUNCTION ---
void updateFirebase(float temp, float hum, int light) {
  HTTPClient http;
  
  // --- Create JSON for latest_readings ---
  StaticJsonDocument<200> readingsDoc;
  readingsDoc["temperature"] = temp;
  readingsDoc["humidity"] = hum;
  readingsDoc["light_received"] = light;
  readingsDoc["timestamp"] = millis(); // Example timestamp

  String jsonReadings;
  serializeJson(readingsDoc, jsonReadings);

  // --- Send data to latest_readings ---
  String url_readings = "https://" + String(FIREBASE_HOST) + "/latest_readings.json";
  http.begin(client, url_readings);
  http.addHeader("Content-Type", "application/json");
  
  int httpCodeReadings = http.PUT(jsonReadings); // Use PUT to overwrite the latest data
  
  if (httpCodeReadings == 200) {
    Serial.println("Latest readings updated successfully.");
  } else {
    Serial.printf("Failed to update latest readings. HTTP code: %d\n", httpCodeReadings);
  }
  http.end();

  // --- You can add similar logic here to update 'actuator_status' ---
  // For example:
  // bool fan_status = (digitalRead(FAN_RELAY_PIN) == LOW); // LOW means ON
  // http.begin(...)
  // http.PUT("{\"fan\": " + String(fan_status) + "}")
  // ...
}

// --- 9. FIREBASE CONTROL CHECK FUNCTION ---
void checkFirebaseControls() {
  HTTPClient http;
  WiFiClient client; // Ensure client is defined

  String url_controls = "https://" + String(FIREBASE_HOST) + "/actuator_controls.json";
  
  Serial.println("Checking for actuator control commands...");
  http.begin(client, url_controls);
  
  int httpCode = http.GET();
  
  if (httpCode == 200) {
    String payload = http.getString();
    Serial.println("commands that are being received: " + payload);

    StaticJsonDocument<200> doc;
    DeserializationError error = deserializeJson(doc, payload);

    if (error) {
      Serial.print("deserializeJson() failed: ");
      Serial.println(error.c_str());
      http.end();
      return;
    }

    // logic to control actuators based on received commands
    // true means ON, false means OFF
    if (doc.containsKey("fan")) {
      if (doc["fan"] == true) {
        Serial.println("Turning ON fan (Pin LOW)");
        digitalWrite(FAN_RELAY_PIN, LOW); // ON (Active LOW)
      } else {
        Serial.println("turning OFF fan (Pin HIGH)");
        digitalWrite(FAN_RELAY_PIN, HIGH); // OFF (Active LOW)
      }
    }

    // Logic for heater
    if (doc.containsKey("heater")) {
      if (doc["heater"] == true) {
        Serial.println("Turning ON heater (Pin LOW)");
        digitalWrite(HEATER_RELAY_PIN, LOW); // ON (Active LOW)
      } else {
        Serial.println("Turning OFF heater (Pin HIGH)");
        digitalWrite(HEATER_RELAY_PIN, HIGH); // OFF (Active LOW)
      }
    }

  } else {
    Serial.printf("Error to get actuator controls. HTTP code: %d\n", httpCode);
  }
  
  http.end();
}