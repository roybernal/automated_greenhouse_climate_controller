/*
Project: Relay control with Arduino
Author: Enrique A Gracian Castro
Day: 25/09/2025
Description:
Code to turn on a fan using a relay
connected to a digital pin of Arduino.
(A led was used because it does not have a fan)
*/

// Defines the digital pin to which the relay is connected
const int fanPin = 7;

/*
Function to initialize variables and components
*/
void setup() {
  // Initializes the fan pin as an output
  pinMode(fanPin, OUTPUT);
}

/*
Function that runs repeatedly
*/
void loop() {
  // Sets the fan pin to HIGH to activate the relay and turn it on
  // A HIGH signal on the Arduino pin sends 5V, energizing the relay coil.
  // This closes the internal switch of the relay, allowing current to flow
  // towards the fan.
  digitalWrite(fanPin, HIGH);

  // The fan will remain on. This simple code will not turn it off.
  // The loop() function will continue to run, keeping the pin HIGH.
}
