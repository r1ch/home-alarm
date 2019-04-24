const watcher = require('../system');
const _ = require("lodash")
const config = require("../config")
var awsIot = require('aws-iot-device-sdk');
var Q = [];
var currentShadow;
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
		watcher.on('change',()=>{
			let newShadow = watcher.shadow;
			//console.log("Got new shadow")
			queueUpdate(newShadow);
		})
		currentShadow = watcher.shadow
		shadow.update('Alarm', currentShadow);
	});
});


shadow.on('status', 
    function(thingName, stat, clientToken, stateObject) {
	//console.log("Status",clientToken)
	tryUpdate();
});

shadow.on('delta', 
    function(thingName, stateObject) {
	if(thingName == "Alarm" && stateObject.state && typeof stateObject.state.armed !== 'undefined'){
		if(stateObject.state.armed == true){
			watcher.arm();
		} else if (stateObject.state.armed == false){
			watcher.disarm();
		}
	}
    });

shadow.on('timeout',
    function(thingName, clientToken) {
	//console.error("Timeout",clientToken)
	tryUpdate();
});

shadow.on('error',
	function(error){	
		console.log("Error:",Date.now())
});



function queueUpdate(update){
	Q.unshift(update);
	//console.log("Queued, now",Q.length)
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

