const assert = require("chai").assert;
const path = require("path");
const sinon = require("sinon");
const EventEmitter = require("events");
const EventBus = require("../event-bus");
const Message = require("../event-bus/message")
let clock;


const gpio = require("rpi-gpio");
gpio.write = sinon.stub();

gpio.reset = ()=>{
	gpio.write.reset()
}

const Hardware = require("../hardware");
Hardware.sounder.start = sinon.stub();
Hardware.sounder.startWarning = sinon.stub();
Hardware.sounder.lastWarning = sinon.stub();
Hardware.sounder.short = sinon.stub();
Hardware.sounder.stop = sinon.stub();
Hardware.bell.start = sinon.stub();
Hardware.bell.stop = sinon.stub();



Hardware.reset = ()=>{
	Hardware.sounder.start.reset()
	Hardware.sounder.startWarning.reset()
	Hardware.sounder.lastWarning.reset()
	Hardware.sounder.short.reset()
	Hardware.sounder.stop.reset()
	Hardware.bell.start.reset()
	Hardware.bell.stop.reset()
}

describe("Home Alarm", function(){
	describe("Event Bus", function(){		
		it("Can register for events",function(done){
			let caller = {
				on: (event,callback)=>{
					assert(event === 'event1',"Event passed")
					done()
				}
			}
			
			EventBus.register({
				caller: caller,
				provides: ['event1']
			})
		})

		it("Can pass on events", function(done){
			let emitter = new EventEmitter();
			let receiver = (event)=>{
				assert(event.name === 'event2',"Event passed")
				done()
			}

			EventBus.register({
				caller: emitter,
				provides: ['event2'],
				needs:{
					event2: receiver
				}
			})
			
			emitter.emit(...Message('event2'))
			
		})


	})

	describe("Components", function(){

		beforeEach(function(done){
			clock = sinon.useFakeTimers();
			done();
		})
		

		afterEach(function(done){
			gpio.reset();
			Hardware.reset();
			clock.restore();
			done();
		})

		it("Can send a warning",function(done){
			const testPin = 29;
			const WARN_ON = 50
			const WARN_OFF_SLOW = 1000;
			const WARN_OFF_FAST = 300;
	
			const Bell = require("../hardware/bell.js");
			var bell = new Bell("Test",testPin);
			
			bell.startWarning()
			//interval of "short" beeps
			clock.tick(WARN_ON+WARN_OFF_SLOW)
			//turned on
			assert(gpio.write.firstCall.calledWith(testPin,1),"turned on the warning")
			clock.tick(WARN_ON)
			assert(gpio.write.secondCall.calledWith(testPin,0),"turned off the warning")
			
			//test 10
			for(var i = 0; i < 3; i++){
				clock.tick(WARN_OFF_SLOW)
				assert(gpio.write.lastCall.calledWith(testPin,1),"turned on again")
				clock.tick(WARN_ON)
				assert(gpio.write.lastCall.calledWith(testPin,0),"turned off again")
			}
			
			bell.lastWarning();
			clock.tick(WARN_OFF_FAST+WARN_ON)
			//last warning
			for(var i = 0; i < 3; i++){
				assert(gpio.write.lastCall.calledWith(testPin,1),"on quick")
				clock.tick(WARN_ON)
				assert(gpio.write.lastCall.calledWith(testPin,0),"off quick")
				clock.tick(WARN_OFF_FAST)
			}
						
			done()
		})


		it("Can connect to a bell",function(done){
			const testPin = 29;
			
			const Bell = require("../hardware/bell.js");
			var bell = new Bell("Test",testPin);			

			bell.start()
			assert(gpio.write.calledOnce,"called to turn on")
			
			bell.stop()
			assert(gpio.write.calledTwice,"called again to turn off")

			done()			
		})

		it("Can connect to a sensor",function(done){
			done()				
		})

		it("Wires up correctly",function(done){
			done()
		})
	

	})//Components

	describe("Strategy state machine",function(){
		let strategyStateMachine
		const strategyStateSpy = sinon.spy()
		const intruderSpy = sinon.spy()
		const injector = new EventEmitter()
		
		before(function(done){
			EventBus.register({
				caller: injector,
				provides : ['movement','disarm','bedtime'],
				needs:{
					strategyState: strategyStateSpy,
					intruder: intruderSpy
				}
			},done)
		})

		afterEach(function(done){
			console.log("--RESET--")
			strategyStateSpy.reset()
			intruderSpy.reset()
			console.log("---DONE---")
			done();
		})
				
		it("ignores movement when blind",function(done){
			done()
		})

	})

	describe("Alarm state machine",function(){
		let alarmStateMachine
		const alarmStateSpy = sinon.spy()
		const armedSpy = sinon.spy()
		const disarmedSpy = sinon.spy()
		const injector = new EventEmitter()

		before(function(done){
			EventBus.register({
				caller: injector,
				provides : ['arm','disarm','intruder','warningTimeout','armingTimeout'],
				needs:{
					alarmState: alarmStateSpy,
					armed : armedSpy,
					disarmed : disarmedSpy
				}
			},done)
		})

		beforeEach(function(done){
			clock = sinon.useFakeTimers();
			done();
		})
		
		afterEach(function(done){
			console.log("--RESET--")
                        injector.emit(...Message('disarm'))
			alarmStateSpy.reset()
			armedSpy.reset()
			disarmedSpy.reset()
			Hardware.reset()
			clock.restore();
			console.log("---DONE---")
			done();
		})

		it("Starts with a quiet state",function(done){
			alarmStateMachine = require('../system/alarm')
			//start quiet
			assert.equal(alarmStateMachine.currentState.name,'quiet',"Starts quiet")				
			assert(armedSpy.notCalled,"No arming signal")
			console.log("E",disarmedSpy.callCount)

			assert(disarmedSpy.calledOnce,"onEntry disarm signal")
			assert(alarmStateSpy.calledOnce,"Emits")
			assert.deepEqual(alarmStateSpy.lastCall.args[0],Message('alarmState','quiet')[1],"Emits quiet message")
				
			//doesn't move for intruder,armingTimeout,guardingTimeout
			injector.emit(...Message('intruder'))
			assert(alarmStateSpy.calledOnce,"Stays quiet for intruder")
			injector.emit(...Message('warningTimeout'))
			assert(alarmStateSpy.calledOnce,"Stays quiet for warningTimeout")
			injector.emit(...Message('armingTimeout'))
			assert(alarmStateSpy.calledOnce,"Stays quiet for armingTimeout")

			//no sounds
			assert(Hardware.bell.stop.calledOnce,"Stops the bell")
			assert(Hardware.sounder.stop.calledOnce,"Stops the sounder")
			assert(Hardware.sounder.short.notCalled,"No sounds (sounder short)")
			assert(Hardware.sounder.start.notCalled,"No sounds (sounder start)")
			assert(Hardware.bell.start.notCalled,"No sounds (bell start)")

			assert.equal(alarmStateMachine.currentState.name,'quiet',"Stays quiet")				

			done()
		})

		
		it("Has a disarmable arming state",function(done){
			assert(alarmStateMachine.currentState.name === 'quiet',"Starts quiet")				
			
			//starts arming
			injector.emit(...Message('arm'))
			assert.deepEqual(alarmStateSpy.lastCall.args[0],Message('alarmState','arming')[1],"Got arming message")
			assert.equal(alarmStateMachine.currentState.name,'arming',"Starts arming")				
			assert(Hardware.sounder.short.calledOnce,"Arming beep")
			//ignore intruder
			injector.emit(...Message('intruder'))
			assert.equal(alarmStateMachine.currentState.name,'arming',"Stays arming")
			//disarm
			injector.emit(...Message('disarm'))
			assert.equal(alarmStateMachine.currentState.name,'quiet',"Disarmed")
			assert.deepEqual(alarmStateSpy.lastCall.args[0],Message('alarmState','quiet')[1],"Got quiet message")
			assert(disarmedSpy.calledOnce,"Disarmed event")
			assert(armedSpy.notCalled,"Not armed")

			done()
		})

		it("automatically arms",function(done){
			const ARMING_PERIOD = 30000
			//start quiet
			assert.equal(alarmStateMachine.currentState.name,'quiet',"Starts quiet")				

                        //starts arm
                        injector.emit(...Message('arm'))
                        assert.equal(alarmStateMachine.currentState.name,'arming',"Starts arming")
                        //up to the wire
			clock.tick(ARMING_PERIOD-1)
                        assert.equal(alarmStateMachine.currentState.name,'arming',"Still arming")
			//over
			clock.tick(1)
		
			//disarm
                        assert.equal(alarmStateMachine.currentState.name,'guarding',"Now guarding")
                        assert.deepEqual(alarmStateSpy.lastCall.args[0],Message('alarmState','guarding')[1],"Got guarding message")
                        assert(armedSpy.calledOnce,"Armed event")
			done()
		})

		it("can be disarmed from guarding",function(done){
			assert.equal(alarmStateMachine.currentState.name,'quiet',"Starts quiet")
			//zero time arm
			injector.emit(...Message('arm'))
			injector.emit(...Message('armingTimeout'))
			assert.equal(alarmStateMachine.currentState.name,'guarding',"Now guarding")
			injector.emit(...Message('disarm'))
			assert.equal(alarmStateMachine.currentState.name,'quiet',"Now quiet")
                        assert.deepEqual(alarmStateSpy.lastCall.args[0],Message('alarmState','quiet')[1],"Got quiet message")
			assert(disarmedSpy.calledOnce,"Disarmed event")

			done()
		})

		it("detects an intruder",function(done){
			const WARNING = 60e3
			const LAST = 15e3
			//starts quiet
                        assert.equal(alarmStateMachine.currentState.name,'quiet',"Starts quiet")
			//zero time arm
			injector.emit(...Message('arm'))
			injector.emit(...Message('armingTimeout'))
			assert.equal(alarmStateMachine.currentState.name,'guarding',"Now guarding")
			//Synthetic intruder
			injector.emit(...Message('intruder'))
			assert.equal(alarmStateMachine.currentState.name,'warning',"Now warning")
			assert(Hardware.sounder.startWarning.calledOnce,"Started warning")
			assert(Hardware.bell.start.notCalled,"No bell")
			clock.tick(WARNING-LAST-1)
			assert(Hardware.sounder.startWarning.calledOnce,"Still warning")
			assert(Hardware.sounder.lastWarning.notCalled,"Not last yet")
			assert(Hardware.bell.start.notCalled,"No bell")
			clock.tick(1)
			assert(Hardware.sounder.lastWarning.calledOnce,"Last warning")
			assert(Hardware.bell.start.notCalled,"No bell")
			clock.tick(LAST-1)
			assert(Hardware.sounder.lastWarning.calledOnce,"Still Last warning")
			assert(Hardware.bell.start.notCalled,"No bell")

				

			done()
		})

		it("can be disarmed when warning",function(done){
			const WARNING = 60e3
			//starts quiet
                        assert.equal(alarmStateMachine.currentState.name,'quiet',"Starts quiet")
			//zero time arm
			injector.emit(...Message('arm'))
			injector.emit(...Message('armingTimeout'))
			assert.equal(alarmStateMachine.currentState.name,'guarding',"Now guarding")
			//Synthetic intruder
			injector.emit(...Message('intruder'))
			assert.equal(alarmStateMachine.currentState.name,'warning',"Now warning")
			assert(Hardware.sounder.startWarning.calledOnce,"Started warning")
			assert(Hardware.bell.start.notCalled,"No bell")
			clock.tick(WARNING-1)
			assert(Hardware.sounder.startWarning.calledOnce,"Still warning")
			assert(Hardware.bell.start.notCalled,"No bell")
			assert(disarmedSpy.notCalled,"Not disarmed yet")
			injector.emit(...Message('disarm'))
			assert.equal(alarmStateMachine.currentState.name,'quiet',"Now quiet")
			assert(disarmedSpy.calledOnce,"Called disarm")		
			done()
		})

		it("sets off the alarm after a timeout",function(done){
			const WARNING = 60e3
			//starts quiet
                        assert.equal(alarmStateMachine.currentState.name,'quiet',"Starts quiet")
			//zero time arm
			injector.emit(...Message('arm'))
			injector.emit(...Message('armingTimeout'))
			assert.equal(alarmStateMachine.currentState.name,'guarding',"Now guarding")
			//Synthetic intruder
			injector.emit(...Message('intruder'))
			assert.equal(alarmStateMachine.currentState.name,'warning',"Now warning")
			assert(Hardware.sounder.startWarning.calledOnce,"Started warning")
			assert(Hardware.bell.start.notCalled,"No bell")
			clock.tick(WARNING-1)
			assert(Hardware.sounder.startWarning.calledOnce,"Still warning")
			assert(Hardware.bell.start.notCalled,"No bell")
			assert.equal(alarmStateMachine.currentState.name,'warning',"Still warning")
			clock.tick(1)
			assert(Hardware.bell.start.calledOnce,"BOOM!")
			assert(Hardware.sounder.start.calledOnce,"BOOM!")
			assert.equal(alarmStateMachine.currentState.name,'sounding',"Now Sounding")

				

			done()
		})

		it("the alarm can be disarmed once sounding",function(done){
			const WARNING = 60e3
			//starts quiet
                        assert.equal(alarmStateMachine.currentState.name,'quiet',"Starts quiet")
			//zero time arm
			injector.emit(...Message('arm'))
			injector.emit(...Message('armingTimeout'))
			injector.emit(...Message('intruder'))
			assert(Hardware.sounder.start.notCalled,"Sounder")
			assert(Hardware.bell.start.notCalled,"Bell")
			injector.emit(...Message('warningTimeout'))
			assert.equal(alarmStateMachine.currentState.name,'sounding',"Now sounding")
			assert(Hardware.sounder.start.calledOnce,"Sounder")
			assert(Hardware.bell.start.calledOnce,"Bell")
			assert(Hardware.sounder.stop.calledOnce,"Sounder previously stopped")
			assert(Hardware.bell.stop.notCalled,"Bell not previously stopped")
			injector.emit(...Message('disarm'))
			assert.equal(alarmStateMachine.currentState.name,'quiet',"Now quiet")
			assert(Hardware.sounder.stop.calledThrice,"Sounder stopped")
			assert(Hardware.bell.stop.calledTwice,"Bell stopped")
			
			done()
		})
	})

})//Home Alarm
