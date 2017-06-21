const EventEmitter = require("events").EventEmitter

module.exports = class State extends EventEmitter{
	constructor(name){
		super()
	        this._name = name;
		this.transitions = {}
		this.onEntry = ()=>{}
		this.onExit = ()=>{}
	}
	
	get name(){
		return this._name
	}
	
	set name(name){
		this._name = name
	}
	
	addTransition(event,mode){
        	this.transitions[event] = mode
	}

}
