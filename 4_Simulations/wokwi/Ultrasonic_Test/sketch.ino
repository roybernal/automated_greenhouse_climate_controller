/*
Project: Distance measurement with HC-SR04 ultrasonic sensor
Author: Enrique A Gracian Castro
Day: 25/09/2025
Description:
Code to measure the distance to an object using the
HC-SR04 ultrasonic sensor and display the result on the
serial monitor.
*/

// Defines the pins for the ultrasonic sensor
const int trigPin = 9;
const int echoPin = 10;

// Defines variables for duration and distance
long duration;
int distance;

/*
Function to initialize variables and components
*/
void setup() {
  // Starts serial communication at 9600 baud to see the output
  Serial.begin(9600);

  // Configures the trigPin as OUTPUT and the echoPin as INPUT
  pinMode(trigPin, OUTPUT);
  pinMode(echoPin, INPUT);
}

/*
Function that runs repeatedly
*/
void loop() {
  // Clears the trigPin before sending the pulse
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);

  // Sends a 10 microsecond HIGH pulse to activate the sensor
  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);

  // Reads the duration of the echo pulse. pulseIn() returns the time in microseconds
  duration = pulseIn(echoPin, HIGH);

  // Calculates the distance based on the speed of sound
  // Speed of sound = 343 m/s = 0.0343 cm/microsecond
  // The sound wave travels to the object and back, so we divide the total duration by 2
  distance = duration * 0.034 / 2;

  // Displays the distance on the serial monitor
  Serial.print("Distance: ");
  Serial.print(distance);
  Serial.println(" cm");

  // Waits 100 milliseconds before the next measurement
  delay(100);
}
