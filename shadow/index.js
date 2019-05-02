const EventBus = require('../event-bus')
const Message = require('../event-bus/message')
const _ = require("lodash")
const config = require("../config")
var awsIot = require('aws-iot-device-sdk');
var Q = [];
var retry = null;


var shadow = awsIot.thingShadow({
	keyPath: __dirname + config.keyPath,
	certPath: __dirname + config.certPath,
	caPath: __dirname + config.caPath,
	clientId: 'Alarm Master',
	region: config.iotRegion,
	host: config.iotHost
});


shadow.on('connect', function () {
	shadow.register('Alarm', {}, () => {
		console.log("Connected to Amazon IoT")
		queueUpdate({
			state:{
				reported:{
					armed:false
				}
			}
		})
	});
});


shadow.on('status',
	function (thingName, stat, clientToken, stateObject) {
		tryUpdate();
	});

shadow.on('delta',
	function (thingName, stateObject) {
		if (thingName == "Alarm" && stateObject.state) {
			if (stateObject.state.armed == true) {
				this.emit(...Message('arm', 'via Amazon'))
			} else if (stateObject.state.armed == false) {
				this.emit(...Message('disarm', 'via Amazon'))
			} else if (stateObject.state.strategy == 'bedtime'){
				this.emit(...Message('bedtime', 'via Amazon'))
			} else if (stateObject.state.strategy == 'standard'){
				this.emit(...Message('standard', 'via Amazon'))
			}
		}
	});

shadow.on('timeout',
	function (thingName, clientToken) {
		tryUpdate();
	});

shadow.on('error',
	function (error) {
		console.log("Error:", Date.now())
	});



function queueUpdate(update) {
	console.log(update)
	Q.unshift(update);
	tryUpdate();
}

function tryUpdate() {
	if (Q.length !== 0) {
		let update = Q.pop()
		let clientToken = shadow.update('Alarm', update)
		if (clientToken !== null) {
			console.log(Date.now(), clientToken)
		} else if (clientToken === null && retry !== null) {
			retry = setTimeout(() => {
				retry = null;
				tryUpdate()
			}, 100)
		} else {
			Q.push(update)
			console.log("Requeued length now", Q.length)
		}
	}
}

const updateArmedState = (event) => {
	console.log("IoT update for armed event",event)
		queueUpdate({
			state:{
				reported:{
					armed:(event.name === 'armed')
				}
			}
		})
}

const updateAlarmState = (event) => {
	console.log("IoT update for state event",event)
	queueUpdate({
		state:{
			reported:{
				state:event.detail
			}
		}
	})
}

const updateStrategyState = (event) => {
	console.log("IoT update for strategy event",event)
	queueUpdate({
		state:{
			reported:{
				strategy:event.detail
			}
		}
	})
}


EventBus.register({
	caller: shadow,
	provides: ['disarm', 'arm', 'bedtime', 'standard'],
	needs: {
		armed: updateArmedState,
		disarmed: updateArmedState,
		alarmState: updateAlarmState,
		strategyState: updateStrategyState,
	}
})
