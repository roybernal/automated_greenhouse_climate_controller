/*
Project: LED Test
Author: Enrique A Gracian Castro
Date: 22/09/2025
Description:
Code to verify that a digital pin on the Arduino
works correctly by turning an LED on and off.
*/

// Define the pin the LED is connected to
const int ledPin = 2;

/*
Function to initialize variables
*/
void setup() {
    // Set the LED pin as an OUTPUT
    pinMode(ledPin, OUTPUT);
}

/*
Function that runs repeatedly
*/
void loop() {
  // Turn the LED on
  digitalWrite(ledPin, HIGH); 
  delay(1000); // Wait for 1 second

  // Turn the LED off
  digitalWrite(ledPin, LOW); 
  delay(1000); // Wait for 1 second
}