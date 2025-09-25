/*
Proyecto: Medición de distancia con sensor ultrasónico HC-SR04
Autor: Enrique A Gracian Castro
Día: 25/09/2025
Descripción:
Código para medir la distancia a un objeto usando el
sensor ultrasónico HC-SR04 y mostrar el resultado en el
monitor serial.
*/

// Define los pines para el sensor ultrasónico
const int trigPin = 9;
const int echoPin = 10;

// Define variables para la duración y la distancia
long duration;
int distance;

/*
Función para inicializar variables y componentes
*/
void setup() {
  // Inicia la comunicación serial a 9600 baudios para ver la salida
  Serial.begin(9600);

  // Configura el trigPin como SALIDA y el echoPin como ENTRADA
  pinMode(trigPin, OUTPUT);
  pinMode(echoPin, INPUT);
}

/*
Función que se ejecuta repetidamente
*/
void loop() {
  // Limpia el trigPin antes de enviar el pulso
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);

  // Envía un pulso HIGH de 10 microsegundos para activar el sensor
  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);

  // Lee la duración del pulso de eco. pulseIn() retorna el tiempo en microsegundos
  duration = pulseIn(echoPin, HIGH);

  // Calcula la distancia basándose en la velocidad del sonido
  // Velocidad del sonido = 343 m/s = 0.0343 cm/microsegundo
  // La onda sonora viaja al objeto y regresa, por lo que dividimos la duración total entre 2
  distance = duration * 0.034 / 2;

  // Muestra la distancia en el monitor serial
  Serial.print("Distancia: ");
  Serial.print(distance);
  Serial.println(" cm");

  // Espera 100 milisegundos antes de la siguiente medición
  delay(100);
}