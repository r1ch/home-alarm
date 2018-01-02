'use strict'
const EventEmitter = require('events').EventEmitter;
const maxItems = 10;

let instance = null

module.exports = class Watcher extends EventEmitter{
	constructor(){
		super()
		if(!instance){
			instance = this;
			this._components = {};
			this._actuals = {};
			this._events = []
			this._armed = false;
			this._state = "Starting"
			this._runner = null;
		}
		return instance;
	}

	addComponent(component){
		this._actuals[component.name] = component
		this._components[component.name] = 
			{ name: component.name,
			  type: component.type,
                	  events: component.emits?true:false,
                	  testable: component.test?true:false
			};
		if(component.emits){
			this._components[component.name].events = [];
			component.emits.forEach((event)=>{
				component.on(event,this.getComponentHandler(component.name,component.type,event))
			})
		}
		if(component.test){
			this._components[component.name].test = ()=>{component.test()}
		}
	}

	ready(){
		this._runner = require('./runner.js');
		this._runner.on('state',this.getStateChangeHandler());
		this._runner.start();
	}

	get state(){
		return this._state
	}

	get armed(){
		return this._armed;
	}

	disarm(){
		this._armed = false;
		this.emit('disarmed');
		this.emit('change');
		return this._armed;
	}

	arm(){
		this._armed = true;
		this.emit('armed');
		this.emit('change');
		return this._armed;
	}

	get components(){
		return this._components;
	}

	set components(components){
		this._components = components;
	}

	getComponent(component){
		if(this._components[component]){
			return this._components[component]
		}
	}

	get actuals(){
		return this._actuals
	}

	set actuals(actuals){
		this._actuals = actuals
	}

	getActual(component){
		if(this._actuals[component]){
			return this._actuals[component]
		}
	}

	getEventsForComponent(component){
		if(this._components[component] && this._components[component].events){
			return this._components[component].events
		}
	}

	get events(){
		return this._events
	}

	set events(events){
		this._events = events
	}


	test(component){
		if(this._components[component] && this._components[component].test){
			this._components[component].test()
			return true;
		}
		return false;	
	}

	getStateChangeHandler(){
		var _this = this
		return function(state){
			_this._state = state
			let newEvent = {
				event: state,
				time: Date.now()
			}
			_this.addEvent(newEvent);
			_this.emit('change');
		}
	}

	getComponentHandler(component,type,event){
		var _this = this
		return function(reporter,time){
			let newEvent = {
				component:component,
				type:type,
				event: event,
				time: time,
				armed: _this._armed
			}

			if(type == 'Sensor' && _this._armed && event == 'movement'){
				_this.emit('intruder')
			} else if (type == 'Reader' && event == 'card'){
				_this.disarm()
			}
	
			_this.addEventForComponent(newEvent,component);
			_this.emit('change')
	
		}
	}

	addEventForComponent(event,component){
		this._components[component].events.push(event);
		if(this._components[component].events.length>maxItems) this._components[component].events.shift();
	}

	addEvent(event){
		this._events.push(event);
		if(this._events.length>maxItems) this._events.shift();
	}

	get shadow(){
		return {
			"state":{
				"desired":{
					armed: null
				},
				"reported":{
					armed: this._armed,
					state: this._state,
					components: this._components,
					events: this._events
				}
			}	
		}
	}
}
