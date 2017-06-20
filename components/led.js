const pi = require('./pi.js');
const OFFSET = 100;
pi.sn3218Setup(OFFSET);

module.exports = Led;
function Led(pin){
	this.pin = pin + OFFSET;
}

Led.prototype.on = function(){
	pi.analogWrite(this.pin,1);
}

Led.prototype.off = function(){
	pi.analogWrite(this.pin,0);
}

