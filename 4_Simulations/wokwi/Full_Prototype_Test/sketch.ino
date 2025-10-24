/*
Project: Sensor and actuator control system
Author: Enrique A Gracian Castro
Day: 25/09/2025
Description:
Combined code to read data from sensors (DHT11, ultrasonic, LDR),
control an LED and a relay, and display the results on the serial monitor.
*/

// Libraries
#include "DHT.h" // DHT sensor library [cite: 19]
#include <Adafruit_Sensor.h> // Universal Adafruit library [cite: 19]

// Pin definitions and global variables
#define DHTPIN 2 // DHT11 sensor pin [cite: 20]
#define DHTTYPE DHT11 // Sensor type: DHT11 [cite: 21]
const int ledPin = 13; // Pin for the LED (changed from 2 to avoid conflict) [cite: 2]
const int fanPin = 7; // Pin for the relay/fan [cite: 13]
const int sensorPin = A0; // Analog pin for the light sensor (LDR) [cite: 7]
const int trigPin = 9; // Ultrasonic sensor pin [cite: 30]
const int echoPin = 10; // Ultrasonic sensor pin [cite: 30]

// Variables for the ultrasonic sensor
long duration; 
int distance; 

// Initializes the DHT object with the defined pin and sensor type
DHT dht(DHTPIN, DHTTYPE); 

/*
Function to initialize variables and components
*/
void setup() {
  // Starts serial communication at 9600 baud to see the data [cite: 8, 22, 32]
  Serial.begin(9600);
  Serial.println("Testing integrated system...");
  Serial.println("Testing DHT11 sensor"); 
  Serial.println("Testing light sensor..."); 

  // Configures the pins as input or output
  pinMode(ledPin, OUTPUT); // LED pin as output [cite: 3]
  pinMode(fanPin, OUTPUT); // Fan pin as output [cite: 14]
  pinMode(trigPin, OUTPUT); // Ultrasonic sensor pin as output [cite: 33]
  pinMode(echoPin, INPUT); // Ultrasonic sensor pin as input [cite: 33]

  // Starts the DHT sensor [cite: 23]
  dht.begin();
}

/*
Function that runs repeatedly
*/
void loop() {
  // --- LED Section (Turns on and off) ---
  digitalWrite(ledPin, HIGH); // Turns on the LED [cite: 4]
  delay(1000); // Waits for 1 second [cite: 5]
  digitalWrite(ledPin, LOW); // Turns off the LED [cite: 5]
  delay(1000); // Waits for 1 second [cite: 5]

  // --- Fan section (Activates the relay) ---
  digitalWrite(fanPin, HIGH); // Activates the relay to turn on the fan [cite: 16]
  // The fan will remain on. [cite: 17, 18]

  // --- DHT11 sensor section ---
  // Waits 2 seconds between readings [cite: 24]
  delay(2000);
  float h = dht.readHumidity(); // Reads the humidity [cite: 25]
  float t = dht.readTemperature(); // Reads the temperature [cite: 25]

  // Checks if the readings were successful
  if (isnan(h) || isnan(t)) { 
    Serial.println("Error reading DHT sensor"); 
  } else {
    // Displays the read values [cite: 28]
    Serial.print("Humidity: ");
    Serial.print(h);
    Serial.print(" %");
    Serial.print("  Temperature: ");
    Serial.print(t);
    Serial.println(" *C");
  }

  // --- Ultrasonic sensor section ---
  digitalWrite(trigPin, LOW); // Clears the pulse [cite: 34]
  delayMicroseconds(2); 
  digitalWrite(trigPin, HIGH); // Sends a 10 microsecond pulse [cite: 35]
  delayMicroseconds(10); 
  digitalWrite(trigPin, LOW); 

  // Reads the duration of the echo pulse [cite: 36]
  duration = pulseIn(echoPin, HIGH);

  // Calculates the distance [cite: 37]
  distance = duration * 0.034 / 2; 

  // Displays the distance on the serial monitor [cite: 38]
  Serial.print("Distance: ");
  Serial.print(distance);
  Serial.println(" cm");

  // --- Light sensor section (LDR) ---
  int lightValue = analogRead(sensorPin); // Reads the sensor value on analog pin A0 [cite: 9]
  Serial.print("Light sensor value: "); // Displays the value [cite: 10]
  Serial.println(lightValue);
  
  delay(500); // Waits half a second before the next reading [cite: 11]
}
