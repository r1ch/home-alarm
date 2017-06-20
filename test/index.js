const expect = require("chai").expect;
const path = require("path");
const sinon = require("sinon");
const wpi = require("wiring-pi");

const pi = {
	setup : sinon.stub(wpi,"setup"),
	sn3218Setup : sinon.stub(wpi,"sn3218Setup"),
	wiringPiISR : sinon.stub(wpi,"wiringPiISR"),
	pinMode : sinon.stub(wpi,"pinMode"),
	digitalWrite: sinon.stub(wpi,"digitalWrite"),
	analogWrite: sinon.stub(wpi,"analogWrite")
}

pi.reset = function(then){
	pi.setup.reset()
	pi.sn3218Setup.reset()
	pi.wiringPiISR.reset()
	pi.pinMode.reset()
	pi.digitalWrite.reset()
	pi.analogWrite.reset()
	return then()
}

describe("Home Alarm", function(){
	describe("Components", function(){
		
		beforeEach(function(done){
			pi.reset(done)
		})

		it("Can turn on an led",function(done){
			const Led = require("../components/led.js")
			var led = new Led(2);
			
			led.on()
			
			expect(pi.analogWrite.calledWith(102,1)).to.be.true
			
			led.off()

			expect(pi.analogWrite.calledWith(102,0)).to.be.true
			
			done()			
		})

		it("Binds to the correct pins",function(done){
			const components = require("../components")
			//Bind to pi and sets up leds
			//Set up Lounge:  20, Entry: 26
			expect(pi.pinMode.calledWith(26,wpi.INPUT)).to.be.true
			expect(pi.pinMode.calledWith(20,wpi.INPUT)).to.be.true
			//Set up Bell: 13, Sounder: 5
			expect(pi.pinMode.calledWith(13,wpi.OUTPUT)).to.be.true
			expect(pi.pinMode.calledWith(5,wpi.OUTPUT)).to.be.true
			done()
		})
	

	})//Components
})//Home Alarm
