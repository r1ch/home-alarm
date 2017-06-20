'use strict'
const pi = require('./pi.js');
const OFFSET = 100;
pi.sn3218Setup(OFFSET);

module.exports = class Led {
	constructor(pin){
		this.pin = pin + OFFSET;
	}

	on(){
		pi.analogWrite(this.pin,1);
	}

	off(){
		pi.analogWrite(this.pin,0);
	}
}

