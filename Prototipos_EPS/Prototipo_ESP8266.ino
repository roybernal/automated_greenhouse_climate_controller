/*
Proyecto: Sistema de Control de Sensores y Actuadores con ESP8266
Autor: Enrique A. Gracián Castro (lógica base de Prototipo_completo.ino) 
Fecha de migración: 06/10/2025
Descripción:
Este código, migrado para ESP8266, integra la lectura de múltiples sensores
(DHT11, ultrasónico y de luz), controla un LED y un ventilador a través de un relé,
y se conecta a una red WiFi para una futura expansión a IoT.
*/

// ---------------------------
// Bibliotecas
// ---------------------------
#include <ESP8266WiFi.h>      // Biblioteca para la conexión WiFi del ESP8266
#include "DHT.h"              // Biblioteca para el sensor DHT 

// ---------------------------
// Credenciales WiFi
// ---------------------------
const char* WIFI_SSID = "TU_SSID";      // Reemplaza con el nombre de tu red WiFi
const char* WIFI_PASSWORD = "TU_CONTRASENA"; // Reemplaza con tu contraseña

// ---------------------------
// Definición de Pines (Según tu diagrama para NodeMCU)
// ---------------------------
#define DHTPIN D2             // Pin D2 para el sensor DHT11
#define DHTTYPE DHT11         // Tipo de sensor DHT 

const int ledPin = D1;        // Pin D1 para el LED
const int fanRelayPin = D6;   // Pin D6 para el relé del ventilador
const int lightSensorPin = D5;// Pin D5 para la salida digital (DAT) del sensor de luz
const int trigPin = D3;       // Pin D3 para TRIG del sensor ultrasónico
const int echoPin = D4;       // Pin D4 para ECHO del sensor ultrasónico

// ---------------------------
// Variables Globales
// ---------------------------
long duration;                // Duración del pulso ultrasónico
int distance;                 // Distancia calculada en cm

// Inicialización del objeto DHT
DHT dht(DHTPIN, DHTTYPE);

// ---------------------------
// Función de Conexión WiFi
// ---------------------------
void connectToWifi() {
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Estableciendo conexión con ");
  Serial.print(WIFI_SSID);

  int retryCounter = 0;
  while (WiFi.status() != WL_CONNECTED && retryCounter < 40) {
    delay(500);
    Serial.print(".");
    retryCounter++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n¡Conexión WiFi exitosa!");
    Serial.print("Dirección IP asignada: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\nNo se pudo conectar a la red WiFi.");
  }
}

// ---------------------------
// Configuración Inicial (setup)
// ---------------------------
void setup() {
  Serial.begin(9600);
  Serial.println("Iniciando sistema integrado en ESP8266...");

  connectToWifi(); // Intentar conectar al WiFi al iniciar

  // Configuración de pines de los componentes
  pinMode(ledPin, OUTPUT);
  pinMode(fanRelayPin, OUTPUT);
  pinMode(trigPin, OUTPUT);
  pinMode(echoPin, INPUT);
  pinMode(lightSensorPin, INPUT); // El sensor de luz ahora es una entrada digital

  // Estado inicial de los actuadores
  // Los módulos de relé son "Activo en Bajo" (LOW = ON). Los ponemos en HIGH para que estén apagados.
  digitalWrite(fanRelayPin, HIGH); // Apaga el ventilador
  digitalWrite(ledPin, LOW);       // Apaga el LED

  // Inicialización del sensor DHT
  dht.begin();
}

// ---------------------------
// Bucle Principal (loop)
// ---------------------------
void loop() {
  // --- Verificación de Conexión WiFi ---
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("\nConexión WiFi perdida. Intentando reconectar...");
    connectToWifi();
  }

  // --- 1. Control de Actuadores ---
  Serial.println("\n--- Ciclo de Actuadores ---");
  // Encender LED
  Serial.println("Encendiendo LED...");
  digitalWrite(ledPin, HIGH);
  
  // Encender Ventilador (LOW activa el relé)
  Serial.println("Encendiendo Ventilador...");
  digitalWrite(fanRelayPin, LOW);
  delay(5000); // Mantenemos todo encendido por 5 segundos

  // Apagar LED
  Serial.println("Apagando LED...");
  digitalWrite(ledPin, LOW);
  
  // Apagar Ventilador (HIGH desactiva el relé)
  Serial.println("Apagando Ventilador...");
  digitalWrite(fanRelayPin, HIGH);
  delay(2000); // Pausa con todo apagado

  // --- 2. Lectura de Sensores ---
  Serial.println("\n--- Ciclo de Sensores ---");

  // Sensor DHT11 (temperatura y humedad)
  float h = dht.readHumidity();
  float t = dht.readTemperature();
  if (isnan(h) || isnan(t)) {
    Serial.println("Error al leer el sensor DHT11.");
  } else {
    Serial.print("Humedad: ");
    Serial.print(h);
    Serial.print(" %  |  Temperatura: ");
    Serial.print(t);
    Serial.println(" °C");
  }

  // Sensor ultrasónico (distancia)
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);
  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);
  duration = pulseIn(echoPin, HIGH);
  distance = duration * 0.034 / 2;
  Serial.print("Distancia: ");
  Serial.print(distance);
  Serial.println(" cm");

  // Sensor de luz (lectura digital)
  int lightState = digitalRead(lightSensorPin);
  Serial.print("Estado del sensor de luz (Digital): ");
  Serial.println(lightState == HIGH ? "Luz Detectada" : "Oscuridad");

  delay(2000); // Espera 2 segundos antes de repetir el ciclo completo
}