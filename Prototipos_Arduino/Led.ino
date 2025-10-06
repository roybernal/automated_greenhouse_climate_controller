/*
Proyecto: Prueba de LED
Autor: Enrique A Gracian Castro
Dia: 22/09/2025
Descripción:
Código para verificar que un pin digital del Arduino
funciona correctamente al encender y apagar un LED.
*/

// Define el pin al que se conectará el LED
const int ledPin = 2;

/*
Función para inicializar variables
*/
void setup() {
    // Configura el pin del LED como una SALIDA (OUTPUT)
    pinMode(ledPin, OUTPUT);
}

/*
Función que se ejecuta repetidamente
*/
void loop() {
  // Enciende el LED
  digitalWrite(ledPin, HIGH); 
  delay(1000); // Espera 1 segundo

  // Apaga el LED
  digitalWrite(ledPin, LOW); 
  delay(1000); // Espera 1 segundo
}