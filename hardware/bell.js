'use strict'
const pi = require('./pi.js')
const Led = require('./led.js')
const Message  = require('../event-bus/message.js');
const EventEmitter = require('events').EventEmitter

const TEST_ON = 50;
const WARN_ON = 50;
const WARN_OFF_SLOW = 1000;
const WARN_OFF_FAST = 300;
var   WARN_OFF = WARN_OFF_SLOW


module.exports = class Bell extends EventEmitter{

	constructor(name, pin,ledOn,ledOff){
		super()
		this.type = "Bell"
		this.name = name;
		this.pin = pin;
		this.ledOn = new Led(ledOn);
		this.ledOff = ledOff && new Led(ledOff);
		pi.pinMode(pin,pi.OUTPUT);
		this.stop();
	}

	registerWith(eventBus){
		eventBus.register({
			caller:this,
			provides:['sounding','silenced']
		})
	}

	start(suppress){
		if(!suppress) this.emit(...Message('sounding',this.name))
		this.ledOff && this.ledOff.off()
		pi.digitalWrite(this.pin,1)
		this.ledOn.on()
	}

	stop(suppress){
		if(!suppress) this.emit(...Message('silenced',this.name))
		this.ledOn.off()
		pi.digitalWrite(this.pin,0)
		this.ledOff && this.ledOff.on()
	}

	short(interval){
		var _this = this;
		setTimeout(function(){_this.stop(true)},interval);
		this.start(true)
	}

	startWarning(){	
		var _this = this
		_this.warningInterval = setInterval(function(){
			_this.short(WARN_ON)
		},WARN_ON+WARN_OFF)	
	}

	lastWarning(){
		this.clearWarningInterval()
		WARN_OFF = WARN_OFF_FAST;
		this.startWarning()	
	}

	clearWarningInterval(){
		this.warningInterval && clearInterval(this.warningInterval);
		this.warningInterval = null;
	}

	stopWarning(){
		this.clearWarningInterval();
		this.stop();
		WARN_OFF = WARN_OFF_SLOW;
	}
}
