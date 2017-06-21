const watcher = require('./index.js');
const StateMachine = require('./state-machine.js')
const State = require('./state.js')
const sounder = watcher.getActual("Sounder")
const bell = watcher.getActual("Bell")

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
		this.emit("timeup")
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
		this.emit("timeup")
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
	//bell.start()
	//sounder.start()
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
arming.addTransition('timeup',guarding)
arming.onEntry = onArming
arming.onExit = exArming

guarding.addTransition('disarmed',quiet)
guarding.addTransition('intruder',warning)
guarding.onEntry = onGuarding

warning.addTransition('disarmed',quiet)
warning.addTransition('timeup',sounding)
warning.onEntry = onWarning
warning.onExit = exWarning

sounding.addTransition('disarmed',quiet)
sounding.onEntry = onSounding
sounding.onExit = exSounding

stateMachine.setInitial(quiet)

//register for the right events
//External
watcher.on('armed',stateMachine.getHandler('armed'))
watcher.on('disarmed',stateMachine.getHandler('disarmed'))
watcher.on('intruder',stateMachine.getHandler('intruder'))

//Internal
warning.on('timeup',stateMachine.getHandler('timeup'))
arming.on('timeup',stateMachine.getHandler('timeup'))

module.exports = stateMachine
