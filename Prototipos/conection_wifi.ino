/*
--------------------------------------------------------------------
Project: Automated Greenhouse Climate Controller
--------------------------------------------------------------------
File: wifi_connection_test.ino
--------------------------------------------------------------------
Description: This prototype focuses on establishing a connection
to a WiFi network and implementing an automatic reconnection
logic in case the signal is lost.
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

#include <ESP8226WiFi.h>

const char* WIFI_SSID = "OnePlus12";
const char* WIFI_PASSWORD = "12345677";

void setup() {
  Serial.begin(115200);
  delay(10);
  
  connectToWifi();
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("\nWiFi connection lost. Attempting to reconnect...");
    connectToWifi();
  }
  
  delay(5000); 
  Serial.println("Device is running. WiFi Status: Connected.");
}

void connectToWifi() {
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  
  Serial.print("Establishing connection to ");
  Serial.print(WIFI_SSID);

  int retryCounter = 0;
  while (WiFi.status() != WL_CONNECTED && retryCounter < 40) {
    delay(500);
    Serial.print(".");
    retryCounter++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWiFi connection successful!");
    Serial.print("Assigned IP address: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\nCould not connect to WiFi network. Will retry in the next cycle.");
  }
}