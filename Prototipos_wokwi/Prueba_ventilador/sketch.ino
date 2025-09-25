/*
Proyecto: Control de relé con Arduino
Autor: Enrique A Gracian Castro
Día: 25/09/2025
Descripción:
Código para encender un ventilador usando un relé
conectado a un pin digital de Arduino.
(Se uso un led porque no cuenta con un ventilador)
*/

// Define el pin digital al que está conectado el relé
const int fanPin = 7;

/*
Función para inicializar variables y componentes
*/
void setup() {
  // Inicializa el pin del ventilador como una salida
  pinMode(fanPin, OUTPUT);
}

/*
Función que se ejecuta repetidamente
*/
void loop() {
  // Establece el pin del ventilador en HIGH para activar el relé y encenderlo
  // Una señal HIGH en el pin de Arduino envía 5V, energizando la bobina del relé.
  // Esto cierra el interruptor interno del relé, permitiendo el flujo de corriente
  // hacia el ventilador.
  digitalWrite(fanPin, HIGH);

  // El ventilador permanecerá encendido. Este código simple no lo apagará.
  // La función loop() continuará ejecutándose, manteniendo el pin en HIGH.
}