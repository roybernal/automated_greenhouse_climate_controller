/*
Project: Sensor and Actuator Control System with ESP8266
Author: Enrique A. Gracián Castro
Migration Date: 06/10/2025
Description:
This code, migrated for ESP8266, integrates the reading of multiple sensors
(DHT11, ultrasonic, and light), controls an LED and a fan through a relay,
connects to a WiFi network, and sends the sensor data to Firebase in the
structured format required by the web dashboard.
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
const char* WIFI_SSID = "upaep wifi";
String FIREBASE_HOST = "agcroller-default-rtdb.firebaseio.com";

// --------------------------- 
// Pin Definitions
// --------------------------- 
  // Tolerable limit
const float TEMP_HIGH_LIMIT = 41.0; // Upper temperature limit in °C
const float TEMP_LOW_LIMIT = 0.0;  // Lower temperature limit in °C
  // Ideal limit
const float TEMP_IDEAL_LOWERLIMIT = 20.0; // Lower ideal temperature limit in °C
const float TEMP_IDEAL_UPPERLIMIT = 35.0;  // Upper ideal temperature limit in °C

// --------------------------- 
// Pin Definitions
// --------------------------- 
#define DHTPIN D2
#define DHTTYPE DHT11

const int ledPin = D1;
const int fanRelayPin = D6;
// CORRECTION: The LDR light sensor is analog, it must be on pin A0
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
// ADAPTED FUNCTION to Send Data to Firebase
// --------------------------- 
// CORRECTION: The final parameter is now 'lightValue' (an integer)
void sendDataToFirebase(float temp, float hum, int dist, int lightValue) {
  if (WiFi.status() == WL_CONNECTED) {
    std::unique_ptr<BearSSL::WiFiClientSecure> client(new BearSSL::WiFiClientSecure);
    client->setInsecure();
    HTTPClient http;

    // --- 1. SEND SENSOR DATA to /latest_readings ---
    String url_readings = "https://" + FIREBASE_HOST + "/latest_readings.json";
    if (http.begin(*client, url_readings)) {
      http.addHeader("Content-Type", "application/json");

      // CORRECTION: We use 'lightValue' for 'light_received'
      String jsonReadings = "{\"temperature\":\"" + String(temp, 1) +
                            "\",\"humidity\":\"" + String(hum, 1) +
                            "\",\"light_received\":\"" + String(lightValue) + // <-- HERE IS THE CHANGE
                            "\",\"timestamp\":\"" + String(millis()) + "\"}";

      Serial.println("Sending to /latest_readings: " + jsonReadings);
      int httpCode = http.PUT(jsonReadings);

      if (httpCode == 200) {
        Serial.println("-> latest_readings updated successfully.");
      } else {
        Serial.printf("[HTTP] Error updating latest_readings. Code: %d\n", httpCode);
      }
      http.end();
    }

    // --- 2. SEND ACTUATOR STATUS to /actuator_status ---
    String url_actuators = "https://" + FIREBASE_HOST + "/actuator_status.json";
    if (http.begin(*client, url_actuators)) {
      http.addHeader("Content-Type", "application/json");
      String fanStatus = (digitalRead(fanRelayPin) == LOW) ? "true" : "false";
      String heaterStatus = (digitalRead(ledPin) == HIGH) ? "true" : "false";
      String jsonActuators = "{\"fan\":\"" + fanStatus + "\",\"heater\":\"" + heaterStatus + "\"}";
      Serial.println("Sending to /actuator_status: " + jsonActuators);
      int httpCode = http.PUT(jsonActuators);
      if (httpCode == 200) {
        Serial.println("-> actuator_status updated successfully.");
      } else {
        Serial.printf("[HTTP] Error updating actuator_status. Code: %d\n", httpCode);
      }
      http.end();
    }
  } else {
    Serial.println("Error: No WiFi connection to send data.");
  }
}

// --------------------------- 
// WiFi Connection Function (No changes)
// --------------------------- 
void connectToWifi() {
  WiFi.begin(WIFI_SSID);
  Serial.print("Establishing connection with ");
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
// Initial Setup (setup) (No changes)
// --------------------------- 
void setup() {
  Serial.begin(9600);
  Serial.println("Starting integrated system on ESP8266...");
  connectToWifi();
  pinMode(ledPin, OUTPUT);
  pinMode(fanRelayPin, OUTPUT);
  pinMode(trigPin, OUTPUT);
  pinMode(echoPin, INPUT);
  // The A0 pin does not need pinMode for analog reading
  digitalWrite(fanRelayPin, HIGH);
  digitalWrite(ledPin, LOW);
  dht.begin();
}

// --------------------------- 
// Main Loop (loop)
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

  // read the sensors.
  float h = dht.readHumidity();
  float t = dht.readTemperature();
  
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);
  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);
  duration = pulseIn(echoPin, HIGH);
  distance = duration * 0.034 / 2;
  Serial.print("Distance: "); Serial.print(distance); Serial.println(" cm");

  // CORRECTION: Read the analog value of the light sensor
  int lightValue = analogRead(lightSensorPin);
  Serial.print("Light Intensity (Analog): ");
  Serial.println(lightValue);

  if (isnan(h) || isnan(t)) {
    Serial.println("Error reading DHT11 sensor.");
  } else {
    Serial.print("Humidity: "); Serial.print(h);
    Serial.print(" %  |  Temperature: "); Serial.print(t); Serial.println(" °C");
    applyRulesToActuators(t, h);
    sendDataToFirebase(t, h, distance, lightValue);
  }

  delay(10000);
}

void applyRulesToActuators(float temperature, float humidity) {
  bool fanState = false;
  if(temperature >= TEMP_HIGH_LIMIT) {
    // temperature too high, Danger.
    Serial.println("DANGER: Temperature too high! Turn it on, Otto, turn it on!");
    digitalWrite(fanRelayPin, LOW); // Turn on the fan
    fanState = true;
  } else if(temperature <= TEMP_LOW_LIMIT) {
    // temperature too low, Danger.
    Serial.println("DANGER: Temperature too low! Turn it off, Otto, turn it off!");
    digitalWrite(fanRelayPin, HIGH); // Make sure to turn off the fan
    fanState = false;
  } else if(temperature > TEMP_IDEAL_UPPERLIMIT && temperature < TEMP_HIGH_LIMIT) {
    // temperature higher than optimal, recommendation.
    Serial.println("WARNING: High temperature although within the admissible range. \n\tRecommendation: Turn on the fan.");
    digitalWrite(fanRelayPin, LOW); // Turn on the fan
    fanState = true;
  } else if(temperature < TEMP_IDEAL_LOWERLIMIT && temperature > TEMP_LOW_LIMIT) {
    // temperature higher than optimal, recommendation.
    Serial.println("WARNING: Low temperature although within the admissible range. \n\tRecommendation: Turn off the fan.");
    digitalWrite(fanRelayPin, HIGH); // Turn off the fan
    fanState = false;
  } else {
    // adequate temperature
    Serial.println("UPDATE: Optimal temperature. Leave it like that, Otto.");
    digitalWrite(fanRelayPin, HIGH); // Turn off the fan
    fanState = false;
  }

  if (fanState) {
    Serial.println("Fan Status: ON");
  } else {
    Serial.println("Fan Status: OFF");
  }
}
