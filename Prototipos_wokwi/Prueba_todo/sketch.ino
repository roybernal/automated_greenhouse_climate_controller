/*
Proyecto: Sistema de control de sensores y actuadores
Autor: Enrique A Gracian Castro
Día: 25/09/2025
Descripción:
Código combinado para leer datos de sensores (DHT11, ultrasónico, LDR),
controlar un LED y un relé, y mostrar los resultados en el monitor serial.
*/

// Bibliotecas
#include "DHT.h" // Biblioteca del sensor DHT [cite: 19]
#include <Adafruit_Sensor.h> // Biblioteca universal de Adafruit [cite: 19]

// Definición de pines y variables globales
#define DHTPIN 2 // Pin del sensor DHT11 [cite: 20]
#define DHTTYPE DHT11 // Tipo de sensor: DHT11 [cite: 21]
const int ledPin = 13; // Pin para el LED (se cambió de 2 para evitar conflicto) [cite: 2]
const int fanPin = 7; // Pin para el relé/ventilador [cite: 13]
const int sensorPin = A0; // Pin analógico para el sensor de luz (LDR) [cite: 7]
const int trigPin = 9; // Pin del sensor ultrasónico [cite: 30]
const int echoPin = 10; // Pin del sensor ultrasónico [cite: 30]

// Variables para el sensor ultrasónico
long duration; [cite: 31]
int distance; [cite: 31]

// Inicializa el objeto DHT con el pin y tipo de sensor definidos
DHT dht(DHTPIN, DHTTYPE); [cite: 21]

/*
Función para inicializar variables y componentes
*/
void setup() {
  // Inicia la comunicación serial a 9600 baudios para ver los datos [cite: 8, 22, 32]
  Serial.begin(9600);
  Serial.println("Probando sistema integrado...");
  Serial.println("Probando sensor DHT11"); [cite: 23]
  Serial.println("Probando sensor de luz..."); [cite: 9]

  // Configura los pines como entrada o salida
  pinMode(ledPin, OUTPUT); // Pin del LED como salida [cite: 3]
  pinMode(fanPin, OUTPUT); // Pin del ventilador como salida [cite: 14]
  pinMode(trigPin, OUTPUT); // Pin del sensor ultrasónico como salida [cite: 33]
  pinMode(echoPin, INPUT); // Pin del sensor ultrasónico como entrada [cite: 33]

  // Inicia el sensor DHT [cite: 23]
  dht.begin();
}

/*
Función que se ejecuta repetidamente
*/
void loop() {
  // --- Sección del LED (Enciende y apaga) ---
  digitalWrite(ledPin, HIGH); // Enciende el LED [cite: 4]
  delay(1000); // Espera 1 segundo [cite: 5]
  digitalWrite(ledPin, LOW); // Apaga el LED [cite: 5]
  delay(1000); // Espera 1 segundo [cite: 5]

  // --- Sección del ventilador (Activa el relé) ---
  digitalWrite(fanPin, HIGH); // Activa el relé para encender el ventilador [cite: 16]
  // El ventilador permanecerá encendido. [cite: 17, 18]

  // --- Sección del sensor DHT11 ---
  // Espera 2 segundos entre lecturas [cite: 24]
  delay(2000);
  float h = dht.readHumidity(); // Lee la humedad [cite: 25]
  float t = dht.readTemperature(); // Lee la temperatura [cite: 25]

  // Verifica si las lecturas fueron exitosas
  if (isnan(h) || isnan(t)) { [cite: 26]
    Serial.println("Error al leer el sensor DHT"); [cite: 27]
  } else {
    // Muestra los valores leídos [cite: 28]
    Serial.print("Humedad: ");
    Serial.print(h);
    Serial.print(" %");
    Serial.print("  Temperatura: ");
    Serial.print(t);
    Serial.println(" *C");
  }

  // --- Sección del sensor ultrasónico ---
  digitalWrite(trigPin, LOW); // Limpia el pulso [cite: 34]
  delayMicroseconds(2); [cite: 35]
  digitalWrite(trigPin, HIGH); // Envía un pulso de 10 microsegundos [cite: 35]
  delayMicroseconds(10); [cite: 35]
  digitalWrite(trigPin, LOW); [cite: 35]

  // Lee la duración del pulso de eco [cite: 36]
  duration = pulseIn(echoPin, HIGH);

  // Calcula la distancia [cite: 37]
  distance = duration * 0.034 / 2; [cite: 37]

  // Muestra la distancia en el monitor serial [cite: 38]
  Serial.print("Distancia: ");
  Serial.print(distance);
  Serial.println(" cm");

  // --- Sección del sensor de luz (LDR) ---
  int valorLuz = analogRead(sensorPin); // Lee el valor del sensor en el pin analógico A0 [cite: 9]
  Serial.print("Valor del sensor de luz: "); // Muestra el valor [cite: 10]
  Serial.println(valorLuz);
  
  delay(500); // Espera medio segundo antes de la siguiente lectura [cite: 11]
}