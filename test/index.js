
const assert = require("chai").assert;
const path = require("path");
const sinon = require("sinon");
const wpi = require("wiring-pi");
const LED_OFFSET = 100;
var clock;




const pi = {
	setup : sinon.stub(wpi,"setup"),
	sn3218Setup : sinon.stub(wpi,"sn3218Setup"),
	wiringPiISR : sinon.stub(wpi,"wiringPiISR"),
	pinMode : sinon.stub(wpi,"pinMode"),
	digitalWrite: sinon.stub(wpi,"digitalWrite"),
	digitalRead: sinon.stub(wpi,"digitalRead"),
	analogWrite: sinon.stub(wpi,"analogWrite")
}

const watcher = require("../system")		
const Bell = require("../components/bell.js")
const Sensor = require("../components/sensor.js")

const sensor = new Sensor("Sensor",1,1)	
	
const _sounder = new Bell("Sounder",3,3)
const sounder = sinon.stub(_sounder)

const _bell = new Bell("Bell",4,4,5)
const bell = sinon.stub(_bell)

watcher.addComponent(sensor)
watcher.addComponent(sounder)
watcher.addComponent(bell)

pi.reset = function(then){
	pi.setup.reset()
	pi.sn3218Setup.reset()
	pi.wiringPiISR.reset()
	pi.pinMode.reset()
	pi.digitalWrite.reset()
	pi.digitalRead.reset()
	pi.analogWrite.reset()
	return then()
}


