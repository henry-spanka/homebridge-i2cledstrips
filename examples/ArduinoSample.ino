/*
 * I2C Sample Code for the homebridge homebridge-i2cledstrips plugin
 * @author Henry Spanka
 * Licensed under the MIT License. A copy is distributed in the root directory of this repository.
 *
 * Data Communication Protocol:
 *   First Byte: Instruction Byte
 *   Second Byte: Value Byte (optional if read)
 *   Third Byte: Value Byte 2 (optional if read)
 *   If second byte is set the value byte will be stored at the specified position
 *   as uint16_t by the Instruction byte.
 *
 *
 * Set the storageSize to the registers you require. Normally this should be 3 for
 * each LED Strip. In this example two LED strips are being configured.
 * Set the I2C_SLAVE_ADDRESS and LED_STRIP PINS in the define section.
 */
#define storageSize 6
#define I2C_SLAVE_ADDRESS 0x2c

#define LED_STRIP_1_VCC 7
#define LED_STRIP_1_RED 6
#define LED_STRIP_1_GREEN 5
#define LED_STRIP_1_BLUE 4
#define LED_STRIP_2_VCC 11
#define LED_STRIP_2_RED 10
#define LED_STRIP_2_GREEN 9
#define LED_STRIP_2_BLUE 8

#include <Wire.h>

typedef struct {
  byte id;
  uint16_t value;
  byte type;
} DataPoint;

volatile DataPoint dataStorage[storageSize];

volatile byte currentAddress;

void setup() {
  Serial.begin(9600); // For Debug Purposes
  Wire.begin(I2C_SLAVE_ADDRESS);
  Wire.onRequest(wireRequestEvent);
  Wire.onReceive(wireReceiveEvent);
  pinMode(LED_BUILTIN, OUTPUT);

  /* Setup LED Strips*/
  pinMode(LED_STRIP_1_VCC, OUTPUT);
  pinMode(LED_STRIP_1_RED, OUTPUT);
  pinMode(LED_STRIP_1_GREEN, OUTPUT);
  pinMode(LED_STRIP_1_BLUE, OUTPUT);
  pinMode(LED_STRIP_2_VCC, OUTPUT);
  pinMode(LED_STRIP_2_RED, OUTPUT);
  pinMode(LED_STRIP_2_GREEN, OUTPUT);
  pinMode(LED_STRIP_2_BLUE, OUTPUT);

  digitalWrite(LED_STRIP_1_VCC, HIGH);
  digitalWrite(LED_STRIP_2_VCC, HIGH);

  /* LED_STRIP_1_RED*/
  dataStorage[0].id = 0x12;
  dataStorage[0].value = 255;
  dataStorage[0].type = 0x11;
  /* LED_STRIP_1_GREEN*/
  dataStorage[1].id = 0x13;
  dataStorage[1].value = 255;
  dataStorage[1].type = 0x11;
  /* LED_STRIP_1_BLUE*/
  dataStorage[2].id = 0x14;
  dataStorage[2].value = 255;
  dataStorage[2].type = 0x11;
  /* LED_STRIP_2_RED*/
  dataStorage[3].id = 0x15;
  dataStorage[3].value = 255;
  dataStorage[3].type = 0x11;
  /* LED_STRIP_2_GREEN*/
  dataStorage[4].id = 0x16;
  dataStorage[4].value = 255;
  dataStorage[4].type = 0x11;
  /* LED_STRIP_2_BLUE*/
  dataStorage[5].id = 0x17;
  dataStorage[5].value = 255;
  dataStorage[5].type = 0x11;

  changeLedStripColors();
}

void loop() {
    //
}

volatile DataPoint* findElement(byte address) {
  for (int i = 0; i < storageSize; i++) {
    if (dataStorage[i].id == address) {
      return &dataStorage[i];
    }
  }

  return NULL;
}

void processInstruction(byte command, int val) {
  volatile DataPoint* element = findElement(command);
  element->value = val;

  if (element->type == 0x11) {
    changeLedStripColors();
  }
}

void wireRequestEvent() {
  volatile DataPoint* element = findElement(currentAddress);

  byte data[2];

  if (element == NULL) {
    data[0] = 0;
    data[1] = 0;
  } else {
    data[0] = (element->value >> 8) & 0xFF;
    data[1] = element->value & 0xFF;
  }

  Wire.write(data, 2);

}

void wireReceiveEvent(int bytes) {

  if (Wire.available()) {
    currentAddress = Wire.read();
  }

  if (bytes == 3) {
    // See: https://thewanderingengineer.com/2015/05/06/sending-16-bit-and-32-bit-numbers-with-arduino-i2c/
    byte a = Wire.read();
    byte b = Wire.read();

    uint16_t value;

    value = a;
    value = (value << 8) | b;

    processInstruction(currentAddress, value);
  }
}

void changeLedStripColors() {
  volatile DataPoint* element;

  element = findElement(0x12);
  analogWrite(LED_STRIP_1_RED, 255 - element->value);

  element = findElement(0x13);
  analogWrite(LED_STRIP_1_GREEN, 255 - element->value);

  element = findElement(0x14);
  analogWrite(LED_STRIP_1_BLUE, 255 - element->value);

  element = findElement(0x15);
  analogWrite(LED_STRIP_2_RED, 255 - element->value);

  element = findElement(0x16);
  analogWrite(LED_STRIP_2_GREEN, 255 - element->value);

  element = findElement(0x17);
  analogWrite(LED_STRIP_2_BLUE, 255 - element->value);
}
