const EventEmitter = require('events').EventEmitter;

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
		this.emit('state',this._currentState.name)
	}

	getHandler(event){
		var _this = this
		return function(){
			if(null===_this._currentState){
				console.log("Got event ",event," while uninitialised")
			} else if(_this.currentState.transitions[event]){
				console.log(_this._currentState.name,"->",_this._currentState.transitions[event].name,":",event)
				_this._currentState.onExit()
				_this._currentState = _this._currentState.transitions[event]
				_this._currentState.onEntry()
				_this.emit('state',_this._currentState.name)
			} else {
                		console.log(_this._currentState.name,". (",event,")")
        		}
		}
	}

}
