const alarm = require('./hardware')
const alarmStateMachine = require('./system')
const shadow = require('./shadow')
//const server = require('./server')

process.on('uncaughtException', function (exception) {
	console.log(exception);
	console.log(exception.stack);
});
