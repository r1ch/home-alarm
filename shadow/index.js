const watcher = require('../system');
const _ = require("lodash")
const config = require("../config")
var awsIot = require('aws-iot-device-sdk');
var Q = [];
var currentShadow;
var clientTokenUpdate;
var retry = null;


var shadow = awsIot.thingShadow({
   keyPath: __dirname + config.keyPath,
  certPath: __dirname + config.certPath,
    caPath: __dirname + config.caPath,
  clientId: 'Alarm Master',
 keepAlive: 60 * 60,
    region: config.iotRegion,
      host: config.iotHost
});


shadow.on('connect', function() {
	shadow.register('Alarm',{},()=>{
		console.log("Connected to Amazon IoT")
		watcher.on('change',()=>{
			let newShadow = watcher.shadow;
			queueUpdate(newShadow);
		})
		currentShadow = watcher.shadow
		clientTokenUpdate = shadow.update('Alarm', currentShadow);
	});
});


shadow.on('status', 
    function(thingName, stat, clientToken, stateObject) {
	clientTokenUpdate = clientToken;
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
	clientTokenUpdate = clientToken;
	tryUpdate();
});

shadow.on('error',
	function(error,b,c,d){
		console.log("Error:",error,b,c,d)
});


function queueUpdate(update){
	Q.unshift(update);
	tryUpdate();
}

function tryUpdate(){
	if(Q.length === 0){
	} else if (null == clientTokenUpdate){
	} else {
		let nextShadow  = Q.pop()
		let update = computeUpdate(nextShadow,currentShadow)
		if(update){
			update.clientToken = clientTokenUpdate
			clientTokenUpdate = shadow.update('Alarm', update);
			if(null == clientTokenUpdate){
				Q.push(nextShadow) 
			} else {
				currentShadow = _.cloneDeep(nextShadow);
			}
		}
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
