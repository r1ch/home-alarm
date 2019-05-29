const alarm = require('./hardware')
const monitor = require("./monitor")
const shadow = require('./shadow')

let alarmStateMachine
let server

setTimeout(()=>{
	alarmStateMachine = require('./system')
	server = require('./server')
},5000)


process.on('uncaughtException', function (exception) {
	console.log(exception);
	console.log(exception.stack);
});
