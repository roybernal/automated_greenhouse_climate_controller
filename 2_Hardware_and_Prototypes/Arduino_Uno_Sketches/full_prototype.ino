/*
Project: Sensor and Actuator Control System
Author: Enrique A. Gracián Castro
Date: 25/09/2025
Description:
This code integrates the reading of multiple sensors (DHT11, ultrasonic, and LDR),
as well as the control of an LED and a relay (fan). The results are displayed
on the serial monitor for supervision.
*/

// ---------------------------
// Libraries
// ---------------------------
#include "DHT.h"              // Library for the DHT sensor
#include <Adafruit_Sensor.h>  // Universal Adafruit library

// ---------------------------
// Pin Definitions
// ---------------------------
#define DHTPIN 2              // DHT11 sensor pin
#define DHTTYPE DHT11         // DHT sensor type
const int ledPin = 13;        // LED pin (changed from 2 to avoid conflict)
const int fanPin = 7;         // Relay/fan pin
const int sensorPin = A0;     // Analog pin for the light sensor (LDR)
const int trigPin = 8;        // TRIG pin of the ultrasonic sensor
const int echoPin = 9;        // ECHO pin of the ultrasonic sensor

// ---------------------------
// Global Variables
// ---------------------------
long duration;                // Duration of the ultrasonic pulse
int distance;                 // Calculated distance in cm

// Initialize DHT object
DHT dht(DHTPIN, DHTTYPE); 

// ---------------------------
// Initial Setup
// ---------------------------
void setup() {
  // Serial communication at 9600 baud
  Serial.begin(9600);
  Serial.println("Starting integrated system...");
  Serial.println("Checking sensors and actuators...");

  // Pin configuration
  pinMode(ledPin, OUTPUT);     
  pinMode(fanPin, OUTPUT);     
  pinMode(trigPin, OUTPUT);    
  pinMode(echoPin, INPUT);     

  // Initialize DHT sensor
  dht.begin();
}

// ---------------------------
// Main Loop
// ---------------------------
void loop() {
  // --- LED (blinking) ---
  digitalWrite(ledPin, HIGH);  // Turn LED on
  delay(1000);                 
  digitalWrite(ledPin, LOW);   // Turn LED off
  delay(1000);                 

  // --- Fan (relay) ---
  digitalWrite(fanPin, HIGH);  // Activate the fan

  // --- DHT11 Sensor (temperature and humidity) ---
  delay(2000); // Recommended interval between readings
  float h = dht.readHumidity();
  float t = dht.readTemperature();

  if (isnan(h) || isnan(t)) { 
    Serial.println("Error reading from DHT11 sensor."); 
  } else {
    Serial.print("Humidity: ");
    Serial.print(h);
    Serial.print(" %  |  Temperature: ");
    Serial.print(t);
    Serial.println(" °C");
  }

  // --- Ultrasonic Sensor (distance) ---
  digitalWrite(trigPin, LOW);  
  delayMicroseconds(2); 
  digitalWrite(trigPin, HIGH); 
  delayMicroseconds(10); 
  digitalWrite(trigPin, LOW);  

  duration = pulseIn(echoPin, HIGH);
  distance = duration * 0.034 / 2; // Conversion to centimeters

  Serial.print("Distance: ");
  Serial.print(distance);
  Serial.println(" cm");

  // --- Light Sensor (LDR) ---
  int lightValue = analogRead(sensorPin);
  Serial.print("Light intensity (analog value): ");
  Serial.println(lightValue);
  
  delay(500); // Pause before the next iteration
}