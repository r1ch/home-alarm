'use strict'
const gpio = require('rpi-gpio');

const Message = require('../event-bus/message');
const EventEmitter = require('events').EventEmitter;

const changeRegister = {}
const handleChange = (channel) => {
	if (changeRegister[channel]) {
		changeRegister[channel].emit(...Message('movement', changeRegister[channel].name))
	}
}
gpio.on('change', handleChange)



module.exports = class Sensor extends EventEmitter {
	constructor(name, pin) {
		super();
		this.type = "Sensor";
		this.pin = pin;
		this.name = name;
		gpio.setup(this.pin, gpio.DIR_IN, gpio.EDGE_FALLING, (err, event) => {
			if (err) console.error(`Sensor error ${err}, for ${this.pin}`)
		})
		changeRegister[this.pin] = this
	}

	registerWith(eventBus) {
		eventBus.register({
			caller: this,
			provides: ['movement']
		})
	}


}
