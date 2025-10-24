/*
Proyecto: Prueba de funcionamiento del sensor DHT22
Autor: Enrique A Gracian Castro
Dia: 22/09/2025
Descripción:
Código de prueba para leer la temperatura y humedad
del sensor DHT11 y mostrarlas en el monitor serial.
*/

#include "DHT.h" // Biblioteca del sensor DHT
#include <Adafruit_Sensor.h> // Biblioteca universal de Adafruit

// Define el pin donde conectaste el sensor y el tipo de sensor
#define DHTPIN 2 // Pin al que se conecta el cable de datos del sensor.
#define DHTTYPE DHT11 // Define el tipo de sensor: DHT22

// Inicializa el objeto DHT con el pin y tipo de sensor definidos
DHT dht(DHTPIN, DHTTYPE);

/*
Función para inicializar variables y componentes
*/
void setup() {
  // Inicia la comunicación serial a 9600 baudios para ver los datos
  Serial.begin(9600);
  Serial.println("Probando sensor DHT11");

  // Inicia el sensor DHT
  dht.begin();
}

/*
Función que se ejecuta repetidamente
*/
void loop() {
  // Espera 2 segundos entre lecturas para no saturar al sensor
  delay(2000);

  // Lee la temperatura y humedad
  float h = dht.readHumidity();
  float t = dht.readTemperature();

  // Verifica si las lecturas fueron exitosas (no son NaN, "Not a Number")
  if (isnan(h) || isnan(t)) {
    Serial.println(h);
    Serial.println(t);
    Serial.println("Error al leer el sensor DHT");
    return; // Salta el resto del loop y vuelve a empezar
  }

  // Muestra los valores leídos en el monitor serial
  Serial.print("Humedad: ");
  Serial.print(h);
  Serial.print(" %");
  Serial.print("  Temperatura: ");
  Serial.print(t);
  Serial.println(" *C");
}