module.exports = class State {
	constructor(name) {
		this._name = name;
		this.transitions = {}
		this.consumers = {}
		this.onEntry = () => { }
		this.onExit = () => { }
	}

	get name() {
		return this._name
	}

	set name(name) {
		this._name = name
	}

	addTransition(eventName) {
		this.transitions[eventName]
	}

	addConsumer(eventName, consumer) {
		this.consumers[eventName] = consumer
	}

}
