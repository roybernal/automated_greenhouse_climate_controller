/*
--------------------------------------------------------------------
Project: Automated Greenhouse Climate Controller
--------------------------------------------------------------------
File: actuator_test.ino
--------------------------------------------------------------------
Description: This prototype tests the control of two actuators
(a fan and a light/heater) using a 2-channel relay module
connected to a NodeMCU ESP8266.
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

// --- Pin Configuration ---
// Define which pins on the NodeMCU are connected to the relay inputs
#define RELAY_PIN_1 D5 // Relay for the Fan
#define RELAY_PIN_2 D6 // Relay for the Heater/Light

void setup() {
  // Initialize Serial Monitor for debugging
  Serial.begin(115200);
  Serial.println("Actuator Control Test");

  // Configure the relay pins as OUTPUTs
  pinMode(RELAY_PIN_1, OUTPUT);
  pinMode(RELAY_PIN_2, OUTPUT);

  // --- Initial State ---
  // Relays are often "active LOW", meaning a LOW signal turns them ON.
  // So, we set them to HIGH initially to ensure they are OFF.
  digitalWrite(RELAY_PIN_1, HIGH);
  digitalWrite(RELAY_PIN_2, HIGH);
}

void loop() {
  // --- Test Sequence ---

  // Turn ON the Fan (Relay 1)
  Serial.println("Turning Fan ON");
  digitalWrite(RELAY_PIN_1, LOW); // LOW turns the relay ON
  delay(5000); // Wait for 5 seconds

  // Turn OFF the Fan (Relay 1)
  Serial.println("Turning Fan OFF");
  digitalWrite(RELAY_PIN_1, HIGH); // HIGH turns the relay OFF
  delay(2000); // Wait for 2 seconds

  // Turn ON the Light/Heater (Relay 2)
  Serial.println("Turning Light/Heater ON");
  digitalWrite(RELAY_PIN_2, LOW); // LOW turns the relay ON
  delay(5000); // Wait for 5 seconds

  // Turn OFF the Light/Heater (Relay 2)
  Serial.println("Turning Light/Heater OFF");
  digitalWrite(RELAY_PIN_2, HIGH); // HIGH turns the relay OFF
  delay(2000); // Wait for 2 seconds

  Serial.println("--- Test cycle complete. Repeating. ---");
}