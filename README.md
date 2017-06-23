# home-alarm
Node.js, Raspberry Pi and AWS IoT to create a PIR based home alarm system

Uses pimoroni's Automation Hat to do the fiddly hardware bit and WiringPi to bring Node to the Pi / GPIO

This project is deliberately missing the config that contains all the AWS passwords + certs needed to run.

To run this on your setup you'd need
Hardware
1 x RaspberryPi 3
1 x Automation HAT
n x PIR sensors (wired into the Automation HAT)
n x bells (internal or external sounders, wired into the Automation HAT)

Config
1 x collection of certs from AWS for an AWS IoT shadow
  (put these in the certs folder)
1 x config file below (put this in the config folder (you can see it references the certs folder)

```
const config = {
        keyPath : "/certs/private.pem.key",
        certPath : "/certs/certificate.pem.crt",
        caPath : "/certs/root-CA.crt",
        iotHost : "xxxxxxxxx.iot.eu-west-1.amazonaws.com",
        iotRegion : "re-region-n",
}
module.exports = config
```
