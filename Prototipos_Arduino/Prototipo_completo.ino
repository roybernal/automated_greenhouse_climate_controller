/*
Proyecto: Sistema de Control de Sensores y Actuadores
Autor: Enrique A. Gracián Castro
Fecha: 25/09/2025
Descripción:
Este código integra la lectura de múltiples sensores (DHT11, ultrasónico y LDR),
así como el control de un LED y un relé (ventilador). Los resultados se muestran
en el monitor serial para su supervisión.
*/

// ---------------------------
// Bibliotecas
// ---------------------------
#include "DHT.h"              // Biblioteca para el sensor DHT
#include <Adafruit_Sensor.h>  // Biblioteca universal de Adafruit

// ---------------------------
// Definición de pines
// ---------------------------
#define DHTPIN 2              // Pin del sensor DHT11
#define DHTTYPE DHT11         // Tipo de sensor DHT
const int ledPin = 13;        // Pin del LED (cambiado de 2 para evitar conflicto)
const int fanPin = 7;         // Pin del relé/ventilador
const int sensorPin = A0;     // Pin analógico para el sensor de luz (LDR)
const int trigPin = 8;        // Pin TRIG del sensor ultrasónico
const int echoPin = 9;        // Pin ECHO del sensor ultrasónico

// ---------------------------
// Variables globales
// ---------------------------
long duration;                // Duración del pulso ultrasónico
int distance;                 // Distancia calculada en cm

// Inicialización del objeto DHT
DHT dht(DHTPIN, DHTTYPE); 

// ---------------------------
// Configuración inicial
// ---------------------------
void setup() {
  // Comunicación serial a 9600 baudios
  Serial.begin(9600);
  Serial.println("Iniciando sistema integrado...");
  Serial.println("Comprobando sensores y actuadores...");

  // Configuración de pines
  pinMode(ledPin, OUTPUT);     
  pinMode(fanPin, OUTPUT);     
  pinMode(trigPin, OUTPUT);    
  pinMode(echoPin, INPUT);     

  // Inicialización del sensor DHT
  dht.begin();
}

// ---------------------------
// Bucle principal
// ---------------------------
void loop() {
  // --- LED (parpadeo) ---
  digitalWrite(ledPin, HIGH);  // Enciende LED
  delay(1000);                 
  digitalWrite(ledPin, LOW);   // Apaga LED
  delay(1000);                 

  // --- Ventilador (relé) ---
  digitalWrite(fanPin, HIGH);  // Activa el ventilador

  // --- Sensor DHT11 (temperatura y humedad) ---
  delay(2000); // Intervalo recomendado entre lecturas
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

  // --- Sensor ultrasónico (distancia) ---
  digitalWrite(trigPin, LOW);  
  delayMicroseconds(2); 
  digitalWrite(trigPin, HIGH); 
  delayMicroseconds(10); 
  digitalWrite(trigPin, LOW);  

  duration = pulseIn(echoPin, HIGH);
  distance = duration * 0.034 / 2; // Conversión a centímetros

  Serial.print("Distancia: ");
  Serial.print(distance);
  Serial.println(" cm");

  // --- Sensor de luz (LDR) ---
  int valorLuz = analogRead(sensorPin);
  Serial.print("Intensidad lumínica (valor analógico): ");
  Serial.println(valorLuz);
  
  delay(500); // Pausa antes de la siguiente iteración
}
