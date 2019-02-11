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
		let nextShadow  = Q.pop()
		let update = computeUpdate(nextShadow,currentShadow)
		if(update){
			//console.log(JSON.stringify(update))
			let clientToken = shadow.update('Alarm',update)
			// did it work?
			if(clientToken===null){
				//No
				//console.log("Remote is busy")
				if(retry!==null){
					//console.log("Operation in progress - retry later")
					retry = setTimeout(()=>tryUpdate,1000)
				} else {
					//console.log("Retry queued")	
				}
				Q.push(nextShadow)
				//console.log("Requeued",Q.length)
			} else {
				//console.log("Update succeeded",clientToken)
				currentShadow = _.cloneDeep(nextShadow)
			}
		} else {
			//console.log("Trivial update dropped")
		}
	} else {
		//console.log("Empty Q")
	}	
}

function computeUpdate(nextShadow,currentShadow){
	if(!currentShadow) return nextShadow
	var next = _.cloneDeep(nextShadow)
	var current = _.cloneDeep(currentShadow)
	delete next.version
	delete next.clientToken
	next.state.reported  = recurseUpdate(next.state.reported,current.state.reported)
	return next
}

function recurseUpdate(next,current){
	if(!current || typeof next !== 'object' || Array.isArray(next)) return next
	delete next.test
	for(var property in next){
		if(next.hasOwnProperty(property) && typeof current[property] !== 'undefined'){
			if(_.isEqual(current[property], next[property])){
				delete next[property]
			} else {
				next[property] = recurseUpdate(next[property],current[property])
			}
		}
	}
	return next
}