describe("Home Alarm", function(){
	describe("Components", function(){
		
		beforeEach(function(done){
			clock = sinon.useFakeTimers();
			pi.reset(done)
		})
		
		afterEach(function(done){
			clock.restore();
			done();
		})


		it("Can turn on an led",function(done){
			const Led = require("../components/led.js")
			const ledPin = 2
			var led = new Led(ledPin);
			
			assert(pi.analogWrite.notCalled,"hasn't turned on the led yet")
			
			led.on()
			
			assert(pi.analogWrite.calledOnce,"turned on once")
			assert(pi.analogWrite.firstCall.calledWith(LED_OFFSET+ledPin,1),"turned on the right led")
			
			led.off()
			
			assert(pi.analogWrite.calledTwice,"off then on")
			assert(pi.analogWrite.secondCall.calledWith(LED_OFFSET+ledPin,0),"turned off the right led")
			
			done()			
		})

		it("Can send a warning",function(done){
			const testPin = 2;
			const ledOn = 3;
			const ledOff = 4;
			const WARN_ON = 50
			const WARN_OFF_SLOW = 1000;
			const WARN_OFF_FAST = 300;
	
			const Bell = require("../components/bell.js");
			var bell = new Bell("Test",testPin,ledOn,ledOff);
			
			bell.startWarning()
			//interval of "short" beeps
			assert(pi.digitalWrite.firstCall.calledWith(testPin,0),"starts off")
			clock.tick(WARN_ON+WARN_OFF_SLOW)
			//turned on
			assert(pi.digitalWrite.secondCall.calledWith(testPin,1),"turned on the warning")
			clock.tick(WARN_ON)
			assert(pi.digitalWrite.thirdCall.calledWith(testPin,0),"turned off the warning")
			
			//test 10
			for(var i = 0; i < 3; i++){
				clock.tick(WARN_OFF_SLOW)
				assert(pi.digitalWrite.lastCall.calledWith(testPin,1),"turned on again")
				clock.tick(WARN_ON)
				assert(pi.digitalWrite.lastCall.calledWith(testPin,0),"turned off again")
			}
			
			bell.lastWarning();
			clock.tick(WARN_OFF_FAST+WARN_ON)
			//last warning
			for(var i = 0; i < 3; i++){
				assert(pi.digitalWrite.lastCall.calledWith(testPin,1),"on quick")
				clock.tick(WARN_ON)
				assert(pi.digitalWrite.lastCall.calledWith(testPin,0),"off quick")
				clock.tick(WARN_OFF_FAST)
			}
						
			done()
			
		})



		it("Can connect to a bell",function(done){
			const testPin = 2;
			const ledOn = 3;
			const ledOff = 4;
			
			const Bell = require("../components/bell.js");
			var bell = new Bell("Test",testPin,ledOn,ledOff);
			
			assert(pi.digitalWrite.calledOnce,"called at startup")
			assert(pi.digitalWrite.firstCall.calledWith(testPin,0),"turned off the right output at startup")
			assert(pi.analogWrite.calledTwice,"led switching")			
			assert(pi.analogWrite.calledWith(LED_OFFSET+ledOn,0),"turned off the right led at startup")
			assert(pi.analogWrite.calledWith(LED_OFFSET+ledOff,1),"turned on the right led at startup")	

			bell.start()
			assert(pi.digitalWrite.calledTwice,"called again to turn on")
			assert(pi.digitalWrite.secondCall.calledWith(testPin,1),"turned on the right output")
			assert(pi.analogWrite.calledWith(LED_OFFSET+ledOn,1),"turned on the right led")
			assert(pi.analogWrite.calledWith(LED_OFFSET+ledOff,0),"turned off the right led")	


			
			bell.stop()
			assert(pi.digitalWrite.calledThrice,"called again to turn off")
			assert(pi.digitalWrite.thirdCall.calledWith(testPin,0),"turned off the right output")

			done()			
		})

		it("Can connect to a sensor",function(done){
			const testPin = 2
			const ledPin = 3
			pi.digitalRead.withArgs(testPin)
				.onFirstCall().returns(0)
				.onSecondCall().returns(1);

			const Sensor = require("../components/sensor.js")
			var sensor = new Sensor("Test",testPin,ledPin);
						
			assert(pi.wiringPiISR.calledOnce,"sets up interrupts")
			var handler = pi.wiringPiISR.firstCall.args[2]										
	
			sensor.on('movement',()=>{
				assert(pi.digitalRead.calledOnce,"checks the input")
				assert(pi.analogWrite.calledOnce,"turns on the led")
				assert(pi.analogWrite.calledWith(LED_OFFSET+ledPin,1),"turns on the right led")
				
				handler()
				
				assert(pi.digitalRead.calledTwice,"checks the input")
				assert(pi.analogWrite.calledTwice,"turns off the led")
				assert(pi.analogWrite.calledWith(LED_OFFSET+ledPin,0),"turns off the led")
				
				done()				

			})
			
			handler()
			
		})

		it("Wires up correctly",function(done){
			const components = require("../components")
			//Set up Lounge:  20, Entry: 26
			assert(pi.pinMode.calledWith(26,wpi.INPUT),"wires up the entry")
			assert(pi.pinMode.calledWith(20,wpi.INPUT),"wires up the lounge")
			//Set up Bell: 13, Sounder: 5
			assert(pi.pinMode.calledWith(13,wpi.OUTPUT),"wires up the bell")
			assert(pi.pinMode.calledWith(5,wpi.OUTPUT),"wires up the sounder")
			done()
		})
	

	})//Components

	describe("State machine",function(){
		
		var semaphore = true;	

		function check(done){
			if(semaphore){
				semaphore = false;
				done()
			} else {
				console.log("Awaiting semaphore")
				setTimeout(()=>{check(done)},500)
			}
		}
		
		beforeEach(function(done){
			clock = sinon.useFakeTimers();
			sounder.short.reset()
			sounder.startWarning.reset()
			bell.short.reset()
			check(done)
		})

		afterEach(function(done){
			semaphore = true;
			clock.restore()
			done();
		})

		it("Has a quiet state",function(done){
			const stateMachine = require("../system/runner.js")
			assert(stateMachine.currentState === null)
					
			//starts quiet
			var quietHandler = (event)=>{
				assert(event === "quiet","starts quiet")
				assert(stateMachine.currentState.name === "quiet","starts quiet")
				
				//insensitive to instruder, disarm, timeup
				stateMachine.removeListener("state",quietHandler)
				
				var badHandler = ()=>{assert(false,"unwanted state transition")}
				stateMachine.on("state",badHandler)
				
				stateMachine.getHandler("intruder")()
				stateMachine.getHandler("disarmed")()
				stateMachine.getHandler("timeup")()

				assert(stateMachine.currentState.name === "quiet","stays quiet")
				assert(sounder.short.notCalled,"no noises")
				
				var armingHandler = (event)=>{
					assert(event === "arming","changes to arming")
					assert(stateMachine.currentState.name === "arming","changes to arming")
					assert(sounder.short.calledOnce,"arming beep")
					stateMachine.removeListener("state",armingHandler)
					done()
				}
				
				stateMachine.removeListener("state",badHandler)
				stateMachine.on("state",armingHandler)
				watcher.arm()		
			}
			stateMachine.on("state",quietHandler)
			stateMachine.start()			
		})
		
		it("Has a disarmable arming state",function(done){
			const stateMachine = require("../system/runner.js")
			
			stateMachine.start()
			watcher.arm()

			assert(stateMachine.currentState.name = "arming","arming after armed")
			assert(sounder.short.calledOnce,"arming beep")
		
			//insensitive to armed, intruder
			stateMachine.getHandler("armed")()
			stateMachine.getHandler("intruder")()

			assert(stateMachine.currentState.name = "arming","still arming")

			//leaves if disarmed
			var backQuietHandler = (event)=>{
				assert(event === "quiet","goes quiet")
				assert(stateMachine.currentState.name = "quiet","goes quiet")
				stateMachine.removeListener("state",backQuietHandler)
				done()
			}

			stateMachine.on("state",backQuietHandler)
			watcher.disarm()
		})

		it("automatically arms",function(done){
			const stateMachine = require("../system/runner.js")
			const ARMING_PERIOD = 30000
			
			stateMachine.start()
			watcher.arm()
			
			assert(stateMachine.currentState.name === "arming","arming state")
			
			var guardingHandler = (event)=>{
				assert(event === "guarding","now guarding")
				assert(stateMachine.currentState.name === "guarding","now guarding")
				stateMachine.removeListener("state",guardingHandler)
				done()
			}
			
			stateMachine.on("state",guardingHandler)
			
			clock.tick(ARMING_PERIOD-1)	
			assert(stateMachine.currentState.name === "arming","still arming")
			clock.tick(1)		

		})

		it("can be disarmed from guarding",function(done){
			const stateMachine = require("../system/runner.js")
			stateMachine.start()
			watcher.arm()
			stateMachine.getHandler("timeup")()
			assert(stateMachine.currentState.name === "guarding","guarding state")

			//insensitive to armed, timeup
			stateMachine.getHandler("armed")()
			stateMachine.getHandler("timeup")()
			assert(stateMachine.currentState.name === "guarding","still guarding state")
			

			var quietHandler = (event)=>{
				assert(event === "quiet","back to quiet")
				assert(stateMachine.currentState.name === "quiet","back to quiet")
				stateMachine.removeListener("state",quietHandler)
				done()
			}

			stateMachine.on("state",quietHandler)
			watcher.disarm()
		})

		it("detects an intruder",function(done){
			const stateMachine = require("../system/runner.js")
			stateMachine.start()
			watcher.arm()
			stateMachine.getHandler("timeup")()
			assert(stateMachine.currentState.name === "guarding","guarding state")
			
			var intruderHandler = (event)=>{
				assert(event === "warning","now warning")
				assert(stateMachine.currentState.name === "warning","now warning")
				assert(sounder.startWarning.calledOnce,"started warning")

				stateMachine.removeListener("state",intruderHandler)
				done()
			}

			stateMachine.on("state",intruderHandler)
			assert(watcher.armed === true,"watcher is armed")
			assert(sensor.type === "Sensor")
			watcher.getComponentHandler(sensor.name,sensor.type,"movement")()			
		})

		it("can be disarmed when warning",function(done){
			const stateMachine = require("../system/runner.js")
			stateMachine.start()
			watcher.arm()
			stateMachine.getHandler("timeup")()
			watcher.getComponentHandler(sensor.name,sensor.type,"movement")()			
			assert(stateMachine.currentState.name === "warning","warning state")

			//insensitive to intruder, armed
			stateMachine.getHandler("armed")()
			stateMachine.getHandler("intruder")()
			
			assert(stateMachine.currentState.name === "warning","warning state")
			
			var disarmHandler = (event)=>{
				
				assert(event === "quiet")
				assert(stateMachine.currentState.name === "quiet")
				stateMachine.removeListener("state",disarmHandler)
				done()
			}
								
			stateMachine.on("state",disarmHandler)
			watcher.disarm()
		})

		it("sets off the alarm after a timeout",function(done){
			const SLOW_WARNING = 45000
			const FINAL_WARNING = 15000
			const stateMachine = require("../system/runner.js")
			stateMachine.start()
			watcher.arm()
			stateMachine.getHandler("timeup")()
			watcher.getComponentHandler(sensor.name,sensor.type,"movement")()
			
			assert(stateMachine.currentState.name === "warning","warning state")
			assert(sounder.startWarning.calledOnce,"started slow warning")
			clock.tick(SLOW_WARNING-1)
			assert(sounder.lastWarning.notCalled,"only slow warning")
			clock.tick(1)
			assert(sounder.lastWarning.calledOnce,"started fast warning")
			clock.tick(FINAL_WARNING-1)
			assert(sounder.stopWarning.calledOnce,"still fast warning")

			var soundingHandler = (event)=>{
				stateMachine.removeListener("state",soundingHandler)

				assert(event === "sounding")
				assert(stateMachine.currentState.name === "sounding","sounding state")
				
				assert(sounder.start.calledOnce,"internal bells")
				assert(bell.start.calledOnce,"external bells")
					
				done()
			}
			
			stateMachine.on("state",soundingHandler)	
			
			clock.tick(1)
			
		})

		it("the alarm can be disarmed once sounding",function(done){
			const stateMachine = require("../system/runner.js")
			stateMachine.start()
			watcher.arm()
			stateMachine.getHandler("timeup")()
			watcher.getComponentHandler(sensor.name,sensor.type,"movement")()
			stateMachine.getHandler("timeup")()
			
			assert(stateMachine.currentState.name === "sounding","sounding state")
			
			//insensitive to armed, timeup and intruder
			stateMachine.getHandler("armed")()
			stateMachine.getHandler("timeup")()
			stateMachine.getHandler("intruder")()
		
			assert(stateMachine.currentState.name === "sounding","still sounding")

			bell.stop.reset()
			sounder.stop.reset()


			var disarmedHandler = (event)=>{				
				assert(event === "quiet","now quiet")
				assert(stateMachine.currentState.name === "quiet","now quiet")
				
				assert(bell.stop.calledTwice,"Externally quiet")
				assert(sounder.stop.calledTwice,"Internally quiet")
				
				stateMachine.removeListener("state",disarmedHandler)
				done()
			}
			stateMachine.on("state",disarmedHandler)
			watcher.disarm()
		})


	})

})//Home Alarm
