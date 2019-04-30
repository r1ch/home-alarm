module.exports = class EventBus {
	constructor(){
        this._register = [];
    }

    inbound(event){
        if(event  && event.name &&  this._register[event.name]){
            this._register[event.name].forEach(handler=>handler(event));
        } else {
            console.error(event," missing name or has no consumers")
        }
    }

    register(request){
        if(!request.caller){
            console.error("Couldn't register",request)
        }

        request.provides.forEach((event)=>{
            request.caller.on(event,inbound)
        })
        request.needs.keys.forEach((event)=>{
            this._register[event] = this._register[event] || [];
            this._register[event].push(needs[event])
        })
    }

}