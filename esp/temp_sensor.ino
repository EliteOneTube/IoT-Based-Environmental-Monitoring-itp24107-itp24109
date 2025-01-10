#include <DHT.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include <WiFi.h>
#include <time.h>
#include <math.h>

#define DHTPIN 4       // Pin connected to the DHT sensor
#define DHTTYPE DHT22  // DHT22 sensor type
#define PINK_LED 16   // GPIO pin for green LED
#define RED_LED 17     // GPIO pin for red LED

// WiFi credentials
const char* ssid = "";
const char* password = "";

// API endpoint
const char* serverUrl = "";

const char* bearerToken = "";

const char* rootCACertificate = R"EOF(
-----BEGIN CERTIFICATE-----
-----END CERTIFICATE-----
)EOF";

const char* ntpServer = "pool.ntp.org";

// DHT sensor instance
DHT dht(DHTPIN, DHTTYPE);

float lastTemperature = NAN;  // Store last temperature
float lastHumidity = NAN;     // Store last humidity

const float TEMP_THRESHOLD = 0.1;  // Define temperature change threshold
const float HUMIDITY_THRESHOLD = 0.1;  // Define humidity change threshold

bool pinkLEDState = LOW;
bool redLEDState = LOW;

void setup() {
  Serial.begin(9600);

  // Initialize DHT sensor
  dht.begin();
  Serial.println("DHT Sensor initialized!");

  // Set up LED pins
  pinMode(PINK_LED, OUTPUT);
  pinMode(RED_LED, OUTPUT);

  configTime(0, 0, ntpServer);

  // Connect to WiFi
  Serial.print("Connecting to WiFi");
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi connected!");
}

void loop() {
  // Wait for 2 seconds between measurements
  delay(2000);

  float currentTemperature = dht.readTemperature();
  float currentHumidity = dht.readHumidity();

  // Check for valid readings
  if (isnan(currentTemperature) || isnan(currentHumidity)) {
    Serial.println("Failed to read from DHT sensor!");
    return;
  }

  bool newPinkLEDState = LOW;
  bool newRedLEDState = LOW;

  // Control LEDs based on rules
  if (currentHumidity >= 50 && currentHumidity <= 60 && currentTemperature >= 20 && currentTemperature <= 22) {
    newPinkLEDState = HIGH;
    newRedLEDState = LOW;
  } else {
    newPinkLEDState = LOW;
    newRedLEDState = HIGH;
  }

  if (newPinkLEDState != pinkLEDState) {
    pinkLEDState = newPinkLEDState;
    digitalWrite(PINK_LED, pinkLEDState);
    if (pinkLEDState == HIGH) {
      Serial.println("Green LED ON: Conditions are normal.");
    } else {
      Serial.println("Green LED OFF.");
    }
  }

  if (newRedLEDState != redLEDState) {
    redLEDState = newRedLEDState;
    digitalWrite(RED_LED, redLEDState);
    if (redLEDState == HIGH) {
      Serial.println("Red LED ON: Conditions are out of range.");
    } else {
      Serial.println("Red LED OFF.");
    }
  }

  // Send data to the server if there is a change
  if (abs(currentTemperature - lastTemperature) >= TEMP_THRESHOLD || 
      abs(currentHumidity - lastHumidity) >= HUMIDITY_THRESHOLD || isnan(lastTemperature) || isnan(lastHumidity)) {
    sendDataToServer(currentTemperature, currentHumidity);
    lastTemperature = currentTemperature;
    lastHumidity = currentHumidity;
  }
}

void sendDataToServer(float temperature, float humidity) {
  if (WiFi.status() == WL_CONNECTED) {
    WiFiClientSecure client;
    client.setCACert(rootCACertificate);

    HTTPClient https;

    time_t now = time(nullptr);

    // Prepare JSON payload
    String payload = "{\"temperature\":" + String(temperature) + 
                   ",\"humidity\":" + String(humidity) + 
                   ",\"timestamp\":\"" + String(now) + "\"}";

    if (https.begin(client, serverUrl)) {  // Use secure client and HTTPS URL
      https.addHeader("Content-Type", "application/json");

      https.addHeader("Authorization", bearerToken);

      // Send POST request
      int httpResponseCode = https.POST(payload);

      if (httpResponseCode > 0) {
        String response = https.getString();
        Serial.print("Server response: ");
        Serial.println(response);
      } else {
        Serial.print("Error sending data: ");
        Serial.println(https.errorToString(httpResponseCode));
      }

      https.end();
    } else {
      Serial.println("Unable to connect to server.");
    }
  } else {
    Serial.println("WiFi not connected!");
  }
}

// Function that gets current epoch time
unsigned long getTime() {
  time_t now;
  struct tm timeinfo;
  if (!getLocalTime(&timeinfo)) {
    //Serial.println("Failed to obtain time");
    return(0);
  }
  time(&now);
  return now;
}
