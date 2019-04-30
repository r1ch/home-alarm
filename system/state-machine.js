const EventEmitter = require('events').EventEmitter;
const Message =  require('../event-bus/message')

module.exports = class StateMachine extends EventEmitter{
	constructor(){
		super();
        this._currentState = null;
		this._initialState = null;
	}

	set currentState(state){
		this._currentState = state;
	}

	get currentState(){
		return this._currentState;
	}
		
	setInitial(state){
		this._initialState = state
	}

	start(){
		this._currentState = this._initialState
		this.emit(...Message('stateChange',this._currentState.name))
	}

	eventHandler(event){
		var _this = this
		return function(){
			if(null===_this._currentState){
				console.log("Got event ",event.name," while uninitialised")
			} else if(_this.currentState.transitions[event.name]){
				console.log(_this._currentState.name,"->",_this._currentState.transitions[event.name].name,":",event.name)
				_this._currentState.onExit()
				_this._currentState = _this._currentState.transitions[event.name]
				_this._currentState.onEntry()
				this.emit(...Message('stateChange',this._currentState.name))
			} else {
                console.log(_this._currentState.name,". (",event.name,")")
        	}
		}
	}
}