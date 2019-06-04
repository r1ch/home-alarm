const EventBus = require("../event-bus")
const config = require("../config")
const AWS = require ("aws-sdk")

class Monitor {
	constructor(){
		AWS.config.update (
			new AWS.Config({
 				accessKeyId: config.reporterId,
  				secretAccessKey: config.reporterKey,
  				region: "eu-west-1"
			})
		)
		this.cloudwatch = new AWS.CloudWatch ();
		this.eventHandler = eventHandler
	}
}

const eventHandler = function(event){
	let name = event.name + (event.detail ? ':'+event.detail : '') 
	monitor.cloudwatch.putMetricData({
	MetricData : [{
		MetricName : name,
		StorageResolution: 60,
		Timestamp : event.timestamp,
		Value : 1.0
	}],
	Namespace : "Alarm"
	},(err,data)=>{
		if(err) console.error(err)
	})
}

setInterval(()=>{eventHandler({name:"heartbeat"})},60*1000);

const monitor = new Monitor()

EventBus.register({
        needs: {
                alarmState: monitor.eventHandler,
                strategyState: monitor.eventHandler,
                arm: monitor.eventHandler,
                disarm: monitor.eventHandler,
                armed: monitor.eventHandler,
                disarmed: monitor.eventHandler,
                intruder: monitor.eventHandler,
                bedtime: monitor.eventHandler,
		movement: monitor.eventHandler		
        }
})

module.exports = new Monitor()
