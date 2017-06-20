const EventEmitter = require('events').EventEmitter;

function StateMachine(){
	EventEmitter.call(this);
        this.currentState = null;
	this.initialState = null;
}

StateMachine.prototype.__proto__ = EventEmitter.prototype

StateMachine.prototype.setInitial = function(state){
	this.initialState = state
}

StateMachine.prototype.start = function(){
	this.currentState = this.initialState
	this.emit('state',this.currentState.name)
}

StateMachine.prototype.getHandler = function(event){
	var _this = this
	return function(){
		if(null===_this.currentState){
			console.log("Got event ",event," while uninitialised")
		} else if(_this.currentState.transitions[event]){
			console.log(_this.currentState.name,"->",_this.currentState.transitions[event].name,":",event)
			_this.currentState.onExit()
                	_this.currentState = _this.currentState.transitions[event]
			_this.emit('state',_this.currentState.name)
                	_this.currentState.onEntry()
        	} else {
                	console.log(_this.currentState.name,". (",event,")")
        	}
	}
}


module.exports = StateMachine;
