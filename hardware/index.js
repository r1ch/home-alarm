const gpio = require('rpi-gpio')
gpio.setMode(gpio.MODE_RPI)

const Sensor = require('./sensor')
const Bell = require('./bell')
const EventBus = require('../event-bus')

const lounge = new Sensor("Lounge", 38)
lounge.registerWith(EventBus);

const entry = new Sensor("Entry", 37)
entry.registerWith(EventBus)

const sounder = new Bell("Sounder", 29)
sounder.registerWith(EventBus)

const bell = new Bell("Bell", 33)
bell.registerWith(EventBus)

module.exports = {
	sensors: [lounge, entry],
	sounder: sounder,
	bell: bell
}

