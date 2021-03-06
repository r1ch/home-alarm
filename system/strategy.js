const Message = require('../event-bus/message');
const EventBus = require('../event-bus')
const StateMachine = require('./state-machine.js')
const State = require('./state.js')


const strategyStateMachine = new StateMachine('strategyState');

const blind = new State('blind')
const standard = new State('standard')
const bedtime = new State('bedtime')

onBlind = function(){
	blind.addTransition('armed',standard)
}

strategyChangeConsumer = function (event) {
	if(event.name === "bedtime"){
		blind.addTransition('armed',bedtime)
	} else if (event.name === "standard"){
                blind.addTransition('armed',standard)
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
blind.addTransition('armed', standard)
blind.addConsumer('bedtime', strategyChangeConsumer)
blind.addConsumer('standard', strategyChangeConsumer)

standard.addTransition('disarm', blind)
standard.addTransition('bedtime', bedtime)
standard.addConsumer('movement', standardConsumer)

bedtime.addTransition('disarm', blind)
bedtime.addTransition('standard', standard)
bedtime.addConsumer('movement', bedtimeConsumer)


strategyStateMachine.setInitial(blind)

EventBus.register({
	caller: strategyStateMachine,
	provides: ['intruder', 'disarm'],
	needs: {
		armed: strategyStateMachine.eventHandler,
		disarm: strategyStateMachine.eventHandler,
		bedtime: strategyStateMachine.eventHandler,
                standard: strategyStateMachine.eventHandler,
		movement: strategyStateMachine.eventHandler,
	}
},()=>{strategyStateMachine.setInitial(blind)})

module.exports = strategyStateMachine
