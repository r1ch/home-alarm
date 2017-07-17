const alarm = require('./components')
const watcher = require('./system')
const server = require('./server')
const shadow = require('./shadow')

process.on('uncaughtException', function (exception) {
	console.log(exception);
	console.log(exception.stack);
});


alarm.sensors.forEach((sensor)=>{
	watcher.addComponent(sensor)
})

watcher.addComponent(alarm.bell)
watcher.addComponent(alarm.sounder)

watcher.ready()


setInternal(shadow.heartbeat,1000*60*60)
