const EventEmitter = require('events').EventEmitter

function State(name){
	EventEmitter.call(this);
        this.name = name;
        this.transitions = {}
        this.onEntry = ()=>{}
	this.onExit = ()=>{}
}

State.prototype.__proto__ = EventEmitter.prototype

State.prototype.addTransition = function(event,mode){
        this.transitions[event] = mode
}

State.prototype.onEntry = function(f){
        this.onEntry = f
}

module.exports = State
