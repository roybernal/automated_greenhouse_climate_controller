/*
Project: Light sensor (LDR) operation test
Author: Enrique Alfonso Gracián Castro
Day: 22/09/2025
Description:
Code to read the value of a light sensor and display it
on the serial monitor.
*/

// Defines the analog pin to which the light sensor is connected
const int sensorPin = A0; // Analog pin A0

void setup() {
  // Starts serial communication at 9600 baud to view the data
  Serial.begin(9600);
  Serial.println("Testing light sensor...");
}

void loop() {
  // Reads the sensor value on analog pin A0
  int lightValue = analogRead(sensorPin);

  // Displays the read value on the serial monitor
  Serial.print("Light sensor value: ");
  Serial.println(lightValue);

  // Waits a moment before the next reading
  delay(500); // Reads the data every half second
}
