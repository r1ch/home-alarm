const Message = require('../event-bus/message');
const EventBus = require('../event-bus')
const StateMachine = require('./state-machine.js')
const State = require('./state.js')


const strategyStateMachine = new StateMachine('strategyState');

const blind = new State('blind')
const watching = new State('watching')

onBlind = function(){
	watching.addConsumer('movement',standardConsumer)
}

strategyChangeConsumer = function (event) {
	if(event.name === "bedtime"){
		watching.addConsumer('movement',bedtimeConsumer)
	}
}

bedtimeConsumer = function (event) {
	if (event.detail === "Lounge") strategyStateMachine.emit(...Message('disarm','via bedtime'))
	else strategyStateMachine.emit(...Message('intruder'))
}

standardConsumer = function (event) {
	strategyStateMachine.emit(...Message('intruder'))
}

blind.onEntry = onBlind
blind.addTransition('armed', watching)
blind.addConsumer('bedtime', strategyChangeConsumer)

watching.addTransition('disarm', blind)
watching.addConsumer('movement', standardConsumer)


strategyStateMachine.setInitial(blind)

EventBus.register({
	caller: strategyStateMachine,
	provides: ['intruder', 'disarm'],
	needs: {
		armed: strategyStateMachine.eventHandler,
		disarm: strategyStateMachine.eventHandler,
		bedtime: strategyStateMachine.eventHandler,
		movement: strategyStateMachine.eventHandler,
	}
})

module.exports = strategyStateMachine
