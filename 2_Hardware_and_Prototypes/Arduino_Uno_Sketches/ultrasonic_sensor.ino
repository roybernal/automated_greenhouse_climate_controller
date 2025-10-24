/*
Project: Distance Measurement with HC-SR04 Ultrasonic Sensor
Author: Enrique A. Gracián Castro
Date: 25/09/2025
Description:
Code to measure the distance to an object using the
HC-SR04 ultrasonic sensor and display it on the serial monitor.
*/

// Define the pins for the ultrasonic sensor
const int trigPin = 8;
const int echoPin = 9;

// Define variables for duration and distance
long duration;
int distance;

// ---------------------------
// Initial Setup
// ---------------------------
void setup() {
  // Start serial communication at 9600 baud to see the output
  Serial.begin(9600);

  // Configure trigPin as OUTPUT and echoPin as INPUT
  pinMode(trigPin, OUTPUT);
  pinMode(echoPin, INPUT);
}

// ---------------------------
// Main Loop
// ---------------------------
void loop() {
  // Clear the trigPin
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);

  // Send a 10-microsecond HIGH pulse to activate the sensor
  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);

  // Read the echoPin, which returns the sound wave travel time in microseconds
  duration = pulseIn(echoPin, HIGH);

  // Calculate the distance based on the speed of sound
  // Speed of sound = 340 m/s or 0.034 cm/µs
  // The distance is half the duration because the sound wave travels and returns
  distance = duration * 0.034 / 2;

  // Display the distance on the serial monitor
  Serial.print("Distance: ");
  Serial.print(distance);
  Serial.println(" cm");

  delay(1000); // Wait a second before the next reading
}
