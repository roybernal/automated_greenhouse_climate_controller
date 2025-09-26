/*
--------------------------------------------------------------------
Project: Automated Greenhouse Climate Controller
--------------------------------------------------------------------
File: DHT11.ino
--------------------------------------------------------------------
Description: This prototype demonstrates how to parse and clean
the data received from the DHT sensor, formatting it for clear
and reliable use. This completes task 1.6.
--------------------------------------------------------------------
Authors:
- Lucio Emiliano Ruiz Sepulveda
- Rodrigo Samuel Bernal Moreno
- Enrique Alfonso Gracian Castro
- Jesus Perez Rodriguez
--------------------------------------------------------------------
Last modification: September 25, 2025
--------------------------------------------------------------------
*/

// Libraries
#include <DHT.h>

// Constants
#define DHTPIN 2      // Pin where the sensor is connected
#define DHTTYPE DHT22 // Sensor Type
DHT dht(DHTPIN, DHTTYPE);

void setup() {
  Serial.begin(9600);
  Serial.println("DHT22 Test - Data Parsing & Cleanup");
  dht.begin();
}

void loop() {
  delay(2000);

  // --- 1. Parsing ---
  float humidity_raw = dht.readHumidity();
  float temperature_raw = dht.readTemperature(); // in Celsius

  // Check if any reads failed and exit early (to try again).
  if (isnan(humidity_raw) || isnan(temperature_raw)) {
    Serial.println("Failed to read from DHT sensor!");
    return;
  }

  // --- 2. Cleanup ---
  String humidity_clean = String(humidity_raw, 1);
  String temperature_clean = String(temperature_raw, 1);
  
  // --- 3. Using the Clean Data ---
  Serial.print("Humidity: ");
  Serial.print(humidity_clean); // Print the clean string
  Serial.print(" %");           // Add units
  
  Serial.print(", Temp: ");
  Serial.print(temperature_clean); // Print the clean string
  Serial.print(" Celsius");        // Add units
  Serial.println();
}