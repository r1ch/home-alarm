const Message = require('../event-bus/message');
const EventBus = require('../event-bus')
const StateMachine = require('./state-machine.js')
const State = require('./state.js')


const strategyStateMachine = new StateMachine();

const blind = new State('blind')
const standard = new State('standard')
const bedtime = new State('bedtime')

blindConsumer = function(){
	console.log("Ignoring movment")
}

bedtimeConsumer = function(event){
	if(event.detail === "Lounge") this.emit(...Message('disarm'))
	else this.emit(...Message('intruder'))	
}

standardConsumer = function(event){
	this.emit(...Message('intruder'))	
}


blind.addTransition('armed',standard)
blind.addConsumer('movement',blindConsumer)

standard.addTransition('bedtime',bedtime)
standard.addTransition('disarm',blind)
standard.addConsumer('movement',standardConsumer)

bedtime.addConsumer('movement',bedtimeConsumer)
bedtime.addTransition('disarm',blind)

strategyStateMachine.setInitial(blind)

EventBus.register({
	caller:strategyStateMachine,
	provides:['intruder','disarm'],
	needs:{
		armed: strategyStateMachine.eventHandler,
		disarm: strategyStateMachine.eventHandler,
		bedtime: strategyStateMachine.eventHandler,
		movement: strategyStateMachine.eventHandler,
	}
})

module.exports = strategyStateMachine
