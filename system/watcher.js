const EventEmitter = require('events').EventEmitter;
var instance;

const maxItems = 10;

function Watcher(){
	EventEmitter.call(this);
	this.components = {};
	this.actuals = {};
	this.events = []
	this.armed = false;
	this.state = "Starting"
	this.runner = null;
}

Watcher.prototype.__proto__ = EventEmitter.prototype

Watcher.prototype.addComponent = function(component){
	this.actuals[component.name] = component
	this.components[component.name] = 
		{ name: component.name,
		  type: component.type,
                  events: component.emits?true:false,
                  testable: component.test?true:false
		};
	if(component.emits){
		this.components[component.name].events = [];
		component.emits.forEach((event)=>{
			component.on(event,this.getComponentHandler(component.name,component.type,event))
		})
	}
	if(component.test){
		this.components[component.name].test = ()=>{component.test()}
	}
}

Watcher.prototype.ready = function(){
	this.runner = require('./runner.js')
	this.runner.on('state',this.getStateChangeHandler());
	this.runner.start()
}

Watcher.prototype.getState = function(){
	return this.state
}

Watcher.prototype.getArmed = function(){
	return this.armed
}

Watcher.prototype.disarm = function(){
	this.armed = false;
	this.emit('disarmed');
	this.emit('change');
	return this.armed
}

Watcher.prototype.arm = function(){
	this.armed = true;
	this.emit('armed');
	this.emit('change');
	return this.armed
}

Watcher.prototype.getComponents = function(){
	return this.components
}

Watcher.prototype.getComponent = function(component){
	if(this.components[component]){
		return this.components[component]
	}
}

Watcher.prototype.getActuals = function(){
	return this.actuals
}

Watcher.prototype.getActual = function(component){
	if(this.actuals[component]){
		return this.actuals[component]
	}
}


Watcher.prototype.getEventsForComponent = function(component){
	if(this.components[component] && this.components[component].events){
		return this.components[component].events
	}
}

Watcher.prototype.getEvents = function(){
	return this.events
}

Watcher.prototype.test = function(component){
	if(this.components[component] && this.components[component].test){
		this.components[component].test()
		return true;
	}
	return false;	
}

Watcher.prototype.getStateChangeHandler = function(){
	var _this = this
	return function(state){
		_this.state = state
		let newEvent = {
			event: state,
			time: Date.now()
		}
		_this.addEvent(newEvent);
		_this.emit('change');
	}
}

Watcher.prototype.getComponentHandler = function(component,type,event){
	var _this = this
	return function(reporter,time){
		let newEvent = {
			component:component,
			type:type,
			event: event,
			time: time,
			armed: _this.armed
		}

		if(type == 'Sensor' && _this.armed && event == 'movement'){
			_this.emit('intruder')
		}

		_this.addEventForComponent(newEvent,component);
		_this.emit('change')

	}
}

Watcher.prototype.addEventForComponent = function(event,component){
	this.components[component].events.push(event);
	if(this.components[component].events.length>maxItems) this.components[component].events.shift();
}

Watcher.prototype.addEvent = function(event){
	this.events.push(event);
	if(this.events.length>maxItems) this.events.shift();
}

Watcher.prototype.getShadow = function(){
	return {
		"state":{
			"desired":{
				armed: null
			},
			"reported":{
				armed: this.armed,
				state: this.state,
				components: this.components,
				events: this.events
			}
		}	
	}
}

module.exports = {
  getWatcher: function() {
    return instance || (instance = new Watcher());
  }
};


