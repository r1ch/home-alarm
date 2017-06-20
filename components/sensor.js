'use strict'
const pi = require('./pi.js');
const Led = require('./led.js');
const EventEmitter  = require('events').EventEmitter;

module.exports = class Sensor extends EventEmitter{
	constructor(name, pin, led){
		super();
		this.type = "Sensor"
		this.pin = pin
		this.led = new Led(led)
		this.name = name
		this.emits = ['movement']
		pi.pinMode(this.pin, pi.INPUT)
		pi.wiringPiISR(this.pin,pi.INT_EDGE_BOTH,this.getHandler())
	}

	test(){
		this.emit('movement',this.name,Date.now())
	}

	getHandler(){
		var _this = this;
		return function(){
			let value = +!pi.digitalRead(_this.pin)
			if(value === 1){
				_this.led.on()
				_this.emit('movement',_this.name,Date.now())
			} else {
				_this.led.off()
				//_this.emit('quiet',_this.name, Date.now())
			}
		}
	}
}
