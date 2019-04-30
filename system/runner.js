const Hardware = require('../hardware');
const Message = require('../event-bus/message');
const EventBus = require('../event-bus')
const StateMachine = require('./state-machine.js')
const State = require('./state.js')


const sounder = Hardware.sounder
const bell = Hardware.bell

const ARMING_BEEP = 50
const ARMING_PERIOD = 30000
const WARNING_PERIOD = 60000
const LAST_WARNING_PERIOD = 15000

onQuiet = function(){
	console.log("->Quiet",new Date())
	sounder.stop(true);
	bell.stop(true);
}

onArming = function(){
	console.log("->Arming",new Date())
	sounder.short(ARMING_BEEP,"arming")
	this.armingTimeout = setTimeout(()=>{
		this.emit(...Message('armingTimeout'))
	},ARMING_PERIOD)
}

exArming = function(){
	console.log("Arming->",new Date())
	this.armingTimeout && clearTimeout(this.armingTimeout)
}

onGuarding = function(){
	console.log("->Guarding",new Date())
}

onWarning = function(){
	console.log("->Warning",new Date())
	sounder.startWarning();
	this.lastWarningTimeout = setTimeout(()=>{
		sounder.lastWarning();
	},WARNING_PERIOD-LAST_WARNING_PERIOD)
	this.warningTimeout = setTimeout(()=>{
		this.emit(...Message('warningTimeout'))
	},WARNING_PERIOD)
}
	
exWarning = function(){
	console.log("Warning->",new Date())
	this.lastWarningTimeout && clearTimeout(this.lastWarningTimeout)
	this.warningTimeout && clearTimeout(this.warningTimeout)	
	sounder.stopWarning();
}

onSounding = function(){
	console.log("->Sounding",new Date())
	bell.start()
	sounder.start()
}

exSounding = function(){
	console.log("Sounding->",new Date())
	sounder.stop()
	bell.stop()
}


const stateMachine = new StateMachine();

const quiet = new State('quiet')
const arming = new State('arming')
const guarding = new State('guarding')
const warning = new State('warning')
const sounding = new State('sounding')


quiet.addTransition('armed',arming)
quiet.onEntry = onQuiet

arming.addTransition('disarmed',quiet)
arming.addTransition('armingTimeout',guarding)
arming.onEntry = onArming
arming.onExit = exArming

guarding.addTransition('disarmed',quiet)
guarding.addTransition('intruder',warning)
guarding.onEntry = onGuarding

warning.addTransition('disarmed',quiet)
warning.addTransition('warningTimeout',sounding)
warning.onEntry = onWarning
warning.onExit = exWarning

sounding.addTransition('disarmed',quiet)
sounding.onEntry = onSounding
sounding.onExit = exSounding

stateMachine.setInitial(quiet)

EventBus.register({
	caller:this,
	provides:['warningTimeout','armingTimeout'],
	needs:{
		warningTimeout: stateMachine.eventHandler,
		armingTimeout: stateMachine.eventHandler,
		armed: stateMachine.eventHandler,
		disarmed: stateMachine.eventHandler,
		intruder: stateMachine.eventHandler,
	}
})

module.exports = stateMachine
