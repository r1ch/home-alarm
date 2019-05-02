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


shadow.on('connect', function() {
	shadow.register('Alarm',{},()=>{
		console.log("Connected to Amazon IoT")
	});
});


shadow.on('status', 
    function(thingName, stat, clientToken, stateObject) {
	tryUpdate();
});

shadow.on('delta', 
    function(thingName, stateObject) {
	if(thingName == "Alarm" && stateObject.state && typeof stateObject.state.armed !== 'undefined'){
		if(stateObject.state.armed == true){
			this.emit(...Message('arm','via Amazon'))		
		} else if (stateObject.state.armed == false){
			this.emit(...Message('disarm','via Amazon'))
		}
	}
    });

shadow.on('timeout',
    function(thingName, clientToken) {
	tryUpdate();
});

shadow.on('error',
	function(error){	
	console.log("Error:",Date.now())
});



function queueUpdate(update){
	Q.unshift(update);
	tryUpdate();
}

function tryUpdate(){
	if(Q.length !==0){
		let update  = Q.pop()
		let clientToken = shadow.update('Alarm',update)
		if(clientToken !== null){
			console.log(Date.now(),clientToken)
		} else if(clientToken===null && retry!==null){
				retry = setTimeout(()=>{
					retry = null;
					tryUpdate()
				},100)
		} else {
			Q.push(update)
			console.log("Requeued length now",Q.length)
		}
	}
}

const updateArmedState = ()=>{}
const updateAlarmState = ()=>{}


EventBus.register({
	caller:shadow,
	provides: ['disarm','arm'],
	needs: {
		arm: updateArmedState,
		disarm: updateArmedState,
		stateChange: updateAlarmState,
	}
})
