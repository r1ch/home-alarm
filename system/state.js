module.exports = class State {
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
	
	addTransition(event){
        this.transitions[event]
	}

}
