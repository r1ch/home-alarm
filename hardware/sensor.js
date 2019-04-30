'use strict'
const pi = require('./pi');
const Led = require('./led');
const Message = require('../event-bus/message');
const EventEmitter  = require('events').EventEmitter;


module.exports = class Sensor extends EventEmitter{
	constructor(name, pin, led){
		super();
		this.type = "Sensor";
		this.pin = pin;
		this.led = new Led(led);
		this.name = name;
		pi.pinMode(this.pin, pi.INPUT);
		pi.wiringPiISR(this.pin,pi.INT_EDGE_BOTH,function(){
			let value = +!pi.digitalRead(this.pin);
			if(value === 1){
				this.led.on();
				this.emit(...Message('movement',this.name));
			} else {
				this.led.off();
			}
		})
	}

	registerWith(eventBus){
		eventBus.register({
			caller:this,
			provides:['movement']
		})
	}


}
