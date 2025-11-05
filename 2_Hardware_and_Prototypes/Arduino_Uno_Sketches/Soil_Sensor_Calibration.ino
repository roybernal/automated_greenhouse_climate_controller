/*
--------------------------------------------------------------------
Project: Automated Greenhouse Climate Controller
--------------------------------------------------------------------
File: Soil_Sensor_Percent.ino
--------------------------------------------------------------------
Description: Reads the soil moisture sensor, calibrates the
raw value, and converts it to a percentage (0% = dry, 100% = wet).
--------------------------------------------------------------------
Authors:
- Lucio Emiliano Ruiz Sepulveda
- Rodrigo Samuel Bernal Moreno
- Enrique Alfonso Gracian Castro
- Jesus Perez Rodriguez
--------------------------------------------------------------------
Last modification: November 4, 2025
--------------------------------------------------------------------
*/

// --- 1. CALIBRATION ---
const int DRY_VALUE = 950; 
const int WET_VALUE = 420; 

// --- 2. PIN DEFINITION ---
const int SOIL_SENSOR_PIN = A0; 

void setup() {
  Serial.begin(9600);
  Serial.println("Soil Moisture Sensor (Calibrated %)");
}

void loop() {
  // Read the raw analog value
  int rawValue = analogRead(SOIL_SENSOR_PIN);

  // --- 3. CONVERT TO PERCENTAGE ---
  // Use the map() function to convert the raw range to a percentage range
  // Note: We map from DRY to WET (950 to 420) -> 0% to 100%
  int moisturePercent = map(rawValue, DRY_VALUE, WET_VALUE, 0, 100);

  // Use constrain() to make sure the value doesn't go below 0% or above 100%
  moisturePercent = constrain(moisturePercent, 0, 100);

  // Print the final, easy-to-read percentage
  Serial.print("Raw: ");
  Serial.print(rawValue);
  Serial.print("  |  Moisture: ");
  Serial.print(moisturePercent);
  Serial.println("%");
  
  delay(1000);
}