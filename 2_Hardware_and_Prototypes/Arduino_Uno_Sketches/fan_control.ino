/*
Project: Relay Control with Arduino
Author: Enrique A Gracian Castro
Date: 25/09/2025
Description:
Code to turn on a fan using a relay
connected to a digital pin on the Arduino.
*/

// Define the digital pin the relay is connected to
const int fanPin = 7;

/*
Function to initialize variables and components
*/
void setup() {
  // Initialize the fan pin as an output
  pinMode(fanPin, OUTPUT);
}

/*
Function that runs repeatedly
*/
void loop() {
  // Set the fan pin to HIGH to activate the relay and turn it on.
  // A HIGH signal on the Arduino pin sends 5V, energizing the relay's coil.
  // This closes the relay's internal switch, allowing current to flow
  // to the fan.
  digitalWrite(fanPin, HIGH);

  // The fan will remain on. This simple code does not turn it off.
  // The loop() function will continue to run, keeping the pin HIGH.
}