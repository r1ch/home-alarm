const Sensor = require('./sensor.js')
const Bell = require('./bell.js')
const Led = require('./led.js')
const Reader = require('./reader.js')

const reader = new Reader();
const lounge = new Sensor("Lounge",20,13)
const entry = new Sensor("Entry",26,14)
const sounder = new Bell("Sounder",5,3)
const bell = new Bell("Bell",13,6,7) 
const power = new Led(17)
const comms = new Led(16)
const warn = new Led(15)

module.exports = {
	sensors: [lounge,entry],
	reader: reader,
	lights: {
		power: power,
		comms: comms,
		warn: warn
	},
	sounder: sounder,
	bell: bell
}
