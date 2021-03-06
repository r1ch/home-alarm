const EventEmitter = require('events').EventEmitter;
const Message = require('../event-bus/message')
const EventBus = require('../event-bus')

module.exports = class StateMachine extends EventEmitter {
	constructor(name) {
		super();
		this.name = name
		this._currentState = null;
		this._initialState = null;
		this.eventHandler = this.eventHandler.bind(this)
		EventBus.register({
			caller:this,
			provides:[this.name]
		})
	}

	set currentState(state) {
		this._currentState = state;
	}

	get currentState() {
		return this._currentState;
	}

	setInitial(state) {
		this._initialState = state
		this._initialState.onEntry();
		this._currentState = this._initialState
		this.emit(...Message(`${this.name}`, this._currentState.name))
	}

	eventHandler(event) {
		if (null === this._currentState) {
			console.log("Got event ", event.name, " while uninitialised")
		} else if (this._currentState.transitions[event.name]) {
			console.log(this._currentState.name, "->", this._currentState.transitions[event.name].name, ":", event.name)
			this._currentState.onExit()
			this._currentState = this._currentState.transitions[event.name]
			this._currentState.onEntry()
			console.log("state event",...Message(`${this.name}`, this._currentState.name))
			this.emit(...Message(`${this.name}`, this._currentState.name))
		} else if (this._currentState.consumers[event.name]) {
			console.log(this._currentState.name, "consuming:", event.name)
			this._currentState.consumers[event.name](event)
		} else {
			console.log(this._currentState.name, ". (", event.name, ")")
		}
	}
}
