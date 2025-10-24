/*
Project: DHT22 sensor operation test
Author: Enrique A Gracian Castro
Day: 22/09/2025
Description:
Test code to read the temperature and humidity
of the DHT11 sensor and display them on the serial monitor.
*/

#include "DHT.h" // DHT sensor library
#include <Adafruit_Sensor.h> // Universal Adafruit library

// Defines the pin where you connected the sensor and the sensor type
#define DHTPIN 2 // Pin to which the sensor data cable is connected.
#define DHTTYPE DHT11 // Defines the sensor type: DHT11

// Initializes the DHT object with the defined pin and sensor type
DHT dht(DHTPIN, DHTTYPE);

/*
Function to initialize variables and components
*/
void setup() {
  // Starts serial communication at 9600 baud to view the data
  Serial.begin(9600);
  Serial.println("Testing DHT11 sensor");

  // Starts the DHT sensor
  dht.begin();
}

/*
Function that runs repeatedly
*/
void loop() {
  // Waits 2 seconds between readings to avoid saturating the sensor
  delay(2000);

  // Reads the temperature and humidity
  float h = dht.readHumidity();
  float t = dht.readTemperature();

  // Checks if the readings were successful (they are not NaN, "Not a Number")
  if (isnan(h) || isnan(t)) {
    Serial.println(h);
    Serial.println(t);
    Serial.println("Error reading DHT sensor");
    return; // Skips the rest of the loop and starts over
  }

  // Displays the read values on the serial monitor
  Serial.print("Humidity: ");
  Serial.print(h);
  Serial.print(" %");
  Serial.print("  Temperature: ");
  Serial.print(t);
  Serial.println(" *C");
}
