const Message = require('../event-bus/message');
const EventBus = require('../event-bus')
const StateMachine = require('./state-machine.js')
const State = require('./state.js')


const strategyStateMachine = new StateMachine('strategyState');

const blind = new State('blind')
const standard = new State('standard')
const bedtime = new State('bedtime')

blindConsumer = function () {
	console.log("Ignoring movment")
}

bedtimeConsumer = function (event) {
	if (event.detail === "Lounge") strategyStateMachine.emit(...Message('disarm','via bedtime'))
	else strategyStateMachine.emit(...Message('intruder'))
}

standardConsumer = function (event) {
	strategyStateMachine.emit(...Message('intruder'))
}


blind.addTransition('armed', standard)
blind.addTransition('bedtime', bedtime)
blind.addConsumer('movement', blindConsumer)

standard.addTransition('bedtime', bedtime)
standard.addTransition('disarm', blind)
standard.addConsumer('movement', standardConsumer)

bedtime.addTransition('standard',standard)
bedtime.addTransition('disarm', blind)
bedtime.addConsumer('movement', bedtimeConsumer)


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
