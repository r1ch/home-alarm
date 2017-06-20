const pi = require('./pi')
const Led = require('./led.js')
const EventEmitter = require('events').EventEmitter

const TEST_ON = 50;
const WARN_ON = 50;
const WARN_OFF_SLOW = 1000;
const WARN_OFF_FAST = 300;
var   WARN_OFF = WARN_OFF_SLOW

module.exports = Bell;
function Bell(name, pin,ledOn,ledOff){
	EventEmitter.call(this)
	this.type = "Bell"
	this.name = name;
	this.pin = pin;
	this.ledOn = new Led(ledOn);
	this.ledOff = ledOff && new Led(ledOff);
	this.emits = ["started","stopped","tested","arming"]
	pi.pinMode(pin,pi.OUTPUT);
	this.stop();
}

Bell.prototype.__proto__ = EventEmitter.prototype

Bell.prototype.start = function(suppress){
	if(!suppress) this.emit("started",this.name,Date.now())
	this.ledOff && this.ledOff.off()
	pi.digitalWrite(this.pin,1)
	this.ledOn.on()
}

Bell.prototype.stop = function(suppress){
	if(!suppress) this.emit("stopped",this.name,Date.now())
	this.ledOn.off()
	pi.digitalWrite(this.pin,0)
	this.ledOff && this.ledOff.on()
}

Bell.prototype.test = function(){
	this.short(TEST_ON,"tested")
}

Bell.prototype.short = function(interval,message){
	var _this = this;
	message && this.emit(message,this.name,Date.now())
	setTimeout(function(){_this.stop(true)},interval);
	this.start(true)
}

Bell.prototype.startWarning = function(){	
	var _this = this
	_this.warningInterval = setInterval(function(){
		_this.short(WARN_ON)
	},WARN_ON+WARN_OFF)	
}

Bell.prototype.lastWarning = function(){
	this.clearWarningInterval()
	WARN_OFF = WARN_OFF_FAST;
	this.startWarning()	
}

Bell.prototype.clearWarningInterval = function(){
	this.warningInterval && clearInterval(this.warningInterval);
	this.warningInterval = null;
}

Bell.prototype.stopWarning = function(){
	this.clearWarningInterval();
	this.stop();
	WARN_OFF = WARN_OFF_SLOW;
}
