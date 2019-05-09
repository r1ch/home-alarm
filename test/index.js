const assert = require("chai").assert;
const path = require("path");
const sinon = require("sinon");
const gpio = require("rpi-gpio");
const EventEmitter = require("events");
const EventBus = require("../event-bus");
const Message = require("../event-bus/message")
let clock;

const Hardware = require("../hardware");
Hardware.sounder.start = sinon.stub();
Hardware.sounder.stop = sinon.stub();
Hardware.bell.start = sinon.stub();
Hardware.bell.stop = sinon.stub();
Hardware.reset = ()=>{
	Hardware.sounder.start.reset()
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
		it("Can send a warning",function(done){
			done()
		})



		it("Can connect to a bell",function(done){
			done()			
		})

		it("Can connect to a sensor",function(done){
				done()				
		})

		it("Wires up correctly",function(done){
			done()
		})
	

	})//Components

	describe("State machine",function(){
		const alarmStateSpy = sinon.spy()
		before(function(done){
			EventBus.register({
				needs:{
					alarmState: alarmStateSpy
				}
			},done)		
		})

		beforeEach(function(done){
			alarmStateSpy.reset()
			Hardware.reset()
			clock = sinon.useFakeTimers();
			done();
		})
		
		afterEach(function(done){
			clock.restore();
			done();
		})

		it("Has a quiet state",function(done){
			let alarmStateMachine = require("../system/alarm")
			assert.deepEqual(alarmStateSpy.getCall(0).args[0],Message('alarmState','quiet')[1],"Got quiet message")
			assert(Hardware.sounder.start.notCalled,"No sounder")
			assert(Hardware.bell.start.notCalled,"No sounder")
			done()
		})
		
		it("Has a disarmable arming state",function(done){
			let alarmStateMachine = require("../system/alarm")
			done()
		})

		it("automatically arms",function(done){
			done()
		})

		it("can be disarmed from guarding",function(done){
			done()
		})

		it("detects an intruder",function(done){
			done()
		})

		it("can be disarmed when warning",function(done){
			done()
		})

		it("sets off the alarm after a timeout",function(done){
			done()
		})

		it("the alarm can be disarmed once sounding",function(done){
			done()
		})
	})

})//Home Alarm
