/*
Proyecto: Prueba de funcionamiento del sensor de luz (LDR)
Autor: Enrique Alfonso Gracián Castro
Dia: 22/09/2025
Descripción:
Código para leer el valor de un sensor de luz y mostrarlo
en el monitor serial.
*/

// Define el pin analógico al que se conecta el sensor de luz
const int sensorPin = A0; // Pin analógico A0

void setup() {
  // Inicia la comunicación serial a 9600 baudios para ver los datos
  Serial.begin(9600);
  Serial.println("Probando sensor de luz...");
}

void loop() {
  // Lee el valor del sensor en el pin analógico A0
  int valorLuz = analogRead(sensorPin);

  // Muestra el valor leído en el monitor serial
  Serial.print("Valor del sensor de luz: ");
  Serial.println(valorLuz);

  // Espera un momento antes de la siguiente lectura
  delay(500); // Lee los datos cada medio segundo
}