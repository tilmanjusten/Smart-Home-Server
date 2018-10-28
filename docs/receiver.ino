/**
 * Receive data via 433.92MHz receiver and print on serial
 * 
 * Dependencies:
 * - RadioHead Library
 */

#include <RH_ASK.h>
#include <SPI.h> // Not actually used but needed to compile

// connect receiver data to RXPIN
RH_ASK driver(2000, 11);

void setup()
{
    Serial.begin(9600); // Debugging only

    if (!driver.init())
    {
        Serial.println("init failed");
    }
    else
    {
        Serial.println("initialized receiver");
    }
}

void loop()
{
    uint8_t buf[16];
    uint8_t buflen = sizeof(buf);

    if (driver.recv(buf, &buflen)) // Non-blocking
    {
        int i;

        // Message with a good checksum received, dump it.
        Serial.println((char *)buf);
    }
}
