const register = [];

class EventBus {
    constructor() {
    }

    inbound(event) {
        console.log(`Got ${event.name}:${event.detail}:${event.time}`)
        if (event && event.name && register[event.name]) {
            console.log(`Calling ${register[event.name].length} handlers`)
            register[event.name].forEach(handler => handler(event));
        } else if (!event.name) {
            console.error(event, "missing name")
        } else {
            console.warn(event, "has no listeners")
        }
    }

    register(request) {
        if (!request.caller) {
            console.error("Couldn't register", request)
        } else if (!request.caller.on || typeof request.caller.on !== "function") {
            console.error("Caller isn't an EventEmitter")
        } else {
            if (request.provides) {
                request.provides.forEach((event) => {
                    request.caller.on(event, this.inbound)
                })
            }

            if (request.needs) {
                Object.keys(request.needs).forEach((event) => {
                    console.log(`Registering for ${event}`)
                    register[event] = register[event] || [];
                    register[event].push(request.needs[event])
                })
            }

        }

    }

}

module.exports = new EventBus()
