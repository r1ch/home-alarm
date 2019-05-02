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

onQuiet = function () {
	console.log("->Quiet", new Date())
	sounder.stop(true);
	bell.stop(true);
	this.emit(...Message('disarmed'))
}

onArming = function () {
	console.log("->Arming", new Date())
	sounder.short(ARMING_BEEP, "arming")
	let self = this
	this.armingTimeout = setTimeout(() => {
		self.emit(...Message('armingTimeout'))
	}, ARMING_PERIOD)
}

exArming = function () {
	console.log("Arming->", new Date())
	this.armingTimeout && clearTimeout(this.armingTimeout)
}

onGuarding = function () {
	console.log("->Guarding", new Date())
	this.emit(...Message('armed'))
}

onWarning = function () {
	console.log("->Warning", new Date())
	sounder.startWarning();
	this.lastWarningTimeout = setTimeout(() => {
		sounder.lastWarning();
	}, WARNING_PERIOD - LAST_WARNING_PERIOD)
	let self = this
	this.warningTimeout = setTimeout(() => {
		self.emit(...Message('warningTimeout'))
	}, WARNING_PERIOD)
}

exWarning = function () {
	console.log("Warning->", new Date())
	this.lastWarningTimeout && clearTimeout(this.lastWarningTimeout)
	this.warningTimeout && clearTimeout(this.warningTimeout)
	sounder.stopWarning();
}

onSounding = function () {
	console.log("->Sounding", new Date())
	bell.start()
	sounder.start()
}

exSounding = function () {
	console.log("Sounding->", new Date())
	sounder.stop()
	bell.stop()
}


const alarmStateMachine = new StateMachine();

const quiet = new State('quiet')
const arming = new State('arming')
const guarding = new State('guarding')
const warning = new State('warning')
const sounding = new State('sounding')


quiet.addTransition('arm', arming)
quiet.onEntry = onQuiet

arming.addTransition('disarm', quiet)
arming.addTransition('armingTimeout', guarding)
arming.onEntry = onArming
arming.onExit = exArming

guarding.addTransition('disarm', quiet)
guarding.addTransition('intruder', warning)
guarding.onEntry = onGuarding

warning.addTransition('disarm', quiet)
warning.addTransition('warningTimeout', sounding)
warning.onEntry = onWarning
warning.onExit = exWarning

sounding.addTransition('disarm', quiet)
sounding.onEntry = onSounding
sounding.onExit = exSounding

alarmStateMachine.setInitial(quiet)

EventBus.register({
	caller: alarmStateMachine,
	provides: ['warningTimeout', 'armingTimeout', 'armed', 'disarmed'],
	needs: {
		warningTimeout: alarmStateMachine.eventHandler,
		armingTimeout: alarmStateMachine.eventHandler,
		arm: alarmStateMachine.eventHandler,
		disarm: alarmStateMachine.eventHandler,
		intruder: alarmStateMachine.eventHandler,
	}
})

module.exports = alarmStateMachine
